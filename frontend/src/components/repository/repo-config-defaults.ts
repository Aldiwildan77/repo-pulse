import type { RepoConfigInput } from "@/hooks/use-repositories";

export const defaultValues: RepoConfigInput = {
  provider: "github",
  providerRepo: "",
  platform: "discord",
  channelId: "",
  tags: [],
};

export interface PlatformConfig {
  enabled: boolean;
  channelId: string;
  guildId: string | null;
  tags: string[];
}

export interface MultiPlatformState {
  discord: PlatformConfig;
  slack: PlatformConfig;
}

export const defaultPlatformConfig: PlatformConfig = {
  enabled: false,
  channelId: "",
  guildId: null,
  tags: [],
};

export const defaultMultiPlatformState: MultiPlatformState = {
  discord: { ...defaultPlatformConfig, enabled: true },
  slack: { ...defaultPlatformConfig },
};
