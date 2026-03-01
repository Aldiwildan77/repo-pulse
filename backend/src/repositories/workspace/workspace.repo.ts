import type { Kysely } from "kysely";
import type { Database } from "../../infrastructure/database/types.js";
import type { WorkspaceRepository } from "../../core/repositories/workspace.repository.js";
import type { Workspace, WorkspaceMember, WorkspaceRole, WorkspaceMemberStatus } from "../../core/entities/index.js";
import { toWorkspace, toWorkspaceMember } from "./dto.js";

export class KyselyWorkspaceRepository implements WorkspaceRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async create(name: string): Promise<Workspace> {
    const row = await this.db
      .insertInto("workspaces")
      .values({ name })
      .returningAll()
      .executeTakeFirstOrThrow();

    return toWorkspace(row);
  }

  async findById(id: number): Promise<Workspace | null> {
    const row = await this.db
      .selectFrom("workspaces")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return row ? toWorkspace(row) : null;
  }

  async findByUserId(userId: number): Promise<Workspace[]> {
    const rows = await this.db
      .selectFrom("workspaces")
      .innerJoin("workspace_members", "workspace_members.workspace_id", "workspaces.id")
      .selectAll("workspaces")
      .where("workspace_members.user_id", "=", userId)
      .where("workspace_members.status", "=", "accepted")
      .execute();

    return rows.map(toWorkspace);
  }

  async addMember(workspaceId: number, userId: number, role: WorkspaceRole, status: WorkspaceMemberStatus): Promise<WorkspaceMember> {
    const row = await this.db
      .insertInto("workspace_members")
      .values({
        workspace_id: workspaceId,
        user_id: userId,
        role,
        status,
        accepted_at: status === "accepted" ? new Date() : null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return toWorkspaceMember(row);
  }

  async findMembers(workspaceId: number): Promise<WorkspaceMember[]> {
    const rows = await this.db
      .selectFrom("workspace_members")
      .innerJoin("users", "users.id", "workspace_members.user_id")
      .selectAll("workspace_members")
      .select("users.username")
      .where("workspace_members.workspace_id", "=", workspaceId)
      .execute();

    return rows.map(toWorkspaceMember);
  }

  async findMemberByUserAndWorkspace(userId: number, workspaceId: number): Promise<WorkspaceMember | null> {
    const row = await this.db
      .selectFrom("workspace_members")
      .selectAll()
      .where("user_id", "=", userId)
      .where("workspace_id", "=", workspaceId)
      .where("status", "=", "accepted")
      .executeTakeFirst();

    return row ? toWorkspaceMember(row) : null;
  }

  async update(id: number, data: { name: string }): Promise<Workspace> {
    const row = await this.db
      .updateTable("workspaces")
      .set({ name: data.name, updated_at: new Date() })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return toWorkspace(row);
  }

  async delete(id: number): Promise<void> {
    await this.db
      .deleteFrom("workspaces")
      .where("id", "=", id)
      .execute();
  }

  async updateMemberRole(memberId: number, role: WorkspaceRole): Promise<WorkspaceMember> {
    const row = await this.db
      .updateTable("workspace_members")
      .set({ role, updated_at: new Date() })
      .where("id", "=", memberId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return toWorkspaceMember(row);
  }

  async removeMember(memberId: number): Promise<void> {
    await this.db
      .updateTable("workspace_members")
      .set({ status: "removed", updated_at: new Date() })
      .where("id", "=", memberId)
      .execute();
  }
}
