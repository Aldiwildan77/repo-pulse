import type { RepoConfigInput } from "@/hooks/use-repositories";

export const defaultValues: RepoConfigInput = {
  provider: "github",
  providerRepo: "",
  platform: "discord",
  channelId: "",
  tags: [],
};

export interface ChannelMapping {
  channelId: string;
  guildId: string | null; // Discord-only
  tags: string[];
  existingConfigId?: number; // used in edit mode for diff-based save
}

export interface PlatformConfig {
  enabled: boolean;
  mappings: ChannelMapping[];
}

export interface MultiPlatformState {
  discord: PlatformConfig;
  slack: PlatformConfig;
}

export const defaultChannelMapping: ChannelMapping = {
  channelId: "",
  guildId: null,
  tags: [],
};

export const defaultMultiPlatformState: MultiPlatformState = {
  discord: { enabled: true, mappings: [{ ...defaultChannelMapping }] },
  slack: { enabled: false, mappings: [] },
};
