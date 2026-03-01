import type { SourceProvider } from "../webhook/webhook-provider.js";
import type { NotificationPlatform } from "./notification-delivery.js";

export interface RepoConfig {
  id: number;
  workspaceId: number;
  providerRepo: string;
  providerType: SourceProvider;
  claimedByUserId: number | null;
  claimedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RepoConfigNotification {
  id: number;
  repoConfigId: number;
  notificationPlatform: NotificationPlatform;
  channelId: string;
  isActive: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RepoConfigNotificationTag {
  id: number;
  repoConfigNotificationId: number;
  tag: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RepoEventToggle {
  id: number;
  repoConfigNotificationId: number;
  eventType: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
