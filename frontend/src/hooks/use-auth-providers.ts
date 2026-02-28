import { useState, useEffect } from "react";
import { API_URL } from "@/utils/constants";

export function useAuthProviders() {
  const [providers, setProviders] = useState<string[]>(["github"]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/providers`, { credentials: "include" })
      .then((res) => res.json())
      .then((data: { providers: string[] }) => {
        setProviders(data.providers);
      })
      .catch(() => {
        // Fall back to GitHub only
        setProviders(["github"]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { providers, isLoading };
}
