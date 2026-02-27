import { Navigate } from "react-router";
import { GitFork } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { GitHubLoginButton } from "@/components/auth/github-login-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginPage() {
  const { user, isLoading } = useAuth();

  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <GitFork className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">Repo Pulse</CardTitle>
        <CardDescription>
          Connect your GitHub repositories to Discord and Slack for real-time PR
          notifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GitHubLoginButton />
      </CardContent>
    </Card>
  );
}
