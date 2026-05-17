// Migrate existing users to Supabase Auth's auth.users table
// Usage: SUPABASE_URL=https://... SUPABASE_SERVICE_KEY=eyJ... node scripts/migrate-auth-users.js

const path = require('path');
const fs = require('fs');

const modDir = path.join(__dirname, '..', 'backend', 'node_modules');
const initSqlJs = require(path.join(modDir, 'sql.js'));
const { createClient } = require(path.join(modDir, '@supabase', 'supabase-js'));

const DB_PATH = path.join(__dirname, '..', 'backend', 'cookit.db');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
  const SQL = await initSqlJs();
  if (!fs.existsSync(DB_PATH)) {
    console.error('cookit.db not found');
    process.exit(1);
  }
  const db = new SQL.Database(fs.readFileSync(DB_PATH));
  const stmt = db.prepare('SELECT id, email, password, name FROM users');
  const users = [];
  while (stmt.step()) users.push(stmt.getAsObject());
  stmt.free();
  db.close();

  console.log(`Found ${users.length} users to migrate to auth.users`);

  for (const u of users) {
    const { data: existing } = await supabase.auth.admin.listUsers();
    const alreadyExists = existing?.users?.some(au => au.email === u.email);
    if (alreadyExists) {
      console.log(`  ${u.email} already in auth.users, skipping`);
      continue;
    }
    const tempPassword = 'Temp_' + Math.random().toString(36).slice(2, 10);
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: tempPassword,
      email_confirm: true
    });
    if (error) {
      console.error(`  Error creating ${u.email}:`, error.message);
    } else {
      console.log(`  Created ${u.email} in auth.users (id=${data.user.id})`);
    }
  }

  console.log('\nDone! Existing users can use "Forgot password" to set a new password.');
}

migrate().catch(e => { console.error(e); process.exit(1); });
