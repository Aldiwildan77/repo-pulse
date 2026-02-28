import type { Config } from "../../infrastructure/config.js";
import type { UserBindingRepository } from "../repositories/user-binding.repository.js";
import type { JwtService } from "../../infrastructure/auth/jwt.js";
import type { GitHubOAuthService } from "../../infrastructure/auth/github-oauth.js";
import type { GoogleOAuthService } from "../../infrastructure/auth/google-oauth.js";
import type { GitLabOAuthService } from "../../infrastructure/auth/gitlab-oauth.js";
import type { DiscordOAuthService } from "../../infrastructure/auth/discord-oauth.js";
import type { SlackOAuthService } from "../../infrastructure/auth/slack-oauth.js";
import type { CryptoService } from "../../infrastructure/auth/crypto.js";
import type { KyselyAuthRepository } from "../../repositories/auth/auth.repo.js";
import type { TotpModule } from "./totp.js";
import type { UserBinding, UserIdentity } from "../entities/index.js";

export interface AuthCallbackResult {
  accessToken?: string;
  refreshToken?: string;
  totpPendingToken?: string;
  totpRequired: boolean;
  user: UserBinding;
}

interface IdentityCallbackParams {
  provider: string;
  providerUserId: string;
  providerEmail?: string | null;
  providerUsername?: string | null;
  accessTokenEncrypted?: string | null;
  refreshTokenEncrypted?: string | null;
  tokenExpiresAt?: Date | null;
}

export class AuthModule {
  constructor(
    private readonly config: Config,
    private readonly userBindingRepo: UserBindingRepository,
    private readonly authRepo: KyselyAuthRepository,
    private readonly githubOAuth: GitHubOAuthService,
    private readonly googleOAuth: GoogleOAuthService | null,
    private readonly gitlabOAuth: GitLabOAuthService | null,
    private readonly discordOAuth: DiscordOAuthService,
    private readonly slackOAuth: SlackOAuthService,
    private readonly jwt: JwtService,
    private readonly totpModule: TotpModule | null,
    private readonly cryptoService: CryptoService,
  ) {}

  getAvailableLoginProviders(): string[] {
    const providers = ["github"];
    if (this.googleOAuth) providers.push("google");
    if (this.gitlabOAuth) providers.push("gitlab");
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

  getGitlabAuthUrl(state: string): string | null {
    return this.gitlabOAuth?.getAuthorizationUrl(state) ?? null;
  }

  async handleGithubCallback(
    code: string,
    existingUserId?: number,
  ): Promise<AuthCallbackResult> {
    const oauthToken = await this.githubOAuth.exchangeCode(code);
    const ghUser = await this.githubOAuth.getUser(oauthToken.accessToken);

    return this.handleIdentityCallback(
      {
        provider: "github",
        providerUserId: ghUser.id,
        providerUsername: ghUser.login,
        accessTokenEncrypted: this.cryptoService.encrypt(oauthToken.accessToken),
      },
      existingUserId,
    );
  }

  async handleGoogleCallback(
    code: string,
    existingUserId?: number,
  ): Promise<AuthCallbackResult> {
    if (!this.googleOAuth) {
      throw new Error("Google OAuth is not configured");
    }

    const oauthToken = await this.googleOAuth.exchangeCode(code);
    const googleUser = await this.googleOAuth.getUser(oauthToken.accessToken);

    return this.handleIdentityCallback(
      {
        provider: "google",
        providerUserId: googleUser.id,
        providerEmail: googleUser.email,
        providerUsername: googleUser.name,
      },
      existingUserId,
    );
  }

  async handleGitlabCallback(
    code: string,
    existingUserId?: number,
  ): Promise<AuthCallbackResult> {
    if (!this.gitlabOAuth) {
      throw new Error("GitLab OAuth is not configured");
    }

    const tokenResponse = await this.gitlabOAuth.exchangeCodeFull(code);
    const gitlabUser = await this.gitlabOAuth.getUser(tokenResponse.access_token);

    return this.handleIdentityCallback(
      {
        provider: "gitlab",
        providerUserId: gitlabUser.id,
        providerEmail: gitlabUser.email,
        providerUsername: gitlabUser.username,
        accessTokenEncrypted: this.cryptoService.encrypt(tokenResponse.access_token),
        refreshTokenEncrypted: this.cryptoService.encrypt(tokenResponse.refresh_token),
        tokenExpiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
      },
      existingUserId,
    );
  }

  async getGitlabTokenForUser(userId: number): Promise<string> {
    if (!this.gitlabOAuth) {
      throw new Error("GitLab OAuth is not configured");
    }

    const identity = await this.authRepo.findIdentityByUserId(userId, "gitlab");
    if (!identity || !identity.accessTokenEncrypted || !identity.refreshTokenEncrypted) {
      throw new Error("User has no GitLab token. Please bind your GitLab account first.");
    }

    const now = new Date();
    const bufferMs = 60_000; // 1 minute buffer

    if (identity.tokenExpiresAt && identity.tokenExpiresAt.getTime() - bufferMs > now.getTime()) {
      return this.cryptoService.decrypt(identity.accessTokenEncrypted);
    }

    const refreshToken = this.cryptoService.decrypt(identity.refreshTokenEncrypted);
    const tokenResponse = await this.gitlabOAuth.refreshAccessToken(refreshToken);

    const encryptedAccess = this.cryptoService.encrypt(tokenResponse.access_token);
    const encryptedRefresh = this.cryptoService.encrypt(tokenResponse.refresh_token);
    const tokenExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

    await this.authRepo.updateIdentityTokens(
      identity.id,
      encryptedAccess,
      encryptedRefresh,
      tokenExpiresAt,
    );

    return tokenResponse.access_token;
  }

  async getGithubTokenForUser(userId: number): Promise<string> {
    const identity = await this.authRepo.findIdentityByUserId(userId, "github");
    if (!identity || !identity.accessTokenEncrypted) {
      throw new Error("User has no GitHub token. Please bind your GitHub account first.");
    }

    return this.cryptoService.decrypt(identity.accessTokenEncrypted);
  }

  async handleDiscordCallback(code: string, userId: number): Promise<void> {
    const oauthToken = await this.discordOAuth.exchangeCode(code);
    const discordUser = await this.discordOAuth.getUser(oauthToken.accessToken);
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

  issueTokens(userId: number): { accessToken: string; refreshToken: string } {
    const tokenPayload = { sub: String(userId) };
    return {
      accessToken: this.jwt.signAccessToken(tokenPayload),
      refreshToken: this.jwt.signRefreshToken(tokenPayload),
    };
  }

  async isTotpEnabled(userId: number): Promise<boolean> {
    if (!this.totpModule) return false;
    return this.totpModule.isTotpEnabled(userId);
  }

  private async handleIdentityCallback(
    params: IdentityCallbackParams,
    existingUserId?: number,
  ): Promise<AuthCallbackResult> {
    const existingIdentity = await this.authRepo.findIdentity(params.provider, params.providerUserId);
    const hasTokens = !!(params.accessTokenEncrypted && params.refreshTokenEncrypted);

    if (existingUserId) {
      // Binding mode
      if (existingIdentity && existingIdentity.userId !== existingUserId) {
        throw new Error(`This ${params.provider} account is already linked to another user`);
      }
      if (!existingIdentity) {
        await this.authRepo.addIdentity({
          userId: existingUserId,
          provider: params.provider,
          providerUserId: params.providerUserId,
          providerEmail: params.providerEmail,
          providerUsername: params.providerUsername,
          accessTokenEncrypted: params.accessTokenEncrypted,
          refreshTokenEncrypted: params.refreshTokenEncrypted,
          tokenExpiresAt: params.tokenExpiresAt,
        });
      } else if (hasTokens) {
        await this.authRepo.updateIdentityTokens(
          existingIdentity.id,
          params.accessTokenEncrypted!,
          params.refreshTokenEncrypted!,
          params.tokenExpiresAt!,
        );
      }

      const user = await this.authRepo.findUserById(existingUserId);
      if (!user) throw new Error("User not found");
      return this.buildAuthResult(user);
    }

    // Login mode
    let user: UserBinding;
    if (existingIdentity) {
      if (hasTokens) {
        await this.authRepo.updateIdentityTokens(
          existingIdentity.id,
          params.accessTokenEncrypted!,
          params.refreshTokenEncrypted!,
          params.tokenExpiresAt!,
        );
      }
      user = (await this.authRepo.findUserById(existingIdentity.userId))!;
    } else {
      user = await this.authRepo.createUser();
      await this.authRepo.addIdentity({
        userId: user.id,
        provider: params.provider,
        providerUserId: params.providerUserId,
        providerEmail: params.providerEmail,
        providerUsername: params.providerUsername,
        accessTokenEncrypted: params.accessTokenEncrypted,
        refreshTokenEncrypted: params.refreshTokenEncrypted,
        tokenExpiresAt: params.tokenExpiresAt,
      });
    }

    return this.buildAuthResult(user);
  }

  private async buildAuthResult(user: UserBinding): Promise<AuthCallbackResult> {
    if (this.totpModule && (await this.totpModule.isTotpEnabled(user.id))) {
      return {
        totpPendingToken: this.totpModule.signTotpPendingToken(user.id),
        totpRequired: true,
        user,
      };
    }

    const tokenPayload = { sub: String(user.id) };
    return {
      accessToken: this.jwt.signAccessToken(tokenPayload),
      refreshToken: this.jwt.signRefreshToken(tokenPayload),
      totpRequired: false,
      user,
    };
  }
}
