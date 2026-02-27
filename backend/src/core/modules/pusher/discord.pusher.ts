import { ChannelType, Client, EmbedBuilder, GatewayIntentBits } from "discord.js";
import type { Pusher, PrNotificationPayload, MentionNotificationPayload, LabelNotificationPayload, Guild, Channel } from "./pusher.interface.js";

export class DiscordPusher implements Pusher {
  private readonly client: Client;
  private ready: Promise<void>;

  constructor(botToken: string) {
    this.client = new Client({ intents: [GatewayIntentBits.Guilds] });
    this.ready = this.client.login(botToken).then(() => {});
  }

  async sendPrNotification(channelId: string, payload: PrNotificationPayload): Promise<string> {
    await this.ready;

    const channel = await this.client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      throw new Error(`Channel ${channelId} not found or not a text channel`);
    }

    const embed = new EmbedBuilder()
      .setTitle("New Pull Request")
      .setDescription(
        [
          `**Repo:** ${payload.repo}`,
          `**Title:** ${payload.title}`,
          `**Author:** @${payload.author}`,
          `**Link:** ${payload.url}`,
        ].join("\n"),
      )
      .setColor(0x2f8b3a);

    const message = await channel.send({ embeds: [embed] });
    return message.id;
  }

  async sendMentionNotification(userId: string, payload: MentionNotificationPayload): Promise<void> {
    await this.ready;

    const user = await this.client.users.fetch(userId);
    const embed = new EmbedBuilder()
      .setTitle("You were mentioned in a PR comment")
      .setDescription(
        [
          `**Repo:** ${payload.repo}`,
          `**PR:** ${payload.prTitle}`,
          `**By:** @${payload.commenter}`,
          `**Comment:** ${payload.commentBody.slice(0, 200)}`,
          `**Link:** ${payload.prUrl}`,
        ].join("\n"),
      )
      .setColor(0x5865f2);

    await user.send({ embeds: [embed] });
  }

  async sendLabelNotification(channelId: string, payload: LabelNotificationPayload): Promise<void> {
    await this.ready;

    const channel = await this.client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      throw new Error(`Channel ${channelId} not found or not a text channel`);
    }

    const actionText = payload.action === "labeled" ? "Label Added" : "Label Removed";
    const emoji = payload.action === "labeled" ? "\uD83C\uDFF7\uFE0F" : "\uD83D\uDDD1\uFE0F";
    const color = parseInt(payload.label.color, 16) || 0x95a5a6;

    const embed = new EmbedBuilder()
      .setTitle(`${emoji} ${actionText}`)
      .setDescription(
        [
          `**Repo:** ${payload.repo}`,
          `**PR:** ${payload.prTitle}`,
          `**Label:** ${payload.label.name}`,
          `**By:** @${payload.author}`,
          `**Link:** ${payload.prUrl}`,
        ].join("\n"),
      )
      .setColor(color);

    await channel.send({ embeds: [embed] });
  }

  async addReaction(channelId: string, messageId: string, emoji: string): Promise<void> {
    await this.ready;

    const channel = await this.client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      throw new Error(`Channel ${channelId} not found or not a text channel`);
    }

    const message = await channel.messages.fetch(messageId);
    await message.react(emoji);
  }

  async listGuilds(): Promise<Guild[]> {
    await this.ready;
    return this.client.guilds.cache.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.iconURL(),
    }));
  }

  async listChannels(guildId: string): Promise<Channel[]> {
    await this.ready;
    const guild = await this.client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();
    return channels
      .filter((ch) => ch !== null && ch.type === ChannelType.GuildText)
      .map((ch) => ({ id: ch!.id, name: ch!.name }));
  }
}
