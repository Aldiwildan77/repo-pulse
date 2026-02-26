import type { ConnectedRepo } from "../entities/connected-repo.js";
import type { SourceProvider } from "../webhook/webhook-provider.js";

export interface ConnectedRepoRepository {
  addRepos(repos: Omit<ConnectedRepo, "id" | "createdAt">[]): Promise<void>;

  removeByInstallation(provider: SourceProvider, installationId: string): Promise<void>;

  removeRepos(repos: { provider: SourceProvider; providerRepo: string }[]): Promise<void>;

  findByUser(connectedBy: string): Promise<ConnectedRepo[]>;

  findByRepo(provider: SourceProvider, providerRepo: string): Promise<ConnectedRepo | null>;

  findAll(): Promise<ConnectedRepo[]>;
}
