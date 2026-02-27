import { useApi } from "./use-api";

interface Guild {
  id: string;
  name: string;
  icon: string | null;
}

interface Channel {
  id: string;
  name: string;
}

export function useDiscordGuilds() {
  const { data, isLoading, error } =
    useApi<Guild[]>("/api/platforms/discord/guilds");
  return { guilds: data ?? [], isLoading, error };
}

export function useDiscordChannels(guildId: string | null) {
  const { data, isLoading, error } = useApi<Channel[]>(
    guildId ? `/api/platforms/discord/guilds/${guildId}/channels` : null,
  );
  return { channels: data ?? [], isLoading, error };
}

export function useSlackChannels() {
  const { data, isLoading, error } =
    useApi<Channel[]>("/api/platforms/slack/channels");
  return { channels: data ?? [], isLoading, error };
}

export function useDiscordBotInvite() {
  const { data, isLoading } =
    useApi<{ url: string }>("/api/platforms/discord/bot-invite");
  return { inviteUrl: data?.url ?? null, isLoading };
}
