import { LinkIcon, ExternalLinkIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
        <CardDescription>
          {isConnected
            ? `Your ${label} account is linked. You'll receive mention notifications.`
            : `Connect your ${label} account to receive mention notifications.`}
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
