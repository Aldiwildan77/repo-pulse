CREATE TABLE IF NOT EXISTS repo_event_toggles (
    id SERIAL PRIMARY KEY,
    repo_config_id INTEGER NOT NULL REFERENCES repo_configs(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (repo_config_id, event_type)
);
