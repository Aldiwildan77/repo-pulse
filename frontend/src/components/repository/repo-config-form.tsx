import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
          onValueChange={(v: SourceProvider) =>
            setValues((prev) => ({ ...prev, provider: v }))
          }
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
        <Input
          id="providerRepo"
          placeholder="owner/repo"
          value={values.providerRepo}
          onChange={(e) =>
            setValues((v) => ({ ...v, providerRepo: e.target.value }))
          }
          required
        />
        <p className="text-xs text-muted-foreground">
          Full repository name (e.g., octocat/hello-world)
        </p>
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
