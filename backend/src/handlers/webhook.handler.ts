import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { NotifierModule } from "../core/modules/notifier.js";
import type { IdempotencyStore } from "../infrastructure/redis/idempotency.js";
import type { RateLimiter } from "../infrastructure/rate-limiter/rate-limiter.js";
import type { AppLogger } from "../infrastructure/logger/logger.js";
import type { WebhookProvider, WebhookEvent } from "../core/webhook/webhook-provider.js";

export class WebhookHandler {
  private readonly providerMap: Map<string, WebhookProvider>;

  constructor(
    private readonly notifier: NotifierModule,
    private readonly idempotency: IdempotencyStore,
    private readonly rateLimiter: RateLimiter,
    private readonly logger: AppLogger,
    providers: WebhookProvider[],
  ) {
    this.providerMap = new Map(providers.map((p) => [p.name, p]));
  }

  register(app: FastifyInstance): void {
    app.post<{ Params: { providerName: string } }>(
      "/api/webhook/:providerName",
      {
        config: { rawBody: true },
        handler: this.handle.bind(this),
      },
    );
  }

  private async handle(
    request: FastifyRequest<{ Params: { providerName: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { providerName } = request.params;
    const provider = this.providerMap.get(providerName);

    if (!provider) {
      reply.code(404).send({ error: "Unknown provider" });
      return;
    }

    // Verify signature
    if (!provider.verifySignature(request)) {
      this.logger.warn("Webhook signature verification failed", {
        provider: providerName,
        hasRawBody: !!request.rawBody,
        rawBodyLength: request.rawBody ? Buffer.byteLength(request.rawBody) : 0,
        hasSignatureHeader: !!request.headers["x-hub-signature-256"],
        contentType: request.headers["content-type"] ?? "unknown",
      });
      reply.code(401).send({ error: "Invalid signature" });
      return;
    }

    // Rate limit check
    const allowed = await this.rateLimiter.isAllowed(`webhook:${providerName}`);
    if (!allowed) {
      reply.code(429).send({ error: "Rate limit exceeded" });
      return;
    }

    // Idempotency check
    const deliveryId = provider.extractDeliveryId(request);
    if (!deliveryId) {
      reply.code(400).send({ error: "Missing delivery ID" });
      return;
    }

    const idempotencyKey = `${providerName}:${deliveryId}`;
    const isDuplicate = await this.idempotency.isDuplicate(idempotencyKey);
    if (isDuplicate) {
      reply.code(200).send({ status: "already processed" });
      return;
    }

    // Respond immediately, process async
    reply.code(202).send({ status: "accepted" });

    const event = provider.parseEvent(request);

    setImmediate(() => {
      this.processEvent(event, idempotencyKey).catch((err) => {
        this.logger.error("Failed to process webhook event", {
          error: String(err),
          deliveryId: idempotencyKey,
          provider: providerName,
        });
      });
    });
  }

  private async processEvent(event: WebhookEvent, idempotencyKey: string): Promise<void> {
    await this.notifier.recordEvent(idempotencyKey, event.kind);

    switch (event.kind) {
      case "pr_opened":
        await this.notifier.handlePrOpened(event.data);
        break;
      case "pr_closed":
        await this.notifier.handlePrClosed(event.data);
        break;
      case "pr_label_changed":
        await this.notifier.handlePrLabelChanged(event.data);
        break;
      case "issue_opened":
        await this.notifier.handleIssueOpened(event.data);
        break;
      case "issue_closed":
        await this.notifier.handleIssueClosed(event.data);
        break;
      case "comment":
        await this.notifier.handleComment(event.data);
        break;
      case "installation_created":
        await this.notifier.handleInstallationCreated(event.data);
        break;
      case "installation_deleted":
        await this.notifier.handleInstallationDeleted(event.data);
        break;
      case "installation_repos_changed":
        await this.notifier.handleInstallationReposChanged(event.data);
        break;
      case "ignored":
        break;
    }
  }
}
