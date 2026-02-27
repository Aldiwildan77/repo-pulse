import { useState, useEffect, useMemo, type FormEvent } from "react";
import { ExternalLinkIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useDiscordGuilds,
  useDiscordChannels,
  useSlackChannels,
} from "@/hooks/use-platforms";
import { useConnectedRepos } from "@/hooks/use-connected-repos";
import { API_URL } from "@/utils/constants";
import type { Platform, SourceProvider } from "@/utils/constants";
import type { RepoConfigInput } from "@/hooks/use-repositories";

interface RepoConfigFormProps {
  initialValues?: RepoConfigInput;
  onSubmit: (values: RepoConfigInput) => Promise<void>;
  isSubmitting: boolean;
}

const defaultValues: RepoConfigInput = {
  provider: "github",
  providerRepo: "",
  platform: "discord",
  channelId: "",
};

export function RepoConfigForm({
  initialValues,
  onSubmit,
  isSubmitting,
}: RepoConfigFormProps) {
  const [values, setValues] = useState<RepoConfigInput>(
    initialValues ?? defaultValues,
  );
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);

  const {
    repos: connectedRepos,
    isLoading: reposLoading,
    refetch: refetchRepos,
  } = useConnectedRepos();

  const { guilds, isLoading: guildsLoading } = useDiscordGuilds();
  const { channels: discordChannels, isLoading: discordChannelsLoading } =
    useDiscordChannels(
      values.platform === "discord" ? selectedGuildId : null,
    );
  const { channels: slackChannels, isLoading: slackChannelsLoading } =
    useSlackChannels();

  // When editing, try to find and pre-select the guild that contains the existing channel
  useEffect(() => {
    if (
      initialValues?.platform === "discord" &&
      initialValues.channelId &&
      guilds.length > 0 &&
      !selectedGuildId
    ) {
      // Auto-select the first guild; the channel will be matched once channels load
      setSelectedGuildId(guilds[0].id);
    }
  }, [initialValues, guilds, selectedGuildId]);

  // When editing discord and channels load, auto-select matching channel's guild
  useEffect(() => {
    if (
      initialValues?.platform === "discord" &&
      initialValues.channelId &&
      discordChannels.length > 0
    ) {
      const found = discordChannels.find(
        (ch) => ch.id === initialValues.channelId,
      );
      if (found) return; // channel found in current guild, all good

      // Try next guild if channel not found
      if (guilds.length > 0 && selectedGuildId) {
        const currentIdx = guilds.findIndex((g) => g.id === selectedGuildId);
        const nextGuild = guilds[currentIdx + 1];
        if (nextGuild) {
          setSelectedGuildId(nextGuild.id);
        }
      }
    }
  }, [initialValues, discordChannels, guilds, selectedGuildId]);

  const filteredRepos = useMemo(
    () => connectedRepos.filter((r) => r.provider === values.provider),
    [connectedRepos, values.provider],
  );

  // Reset providerRepo when provider changes
  const handleProviderChange = (provider: SourceProvider) => {
    setValues((prev) => ({ ...prev, provider, providerRepo: "" }));
  };

  // Reset channel when platform changes
  const handlePlatformChange = (platform: Platform) => {
    setValues((prev) => ({ ...prev, platform, channelId: "" }));
    setSelectedGuildId(null);
  };

  // Reset channel when guild changes
  const handleGuildChange = (guildId: string) => {
    setSelectedGuildId(guildId);
    setValues((prev) => ({ ...prev, channelId: "" }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(values);
  };

  const channels =
    values.platform === "discord" ? discordChannels : slackChannels;
  const channelsLoading =
    values.platform === "discord"
      ? discordChannelsLoading
      : slackChannelsLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="provider">Source Provider</Label>
        <Select
          value={values.provider}
          onValueChange={(v: SourceProvider) => handleProviderChange(v)}
        >
          <SelectTrigger id="provider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="github">GitHub</SelectItem>
            <SelectItem value="gitlab">GitLab</SelectItem>
            <SelectItem value="bitbucket">Bitbucket</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="providerRepo">Repository</Label>
        {filteredRepos.length > 0 || reposLoading ? (
          <Select
            value={values.providerRepo}
            onValueChange={(v) =>
              setValues((prev) => ({ ...prev, providerRepo: v }))
            }
            disabled={reposLoading}
          >
            <SelectTrigger id="providerRepo">
              <SelectValue
                placeholder={
                  reposLoading
                    ? "Loading repositories..."
                    : "Select a repository"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {/* In edit mode, keep current value even if not in connected list */}
              {initialValues?.providerRepo &&
                !filteredRepos.some(
                  (r) => r.providerRepo === initialValues.providerRepo,
                ) && (
                  <SelectItem value={initialValues.providerRepo}>
                    {initialValues.providerRepo}
                  </SelectItem>
                )}
              {filteredRepos.map((r) => (
                <SelectItem key={r.id} value={r.providerRepo}>
                  {r.providerRepo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              No connected repositories found.
            </p>
            {values.provider === "github" && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(
                      `${API_URL}/api/providers/${values.provider}/install`,
                      "_blank",
                    )
                  }
                >
                  <ExternalLinkIcon className="mr-1 h-4 w-4" />
                  Install GitHub App
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={refetchRepos}
                >
                  <RefreshCwIcon className="mr-1 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="platform">Platform</Label>
        <Select
          value={values.platform}
          onValueChange={(v: Platform) => handlePlatformChange(v)}
        >
          <SelectTrigger id="platform">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="discord">Discord</SelectItem>
            <SelectItem value="slack">Slack</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {values.platform === "discord" && (
        <div className="space-y-2">
          <Label htmlFor="guild">Server</Label>
          <Select
            value={selectedGuildId ?? ""}
            onValueChange={handleGuildChange}
            disabled={guildsLoading}
          >
            <SelectTrigger id="guild">
              <SelectValue
                placeholder={
                  guildsLoading ? "Loading servers..." : "Select a server"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {guilds.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select the Discord server where the bot is installed
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="channelId">Channel</Label>
        <Select
          value={values.channelId}
          onValueChange={(v) => setValues((prev) => ({ ...prev, channelId: v }))}
          disabled={
            channelsLoading ||
            (values.platform === "discord" && !selectedGuildId)
          }
        >
          <SelectTrigger id="channelId">
            <SelectValue
              placeholder={
                channelsLoading
                  ? "Loading channels..."
                  : values.platform === "discord" && !selectedGuildId
                    ? "Select a server first"
                    : "Select a channel"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {channels.map((ch) => (
              <SelectItem key={ch.id} value={ch.id}>
                # {ch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          The {values.platform === "discord" ? "Discord" : "Slack"} channel
          where notifications will be sent
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting
          ? "Saving..."
          : initialValues
            ? "Update Repository"
            : "Add Repository"}
      </Button>
    </form>
  );
}
