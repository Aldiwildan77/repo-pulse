import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: February 28, 2026
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            1. Acceptance of Terms
          </h2>
          <p className="mt-2">
            By accessing or using Repo Pulse ("the Service"), you agree to be
            bound by these Terms of Service. If you do not agree to these terms,
            do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            2. Description of Service
          </h2>
          <p className="mt-2">
            Repo Pulse is a webhook-driven integration platform that connects
            GitHub pull request events to Discord and Slack. The Service provides
            real-time PR notifications, mention routing, and status
            synchronization between GitHub and chat platforms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            3. Account Requirements
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>You must have a valid GitHub account to use the Service</li>
            <li>
              You are responsible for maintaining the security of your account
              and any linked platform accounts
            </li>
            <li>
              You must provide accurate information when binding Discord and/or
              Slack accounts
            </li>
            <li>
              You are responsible for all activity that occurs under your account
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            4. Acceptable Use
          </h2>
          <p className="mt-2">You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Use the Service to send spam, unsolicited messages, or abusive
              notifications
            </li>
            <li>
              Attempt to bypass rate limits or abuse webhook endpoints
            </li>
            <li>
              Interfere with or disrupt the Service or its infrastructure
            </li>
            <li>
              Use the Service in violation of GitHub, Discord, or Slack terms of
              service
            </li>
            <li>
              Reverse engineer, decompile, or attempt to extract the source code
              of the Service (except as permitted by applicable law or open
              source licenses)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            5. Webhook Data
          </h2>
          <p className="mt-2">
            By configuring repositories to use Repo Pulse, you authorize us to
            receive and process GitHub webhook events for those repositories.
            You must have appropriate permissions on the repositories you
            configure. We are not responsible for webhook data from repositories
            you do not own or have permission to manage.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            6. Platform Integrations
          </h2>
          <p className="mt-2">
            The Service integrates with third-party platforms (GitHub, Discord,
            Slack). We are not responsible for the availability, reliability, or
            changes to these platforms&apos; APIs. Changes to third-party
            platforms may temporarily or permanently affect Service
            functionality.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            7. Service Availability
          </h2>
          <p className="mt-2">
            We strive to maintain high availability but do not guarantee
            uninterrupted service. The Service is provided on an "as is" and "as
            available" basis. We may perform maintenance, updates, or
            modifications that temporarily affect availability. You can check
            current service status at the{" "}
            <Link
              to="/status"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              status page
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            8. Limitation of Liability
          </h2>
          <p className="mt-2">
            To the maximum extent permitted by law, Repo Pulse and its
            maintainers shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, including but not
            limited to loss of data, missed notifications, or service
            interruptions. Our total liability shall not exceed the amount you
            paid for the Service (if any).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            9. Termination
          </h2>
          <p className="mt-2">
            You may stop using the Service at any time by removing your
            repository configurations and unbinding your accounts. We reserve
            the right to suspend or terminate access to the Service for
            violations of these terms, with or without notice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            10. Changes to Terms
          </h2>
          <p className="mt-2">
            We may modify these Terms of Service at any time. Changes will be
            posted on this page with an updated revision date. Continued use of
            the Service after changes constitutes acceptance of the revised
            terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            11. Open Source
          </h2>
          <p className="mt-2">
            Repo Pulse is an open-source project. The source code is available
            on{" "}
            <a
              href="https://github.com/Aldiwildan77/repo-pulse"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              GitHub
            </a>
            . Use of the source code is governed by the applicable open-source
            license.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            12. Contact
          </h2>
          <p className="mt-2">
            If you have questions about these Terms of Service, please open an
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
