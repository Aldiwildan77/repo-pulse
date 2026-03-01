import { useCallback } from "react";
import { toast } from "sonner";
import { apiClient } from "@/utils/api-client";
import { useApi } from "./use-api";
import type { Platform, SourceProvider } from "@/utils/constants";

export interface RepoConfigNotification {
  id: number;
  repoConfigId: number;
  notificationPlatform: Platform;
  channelId: string;
  guildId: string | null;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RepoConfig {
  id: number;
  workspaceId: number;
  providerType: SourceProvider;
  providerRepo: string;
  claimedByUserId: number | null;
  isActive: boolean;
  notifications: RepoConfigNotification[];
  createdAt: string;
  updatedAt: string;
}

export interface RepoEventToggle {
  id: number;
  repoConfigNotificationId: number;
  eventType: string;
  isEnabled: boolean;
}

export interface NotifierLog {
  id: number;
  repoConfigNotificationId: number;
  eventType: string;
  status: string;
  platform: string;
  providerEntityType: string;
  providerEntityId: string;
  providerEntityNumber: number | null;
  summary: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface RepoConfigInput {
  workspaceId: number;
  providerType: SourceProvider;
  providerRepo: string;
  notifications: { platform: Platform; channelId: string; guildId?: string | null; tags?: string[] }[];
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
    try {
      const repo = await apiClient<RepoConfig>("/api/repos/config", {
        method: "POST",
        body: JSON.stringify(input),
      });
      toast.success("Repository added successfully");
      return repo;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add repository");
      throw err;
    }
  }, []);

  const update = useCallback(
    async (id: number, input: { isActive?: boolean }) => {
      try {
        await apiClient(`/api/repos/config/${id}`, {
          method: "PATCH",
          body: JSON.stringify(input),
        });
        toast.success("Repository updated successfully");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update repository");
        throw err;
      }
    },
    [],
  );

  const remove = useCallback(async (id: number) => {
    try {
      await apiClient(`/api/repos/config/${id}`, { method: "DELETE" });
      toast.success("Repository removed successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove repository");
      throw err;
    }
  }, []);

  const toggleActive = useCallback(async (id: number, isActive: boolean) => {
    try {
      await apiClient(`/api/repos/config/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      toast.success(isActive ? "Repository activated" : "Repository deactivated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update repository");
      throw err;
    }
  }, []);

  const createNotification = useCallback(async (repoConfigId: number, data: { platform: Platform; channelId: string; guildId?: string | null; tags?: string[] }) => {
    try {
      const notif = await apiClient<RepoConfigNotification>(`/api/repos/config/${repoConfigId}/notifications`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return notif;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add notification");
      throw err;
    }
  }, []);

  const updateNotification = useCallback(async (notificationId: number, data: { channelId?: string; guildId?: string | null; isActive?: boolean; tags?: string[] }) => {
    try {
      await apiClient(`/api/repos/config/notifications/${notificationId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update notification");
      throw err;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      await apiClient(`/api/repos/config/notifications/${notificationId}`, { method: "DELETE" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete notification");
      throw err;
    }
  }, []);

  const getEventToggles = useCallback(async (notificationId: number) => {
    return apiClient<RepoEventToggle[]>(`/api/repos/config/notifications/${notificationId}/toggles`);
  }, []);

  const upsertEventToggle = useCallback(async (notificationId: number, eventType: string, isEnabled: boolean) => {
    try {
      await apiClient(`/api/repos/config/notifications/${notificationId}/toggles`, {
        method: "PUT",
        body: JSON.stringify({ eventType, isEnabled }),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update event toggle");
      throw err;
    }
  }, []);

  const getNotifierLogs = useCallback(
    async (notificationId: number, limit = 50, offset = 0) => {
      return apiClient<{
        logs: NotifierLog[];
        total: number;
      }>(`/api/repos/config/notifications/${notificationId}/logs?limit=${limit}&offset=${offset}`);
    },
    [],
  );

  return {
    create,
    update,
    remove,
    toggleActive,
    createNotification,
    updateNotification,
    deleteNotification,
    getEventToggles,
    upsertEventToggle,
    getNotifierLogs,
  };
}
