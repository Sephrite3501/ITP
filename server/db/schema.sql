-- users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  contact VARCHAR(50),
  address TEXT,
  member_type VARCHAR(50) DEFAULT 'basic',
  user_role VARCHAR(20) DEFAULT 'user', -- renamed from "role"
  organization VARCHAR(100) NOT NULL,
  role VARCHAR(20),
  account_status VARCHAR(20) DEFAULT 'pending',
  email_verified BOOLEAN DEFAULT FALSE,
  profile_image_path TEXT,  -- for storing profile pic path
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE committee_snapshots (
  id         SERIAL PRIMARY KEY,
  taken_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  data       JSONB                NOT NULL
);

CREATE TABLE payment_submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  payment_path TEXT NOT NULL,
  identity_path TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending', -- 'approved', 'rejected'
  reviewed_by INTEGER,
  reviewed_at TIMESTAMPTZ
);

-- activation tokens
CREATE TABLE IF NOT EXISTS activation_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- password reset
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- otp codes (for 2FA)
CREATE TABLE IF NOT EXISTS otp_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_attempts (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  attempt_time TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_attempt_window ON otp_attempts (email, ip_address, attempt_time);

-- login attempts (lockout)
CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  success BOOLEAN,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session token store (cookie-based login)
CREATE TABLE IF NOT EXISTS session_tokens (
  id SERIAL PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20),
  ip TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OTP login codes (non-session 2FA)
CREATE TABLE IF NOT EXISTS login_otp (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
-- Home page content 
CREATE TABLE IF NOT EXISTS site_content (
  id         SERIAL PRIMARY KEY,
  carousel   JSONB   NOT NULL,                
  intro      JSONB   NOT NULL,                
  vision     TEXT    NOT NULL,                
  mission    TEXT    NOT NULL,                
  community  JSONB   NOT NULL,                
  updated_at TIMESTAMPTZ DEFAULT NOW()        
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  location VARCHAR(255),
  description TEXT,
  event_type VARCHAR(100),
  poc BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  slug VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  registered_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);


CREATE TABLE IF NOT EXISTS auth_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action TEXT NOT NULL,          -- e.g. login_success, login_failed, logout
  details TEXT,
  ref_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT,                 -- low / medium / high / critical
  created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER,
  action TEXT NOT NULL,          -- e.g. approve_user, change_role
  target_user_id INTEGER,
  details TEXT,
  ref_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS csrf_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  reason TEXT NOT NULL,          -- e.g. token_mismatch, expired
  ref_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS error_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  error_type TEXT NOT NULL,      -- e.g. 500_server_error, db_failure
  message TEXT,
  stack TEXT,
  ref_id TEXT,
  severity TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS session_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  session_id TEXT,
  action TEXT NOT NULL,          \
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
