import type { FastifyRequest } from "fastify";
import type { PrOpenedEvent, PrClosedEvent, CommentEvent, PrLabelChangedEvent, IssueOpenedEvent, IssueClosedEvent } from "../modules/notifier.js";

export type SourceProvider = "github" | "gitlab" | "bitbucket";

export interface InstallationCreatedEvent {
  provider: SourceProvider;
  installationId: string;
  senderUserId: string;
  repos: string[];
}

export interface InstallationDeletedEvent {
  provider: SourceProvider;
  installationId: string;
}

export interface InstallationReposChangedEvent {
  provider: SourceProvider;
  installationId: string;
  senderUserId: string;
  added: string[];
  removed: string[];
}

export type WebhookEvent =
  | { kind: "pr_opened"; data: PrOpenedEvent }
  | { kind: "pr_closed"; data: PrClosedEvent }
  | { kind: "pr_label_changed"; data: PrLabelChangedEvent }
  | { kind: "comment"; data: CommentEvent }
  | { kind: "issue_opened"; data: IssueOpenedEvent }
  | { kind: "issue_closed"; data: IssueClosedEvent }
  | { kind: "installation_created"; data: InstallationCreatedEvent }
  | { kind: "installation_deleted"; data: InstallationDeletedEvent }
  | { kind: "installation_repos_changed"; data: InstallationReposChangedEvent }
  | { kind: "ignored" };

export interface WebhookProvider {
  readonly name: SourceProvider;
  verifySignature(request: FastifyRequest): boolean;
  extractDeliveryId(request: FastifyRequest): string | null;
  parseEvent(request: FastifyRequest): WebhookEvent;
}
