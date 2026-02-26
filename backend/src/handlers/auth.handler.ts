import crypto from "node:crypto";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { AuthModule } from "../core/modules/auth.js";
import type { Config } from "../infrastructure/config.js";
import type { AuthMiddleware } from "./middleware/auth.middleware.js";

const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export class AuthHandler {
  constructor(
    private readonly auth: AuthModule,
    private readonly config: Config,
    private readonly authMiddleware: AuthMiddleware,
  ) {}

  register(app: FastifyInstance): void {
    app.get("/api/auth/github", this.githubRedirect.bind(this));
    app.get("/api/auth/github/callback", this.githubCallback.bind(this));
    app.get("/api/auth/discord", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.discordRedirect.bind(this),
    });
    app.get("/api/auth/discord/callback", this.discordCallback.bind(this));
    app.get("/api/auth/slack", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.slackRedirect.bind(this),
    });
    app.get("/api/auth/slack/callback", this.slackCallback.bind(this));
    app.get("/api/auth/me", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.me.bind(this),
    });
    app.post("/api/auth/refresh", this.refresh.bind(this));
    app.post("/api/auth/logout", this.logout.bind(this));
  }

  private async githubRedirect(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const state = crypto.randomBytes(16).toString("hex");
    const url = this.auth.getGithubAuthUrl(state);
    reply.redirect(url);
  }

  private async githubCallback(
    request: FastifyRequest<{ Querystring: { code: string; state?: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { code } = request.query;

    const { accessToken, refreshToken } = await this.auth.handleGithubCallback(code);

    reply
      .setCookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: ACCESS_TOKEN_MAX_AGE,
      })
      .setCookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/api/auth",
        maxAge: REFRESH_TOKEN_MAX_AGE,
      })
      .redirect(this.config.frontendUrl);
  }

  private async discordRedirect(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const state = crypto.randomBytes(16).toString("hex");
    const url = this.auth.getDiscordAuthUrl(state);
    reply.redirect(url);
  }

  private async discordCallback(
    request: FastifyRequest<{ Querystring: { code: string; state?: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { code } = request.query;
    const token = request.cookies?.accessToken;

    if (!token) {
      reply.code(401).send({ error: "Must be logged in to bind Discord" });
      return;
    }

    const payload = this.auth.verifyAccessToken(token);
    await this.auth.handleDiscordCallback(code, payload.sub);

    reply.redirect(`${this.config.frontendUrl}/profile`);
  }

  private async slackRedirect(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const state = crypto.randomBytes(16).toString("hex");
    const url = this.auth.getSlackAuthUrl(state);
    reply.redirect(url);
  }

  private async slackCallback(
    request: FastifyRequest<{ Querystring: { code: string; state?: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { code } = request.query;
    const token = request.cookies?.accessToken;

    if (!token) {
      reply.code(401).send({ error: "Must be logged in to bind Slack" });
      return;
    }

    const payload = this.auth.verifyAccessToken(token);
    await this.auth.handleSlackCallback(code, payload.sub);

    reply.redirect(`${this.config.frontendUrl}/profile`);
  }

  private async me(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const profile = await this.auth.getProfile(request.userId!);
    if (!profile) {
      reply.code(404).send({ error: "User not found" });
      return;
    }

    reply.send({
      providerUserId: profile.providerUserId,
      providerUsername: profile.providerUsername,
      discordBound: !!profile.discordUserId,
      slackBound: !!profile.slackUserId,
    });
  }

  private async refresh(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const token = request.cookies?.refreshToken;

    if (!token) {
      reply.code(401).send({ error: "No refresh token" });
      return;
    }

    try {
      const { accessToken, refreshToken } = this.auth.refreshTokens(token);

      reply
        .setCookie("accessToken", accessToken, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: ACCESS_TOKEN_MAX_AGE,
        })
        .setCookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/api/auth",
          maxAge: REFRESH_TOKEN_MAX_AGE,
        })
        .send({ status: "ok" });
    } catch {
      reply.code(401).send({ error: "Invalid refresh token" });
    }
  }

  private async logout(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    reply
      .clearCookie("accessToken", { path: "/" })
      .clearCookie("refreshToken", { path: "/api/auth" })
      .send({ status: "ok" });
  }
}
