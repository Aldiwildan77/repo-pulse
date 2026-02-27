import { AnimatedSection } from "./animated-section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is Repo Pulse free to use?",
    answer:
      "Yes. Repo Pulse is free and open source. You can self-host it or use our hosted version at no cost.",
  },
  {
    question: "Which platforms are supported?",
    answer:
      "Currently Repo Pulse supports Discord and Slack as notification targets, with GitHub as the repository provider. More integrations are on the roadmap.",
  },
  {
    question: "How do mention notifications work?",
    answer:
      "When someone is @mentioned in a PR comment, Repo Pulse checks if that user has linked their Discord or Slack account. If they have, they receive a direct message on their bound platform.",
  },
  {
    question: "Can I configure different channels per repository?",
    answer:
      "Yes. Each repository can be mapped to a specific Discord or Slack channel through the web dashboard.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. Webhook payloads are validated with HMAC SHA-256 signatures, OAuth tokens are encrypted at rest, and all sessions are protected with JWT authentication.",
  },
  {
    question: "What happens when a PR is merged or closed?",
    answer:
      "Repo Pulse automatically updates the original notification message with a status reaction — a checkmark for merged PRs and an X for closed PRs.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <AnimatedSection className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Everything you need to know about Repo Pulse.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <Accordion type="single" collapsible className="mt-12">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </AnimatedSection>
      </div>
    </section>
  );
}
