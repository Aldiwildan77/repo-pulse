import crypto from "node:crypto";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { AuthModule } from "../core/modules/auth.js";
import type { Config } from "../infrastructure/config.js";
import type { AuthMiddleware } from "./middleware/auth.middleware.js";

const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
const TOTP_PENDING_MAX_AGE = 5 * 60; // 5 minutes

export class AuthHandler {
  constructor(
    private readonly auth: AuthModule,
    private readonly config: Config,
    private readonly authMiddleware: AuthMiddleware,
  ) {}

  register(app: FastifyInstance): void {
    app.get("/api/auth/providers", this.getProviders.bind(this));
    app.get("/api/auth/github", this.githubRedirect.bind(this));
    app.get("/api/auth/github/callback", this.githubCallback.bind(this));
    app.get("/api/auth/google", this.googleRedirect.bind(this));
    app.get("/api/auth/google/callback", this.googleCallback.bind(this));
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

  private async getProviders(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    reply.send({ providers: this.auth.getAvailableLoginProviders() });
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

    // Check if user is already logged in (binding mode)
    const existingUserId = this.getLoggedInUserId(request);

    const result = await this.auth.handleGithubCallback(code, existingUserId);

    if (result.totpRequired && result.totpPendingToken && !existingUserId) {
      this.setTotpPendingCookie(reply, result.totpPendingToken);
      reply.redirect(`${this.config.frontendUrl}/verify-totp`);
      return;
    }

    this.setAuthCookies(reply, result.accessToken!, result.refreshToken!);

    // Binding redirects to profile; login redirects to home
    reply.redirect(existingUserId ? `${this.config.frontendUrl}/profile` : this.config.frontendUrl);
  }

  private async googleRedirect(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const state = crypto.randomBytes(16).toString("hex");
    const url = this.auth.getGoogleAuthUrl(state);
    if (!url) {
      reply.code(404).send({ error: "Google OAuth is not configured" });
      return;
    }
    reply.redirect(url);
  }

  private async googleCallback(
    request: FastifyRequest<{ Querystring: { code: string; state?: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { code } = request.query;

    // Check if user is already logged in (binding mode)
    const existingUserId = this.getLoggedInUserId(request);

    const result = await this.auth.handleGoogleCallback(code, existingUserId);

    if (result.totpRequired && result.totpPendingToken && !existingUserId) {
      this.setTotpPendingCookie(reply, result.totpPendingToken);
      reply.redirect(`${this.config.frontendUrl}/verify-totp`);
      return;
    }

    this.setAuthCookies(reply, result.accessToken!, result.refreshToken!);

    reply.redirect(existingUserId ? `${this.config.frontendUrl}/profile` : this.config.frontendUrl);
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
    const userId = parseInt(payload.sub, 10);
    await this.auth.handleDiscordCallback(code, userId);

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
    const userId = parseInt(payload.sub, 10);
    await this.auth.handleSlackCallback(code, userId);

    reply.redirect(`${this.config.frontendUrl}/profile`);
  }

  private async me(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = parseInt(request.userId!, 10);
    const profile = await this.auth.getProfile(userId);
    if (!profile) {
      reply.code(404).send({ error: "User not found" });
      return;
    }

    const identities = await this.auth.getIdentities(userId);
    const totpEnabled = await this.auth.isTotpEnabled(userId);

    const githubIdentity = identities.find((i) => i.provider === "github");
    const googleIdentity = identities.find((i) => i.provider === "google");

    reply.send({
      id: profile.id,
      providerUserId: githubIdentity?.providerUserId ?? null,
      providerUsername: githubIdentity?.providerUsername ?? null,
      discordBound: !!profile.discordUserId,
      slackBound: !!profile.slackUserId,
      githubBound: !!githubIdentity,
      googleBound: !!googleIdentity,
      googleEmail: googleIdentity?.providerEmail ?? null,
      totpEnabled,
      identities: identities.map((i) => ({
        provider: i.provider,
        providerUserId: i.providerUserId,
        providerEmail: i.providerEmail,
        providerUsername: i.providerUsername,
      })),
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
      this.setAuthCookies(reply, accessToken, refreshToken);
      reply.send({ status: "ok" });
    } catch {
      reply.code(401).send({ error: "Invalid refresh token" });
    }
  }

  private async logout(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    reply
      .clearCookie("accessToken", {
        path: "/",
        ...(this.config.cookieDomain && { domain: this.config.cookieDomain }),
      })
      .clearCookie("refreshToken", {
        path: "/api/auth",
        ...(this.config.cookieDomain && { domain: this.config.cookieDomain }),
      })
      .send({ status: "ok" });
  }

  private getLoggedInUserId(request: FastifyRequest): number | undefined {
    const token = request.cookies?.accessToken;
    if (!token) return undefined;
    try {
      const payload = this.auth.verifyAccessToken(token);
      return parseInt(payload.sub, 10);
    } catch {
      return undefined;
    }
  }

  private setTotpPendingCookie(reply: FastifyReply, token: string): void {
    reply.setCookie("totpPendingToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: TOTP_PENDING_MAX_AGE,
      ...(this.config.cookieDomain && { domain: this.config.cookieDomain }),
    });
  }

  private setAuthCookies(reply: FastifyReply, accessToken: string, refreshToken: string): void {
    reply
      .setCookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: ACCESS_TOKEN_MAX_AGE,
        ...(this.config.cookieDomain && { domain: this.config.cookieDomain }),
      })
      .setCookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/api/auth",
        maxAge: REFRESH_TOKEN_MAX_AGE,
        ...(this.config.cookieDomain && { domain: this.config.cookieDomain }),
      });
  }
}
