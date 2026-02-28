import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  useRepositories,
  useRepositoryMutations,
  type RepoConfigInput,
  type RepoConfig,
} from "@/hooks/use-repositories";
import { useApi } from "@/hooks/use-api";
import { MultiPlatformNotificationStep } from "@/components/repository/repo-config-form";
import { RepoConfigWizard } from "@/components/repository/repo-config-wizard";
import {
  defaultMultiPlatformState,
  defaultPlatformConfig,
  type MultiPlatformState,
} from "@/components/repository/repo-config-defaults";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeft } from "lucide-react";
import type { Platform } from "@/utils/constants";

const providerNames: Record<string, string> = {
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket",
};

export function RepositoryConfigPage() {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillProvider = searchParams.get("provider");
  const prefillRepo = searchParams.get("repo");
  const prefilled =
    prefillProvider && prefillRepo
      ? {
          provider: prefillProvider as RepoConfigInput["provider"],
          providerRepo: prefillRepo,
        }
      : undefined;

  const isEditing = !!repoId;

  const { data: repository, isLoading: repoLoading } = useApi<RepoConfig>(
    repoId ? `/api/repos/config/${repoId}` : null,
  );
  const { repositories: allConfigs, isLoading: allLoading } = useRepositories();
  const { create, update, remove } = useRepositoryMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multi-platform state for edit form
  const [platformConfigs, setPlatformConfigs] = useState<MultiPlatformState>(
    () => ({ ...defaultMultiPlatformState }),
  );
  // Track existing config IDs for diff-based save
  const [existingIds, setExistingIds] = useState<{
    discord: number | null;
    slack: number | null;
  }>({ discord: null, slack: null });
  const [initialized, setInitialized] = useState(false);

  // Build multi-platform state from loaded configs
  useEffect(() => {
    if (!repository || allLoading) return;

    const siblings = allConfigs.filter(
      (c) =>
        c.provider === repository.provider &&
        c.providerRepo === repository.providerRepo,
    );

    const ids: { discord: number | null; slack: number | null } = {
      discord: null,
      slack: null,
    };
    const state: MultiPlatformState = {
      discord: { ...defaultPlatformConfig },
      slack: { ...defaultPlatformConfig },
    };

    for (const cfg of siblings) {
      const p = cfg.platform as Platform;
      if (p === "discord" || p === "slack") {
        ids[p] = cfg.id;
        state[p] = {
          enabled: true,
          channelId: cfg.channelId,
          guildId: null, // guild will be re-selected by user if needed
          tags: cfg.tags ?? [],
        };
      }
    }

    setExistingIds(ids);
    setPlatformConfigs(state);
    setInitialized(true);
  }, [repository, allConfigs, allLoading]);

  // Diff-based save
  const handleSave = async () => {
    if (!repository) return;
    setIsSubmitting(true);
    try {
      const platforms = ["discord", "slack"] as const;
      for (const p of platforms) {
        const cfg = platformConfigs[p];
        const existingId = existingIds[p];

        if (cfg.enabled && cfg.channelId) {
          if (existingId) {
            // Update existing
            await update(existingId, {
              channelId: cfg.channelId,
              tags: cfg.tags,
            });
          } else {
            // Create new
            await create({
              provider: repository.provider,
              providerRepo: repository.providerRepo,
              platform: p,
              channelId: cfg.channelId,
              tags: cfg.tags,
            });
          }
        } else if (!cfg.enabled && existingId) {
          // Delete
          await remove(existingId);
        }
      }
      navigate("/repositories");
    } catch {
      // Error toast handled by mutation hooks
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing && (repoLoading || allLoading || !initialized)) {
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

      {isEditing && repository ? (
        <Card>
          <CardHeader>
            <CardTitle>Repository Settings</CardTitle>
            <CardDescription>
              Configure the repository and notification channels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Source section — read-only */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Source
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {providerNames[repository.provider] ?? repository.provider}
                </Badge>
                <span className="text-sm font-mono">
                  {repository.providerRepo}
                </span>
              </div>
            </div>

            {/* Notification section — multi-platform */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Notification Targets
              </h3>
              <MultiPlatformNotificationStep
                platformConfigs={platformConfigs}
                setPlatformConfigs={setPlatformConfigs}
              />
            </div>

            <Button
              type="button"
              onClick={handleSave}
              disabled={
                isSubmitting ||
                (!platformConfigs.discord.enabled &&
                  !platformConfigs.slack.enabled)
              }
              className="w-full"
            >
              {isSubmitting ? "Saving..." : "Update Repository"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <RepoConfigWizard prefilled={prefilled} />
      )}
    </div>
  );
}
