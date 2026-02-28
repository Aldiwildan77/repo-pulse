-- DROP TABLES (CHILD FIRST)
DROP TABLE IF EXISTS feedbacks CASCADE;

DROP TABLE IF EXISTS notification_deliveries CASCADE;

DROP TABLE IF EXISTS notifier_logs CASCADE;

DROP TABLE IF EXISTS webhook_event_logs CASCADE;

DROP TABLE IF EXISTS repo_event_toggles CASCADE;

DROP TABLE IF EXISTS repo_config_notification_tags CASCADE;

DROP TABLE IF EXISTS repo_config_webhooks CASCADE;

DROP TABLE IF EXISTS repo_config_notifications CASCADE;

DROP TABLE IF EXISTS repo_access_requests CASCADE;

DROP TABLE IF EXISTS repo_configs CASCADE;

DROP TABLE IF EXISTS workspace_members CASCADE;

DROP TABLE IF EXISTS workspaces CASCADE;

DROP TABLE IF EXISTS user_totp CASCADE;

DROP TABLE IF EXISTS user_identities CASCADE;

DROP TABLE IF EXISTS users CASCADE;

-- DROP ENUM TYPES
DROP TYPE IF EXISTS notification_status;

DROP TYPE IF EXISTS repo_access_request_status;

DROP TYPE IF EXISTS workspace_member_status;

DROP TYPE IF EXISTS workspace_role;

DROP TYPE IF EXISTS repo_provider_type;

DROP TYPE IF EXISTS notification_platform;

DROP TYPE IF EXISTS auth_provider_type;