import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
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
            <Link to="/login">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </AnimatedSection>
      </div>
    </section>
  );
}
