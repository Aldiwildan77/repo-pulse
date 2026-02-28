import { useState } from "react";
import { useNavigate } from "react-router";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Bell,
  ScrollText,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusCircle,
} from "lucide-react";
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
  total: number;
  offset: number;
  pageSize: number;
  onPageChange: (offset: number) => void;
  onToggleActive: (id: number, isActive: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function RepoList({
  repositories,
  total,
  offset,
  pageSize,
  onPageChange,
  onToggleActive,
  onDelete,
}: RepoListProps) {
  const navigate = useNavigate();
  const [notifModal, setNotifModal] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [logsModal, setLogsModal] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const totalPages = Math.ceil(total / pageSize);
  const currentPage = Math.floor(offset / pageSize) + 1;

  if (repositories.length === 0 && offset === 0) {
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
      {/* Add Channel button */}
      <div className="flex justify-end mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/repositories/new")}
        >
          <PlusCircle className="mr-1 h-4 w-4" />
          Add Channel
        </Button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Repository</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Channel ID</TableHead>
              <TableHead>Tags</TableHead>
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
                  {repo.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {repo.tags.map((t) => (
                        <Badge key={t} variant="default" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      default
                    </Badge>
                  )}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          setNotifModal({
                            id: repo.id,
                            name: repo.providerRepo,
                          })
                        }
                      >
                        <Bell className="mr-2 h-4 w-4" />
                        Notification Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          setLogsModal({
                            id: repo.id,
                            name: repo.providerRepo,
                          })
                        }
                      >
                        <ScrollText className="mr-2 h-4 w-4" />
                        View Logs
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          navigate(`/repositories/${repo.id}/edit`)
                        }
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
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {repositories.map((repo) => (
          <div
            key={repo.id}
            className="flex items-start justify-between rounded-lg border p-4"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <p className="truncate font-medium">{repo.providerRepo}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="text-xs">
                  {repo.provider}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {repo.platform}
                </Badge>
                {repo.tags.length > 0 ? (
                  repo.tags.map((t) => (
                    <Badge key={t} variant="default" className="text-xs">
                      {t}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    default
                  </Badge>
                )}
                <span className="truncate font-mono text-xs text-muted-foreground">
                  #{repo.channelId}
                </span>
              </div>
              <RepoStatusBadge
                isActive={repo.isActive}
                onToggle={(active) => onToggleActive(repo.id, active)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    setNotifModal({
                      id: repo.id,
                      name: repo.providerRepo,
                    })
                  }
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notification Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    setLogsModal({
                      id: repo.id,
                      name: repo.providerRepo,
                    })
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
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-xs text-muted-foreground">
            {total} total repositories
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={offset === 0}
              onClick={() =>
                onPageChange(Math.max(0, offset - pageSize))
              }
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
              disabled={offset + pageSize >= total}
              onClick={() => onPageChange(offset + pageSize)}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
