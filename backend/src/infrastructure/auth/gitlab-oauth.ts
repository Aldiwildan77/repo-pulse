import { BaseOAuthService } from "./base-oauth.js";
import type { OAuthUserInfo, OAuthTokenResponse } from "./base-oauth.js";

export interface GitLabUser {
  id: string;
  username: string;
  email: string | null;
}

export interface GitLabTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export class GitLabOAuthService extends BaseOAuthService {
  constructor(clientId: string, clientSecret: string, callbackUrl: string) {
    super(clientId, clientSecret, callbackUrl, {
      authorizeUrl: "https://gitlab.com/oauth/authorize",
      tokenUrl: "https://gitlab.com/oauth/token",
      userInfoUrl: "https://gitlab.com/api/v4/user",
      scope: "api",
      extraAuthParams: { response_type: "code" },
    });
  }

  protected get providerName(): string {
    return "GitLab";
  }

  protected mapUser(data: unknown): OAuthUserInfo {
    const d = data as { id: number; username: string; email: string | null };
    return { id: String(d.id), username: d.username, email: d.email };
  }

  async getUser(accessToken: string): Promise<GitLabUser> {
    const info = await this.fetchUser(accessToken);
    return { id: info.id, username: info.username!, email: info.email };
  }

  async exchangeCodeFull(code: string): Promise<GitLabTokenResponse> {
    const response = await this.exchangeCode(code);
    return {
      access_token: response.accessToken,
      refresh_token: response.refreshToken ?? "",
      expires_in: response.expiresIn ?? 7200,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<GitLabTokenResponse> {
    const response = await fetch(this.providerConfig.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const data = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
    };

    if (!data.access_token) {
      throw new Error(`GitLab token refresh error: ${data.error ?? "no access token"}`);
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? refreshToken,
      expires_in: data.expires_in ?? 7200,
    };
  }
}
