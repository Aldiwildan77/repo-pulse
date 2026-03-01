import { useCallback } from "react";
import { toast } from "sonner";
import { apiClient } from "@/utils/api-client";
import { useApi } from "./use-api";

export interface Workspace {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: number;
  workspaceId: number;
  userId: number;
  username: string | null;
  role: "owner" | "admin" | "member";
  status: "pending" | "accepted" | "rejected" | "removed";
  invitedBy: number | null;
  invitedAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceWithMembers extends Workspace {
  members: WorkspaceMember[];
}

export function useWorkspaces() {
  return useApi<Workspace[]>("/api/workspaces");
}

export function useWorkspaceDetail(workspaceId: string | undefined) {
  return useApi<WorkspaceWithMembers>(
    workspaceId ? `/api/workspaces/${workspaceId}` : null,
  );
}

export function useWorkspaceMembers(workspaceId: string | undefined) {
  return useApi<WorkspaceMember[]>(
    workspaceId ? `/api/workspaces/${workspaceId}/members` : null,
  );
}

export function useWorkspaceMutations() {
  const updateWorkspace = useCallback(
    async (id: number, data: { name: string }) => {
      try {
        const result = await apiClient<Workspace>(`/api/workspaces/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        toast.success("Workspace updated");
        return result;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update workspace");
        throw err;
      }
    },
    [],
  );

  const inviteMember = useCallback(
    async (workspaceId: number, username: string, role: string) => {
      try {
        const member = await apiClient<WorkspaceMember>(
          `/api/workspaces/${workspaceId}/members`,
          {
            method: "POST",
            body: JSON.stringify({ username, role }),
          },
        );
        toast.success("Member invited");
        return member;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to invite member");
        throw err;
      }
    },
    [],
  );

  const updateMemberRole = useCallback(
    async (workspaceId: number, memberId: number, role: string) => {
      try {
        const member = await apiClient<WorkspaceMember>(
          `/api/workspaces/${workspaceId}/members/${memberId}`,
          {
            method: "PATCH",
            body: JSON.stringify({ role }),
          },
        );
        toast.success("Member role updated");
        return member;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update role");
        throw err;
      }
    },
    [],
  );

  const removeMember = useCallback(
    async (workspaceId: number, memberId: number) => {
      try {
        await apiClient(`/api/workspaces/${workspaceId}/members/${memberId}`, {
          method: "DELETE",
        });
        toast.success("Member removed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove member");
        throw err;
      }
    },
    [],
  );

  return { updateWorkspace, inviteMember, updateMemberRole, removeMember };
}
