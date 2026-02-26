import type { UserBinding } from "../entities/index.js";

export interface UserBindingRepository {
  upsert(data: {
    providerUserId: string;
    providerUsername: string;
    discordUserId?: string | null;
    slackUserId?: string | null;
  }): Promise<UserBinding>;

  findByProviderUserId(providerUserId: string): Promise<UserBinding | null>;

  findByProviderUsernames(usernames: string[]): Promise<UserBinding[]>;

  updateDiscord(providerUserId: string, discordUserId: string): Promise<void>;

  updateSlack(providerUserId: string, slackUserId: string): Promise<void>;
}
