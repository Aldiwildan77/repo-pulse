DROP INDEX IF EXISTS idx_pr_messages_repo_config_id;

ALTER TABLE
  pr_messages DROP COLUMN IF EXISTS repo_config_id;

DROP INDEX IF EXISTS repo_configs_user_provider_repo_platform_tag_key;

ALTER TABLE
  repo_configs
ADD
  CONSTRAINT repo_configs_user_provider_repo_platform_key UNIQUE (user_id, provider, provider_repo, platform);

ALTER TABLE
  repo_configs DROP COLUMN IF EXISTS tag;