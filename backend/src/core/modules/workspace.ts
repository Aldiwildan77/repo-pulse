import type { WorkspaceRepository } from "../repositories/workspace.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";
import type { Workspace, WorkspaceMember, WorkspaceRole } from "../entities/index.js";

export class WorkspaceModule {
  constructor(
    private readonly workspaceRepo: WorkspaceRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async getWorkspaces(userId: number): Promise<Workspace[]> {
    return this.workspaceRepo.findByUserId(userId);
  }

  async getWorkspaceById(workspaceId: number, userId: number): Promise<Workspace> {
    const member = await this.workspaceRepo.findMemberByUserAndWorkspace(userId, workspaceId);
    if (!member) {
      throw new Error("Workspace not found or access denied");
    }

    const workspace = await this.workspaceRepo.findById(workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    return workspace;
  }

  async updateWorkspace(workspaceId: number, userId: number, data: { name: string }): Promise<Workspace> {
    const member = await this.requireRole(workspaceId, userId, ["owner", "admin"]);
    if (!member) {
      throw new Error("Only owners and admins can update workspace");
    }

    return this.workspaceRepo.update(workspaceId, data);
  }

  async getMembers(workspaceId: number, userId: number): Promise<WorkspaceMember[]> {
    await this.requireMember(workspaceId, userId);
    const members = await this.workspaceRepo.findMembers(workspaceId);
    return members.filter((m) => m.status === "accepted" || m.status === "pending");
  }

  async inviteMember(
    workspaceId: number,
    inviterUserId: number,
    username: string,
    role: WorkspaceRole,
  ): Promise<WorkspaceMember> {
    await this.requireRole(workspaceId, inviterUserId, ["owner", "admin"]);

    const user = await this.userRepo.findByUsername(username);
    if (!user) {
      throw new Error("User not found. They must have signed in to the app first.");
    }

    const existing = await this.workspaceRepo.findMemberByUserAndWorkspace(user.id, workspaceId);
    if (existing) {
      throw new Error("User is already a member of this workspace");
    }

    return this.workspaceRepo.addMember(workspaceId, user.id, role, "pending");
  }

  async removeMember(
    workspaceId: number,
    userId: number,
    targetMemberId: number,
  ): Promise<void> {
    await this.requireRole(workspaceId, userId, ["owner", "admin"]);

    const members = await this.workspaceRepo.findMembers(workspaceId);
    const target = members.find((m) => m.id === targetMemberId);
    if (!target) {
      throw new Error("Member not found");
    }

    if (target.role === "owner") {
      const owners = members.filter((m) => m.role === "owner" && m.status === "accepted");
      if (owners.length <= 1) {
        throw new Error("Cannot remove the last owner");
      }
    }

    await this.workspaceRepo.removeMember(targetMemberId);
  }

  async updateMemberRole(
    workspaceId: number,
    userId: number,
    targetMemberId: number,
    newRole: WorkspaceRole,
  ): Promise<WorkspaceMember> {
    await this.requireRole(workspaceId, userId, ["owner"]);

    const members = await this.workspaceRepo.findMembers(workspaceId);
    const target = members.find((m) => m.id === targetMemberId);
    if (!target) {
      throw new Error("Member not found");
    }

    if (target.role === "owner" && newRole !== "owner") {
      const owners = members.filter((m) => m.role === "owner" && m.status === "accepted");
      if (owners.length <= 1) {
        throw new Error("Cannot change role of the last owner");
      }
    }

    return this.workspaceRepo.updateMemberRole(targetMemberId, newRole);
  }

  private async requireMember(workspaceId: number, userId: number): Promise<WorkspaceMember> {
    const member = await this.workspaceRepo.findMemberByUserAndWorkspace(userId, workspaceId);
    if (!member) {
      throw new Error("Access denied");
    }
    return member;
  }

  private async requireRole(
    workspaceId: number,
    userId: number,
    roles: WorkspaceRole[],
  ): Promise<WorkspaceMember> {
    const member = await this.requireMember(workspaceId, userId);
    if (!roles.includes(member.role)) {
      throw new Error("Insufficient permissions");
    }
    return member;
  }
}
