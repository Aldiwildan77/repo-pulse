import { useCallback } from "react";
import { toast } from "sonner";
import { apiClient } from "@/utils/api-client";
import { useApi } from "./use-api";
import type { Platform } from "@/utils/constants";

export interface RepoConfig {
  id: number;
  providerRepo: string;
  platform: Platform;
  channelId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RepoConfigInput {
  providerRepo: string;
  platform: Platform;
  channelId: string;
}

export function useRepositories() {
  const { data, isLoading, error, refetch } =
    useApi<RepoConfig[]>("/api/repos/config");

  return { repositories: data ?? [], isLoading, error, refetch };
}

export function useRepositoryMutations() {
  const create = useCallback(async (input: RepoConfigInput) => {
    const repo = await apiClient<RepoConfig>("/api/repos/config", {
      method: "POST",
      body: JSON.stringify(input),
    });
    toast.success("Repository added successfully");
    return repo;
  }, []);

  const update = useCallback(
    async (id: number, input: { channelId?: string; isActive?: boolean }) => {
      await apiClient(`/api/repos/config/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      toast.success("Repository updated successfully");
    },
    [],
  );

  const remove = useCallback(async (id: number) => {
    await apiClient(`/api/repos/config/${id}`, { method: "DELETE" });
    toast.success("Repository removed successfully");
  }, []);

  const toggleActive = useCallback(async (id: number, isActive: boolean) => {
    await apiClient(`/api/repos/config/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
    toast.success(isActive ? "Repository activated" : "Repository deactivated");
  }, []);

  return { create, update, remove, toggleActive };
}
