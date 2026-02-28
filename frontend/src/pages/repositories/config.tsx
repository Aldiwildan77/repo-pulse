import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  useRepositoryMutations,
  type RepoConfigInput,
  type RepoConfig,
} from "@/hooks/use-repositories";
import { useApi } from "@/hooks/use-api";
import { RepoConfigForm } from "@/components/repository/repo-config-form";
import { RepoConfigWizard } from "@/components/repository/repo-config-wizard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeft } from "lucide-react";

export function RepositoryConfigPage() {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const { data: repository, isLoading } = useApi<RepoConfig>(
    repoId ? `/api/repos/config/${repoId}` : null,
  );
  const { update } = useRepositoryMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!repoId;

  const handleSubmit = async (values: RepoConfigInput) => {
    setIsSubmitting(true);
    try {
      if (isEditing && repoId) {
        await update(Number(repoId), {
          channelId: values.channelId,
        });
      }
      navigate("/repositories");
    } catch {
      // Error toast handled by mutation hooks
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="space-y-4 pt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2"
          onClick={() => navigate("/repositories")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <PageHeader
          title={isEditing ? "Edit Repository" : "Add Repository"}
          description={
            isEditing
              ? "Update your repository notification settings"
              : "Configure a new repository for PR notifications"
          }
        />
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Repository Settings</CardTitle>
            <CardDescription>
              Configure the repository and notification channel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RepoConfigForm
              initialValues={
                repository
                  ? {
                      provider: repository.provider,
                      providerRepo: repository.providerRepo,
                      platform: repository.platform,
                      channelId: repository.channelId,
                    }
                  : undefined
              }
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      ) : (
        <RepoConfigWizard />
      )}
    </div>
  );
}
