import type { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface Database {
  pr_messages: PrMessageTable;
  user_bindings: UserBindingTable;
  repo_configs: RepoConfigTable;
  webhook_events: WebhookEventTable;
  connected_repos: ConnectedRepoTable;
}

export interface PrMessageTable {
  id: Generated<number>;
  provider_pr_id: number;
  provider_repo: string;
  platform: "discord" | "slack";
  platform_message_id: string;
  platform_channel_id: string;
  status: Generated<"open" | "merged" | "closed">;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type PrMessageRow = Selectable<PrMessageTable>;
export type NewPrMessageRow = Insertable<PrMessageTable>;
export type PrMessageUpdate = Updateable<PrMessageTable>;

export interface UserBindingTable {
  id: Generated<number>;
  provider_user_id: string;
  provider_username: string;
  discord_user_id: string | null;
  slack_user_id: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type UserBindingRow = Selectable<UserBindingTable>;
export type NewUserBindingRow = Insertable<UserBindingTable>;
export type UserBindingUpdate = Updateable<UserBindingTable>;

export interface RepoConfigTable {
  id: Generated<number>;
  provider: "github" | "gitlab" | "bitbucket";
  provider_repo: string;
  platform: "discord" | "slack";
  channel_id: string;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type RepoConfigRow = Selectable<RepoConfigTable>;
export type NewRepoConfigRow = Insertable<RepoConfigTable>;
export type RepoConfigUpdate = Updateable<RepoConfigTable>;

export interface WebhookEventTable {
  id: Generated<number>;
  event_id: string;
  event_type: string;
  processed_at: Generated<Date>;
}

export type WebhookEventRow = Selectable<WebhookEventTable>;
export type NewWebhookEventRow = Insertable<WebhookEventTable>;

export interface ConnectedRepoTable {
  id: Generated<number>;
  provider: "github" | "gitlab" | "bitbucket";
  provider_installation_id: string | null;
  provider_repo: string;
  connected_by: string;
  created_at: Generated<Date>;
}

export type ConnectedRepoRow = Selectable<ConnectedRepoTable>;
export type NewConnectedRepoRow = Insertable<ConnectedRepoTable>;
