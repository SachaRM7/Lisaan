ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_activity_date DATE;
