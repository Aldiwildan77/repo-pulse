export interface GitHubUser {
  id: string;
  login: string;
}

export class GitHubOAuthService {
  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly callbackUrl: string,
  ) {}

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      scope: "read:user",
      state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<string> {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.callbackUrl,
      }),
    });

    const data = (await response.json()) as { access_token?: string; error?: string };
    if (!data.access_token) {
      throw new Error(`GitHub OAuth error: ${data.error ?? "no access token"}`);
    }
    return data.access_token;
  }

  async getUser(accessToken: string): Promise<GitHubUser> {
    const response = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = (await response.json()) as { id: number; login: string };
    return { id: String(data.id), login: data.login };
  }
}
