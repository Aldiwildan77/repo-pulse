import { useApi } from "./use-api";
import type { SourceProvider } from "@/utils/constants";

interface ConnectedRepo {
  provider: SourceProvider;
  providerRepo: string;
}

export function useConnectedRepos(provider: SourceProvider = "github") {
  const { data, isLoading, error, refetch } =
    useApi<ConnectedRepo[]>(`/api/repos/connected?provider=${provider}`);
  return { repos: data ?? [], isLoading, error, refetch };
}
