import type { NotifierLog } from "../entities/notifier-log.js";

export interface NotifierLogRepository {
  create(data: {
    repoConfigId: number;
    eventType: string;
    status: string;
    platform: string;
    summary: string;
    errorMessage?: string | null;
  }): Promise<NotifierLog>;

  findByRepoConfig(
    repoConfigId: number,
    limit: number,
    offset: number,
  ): Promise<{ logs: NotifierLog[]; total: number }>;
}
