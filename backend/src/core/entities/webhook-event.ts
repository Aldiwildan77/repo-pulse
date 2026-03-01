export interface WebhookEvent {
  id: number;
  eventId: string;
  eventType: string;
  payload: unknown | null;
  processedAt: Date;
}
