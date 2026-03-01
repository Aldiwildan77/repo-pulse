import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Stepper } from "@/components/ui/stepper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SourceStepContent,
  MultiPlatformNotificationStep,
} from "./repo-config-form";
import { defaultSourceValues, defaultMultiPlatformState, type MultiPlatformState, type SourceValues } from "./repo-config-defaults";
import { useRepositoryMutations } from "@/hooks/use-repositories";
import {
  GitPullRequest,
  GitMerge,
  ThumbsUp,
  MessageSquareWarning,
  Tag,
  AtSign,
  CircleDot,
  CheckCircle2,
  Info,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SourceProvider } from "@/utils/constants";

const STEPS = [
  { label: "Source" },
  { label: "Notification Target" },
  { label: "Event Notifications" },
];

const EVENT_TYPES: { key: string; label: string; description: string; icon: LucideIcon }[] = [
  { key: "pr_opened", label: "PR Opened", description: "When a new pull request is created", icon: GitPullRequest },
  { key: "pr_merged", label: "PR Merged / Closed", description: "When a PR is merged or closed", icon: GitMerge },
  { key: "pr_review_approved", label: "PR Approved", description: "When a reviewer approves a PR", icon: ThumbsUp },
  { key: "pr_review_changes_requested", label: "Changes Requested", description: "When a reviewer requests changes", icon: MessageSquareWarning },
  { key: "pr_label", label: "PR Label Changed", description: "When a label is added or removed", icon: Tag },
  { key: "comment", label: "Mentions in Comments", description: "When someone @mentions a bound user", icon: AtSign },
  { key: "issue_opened", label: "Issue Opened", description: "When a new issue is created", icon: CircleDot },
  { key: "issue_closed", label: "Issue Closed", description: "When an issue is closed", icon: CheckCircle2 },
];

const STEP_DESCRIPTIONS = [
  "Choose where to listen for events",
  "Choose where to send notifications",
  "Select which events to notify on",
];

interface RepoConfigWizardProps {
  prefilled?: {
    providerType: SourceProvider;
    providerRepo: string;
  };
}

export function RepoConfigWizard({ prefilled }: RepoConfigWizardProps = {}) {
  const navigate = useNavigate();
  const { create, upsertEventToggle } = useRepositoryMutations();
  const initialStep = prefilled ? 1 : 0;
  const [currentStep, setCurrentStep] = useState(initialStep);

  const [sourceValues, setSourceValues] = useState<SourceValues>(() => ({
    ...defaultSourceValues,
    ...(prefilled ? { providerType: prefilled.providerType, providerRepo: prefilled.providerRepo } : {}),
  }));

  // Multi-platform configs
  const [platformConfigs, setPlatformConfigs] = useState<MultiPlatformState>(
    () => ({ ...defaultMultiPlatformState }),
  );

  const [eventToggles, setEventToggles] = useState<Record<string, boolean>>(
    () => Object.fromEntries(EVENT_TYPES.map((e) => [e.key, true])),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canGoNext = () => {
    if (currentStep === 0) {
      return !!sourceValues.providerType && !!sourceValues.providerRepo;
    }
    if (currentStep === 1) {
      const hasValidMapping = (['discord', 'slack'] as const).some(
        (p) =>
          platformConfigs[p].enabled &&
          platformConfigs[p].mappings.some((m) => !!m.channelId),
      );
      return hasValidMapping;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Build notifications array from all enabled platforms
      const notifications: { platform: 'discord' | 'slack'; channelId: string; tags?: string[] }[] = [];
      for (const platform of ['discord', 'slack'] as const) {
        if (!platformConfigs[platform].enabled) continue;
        for (const mapping of platformConfigs[platform].mappings) {
          if (!mapping.channelId) continue;
          notifications.push({
            platform,
            channelId: mapping.channelId,
            tags: mapping.tags.length > 0 ? mapping.tags : undefined,
          });
        }
      }

      // Create ONE repo config with all notifications
      const repo = await create({
        providerType: sourceValues.providerType,
        providerRepo: sourceValues.providerRepo,
        notifications,
      });

      // Apply event toggles to each notification
      const disabledEvents = Object.entries(eventToggles).filter(
        ([, enabled]) => !enabled,
      );
      if (disabledEvents.length > 0 && repo.notifications.length > 0) {
        await Promise.all(
          repo.notifications.flatMap((notif) =>
            disabledEvents.map(([eventType]) =>
              upsertEventToggle(notif.id, eventType, false),
            ),
          ),
        );
      }

      navigate("/repositories");
    } catch {
      // Error toast handled by mutation hooks
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Repository</CardTitle>
        <CardDescription>
          Configure the repository and notification channels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <Stepper steps={STEPS} currentStep={currentStep} />

        <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-2">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 shrink-0" />
            Step {currentStep + 1}: {STEP_DESCRIPTIONS[currentStep]}
          </p>
        </div>

        {currentStep === 0 && (
          <SourceStepContent values={sourceValues} setValues={setSourceValues} />
        )}

        {currentStep === 1 && (
          <MultiPlatformNotificationStep
            platformConfigs={platformConfigs}
            setPlatformConfigs={setPlatformConfigs}
          />
        )}

        {currentStep === 2 && (
          <div className="space-y-2">
            {EVENT_TYPES.map((event) => (
              <label
                key={event.key}
                className="flex items-center gap-3 rounded-lg border px-4 py-3"
              >
                <event.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium">{event.label}</span>
                  <p className="text-xs text-muted-foreground">{event.description}</p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Switch
                        checked={eventToggles[event.key]}
                        onCheckedChange={(checked: boolean) =>
                          setEventToggles((prev) => ({
                            ...prev,
                            [event.key]: checked,
                          }))
                        }
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {eventToggles[event.key] ? "Click to disable" : "Click to enable"}
                  </TooltipContent>
                </Tooltip>
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="flex-1"
            >
              Back
            </Button>
          )}
          {currentStep < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext()}
              className="flex-1"
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Saving..." : "Save Repository"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
