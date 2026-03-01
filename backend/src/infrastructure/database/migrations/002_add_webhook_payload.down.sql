DROP INDEX IF EXISTS idx_repo_configs_provider_repo;
CREATE UNIQUE INDEX idx_repo_configs_provider_repo ON repo_configs (provider_type, provider_repo);

ALTER TABLE repo_config_notifications
  DROP COLUMN IF EXISTS guild_id;

ALTER TABLE webhook_event_logs
  DROP COLUMN IF EXISTS payload;
