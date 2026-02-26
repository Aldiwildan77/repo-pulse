import type { FastifyRequest } from "fastify";
import type { PrOpenedEvent, PrClosedEvent, CommentEvent } from "../modules/notifier.js";

export type SourceProvider = "github" | "gitlab" | "bitbucket";

export type WebhookEvent =
  | { kind: "pr_opened"; data: PrOpenedEvent }
  | { kind: "pr_closed"; data: PrClosedEvent }
  | { kind: "comment"; data: CommentEvent }
  | { kind: "ignored" };

export interface WebhookProvider {
  readonly name: SourceProvider;
  verifySignature(request: FastifyRequest): boolean;
  extractDeliveryId(request: FastifyRequest): string | null;
  parseEvent(request: FastifyRequest): WebhookEvent;
}
