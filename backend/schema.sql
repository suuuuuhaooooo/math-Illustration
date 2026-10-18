CREATE TABLE IF NOT EXISTS profiles(
  email TEXT PRIMARY KEY, cls TEXT NOT NULL, no INTEGER, name TEXT, role TEXT, grade INTEGER,
  data TEXT NOT NULL DEFAULT '{}', updated INTEGER);
CREATE INDEX IF NOT EXISTS idx_profiles_cls ON profiles(cls);
CREATE TABLE IF NOT EXISTS sessions(
  id TEXT PRIMARY KEY, email TEXT NOT NULL, kind TEXT NOT NULL, created INTEGER NOT NULL,
  deadline INTEGER, done INTEGER NOT NULL DEFAULT 0, state TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created);
CREATE TABLE IF NOT EXISTS attempts(
  id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, cls TEXT, unit TEXT, qid TEXT,
  ok INTEGER NOT NULL, dg TEXT, ts INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_attempts_cls_ts ON attempts(cls, ts);
