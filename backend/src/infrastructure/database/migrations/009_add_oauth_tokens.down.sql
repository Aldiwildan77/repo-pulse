ALTER TABLE user_identities
  DROP COLUMN IF EXISTS access_token_encrypted,
  DROP COLUMN IF EXISTS refresh_token_encrypted,
  DROP COLUMN IF EXISTS token_expires_at;

ALTER TABLE repo_configs
  DROP COLUMN IF EXISTS webhook_id,
  DROP COLUMN IF EXISTS webhook_created_by;
