const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const useOnlineDB = process.env.USE_ONLINE_DB === 'true';
const dbUrl = process.env.DATABASE_URL;

let db;

if (useOnlineDB && dbUrl) {
  console.log('Connecting to online SQLite database...');
  db = new sqlite3.Database(dbUrl, err => {
    if (err) {
      console.error('Error connecting to online database:', err.message);
    } else {
      console.log('Connected to online SQLite database.');
    }
  });
} else {
  console.log('Using local SQLite database...');
  const dbPath = path.resolve(__dirname, 'database.sqlite');
  db = new sqlite3.Database(dbPath, err => {
    if (err) {
      console.error('Error opening database', err.message);
    } else {
      console.log('Connected to local SQLite database.');
    }
  });
}

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      text TEXT,
      completed BOOLEAN DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
});

module.exports = db;
