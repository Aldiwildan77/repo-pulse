ALTER TABLE repo_configs
  ADD COLUMN provider VARCHAR(20) NOT NULL DEFAULT 'github'
  CHECK (provider IN ('github', 'gitlab', 'bitbucket'));

-- Drop old unique constraint and create new one that includes provider
ALTER TABLE repo_configs DROP CONSTRAINT repo_configs_provider_repo_platform_key;
ALTER TABLE repo_configs ADD CONSTRAINT repo_configs_provider_repo_platform_provider_key
  UNIQUE (provider, provider_repo, platform);
