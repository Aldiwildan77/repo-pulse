import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useRepositoryMutations, type RepoConfigNotification, type RepoEventToggle } from "@/hooks/use-repositories";
import {
  GitPullRequest,
  GitMerge,
  ThumbsUp,
  MessageSquareWarning,
  Tag,
  AtSign,
  CircleDot,
  CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const EVENT_TYPES: { key: string; label: string; description: string; icon: LucideIcon }[] = [
  { key: "pr_opened", label: "PR Opened", description: "When a new pull request is created", icon: GitPullRequest },
  { key: "pr_merged", label: "PR Merged / Closed", description: "When a PR is merged or closed (adds reaction to original message)", icon: GitMerge },
  { key: "pr_review_approved", label: "PR Approved", description: "When a reviewer approves a pull request", icon: ThumbsUp },
  { key: "pr_review_changes_requested", label: "Changes Requested", description: "When a reviewer requests changes on a PR", icon: MessageSquareWarning },
  { key: "pr_label", label: "PR Label Changed", description: "When a label is added to or removed from a PR", icon: Tag },
  { key: "comment", label: "Mentions in Comments", description: "When someone @mentions a bound user in a PR or issue comment", icon: AtSign },
  { key: "issue_opened", label: "Issue Opened", description: "When a new issue is created in the repository", icon: CircleDot },
  { key: "issue_closed", label: "Issue Closed", description: "When an issue is resolved and closed", icon: CheckCircle2 },
];

interface NotificationSettingsModalProps {
  notifications: RepoConfigNotification[];
  repoName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationSettingsModal({
  notifications,
  repoName,
  open,
  onOpenChange,
}: NotificationSettingsModalProps) {
  const { getEventToggles, upsertEventToggle } = useRepositoryMutations();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [toggles, setToggles] = useState<RepoEventToggle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-select first notification when modal opens
  useEffect(() => {
    if (open && notifications.length > 0) {
      setSelectedId(notifications[0].id);
    }
    if (!open) {
      setSelectedId(null);
      setToggles([]);
    }
  }, [open, notifications]);

  // Fetch toggles when selection changes
  useEffect(() => {
    if (!open || !selectedId) return;

    setIsLoading(true);
    getEventToggles(selectedId)
      .then(setToggles)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load notification settings"))
      .finally(() => setIsLoading(false));
  }, [open, selectedId, getEventToggles]);

  const handleChannelChange = (id: string) => {
    setSelectedId(Number(id));
  };

  const getToggleValue = (eventType: string): boolean => {
    const toggle = toggles.find((t) => t.eventType === eventType);
    return toggle ? toggle.isEnabled : true;
  };

  const handleToggle = async (eventType: string, isEnabled: boolean) => {
    if (!selectedId) return;

    setToggles((prev) => {
      const existing = prev.find((t) => t.eventType === eventType);
      if (existing) {
        return prev.map((t) =>
          t.eventType === eventType ? { ...t, isEnabled } : t,
        );
      }
      return [...prev, { id: 0, repoConfigNotificationId: selectedId, eventType, isEnabled }];
    });

    try {
      await upsertEventToggle(selectedId, eventType, isEnabled);
    } catch (err) {
      setToggles((prev) =>
        prev.map((t) =>
          t.eventType === eventType ? { ...t, isEnabled: !isEnabled } : t,
        ),
      );
      toast.error(err instanceof Error ? err.message : "Failed to update setting");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notification Settings</DialogTitle>
          <DialogDescription>
            Configure which events trigger notifications for{" "}
            <span className="font-medium text-foreground">{repoName}</span>.
            All events are enabled by default.
          </DialogDescription>
        </DialogHeader>

        {notifications.length > 1 && (
          <Select
            value={selectedId?.toString() ?? ""}
            onValueChange={handleChannelChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select channel" />
            </SelectTrigger>
            <SelectContent>
              {notifications.map((n) => (
                <SelectItem key={n.id} value={n.id.toString()}>
                  {n.notificationPlatform} &middot; #{n.channelId.slice(0, 12)}
                  {n.tags.length > 0 && ` (${n.tags.join(", ")})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="space-y-2 py-2">
          {isLoading ? (
            Array.from({ length: EVENT_TYPES.length }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))
          ) : (
            EVENT_TYPES.map((event) => (
              <label
                key={event.key}
                className="flex items-center gap-3 rounded-lg border px-4 py-3"
              >
                <event.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium">{event.label}</span>
                  <p className="text-xs text-muted-foreground">{event.description}</p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Switch
                        checked={getToggleValue(event.key)}
                        onCheckedChange={(checked: boolean) =>
                          handleToggle(event.key, checked)
                        }
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {getToggleValue(event.key) ? "Click to disable" : "Click to enable"}
                  </TooltipContent>
                </Tooltip>
              </label>
            ))
          )}
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
