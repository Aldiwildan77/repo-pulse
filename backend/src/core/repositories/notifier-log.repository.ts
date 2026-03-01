import type { NotifierLog, NotificationStatus, NotificationPlatform } from "../entities/index.js";

export interface NotifierLogRepository {
  create(data: {
    repoConfigNotificationId: number;
    eventType: string;
    status: NotificationStatus;
    platform: NotificationPlatform;
    providerEntityType?: string;
    providerEntityId: string;
    providerEntityNumber?: number | null;
    summary: string;
    errorMessage?: string | null;
    resolvedAt?: Date | null;
  }): Promise<NotifierLog>;

  findByNotification(
    notificationId: number,
    limit: number,
    offset: number,
  ): Promise<{ logs: NotifierLog[]; total: number }>;

  updateStatus(id: number, status: NotificationStatus, resolvedAt?: Date | null): Promise<void>;
}
