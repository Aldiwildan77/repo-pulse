ALTER TABLE repo_configs DROP CONSTRAINT repo_configs_provider_repo_platform_provider_key;
ALTER TABLE repo_configs DROP COLUMN provider;
ALTER TABLE repo_configs ADD CONSTRAINT repo_configs_provider_repo_platform_key
  UNIQUE (provider_repo, platform);
