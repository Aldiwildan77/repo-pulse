import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: February 28, 2026
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            1. Introduction
          </h2>
          <p className="mt-2">
            Repo Pulse ("we", "our", "us") is a webhook-driven integration
            platform that connects GitHub pull request events to communication
            platforms such as Discord and Slack. This Privacy Policy explains how
            we collect, use, and protect your information when you use our
            service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            2. Information We Collect
          </h2>
          <div className="mt-2 space-y-3">
            <div>
              <h3 className="font-medium text-foreground">
                Account Information
              </h3>
              <p>
                When you sign in with GitHub, we receive your GitHub user ID,
                username, and email address. When you bind Discord or Slack, we
                receive your user ID on those platforms.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">Webhook Data</h3>
              <p>
                We receive pull request event data from GitHub, including
                repository names, PR titles, author usernames, and comment
                content. This data is processed to deliver notifications and is
                not stored beyond what is necessary for message tracking.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                Message Mapping Data
              </h3>
              <p>
                We store platform message IDs to enable status reactions (merged
                / closed) on previously sent notifications.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            3. How We Use Your Information
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Deliver pull request notifications to configured Discord and Slack
              channels
            </li>
            <li>
              Route mention notifications to users who have bound their accounts
            </li>
            <li>
              Update notification messages with merge/close status reactions
            </li>
            <li>Authenticate your sessions and manage your account</li>
            <li>Prevent duplicate notifications via idempotency tracking</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            4. Data Sharing
          </h2>
          <p className="mt-2">
            We do not sell, rent, or share your personal information with third
            parties. We only transmit data to Discord and Slack as necessary to
            deliver the notifications you have configured. GitHub webhook data is
            processed in transit and is not shared with any other services.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            5. Data Security
          </h2>
          <p className="mt-2">
            We implement industry-standard security measures including GitHub
            webhook signature validation (HMAC SHA-256), OAuth token encryption,
            and JWT-based session authentication. All data is transmitted over
            HTTPS.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            6. Data Retention
          </h2>
          <p className="mt-2">
            Account binding data is retained as long as your account is active.
            Message mapping data is retained to support status reaction updates.
            You may request deletion of your data at any time by contacting us
            or removing your account bindings through the dashboard.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            7. Third-Party Services
          </h2>
          <p className="mt-2">
            Repo Pulse integrates with GitHub, Discord, and Slack. Your use of
            those services is governed by their respective privacy policies. We
            encourage you to review the privacy policies of these platforms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            8. Your Rights
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>
              Unbind your Discord and/or Slack accounts at any time via the
              dashboard
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            9. Changes to This Policy
          </h2>
          <p className="mt-2">
            We may update this Privacy Policy from time to time. Changes will be
            posted on this page with an updated revision date. Continued use of
            the service after changes constitutes acceptance of the revised
            policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            10. Contact
          </h2>
          <p className="mt-2">
            If you have questions about this Privacy Policy, please open an
            issue on our{" "}
            <a
              href="https://github.com/Aldiwildan77/repo-pulse"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              GitHub repository
            </a>
            .
          </p>
        </section>
      </div>

      <div className="mt-12 text-center">
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
