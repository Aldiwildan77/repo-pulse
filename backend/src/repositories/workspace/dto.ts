import type { Workspace, WorkspaceMember } from "../../core/entities/index.js";
import type { WorkspaceRow, WorkspaceMemberRow } from "../../infrastructure/database/types.js";

export function toWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toWorkspaceMember(row: WorkspaceMemberRow & { username?: string | null }): WorkspaceMember {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    username: row.username ?? null,
    role: row.role,
    status: row.status,
    invitedBy: row.invited_by,
    invitedAt: row.invited_at,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
