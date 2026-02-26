import type { ConnectedRepo } from "../../core/entities/connected-repo.js";
import type { ConnectedRepoRow } from "../../infrastructure/database/types.js";

export function toConnectedRepo(row: ConnectedRepoRow): ConnectedRepo {
  return {
    id: row.id,
    provider: row.provider,
    providerInstallationId: row.provider_installation_id,
    providerRepo: row.provider_repo,
    connectedBy: row.connected_by,
    createdAt: row.created_at,
  };
}
