export interface UserIdentity {
  id: number;
  userId: number;
  provider: string;
  providerUserId: string;
  providerEmail: string | null;
  providerUsername: string | null;
  createdAt: Date;
}
