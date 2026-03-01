import type { NotificationDelivery, NotificationPlatform } from "../entities/index.js";

export interface NotificationDeliveryRepository {
  create(data: {
    notifierLogId: number;
    notificationPlatform: NotificationPlatform;
    providerMessageId?: string | null;
    providerChannelId?: string | null;
    providerThreadId?: string | null;
    providerGuildId?: string | null;
    providerResponse?: unknown | null;
    deliveredAt?: Date | null;
  }): Promise<NotificationDelivery>;

  findByProviderEntity(providerEntityId: string, providerRepo: string): Promise<NotificationDelivery[]>;

  updateDelivery(id: number, data: {
    editedAt?: Date | null;
    deletedAt?: Date | null;
  }): Promise<void>;
}
