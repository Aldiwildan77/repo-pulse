export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface OAuthUserInfo {
  id: string;
  username: string | null;
  email: string | null;
}

export interface OAuthProviderConfig {
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
  /** Extra params appended to the authorize URL (e.g. response_type) */
  extraAuthParams?: Record<string, string>;
  /** Content type for token exchange. Default: "application/json" */
  tokenContentType?: "json" | "form";
}

export abstract class BaseOAuthService {
  constructor(
    protected readonly clientId: string,
    protected readonly clientSecret: string,
    protected readonly callbackUrl: string,
    protected readonly providerConfig: OAuthProviderConfig,
  ) {}

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      scope: this.providerConfig.scope,
      state,
      ...this.providerConfig.extraAuthParams,
    });
    return `${this.providerConfig.authorizeUrl}?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokenResponse> {
    const payload = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: this.callbackUrl,
      grant_type: "authorization_code",
    };

    const useForm = this.providerConfig.tokenContentType === "form";

    const response = await fetch(this.providerConfig.tokenUrl, {
      method: "POST",
      headers: useForm
        ? { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }
        : { "Content-Type": "application/json", Accept: "application/json" },
      body: useForm ? new URLSearchParams(payload) : JSON.stringify(payload),
    });

    const data = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };

    if (!data.access_token) {
      const detail = data.error_description ?? data.error ?? "no access token";
      throw new Error(`${this.providerName} OAuth error: ${detail}`);
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? undefined,
      expiresIn: data.expires_in ?? undefined,
    };
  }

  async fetchUser(accessToken: string): Promise<OAuthUserInfo> {
    const response = await fetch(this.providerConfig.userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`${this.providerName} API error: ${response.status}`);
    }

    const data = await response.json();
    return this.mapUser(data);
  }

  protected abstract get providerName(): string;
  protected abstract mapUser(data: unknown): OAuthUserInfo;
}
