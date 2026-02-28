import { useCallback } from "react";
import { toast } from "sonner";
import { apiClient } from "@/utils/api-client";
import { useApi } from "./use-api";
import type { Platform, SourceProvider } from "@/utils/constants";

export interface RepoConfig {
  id: number;
  provider: SourceProvider;
  providerRepo: string;
  platform: Platform;
  channelId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RepoEventToggle {
  id: number;
  repoConfigId: number;
  eventType: string;
  isEnabled: boolean;
}

export interface NotifierLog {
  id: number;
  repoConfigId: number;
  eventType: string;
  status: string;
  platform: string;
  summary: string;
  errorMessage: string | null;
  createdAt: string;
}

export interface RepoConfigInput {
  provider: SourceProvider;
  providerRepo: string;
  platform: Platform;
  channelId: string;
}

export function useRepositories(
  params?: { limit?: number; offset?: number },
) {
  const limit = params?.limit;
  const offset = params?.offset;
  const usePagination = limit !== undefined || offset !== undefined;

  const url = usePagination
    ? `/api/repos/config?limit=${limit ?? 20}&offset=${offset ?? 0}`
    : "/api/repos/config";

  const { data, isLoading, error, refetch } = useApi<
    RepoConfig[] | { configs: RepoConfig[]; total: number }
  >(url);

  if (usePagination) {
    const paginated = data as { configs: RepoConfig[]; total: number } | undefined;
    return {
      repositories: paginated?.configs ?? [],
      total: paginated?.total ?? 0,
      isLoading,
      error,
      refetch,
    };
  }

  const list = data as RepoConfig[] | undefined;
  return {
    repositories: list ?? [],
    total: (list ?? []).length,
    isLoading,
    error,
    refetch,
  };
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
    async (id: number, input: {
      channelId?: string;
      isActive?: boolean;
    }) => {
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

  const getEventToggles = useCallback(async (id: number) => {
    return apiClient<RepoEventToggle[]>(`/api/repos/config/${id}/toggles`);
  }, []);

  const upsertEventToggle = useCallback(async (id: number, eventType: string, isEnabled: boolean) => {
    await apiClient(`/api/repos/config/${id}/toggles`, {
      method: "PUT",
      body: JSON.stringify({ eventType, isEnabled }),
    });
  }, []);

  const getNotifierLogs = useCallback(
    async (id: number, limit = 50, offset = 0) => {
      return apiClient<{
        logs: NotifierLog[];
        total: number;
      }>(`/api/repos/config/${id}/logs?limit=${limit}&offset=${offset}`);
    },
    [],
  );

  return { create, update, remove, toggleActive, getEventToggles, upsertEventToggle, getNotifierLogs };
}
