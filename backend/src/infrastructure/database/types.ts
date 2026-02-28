import type { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface Database {
  pr_messages: PrMessageTable;
  user_bindings: UserBindingTable;
  user_identities: UserIdentityTable;
  user_totp: UserTotpTable;
  repo_configs: RepoConfigTable;
  repo_config_tags: RepoConfigTagTable;
  repo_event_toggles: RepoEventToggleTable;
  webhook_events: WebhookEventTable;

  notifier_logs: NotifierLogTable;
  feedbacks: FeedbackTable;
}

export interface PrMessageTable {
  id: Generated<number>;
  provider_pr_id: number;
  provider_repo: string;
  platform: "discord" | "slack";
  platform_message_id: string;
  platform_channel_id: string;
  repo_config_id: number | null;
  status: Generated<"open" | "merged" | "closed">;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type PrMessageRow = Selectable<PrMessageTable>;
export type NewPrMessageRow = Insertable<PrMessageTable>;
export type PrMessageUpdate = Updateable<PrMessageTable>;

export interface UserBindingTable {
  id: Generated<number>;
  provider_user_id: string | null;
  provider_username: string | null;
  discord_user_id: string | null;
  slack_user_id: string | null;
  google_user_id: string | null;
  google_email: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type UserBindingRow = Selectable<UserBindingTable>;
export type NewUserBindingRow = Insertable<UserBindingTable>;
export type UserBindingUpdate = Updateable<UserBindingTable>;

export interface UserIdentityTable {
  id: Generated<number>;
  user_id: number;
  provider: string;
  provider_user_id: string;
  provider_email: string | null;
  provider_username: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: Date | null;
  created_at: Generated<Date>;
}

export type UserIdentityRow = Selectable<UserIdentityTable>;
export type NewUserIdentityRow = Insertable<UserIdentityTable>;

export interface RepoConfigTable {
  id: Generated<number>;
  user_id: number | null;
  provider: "github" | "gitlab" | "bitbucket";
  provider_repo: string;
  platform: "discord" | "slack";
  channel_id: string;
  is_active: Generated<boolean>;
  webhook_id: string | null;
  webhook_created_by: number | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type RepoConfigRow = Selectable<RepoConfigTable>;
export type NewRepoConfigRow = Insertable<RepoConfigTable>;
export type RepoConfigUpdate = Updateable<RepoConfigTable>;

export interface RepoConfigTagTable {
  id: Generated<number>;
  repo_config_id: number;
  tag: string;
  created_at: Generated<Date>;
}

export type RepoConfigTagRow = Selectable<RepoConfigTagTable>;
export type NewRepoConfigTagRow = Insertable<RepoConfigTagTable>;

export interface RepoEventToggleTable {
  id: Generated<number>;
  repo_config_id: number;
  event_type: string;
  is_enabled: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type RepoEventToggleRow = Selectable<RepoEventToggleTable>;
export type NewRepoEventToggleRow = Insertable<RepoEventToggleTable>;

export interface WebhookEventTable {
  id: Generated<number>;
  event_id: string;
  event_type: string;
  processed_at: Generated<Date>;
}

export type WebhookEventRow = Selectable<WebhookEventTable>;
export type NewWebhookEventRow = Insertable<WebhookEventTable>;


export interface NotifierLogTable {
  id: Generated<number>;
  repo_config_id: number;
  event_type: string;
  status: Generated<string>;
  platform: string;
  summary: Generated<string>;
  error_message: string | null;
  created_at: Generated<Date>;
}

export type NotifierLogRow = Selectable<NotifierLogTable>;
export type NewNotifierLogRow = Insertable<NotifierLogTable>;

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

export interface FeedbackTable {
  id: Generated<number>;
  user_id: number;
  message: string;
  created_at: Generated<Date>;
}

export type FeedbackRow = Selectable<FeedbackTable>;
export type NewFeedbackRow = Insertable<FeedbackTable>;
