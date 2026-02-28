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

export interface ReviewNotificationPayload {
  repo: string;
  prTitle: string;
  prUrl: string;
  reviewer: string;
  state: "approved" | "changes_requested";
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
  ): Promise<void>;

  sendIssueNotification(
    channelId: string,
    payload: IssueNotificationPayload,
  ): Promise<void>;

  sendReviewNotification(
    channelId: string,
    payload: ReviewNotificationPayload,
  ): Promise<void>;

  addReaction(
    channelId: string,
    messageId: string,
    emoji: string,
  ): Promise<void>;

  listGuilds?(): Promise<Guild[]>;
  listChannels(guildId?: string): Promise<Channel[]>;
}
