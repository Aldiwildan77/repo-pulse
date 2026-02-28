import type { Config } from "../../infrastructure/config.js";
import type { UserBindingRepository } from "../repositories/user-binding.repository.js";
import type { JwtService } from "../../infrastructure/auth/jwt.js";
import type { GitHubOAuthService } from "../../infrastructure/auth/github-oauth.js";
import type { GoogleOAuthService } from "../../infrastructure/auth/google-oauth.js";
import type { DiscordOAuthService } from "../../infrastructure/auth/discord-oauth.js";
import type { SlackOAuthService } from "../../infrastructure/auth/slack-oauth.js";
import type { KyselyAuthRepository } from "../../repositories/auth/auth.repo.js";
import type { UserBinding, UserIdentity } from "../entities/index.js";

export class AuthModule {
  constructor(
    private readonly config: Config,
    private readonly userBindingRepo: UserBindingRepository,
    private readonly authRepo: KyselyAuthRepository,
    private readonly githubOAuth: GitHubOAuthService,
    private readonly googleOAuth: GoogleOAuthService | null,
    private readonly discordOAuth: DiscordOAuthService,
    private readonly slackOAuth: SlackOAuthService,
    private readonly jwt: JwtService,
  ) {}

  getAvailableLoginProviders(): string[] {
    const providers = ["github"];
    if (this.googleOAuth) providers.push("google");
    return providers;
  }

  getGithubAuthUrl(state: string): string {
    return this.githubOAuth.getAuthorizationUrl(state);
  }

  getGoogleAuthUrl(state: string): string | null {
    return this.googleOAuth?.getAuthorizationUrl(state) ?? null;
  }

  getDiscordAuthUrl(state: string): string {
    return this.discordOAuth.getAuthorizationUrl(state);
  }

  getSlackAuthUrl(state: string): string {
    return this.slackOAuth.getAuthorizationUrl(state);
  }

  async handleGithubCallback(
    code: string,
    existingUserId?: number,
  ): Promise<{ accessToken: string; refreshToken: string; user: UserBinding }> {
    const oauthToken = await this.githubOAuth.exchangeCode(code);
    const ghUser = await this.githubOAuth.getUser(oauthToken);

    // Check if this GitHub identity already exists
    const existingIdentity = await this.authRepo.findIdentity("github", ghUser.id);

    if (existingUserId) {
      // Binding mode: link GitHub to existing user
      if (existingIdentity && existingIdentity.userId !== existingUserId) {
        throw new Error("This GitHub account is already linked to another user");
      }
      if (!existingIdentity) {
        await this.authRepo.addIdentity({
          userId: existingUserId,
          provider: "github",
          providerUserId: ghUser.id,
          providerUsername: ghUser.login,
        });
      }
      const user = await this.authRepo.findUserById(existingUserId);
      if (!user) throw new Error("User not found");

      const tokenPayload = { sub: String(user.id) };
      return {
        accessToken: this.jwt.signAccessToken(tokenPayload),
        refreshToken: this.jwt.signRefreshToken(tokenPayload),
        user,
      };
    }

    // Login mode: find or create user by GitHub identity
    let user: UserBinding;
    if (existingIdentity) {
      user = (await this.authRepo.findUserById(existingIdentity.userId))!;
    } else {
      user = await this.authRepo.createUser();
      await this.authRepo.addIdentity({
        userId: user.id,
        provider: "github",
        providerUserId: ghUser.id,
        providerUsername: ghUser.login,
      });
    }

    const tokenPayload = { sub: String(user.id) };
    return {
      accessToken: this.jwt.signAccessToken(tokenPayload),
      refreshToken: this.jwt.signRefreshToken(tokenPayload),
      user,
    };
  }

  async handleGoogleCallback(
    code: string,
    existingUserId?: number,
  ): Promise<{ accessToken: string; refreshToken: string; user: UserBinding }> {
    if (!this.googleOAuth) {
      throw new Error("Google OAuth is not configured");
    }

    const oauthToken = await this.googleOAuth.exchangeCode(code);
    const googleUser = await this.googleOAuth.getUser(oauthToken);

    // Check if this Google identity already exists
    const existingIdentity = await this.authRepo.findIdentity("google", googleUser.id);

    if (existingUserId) {
      // Binding mode: link Google to existing user
      if (existingIdentity && existingIdentity.userId !== existingUserId) {
        throw new Error("This Google account is already linked to another user");
      }
      if (!existingIdentity) {
        await this.authRepo.addIdentity({
          userId: existingUserId,
          provider: "google",
          providerUserId: googleUser.id,
          providerEmail: googleUser.email,
          providerUsername: googleUser.name,
        });
      }
      const user = await this.authRepo.findUserById(existingUserId);
      if (!user) throw new Error("User not found");

      const tokenPayload = { sub: String(user.id) };
      return {
        accessToken: this.jwt.signAccessToken(tokenPayload),
        refreshToken: this.jwt.signRefreshToken(tokenPayload),
        user,
      };
    }

    // Login mode: find or create user by Google identity
    let user: UserBinding;
    if (existingIdentity) {
      user = (await this.authRepo.findUserById(existingIdentity.userId))!;
    } else {
      user = await this.authRepo.createUser();
      await this.authRepo.addIdentity({
        userId: user.id,
        provider: "google",
        providerUserId: googleUser.id,
        providerEmail: googleUser.email,
        providerUsername: googleUser.name,
      });
    }

    const tokenPayload = { sub: String(user.id) };
    return {
      accessToken: this.jwt.signAccessToken(tokenPayload),
      refreshToken: this.jwt.signRefreshToken(tokenPayload),
      user,
    };
  }

  async handleDiscordCallback(code: string, userId: number): Promise<void> {
    const oauthToken = await this.discordOAuth.exchangeCode(code);
    const discordUser = await this.discordOAuth.getUser(oauthToken);
    await this.userBindingRepo.updateDiscord(userId, discordUser.id);
  }

  async handleSlackCallback(code: string, userId: number): Promise<void> {
    const result = await this.slackOAuth.exchangeCode(code);
    await this.userBindingRepo.updateSlack(userId, result.userId);
  }

  async getProfile(userId: number): Promise<UserBinding | null> {
    return this.authRepo.findUserById(userId);
  }

  async getIdentities(userId: number): Promise<UserIdentity[]> {
    return this.authRepo.findIdentitiesByUserId(userId);
  }

  verifyAccessToken(token: string): { sub: string } {
    return this.jwt.verifyAccessToken(token);
  }

  refreshTokens(refreshToken: string): { accessToken: string; refreshToken: string } {
    const payload = this.jwt.verifyRefreshToken(refreshToken);
    const tokenPayload = { sub: payload.sub };
    return {
      accessToken: this.jwt.signAccessToken(tokenPayload),
      refreshToken: this.jwt.signRefreshToken(tokenPayload),
    };
  }
}
