import type { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface Database {
  users: UserTable;
  user_identities: UserIdentityTable;
  user_totp: UserTotpTable;
  workspaces: WorkspaceTable;
  workspace_members: WorkspaceMemberTable;
  repo_configs: RepoConfigTable;
  repo_access_requests: RepoAccessRequestTable;
  repo_config_notifications: RepoConfigNotificationTable;
  repo_config_notification_tags: RepoConfigNotificationTagTable;
  repo_config_webhooks: RepoConfigWebhookTable;
  repo_event_toggles: RepoEventToggleTable;
  webhook_event_logs: WebhookEventLogTable;
  notifier_logs: NotifierLogTable;
  notification_deliveries: NotificationDeliveryTable;
  feedbacks: FeedbackTable;
}

// --- Users ---

export interface UserTable {
  id: Generated<number>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type UserRow = Selectable<UserTable>;
export type NewUserRow = Insertable<UserTable>;

// --- User Identities ---

export type AuthProviderType =
  | "google"
  | "github"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "discord"
  | "gitlab"
  | "bitbucket"
  | "apple"
  | "microsoft"
  | "slack"
  | "sso";

export interface UserIdentityTable {
  id: Generated<number>;
  user_id: number;
  provider: AuthProviderType;
  provider_user_id: string;
  provider_email: string | null;
  provider_username: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type UserIdentityRow = Selectable<UserIdentityTable>;
export type NewUserIdentityRow = Insertable<UserIdentityTable>;

// --- User TOTP ---

export interface UserTotpTable {
  id: Generated<number>;
  user_id: number;
  totp_secret_encrypted: string;
  is_enabled: Generated<boolean>;
  backup_codes_hash: Generated<unknown>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type UserTotpRow = Selectable<UserTotpTable>;
export type NewUserTotpRow = Insertable<UserTotpTable>;
export type UserTotpUpdate = Updateable<UserTotpTable>;

// --- Workspaces ---

export interface WorkspaceTable {
  id: Generated<number>;
  name: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type WorkspaceRow = Selectable<WorkspaceTable>;
export type NewWorkspaceRow = Insertable<WorkspaceTable>;

// --- Workspace Members ---

export type WorkspaceRole = "owner" | "admin" | "member";
export type WorkspaceMemberStatus = "pending" | "accepted" | "rejected" | "removed";

export interface WorkspaceMemberTable {
  id: Generated<number>;
  workspace_id: number;
  user_id: number;
  role: Generated<WorkspaceRole>;
  status: Generated<WorkspaceMemberStatus>;
  invited_by: number | null;
  invited_at: Generated<Date | null>;
  accepted_at: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type WorkspaceMemberRow = Selectable<WorkspaceMemberTable>;
export type NewWorkspaceMemberRow = Insertable<WorkspaceMemberTable>;

// --- Repo Configs ---

export type RepoProviderType = "github" | "gitlab" | "bitbucket";
export type NotificationPlatform = "discord" | "slack";

export interface RepoConfigTable {
  id: Generated<number>;
  workspace_id: number;
  provider_repo: string;
  provider_type: RepoProviderType;
  claimed_by_user_id: number | null;
  claimed_at: Generated<Date>;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type RepoConfigRow = Selectable<RepoConfigTable>;
export type NewRepoConfigRow = Insertable<RepoConfigTable>;
export type RepoConfigUpdate = Updateable<RepoConfigTable>;

// --- Repo Access Requests ---

export type RepoAccessRequestStatus = "pending" | "approved" | "rejected";

export interface RepoAccessRequestTable {
  id: Generated<number>;
  repo_config_id: number;
  user_id: number;
  requested_role: Generated<WorkspaceRole>;
  status: Generated<RepoAccessRequestStatus>;
  reviewed_by: number | null;
  reviewed_at: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type RepoAccessRequestRow = Selectable<RepoAccessRequestTable>;
export type NewRepoAccessRequestRow = Insertable<RepoAccessRequestTable>;

// --- Repo Config Notifications ---

export interface RepoConfigNotificationTable {
  id: Generated<number>;
  repo_config_id: number;
  notification_platform: NotificationPlatform;
  channel_id: string;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type RepoConfigNotificationRow = Selectable<RepoConfigNotificationTable>;
export type NewRepoConfigNotificationRow = Insertable<RepoConfigNotificationTable>;
export type RepoConfigNotificationUpdate = Updateable<RepoConfigNotificationTable>;

// --- Repo Config Notification Tags ---

export interface RepoConfigNotificationTagTable {
  id: Generated<number>;
  repo_config_notification_id: number;
  tag: string;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type RepoConfigNotificationTagRow = Selectable<RepoConfigNotificationTagTable>;
export type NewRepoConfigNotificationTagRow = Insertable<RepoConfigNotificationTagTable>;

// --- Repo Config Webhooks ---

export interface RepoConfigWebhookTable {
  id: Generated<number>;
  repo_config_id: number;
  notification_platform: NotificationPlatform;
  webhook_url: string;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type RepoConfigWebhookRow = Selectable<RepoConfigWebhookTable>;
export type NewRepoConfigWebhookRow = Insertable<RepoConfigWebhookTable>;

// --- Repo Event Toggles ---

export interface RepoEventToggleTable {
  id: Generated<number>;
  repo_config_notification_id: number;
  event_type: string;
  is_enabled: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type RepoEventToggleRow = Selectable<RepoEventToggleTable>;
export type NewRepoEventToggleRow = Insertable<RepoEventToggleTable>;

// --- Webhook Event Logs ---

export interface WebhookEventLogTable {
  id: Generated<number>;
  event_id: string;
  event_type: string;
  payload: unknown | null;
  processed_at: Generated<Date>;
}

export type WebhookEventLogRow = Selectable<WebhookEventLogTable>;
export type NewWebhookEventLogRow = Insertable<WebhookEventLogTable>;

// --- Notifier Logs ---

export type NotificationStatus = "queued" | "processing" | "delivered" | "failed" | "skipped";

export interface NotifierLogTable {
  id: Generated<number>;
  repo_config_notification_id: number;
  event_type: string;
  status: Generated<NotificationStatus>;
  platform: NotificationPlatform;
  provider_entity_type: Generated<string>;
  provider_entity_id: string;
  provider_entity_number: number | null;
  summary: Generated<string>;
  error_message: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  resolved_at: Date | null;
}

export type NotifierLogRow = Selectable<NotifierLogTable>;
export type NewNotifierLogRow = Insertable<NotifierLogTable>;

// --- Notification Deliveries ---

export interface NotificationDeliveryTable {
  id: Generated<number>;
  notifier_log_id: number;
  notification_platform: NotificationPlatform;
  provider_message_id: string | null;
  provider_channel_id: string | null;
  provider_thread_id: string | null;
  provider_guild_id: string | null;
  provider_response: unknown | null;
  delivered_at: Date | null;
  edited_at: Date | null;
  deleted_at: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type NotificationDeliveryRow = Selectable<NotificationDeliveryTable>;
export type NewNotificationDeliveryRow = Insertable<NotificationDeliveryTable>;
export type NotificationDeliveryUpdate = Updateable<NotificationDeliveryTable>;

// --- Feedbacks ---

export interface FeedbackTable {
  id: Generated<number>;
  user_id: number;
  message: string;
  created_at: Generated<Date>;
}

export type FeedbackRow = Selectable<FeedbackTable>;
export type NewFeedbackRow = Insertable<FeedbackTable>;
