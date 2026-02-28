DROP INDEX IF EXISTS idx_repo_configs_user_id;
ALTER TABLE repo_configs DROP CONSTRAINT IF EXISTS repo_configs_user_provider_repo_platform_key;
ALTER TABLE repo_configs ADD CONSTRAINT repo_configs_provider_provider_repo_platform_key UNIQUE (provider, provider_repo, platform);
ALTER TABLE repo_configs DROP COLUMN IF EXISTS user_id;
