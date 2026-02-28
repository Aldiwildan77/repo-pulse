import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RepoStatusBadgeProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
  disabled?: boolean;
}

export function RepoStatusBadge({
  isActive,
  onToggle,
  disabled,
}: RepoStatusBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2">
          <Switch
            checked={isActive}
            onCheckedChange={onToggle}
            disabled={disabled}
          />
          <span className="text-sm text-muted-foreground">
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {isActive
          ? "Notifications are being sent. Toggle to pause."
          : "Notifications are paused. Toggle to resume."}
      </TooltipContent>
    </Tooltip>
  );
}
