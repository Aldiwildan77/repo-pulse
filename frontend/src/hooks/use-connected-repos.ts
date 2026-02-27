import { useApi } from "./use-api";
import type { SourceProvider } from "@/utils/constants";

interface ConnectedRepo {
  id: number;
  provider: SourceProvider;
  providerRepo: string;
}

export function useConnectedRepos() {
  const { data, isLoading, error, refetch } =
    useApi<ConnectedRepo[]>("/api/repos/connected");
  return { repos: data ?? [], isLoading, error, refetch };
}
