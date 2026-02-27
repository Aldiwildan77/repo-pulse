import {
  Bell,
  AtSign,
  GitMerge,
  Settings,
  Shield,
  Zap,
} from "lucide-react";
import { AnimatedSection } from "./animated-section";

const features = [
  {
    icon: Bell,
    title: "PR Notifications",
    description:
      "Instant notifications in your Discord or Slack channel when a pull request is opened.",
  },
  {
    icon: AtSign,
    title: "Mention Routing",
    description:
      "Tag someone in a PR comment and they get a direct message on their bound platform.",
  },
  {
    icon: GitMerge,
    title: "Status Sync",
    description:
      "Merged PRs get a check mark, closed PRs get an X — right on the original notification.",
  },
  {
    icon: Settings,
    title: "Per-Repo Config",
    description:
      "Choose which repositories notify which channels through a simple web dashboard.",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description:
      "Webhook signature validation, encrypted tokens, and JWT-authenticated sessions.",
  },
  {
    icon: Zap,
    title: "Blazing Fast",
    description:
      "Sub-200ms webhook response with async event processing for zero-lag notifications.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AnimatedSection className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need for PR visibility
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Keep your team in sync without leaving their favourite chat platform.
          </p>
        </AnimatedSection>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <AnimatedSection key={feature.title} delay={i * 0.08}>
              <div className="group rounded-xl border bg-card p-6 transition-shadow hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
