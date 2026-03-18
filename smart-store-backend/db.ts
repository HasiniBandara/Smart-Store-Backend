import * as pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// We extract the Pool constructor from the namespace.
// Because we use the namespace import (* as pg), TS can usually
// map the types from @types/pg much better.
const { Pool } = pg;

const { DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT } = process.env;

if (!DB_USER || !DB_HOST || !DB_NAME || !DB_PASSWORD || !DB_PORT) {
  throw new Error('Missing required environment variables!');
}

const port = parseInt(DB_PORT, 10);
if (isNaN(port)) {
  throw new Error('DB_PORT must be a valid number');
}

// Inference happens here.
// If 'Pool' is correctly resolved, this is no longer "unsafe".
const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PASSWORD,
  port,
});

export default pool;
