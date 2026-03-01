export type NotificationPlatform = "discord" | "slack";

export interface NotificationDelivery {
  id: number;
  notifierLogId: number;
  notificationPlatform: NotificationPlatform;
  providerMessageId: string | null;
  providerChannelId: string | null;
  providerThreadId: string | null;
  providerGuildId: string | null;
  providerResponse: unknown | null;
  deliveredAt: Date | null;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
