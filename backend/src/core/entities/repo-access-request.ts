import type { WorkspaceRole } from "./workspace.js";

export type RepoAccessRequestStatus = "pending" | "approved" | "rejected";

export interface RepoAccessRequest {
  id: number;
  repoConfigId: number;
  userId: number;
  requestedRole: WorkspaceRole;
  status: RepoAccessRequestStatus;
  reviewedBy: number | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
