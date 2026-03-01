import crypto from "node:crypto";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { AuthModule, AuthCallbackResult } from "../core/modules/auth.js";
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
    app.get("/api/auth/gitlab", this.gitlabRedirect.bind(this));
    app.get("/api/auth/gitlab/callback", this.gitlabCallback.bind(this));
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

  // --- Login provider redirects (shared pattern) ---

  private async githubRedirect(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    this.loginProviderRedirect(reply, this.auth.getGithubAuthUrl(crypto.randomBytes(16).toString("hex")));
  }

  private async googleRedirect(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const url = this.auth.getGoogleAuthUrl(crypto.randomBytes(16).toString("hex"));
    if (!url) { reply.code(404).send({ error: "Google OAuth is not configured" }); return; }
    this.loginProviderRedirect(reply, url);
  }

  private async gitlabRedirect(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const url = this.auth.getGitlabAuthUrl(crypto.randomBytes(16).toString("hex"));
    if (!url) { reply.code(404).send({ error: "GitLab OAuth is not configured" }); return; }
    this.loginProviderRedirect(reply, url);
  }

  private loginProviderRedirect(reply: FastifyReply, url: string): void {
    reply.redirect(url);
  }

  // --- Login provider callbacks (shared pattern) ---

  private async githubCallback(
    request: FastifyRequest<{ Querystring: { code: string; state?: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    await this.loginProviderCallback(request, reply, (code, userId) =>
      this.auth.handleGithubCallback(code, userId),
    );
  }

  private async googleCallback(
    request: FastifyRequest<{ Querystring: { code: string; state?: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    await this.loginProviderCallback(request, reply, (code, userId) =>
      this.auth.handleGoogleCallback(code, userId),
    );
  }

  private async gitlabCallback(
    request: FastifyRequest<{ Querystring: { code: string; state?: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    await this.loginProviderCallback(request, reply, (code, userId) =>
      this.auth.handleGitlabCallback(code, userId),
    );
  }

  private async loginProviderCallback(
    request: FastifyRequest<{ Querystring: { code: string; state?: string } }>,
    reply: FastifyReply,
    handler: (code: string, existingUserId?: number) => Promise<AuthCallbackResult>,
  ): Promise<void> {
    const { code } = request.query;
    const existingUserId = this.getLoggedInUserId(request);

    try {
      const result = await handler(code, existingUserId);

      if (result.totpRequired && result.totpPendingToken && !existingUserId) {
        this.setTotpPendingCookie(reply, result.totpPendingToken);
        reply.redirect(`${this.config.frontendUrl}/verify-totp`);
        return;
      }

      this.setAuthCookies(reply, result.accessToken!, result.refreshToken!);
      reply.redirect(existingUserId ? `${this.config.frontendUrl}/profile` : this.config.frontendUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      reply.redirect(`${this.config.frontendUrl}/auth/error?message=${encodeURIComponent(message)}`);
    }
  }

  // --- Binding provider redirects + callbacks (Discord/Slack) ---

  private async discordRedirect(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const state = crypto.randomBytes(16).toString("hex");
    reply.redirect(this.auth.getDiscordAuthUrl(state));
  }

  private async discordCallback(
    request: FastifyRequest<{ Querystring: { code: string; state?: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    await this.bindingProviderCallback(request, reply, "Discord", (code, userId) =>
      this.auth.handleDiscordCallback(code, userId),
    );
  }

  private async slackRedirect(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const state = crypto.randomBytes(16).toString("hex");
    reply.redirect(this.auth.getSlackAuthUrl(state));
  }

  private async slackCallback(
    request: FastifyRequest<{ Querystring: { code: string; state?: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    await this.bindingProviderCallback(request, reply, "Slack", (code, userId) =>
      this.auth.handleSlackCallback(code, userId),
    );
  }

  private async bindingProviderCallback(
    request: FastifyRequest<{ Querystring: { code: string; state?: string } }>,
    reply: FastifyReply,
    providerName: string,
    handler: (code: string, userId: number) => Promise<void>,
  ): Promise<void> {
    const { code } = request.query;
    const token = request.cookies?.accessToken;

    if (!token) {
      reply.redirect(`${this.config.frontendUrl}/auth/error?message=${encodeURIComponent(`Must be logged in to bind ${providerName}`)}`);
      return;
    }

    try {
      const payload = this.auth.verifyAccessToken(token);
      const userId = parseInt(payload.sub, 10);
      await handler(code, userId);
      reply.redirect(`${this.config.frontendUrl}/profile`);
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to bind ${providerName}`;
      reply.redirect(`${this.config.frontendUrl}/auth/error?message=${encodeURIComponent(message)}`);
    }
  }

  // --- Profile ---

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
    const gitlabIdentity = identities.find((i) => i.provider === "gitlab");
    const discordIdentity = identities.find((i) => i.provider === "discord");
    const slackIdentity = identities.find((i) => i.provider === "slack");

    reply.send({
      id: profile.id,
      providerUserId: githubIdentity?.providerUserId ?? null,
      providerUsername: githubIdentity?.providerUsername ?? null,
      discordBound: !!discordIdentity,
      slackBound: !!slackIdentity,
      githubBound: !!githubIdentity,
      googleBound: !!googleIdentity,
      googleEmail: googleIdentity?.providerEmail ?? null,
      gitlabBound: !!gitlabIdentity,
      gitlabUsername: gitlabIdentity?.providerUsername ?? null,
      totpEnabled,
      identities: identities.map((i) => ({
        provider: i.provider,
        providerUserId: i.providerUserId,
        providerEmail: i.providerEmail,
        providerUsername: i.providerUsername,
      })),
    });
  }

  // --- Token management ---

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

  // --- Helpers ---

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
