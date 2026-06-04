-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/tzejgnbmliuewmyadbff/sql/new

-- Drop existing tables to start fresh (if re-running)
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS cooking_sessions CASCADE;
DROP TABLE IF EXISTS ingredient_substitutions CASCADE;
DROP TABLE IF EXISTS impact_logs CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS meal_plans CASCADE;
DROP TABLE IF EXISTS shopping_items CASCADE;
DROP TABLE IF EXISTS pantry_items CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pantry_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Otros',
  quantity TEXT DEFAULT '1',
  unit TEXT DEFAULT 'unidad',
  expiry_date TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE shopping_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Otros',
  quantity TEXT DEFAULT '1',
  unit TEXT DEFAULT 'unidad',
  checked INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE meal_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  day TEXT,
  meal_type TEXT DEFAULT 'comida',
  recipe TEXT DEFAULT '',
  ingredients TEXT DEFAULT '[]',
  instructions TEXT DEFAULT '',
  photo TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE challenges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  progress INTEGER DEFAULT 0,
  goal INTEGER DEFAULT 1,
  completed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE community_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  meal_id INTEGER DEFAULT 0,
  meal_name TEXT DEFAULT '',
  photo TEXT DEFAULT '',
  ingredients TEXT DEFAULT '[]',
  instructions TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE impact_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  value REAL DEFAULT 0,
  description TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cooking_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_name TEXT NOT NULL,
  steps TEXT DEFAULT '[]',
  current_step INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ingredient_substitutions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ingredient TEXT NOT NULL,
  substitute TEXT NOT NULL,
  reason TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE post_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE post_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RPC functions for like increment/decrement
CREATE OR REPLACE FUNCTION increment_likes(p_post_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE community_posts SET likes = likes + 1 WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_likes(p_post_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE community_posts SET likes = GREATEST(0, likes - 1) WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pantry_user ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_user ON shopping_items(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_user ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_user ON challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_impact_user ON impact_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_cooking_user ON cooking_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_substitution_user ON ingredient_substitutions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_user ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON post_comments(post_id);
