CREATE TABLE IF NOT EXISTS pr_messages (
    id SERIAL PRIMARY KEY,
    provider_pr_id INTEGER NOT NULL,
    provider_repo VARCHAR(255) NOT NULL,
    platform VARCHAR(10) NOT NULL CHECK (platform IN ('discord', 'slack')),
    platform_message_id VARCHAR(255) NOT NULL,
    platform_channel_id VARCHAR(255) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'merged', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pr_messages_pr_repo ON pr_messages (provider_pr_id, provider_repo);
CREATE INDEX idx_pr_messages_platform ON pr_messages (platform);

CREATE TABLE IF NOT EXISTS user_bindings (
    id SERIAL PRIMARY KEY,
    provider_user_id VARCHAR(255) NOT NULL UNIQUE,
    provider_username VARCHAR(255) NOT NULL,
    discord_user_id VARCHAR(255),
    slack_user_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_bindings_provider_username ON user_bindings (provider_username);

CREATE TABLE IF NOT EXISTS repo_configs (
    id SERIAL PRIMARY KEY,
    provider_repo VARCHAR(255) NOT NULL,
    platform VARCHAR(10) NOT NULL CHECK (platform IN ('discord', 'slack')),
    channel_id VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider_repo, platform)
);

CREATE TABLE IF NOT EXISTS webhook_events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_event_id ON webhook_events (event_id);
