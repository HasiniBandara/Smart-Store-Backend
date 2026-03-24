import { Injectable } from '@nestjs/common';
import { Pool, PoolConfig } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class DatabaseService {
  private pool: Pool;

  constructor() {
    const { DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT } = process.env;

    if (!DB_USER || !DB_HOST || !DB_NAME || !DB_PASSWORD || !DB_PORT) {
      throw new Error('Missing required environment variables!');
    }

    const port = parseInt(DB_PORT, 10);
    if (isNaN(port)) {
      throw new Error('DB_PORT must be a valid number');
    }

    const config: PoolConfig = {
      user: DB_USER,
      host: DB_HOST,
      database: DB_NAME,
      password: DB_PASSWORD,
      port,
    };

    this.pool = new Pool(config);
  }

  async query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }

  async end() {
    await this.pool.end();
  }
}