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

---

## 2. Functional Requirements

### 2.1 PR Created Notification

**Trigger:**

- GitHub `pull_request` event
- `action = opened`

**Behavior:**

- Send notification to selected channel (configured via website)
- Store platform message ID in database
- Message must contain:
  - Repository name
  - PR title
  - PR author
  - PR link

**Output Example:**

```
🚀 New Pull Request

Repo: org/repo
Title: Add feature
Author: @username
Link: https://github.com/...
```

---

### 2.2 PR Comment with Mention

**Trigger:**

- GitHub `issue_comment` event
- Comment contains `@username`

**Behavior:**

- Parse mentioned GitHub usernames
- Check if user has bound Discord and/or Slack account
- Send notification directly to bound account
- If user is not bound → no notification

**Requirement:**

- Binding must be done through the website
- One GitHub account can bind:
  - Discord
  - Slack
  - Or both

---

### 2.3 PR Merged Reaction

**Trigger:**

- `pull_request`
- `action = closed`
- `merged = true`

**Behavior:**

- Locate original PR notification message
- Add ✅ reaction (checklist icon)

---

### 2.4 PR Closed (Not Merged) Reaction

**Trigger:**

- `pull_request`
- `action = closed`
- `merged = false`

**Behavior:**

- Locate original PR notification message
- Add ❌ reaction (reject icon)

---

## 3. Non-Functional Requirements

### 3.1 Performance

- Webhook response must be < 200ms
- Event processing should be asynchronous

### 3.2 Idempotency

- Duplicate GitHub webhook deliveries must not duplicate notifications

### 3.3 Security

- GitHub webhook signature validation (HMAC SHA256)
- OAuth token encryption
- JWT authentication for frontend sessions

### 3.4 Scalability

- Support multiple repositories
- Support multiple channels per repository (future)
- Multi-tenant ready

---

## 4. System Architecture

### 4.1 High-Level Flow

```
GitHub Webhook
      ↓
Backend (Fastify)
      ↓
Event Processor
      ↓
Discord / Slack Adapter
      ↓
Database (Message Mapping + User Binding)
      ↓
Frontend Dashboard
```

---

## 5. Technology Stack

### Backend

- NodeJS (TypeScript)
- Fastify
- Kysely (DB client)
- Discord Bot Account
- GitHub Webhook integration
- Slack API integration

---

### Frontend

- React
- Discord OAuth
- Slack OAuth
- GitHub OAuth (for login)

Users can:

- Bind Discord
- Bind Slack
- Bind both platforms

---

### Deployment

- Vercel (Backend)
- Vercel (Frontend)

---

# 6. Backend Structure

```
backend/src/
├── cmd/
│   ├── api.ts
│   └── worker.ts
├── core/
│   ├── entities/
│   ├── repositories/
│   └── modules/
│       ├── notifier.ts
│       ├── pusher/
│       ├── admin.ts
│       ├── auth.ts
├── handlers/
├── repositories/
│   └── auth/
│       ├── dto.ts
│       ├── auth.repo.ts
├── infrastructure/
│   ├── database/
│   ├── redis/
│   ├── auth/
│   ├── rate-limiter/
│   └── logger/
├── app.ts
└── main.ts
```

---

## 6.1 Architecture Pattern

This backend follows a **Clean Architecture** approach:

- `core/` → pure business logic (no external dependency)
- `repositories/` → DB implementations (Kysely)
- `infrastructure/` → external adapters (Redis, JWT, Logger)
- `handlers/` → HTTP layer (request/response parsing)
- `cmd/` → Composition root

---

## 7. Frontend Structure

```
frontend/src/
├── main.tsx
├── App.tsx
├── lib/
├── pages/
│   └── profile/
├── components/
│   ├── auth/
│   └── *.tsx
├── hooks/
├── utils/
└── index.css
```

---

## 8. Database Requirements

### 8.1 Pull Request Message Mapping

Stores message ID for reaction updates.

Required fields:

- github_pr_id
- github_repo
- platform (discord | slack)
- platform_message_id
- platform_channel_id
- status

---

### 8.2 User Binding

Stores GitHub → Discord/Slack mapping.

Required fields:

- github_user_id
- github_username
- discord_user_id (nullable)
- slack_user_id (nullable)

---

### 8.3 Repository Configuration

Stores channel configuration per repo.

Required fields:

- github_repo
- platform
- channel_id
- is_active

---

## 9. OAuth Flow

### GitHub

- Used for login
- Identify GitHub user ID

### Discord

- Bind Discord account to GitHub account

### Slack

- Bind Slack account to GitHub account

---

## 10. Event Processing Strategy

- Webhook endpoint receives event
- Validate signature
- Push event into internal processor
- Store idempotency key (event ID)
- Process according to event type

---

## 11. User Flow

### 11.1 Admin

1. Login with GitHub
2. Bind Discord and/or Slack
3. Configure repository
4. Select notification channel

---

### 11.2 Developer

1. Open PR
2. Channel receives notification
3. Mention someone in comment
4. Mentioned user receives notification
5. PR merged → checklist reaction appears
6. PR closed → reject reaction appears

---

## 12. Future Enhancements

- Multi-channel per repo
- Organization-level configuration
- GitLab support
- Threaded messages
- Interactive message buttons
- CI/CD status integration
- Retry with exponential backoff
- Metrics dashboard

---

# ✅ Acceptance Criteria

- PR created sends notification to configured channel
- PR merged updates original message with ✅
- PR closed updates original message with ❌
- Mention triggers notification to bound users
- Users can bind Discord and Slack via website
- Duplicate webhooks do not create duplicate messages

---

If you'd like, next I can generate:

- 🔥 Database schema with full SQL + indexes
- 🧠 Detailed system sequence diagrams
- 🏗 Full backend domain modeling (entities + ports)
- 🚀 Production-ready Fastify bootstrap code
- 📦 Complete MVP roadmap (2-week sprint breakdown)
