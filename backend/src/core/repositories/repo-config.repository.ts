import type { RepoConfig, SourceProvider } from "../entities/index.js";

export interface RepoConfigRepository {
  create(data: {
    workspaceId: number;
    providerType: SourceProvider;
    providerRepo: string;
    claimedByUserId?: number | null;
  }): Promise<RepoConfig>;

  findById(id: number): Promise<RepoConfig | null>;

  findByRepo(providerRepo: string): Promise<RepoConfig[]>;

  findActiveByRepo(providerRepo: string): Promise<RepoConfig[]>;

  findByWorkspace(workspaceId: number): Promise<RepoConfig[]>;

  findByWorkspacePaginated(workspaceId: number, limit: number, offset: number): Promise<{ configs: RepoConfig[]; total: number }>;

  update(id: number, data: { isActive?: boolean }): Promise<void>;

  delete(id: number): Promise<void>;
}
