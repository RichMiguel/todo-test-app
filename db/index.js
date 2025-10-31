import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';

let db;
let connection;

export async function initDatabase() {
  if (!connection) {
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    db = drizzle(connection, { schema, mode: 'default' });
  }
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}