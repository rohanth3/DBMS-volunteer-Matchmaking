// ============================================================================
// DBMS Level 3 Project: NGO Volunteer Matchmaking System
// Team: Rishi (PES1UG24AM224) & Rohanth (PES1UG24AM227)
// File: lib/db/index.js
// Production Dual Database Engine: MySQL 8.0 Primary with ACID Transactions
// ============================================================================

import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let mysqlPool = null;
let sqliteInstance = null;
let activeEngine = null; // 'mysql' | 'sqlite'

/**
 * Initialize and retrieve MySQL 8.0 connection pool
 */
export function getMySQLPool() {
  if (mysqlPool) return mysqlPool;

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'ngo_volunteer_db';

  try {
    mysqlPool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true
    });
    return mysqlPool;
  } catch (err) {
    console.error('[MySQL Pool Creation Error]:', err.message);
    throw err;
  }
}

/**
 * Access fallback SQLite database if MySQL server is unreachable
 */
export function getSQLiteInstance() {
  if (sqliteInstance) return sqliteInstance;

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'ngo_volunteer.db');
  sqliteInstance = new Database(dbPath);
  sqliteInstance.pragma('journal_mode = WAL');
  sqliteInstance.pragma('foreign_keys = ON');

  return sqliteInstance;
}

export const getDatabase = getSQLiteInstance;

/**
 * Determine active database engine
 */
export async function getActiveEngine() {
  if (activeEngine) return activeEngine;

  const preferred = (process.env.DB_DIALECT || 'mysql').toLowerCase();
  if (preferred === 'mysql') {
    try {
      const pool = getMySQLPool();
      const [rows] = await pool.query('SELECT 1 as test');
      if (rows && rows[0]?.test === 1) {
        activeEngine = 'mysql';
        return 'mysql';
      }
    } catch (err) {
      console.warn('[DB Notice] MySQL not directly accessible, falling back to SQLite:', err.message);
    }
  }

  activeEngine = 'sqlite';
  return 'sqlite';
}

/**
 * Execute parameterized SELECT query returning array of rows
 */
export async function query(sql, params = []) {
  const engine = await getActiveEngine();

  if (engine === 'mysql') {
    try {
      const pool = getMySQLPool();
      const [rows] = await pool.query(sql, params);
      return rows;
    } catch (err) {
      console.error('[MySQL Query Error]:', err.message, 'SQL:', sql);
      throw err;
    }
  } else {
    try {
      const db = getSQLiteInstance();
      const stmt = db.prepare(sql);
      return stmt.all(...params);
    } catch (err) {
      console.error('[SQLite Query Error]:', err.message, 'SQL:', sql);
      throw err;
    }
  }
}

/**
 * Execute parameterized query returning single matching row
 */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows && rows.length > 0 ? rows[0] : null;
}

/**
 * Execute INSERT, UPDATE, or DELETE query
 */
export async function execute(sql, params = []) {
  const engine = await getActiveEngine();

  if (engine === 'mysql') {
    try {
      const pool = getMySQLPool();
      const [result] = await pool.execute(sql, params);
      return {
        changes: result.affectedRows,
        lastInsertRowid: result.insertId,
        raw: result
      };
    } catch (err) {
      console.error('[MySQL Execute Error]:', err.message, 'SQL:', sql);
      throw err;
    }
  } else {
    try {
      const db = getSQLiteInstance();
      const stmt = db.prepare(sql);
      const res = stmt.run(...params);
      return {
        changes: res.changes,
        lastInsertRowid: res.lastInsertRowid
      };
    } catch (err) {
      console.error('[SQLite Execute Error]:', err.message, 'SQL:', sql);
      throw err;
    }
  }
}

/**
 * Execute within an ACID Transaction
 */
export async function transaction(callback) {
  const engine = await getActiveEngine();

  if (engine === 'mysql') {
    const pool = getMySQLPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await callback(conn);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } else {
    const db = getSQLiteInstance();
    db.exec('BEGIN TRANSACTION');
    try {
      const result = await callback(db);
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
}

/**
 * Execute MySQL Stored Procedure
 */
export async function callProcedure(procedureName, params = []) {
  const engine = await getActiveEngine();
  if (engine === 'mysql') {
    const pool = getMySQLPool();
    const placeholders = params.map(() => '?').join(',');
    const [rows] = await pool.query(`CALL ${procedureName}(${placeholders})`, params);
    return rows;
  } else {
    throw new Error(`Stored procedure ${procedureName} is only supported on MySQL.`);
  }
}
