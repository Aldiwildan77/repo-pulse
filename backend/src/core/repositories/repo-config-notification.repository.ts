import type { RepoConfigNotification, RepoEventToggle, NotificationPlatform } from "../entities/index.js";

export interface RepoConfigNotificationRepository {
  create(data: {
    repoConfigId: number;
    notificationPlatform: NotificationPlatform;
    channelId: string;
  }): Promise<RepoConfigNotification>;

  findById(id: number): Promise<RepoConfigNotification | null>;

  findByRepoConfig(repoConfigId: number): Promise<RepoConfigNotification[]>;

  findActiveByRepoConfig(repoConfigId: number): Promise<RepoConfigNotification[]>;

  findActiveByRepo(providerRepo: string): Promise<RepoConfigNotification[]>;

  update(id: number, data: { channelId?: string; isActive?: boolean }): Promise<void>;

  delete(id: number): Promise<void>;

  getTagsForNotifications(ids: number[]): Promise<Map<number, string[]>>;

  setTagsForNotification(id: number, tags: string[]): Promise<void>;

  getEventToggles(notificationId: number): Promise<RepoEventToggle[]>;

  upsertEventToggle(notificationId: number, eventType: string, isEnabled: boolean): Promise<void>;

  isEventEnabled(notificationId: number, eventType: string): Promise<boolean>;
}
