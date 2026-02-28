ALTER TABLE repo_configs ADD COLUMN user_id INTEGER REFERENCES user_bindings(id);

-- Drop old unique constraint and add new one that includes user_id
ALTER TABLE repo_configs DROP CONSTRAINT IF EXISTS repo_configs_provider_repo_platform_key;
ALTER TABLE repo_configs DROP CONSTRAINT IF EXISTS repo_configs_provider_provider_repo_platform_key;
ALTER TABLE repo_configs ADD CONSTRAINT repo_configs_user_provider_repo_platform_key UNIQUE (user_id, provider, provider_repo, platform);

CREATE INDEX idx_repo_configs_user_id ON repo_configs (user_id);
