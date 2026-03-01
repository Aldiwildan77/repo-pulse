CREATE TYPE auth_provider_type AS ENUM (
  'google',
  'github',
  'facebook',
  'twitter',
  'linkedin',
  'discord',
  'gitlab',
  'bitbucket',
  'apple',
  'microsoft',
  'slack',
  'sso'
);

CREATE TABLE users (
  id serial PRIMARY KEY,
  created_at timestamptz DEFAULT NOW() NOT NULL,
  updated_at timestamptz DEFAULT NOW() NOT NULL
);

CREATE TABLE user_identities (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider auth_provider_type NOT NULL,
  provider_user_id varchar(255) NOT NULL,
  provider_email varchar(255),
  provider_username varchar(255),
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  created_at timestamptz DEFAULT NOW() NOT NULL,
  updated_at timestamptz DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX idx_user_identities_provider_user ON user_identities (provider, provider_user_id);

CREATE INDEX idx_user_identities_created_at ON user_identities (created_at);

CREATE INDEX idx_user_identities_updated_at ON user_identities (updated_at);

CREATE INDEX idx_user_identities_user_id ON user_identities (user_id, provider);

CREATE TABLE user_totp (
  id serial PRIMARY KEY,
  user_id integer NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  totp_secret_encrypted text NOT NULL,
  is_enabled boolean DEFAULT false NOT NULL,
  backup_codes_hash jsonb DEFAULT '[]' :: jsonb NOT NULL,
  created_at timestamptz DEFAULT NOW() NOT NULL,
  updated_at timestamptz DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX idx_user_totp_user_id ON user_totp (user_id);

CREATE TYPE notification_platform AS ENUM ('discord', 'slack');

CREATE TYPE repo_provider_type AS ENUM ('github', 'gitlab', 'bitbucket');

-- WORKSPACE AND MEMBERSHIP
CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'member');

CREATE TYPE workspace_member_status AS ENUM (
  'pending',
  'accepted',
  'rejected',
  'removed'
);

CREATE TABLE workspaces (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_workspaces_created_at ON workspaces (created_at);

CREATE INDEX idx_workspaces_updated_at ON workspaces (updated_at);

CREATE TABLE workspace_members (
  id serial PRIMARY KEY,
  workspace_id integer NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role workspace_role NOT NULL DEFAULT 'member',
  status workspace_member_status NOT NULL DEFAULT 'pending',
  invited_by integer REFERENCES users(id),
  invited_at timestamptz DEFAULT NOW(),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT NOW() NOT NULL,
  updated_at timestamptz DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX idx_workspace_members_unique_active ON workspace_members (workspace_id, user_id)
WHERE
  status IN ('pending', 'accepted');

CREATE INDEX idx_workspace_members_workspace ON workspace_members (workspace_id);

CREATE INDEX idx_workspace_members_user ON workspace_members (user_id);

CREATE INDEX idx_workspace_members_status ON workspace_members (status);

CREATE TYPE repo_access_request_status AS ENUM ('pending', 'approved', 'rejected');

-- REPO CONFIGURATION
CREATE TABLE repo_configs (
  id serial PRIMARY KEY,
  workspace_id integer NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider_repo varchar(255) NOT NULL,
  provider_type repo_provider_type NOT NULL,
  claimed_by_user_id integer REFERENCES users(id) ON DELETE
  SET
    NULL,
    claimed_at timestamptz DEFAULT now() NOT NULL,
    is_active boolean DEFAULT TRUE NOT NULL,
    created_at timestamptz DEFAULT NOW() NOT NULL,
    updated_at timestamptz DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX idx_repo_configs_provider_repo ON repo_configs (provider_type, provider_repo);

CREATE INDEX idx_repo_configs_workspace ON repo_configs (workspace_id);

CREATE INDEX idx_repo_configs_created_at ON repo_configs (created_at);

CREATE INDEX idx_repo_configs_updated_at ON repo_configs (updated_at);

CREATE TABLE repo_access_requests (
  id serial PRIMARY KEY,
  repo_config_id integer NOT NULL REFERENCES repo_configs(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_role workspace_role NOT NULL DEFAULT 'member',
  status repo_access_request_status NOT NULL DEFAULT 'pending',
  reviewed_by integer REFERENCES users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX idx_repo_access_requests_unique_pending ON repo_access_requests (repo_config_id, user_id)
WHERE
  status = 'pending';

CREATE INDEX idx_repo_access_requests_repo ON repo_access_requests (repo_config_id);

CREATE INDEX idx_repo_access_requests_user ON repo_access_requests (user_id);

CREATE TABLE repo_config_notifications (
  id serial PRIMARY KEY,
  repo_config_id integer NOT NULL REFERENCES repo_configs(id) ON DELETE CASCADE,
  notification_platform notification_platform NOT NULL,
  channel_id varchar(255) NOT NULL,
  is_active boolean DEFAULT TRUE NOT NULL,
  created_at timestamptz DEFAULT NOW() NOT NULL,
  updated_at timestamptz DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX idx_repo_config_notifications_channel ON repo_config_notifications (
  repo_config_id,
  notification_platform,
  channel_id
);

CREATE INDEX idx_repo_config_notifications_created_at ON repo_config_notifications (created_at);

CREATE INDEX idx_repo_config_notifications_updated_at ON repo_config_notifications (updated_at);

CREATE TABLE repo_config_notification_tags (
  id serial PRIMARY KEY,
  repo_config_notification_id integer NOT NULL REFERENCES repo_config_notifications(id) ON DELETE CASCADE,
  tag varchar(255) NOT NULL,
  is_active boolean DEFAULT TRUE NOT NULL,
  created_at timestamptz DEFAULT NOW() NOT NULL,
  updated_at timestamptz DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX idx_repo_config_notification_tags_tag ON repo_config_notification_tags (repo_config_notification_id, tag);

CREATE INDEX idx_repo_config_notification_tags_created_at ON repo_config_notification_tags (created_at);

CREATE INDEX idx_repo_config_notification_tags_updated_at ON repo_config_notification_tags (updated_at);

CREATE TABLE repo_config_webhooks (
  id serial PRIMARY KEY,
  repo_config_id integer NOT NULL REFERENCES repo_configs(id) ON DELETE CASCADE,
  notification_platform notification_platform NOT NULL,
  webhook_url text NOT NULL,
  is_active boolean DEFAULT TRUE NOT NULL,
  created_at timestamptz DEFAULT NOW() NOT NULL,
  updated_at timestamptz DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX idx_repo_config_webhooks_url ON repo_config_webhooks (
  repo_config_id,
  notification_platform,
  webhook_url
);

CREATE INDEX idx_repo_config_webhooks_created_at ON repo_config_webhooks (created_at);

CREATE INDEX idx_repo_config_webhooks_updated_at ON repo_config_webhooks (updated_at);

CREATE TABLE repo_event_toggles (
  id serial PRIMARY KEY,
  repo_config_notification_id integer NOT NULL REFERENCES repo_config_notifications(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  is_enabled boolean DEFAULT TRUE NOT NULL,
  created_at timestamptz DEFAULT NOW() NOT NULL,
  updated_at timestamptz DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX idx_repo_event_toggles_event ON repo_event_toggles (repo_config_notification_id, event_type);

CREATE INDEX idx_repo_event_toggles_created_at ON repo_event_toggles (created_at);

CREATE INDEX idx_repo_event_toggles_updated_at ON repo_event_toggles (updated_at);

CREATE TABLE webhook_event_logs (
  id serial PRIMARY KEY,
  event_id varchar(255) NOT NULL UNIQUE,
  event_type varchar(200) NOT NULL,
  processed_at timestamptz DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_webhook_event_logs_processed_at ON webhook_event_logs (processed_at);

CREATE TYPE notification_status AS ENUM (
  'queued',
  'processing',
  'delivered',
  'failed',
  'skipped'
);

CREATE TABLE notifier_logs (
  id serial PRIMARY KEY,
  repo_config_notification_id integer NOT NULL REFERENCES repo_config_notifications(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  status notification_status DEFAULT 'queued' NOT NULL,
  platform notification_platform NOT NULL,
  provider_entity_type varchar(50) NOT NULL DEFAULT 'pull_request',
  provider_entity_id varchar(255) NOT NULL,
  provider_entity_number integer,
  summary text DEFAULT '' :: text NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT NOW() NOT NULL,
  updated_at timestamptz DEFAULT NOW() NOT NULL,
  resolved_at timestamptz,
  handling_time interval GENERATED ALWAYS AS (
    CASE
      WHEN resolved_at IS NOT NULL THEN resolved_at - created_at
      ELSE NULL
    END
  ) STORED
);

CREATE INDEX idx_notifier_logs_lookup ON notifier_logs (repo_config_notification_id, event_type);

CREATE INDEX idx_notifier_logs_status_created ON notifier_logs (status, created_at ASC);

CREATE INDEX idx_notifier_logs_created_at ON notifier_logs (created_at);

CREATE INDEX idx_notifier_logs_updated_at ON notifier_logs (updated_at);

CREATE TABLE notification_deliveries (
  id serial PRIMARY KEY,
  notifier_log_id integer NOT NULL REFERENCES notifier_logs(id) ON DELETE CASCADE,
  notification_platform notification_platform NOT NULL,
  provider_message_id varchar(255),
  provider_channel_id varchar(255),
  provider_thread_id varchar(255),
  provider_guild_id varchar(255),
  provider_response jsonb,
  delivered_at timestamptz,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT NOW() NOT NULL,
  updated_at timestamptz DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notification_deliveries_provider_m_p ON notification_deliveries (provider_message_id, notification_platform);

CREATE INDEX idx_notification_deliveries_provider_p_g_m ON notification_deliveries (
  notification_platform,
  provider_guild_id,
  provider_message_id
)
WHERE
  provider_guild_id IS NOT NULL;

CREATE UNIQUE INDEX idx_notification_deliveries_provider_p_c_m ON notification_deliveries (
  notification_platform,
  provider_channel_id,
  provider_message_id
)
WHERE
  provider_channel_id IS NOT NULL;

CREATE INDEX idx_notification_deliveries_created_at ON notification_deliveries (created_at);

CREATE INDEX idx_notification_deliveries_updated_at ON notification_deliveries (updated_at);

CREATE TABLE feedbacks (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_feedbacks_created_at ON feedbacks (created_at);