import { useState } from "react";
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

const PAGE_SIZE = 20;

export function RepositoriesPage() {
  const [offset, setOffset] = useState(0);
  const { repositories, total, isLoading, refetch } = useRepositories({
    limit: PAGE_SIZE,
    offset,
  });
  const { toggleActive, remove } = useRepositoryMutations();

  const handleToggle = async (id: number, isActive: boolean) => {
    await toggleActive(id, isActive);
    refetch();
  };

  const handleDelete = async (id: number) => {
    await remove(id);
    refetch();
  };

  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset);
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
              total={total}
              offset={offset}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
              onToggleActive={handleToggle}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
