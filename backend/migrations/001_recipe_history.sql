-- Create recipe_history table for per-user recipe usage tracking
-- Run this SQL in your Supabase SQL editor (https://supabase.com/dashboard/project/_/sql/new)

CREATE TABLE IF NOT EXISTS recipe_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL,
  recipe_name TEXT NOT NULL,
  recipe_category TEXT DEFAULT '',
  date TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_history_user_id ON recipe_history(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_history_recipe_id ON recipe_history(recipe_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_recipe_history_user_recipe ON recipe_history(user_id, recipe_id);
