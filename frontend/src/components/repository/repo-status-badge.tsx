import { Switch } from "@/components/ui/switch";

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
  );
}
