import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Stepper } from "@/components/ui/stepper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SourceStepContent,
  NotificationStepContent,
} from "./repo-config-form";
import { defaultValues } from "./repo-config-defaults";
import { useRepositoryMutations, type RepoConfigInput } from "@/hooks/use-repositories";

const STEPS = [
  { label: "Source" },
  { label: "Notification Target" },
  { label: "Event Notifications" },
];

const EVENT_TYPES = [
  { key: "pr_opened", label: "PR Opened" },
  { key: "pr_merged", label: "PR Merged / Closed" },
  { key: "pr_review_approved", label: "PR Approved" },
  { key: "pr_review_changes_requested", label: "PR Changes Requested" },
  { key: "pr_label", label: "PR Label Changed" },
  { key: "comment", label: "Mentions in Comments" },
  { key: "issue_opened", label: "Issue Opened" },
  { key: "issue_closed", label: "Issue Closed" },
];

export function RepoConfigWizard() {
  const navigate = useNavigate();
  const { create, upsertEventToggle } = useRepositoryMutations();
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<RepoConfigInput>({ ...defaultValues });
  const [eventToggles, setEventToggles] = useState<Record<string, boolean>>(
    () => Object.fromEntries(EVENT_TYPES.map((e) => [e.key, true])),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canGoNext = () => {
    if (currentStep === 0) {
      return !!values.provider && !!values.providerRepo;
    }
    if (currentStep === 1) {
      return !!values.platform && !!values.channelId;
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
      const repo = await create(values);
      const disabledEvents = Object.entries(eventToggles).filter(
        ([, enabled]) => !enabled,
      );
      await Promise.all(
        disabledEvents.map(([eventType]) =>
          upsertEventToggle(repo.id, eventType, false),
        ),
      );
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
          Configure the repository and notification channel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <Stepper steps={STEPS} currentStep={currentStep} />

        {currentStep === 0 && (
          <SourceStepContent values={values} setValues={setValues} />
        )}

        {currentStep === 1 && (
          <NotificationStepContent values={values} setValues={setValues} />
        )}

        {currentStep === 2 && (
          <div className="space-y-3">
            {EVENT_TYPES.map((event) => (
              <label
                key={event.key}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <span className="text-sm font-medium">{event.label}</span>
                <Switch
                  checked={eventToggles[event.key]}
                  onCheckedChange={(checked: boolean) =>
                    setEventToggles((prev) => ({
                      ...prev,
                      [event.key]: checked,
                    }))
                  }
                />
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
