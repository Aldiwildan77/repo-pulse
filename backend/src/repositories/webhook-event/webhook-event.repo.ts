import type { Kysely } from "kysely";
import type { Database } from "../../infrastructure/database/types.js";
import type { WebhookEventRepository } from "../../core/repositories/webhook-event.repository.js";
import type { WebhookEvent } from "../../core/entities/index.js";

export class KyselyWebhookEventRepository implements WebhookEventRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async create(data: { eventId: string; eventType: string; payload?: unknown }): Promise<WebhookEvent> {
    const row = await this.db
      .insertInto("webhook_event_logs")
      .values({
        event_id: data.eventId,
        event_type: data.eventType,
        payload: data.payload != null ? JSON.stringify(data.payload) : null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      id: row.id,
      eventId: row.event_id,
      eventType: row.event_type,
      payload: row.payload,
      processedAt: row.processed_at,
    };
  }

  async existsByEventId(eventId: string): Promise<boolean> {
    const row = await this.db
      .selectFrom("webhook_event_logs")
      .select("id")
      .where("event_id", "=", eventId)
      .executeTakeFirst();

    return row !== undefined;
  }
}
