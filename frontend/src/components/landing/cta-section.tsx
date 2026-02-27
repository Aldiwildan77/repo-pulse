import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/utils/constants";
import { AnimatedSection } from "./animated-section";

export function CtaSection() {
  return (
    <section className="border-t bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AnimatedSection className="flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to streamline your PR workflow?
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Set up in under two minutes. Free and open source.
          </p>
          <Button asChild size="lg" className="mt-8">
            <a href={`${API_URL}/api/auth/github`}>
              <Github className="mr-2 h-5 w-5" />
              Get Started Free
            </a>
          </Button>
        </AnimatedSection>
      </div>
    </section>
  );
}
