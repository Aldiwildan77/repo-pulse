ALTER TABLE user_identities
  ADD COLUMN access_token_encrypted TEXT,
  ADD COLUMN refresh_token_encrypted TEXT,
  ADD COLUMN token_expires_at TIMESTAMPTZ;

ALTER TABLE repo_configs
  ADD COLUMN webhook_id TEXT,
  ADD COLUMN webhook_created_by INTEGER REFERENCES user_bindings(id);
