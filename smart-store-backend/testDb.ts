// testDb.ts
import pool from './db';

const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected! Current time:', result.rows[0].now);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('❌ Database connection error:', err.message);
    } else {
      console.error('❌ Unexpected error', err);
    }
  } finally {
    await pool.end();
  }
};

testConnection();
