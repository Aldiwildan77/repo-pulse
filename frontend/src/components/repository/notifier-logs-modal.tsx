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
import { useRepositoryMutations, type NotifierLog } from "@/hooks/use-repositories";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

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
  sent: "default",
  failed: "destructive",
  skipped: "secondary",
};

interface NotifierLogsModalProps {
  repoConfigId: number | null;
  repoName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotifierLogsModal({
  repoConfigId,
  repoName,
  open,
  onOpenChange,
}: NotifierLogsModalProps) {
  const { getNotifierLogs } = useRepositoryMutations();
  const [logs, setLogs] = useState<NotifierLog[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !repoConfigId) return;

    setIsLoading(true);
    getNotifierLogs(repoConfigId, PAGE_SIZE, offset)
      .then((result) => {
        setLogs(result.logs);
        setTotal(result.total);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load logs"))
      .finally(() => setIsLoading(false));
  }, [open, repoConfigId, offset, getNotifierLogs]);

  useEffect(() => {
    if (!open) {
      setOffset(0);
      setLogs([]);
      setTotal(0);
    }
  }, [open]);

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

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No logs recorded yet.
            </p>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANT[log.status] ?? "outline"} className="text-xs">
                        {log.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {log.platform}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {EVENT_LABELS[log.eventType] ?? log.eventType}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm">{log.summary}</p>
                    {log.errorMessage && (
                      <p className="mt-0.5 truncate text-xs text-destructive">
                        {log.errorMessage}
                      </p>
                    )}
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </time>
                </div>
              ))}
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
