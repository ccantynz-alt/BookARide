/**
 * Neon PostgreSQL connection for Vercel serverless functions.
 * Uses @neondatabase/serverless (HTTP-based, no TCP pool needed).
 *
 * Connection: DATABASE_URL env var (same Neon string used by the Python backend).
 *
 * Schema: Every table has (id TEXT UNIQUE, data JSONB, created_at TIMESTAMPTZ).
 * The Python NeonDatabase layer inserts as: INSERT INTO table (id, data) VALUES ($1, $2::jsonb)
 * where id = doc.id and data = full JSON document. We must match this exactly.
 */
const { neon } = require('@neondatabase/serverless');

let _sql = null;

function getDb() {
  if (!_sql) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _sql = neon(databaseUrl);
  }
  return _sql;
}

/**
 * Build WHERE clause from a filter object.
 * Routes "id" queries to the indexed id column (not JSONB scan).
 * All other fields query data->>'field'.
 */
function buildWhere(filter, paramOffset = 0) {
  const entries = Object.entries(filter || {});
  if (entries.length === 0) return { clause: 'TRUE', values: [] };

  const conditions = [];
  const values = [];

  for (const [key, value] of entries) {
    const paramIdx = paramOffset + values.length + 1;
    if (key === 'id') {
      // Use the indexed id TEXT column directly
      conditions.push(`id = $${paramIdx}`);
      values.push(String(value));
    } else if (key === 'session_id' || key === 'booking_id') {
      // Common indexed extracted fields — still in JSONB for our schema
      conditions.push(`data->>'${key}' = $${paramIdx}`);
      values.push(String(value));
    } else {
      conditions.push(`data->>'${key}' = $${paramIdx}`);
      values.push(String(value));
    }
  }

  return { clause: conditions.join(' AND '), values };
}

/**
 * Find one document matching filter. Returns the data JSONB or null.
 */
async function findOne(collection, filter) {
  const sql = getDb();
  const { clause, values } = buildWhere(filter);
  const rows = await sql(
    `SELECT data FROM ${collection} WHERE ${clause} LIMIT 1`,
    values
  );
  return rows.length > 0 ? rows[0].data : null;
}

/**
 * Find multiple documents. Returns array of data JSONB objects.
 */
async function findMany(collection, filter = {}, { limit = 100, sort, offset = 0 } = {}) {
  const sql = getDb();
  const { clause, values } = buildWhere(filter);

  let query = `SELECT data FROM ${collection} WHERE ${clause}`;

  if (sort) {
    const [sortKey, sortDir] = Object.entries(sort)[0];
    // Sort on created_at column if sorting by createdAt (indexed)
    if (sortKey === 'createdAt' || sortKey === 'created_at') {
      query += ` ORDER BY created_at ${sortDir === -1 ? 'DESC' : 'ASC'}`;
    } else {
      query += ` ORDER BY data->>'${sortKey}' ${sortDir === -1 ? 'DESC' : 'ASC'}`;
    }
  } else {
    query += ' ORDER BY created_at DESC';
  }

  if (offset > 0) query += ` OFFSET ${offset}`;
  query += ` LIMIT ${limit}`;

  const rows = await sql(query, values);
  return rows.map(r => r.data);
}

/**
 * Count documents matching filter.
 */
async function countDocuments(collection, filter = {}) {
  const sql = getDb();
  const { clause, values } = buildWhere(filter);
  const rows = await sql(
    `SELECT COUNT(*) as cnt FROM ${collection} WHERE ${clause}`,
    values
  );
  return parseInt(rows[0]?.cnt || '0', 10);
}

/**
 * Insert one document. Sets both the indexed id column and the data JSONB column.
 * Matches the Python layer: INSERT INTO table (id, data) VALUES ($1, $2::jsonb)
 *
 * Returns RETURNING id (not _id) — _id may not exist on all tables but `id` is
 * guaranteed by the schema (id TEXT UNIQUE NOT NULL).
 */
async function insertOne(collection, document) {
  const sql = getDb();
  const docId = document.id || null;
  if (!docId) {
    throw new Error(`insertOne(${collection}): document.id is required`);
  }
  try {
    const result = await sql(
      `INSERT INTO ${collection} (id, data) VALUES ($1, $2::jsonb) RETURNING id`,
      [docId, JSON.stringify(document)]
    );
    return { acknowledged: result.length > 0, insertedId: docId };
  } catch (err) {
    console.error(`CRITICAL: insertOne(${collection}) failed for id=${docId}: ${err.message}`);
    throw err;
  }
}

/**
 * Update one document. Merges $set fields into the JSONB data column.
 * Returns the actual matched count from PostgreSQL — not a hardcoded 1.
 */
async function updateOne(collection, filter, update) {
  const sql = getDb();
  const setData = update.$set || update;
  const { clause, values } = buildWhere(filter);
  const paramIdx = values.length + 1;

  try {
    // Use RETURNING id to get the actual rows updated, so we know if there was a match
    const result = await sql(
      `UPDATE ${collection} SET data = data || $${paramIdx}::jsonb WHERE ${clause} RETURNING id`,
      [...values, JSON.stringify(setData)]
    );
    return {
      acknowledged: true,
      matchedCount: result.length,
      modifiedCount: result.length,
    };
  } catch (err) {
    console.error(`CRITICAL: updateOne(${collection}) failed: ${err.message}`);
    throw err;
  }
}

/**
 * Delete one document matching filter. Returns deleteResult.
 */
async function deleteOne(collection, filter) {
  const sql = getDb();
  const { clause, values } = buildWhere(filter);
  await sql(
    `DELETE FROM ${collection} WHERE ${clause}`,
    values
  );
  return { acknowledged: true, deletedCount: 1 };
}

/**
 * Run a raw SQL query (for complex operations not covered by helpers).
 */
async function rawQuery(queryStr, params = []) {
  const sql = getDb();
  return await sql(queryStr, params);
}

module.exports = { getDb, findOne, findMany, countDocuments, insertOne, updateOne, deleteOne, rawQuery };
