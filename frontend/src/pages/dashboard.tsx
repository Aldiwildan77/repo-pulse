import { Link } from "react-router";
import { GitFork, MessageSquare, Hash, ArrowRight } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function DashboardPage() {
  const { user } = useAuth();
  const { repositories, isLoading } = useRepositories();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back, {user?.providerUsername}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Repositories</CardTitle>
            <GitFork className="h-4 w-4 text-muted-foreground" />
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
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={user?.discordBound ? "default" : "secondary"}>
              {user?.discordBound ? "Connected" : "Not Connected"}
            </Badge>
            <p className="mt-1 text-xs text-muted-foreground">
              {user?.discordBound
                ? "Receiving notifications"
                : "Connect in Profile"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Slack</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={user?.slackBound ? "default" : "secondary"}>
              {user?.slackBound ? "Connected" : "Not Connected"}
            </Badge>
            <p className="mt-1 text-xs text-muted-foreground">
              {user?.slackBound
                ? "Receiving notifications"
                : "Connect in Profile"}
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
              <p>No repositories configured yet.</p>
              <Button asChild variant="link" className="mt-2">
                <Link to="/repositories/new">Add your first repository</Link>
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
                      <Badge
                        variant={repo.isActive ? "default" : "secondary"}
                      >
                        {repo.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
