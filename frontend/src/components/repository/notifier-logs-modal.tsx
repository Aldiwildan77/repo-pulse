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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useRepositoryMutations, type NotifierLog, type RepoConfigNotification } from "@/hooks/use-repositories";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircle2,
  XCircle,
  SkipForward,
  GitPullRequest,
  GitMerge,
  ThumbsUp,
  MessageSquareWarning,
  Tag,
  AtSign,
  CircleDot,
  CheckCircle,
  ScrollText,
  Inbox,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const PAGE_SIZE = 20;

const EVENT_LABELS: Record<string, string> = {
  pr_opened: "PR Opened",
  pr_merged: "PR Merged/Closed",
  pr_label: "PR Label",
  pr_review_approved: "PR Approved",
  pr_review_changes_requested: "Changes Requested",
  comment: "Comment Mention",
  issue_opened: "Issue Opened",
  issue_closed: "Issue Closed",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  delivered: "default",
  failed: "destructive",
  skipped: "secondary",
  queued: "outline",
  processing: "outline",
};

const STATUS_ICONS: Record<string, { icon: LucideIcon; tip: string }> = {
  delivered: { icon: CheckCircle2, tip: "Notification delivered successfully" },
  failed: { icon: XCircle, tip: "Notification failed to send" },
  skipped: { icon: SkipForward, tip: "Notification skipped (disabled or filtered)" },
  queued: { icon: ScrollText, tip: "Notification queued for processing" },
  processing: { icon: ScrollText, tip: "Notification is being processed" },
};

const EVENT_ICONS: Record<string, LucideIcon> = {
  pr_opened: GitPullRequest,
  pr_merged: GitMerge,
  pr_review_approved: ThumbsUp,
  pr_review_changes_requested: MessageSquareWarning,
  pr_label: Tag,
  comment: AtSign,
  issue_opened: CircleDot,
  issue_closed: CheckCircle,
};

interface NotifierLogsModalProps {
  notifications: RepoConfigNotification[];
  repoName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotifierLogsModal({
  notifications,
  repoName,
  open,
  onOpenChange,
}: NotifierLogsModalProps) {
  const { getNotifierLogs } = useRepositoryMutations();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [logs, setLogs] = useState<NotifierLog[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-select first notification when modal opens
  useEffect(() => {
    if (open && notifications.length > 0) {
      setSelectedId(notifications[0].id);
    }
    if (!open) {
      setSelectedId(null);
      setOffset(0);
      setLogs([]);
      setTotal(0);
    }
  }, [open, notifications]);

  // Fetch logs when selection or page changes
  useEffect(() => {
    if (!open || !selectedId) return;

    setIsLoading(true);
    getNotifierLogs(selectedId, PAGE_SIZE, offset)
      .then((result) => {
        setLogs(result.logs);
        setTotal(result.total);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load logs"))
      .finally(() => setIsLoading(false));
  }, [open, selectedId, offset, getNotifierLogs]);

  const handleChannelChange = (id: string) => {
    setSelectedId(Number(id));
    setOffset(0);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Event Logs</DialogTitle>
          <DialogDescription>
            Webhook and notification history for{" "}
            <span className="font-medium text-foreground">{repoName}</span>
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

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Inbox className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm">No logs recorded yet.</p>
              <p className="mt-1 text-xs">Events will appear here once webhooks are received.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => {
                const StatusIcon = STATUS_ICONS[log.status]?.icon ?? ScrollText;
                const statusTip = STATUS_ICONS[log.status]?.tip ?? log.status;
                const EventIcon = EVENT_ICONS[log.eventType] ?? ScrollText;
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 rounded-lg border px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant={STATUS_VARIANT[log.status] ?? "outline"} className="flex items-center gap-1 text-xs">
                              <StatusIcon className="h-3 w-3" />
                              {log.status}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>{statusTip}</TooltipContent>
                        </Tooltip>
                        <Badge variant="outline" className="text-xs">
                          {log.platform}
                        </Badge>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <EventIcon className="h-3 w-3" />
                              {EVENT_LABELS[log.eventType] ?? log.eventType}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Event type: {EVENT_LABELS[log.eventType] ?? log.eventType}</TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="mt-1 truncate text-sm">{log.summary}</p>
                      {log.errorMessage && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="mt-0.5 truncate text-xs text-destructive">
                              {log.errorMessage}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">{log.errorMessage}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <time className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </time>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              {total} total entries
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={offset === 0}
                onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
