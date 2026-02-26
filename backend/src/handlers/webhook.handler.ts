import crypto from "node:crypto";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { NotifierModule } from "../core/modules/notifier.js";
import type { IdempotencyStore } from "../infrastructure/redis/idempotency.js";
import type { AppLogger } from "../infrastructure/logger/logger.js";

export class WebhookHandler {
  constructor(
    private readonly notifier: NotifierModule,
    private readonly idempotency: IdempotencyStore,
    private readonly webhookSecret: string,
    private readonly logger: AppLogger,
  ) {}

  register(app: FastifyInstance): void {
    app.post("/api/webhook/github", {
      config: { rawBody: true },
      handler: this.handle.bind(this),
    });
  }

  private async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // Verify HMAC signature
    const signature = request.headers["x-hub-signature-256"] as string | undefined;
    if (!signature) {
      reply.code(401).send({ error: "Missing signature" });
      return;
    }

    const body = JSON.stringify(request.body);
    const expected = "sha256=" + crypto
      .createHmac("sha256", this.webhookSecret)
      .update(body)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      reply.code(401).send({ error: "Invalid signature" });
      return;
    }

    // Idempotency check
    const deliveryId = request.headers["x-github-delivery"] as string | undefined;
    if (!deliveryId) {
      reply.code(400).send({ error: "Missing delivery ID" });
      return;
    }

    const isDuplicate = await this.idempotency.isDuplicate(deliveryId);
    if (isDuplicate) {
      reply.code(200).send({ status: "already processed" });
      return;
    }

    // Respond immediately, process async
    reply.code(202).send({ status: "accepted" });

    const eventType = request.headers["x-github-event"] as string;
    const payload = request.body as Record<string, unknown>;

    setImmediate(() => {
      this.processEvent(eventType, payload, deliveryId).catch((err) => {
        this.logger.error("Failed to process webhook event", {
          error: String(err),
          deliveryId,
          eventType,
        });
      });
    });
  }

  private async processEvent(
    eventType: string,
    payload: Record<string, unknown>,
    deliveryId: string,
  ): Promise<void> {
    await this.notifier.recordEvent(deliveryId, eventType);

    if (eventType === "pull_request") {
      await this.handlePullRequest(payload);
    } else if (eventType === "issue_comment") {
      await this.handleIssueComment(payload);
    }
  }

  private async handlePullRequest(payload: Record<string, unknown>): Promise<void> {
    const action = payload.action as string;
    const pr = payload.pull_request as Record<string, unknown>;
    const repo = (payload.repository as Record<string, unknown>).full_name as string;

    if (action === "opened") {
      await this.notifier.handlePrOpened({
        prId: pr.number as number,
        repo,
        title: pr.title as string,
        author: (pr.user as Record<string, unknown>).login as string,
        url: pr.html_url as string,
      });
    } else if (action === "closed") {
      await this.notifier.handlePrClosed({
        prId: pr.number as number,
        repo,
        merged: pr.merged as boolean,
      });
    }
  }

  private async handleIssueComment(payload: Record<string, unknown>): Promise<void> {
    const comment = payload.comment as Record<string, unknown>;
    const issue = payload.issue as Record<string, unknown>;
    const repo = (payload.repository as Record<string, unknown>).full_name as string;
    const body = comment.body as string;

    // Parse @mentions from comment body
    const mentionRegex = /@([a-zA-Z0-9-]+)/g;
    const mentions: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = mentionRegex.exec(body)) !== null) {
      mentions.push(match[1]);
    }

    if (mentions.length > 0) {
      await this.notifier.handleComment({
        repo,
        prTitle: issue.title as string,
        prUrl: issue.html_url as string,
        commenter: (comment.user as Record<string, unknown>).login as string,
        body,
        mentionedUsernames: mentions,
      });
    }
  }
}
