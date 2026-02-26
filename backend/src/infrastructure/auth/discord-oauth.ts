export interface DiscordUser {
  id: string;
  username: string;
}

export class DiscordOAuthService {
  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly callbackUrl: string,
  ) {}

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      response_type: "code",
      scope: "identify",
      state,
    });
    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<string> {
    const response = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: this.callbackUrl,
      }),
    });

    const data = (await response.json()) as { access_token?: string; error?: string };
    if (!data.access_token) {
      throw new Error(`Discord OAuth error: ${data.error ?? "no access token"}`);
    }
    return data.access_token;
  }

  async getUser(accessToken: string): Promise<DiscordUser> {
    const response = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }

    const data = (await response.json()) as { id: string; username: string };
    return { id: data.id, username: data.username };
  }
}
