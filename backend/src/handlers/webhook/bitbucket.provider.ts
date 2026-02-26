import crypto from "node:crypto";
import type { FastifyRequest } from "fastify";
import type { WebhookProvider, WebhookEvent } from "../../core/webhook/webhook-provider.js";

export class BitbucketWebhookProvider implements WebhookProvider {
  readonly name = "bitbucket" as const;

  constructor(private readonly secret: string) {}

  verifySignature(request: FastifyRequest): boolean {
    const signature = request.headers["x-hub-signature"] as string | undefined;
    if (!signature) return false;

    const body = request.rawBody;
    if (!body) return false;

    const expected =
      "sha256=" +
      crypto.createHmac("sha256", this.secret).update(body).digest("hex");

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  extractDeliveryId(request: FastifyRequest): string | null {
    const uuid = request.headers["x-request-uuid"] as string | undefined;
    if (uuid) return uuid;

    // Fallback: hash the raw body to produce a stable delivery ID
    const body = request.rawBody;
    if (!body) return null;
    return crypto.createHash("sha256").update(body).digest("hex");
  }

  parseEvent(request: FastifyRequest): WebhookEvent {
    const eventKey = request.headers["x-event-key"] as string;
    const payload = request.body as Record<string, unknown>;

    switch (eventKey) {
      case "pullrequest:created":
        return this.parsePrCreated(payload);
      case "pullrequest:fulfilled":
        return this.parsePrClosed(payload, true);
      case "pullrequest:rejected":
        return this.parsePrClosed(payload, false);
      case "pullrequest:comment_created":
        return this.parseComment(payload);
      default:
        return { kind: "ignored" };
    }
  }

  private parsePrCreated(payload: Record<string, unknown>): WebhookEvent {
    const pr = payload.pullrequest as Record<string, unknown>;
    const repo = (payload.repository as Record<string, unknown>).full_name as string;
    const author = pr.author as Record<string, unknown>;
    const links = pr.links as Record<string, unknown>;
    const htmlLink = links.html as Record<string, unknown>;

    return {
      kind: "pr_opened",
      data: {
        prId: pr.id as number,
        repo,
        title: pr.title as string,
        author: author.nickname as string,
        url: htmlLink.href as string,
      },
    };
  }

  private parsePrClosed(payload: Record<string, unknown>, merged: boolean): WebhookEvent {
    const pr = payload.pullrequest as Record<string, unknown>;
    const repo = (payload.repository as Record<string, unknown>).full_name as string;

    return {
      kind: "pr_closed",
      data: {
        prId: pr.id as number,
        repo,
        merged,
      },
    };
  }

  private parseComment(payload: Record<string, unknown>): WebhookEvent {
    const comment = payload.comment as Record<string, unknown>;
    const pr = payload.pullrequest as Record<string, unknown>;
    const repo = (payload.repository as Record<string, unknown>).full_name as string;
    const actor = payload.actor as Record<string, unknown>;
    const body = (comment.content as Record<string, unknown>).raw as string;

    const links = pr.links as Record<string, unknown>;
    const htmlLink = links.html as Record<string, unknown>;

    const mentionRegex = /@([a-zA-Z0-9_.-]+)/g;
    const mentions: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = mentionRegex.exec(body)) !== null) {
      mentions.push(match[1]);
    }

    if (mentions.length === 0) {
      return { kind: "ignored" };
    }

    return {
      kind: "comment",
      data: {
        repo,
        prTitle: pr.title as string,
        prUrl: htmlLink.href as string,
        commenter: actor.nickname as string,
        body,
        mentionedUsernames: mentions,
      },
    };
  }
}
