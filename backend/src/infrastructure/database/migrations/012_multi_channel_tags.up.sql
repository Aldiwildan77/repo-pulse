-- Drop old unique constraint (prevents multi-channel)
ALTER TABLE
  repo_configs DROP CONSTRAINT IF EXISTS repo_configs_user_provider_repo_platform_key;

-- New unique: same channel can't be configured twice for same repo
CREATE UNIQUE INDEX repo_configs_user_provider_repo_platform_channel_key ON repo_configs (
  user_id,
  provider,
  provider_repo,
  platform,
  channel_id
);

-- Row-based tag mapping: each row maps a label tag to a repo config
CREATE TABLE repo_config_tags (
  id SERIAL PRIMARY KEY,
  repo_config_id INTEGER NOT NULL REFERENCES repo_configs(id) ON DELETE CASCADE,
  tag VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (repo_config_id, tag)
);

CREATE INDEX idx_repo_config_tags_repo_config_id ON repo_config_tags (repo_config_id);
CREATE INDEX idx_repo_config_tags_tag ON repo_config_tags (tag);

-- Link pr_messages back to the config that created them (for correct reaction routing)
ALTER TABLE
  pr_messages
ADD
  COLUMN repo_config_id INTEGER REFERENCES repo_configs(id) ON DELETE
SET
  NULL;

CREATE INDEX idx_pr_messages_repo_config_id ON pr_messages (repo_config_id);
