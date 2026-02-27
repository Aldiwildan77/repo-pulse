import type { Platform } from "./pr-message.js";
import type { SourceProvider } from "../webhook/webhook-provider.js";

export interface RepoConfig {
  id: number;
  provider: SourceProvider;
  providerRepo: string;
  platform: Platform;
  channelId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
