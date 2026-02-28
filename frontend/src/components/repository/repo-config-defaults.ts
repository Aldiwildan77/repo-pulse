import type { RepoConfigInput } from "@/hooks/use-repositories";

export const defaultValues: RepoConfigInput = {
  provider: "github",
  providerRepo: "",
  platform: "discord",
  channelId: "",
};
