import type { User } from "../entities/index.js";

export interface UserRepository {
  createUser(): Promise<User>;

  findById(id: number): Promise<User | null>;

  findByProviderUsernames(provider: string, usernames: string[]): Promise<{ user: User; providerUserId: string }[]>;

  /** Find a user by username across all providers. */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Given usernames on a source provider (e.g. GitHub), find their identities on a target platform (e.g. Discord/Slack).
   * This enables cross-platform mention routing: GitHub @username → Discord/Slack user ID.
   */
  findTargetIdentities(
    sourceProvider: string,
    sourceUsernames: string[],
    targetPlatform: string,
  ): Promise<{ sourceUsername: string; targetUserId: string }[]>;
}
