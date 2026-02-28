import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthModule } from "../../core/modules/auth.js";

export class AuthMiddleware {
  constructor(private readonly auth: AuthModule) {}

  preHandler = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const token = request.cookies?.accessToken;

    if (!token) {
      reply.code(401).send({ error: "Unauthorized" });
      return;
    }

    try {
      const payload = this.auth.verifyAccessToken(token);
      request.userId = payload.sub;
    } catch {
      reply.code(401).send({ error: "Invalid token" });
    }
  };
}
