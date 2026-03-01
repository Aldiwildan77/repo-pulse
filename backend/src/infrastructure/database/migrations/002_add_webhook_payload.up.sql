-- Store full webhook payload for debugging
ALTER TABLE webhook_event_logs
  ADD COLUMN payload jsonb;

-- Store Discord guild_id on notifications so edit page can restore server selection
ALTER TABLE repo_config_notifications
  ADD COLUMN guild_id varchar(255);

-- Make provider_repo lookups case-insensitive
DROP INDEX IF EXISTS idx_repo_configs_provider_repo;
CREATE UNIQUE INDEX idx_repo_configs_provider_repo ON repo_configs (provider_type, LOWER(provider_repo));
