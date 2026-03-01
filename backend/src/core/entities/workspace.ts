export type WorkspaceRole = "owner" | "admin" | "member";
export type WorkspaceMemberStatus = "pending" | "accepted" | "rejected" | "removed";

export interface Workspace {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  id: number;
  workspaceId: number;
  userId: number;
  username: string | null;
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
  invitedBy: number | null;
  invitedAt: Date | null;
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
