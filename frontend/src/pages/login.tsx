import { Navigate } from "react-router";
import { Zap, Bell, Shield, GitMerge } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { GitHubLoginButton } from "@/components/auth/github-login-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const highlights = [
  { icon: Bell, text: "Real-time PR notifications" },
  { icon: GitMerge, text: "Automatic status sync" },
  { icon: Shield, text: "Secure webhook validation" },
];

export function LoginPage() {
  const { user, isLoading } = useAuth();

  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Zap className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl">Welcome to Repo Pulse</CardTitle>
        <CardDescription className="mt-1">
          Sign in to connect your repositories to Discord and Slack.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
          {highlights.map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-3 rounded-lg border bg-muted/50 px-3 py-2.5 text-sm"
            >
              <item.icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-muted-foreground">{item.text}</span>
            </div>
          ))}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Continue with
            </span>
          </div>
        </div>

        <GitHubLoginButton />

        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to allow Repo Pulse to access your public
          repository data.
        </p>
      </CardContent>
    </Card>
  );
}
