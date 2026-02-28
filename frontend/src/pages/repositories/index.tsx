import { Link } from "react-router";
import { Plus } from "lucide-react";
import {
  useRepositories,
  useRepositoryMutations,
} from "@/hooks/use-repositories";
import { RepoList } from "@/components/repository/repo-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";

export function RepositoriesPage() {
  const { repositories, isLoading, refetch } = useRepositories();
  const { toggleActive, update, remove } = useRepositoryMutations();

  const handleToggle = async (id: number, isActive: boolean) => {
    await toggleActive(id, isActive);
    refetch();
  };

  const handleToggleEvent = async (id: number, field: string, value: boolean) => {
    await update(id, { [field]: value });
    refetch();
  };

  const handleDelete = async (id: number) => {
    await remove(id);
    refetch();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repositories"
        description="Manage your repository notification configurations"
      >
        <Button asChild>
          <Link to="/repositories/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Repository
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Configured Repositories</CardTitle>
          <CardDescription>
            Repositories that send PR notifications to your channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <RepoList
              repositories={repositories}
              onToggleActive={handleToggle}
              onToggleEvent={handleToggleEvent}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
