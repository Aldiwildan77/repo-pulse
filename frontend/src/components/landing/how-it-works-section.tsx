import { Github, Link2, Settings, Bell } from "lucide-react";
import { AnimatedSection } from "./animated-section";

const steps = [
  {
    icon: Github,
    title: "Login with GitHub",
    description: "Authenticate with your GitHub account in one click.",
  },
  {
    icon: Link2,
    title: "Connect Platforms",
    description: "Bind your Discord and/or Slack account to your profile.",
  },
  {
    icon: Settings,
    title: "Configure Repos",
    description: "Select repositories and choose notification channels.",
  },
  {
    icon: Bell,
    title: "Notifications Flow",
    description: "PR events are instantly routed to the right channels and people.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-16 border-t bg-muted/40 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AnimatedSection className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Get up and running in under two minutes.
          </p>
        </AnimatedSection>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <AnimatedSection key={step.title} delay={i * 0.1}>
              <div className="relative flex flex-col items-center text-center">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute left-[calc(50%+32px)] top-6 hidden h-px w-[calc(100%-64px)] border-t-2 border-dashed border-border lg:block" />
                )}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="mt-1 text-xs font-medium text-muted-foreground">
                  Step {i + 1}
                </span>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
