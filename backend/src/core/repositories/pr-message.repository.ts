import type { Platform, PrMessage, PrStatus } from "../entities/index.js";

export interface PrMessageRepository {
  create(data: {
    providerPrId: number;
    providerRepo: string;
    platform: Platform;
    platformMessageId: string;
    platformChannelId: string;
  }): Promise<PrMessage>;

  findByPrAndRepo(providerPrId: number, providerRepo: string): Promise<PrMessage[]>;

  updateStatus(id: number, status: PrStatus): Promise<void>;
}
