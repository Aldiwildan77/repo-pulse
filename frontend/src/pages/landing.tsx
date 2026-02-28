import { LandingNavbar } from "@/components/landing/landing-navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { ComparisonSection } from "@/components/landing/comparison-section";
import { FaqSection } from "@/components/landing/faq-section";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/layout/footer";

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <IntegrationsSection />
      <ComparisonSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
