import { useAuth } from "@/hooks/use-auth";
import { useUserBindings } from "@/hooks/use-user-bindings";
import { useDiscordBotInvite } from "@/hooks/use-platforms";
import { PlatformBindingCard } from "@/components/profile/platform-binding-card";
import { TotpSection } from "@/components/profile/totp-section";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/ui/page-header";
import { Link2, Info } from "lucide-react";

export function ProfilePage() {
  const { user } = useAuth();
  const {
    githubBound,
    googleBound,
    gitlabBound,
    discordBound,
    slackBound,
    githubConnectUrl,
    googleConnectUrl,
    gitlabConnectUrl,
    discordConnectUrl,
    slackConnectUrl,
  } = useUserBindings();
  const { inviteUrl: discordBotInviteUrl } = useDiscordBotInvite();

  const displayName = user?.providerUsername ?? user?.googleEmail ?? "User";
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your account and platform connections"
      />

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your linked identity</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">
              {displayInitial}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-medium">{displayName}</p>
            <p className="text-sm text-muted-foreground">
              ID: {user?.id}
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <div className="mb-4 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Platform Connections</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              Connect your accounts to receive @mention notifications via direct message
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <PlatformBindingCard
            label="GitHub"
            isConnected={githubBound}
            connectUrl={githubConnectUrl}
          />
          <PlatformBindingCard
            label="Google"
            isConnected={googleBound}
            connectUrl={googleConnectUrl}
          />
          <PlatformBindingCard
            label="GitLab"
            isConnected={gitlabBound}
            connectUrl={gitlabConnectUrl}
          />
          <PlatformBindingCard
            label="Discord"
            isConnected={discordBound}
            connectUrl={discordConnectUrl}
            actionUrl={discordBotInviteUrl}
            actionLabel="Add Bot to Server"
          />
          <PlatformBindingCard
            label="Slack"
            isConnected={slackBound}
            connectUrl={slackConnectUrl}
          />
        </div>
      </div>

      <Separator />

      <TotpSection />
    </div>
  );
}
