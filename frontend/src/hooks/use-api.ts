import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/utils/api-client";

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface UseApiResult<T> extends UseApiState<T> {
  refetch: () => void;
}

export function useApi<T>(path: string | null): UseApiResult<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: !!path,
    error: null,
  });
  const [fetchCount, setFetchCount] = useState(0);

  useEffect(() => {
    if (!path) return;

    let cancelled = false;

    apiClient<T>(path)
      .then((data) => {
        if (!cancelled) setState({ data, isLoading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled)
          setState({
            data: null,
            isLoading: false,
            error: err instanceof Error ? err.message : "Request failed",
          });
      });

    return () => {
      cancelled = true;
    };
  }, [path, fetchCount]);

  const refetch = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    setFetchCount((c) => c + 1);
  }, []);

  return { ...state, refetch };
}
