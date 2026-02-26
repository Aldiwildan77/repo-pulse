import { LinkIcon } from "lucide-react";
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
}

export function PlatformBindingCard({
  label,
  isConnected,
  connectUrl,
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
          <p className="text-sm text-muted-foreground">
            Account connected successfully.
          </p>
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
