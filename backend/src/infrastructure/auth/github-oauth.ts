import { BaseOAuthService } from "./base-oauth.js";
import type { OAuthUserInfo } from "./base-oauth.js";

export interface GitHubUser {
  id: string;
  login: string;
}

export class GitHubOAuthService extends BaseOAuthService {
  constructor(clientId: string, clientSecret: string, callbackUrl: string) {
    super(clientId, clientSecret, callbackUrl, {
      authorizeUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      userInfoUrl: "https://api.github.com/user",
      scope: "read:user,repo",
    });
  }

  protected get providerName(): string {
    return "GitHub";
  }

  protected mapUser(data: unknown): OAuthUserInfo {
    const d = data as { id: number; login: string };
    return { id: String(d.id), username: d.login, email: null };
  }

  async getUser(accessToken: string): Promise<GitHubUser> {
    const info = await this.fetchUser(accessToken);
    return { id: info.id, login: info.username! };
  }
}
