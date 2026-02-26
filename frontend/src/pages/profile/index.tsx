import { useAuth } from "@/hooks/use-auth";
import { useUserBindings } from "@/hooks/use-user-bindings";
import { PlatformBindingCard } from "@/components/profile/platform-binding-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function ProfilePage() {
  const { user } = useAuth();
  const { discordBound, slackBound, discordConnectUrl, slackConnectUrl } =
    useUserBindings();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">
          Manage your account and platform connections
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>GitHub Account</CardTitle>
          <CardDescription>Your linked GitHub identity</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">
              {user?.providerUsername?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-medium">{user?.providerUsername}</p>
            <p className="text-sm text-muted-foreground">
              ID: {user?.providerUserId}
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h3 className="mb-4 text-lg font-semibold">Platform Connections</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <PlatformBindingCard
            label="Discord"
            isConnected={discordBound}
            connectUrl={discordConnectUrl}
          />
          <PlatformBindingCard
            label="Slack"
            isConnected={slackBound}
            connectUrl={slackConnectUrl}
          />
        </div>
      </div>
    </div>
  );
}
