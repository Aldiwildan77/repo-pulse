import { Link } from "react-router";
import { Building2, Users, ChevronRight } from "lucide-react";
import { useWorkspaces } from "@/hooks/use-workspaces";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";

export function WorkspacesPage() {
  const { data: workspaces, isLoading, error } = useWorkspaces();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspaces"
        description="Manage your workspaces and team members"
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Failed to load workspaces
          </CardContent>
        </Card>
      ) : !workspaces?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No workspaces found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Link key={ws.id} to={`/workspaces/${ws.id}`}>
              <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {ws.name}
                  </CardTitle>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Workspace
                  </CardDescription>
                  <Badge variant="secondary" className="mt-2">
                    {ws.id}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
