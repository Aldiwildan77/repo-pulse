export interface UserBinding {
  id: number;
  providerUserId: string | null;
  providerUsername: string | null;
  discordUserId: string | null;
  slackUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
