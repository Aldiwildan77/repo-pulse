import type { Platform } from "./pr-message.js";
import type { SourceProvider } from "../webhook/webhook-provider.js";

export interface RepoConfig {
  id: number;
  userId: number | null;
  provider: SourceProvider;
  providerRepo: string;
  platform: Platform;
  channelId: string;
  isActive: boolean;
  webhookId: string | null;
  webhookCreatedBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RepoEventToggle {
  id: number;
  repoConfigId: number;
  eventType: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
