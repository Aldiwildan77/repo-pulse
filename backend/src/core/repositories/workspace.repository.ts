import type { Workspace, WorkspaceMember, WorkspaceRole, WorkspaceMemberStatus } from "../entities/index.js";

export interface WorkspaceRepository {
  create(name: string): Promise<Workspace>;

  findById(id: number): Promise<Workspace | null>;

  findByUserId(userId: number): Promise<Workspace[]>;

  addMember(workspaceId: number, userId: number, role: WorkspaceRole, status: WorkspaceMemberStatus): Promise<WorkspaceMember>;

  findMembers(workspaceId: number): Promise<WorkspaceMember[]>;

  findMemberByUserAndWorkspace(userId: number, workspaceId: number): Promise<WorkspaceMember | null>;

  update(id: number, data: { name: string }): Promise<Workspace>;

  delete(id: number): Promise<void>;

  updateMemberRole(memberId: number, role: WorkspaceRole): Promise<WorkspaceMember>;

  removeMember(memberId: number): Promise<void>;
}
