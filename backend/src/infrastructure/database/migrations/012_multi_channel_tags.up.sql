-- Add optional tag column (null = default, always notified)
ALTER TABLE
  repo_configs
ADD
  COLUMN tag VARCHAR(255) DEFAULT NULL;

-- Drop old unique constraint (prevents multi-channel)
ALTER TABLE
  repo_configs DROP CONSTRAINT IF EXISTS repo_configs_user_provider_repo_platform_key;

-- New unique index: allows multiple channels per platform, but not duplicate tags
-- COALESCE treats NULL as '__default__' so only one default per repo+platform
CREATE UNIQUE INDEX repo_configs_user_provider_repo_platform_tag_key ON repo_configs (
  user_id,
  provider,
  provider_repo,
  platform,
  COALESCE(tag, '__default__')
);

-- Link pr_messages back to the config that created them (for correct reaction routing)
ALTER TABLE
  pr_messages
ADD
  COLUMN repo_config_id INTEGER REFERENCES repo_configs(id) ON DELETE
SET
  NULL;

CREATE INDEX idx_pr_messages_repo_config_id ON pr_messages (repo_config_id);