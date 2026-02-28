# Repo Pulse

A webhook-driven integration platform that bridges GitHub/Gitlab/Bitbucket/Others pull request events to Discord and Slack. Get real-time PR notifications, mention routing, and status synchronization to your team's chat platforms like Slack and Discord!

https://github.com/user-attachments/assets/e8c20e4e-b069-4636-8904-164640339572

## Features

- **PR Notifications** — Automatically send new PR alerts to configured Discord/Slack channels
- **Mention Routing** — `@mention` someone in a PR comment and they get a DM on Discord/Slack
- **Status Reactions** — Merged PRs get a ✅, closed PRs get a ❌ on the original notification
- **Label Notifications** — Get notified when labels are added or removed from PRs
- **GitHub App Integration** — Install as a GitHub App for automatic repository discovery
- **Multi-Platform Binding** — Users can bind Discord, Slack, or both to their GitHub account
- **Idempotent Processing** — Duplicate webhook deliveries are safely ignored
- **Async Event Processing** — Webhook responses are fast (<200ms), events processed in the background
- **Configurable Bindings** — Users can choose which events trigger notifications and where they go
