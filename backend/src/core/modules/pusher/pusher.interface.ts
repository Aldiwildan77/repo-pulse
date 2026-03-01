export interface PrNotificationPayload {
  repo: string;
  title: string;
  author: string;
  url: string;
}

export interface MentionNotificationPayload {
  repo: string;
  title: string;
  url: string;
  isPullRequest: boolean;
  commenter: string;
  commentBody: string;
}

export interface LabelNotificationPayload {
  repo: string;
  prTitle: string;
  prUrl: string;
  action: "labeled" | "unlabeled";
  label: { name: string; color: string };
  author: string;
}

export interface IssueNotificationPayload {
  repo: string;
  title: string;
  author: string;
  url: string;
  action: "opened" | "closed";
}

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
}

export interface Channel {
  id: string;
  name: string;
}

export interface Pusher {
  sendPrNotification(
    channelId: string,
    payload: PrNotificationPayload,
  ): Promise<string>; // returns platform message ID

  sendMentionNotification(
    userId: string,
    payload: MentionNotificationPayload,
  ): Promise<void>;

  sendLabelNotification(
    channelId: string,
    payload: LabelNotificationPayload,
  ): Promise<string>; // returns platform message ID

  sendIssueNotification(
    channelId: string,
    payload: IssueNotificationPayload,
  ): Promise<void>;

  addReaction(
    channelId: string,
    messageId: string,
    emoji: string,
  ): Promise<void>;

  removeButtons(
    channelId: string,
    messageId: string,
  ): Promise<void>;

  deleteMessage(
    channelId: string,
    messageId: string,
  ): Promise<void>;

  listGuilds?(): Promise<Guild[]>;
  listChannels(guildId?: string): Promise<Channel[]>;
}
