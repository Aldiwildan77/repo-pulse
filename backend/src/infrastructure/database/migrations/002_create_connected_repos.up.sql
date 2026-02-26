CREATE TABLE IF NOT EXISTS connected_repos (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('github', 'gitlab', 'bitbucket')),
    provider_installation_id VARCHAR(255),
    provider_repo VARCHAR(255) NOT NULL,
    connected_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_repo)
);

CREATE INDEX idx_connected_repos_installation ON connected_repos (provider_installation_id);
CREATE INDEX idx_connected_repos_connected_by ON connected_repos (connected_by);
CREATE INDEX idx_connected_repos_provider ON connected_repos (provider);
