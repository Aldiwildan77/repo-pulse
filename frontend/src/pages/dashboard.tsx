import { Link } from "react-router";
import {
  GitFork,
  MessageSquare,
  Hash,
  ArrowRight,
  Plus,
  Info,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRepositories } from "@/hooks/use-repositories";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FeedbackDialog } from "@/components/feedback-dialog";

export function DashboardPage() {
  const { user } = useAuth();
  const { repositories, isLoading } = useRepositories();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.providerUsername ?? user?.googleEmail ?? "there"}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Repositories</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <GitFork className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                Total repositories configured for notifications
              </TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{repositories.length}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Configured repositories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Discord</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                Discord connection for @mention notifications
              </TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent>
            <Badge variant={user?.discordBound ? "default" : "secondary"}>
              {user?.discordBound ? "Connected" : "Not Connected"}
            </Badge>
            <p className="mt-1 text-xs text-muted-foreground">
              {user?.discordBound
                ? "Receiving mention notifications via DM"
                : "Connect in Profile to receive DM mentions"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Slack</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                Slack connection for @mention notifications
              </TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent>
            <Badge variant={user?.slackBound ? "default" : "secondary"}>
              {user?.slackBound ? "Connected" : "Not Connected"}
            </Badge>
            <p className="mt-1 text-xs text-muted-foreground">
              {user?.slackBound
                ? "Receiving mention notifications via DM"
                : "Connect in Profile to receive DM mentions"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Repositories</CardTitle>
            <CardDescription>
              Your configured repository notifications
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/repositories">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : repositories.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Info className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              <p>No repositories configured yet.</p>
              <p className="mt-1 text-xs">
                Add a repository to start receiving PR notifications in your channels.
              </p>
              <Button asChild variant="default" size="sm" className="mt-3">
                <Link to="/repositories/new">
                  <Plus className="mr-1 h-4 w-4" />
                  Add your first repository
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repositories.slice(0, 5).map((repo) => (
                  <TableRow key={repo.id}>
                    <TableCell className="font-medium">
                      {repo.providerRepo}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{repo.platform}</Badge>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant={repo.isActive ? "default" : "secondary"}
                          >
                            {repo.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          {repo.isActive
                            ? "Notifications are being sent for this repository"
                            : "Notifications are paused for this repository"}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Share your feedback</CardTitle>
          <CardDescription>
            Help us improve the new homepage by sharing your thoughts and suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeedbackDialog />
        </CardContent>
      </Card>
    </div>
  );
}
