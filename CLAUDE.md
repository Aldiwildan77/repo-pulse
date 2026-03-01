# 📘 Product Requirements Document (PRD)

# GitHub Event Bridge (name: Repo Pulse)

---

## 1. Project Overview

### 1.1 Summary

GitHub Event Bridge is a webhook-driven integration platform that connects GitHub pull request (PR) events to communication platforms such as Discord and Slack.

The system enables real-time PR notifications, mention routing, and status synchronization between GitHub and chat platforms.

---

### 1.2 Core Objectives

The system must:

1. Listen to GitHub webhook events
2. Send PR notifications to Discord / Slack
3. Sync PR status changes (merged / closed)
4. Handle mention mapping (GitHub → Discord / Slack)
5. Allow account binding via web dashboard

# System Rules & Architecture Specification

This document defines the business rules and data rules enforced by the database schema.

---

# 1. User & Authentication Rules

## Identity Rules

- One `user` can have multiple `user_identities`.
- `(provider, provider_user_id)` must be globally unique.
- One user can have only one TOTP configuration.
- If a user is deleted:
  - All identities are deleted (CASCADE).
  - TOTP is deleted.

## Authentication Providers

- OAuth providers are defined by `auth_provider_type`.
- Login is valid only if a matching identity exists.

---

# 2. Workspace Rules

## Membership

- One workspace can have multiple members.
- One user can belong to multiple workspaces.
- `(workspace_id, user_id)` must be unique for active states:
  - `pending`
  - `accepted`
- A user with status `removed` can be invited again.

## Roles

Available roles:

- `owner`
- `admin`
- `member`

Expected behavior (application layer enforcement):

- Owner can manage everything.
- Admin can invite members.
- Member has limited permissions.
- A workspace must always have at least one owner (enforced in application logic).

---

# 3. Repository Claim Rules (Anti-Takeover Model)

## Global Uniqueness

`(provider_type, provider_repo)` is UNIQUE.

This means:

- A repository can only exist once in the entire system.
- First claim wins.
- No duplicate repository configurations across workspaces.

## Claim Metadata

Each repository stores:

- `claimed_by_user_id`
- `claimed_at`

If the claiming user is deleted:

- The claim remains (user reference becomes NULL).

## Ownership Transfer

Repository ownership transfer is done by:

UPDATE repo_configs SET workspace_id = <new_workspace_id>;

No duplicate record is created.

---

# 4. Repository Access Requests

If a repository is already claimed:

- Another user cannot claim it directly.
- The user must create a `repo_access_request`.

Rules:

- Only one pending request per user per repository.
- Status values:
  - `pending`
  - `approved`
  - `rejected`
- If approved:
  - The user is added to the workspace.

---

# 5. Notification Configuration Rules

## Channels

- One repository can have multiple notification channels.
- `(repo_config_id, notification_platform, channel_id)` must be unique.
- Channels can be enabled/disabled using `is_active`.

## Tags

- One channel can have multiple tags.
- Tags must be unique per channel.
- If a channel has no tag → it receives all events (default behavior).

---

## PR Tag-Based Notification Rule

When a Pull Request (PR) event is received:

1. Extract all labels/tags from the PR.
2. Find all active `repo_config_notifications` for the repository.
3. Join with `repo_config_notification_tags`.

### Matching Logic

A channel must be notified if:

- The PR contains at least one tag that matches a tag in `repo_config_notification_tags`
- OR the channel has no tags configured (default channel)

### Duplicate Prevention Rule

Because a channel may match multiple PR tags:

- The final list of channels to notify **must be deduplicated by:**
  - `notification_platform`
  - `channel_id`

Only one notification per unique channel must be sent, even if multiple tags match.

### Example

If:

- Channel A has tags: `bug`, `urgent`
- PR contains: `bug`, `urgent`

Result:

- Channel A receives **only one notification**, not two.

---

## Event Toggles

- Each channel can enable/disable specific event types.
- `(repo_config_notification_id, event_type)` must be unique.
- `is_enabled = true` means the event will be delivered.
- If disabled → event is skipped for that channel.

---

# 6. Webhook Rules

## Idempotency

`webhook_event_logs.event_id` is UNIQUE.

This ensures:

- The same webhook event is processed only once.
- Duplicate webhook deliveries from provider are ignored.

---

# 7. Notification Processing Rules

## Status Lifecycle

Notification statuses:

- `queued`
- `processing`
- `delivered`
- `failed`
- `skipped`

Lifecycle:

queued → processing → delivered | failed | skipped

Rules:

- `resolved_at` is set when processing finishes.
- `handling_time` is automatically calculated.
- If `resolved_at` is NULL → `handling_time` is NULL.

---

# 8. Delivery Tracking Rules

- One `notifier_log` can have multiple `notification_deliveries`.
- `(notification_platform, provider_channel_id, provider_message_id)` must be unique.
- Delivery metadata is stored for:
  - Debugging
  - Editing
  - Deleting
  - Retry logic

---

# 9. Cascade Deletion Rules

Deletion hierarchy:

- Deleting a workspace deletes its repositories.
- Deleting a repository deletes its notification configs.
- Deleting a notification config deletes its logs.
- Deleting a log deletes its deliveries.

This ensures clean relational integrity.

---

# 10. Security Rules (Application-Level)

The database enforces structure. The application must enforce:

1. Only repository admins/owners (validated via provider API) can claim a repository.
2. A workspace must always have at least one owner.
3. Users with `pending`, `rejected`, or `removed` status cannot access workspace data.
4. Webhook events must be checked for idempotency before processing.
5. Repository access must be verified against provider permissions before claim.

---

# System Architecture Summary

User  
 └── Workspace  
 └── Repository (global unique)  
 └── Notification Channel  
 ├── Tags  
 ├── Event Toggles  
 └── Notifier Logs  
 └── Deliveries

---

# Design Goals Achieved

- Multi-user
- Multi-workspace
- Global repository uniqueness (anti-takeover)
- Role-based access control
- Idempotent webhook processing
- Tag-based notification routing
- Duplicate-safe channel delivery
- Delivery tracking
- Claim auditing
- Retry-ready notification system
