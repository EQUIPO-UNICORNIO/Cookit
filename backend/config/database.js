const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'cookit.db');
let db = null;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }
  try { db.run('PRAGMA journal_mode=WAL;'); } catch (e) {}
  createTables(db);
  await seedDevUser(db);
  saveDb();
  return db;
}

async function seedDevUser(d) {
  const existing = await queryOne('SELECT id FROM users WHERE email = ?', ['aronets2004@gmail.com']);
  if (!existing) {
    const hashed = await bcrypt.hash('Cookit2026', 10);
    d.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', ['Dev CookIt', 'aronets2004@gmail.com', hashed]);
    saveDb();
    console.log('→ Dev user seeded: aronets2004@gmail.com / Cookit2026');
  }
}

function createTables(d) {
  d.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, avatar TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  d.run(`CREATE TABLE IF NOT EXISTS pantry_items (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, name TEXT NOT NULL, category TEXT DEFAULT 'Otros', quantity TEXT DEFAULT '1', unit TEXT DEFAULT 'unidad', expiry_date TEXT, notes TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))`);
  d.run(`CREATE TABLE IF NOT EXISTS shopping_items (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, name TEXT NOT NULL, category TEXT DEFAULT 'Otros', quantity TEXT DEFAULT '1', unit TEXT DEFAULT 'unidad', checked INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))`);
  d.run(`CREATE TABLE IF NOT EXISTS meal_plans (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, name TEXT NOT NULL, day TEXT, meal_type TEXT DEFAULT 'comida', recipe TEXT DEFAULT '', ingredients TEXT DEFAULT '[]', instructions TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))`);
  d.run(`CREATE TABLE IF NOT EXISTS challenges (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL, description TEXT DEFAULT '', progress INTEGER DEFAULT 0, goal INTEGER DEFAULT 1, completed INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))`);
  d.run(`CREATE TABLE IF NOT EXISTS community_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, content TEXT NOT NULL, likes INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))`);
  d.run(`CREATE TABLE IF NOT EXISTS impact_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, type TEXT NOT NULL, value REAL DEFAULT 0, description TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))`);
  d.run(`CREATE TABLE IF NOT EXISTS cooking_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, recipe_name TEXT NOT NULL, steps TEXT DEFAULT '[]', current_step INTEGER DEFAULT 0, completed INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))`);
  d.run(`CREATE TABLE IF NOT EXISTS ingredient_substitutions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, ingredient TEXT NOT NULL, substitute TEXT NOT NULL, reason TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))`);
  d.run(`CREATE TABLE IF NOT EXISTS post_likes (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL, user_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (post_id) REFERENCES community_posts(id), FOREIGN KEY (user_id) REFERENCES users(id))`);
  d.run(`CREATE TABLE IF NOT EXISTS post_comments (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL, user_id INTEGER NOT NULL, content TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (post_id) REFERENCES community_posts(id), FOREIGN KEY (user_id) REFERENCES users(id))`);
  try { d.run("ALTER TABLE community_posts ADD COLUMN meal_id INTEGER DEFAULT 0"); } catch(e) {}
  try { d.run("ALTER TABLE community_posts ADD COLUMN meal_name TEXT DEFAULT ''"); } catch(e) {}
  try { d.run("ALTER TABLE community_posts ADD COLUMN photo TEXT DEFAULT ''"); } catch(e) {}
  try { d.run("ALTER TABLE community_posts ADD COLUMN ingredients TEXT DEFAULT '[]'"); } catch(e) {}
  try { d.run("ALTER TABLE community_posts ADD COLUMN instructions TEXT DEFAULT ''"); } catch(e) {}
  try { d.run("ALTER TABLE meal_plans ADD COLUMN photo TEXT DEFAULT ''"); } catch(e) {}
}

async function queryAll(sql, params = []) {
  await getDb();
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) { rows.push(stmt.getAsObject()); }
  stmt.free();
  return rows;
}

async function queryOne(sql, params = []) {
  const rows = await queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

async function execute(sql, params = []) {
  await getDb();
  db.run(sql, params);
}

function getLastId() {
  const stmt = db.prepare('SELECT last_insert_rowid() as id');
  stmt.step();
  const row = stmt.getAsObject();
  stmt.free();
  return row.id;
}

function saveDb() {
  if (!db) return;
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

function closeDb() {
  if (db) { saveDb(); db.close(); db = null; }
}

module.exports = { getDb, queryAll, queryOne, execute, getLastId, saveDb, closeDb };
