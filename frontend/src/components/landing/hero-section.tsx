import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/utils/constants";
import { Github } from "lucide-react";
import { NotificationMockup } from "./notification-mockup";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-0 h-[300px] w-[400px] rounded-full bg-gradient-to-bl from-primary/10 to-transparent blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                Open Source GitHub Integration
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Never miss a PR again.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-4 text-lg text-muted-foreground sm:text-xl"
            >
              Bridge your GitHub pull requests to Discord and Slack. Get
              real-time notifications, mention routing, and automatic status
              updates — all in the channels your team already uses.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start"
            >
              <Button asChild size="lg">
                <a href={`${API_URL}/api/auth/github`}>
                  <Github className="mr-2 h-5 w-5" />
                  Get Started Free
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#features">Learn More</a>
              </Button>
            </motion.div>
          </div>

          <div className="hidden lg:block">
            <NotificationMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
