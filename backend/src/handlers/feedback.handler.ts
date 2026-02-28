import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { FeedbackModule } from "../core/modules/feedback.js";
import type { AuthMiddleware } from "./middleware/auth.middleware.js";

export class FeedbackHandler {
  constructor(
    private readonly feedback: FeedbackModule,
    private readonly authMiddleware: AuthMiddleware,
  ) {}

  register(app: FastifyInstance): void {
    app.post("/api/feedback", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.create.bind(this),
    });
  }

  private async create(
    request: FastifyRequest<{ Body: { message: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { message } = request.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      reply.code(400).send({ message: "Message is required" });
      return;
    }

    const userId = parseInt(request.userId!, 10);

    await this.feedback.create({
      userId,
      message: message.trim(),
    });

    reply.code(201).send({ success: true });
  }
}
