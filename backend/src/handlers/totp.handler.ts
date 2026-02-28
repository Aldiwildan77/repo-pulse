import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { TotpModule } from "../core/modules/totp.js";
import type { AuthModule } from "../core/modules/auth.js";
import type { Config } from "../infrastructure/config.js";
import type { AuthMiddleware } from "./middleware/auth.middleware.js";

const ACCESS_TOKEN_MAX_AGE = 15 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;
const TOTP_PENDING_MAX_AGE = 5 * 60;

export class TotpHandler {
  constructor(
    private readonly totp: TotpModule,
    private readonly auth: AuthModule,
    private readonly config: Config,
    private readonly authMiddleware: AuthMiddleware,
  ) {}

  register(app: FastifyInstance): void {
    app.get("/api/auth/totp/status", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.status.bind(this),
    });
    app.post("/api/auth/totp/setup", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.setup.bind(this),
    });
    app.post("/api/auth/totp/confirm", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.confirm.bind(this),
    });
    app.post("/api/auth/totp/disable", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.disable.bind(this),
    });
    app.post("/api/auth/totp/verify-login", this.verifyLogin.bind(this));
  }

  private async status(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = parseInt(request.userId!, 10);
    const enabled = await this.totp.isTotpEnabled(userId);
    reply.send({ enabled });
  }

  private async setup(
    request: FastifyRequest<{ Body: { username?: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = parseInt(request.userId!, 10);
    const username = request.body?.username ?? `user-${userId}`;
    const result = await this.totp.beginSetup(userId, username);
    reply.send(result);
  }

  private async confirm(
    request: FastifyRequest<{ Body: { code: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = parseInt(request.userId!, 10);
    const { code } = request.body;

    if (!code) {
      reply.code(400).send({ error: "Code is required" });
      return;
    }

    const success = await this.totp.confirmSetup(userId, code);
    if (!success) {
      reply.code(400).send({ error: "Invalid code" });
      return;
    }

    reply.send({ status: "ok" });
  }

  private async disable(
    request: FastifyRequest<{ Body: { code: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = parseInt(request.userId!, 10);
    const { code } = request.body;

    if (!code) {
      reply.code(400).send({ error: "Code is required" });
      return;
    }

    const success = await this.totp.disable(userId, code);
    if (!success) {
      reply.code(400).send({ error: "Invalid code" });
      return;
    }

    reply.send({ status: "ok" });
  }

  private async verifyLogin(
    request: FastifyRequest<{ Body: { code: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const pendingToken = request.cookies?.totpPendingToken;
    if (!pendingToken) {
      reply.code(401).send({ error: "No pending TOTP session" });
      return;
    }

    let payload: { sub: string };
    try {
      payload = this.totp.verifyTotpPendingToken(pendingToken);
    } catch {
      reply.code(401).send({ error: "TOTP session expired" });
      return;
    }

    const { code } = request.body;
    if (!code) {
      reply.code(400).send({ error: "Code is required" });
      return;
    }

    const userId = parseInt(payload.sub, 10);
    const valid = await this.totp.verifyCode(userId, code);
    if (!valid) {
      reply.code(400).send({ error: "Invalid code" });
      return;
    }

    // Clear the pending token and issue real tokens
    const tokens = this.auth.issueTokens(userId);

    reply
      .clearCookie("totpPendingToken", {
        path: "/",
        ...(this.config.cookieDomain && { domain: this.config.cookieDomain }),
      })
      .setCookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: ACCESS_TOKEN_MAX_AGE,
        ...(this.config.cookieDomain && { domain: this.config.cookieDomain }),
      })
      .setCookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/api/auth",
        maxAge: REFRESH_TOKEN_MAX_AGE,
        ...(this.config.cookieDomain && { domain: this.config.cookieDomain }),
      })
      .send({ status: "ok" });
  }
}
