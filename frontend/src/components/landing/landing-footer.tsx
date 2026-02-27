import { GitFork } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-sm text-muted-foreground sm:px-6">
        <div className="flex items-center gap-2">
          <GitFork className="h-4 w-4" />
          <span>Repo Pulse</span>
        </div>
        <p>&copy; {new Date().getFullYear()} Repo Pulse. All rights reserved.</p>
      </div>
    </footer>
  );
}
