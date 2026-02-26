import { useAuth } from "./use-auth";
import { API_URL } from "@/utils/constants";

export function useUserBindings() {
  const { user } = useAuth();

  return {
    discordBound: user?.discordBound ?? false,
    slackBound: user?.slackBound ?? false,
    discordConnectUrl: `${API_URL}/api/auth/discord`,
    slackConnectUrl: `${API_URL}/api/auth/slack`,
  };
}
