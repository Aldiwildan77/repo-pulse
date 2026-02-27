import crypto from "node:crypto";
import type { FastifyRequest } from "fastify";
import type { WebhookProvider, WebhookEvent } from "../../core/webhook/webhook-provider.js";

export class GitHubWebhookProvider implements WebhookProvider {
  readonly name = "github" as const;

  constructor(private readonly secret: string) {}

  verifySignature(request: FastifyRequest): boolean {
    const signature = request.headers["x-hub-signature-256"] as string | undefined;
    if (!signature) return false;

    const body = request.rawBody;
    if (!body) return false;

    const expected =
      "sha256=" +
      crypto.createHmac("sha256", this.secret).update(body).digest("hex");

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);

    if (sigBuf.length !== expectedBuf.length) return false;

    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  }

  extractDeliveryId(request: FastifyRequest): string | null {
    return (request.headers["x-github-delivery"] as string) ?? null;
  }

  parseEvent(request: FastifyRequest): WebhookEvent {
    const eventType = request.headers["x-github-event"] as string;
    const payload = request.body as Record<string, unknown>;

    if (eventType === "pull_request") {
      return this.parsePullRequest(payload);
    }

    if (eventType === "issue_comment") {
      return this.parseIssueComment(payload);
    }

    if (eventType === "installation") {
      return this.parseInstallation(payload);
    }

    if (eventType === "installation_repositories") {
      return this.parseInstallationRepositories(payload);
    }

    return { kind: "ignored" };
  }

  private parsePullRequest(payload: Record<string, unknown>): WebhookEvent {
    const action = payload.action as string;
    const pr = payload.pull_request as Record<string, unknown>;
    const repo = (payload.repository as Record<string, unknown>).full_name as string;

    if (action === "opened") {
      return {
        kind: "pr_opened",
        data: {
          prId: pr.number as number,
          repo,
          title: pr.title as string,
          author: (pr.user as Record<string, unknown>).login as string,
          url: pr.html_url as string,
        },
      };
    }

    if (action === "closed") {
      return {
        kind: "pr_closed",
        data: {
          prId: pr.number as number,
          repo,
          merged: pr.merged as boolean,
        },
      };
    }

    return { kind: "ignored" };
  }

  private parseInstallation(payload: Record<string, unknown>): WebhookEvent {
    const action = payload.action as string;
    const installation = payload.installation as Record<string, unknown>;
    const installationId = String(installation.id);
    const sender = payload.sender as Record<string, unknown>;
    const senderUserId = String(sender.id);

    if (action === "created") {
      const repositories = (payload.repositories ?? []) as Record<string, unknown>[];
      const repos = repositories.map((r) => r.full_name as string);

      return {
        kind: "installation_created",
        data: {
          provider: "github",
          installationId,
          senderUserId,
          repos,
        },
      };
    }

    if (action === "deleted") {
      return {
        kind: "installation_deleted",
        data: {
          provider: "github",
          installationId,
        },
      };
    }

    return { kind: "ignored" };
  }

  private parseInstallationRepositories(payload: Record<string, unknown>): WebhookEvent {
    const installation = payload.installation as Record<string, unknown>;
    const installationId = String(installation.id);
    const sender = payload.sender as Record<string, unknown>;
    const senderUserId = String(sender.id);

    const added = ((payload.repositories_added ?? []) as Record<string, unknown>[]).map(
      (r) => r.full_name as string,
    );
    const removed = ((payload.repositories_removed ?? []) as Record<string, unknown>[]).map(
      (r) => r.full_name as string,
    );

    return {
      kind: "installation_repos_changed",
      data: {
        provider: "github",
        installationId,
        senderUserId,
        added,
        removed,
      },
    };
  }

  private parseIssueComment(payload: Record<string, unknown>): WebhookEvent {
    const comment = payload.comment as Record<string, unknown>;
    const issue = payload.issue as Record<string, unknown>;
    const repo = (payload.repository as Record<string, unknown>).full_name as string;
    const body = comment.body as string;

    const mentionRegex = /@([a-zA-Z0-9-]+)/g;
    const mentions: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = mentionRegex.exec(body)) !== null) {
      mentions.push(match[1]);
    }

    if (mentions.length === 0) {
      return { kind: "ignored" };
    }

    return {
      kind: "comment",
      data: {
        repo,
        prTitle: issue.title as string,
        prUrl: issue.html_url as string,
        commenter: (comment.user as Record<string, unknown>).login as string,
        body,
        mentionedUsernames: mentions,
      },
    };
  }
}
