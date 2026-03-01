import type { NotificationPlatform } from "./notification-delivery.js";

export type NotificationStatus = "queued" | "processing" | "delivered" | "failed" | "skipped";

export interface NotifierLog {
  id: number;
  repoConfigNotificationId: number;
  eventType: string;
  status: NotificationStatus;
  platform: NotificationPlatform;
  providerEntityType: string;
  providerEntityId: string;
  providerEntityNumber: number | null;
  summary: string;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}
