"""
MongoDB-compatible database layer for PostgreSQL (Neon).

Drop-in replacement for Motor's AsyncIOMotorClient.
Translates MongoDB-style queries (find_one, update_one, etc.)
into PostgreSQL JSONB operations via asyncpg.

Usage:
    from database import NeonDatabase
    db = await NeonDatabase.connect(database_url)
    # Now use exactly like MongoDB:
    booking = await db.bookings.find_one({"id": "abc"}, {"_id": 0})
    await db.bookings.insert_one({"id": "abc", "name": "John"})
"""

import asyncpg
import json
import logging
import os
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime, date

logger = logging.getLogger(__name__)


# ── JSON Serialization ──────────────────────────────────────────
def _json_serial(obj):
    """JSON serializer for objects not serializable by default json code."""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


def _dumps(obj):
    return json.dumps(obj, default=_json_serial)


# ── Result Objects (mimic Motor/PyMongo results) ────────────────

class InsertOneResult:
    def __init__(self, inserted_id, acknowledged=True):
        self.inserted_id = inserted_id
        self.acknowledged = acknowledged


class UpdateResult:
    def __init__(self, matched_count=0, modified_count=0, upserted_id=None):
        self.matched_count = matched_count
        self.modified_count = modified_count
        self.upserted_id = upserted_id


class DeleteResult:
    def __init__(self, deleted_count=0):
        self.deleted_count = deleted_count


# ── Query Translation ───────────────────────────────────────────

def _build_where(query: Optional[Dict], params: list) -> str:
    """
    Translate a MongoDB query dict into a PostgreSQL WHERE clause.
    Supports: equality, $in, $nin, $or, $and, $gte, $lte, $gt, $lt,
              $ne, $exists, $regex, $not, $elemMatch (basic), $options.
    """
    if not query:
        return "TRUE"

    clauses = []

    for key, value in query.items():
        if key == "$or":
            or_parts = []
            for sub_query in value:
                sub_where = _build_where(sub_query, params)
                or_parts.append(f"({sub_where})")
            clauses.append(f"({' OR '.join(or_parts)})")

        elif key == "$and":
            and_parts = []
            for sub_query in value:
                sub_where = _build_where(sub_query, params)
                and_parts.append(f"({sub_where})")
            clauses.append(f"({' AND '.join(and_parts)})")

        elif key == "_id":
            # Special handling for MongoDB _id field
            if isinstance(value, dict):
                # Operators on _id
                for op, op_val in value.items():
                    if op == "$ne":
                        # _id != value — skip, not meaningful in our schema
                        pass
            elif value is not None:
                # Exact match on _id (our BIGSERIAL _id)
                params.append(value)
                clauses.append(f"_id = ${len(params)}")

        elif isinstance(value, dict):
            # Operator query
            for op, op_val in value.items():
                if op == "$in":
                    params.append(list(op_val))
                    clauses.append(f"data->>'{key}' = ANY(${len(params)}::text[])")

                elif op == "$nin":
                    params.append(list(op_val))
                    clauses.append(f"NOT (data->>'{key}' = ANY(${len(params)}::text[]))")

                elif op == "$gte":
                    params.append(str(op_val))
                    clauses.append(f"data->>'{key}' >= ${len(params)}")

                elif op == "$lte":
                    params.append(str(op_val))
                    clauses.append(f"data->>'{key}' <= ${len(params)}")

                elif op == "$gt":
                    params.append(str(op_val))
                    clauses.append(f"data->>'{key}' > ${len(params)}")

                elif op == "$lt":
                    params.append(str(op_val))
                    clauses.append(f"data->>'{key}' < ${len(params)}")

                elif op == "$ne":
                    params.append(str(op_val))
                    clauses.append(f"(data->>'{key}' IS NULL OR data->>'{key}' != ${len(params)})")

                elif op == "$exists":
                    if op_val:
                        clauses.append(f"data ? '{key}'")
                    else:
                        clauses.append(f"NOT (data ? '{key}')")

                elif op == "$regex":
                    pattern = op_val
                    # Check for $options (e.g., case insensitive)
                    options = value.get("$options", "")
                    if "i" in options:
                        params.append(pattern)
                        clauses.append(f"data->>'{key}' ~* ${len(params)}")
                    else:
                        params.append(pattern)
                        clauses.append(f"data->>'{key}' ~ ${len(params)}")

                elif op == "$not":
                    # $not wraps another operator
                    if isinstance(op_val, dict):
                        inner_clauses = []
                        for inner_op, inner_val in op_val.items():
                            if inner_op == "$regex":
                                inner_options = op_val.get("$options", "")
                                if "i" in inner_options:
                                    params.append(inner_val)
                                    inner_clauses.append(f"data->>'{key}' !~* ${len(params)}")
                                else:
                                    params.append(inner_val)
                                    inner_clauses.append(f"data->>'{key}' !~ ${len(params)}")
                        if inner_clauses:
                            clauses.append(f"({' AND '.join(inner_clauses)})")

                # Skip $options — handled inline with $regex
                elif op == "$options":
                    pass

        elif isinstance(value, bool):
            # Boolean match — store as JSON boolean
            params.append(_dumps(value))
            clauses.append(f"data->>'{key}' = ${len(params)}")

        elif isinstance(value, (int, float)):
            # Numeric match
            params.append(str(value))
            clauses.append(f"data->>'{key}' = ${len(params)}")

        elif value is None:
            clauses.append(f"(data->>'{key}' IS NULL OR NOT (data ? '{key}'))")

        else:
            # Simple equality
            params.append(str(value))
            clauses.append(f"data->>'{key}' = ${len(params)}")

    return " AND ".join(clauses) if clauses else "TRUE"


def _apply_update(update: Dict) -> Tuple[str, list]:
    """
    Translate a MongoDB update dict ($set, $inc, $unset, $push)
    into a PostgreSQL JSONB update expression.
    Returns (expression, params) where expression is a JSONB transformation.
    """
    parts = []
    params = []

    if "$set" in update:
        for key, val in update["$set"].items():
            # Handle nested dotted keys (e.g., "pricing.totalPrice")
            keys = key.split(".")
            if len(keys) == 1:
                params.append(key)
                params.append(_dumps(val))
                parts.append(f"jsonb_set(COALESCE({{prev}}, '{{}}'), array[${len(params)-1}], ${len(params)}::jsonb, true)")
            else:
                # Nested key path
                path_array = "{" + ",".join(keys) + "}"
                params.append(path_array)
                params.append(_dumps(val))
                parts.append(f"jsonb_set(COALESCE({{prev}}, '{{}}'), ${len(params)-1}::text[], ${len(params)}::jsonb, true)")

    if "$inc" in update:
        for key, val in update["$inc"].items():
            params.append(key)
            params.append(val)
            parts.append(
                f"jsonb_set(COALESCE({{prev}}, '{{}}'), array[${len(params)-1}], "
                f"to_jsonb(COALESCE(({{prev}}->>'{key}')::numeric, 0) + ${len(params)}))"
            )

    if "$unset" in update:
        for key in update["$unset"]:
            parts.append(f"({{prev}} - '{key}')")

    if "$push" in update:
        for key, val in update["$push"].items():
            params.append(_dumps(val))
            parts.append(
                f"jsonb_set(COALESCE({{prev}}, '{{}}'), array['{key}'], "
                f"COALESCE({{prev}}->'{key}', '[]'::jsonb) || ${len(params)}::jsonb)"
            )

    return parts, params


def _compose_update_expr(parts: list) -> str:
    """Chain multiple JSONB transformations, nesting them from inside out."""
    if not parts:
        return "data"
    expr = "data"
    for part in parts:
        expr = part.replace("{prev}", expr)
    return expr


# ── Cursor (mimics Motor cursor with .sort().to_list()) ─────────

class Cursor:
    """Async cursor that mimics Motor's find() cursor."""

    def __init__(self, pool: asyncpg.Pool, table: str, query: Optional[Dict],
                 projection: Optional[Dict] = None):
        self._pool = pool
        self._table = table
        self._query = query
        self._projection = projection
        self._sort_fields: List[Tuple[str, int]] = []
        self._skip_val: Optional[int] = None
        self._limit_val: Optional[int] = None

    def sort(self, key_or_list, direction=None):
        """Add sort. Accepts (field, dir) or [(field, dir), ...]."""
        if isinstance(key_or_list, str):
            self._sort_fields.append((key_or_list, direction or 1))
        elif isinstance(key_or_list, list):
            for item in key_or_list:
                if isinstance(item, tuple):
                    self._sort_fields.append(item)
                else:
                    self._sort_fields.append((item, 1))
        return self

    def skip(self, n: int):
        self._skip_val = n
        return self

    def limit(self, n: int):
        self._limit_val = n
        return self

    async def to_list(self, length: Optional[int] = None):
        params = []
        where = _build_where(self._query, params)

        order_by = ""
        if self._sort_fields:
            parts = []
            for field, direction in self._sort_fields:
                dir_str = "DESC" if direction == -1 else "ASC"
                parts.append(f"data->>'{field}' {dir_str}")
            order_by = f"ORDER BY {', '.join(parts)}"

        limit_clause = ""
        effective_limit = length if length is not None else self._limit_val
        if effective_limit is not None and effective_limit > 0:
            params.append(effective_limit)
            limit_clause = f"LIMIT ${len(params)}"

        offset_clause = ""
        if self._skip_val:
            params.append(self._skip_val)
            offset_clause = f"OFFSET ${len(params)}"

        sql = f"SELECT _id, data FROM {self._table} WHERE {where} {order_by} {limit_clause} {offset_clause}"

        try:
            rows = await self._pool.fetch(sql, *params)
        except asyncpg.UndefinedTableError:
            return []

        results = []
        for row in rows:
            doc = json.loads(row["data"]) if isinstance(row["data"], str) else dict(row["data"])
            # Apply projection
            if self._projection:
                if "_id" in self._projection and self._projection["_id"] == 0:
                    doc.pop("_id", None)
                # If projection has positive fields (besides _id), filter to only those
                positive = {k: v for k, v in self._projection.items() if k != "_id" and v}
                if positive:
                    doc = {k: doc.get(k) for k in positive if k in doc}
            else:
                doc.pop("_id", None)
            results.append(doc)
        return results


# ── Aggregation Cursor ──────────────────────────────────────────

class AggregationCursor:
    """Very basic aggregation pipeline support via in-memory processing.
    Handles the patterns used in BookARide: $match, $group, $sort, $limit.
    """

    def __init__(self, pool: asyncpg.Pool, table: str, pipeline: list):
        self._pool = pool
        self._table = table
        self._pipeline = pipeline

    async def to_list(self, length: Optional[int] = None):
        # Extract $match stage if present
        match_query = None
        remaining_stages = []
        for stage in self._pipeline:
            if "$match" in stage and match_query is None:
                match_query = stage["$match"]
            else:
                remaining_stages.append(stage)

        # Fetch matching documents
        params = []
        where = _build_where(match_query, params)
        sql = f"SELECT data FROM {self._table} WHERE {where}"

        try:
            rows = await self._pool.fetch(sql, *params)
        except asyncpg.UndefinedTableError:
            return []

        docs = [json.loads(r["data"]) if isinstance(r["data"], str) else dict(r["data"]) for r in rows]

        # Process remaining pipeline stages in-memory
        for stage in remaining_stages:
            if "$group" in stage:
                docs = self._apply_group(docs, stage["$group"])
            elif "$sort" in stage:
                docs = self._apply_sort(docs, stage["$sort"])
            elif "$limit" in stage:
                docs = docs[:stage["$limit"]]
            elif "$skip" in stage:
                docs = docs[stage["$skip"]:]
            elif "$project" in stage:
                docs = self._apply_project(docs, stage["$project"])

        if length is not None:
            docs = docs[:length]
        return docs

    @staticmethod
    def _apply_group(docs, group_spec):
        group_key = group_spec.get("_id")
        groups = {}

        for doc in docs:
            # Resolve group key
            if isinstance(group_key, str) and group_key.startswith("$"):
                key_val = doc.get(group_key[1:], None)
            elif isinstance(group_key, dict):
                key_val = tuple(
                    doc.get(v[1:], None) if isinstance(v, str) and v.startswith("$") else v
                    for v in group_key.values()
                )
            else:
                key_val = group_key

            if key_val not in groups:
                groups[key_val] = {"_id": key_val, "_docs": []}
            groups[key_val]["_docs"].append(doc)

        results = []
        for key_val, group_data in groups.items():
            result = {"_id": key_val}
            for field, expr in group_spec.items():
                if field == "_id":
                    continue
                if isinstance(expr, dict):
                    if "$sum" in expr:
                        val = expr["$sum"]
                        if val == 1:
                            result[field] = len(group_data["_docs"])
                        elif isinstance(val, str) and val.startswith("$"):
                            result[field] = sum(
                                d.get(val[1:], 0) for d in group_data["_docs"]
                            )
                    elif "$first" in expr:
                        val = expr["$first"]
                        if isinstance(val, str) and val.startswith("$"):
                            result[field] = group_data["_docs"][0].get(val[1:]) if group_data["_docs"] else None
                    elif "$last" in expr:
                        val = expr["$last"]
                        if isinstance(val, str) and val.startswith("$"):
                            result[field] = group_data["_docs"][-1].get(val[1:]) if group_data["_docs"] else None
                    elif "$max" in expr:
                        val = expr["$max"]
                        if isinstance(val, str) and val.startswith("$"):
                            vals = [d.get(val[1:]) for d in group_data["_docs"] if d.get(val[1:]) is not None]
                            result[field] = max(vals) if vals else None
                    elif "$push" in expr:
                        val = expr["$push"]
                        if isinstance(val, str) and val.startswith("$"):
                            result[field] = [d.get(val[1:]) for d in group_data["_docs"]]
                        elif val == "$$ROOT":
                            result[field] = group_data["_docs"]
            results.append(result)
        return results

    @staticmethod
    def _apply_sort(docs, sort_spec):
        import functools
        def compare(a, b):
            for field, direction in sort_spec.items():
                va = a.get(field)
                vb = b.get(field)
                if va == vb:
                    continue
                if va is None:
                    return 1 * direction
                if vb is None:
                    return -1 * direction
                if va < vb:
                    return -1 * direction
                return 1 * direction
            return 0
        return sorted(docs, key=functools.cmp_to_key(compare))

    @staticmethod
    def _apply_project(docs, project_spec):
        results = []
        for doc in docs:
            new_doc = {}
            for field, val in project_spec.items():
                if val == 0:
                    continue
                elif val == 1:
                    if field in doc:
                        new_doc[field] = doc[field]
                elif isinstance(val, str) and val.startswith("$"):
                    new_doc[field] = doc.get(val[1:])
                else:
                    new_doc[field] = val
            results.append(new_doc)
        return results


# ── Collection (mimics Motor Collection) ────────────────────────

class Collection:
    """
    PostgreSQL-backed collection that accepts MongoDB-style operations.
    Each collection maps to a PostgreSQL table with (id, data JSONB) columns.
    """

    def __init__(self, pool: asyncpg.Pool, table_name: str):
        self._pool = pool
        self._table = table_name
        self._ensured = False

    async def _ensure_table(self):
        """Auto-create table if it doesn't exist."""
        if self._ensured:
            return
        try:
            await self._pool.execute(f"SELECT 1 FROM {self._table} LIMIT 0")
            self._ensured = True
        except asyncpg.UndefinedTableError:
            await self._pool.execute(f"""
                CREATE TABLE IF NOT EXISTS {self._table} (
                    _id BIGSERIAL PRIMARY KEY,
                    id TEXT UNIQUE,
                    data JSONB NOT NULL DEFAULT '{{}}'::jsonb,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            await self._pool.execute(
                f"CREATE INDEX IF NOT EXISTS idx_{self._table}_data ON {self._table} USING GIN (data)"
            )
            self._ensured = True
            logger.info(f"Auto-created table: {self._table}")

    async def find_one(self, query: Optional[Dict] = None, projection: Optional[Dict] = None):
        await self._ensure_table()
        params = []
        where = _build_where(query, params)
        sql = f"SELECT _id, data FROM {self._table} WHERE {where} LIMIT 1"

        try:
            row = await self._pool.fetchrow(sql, *params)
        except asyncpg.UndefinedTableError:
            return None

        if not row:
            return None

        doc = json.loads(row["data"]) if isinstance(row["data"], str) else dict(row["data"])

        if projection:
            if "_id" in projection and projection["_id"] == 0:
                doc.pop("_id", None)
            positive = {k: v for k, v in projection.items() if k != "_id" and v}
            if positive:
                doc = {k: doc.get(k) for k in positive if k in doc}
        else:
            doc.pop("_id", None)

        return doc

    def find(self, query: Optional[Dict] = None, projection: Optional[Dict] = None):
        """Return a Cursor (lazy — executes on .to_list())."""
        # Ensure table exists synchronously via the cursor's to_list
        return _EnsuredCursor(self, query, projection)

    async def insert_one(self, document: Dict) -> InsertOneResult:
        await self._ensure_table()
        doc = dict(document)
        doc.pop("_id", None)  # Remove MongoDB _id if present
        doc_id = doc.get("id")

        data_json = _dumps(doc)

        try:
            row = await self._pool.fetchrow(
                f"INSERT INTO {self._table} (id, data) VALUES ($1, $2::jsonb) RETURNING _id",
                doc_id, data_json
            )
            return InsertOneResult(inserted_id=row["_id"], acknowledged=True)
        except asyncpg.UniqueViolationError:
            # Fallback: generate new id if duplicate
            import uuid
            new_id = str(uuid.uuid4())
            doc["id"] = new_id
            data_json = _dumps(doc)
            row = await self._pool.fetchrow(
                f"INSERT INTO {self._table} (id, data) VALUES ($1, $2::jsonb) RETURNING _id",
                new_id, data_json
            )
            return InsertOneResult(inserted_id=row["_id"], acknowledged=True)

    async def update_one(self, query: Dict, update: Dict, upsert: bool = False) -> UpdateResult:
        await self._ensure_table()
        params = []
        where = _build_where(query, params)

        # Check if this is a full replacement (no $ operators)
        if not any(k.startswith("$") for k in update.keys()):
            # Full document replacement
            doc = dict(update)
            doc.pop("_id", None)
            params_up = [_dumps(doc)]
            sql = f"UPDATE {self._table} SET data = $1::jsonb WHERE {where}"
            # Re-number params
            sql_final, final_params = _renumber_params(sql, params_up + params)
            result = await self._pool.execute(sql_final, *final_params)
        else:
            parts, update_params = _apply_update(update)
            if not parts:
                return UpdateResult(matched_count=0, modified_count=0)

            expr = _compose_update_expr(parts)
            # Build final SQL with properly numbered params
            # update_params come first, then where params
            offset = len(update_params)
            # Renumber where clause params
            adjusted_where = where
            for i in range(len(params), 0, -1):
                adjusted_where = adjusted_where.replace(f"${i}", f"${i + offset}")

            sql = f"UPDATE {self._table} SET data = {expr} WHERE {adjusted_where}"
            all_params = update_params + params
            result = await self._pool.execute(sql, *all_params)

        count = int(result.split()[-1]) if result else 0

        if count == 0 and upsert:
            # Insert new document
            doc = {}
            if "$set" in update:
                doc.update(update["$set"])
            if "$inc" in update:
                doc.update(update["$inc"])
            # Merge query fields into the document
            for k, v in query.items():
                if not k.startswith("$") and not isinstance(v, dict):
                    doc[k] = v
            doc_id = doc.get("id") or doc.get("_id")
            doc.pop("_id", None)
            data_json = _dumps(doc)
            row = await self._pool.fetchrow(
                f"INSERT INTO {self._table} (id, data) VALUES ($1, $2::jsonb) RETURNING _id",
                str(doc_id) if doc_id else None, data_json
            )
            return UpdateResult(matched_count=0, modified_count=0, upserted_id=row["_id"])

        return UpdateResult(matched_count=count, modified_count=count)

    async def update_many(self, query: Dict, update: Dict) -> UpdateResult:
        await self._ensure_table()
        params = []
        where = _build_where(query, params)

        parts, update_params = _apply_update(update)
        if not parts:
            return UpdateResult(matched_count=0, modified_count=0)

        expr = _compose_update_expr(parts)
        offset = len(update_params)
        adjusted_where = where
        for i in range(len(params), 0, -1):
            adjusted_where = adjusted_where.replace(f"${i}", f"${i + offset}")

        sql = f"UPDATE {self._table} SET data = {expr} WHERE {adjusted_where}"
        all_params = update_params + params
        result = await self._pool.execute(sql, *all_params)
        count = int(result.split()[-1]) if result else 0
        return UpdateResult(matched_count=count, modified_count=count)

    async def delete_one(self, query: Dict) -> DeleteResult:
        await self._ensure_table()
        params = []
        where = _build_where(query, params)
        sql = f"DELETE FROM {self._table} WHERE {where}"
        # Use a subquery to limit to 1
        sql = f"DELETE FROM {self._table} WHERE _id = (SELECT _id FROM {self._table} WHERE {where} LIMIT 1)"
        result = await self._pool.execute(sql, *params)
        count = int(result.split()[-1]) if result else 0
        return DeleteResult(deleted_count=count)

    async def delete_many(self, query: Dict) -> DeleteResult:
        await self._ensure_table()
        params = []
        where = _build_where(query, params)
        sql = f"DELETE FROM {self._table} WHERE {where}"
        result = await self._pool.execute(sql, *params)
        count = int(result.split()[-1]) if result else 0
        return DeleteResult(deleted_count=count)

    async def count_documents(self, query: Optional[Dict] = None) -> int:
        await self._ensure_table()
        params = []
        where = _build_where(query, params)
        sql = f"SELECT COUNT(*) FROM {self._table} WHERE {where}"
        try:
            count = await self._pool.fetchval(sql, *params)
        except asyncpg.UndefinedTableError:
            return 0
        return count or 0

    async def find_one_and_update(self, query: Dict, update: Dict,
                                   upsert: bool = False,
                                   return_document=None, **kwargs) -> Optional[Dict]:
        """
        Atomically find and update a document. Returns the updated document.
        `return_document=True` means return the document AFTER update (ReturnDocument.AFTER).
        """
        await self._ensure_table()
        params = []
        where = _build_where(query, params)

        parts, update_params = _apply_update(update)
        if not parts:
            # No update operations — just find
            return await self.find_one(query)

        expr = _compose_update_expr(parts)
        offset = len(update_params)
        adjusted_where = where
        for i in range(len(params), 0, -1):
            adjusted_where = adjusted_where.replace(f"${i}", f"${i + offset}")

        sql = f"""
            UPDATE {self._table}
            SET data = {expr}
            WHERE _id = (SELECT _id FROM {self._table} WHERE {adjusted_where} LIMIT 1)
            RETURNING data
        """
        all_params = update_params + params

        try:
            row = await self._pool.fetchrow(sql, *all_params)
        except asyncpg.UndefinedTableError:
            row = None

        if row:
            doc = json.loads(row["data"]) if isinstance(row["data"], str) else dict(row["data"])
            doc.pop("_id", None)
            return doc

        if upsert:
            doc = {}
            if "$set" in update:
                doc.update(update["$set"])
            if "$inc" in update:
                doc.update(update["$inc"])
            for k, v in query.items():
                if not k.startswith("$") and not isinstance(v, dict):
                    doc[k] = v
            doc.pop("_id", None)
            doc_id = doc.get("id") or doc.get("_id")
            data_json = _dumps(doc)
            await self._pool.execute(
                f"INSERT INTO {self._table} (id, data) VALUES ($1, $2::jsonb)",
                str(doc_id) if doc_id else None, data_json
            )
            return doc

        return None

    def aggregate(self, pipeline: list):
        """Return an AggregationCursor for the given pipeline."""
        return AggregationCursor(self._pool, self._table, pipeline)

    async def create_index(self, keys, **kwargs):
        """Create an index. For JSONB fields, creates expression indexes."""
        await self._ensure_table()
        try:
            if isinstance(keys, str):
                idx_name = f"idx_{self._table}_{keys}"
                await self._pool.execute(
                    f"CREATE INDEX IF NOT EXISTS {idx_name} ON {self._table} ((data->>'{keys}'))"
                )
            elif isinstance(keys, list):
                parts = []
                name_parts = []
                for item in keys:
                    if isinstance(item, tuple):
                        field, direction = item
                        dir_str = "DESC" if direction == -1 else "ASC"
                        parts.append(f"(data->>'{field}') {dir_str}")
                        name_parts.append(field)
                    else:
                        parts.append(f"(data->>'{item}')")
                        name_parts.append(item)
                idx_name = f"idx_{self._table}_{'_'.join(name_parts)}"
                await self._pool.execute(
                    f"CREATE INDEX IF NOT EXISTS {idx_name} ON {self._table} ({', '.join(parts)})"
                )
        except Exception as e:
            logger.warning(f"Index creation warning for {self._table}: {e}")

    async def index_information(self):
        """Return index info (for admin cockpit health check)."""
        rows = await self._pool.fetch(
            "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = $1",
            self._table
        )
        return {row["indexname"]: {"key": row["indexdef"]} for row in rows}

    async def replace_one(self, query: Dict, replacement: Dict, upsert: bool = False) -> UpdateResult:
        """Replace entire document matching query."""
        await self._ensure_table()
        doc = dict(replacement)
        doc.pop("_id", None)

        params = []
        where = _build_where(query, params)
        data_json = _dumps(doc)

        sql = f"UPDATE {self._table} SET data = $1::jsonb, id = $2 WHERE {_offset_params(where, 2)}"
        all_params = [data_json, doc.get("id")] + params
        result = await self._pool.execute(sql, *all_params)
        count = int(result.split()[-1]) if result else 0

        if count == 0 and upsert:
            doc_id = doc.get("id")
            await self._pool.execute(
                f"INSERT INTO {self._table} (id, data) VALUES ($1, $2::jsonb)",
                doc_id, data_json
            )
            return UpdateResult(matched_count=0, modified_count=0, upserted_id=doc_id)

        return UpdateResult(matched_count=count, modified_count=count)


def _offset_params(where_clause: str, offset: int) -> str:
    """Offset all $N parameter references in a WHERE clause."""
    import re
    def replacer(m):
        n = int(m.group(1))
        return f"${n + offset}"
    return re.sub(r'\$(\d+)', replacer, where_clause)


def _renumber_params(sql: str, params: list) -> tuple:
    """Renumber params to be sequential starting from $1."""
    # This is already handled by the params list ordering
    return sql, params


class _EnsuredCursor(Cursor):
    """Cursor that ensures the table exists before executing."""

    def __init__(self, collection: Collection, query, projection):
        super().__init__(collection._pool, collection._table, query, projection)
        self._collection = collection

    async def to_list(self, length=None):
        await self._collection._ensure_table()
        return await super().to_list(length)


# ── Database (mimics Motor Database) ────────────────────────────

class NeonDatabase:
    """
    PostgreSQL database that mimics Motor's AsyncIOMotorDatabase.

    Usage:
        db = await NeonDatabase.connect("postgresql://...")
        booking = await db.bookings.find_one({"id": "abc"})
    """

    def __init__(self, pool: asyncpg.Pool):
        self._pool = pool
        self._collections: Dict[str, Collection] = {}

    @classmethod
    async def connect(cls, database_url: str, **kwargs) -> "NeonDatabase":
        """Create a connection pool and return a NeonDatabase instance."""
        pool = await asyncpg.create_pool(
            database_url,
            min_size=kwargs.get("min_size", 5),
            max_size=kwargs.get("max_size", 20),
            command_timeout=kwargs.get("command_timeout", 30),
        )
        logger.info("Connected to Neon PostgreSQL")
        return cls(pool)

    def __getattr__(self, name: str) -> Collection:
        """Access collection by attribute: db.bookings, db.drivers, etc."""
        if name.startswith("_"):
            raise AttributeError(name)
        if name not in self._collections:
            self._collections[name] = Collection(self._pool, name)
        return self._collections[name]

    def __getitem__(self, name: str) -> Collection:
        """Access collection by subscript: db["bookings"]."""
        if name not in self._collections:
            self._collections[name] = Collection(self._pool, name)
        return self._collections[name]

    async def command(self, cmd: str):
        """Handle MongoDB-style commands like db.command('ping')."""
        if cmd == "ping":
            await self._pool.execute("SELECT 1")
            return {"ok": 1}
        elif cmd == "serverStatus":
            return {
                "ok": 1,
                "connections": {"current": self._pool.get_size(), "available": self._pool.get_max_size()},
            }
        elif cmd == "dbStats":
            rows = await self._pool.fetch(
                "SELECT relname, n_live_tup FROM pg_stat_user_tables"
            )
            return {"ok": 1, "collections": len(rows), "tables": {r["relname"]: r["n_live_tup"] for r in rows}}
        return {"ok": 0}

    async def list_collection_names(self) -> List[str]:
        rows = await self._pool.fetch(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
        )
        return [r["tablename"] for r in rows]

    async def close(self):
        """Close the connection pool."""
        await self._pool.close()

    @property
    def pool(self) -> asyncpg.Pool:
        return self._pool
