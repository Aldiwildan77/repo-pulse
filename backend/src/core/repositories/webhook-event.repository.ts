import type { WebhookEvent } from "../entities/index.js";

export interface WebhookEventRepository {
  create(data: { eventId: string; eventType: string }): Promise<WebhookEvent>;

  existsByEventId(eventId: string): Promise<boolean>;
}
