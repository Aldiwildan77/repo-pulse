import { GitFork } from "lucide-react";
import { Link } from "react-router";
import { Separator } from "@/components/ui/separator";

const productLinks = [
  { label: "Features", to: "/#features" },
  { label: "Status", to: "/status" },
  { label: "Login", to: "/login" },
];

const resourceLinks = [
  {
    label: "GitHub",
    href: "https://github.com/Aldiwildan77/repo-pulse",
    external: true,
  },
  { label: "Documentation", href: "#" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t py-10 mt-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <GitFork className="h-4 w-4" />
              <span>Repo Pulse</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Real-time PR notifications for Discord &amp; Slack.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold">Product</h4>
            <ul className="mt-2 space-y-1">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold">Resources</h4>
            <ul className="mt-2 space-y-1">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                    {...(link.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="mt-2 space-y-1">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Repo Pulse. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
