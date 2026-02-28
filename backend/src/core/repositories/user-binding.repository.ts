import type { UserBinding } from "../entities/index.js";

export interface UserBindingRepository {
  createUser(): Promise<UserBinding>;

  findById(id: number): Promise<UserBinding | null>;

  findByProviderUsernames(provider: string, usernames: string[]): Promise<UserBinding[]>;

  updateDiscord(userId: number, discordUserId: string): Promise<void>;

  updateSlack(userId: number, slackUserId: string): Promise<void>;
}
