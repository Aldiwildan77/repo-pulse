export interface SlackUser {
  id: string;
  name: string;
}

export class SlackOAuthService {
  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly callbackUrl: string,
  ) {}

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      user_scope: "identity.basic",
      state,
    });
    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<{ accessToken: string; userId: string; userName: string }> {
    const response = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.callbackUrl,
      }),
    });

    const data = (await response.json()) as {
      ok: boolean;
      authed_user?: { id: string; access_token: string };
      error?: string;
    };

    if (!data.ok || !data.authed_user) {
      throw new Error(`Slack OAuth error: ${data.error ?? "unknown"}`);
    }

    return {
      accessToken: data.authed_user.access_token,
      userId: data.authed_user.id,
      userName: "",
    };
  }

  async getUser(accessToken: string): Promise<SlackUser> {
    const response = await fetch("https://slack.com/api/users.identity", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = (await response.json()) as {
      ok: boolean;
      user?: { id: string; name: string };
      error?: string;
    };

    if (!data.ok || !data.user) {
      throw new Error(`Slack API error: ${data.error ?? "unknown"}`);
    }

    return { id: data.user.id, name: data.user.name };
  }
}
