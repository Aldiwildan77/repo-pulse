import { useAuth } from "./use-auth";
import { API_URL } from "@/utils/constants";

export function useUserBindings() {
  const { user } = useAuth();

  return {
    githubBound: user?.githubBound ?? false,
    googleBound: user?.googleBound ?? false,
    discordBound: user?.discordBound ?? false,
    slackBound: user?.slackBound ?? false,
    githubConnectUrl: `${API_URL}/api/auth/github`,
    googleConnectUrl: `${API_URL}/api/auth/google`,
    discordConnectUrl: `${API_URL}/api/auth/discord`,
    slackConnectUrl: `${API_URL}/api/auth/slack`,
  };
}
