CREATE TABLE IF NOT EXISTS notifier_logs (
    id SERIAL PRIMARY KEY,
    repo_config_id INTEGER NOT NULL REFERENCES repo_configs(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    platform TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifier_logs_repo_config_id ON notifier_logs(repo_config_id);
CREATE INDEX idx_notifier_logs_created_at ON notifier_logs(created_at DESC);
