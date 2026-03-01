export interface UserIdentity {
  id: number;
  userId: number;
  provider: string;
  providerUserId: string;
  providerEmail: string | null;
  providerUsername: string | null;
  accessTokenEncrypted: string | null;
  refreshTokenEncrypted: string | null;
  tokenExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
