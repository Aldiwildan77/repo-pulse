import { useState } from "react";
import { useNavigate } from "react-router";
import { MoreHorizontal, Pencil, Trash2, Bell, ScrollText } from "lucide-react";
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
import { RepoStatusBadge } from "./repo-status-badge";
import { NotificationSettingsModal } from "./notification-settings-modal";
import { NotifierLogsModal } from "./notifier-logs-modal";
import type { RepoConfig } from "@/hooks/use-repositories";

interface RepoListProps {
  repositories: RepoConfig[];
  onToggleActive: (id: number, isActive: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function RepoList({
  repositories,
  onToggleActive,
  onDelete,
}: RepoListProps) {
  const navigate = useNavigate();
  const [notifModal, setNotifModal] = useState<{ id: number; name: string } | null>(null);
  const [logsModal, setLogsModal] = useState<{ id: number; name: string } | null>(null);

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
    <>
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
                      onClick={() =>
                        setNotifModal({ id: repo.id, name: repo.providerRepo })
                      }
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Notification Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setLogsModal({ id: repo.id, name: repo.providerRepo })
                      }
                    >
                      <ScrollText className="mr-2 h-4 w-4" />
                      View Logs
                    </DropdownMenuItem>
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
          ))}
        </TableBody>
      </Table>

      <NotificationSettingsModal
        repoConfigId={notifModal?.id ?? null}
        repoName={notifModal?.name ?? ""}
        open={!!notifModal}
        onOpenChange={(open) => {
          if (!open) setNotifModal(null);
        }}
      />

      <NotifierLogsModal
        repoConfigId={logsModal?.id ?? null}
        repoName={logsModal?.name ?? ""}
        open={!!logsModal}
        onOpenChange={(open) => {
          if (!open) setLogsModal(null);
        }}
      />
    </>
  );
}
