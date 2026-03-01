import type { SourceProvider } from "@/utils/constants";

export interface SourceValues {
  providerType: SourceProvider;
  providerRepo: string;
}

export const defaultSourceValues: SourceValues = {
  providerType: "github",
  providerRepo: "",
};

export interface ChannelMapping {
  channelId: string;
  guildId: string | null; // Discord-only
  tags: string[];
  existingNotificationId?: number; // used in edit mode for diff-based save
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
