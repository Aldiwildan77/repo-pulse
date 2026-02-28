import { LinkIcon, ExternalLinkIcon, CheckCircle2, AlertCircle } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PlatformBindingCardProps {
  label: string;
  isConnected: boolean;
  connectUrl: string;
  actionUrl?: string | null;
  actionLabel?: string;
}

export function PlatformBindingCard({
  label,
  isConnected,
  connectUrl,
  actionUrl,
  actionLabel,
}: PlatformBindingCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{label}</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center gap-1">
                {isConnected ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <AlertCircle className="h-3 w-3" />
                )}
                {isConnected ? "Connected" : "Not Connected"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {isConnected
                ? `Your ${label} account is linked and active`
                : `Link your ${label} account to enable notifications`}
            </TooltipContent>
          </Tooltip>
        </div>
        <CardDescription>
          {isConnected
            ? `Your ${label} account is linked. You'll receive @mention notifications via direct message.`
            : `Connect your ${label} account to receive @mention notifications when someone tags you in a PR or issue.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Account connected successfully.
            </p>
            {actionUrl && actionLabel && (
              <Button variant="outline" asChild>
                <a href={actionUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLinkIcon className="mr-2 h-4 w-4" />
                  {actionLabel}
                </a>
              </Button>
            )}
          </div>
        ) : (
          <Button asChild>
            <a href={connectUrl}>
              <LinkIcon className="mr-2 h-4 w-4" />
              Connect {label}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
