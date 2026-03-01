import type { UserIdentity } from "../entities/index.js";

export interface UserIdentityRepository {
  findByProvider(provider: string, providerUserId: string): Promise<UserIdentity | null>;

  findByUserId(userId: number): Promise<UserIdentity[]>;

  create(data: {
    userId: number;
    provider: string;
    providerUserId: string;
    providerEmail?: string | null;
    providerUsername?: string | null;
    accessTokenEncrypted?: string | null;
    refreshTokenEncrypted?: string | null;
    tokenExpiresAt?: Date | null;
  }): Promise<UserIdentity>;

  updateTokens(id: number, accessToken: string, refreshToken: string | null, tokenExpiresAt: Date | null): Promise<void>;
}
