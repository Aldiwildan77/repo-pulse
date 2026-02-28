import { useNavigate } from "react-router";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { RepoStatusBadge } from "./repo-status-badge";
import type { RepoConfig } from "@/hooks/use-repositories";

interface EventToggleKey {
  key: keyof Pick<RepoConfig, "notifyPrOpened" | "notifyPrMerged" | "notifyPrLabel" | "notifyComment" | "notifyIssueOpened" | "notifyIssueClosed">;
  label: string;
}

const EVENT_TOGGLES: EventToggleKey[] = [
  { key: "notifyPrOpened", label: "PR Opened" },
  { key: "notifyPrMerged", label: "PR Merged/Closed" },
  { key: "notifyPrLabel", label: "PR Label" },
  { key: "notifyComment", label: "Mentions" },
  { key: "notifyIssueOpened", label: "Issue Opened" },
  { key: "notifyIssueClosed", label: "Issue Closed" },
];

interface RepoListProps {
  repositories: RepoConfig[];
  onToggleActive: (id: number, isActive: boolean) => Promise<void>;
  onToggleEvent: (id: number, field: string, value: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function RepoList({
  repositories,
  onToggleActive,
  onToggleEvent,
  onDelete,
}: RepoListProps) {
  const navigate = useNavigate();

  if (repositories.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>No repositories configured yet.</p>
        <Button
          variant="link"
          className="mt-2"
          onClick={() => navigate("/repositories/new")}
        >
          Add your first repository
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Repository</TableHead>
          <TableHead>Provider</TableHead>
          <TableHead>Platform</TableHead>
          <TableHead>Channel ID</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {repositories.map((repo) => (
          <>
            <TableRow key={repo.id}>
              <TableCell className="font-medium">
                {repo.providerRepo}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{repo.provider}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{repo.platform}</Badge>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {repo.channelId}
              </TableCell>
              <TableCell>
                <RepoStatusBadge
                  isActive={repo.isActive}
                  onToggle={(active) => onToggleActive(repo.id, active)}
                />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => navigate(`/repositories/${repo.id}/edit`)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(repo.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
            <TableRow key={`${repo.id}-events`}>
              <TableCell colSpan={6} className="py-2 px-4">
                <div className="flex flex-wrap gap-4">
                  {EVENT_TOGGLES.map((toggle) => (
                    <label
                      key={toggle.key}
                      className="flex items-center gap-1.5"
                    >
                      <Switch
                        size="sm"
                        checked={repo[toggle.key]}
                        onCheckedChange={(checked: boolean) =>
                          onToggleEvent(repo.id, toggle.key, checked)
                        }
                        disabled={!repo.isActive}
                      />
                      <span className="text-xs text-muted-foreground">
                        {toggle.label}
                      </span>
                    </label>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          </>
        ))}
      </TableBody>
    </Table>
  );
}
