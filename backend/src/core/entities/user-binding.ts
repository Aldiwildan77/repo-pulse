export interface UserBinding {
  id: number;
  providerUserId: string;
  providerUsername: string;
  discordUserId: string | null;
  slackUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
