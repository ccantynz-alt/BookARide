/**
 * Neon PostgreSQL connection for Vercel serverless functions.
 * Uses @neondatabase/serverless which is designed for edge/serverless.
 *
 * Connection: DATABASE_URL env var (same one used by the Python backend).
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
 * Query the JSONB data column from a collection (table).
 * Our schema stores documents as JSONB in a `data` column, matching
 * the NeonDatabase compatibility layer in backend/database.py.
 */
async function findOne(collection, filter) {
  const sql = getDb();
  const conditions = Object.entries(filter)
    .map(([key, value], i) => `data->>'${key}' = $${i + 1}`)
    .join(' AND ');
  const values = Object.values(filter).map(String);

  const rows = await sql(
    `SELECT data FROM ${collection} WHERE ${conditions} LIMIT 1`,
    values
  );
  return rows.length > 0 ? rows[0].data : null;
}

async function findMany(collection, filter = {}, { limit = 100, sort } = {}) {
  const sql = getDb();
  const entries = Object.entries(filter);

  let query = `SELECT data FROM ${collection}`;
  const values = [];

  if (entries.length > 0) {
    const conditions = entries
      .map(([key, value], i) => `data->>'${key}' = $${i + 1}`)
      .join(' AND ');
    values.push(...entries.map(([, v]) => String(v)));
    query += ` WHERE ${conditions}`;
  }

  if (sort) {
    const [sortKey, sortDir] = Object.entries(sort)[0];
    query += ` ORDER BY data->>'${sortKey}' ${sortDir === -1 ? 'DESC' : 'ASC'}`;
  }

  query += ` LIMIT ${limit}`;

  const rows = await sql(query, values);
  return rows.map(r => r.data);
}

async function insertOne(collection, document) {
  const sql = getDb();
  const result = await sql(
    `INSERT INTO ${collection} (data) VALUES ($1::jsonb) RETURNING data`,
    [JSON.stringify(document)]
  );
  return { acknowledged: true, insertedId: document.id };
}

async function updateOne(collection, filter, update) {
  const sql = getDb();
  const setData = update.$set || update;
  const conditions = Object.entries(filter)
    .map(([key, value], i) => `data->>'${key}' = $${i + 1}`)
    .join(' AND ');
  const filterValues = Object.values(filter).map(String);

  // Build JSONB merge
  const paramIndex = filterValues.length + 1;
  const result = await sql(
    `UPDATE ${collection} SET data = data || $${paramIndex}::jsonb WHERE ${conditions}`,
    [...filterValues, JSON.stringify(setData)]
  );
  return { acknowledged: true, matchedCount: result.length !== undefined ? 1 : 0 };
}

module.exports = { getDb, findOne, findMany, insertOne, updateOne };
