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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useRepositoryMutations, type RepoEventToggle } from "@/hooks/use-repositories";

const EVENT_TYPES = [
  { key: "pr_opened", label: "PR Opened" },
  { key: "pr_merged", label: "PR Merged / Closed" },
  { key: "pr_label", label: "PR Label Changed" },
  { key: "comment", label: "Mentions in Comments" },
  { key: "issue_opened", label: "Issue Opened" },
  { key: "issue_closed", label: "Issue Closed" },
];

interface NotificationSettingsModalProps {
  repoConfigId: number | null;
  repoName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationSettingsModal({
  repoConfigId,
  repoName,
  open,
  onOpenChange,
}: NotificationSettingsModalProps) {
  const { getEventToggles, upsertEventToggle } = useRepositoryMutations();
  const [toggles, setToggles] = useState<RepoEventToggle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !repoConfigId) return;

    setIsLoading(true);
    getEventToggles(repoConfigId)
      .then(setToggles)
      .catch(() => toast.error("Failed to load notification settings"))
      .finally(() => setIsLoading(false));
  }, [open, repoConfigId, getEventToggles]);

  const getToggleValue = (eventType: string): boolean => {
    const toggle = toggles.find((t) => t.eventType === eventType);
    // Default to true if no row exists (opt-out model)
    return toggle ? toggle.isEnabled : true;
  };

  const handleToggle = async (eventType: string, isEnabled: boolean) => {
    if (!repoConfigId) return;

    // Optimistic update
    setToggles((prev) => {
      const existing = prev.find((t) => t.eventType === eventType);
      if (existing) {
        return prev.map((t) =>
          t.eventType === eventType ? { ...t, isEnabled } : t,
        );
      }
      return [...prev, { id: 0, repoConfigId, eventType, isEnabled }];
    });

    try {
      await upsertEventToggle(repoConfigId, eventType, isEnabled);
    } catch {
      // Revert on failure
      setToggles((prev) =>
        prev.map((t) =>
          t.eventType === eventType ? { ...t, isEnabled: !isEnabled } : t,
        ),
      );
      toast.error("Failed to update setting");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notification Settings</DialogTitle>
          <DialogDescription>
            Configure which events trigger notifications for{" "}
            <span className="font-medium text-foreground">{repoName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {isLoading ? (
            Array.from({ length: EVENT_TYPES.length }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))
          ) : (
            EVENT_TYPES.map((event) => (
              <label
                key={event.key}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <span className="text-sm font-medium">{event.label}</span>
                <Switch
                  checked={getToggleValue(event.key)}
                  onCheckedChange={(checked: boolean) =>
                    handleToggle(event.key, checked)
                  }
                />
              </label>
            ))
          )}
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
