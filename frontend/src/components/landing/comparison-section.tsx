import { Check, X, Minus } from "lucide-react";
import { AnimatedSection } from "./animated-section";

type Support = "yes" | "no" | "partial";

interface ComparisonRow {
  feature: string;
  github: Support;
  gitlab: Support;
  bitbucket: Support;
  repoPulse: Support;
  note?: string;
}

const comparisonData: ComparisonRow[] = [
  {
    feature: "PR notifications to Discord",
    github: "partial",
    gitlab: "partial",
    bitbucket: "no",
    repoPulse: "yes",
    note: "Native integrations send raw payloads; Repo Pulse sends formatted, human-readable messages",
  },
  {
    feature: "PR notifications to Slack",
    github: "partial",
    gitlab: "partial",
    bitbucket: "partial",
    repoPulse: "yes",
    note: "Built-in Slack apps exist but lack mention routing and status reactions",
  },
  {
    feature: "Mention routing (@user)",
    github: "no",
    gitlab: "no",
    bitbucket: "no",
    repoPulse: "yes",
    note: "Repo Pulse maps GitHub usernames to Discord/Slack accounts and DMs the right person",
  },
  {
    feature: "Merged/closed status reactions",
    github: "no",
    gitlab: "no",
    bitbucket: "no",
    repoPulse: "yes",
    note: "Original notification gets a check or X reaction when the PR is resolved",
  },
  {
    feature: "Per-repo channel config",
    github: "partial",
    gitlab: "yes",
    bitbucket: "no",
    repoPulse: "yes",
    note: "Configure which repo notifies which channel through a simple dashboard",
  },
  {
    feature: "Multi-platform binding",
    github: "no",
    gitlab: "no",
    bitbucket: "no",
    repoPulse: "yes",
    note: "One GitHub account can bind to both Discord and Slack simultaneously",
  },
  {
    feature: "Web dashboard",
    github: "no",
    gitlab: "no",
    bitbucket: "no",
    repoPulse: "yes",
    note: "Manage bindings, repos, and channels from a central UI",
  },
  {
    feature: "Idempotent webhook handling",
    github: "no",
    gitlab: "no",
    bitbucket: "no",
    repoPulse: "yes",
    note: "Duplicate deliveries never create duplicate notifications",
  },
];

function SupportIcon({ value }: { value: Support }) {
  switch (value) {
    case "yes":
      return <Check className="h-4 w-4 text-green-500" />;
    case "no":
      return <X className="h-4 w-4 text-red-500" />;
    case "partial":
      return <Minus className="h-4 w-4 text-yellow-500" />;
  }
}

function SupportLabel({ value }: { value: Support }) {
  switch (value) {
    case "yes":
      return "Yes";
    case "no":
      return "No";
    case "partial":
      return "Partial";
  }
}

const platforms = [
  { key: "github" as const, label: "GitHub Webhooks" },
  { key: "gitlab" as const, label: "GitLab Webhooks" },
  { key: "bitbucket" as const, label: "Bitbucket Webhooks" },
  { key: "repoPulse" as const, label: "Repo Pulse" },
];

const prosAndCons = [
  {
    platform: "GitHub Webhooks",
    pros: [
      "Native integration, zero setup",
      "Supports many event types beyond PRs",
      "Free for all repositories",
    ],
    cons: [
      "Raw JSON payloads, not user-friendly",
      "No mention routing to chat platforms",
      "No status reactions on messages",
      "No central dashboard for configuration",
    ],
  },
  {
    platform: "GitLab Webhooks",
    pros: [
      "Built-in Slack/Discord integrations",
      "Per-project notification settings",
      "Supports merge request and pipeline events",
    ],
    cons: [
      "Limited to GitLab repositories only",
      "No cross-platform mention mapping",
      "No message status updates on merge/close",
      "Configuration spread across project settings",
    ],
  },
  {
    platform: "Bitbucket Webhooks",
    pros: [
      "Works with Atlassian ecosystem (Jira, Confluence)",
      "Supports PR and push events",
      "Native Slack integration via Bitbucket Cloud",
    ],
    cons: [
      "No native Discord support",
      "Limited webhook customization",
      "No mention routing or user binding",
      "No message reactions for PR status",
    ],
  },
  {
    platform: "Repo Pulse",
    pros: [
      "Formatted, human-readable PR notifications",
      "Mention routing maps GitHub users to Discord/Slack DMs",
      "Merged/closed reactions on original messages",
      "Central web dashboard for all configuration",
      "Multi-platform binding (Discord + Slack at once)",
      "Idempotent — no duplicate notifications",
    ],
    cons: [
      "Currently GitHub-only (GitLab/Bitbucket planned)",
      "Requires self-hosting or managed deployment",
      "Additional service to maintain",
    ],
  },
];

export function ComparisonSection() {
  return (
    <section id="comparison" className="scroll-mt-16 border-t bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AnimatedSection className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Why Repo Pulse over raw webhooks?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Native webhook integrations are powerful but limited. See how Repo
            Pulse compares.
          </p>
        </AnimatedSection>

        {/* Comparison table */}
        <AnimatedSection delay={0.1}>
          <div className="mt-16 overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-semibold">Feature</th>
                  {platforms.map((p) => (
                    <th
                      key={p.key}
                      className={`px-4 py-3 text-center font-semibold ${p.key === "repoPulse" ? "bg-primary/5" : ""}`}
                    >
                      {p.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={i < comparisonData.length - 1 ? "border-b" : ""}
                  >
                    <td className="px-4 py-3 font-medium">
                      {row.feature}
                      {row.note && (
                        <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                          {row.note}
                        </p>
                      )}
                    </td>
                    {platforms.map((p) => (
                      <td
                        key={p.key}
                        className={`px-4 py-3 text-center ${p.key === "repoPulse" ? "bg-primary/5" : ""}`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <SupportIcon value={row[p.key]} />
                          <span className="hidden sm:inline text-muted-foreground">
                            <SupportLabel value={row[p.key]} />
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimatedSection>

        {/* Pros & Cons cards */}
        <AnimatedSection delay={0.2}>
          <h3 className="mt-16 text-center text-2xl font-bold tracking-tight">
            Pros &amp; Cons
          </h3>
        </AnimatedSection>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {prosAndCons.map((item, i) => (
            <AnimatedSection key={item.platform} delay={0.25 + i * 0.08}>
              <div
                className={`rounded-xl border bg-card p-6 ${item.platform === "Repo Pulse" ? "ring-2 ring-primary/30" : ""}`}
              >
                <h4 className="font-semibold">{item.platform}</h4>
                <div className="mt-4 space-y-1.5">
                  {item.pros.map((pro) => (
                    <div key={pro} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                      <span>{pro}</span>
                    </div>
                  ))}
                  {item.cons.map((con) => (
                    <div key={con} className="flex items-start gap-2 text-sm">
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                      <span className="text-muted-foreground">{con}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
