import type { Platform } from "./pr-message.js";

export interface RepoConfig {
  id: number;
  providerRepo: string;
  platform: Platform;
  channelId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
