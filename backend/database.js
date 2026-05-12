const useOnlineDB = process.env.USE_ONLINE_DB === 'true';
const dbUrl = process.env.DATABASE_URL;

let db;

if (useOnlineDB && dbUrl) {
  console.log('Connecting to PostgreSQL database...');
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  pool
    .query('SELECT 1')
    .then(() => console.log('Connected to PostgreSQL database'))
    .catch(err => console.error('PostgreSQL connection error:', err.message));

  db = {
    get: (sql, params) =>
      new Promise((resolve, reject) => {
        pool.query(sql, params, (err, result) => {
          if (err) reject(err);
          resolve(result.rows[0]);
        });
      }),
    all: (sql, params) =>
      new Promise((resolve, reject) => {
        pool.query(sql, params, (err, result) => {
          if (err) reject(err);
          resolve(result.rows);
        });
      }),
    run: (sql, params) =>
      new Promise((resolve, reject) => {
        pool.query(sql, params, function (err) {
          if (err) reject(err);
          resolve({
            lastID: this?.rowCount || 1,
            changes: this?.rowCount || 1,
          });
        });
      }),
  };
} else {
  console.log('Using local SQLite database...');
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = path.resolve(__dirname, 'database.sqlite');

  const sqliteDb = new sqlite3.Database(dbPath, err => {
    if (err) {
      console.error('Error opening database', err.message);
    } else {
      console.log('Connected to local SQLite database.');
    }
  });

  sqliteDb.serialize(() => {
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
      )
    `);
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        text TEXT,
        completed BOOLEAN DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);
  });

  db = {
    get: (sql, params) =>
      new Promise((resolve, reject) => {
        sqliteDb.get(sql, params, (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      }),
    all: (sql, params) =>
      new Promise((resolve, reject) => {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        });
      }),
    run: (sql, params) =>
      new Promise((resolve, reject) => {
        sqliteDb.run(sql, params, function (err) {
          if (err) reject(err);
          resolve({ lastID: this.lastID, changes: this.changes });
        });
      }),
  };
}

module.exports = db;
