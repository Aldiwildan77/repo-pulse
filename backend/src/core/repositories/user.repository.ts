import type { User } from "../entities/index.js";

export interface UserRepository {
  createUser(): Promise<User>;

  findById(id: number): Promise<User | null>;

  findByProviderUsernames(provider: string, usernames: string[]): Promise<{ user: User; providerUserId: string }[]>;
}
