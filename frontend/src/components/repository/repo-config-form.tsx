import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Platform } from "@/utils/constants";
import type { RepoConfigInput } from "@/hooks/use-repositories";

interface RepoConfigFormProps {
  initialValues?: RepoConfigInput;
  onSubmit: (values: RepoConfigInput) => Promise<void>;
  isSubmitting: boolean;
}

const defaultValues: RepoConfigInput = {
  providerRepo: "",
  platform: "discord",
  channelId: "",
};

export function RepoConfigForm({
  initialValues,
  onSubmit,
  isSubmitting,
}: RepoConfigFormProps) {
  const [values, setValues] = useState<RepoConfigInput>(
    initialValues ?? defaultValues,
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="providerRepo">Repository</Label>
        <Input
          id="providerRepo"
          placeholder="owner/repo"
          value={values.providerRepo}
          onChange={(e) =>
            setValues((v) => ({ ...v, providerRepo: e.target.value }))
          }
          required
        />
        <p className="text-xs text-muted-foreground">
          Full repository name (e.g., octocat/hello-world)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="platform">Platform</Label>
        <Select
          value={values.platform}
          onValueChange={(v: Platform) =>
            setValues((prev) => ({ ...prev, platform: v }))
          }
        >
          <SelectTrigger id="platform">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="discord">Discord</SelectItem>
            <SelectItem value="slack">Slack</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="channelId">Channel ID</Label>
        <Input
          id="channelId"
          placeholder="Channel ID"
          value={values.channelId}
          onChange={(e) =>
            setValues((v) => ({ ...v, channelId: e.target.value }))
          }
          required
        />
        <p className="text-xs text-muted-foreground">
          The {values.platform === "discord" ? "Discord" : "Slack"} channel ID
          where notifications will be sent
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting
          ? "Saving..."
          : initialValues
            ? "Update Repository"
            : "Add Repository"}
      </Button>
    </form>
  );
}
