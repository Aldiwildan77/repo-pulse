import type { Kysely } from "kysely";
import { sql } from "kysely";
import type { Database } from "../../infrastructure/database/types.js";
import type { NotifierLogRepository } from "../../core/repositories/notifier-log.repository.js";
import type { NotifierLog } from "../../core/entities/notifier-log.js";
import { toNotifierLog } from "./dto.js";

export class KyselyNotifierLogRepository implements NotifierLogRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async create(data: {
    repoConfigId: number;
    eventType: string;
    status: string;
    platform: string;
    summary: string;
    errorMessage?: string | null;
  }): Promise<NotifierLog> {
    const row = await this.db
      .insertInto("notifier_logs")
      .values({
        repo_config_id: data.repoConfigId,
        event_type: data.eventType,
        status: data.status,
        platform: data.platform,
        summary: data.summary,
        error_message: data.errorMessage ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return toNotifierLog(row);
  }

  async findByRepoConfig(
    repoConfigId: number,
    limit: number,
    offset: number,
  ): Promise<{ logs: NotifierLog[]; total: number }> {
    const [rows, countResult] = await Promise.all([
      this.db
        .selectFrom("notifier_logs")
        .selectAll()
        .where("repo_config_id", "=", repoConfigId)
        .orderBy("created_at", "desc")
        .limit(limit)
        .offset(offset)
        .execute(),
      this.db
        .selectFrom("notifier_logs")
        .select(sql<number>`count(*)::int`.as("count"))
        .where("repo_config_id", "=", repoConfigId)
        .executeTakeFirstOrThrow(),
    ]);

    return {
      logs: rows.map(toNotifierLog),
      total: countResult.count,
    };
  }
}
