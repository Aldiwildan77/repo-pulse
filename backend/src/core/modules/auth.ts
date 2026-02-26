import type { Config } from "../../infrastructure/config.js";
import type { UserBindingRepository } from "../repositories/user-binding.repository.js";
import type { JwtService } from "../../infrastructure/auth/jwt.js";
import type { GitHubOAuthService } from "../../infrastructure/auth/github-oauth.js";
import type { DiscordOAuthService } from "../../infrastructure/auth/discord-oauth.js";
import type { SlackOAuthService } from "../../infrastructure/auth/slack-oauth.js";
import type { UserBinding } from "../entities/index.js";

export class AuthModule {
  constructor(
    private readonly config: Config,
    private readonly userBindingRepo: UserBindingRepository,
    private readonly githubOAuth: GitHubOAuthService,
    private readonly discordOAuth: DiscordOAuthService,
    private readonly slackOAuth: SlackOAuthService,
    private readonly jwt: JwtService,
  ) {}

  getGithubAuthUrl(state: string): string {
    return this.githubOAuth.getAuthorizationUrl(state);
  }

  getDiscordAuthUrl(state: string): string {
    return this.discordOAuth.getAuthorizationUrl(state);
  }

  getSlackAuthUrl(state: string): string {
    return this.slackOAuth.getAuthorizationUrl(state);
  }

  async handleGithubCallback(code: string): Promise<{ accessToken: string; refreshToken: string; user: UserBinding }> {
    const oauthToken = await this.githubOAuth.exchangeCode(code);
    const ghUser = await this.githubOAuth.getUser(oauthToken);

    const user = await this.userBindingRepo.upsert({
      providerUserId: ghUser.id,
      providerUsername: ghUser.login,
    });

    const tokenPayload = { sub: ghUser.id, username: ghUser.login };
    const accessToken = this.jwt.signAccessToken(tokenPayload);
    const refreshToken = this.jwt.signRefreshToken(tokenPayload);

    return { accessToken, refreshToken, user };
  }

  async handleDiscordCallback(code: string, providerUserId: string): Promise<void> {
    const oauthToken = await this.discordOAuth.exchangeCode(code);
    const discordUser = await this.discordOAuth.getUser(oauthToken);
    await this.userBindingRepo.updateDiscord(providerUserId, discordUser.id);
  }

  async handleSlackCallback(code: string, providerUserId: string): Promise<void> {
    const result = await this.slackOAuth.exchangeCode(code);
    await this.userBindingRepo.updateSlack(providerUserId, result.userId);
  }

  async getProfile(providerUserId: string): Promise<UserBinding | null> {
    return this.userBindingRepo.findByProviderUserId(providerUserId);
  }

  verifyAccessToken(token: string): { sub: string; username: string } {
    return this.jwt.verifyAccessToken(token);
  }

  refreshTokens(refreshToken: string): { accessToken: string; refreshToken: string } {
    const payload = this.jwt.verifyRefreshToken(refreshToken);
    const tokenPayload = { sub: payload.sub, username: payload.username };
    return {
      accessToken: this.jwt.signAccessToken(tokenPayload),
      refreshToken: this.jwt.signRefreshToken(tokenPayload),
    };
  }
}
