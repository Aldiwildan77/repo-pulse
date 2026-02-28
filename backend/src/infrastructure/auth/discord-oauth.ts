import { BaseOAuthService } from "./base-oauth.js";
import type { OAuthUserInfo } from "./base-oauth.js";

export interface DiscordUser {
  id: string;
  username: string;
}

export class DiscordOAuthService extends BaseOAuthService {
  constructor(clientId: string, clientSecret: string, callbackUrl: string) {
    super(clientId, clientSecret, callbackUrl, {
      authorizeUrl: "https://discord.com/api/oauth2/authorize",
      tokenUrl: "https://discord.com/api/oauth2/token",
      userInfoUrl: "https://discord.com/api/users/@me",
      scope: "identify",
      extraAuthParams: { response_type: "code" },
      tokenContentType: "form",
    });
  }

  protected get providerName(): string {
    return "Discord";
  }

  protected mapUser(data: unknown): OAuthUserInfo {
    const d = data as { id: string; username: string };
    return { id: d.id, username: d.username, email: null };
  }

  async getUser(accessToken: string): Promise<DiscordUser> {
    const info = await this.fetchUser(accessToken);
    return { id: info.id, username: info.username! };
  }
}
