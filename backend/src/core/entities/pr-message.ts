export type Platform = "discord" | "slack";
export type PrStatus = "open" | "merged" | "closed";

export interface PrMessage {
  id: number;
  providerPrId: number;
  providerRepo: string;
  platform: Platform;
  platformMessageId: string;
  platformChannelId: string;
  repoConfigId: number | null;
  status: PrStatus;
  createdAt: Date;
  updatedAt: Date;
}
