import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { WorkspaceModule } from "../core/modules/workspace.js";
import type { AuthMiddleware } from "./middleware/auth.middleware.js";
import type { WorkspaceRole } from "../core/entities/index.js";

export class WorkspaceHandler {
  constructor(
    private readonly workspace: WorkspaceModule,
    private readonly authMiddleware: AuthMiddleware,
  ) {}

  register(app: FastifyInstance): void {
    app.get("/api/workspaces", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.listWorkspaces.bind(this),
    });

    app.get<{ Params: { id: string } }>("/api/workspaces/:id", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.getWorkspace.bind(this),
    });

    app.patch("/api/workspaces/:id", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.updateWorkspace.bind(this),
    });

    app.get<{ Params: { id: string } }>("/api/workspaces/:id/members", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.listMembers.bind(this),
    });

    app.post("/api/workspaces/:id/members", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.inviteMember.bind(this),
    });

    app.patch("/api/workspaces/:id/members/:memberId", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.updateMemberRole.bind(this),
    });

    app.delete("/api/workspaces/:id/members/:memberId", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.removeMember.bind(this),
    });
  }

  private async listWorkspaces(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = parseInt(request.userId!, 10);
    const workspaces = await this.workspace.getWorkspaces(userId);
    reply.send(workspaces);
  }

  private async getWorkspace(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = parseInt(request.userId!, 10);
    const workspaceId = parseInt(request.params.id, 10);

    try {
      const workspace = await this.workspace.getWorkspaceById(workspaceId, userId);
      const members = await this.workspace.getMembers(workspaceId, userId);
      reply.send({ ...workspace, members });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Not found";
      reply.code(404).send({ error: message });
    }
  }

  private async updateWorkspace(
    request: FastifyRequest<{
      Params: { id: string };
      Body: { name: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = parseInt(request.userId!, 10);
    const workspaceId = parseInt(request.params.id, 10);

    try {
      const updated = await this.workspace.updateWorkspace(workspaceId, userId, request.body);
      reply.send(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      reply.code(403).send({ error: message });
    }
  }

  private async listMembers(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = parseInt(request.userId!, 10);
    const workspaceId = parseInt(request.params.id, 10);

    try {
      const members = await this.workspace.getMembers(workspaceId, userId);
      reply.send(members);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Access denied";
      reply.code(403).send({ error: message });
    }
  }

  private async inviteMember(
    request: FastifyRequest<{
      Params: { id: string };
      Body: { username: string; role: WorkspaceRole };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = parseInt(request.userId!, 10);
    const workspaceId = parseInt(request.params.id, 10);
    const { username, role } = request.body;

    try {
      const member = await this.workspace.inviteMember(workspaceId, userId, username, role);
      reply.code(201).send(member);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invite failed";
      reply.code(400).send({ error: message });
    }
  }

  private async updateMemberRole(
    request: FastifyRequest<{
      Params: { id: string; memberId: string };
      Body: { role: WorkspaceRole };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = parseInt(request.userId!, 10);
    const workspaceId = parseInt(request.params.id, 10);
    const memberId = parseInt(request.params.memberId, 10);

    try {
      const member = await this.workspace.updateMemberRole(workspaceId, userId, memberId, request.body.role);
      reply.send(member);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      reply.code(403).send({ error: message });
    }
  }

  private async removeMember(
    request: FastifyRequest<{ Params: { id: string; memberId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = parseInt(request.userId!, 10);
    const workspaceId = parseInt(request.params.id, 10);
    const memberId = parseInt(request.params.memberId, 10);

    try {
      await this.workspace.removeMember(workspaceId, userId, memberId);
      reply.code(204).send();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Remove failed";
      reply.code(403).send({ error: message });
    }
  }
}
