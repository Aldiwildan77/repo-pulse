import { useSearchParams, Link } from "react-router";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AuthErrorPage() {
  const [searchParams] = useSearchParams();
  const message = searchParams.get("message") || "An unexpected error occurred";

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive text-destructive-foreground">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl">Authentication Error</CardTitle>
        <CardDescription className="mt-1">
          Something went wrong during authentication.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{message}</p>
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link to="/profile">Back to Profile</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/login">Go to Login</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
