import { BaseOAuthService } from "./base-oauth.js";
import type { OAuthUserInfo } from "./base-oauth.js";

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
}

export class GoogleOAuthService extends BaseOAuthService {
  constructor(clientId: string, clientSecret: string, callbackUrl: string) {
    super(clientId, clientSecret, callbackUrl, {
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
      scope: "openid email profile",
      extraAuthParams: { response_type: "code" },
      tokenContentType: "form",
    });
  }

  protected get providerName(): string {
    return "Google";
  }

  protected mapUser(data: unknown): OAuthUserInfo {
    const d = data as { id: string; email: string; name: string };
    return { id: d.id, username: d.name, email: d.email };
  }

  async getUser(accessToken: string): Promise<GoogleUser> {
    const info = await this.fetchUser(accessToken);
    return { id: info.id, email: info.email!, name: info.username! };
  }
}
