import type { FastifyRequest } from "fastify";
import type { WebhookProvider, WebhookEvent } from "../../core/webhook/webhook-provider.js";

export class GitLabWebhookProvider implements WebhookProvider {
  readonly name = "gitlab" as const;

  constructor(private readonly secret: string) {}

  verifySignature(request: FastifyRequest): boolean {
    const token = request.headers["x-gitlab-token"] as string | undefined;
    if (!token) return false;
    return token === this.secret;
  }

  extractDeliveryId(request: FastifyRequest): string | null {
    const payload = request.body as Record<string, unknown>;
    const objectKind = payload.object_kind as string | undefined;
    const attrs = payload.object_attributes as Record<string, unknown> | undefined;

    if (!attrs?.id) return null;

    // Build a synthetic delivery ID from the object kind + id + action
    const action = (attrs.action as string) ?? objectKind ?? "unknown";
    return `${objectKind}-${attrs.id}-${action}`;
  }

  parseEvent(request: FastifyRequest): WebhookEvent {
    const payload = request.body as Record<string, unknown>;
    const eventType = request.headers["x-gitlab-event"] as string;

    if (eventType === "Merge Request Hook") {
      return this.parseMergeRequest(payload);
    }

    if (eventType === "Note Hook") {
      return this.parseNote(payload);
    }

    if (eventType === "Merge Request Approval Hook" || eventType === "Merge Request Unapproval Hook") {
      return this.parseMergeRequestApproval(payload, eventType);
    }

    if (eventType === "Issue Hook") {
      return this.parseIssue(payload);
    }

    return { kind: "ignored" };
  }

  private parseMergeRequest(payload: Record<string, unknown>): WebhookEvent {
    const attrs = payload.object_attributes as Record<string, unknown>;
    const project = payload.project as Record<string, unknown>;
    const user = payload.user as Record<string, unknown>;
    const repo = project.path_with_namespace as string;
    const action = attrs.action as string;

    if (action === "open") {
      return {
        kind: "pr_opened",
        data: {
          prId: attrs.iid as number,
          repo,
          title: attrs.title as string,
          author: user.username as string,
          url: attrs.url as string,
        },
      };
    }

    if (action === "merge") {
      return {
        kind: "pr_closed",
        data: {
          prId: attrs.iid as number,
          repo,
          merged: true,
        },
      };
    }

    if (action === "close") {
      return {
        kind: "pr_closed",
        data: {
          prId: attrs.iid as number,
          repo,
          merged: false,
        },
      };
    }

    if (action === "update") {
      return this.parseMergeRequestLabelChange(payload);
    }

    return { kind: "ignored" };
  }

  private parseMergeRequestLabelChange(payload: Record<string, unknown>): WebhookEvent {
    const changes = payload.changes as Record<string, unknown> | undefined;
    if (!changes?.labels) return { kind: "ignored" };

    const labelChanges = changes.labels as {
      previous: Array<{ title: string; color: string }>;
      current: Array<{ title: string; color: string }>;
    };

    const attrs = payload.object_attributes as Record<string, unknown>;
    const project = payload.project as Record<string, unknown>;
    const user = payload.user as Record<string, unknown>;
    const repo = project.path_with_namespace as string;

    const previousNames = new Set(labelChanges.previous.map((l) => l.title));
    const currentNames = new Set(labelChanges.current.map((l) => l.title));

    // Find added labels
    for (const label of labelChanges.current) {
      if (!previousNames.has(label.title)) {
        return {
          kind: "pr_label_changed",
          data: {
            prId: attrs.iid as number,
            repo,
            action: "labeled",
            label: { name: label.title, color: label.color },
            author: user.username as string,
            prTitle: attrs.title as string,
            prUrl: attrs.url as string,
          },
        };
      }
    }

    // Find removed labels
    for (const label of labelChanges.previous) {
      if (!currentNames.has(label.title)) {
        return {
          kind: "pr_label_changed",
          data: {
            prId: attrs.iid as number,
            repo,
            action: "unlabeled",
            label: { name: label.title, color: label.color },
            author: user.username as string,
            prTitle: attrs.title as string,
            prUrl: attrs.url as string,
          },
        };
      }
    }

    return { kind: "ignored" };
  }

  private parseMergeRequestApproval(payload: Record<string, unknown>, eventType: string): WebhookEvent {
    const attrs = payload.object_attributes as Record<string, unknown>;
    const project = payload.project as Record<string, unknown>;
    const user = payload.user as Record<string, unknown>;
    const repo = project.path_with_namespace as string;
    const isApproved = eventType === "Merge Request Approval Hook";

    return {
      kind: "pr_review",
      data: {
        prId: attrs.iid as number,
        repo,
        prTitle: attrs.title as string,
        prUrl: attrs.url as string,
        reviewer: user.username as string,
        state: isApproved ? "approved" : "changes_requested",
      },
    };
  }

  private parseIssue(payload: Record<string, unknown>): WebhookEvent {
    const attrs = payload.object_attributes as Record<string, unknown>;
    const project = payload.project as Record<string, unknown>;
    const user = payload.user as Record<string, unknown>;
    const repo = project.path_with_namespace as string;
    const action = attrs.action as string;

    if (action === "open") {
      return {
        kind: "issue_opened",
        data: {
          issueId: attrs.iid as number,
          repo,
          title: attrs.title as string,
          author: user.username as string,
          url: attrs.url as string,
        },
      };
    }

    if (action === "close") {
      return {
        kind: "issue_closed",
        data: {
          issueId: attrs.iid as number,
          repo,
          title: attrs.title as string,
          author: user.username as string,
          url: attrs.url as string,
        },
      };
    }

    return { kind: "ignored" };
  }

  private parseNote(payload: Record<string, unknown>): WebhookEvent {
    const attrs = payload.object_attributes as Record<string, unknown>;
    const noteableType = attrs.noteable_type as string;

    if (noteableType !== "MergeRequest" && noteableType !== "Issue") {
      return { kind: "ignored" };
    }

    const project = payload.project as Record<string, unknown>;
    const user = payload.user as Record<string, unknown>;
    const repo = project.path_with_namespace as string;
    const body = attrs.note as string;

    const mentionRegex = /@([a-zA-Z0-9_.-]+)/g;
    const mentions: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = mentionRegex.exec(body)) !== null) {
      mentions.push(match[1]);
    }

    if (mentions.length === 0) {
      return { kind: "ignored" };
    }

    const isPullRequest = noteableType === "MergeRequest";
    const noteable = isPullRequest
      ? payload.merge_request as Record<string, unknown>
      : payload.issue as Record<string, unknown>;

    return {
      kind: "comment",
      data: {
        repo,
        title: noteable.title as string,
        url: (noteable.url as string) ?? attrs.url as string,
        isPullRequest,
        commenter: user.username as string,
        body,
        mentionedUsernames: mentions,
      },
    };
  }
}
