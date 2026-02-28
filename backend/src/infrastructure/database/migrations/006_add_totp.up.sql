CREATE TABLE IF NOT EXISTS user_totp (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES user_bindings(id) ON DELETE CASCADE,
    totp_secret_encrypted TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    backup_codes_hash JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
