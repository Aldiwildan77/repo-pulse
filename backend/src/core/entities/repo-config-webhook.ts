import type { NotificationPlatform } from "./notification-delivery.js";

export interface RepoConfigWebhook {
  id: number;
  repoConfigId: number;
  notificationPlatform: NotificationPlatform;
  webhookUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
