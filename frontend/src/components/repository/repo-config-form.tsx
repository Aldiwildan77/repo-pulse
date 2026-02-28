import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useConnectedRepos } from '@/hooks/use-connected-repos';
import {
  useDiscordChannels,
  useDiscordGuilds,
  useSlackChannels,
} from '@/hooks/use-platforms';
import type { RepoConfigInput } from '@/hooks/use-repositories';
import type { Platform, SourceProvider } from '@/utils/constants';
import { API_URL } from '@/utils/constants';
import { Switch } from '@/components/ui/switch';
import { ExternalLinkIcon, PlusIcon, RefreshCwIcon, SettingsIcon, XIcon } from 'lucide-react';
import { useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { defaultValues, type MultiPlatformState, type PlatformConfig } from './repo-config-defaults';

interface RepoConfigFormProps {
  initialValues?: RepoConfigInput;
  onSubmit: (values: RepoConfigInput) => Promise<void>;
  isSubmitting: boolean;
}

const providerNames: Record<SourceProvider, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  bitbucket: 'Bitbucket',
};

// --- Extracted step content components for reuse in wizard ---

interface SourceStepContentProps {
  values: RepoConfigInput;
  setValues: React.Dispatch<React.SetStateAction<RepoConfigInput>>;
  initialProviderRepo?: string;
}

export function SourceStepContent({
  values,
  setValues,
  initialProviderRepo,
}: SourceStepContentProps) {
  const {
    repos: connectedRepos,
    isLoading: reposLoading,
    error: reposError,
    refetch: refetchRepos,
  } = useConnectedRepos(values.provider);

  const filteredRepos = connectedRepos;

  const handleProviderChange = (provider: SourceProvider) => {
    setValues((prev) => ({ ...prev, provider, providerRepo: '' }));
  };

  return (
    <div className='space-y-4'>
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField
          label='Provider'
          htmlFor='provider'
          action={
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-5 w-5'
                  onClick={() =>
                    window.open(
                      `${API_URL}/api/providers/${values.provider}/install`,
                      '_blank',
                    )
                  }
                >
                  <SettingsIcon className='h-3.5 w-3.5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Configure {providerNames[values.provider]} App settings
              </TooltipContent>
            </Tooltip>
          }
        >
          <Select
            value={values.provider}
            onValueChange={(v: SourceProvider) => handleProviderChange(v)}
          >
            <SelectTrigger id='provider'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='github'>GitHub</SelectItem>
              <SelectItem value='gitlab'>GitLab</SelectItem>
              <SelectItem value='bitbucket'>Bitbucket</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label='Repository' htmlFor='providerRepo'>
          {reposError ? (
            <div className='flex flex-col gap-2'>
              <p className='text-sm text-destructive'>
                {reposError}
              </p>
              <div className='flex gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={refetchRepos}
                >
                  <RefreshCwIcon className='mr-1 h-4 w-4' />
                  Retry
                </Button>
              </div>
            </div>
          ) : filteredRepos.length > 0 || reposLoading ? (
            <Combobox
              id='providerRepo'
              options={[
                ...(initialProviderRepo &&
                !filteredRepos.some(
                  (r) => r.providerRepo === initialProviderRepo,
                )
                  ? [
                      {
                        value: initialProviderRepo,
                        label: initialProviderRepo,
                      },
                    ]
                  : []),
                ...filteredRepos.map((r) => ({
                  value: r.providerRepo,
                  label: r.providerRepo,
                })),
              ]}
              value={values.providerRepo}
              onValueChange={(v) =>
                setValues((prev) => ({ ...prev, providerRepo: v }))
              }
              disabled={reposLoading}
              placeholder={
                reposLoading ? 'Loading repositories...' : 'Select a repository'
              }
              searchPlaceholder='Search repositories...'
              emptyMessage='No matching repositories.'
            />
          ) : (
            <div className='flex flex-col gap-2'>
              <p className='text-sm text-muted-foreground'>
                No connected repositories found.
              </p>
              {values.provider === 'github' && (
                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      window.open(
                        `${API_URL}/api/providers/${values.provider}/install`,
                        '_blank',
                      )
                    }
                  >
                    <ExternalLinkIcon className='mr-1 h-4 w-4' />
                    Install GitHub App
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={refetchRepos}
                  >
                    <RefreshCwIcon className='mr-1 h-4 w-4' />
                    Refresh
                  </Button>
                </div>
              )}
            </div>
          )}
        </FormField>
      </div>
    </div>
  );
}

// --- Row-based tag input for label-to-channel mapping ---

export function TagsInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const value = draft.trim().toLowerCase();
    if (value && !tags.includes(value)) {
      onChange([...tags, value]);
    }
    setDraft('');
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <FormField
      label='Label Tags'
      htmlFor='tags'
      hint='Optional. PRs with a notify:<tag> GitHub label will be routed to this channel. No tags = default (receives all notifications).'
    >
      <div className='space-y-2'>
        {tags.length > 0 && (
          <div className='space-y-1'>
            {tags.map((tag) => (
              <div
                key={tag}
                className='flex items-center justify-between rounded-md border px-3 py-1.5 text-sm'
              >
                <span className='font-mono'>notify:{tag}</span>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6'
                  onClick={() => removeTag(tag)}
                >
                  <XIcon className='h-3.5 w-3.5' />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className='flex gap-2'>
          <Input
            id='tags'
            placeholder='e.g. alerts'
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button
            type='button'
            variant='outline'
            size='icon'
            className='shrink-0'
            onClick={addTag}
            disabled={!draft.trim()}
          >
            <PlusIcon className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </FormField>
  );
}

interface NotificationStepContentProps {
  values: RepoConfigInput;
  setValues: React.Dispatch<React.SetStateAction<RepoConfigInput>>;
  initialValues?: RepoConfigInput;
}

export function NotificationStepContent({
  values,
  setValues,
  initialValues,
}: NotificationStepContentProps) {
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);
  const { guilds, isLoading: guildsLoading } = useDiscordGuilds();

  const activeGuildId = useMemo(() => {
    if (selectedGuildId) return selectedGuildId;
    if (
      initialValues?.platform === 'discord' &&
      initialValues.channelId &&
      guilds.length > 0
    ) {
      return guilds[0].id;
    }
    return null;
  }, [selectedGuildId, initialValues, guilds]);

  const { channels: discordChannels, isLoading: discordChannelsLoading } =
    useDiscordChannels(values.platform === 'discord' ? activeGuildId : null);
  const { channels: slackChannels, isLoading: slackChannelsLoading } =
    useSlackChannels();

  const handlePlatformChange = (platform: Platform) => {
    setValues((prev) => ({ ...prev, platform, channelId: '' }));
    setSelectedGuildId(null);
  };

  const handleGuildChange = (guildId: string) => {
    setSelectedGuildId(guildId);
    setValues((prev) => ({ ...prev, channelId: '' }));
  };

  const channels =
    values.platform === 'discord' ? discordChannels : slackChannels;
  const channelsLoading =
    values.platform === 'discord'
      ? discordChannelsLoading
      : slackChannelsLoading;

  return (
    <div className='space-y-4'>
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField label='Platform' htmlFor='platform'>
          <Select
            value={values.platform}
            onValueChange={(v: Platform) => handlePlatformChange(v)}
          >
            <SelectTrigger id='platform'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='discord'>Discord</SelectItem>
              <SelectItem value='slack'>Slack</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        {values.platform === 'discord' && (
          <FormField
            label='Server'
            htmlFor='guild'
            hint='Select the Discord server where the bot is installed'
          >
            <Select
              value={activeGuildId ?? ''}
              onValueChange={handleGuildChange}
              disabled={guildsLoading}
            >
              <SelectTrigger id='guild'>
                <SelectValue
                  placeholder={
                    guildsLoading ? 'Loading servers...' : 'Select a server'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {guilds.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      </div>

      <FormField
        label='Channel'
        htmlFor='channelId'
        hint={`The ${values.platform === 'discord' ? 'Discord' : 'Slack'} channel where notifications will be sent`}
      >
        <Select
          value={values.channelId}
          onValueChange={(v) =>
            setValues((prev) => ({ ...prev, channelId: v }))
          }
          disabled={
            channelsLoading || (values.platform === 'discord' && !activeGuildId)
          }
        >
          <SelectTrigger id='channelId'>
            <SelectValue
              placeholder={
                channelsLoading
                  ? 'Loading channels...'
                  : values.platform === 'discord' && !activeGuildId
                    ? 'Select a server first'
                    : 'Select a channel'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {channels.map((ch) => (
              <SelectItem key={ch.id} value={ch.id}>
                # {ch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <TagsInput
        tags={values.tags ?? []}
        onChange={(tags) => setValues((prev) => ({ ...prev, tags }))}
      />
    </div>
  );
}

// --- Multi-platform components ---

interface PlatformSectionProps {
  platform: Platform;
  config: PlatformConfig;
  onChange: (config: PlatformConfig) => void;
}

function PlatformSection({ platform, config, onChange }: PlatformSectionProps) {
  const { guilds, isLoading: guildsLoading } = useDiscordGuilds();
  const { channels: discordChannels, isLoading: discordChannelsLoading } =
    useDiscordChannels(platform === 'discord' ? config.guildId : null);
  const { channels: slackChannels, isLoading: slackChannelsLoading } =
    useSlackChannels();

  const channels = platform === 'discord' ? discordChannels : slackChannels;
  const channelsLoading =
    platform === 'discord' ? discordChannelsLoading : slackChannelsLoading;

  return (
    <div className='space-y-4'>
      {platform === 'discord' && (
        <FormField
          label='Server'
          htmlFor={`guild-${platform}`}
          hint='Select the Discord server where the bot is installed'
        >
          <Select
            value={config.guildId ?? ''}
            onValueChange={(guildId) =>
              onChange({ ...config, guildId, channelId: '' })
            }
            disabled={guildsLoading}
          >
            <SelectTrigger id={`guild-${platform}`}>
              <SelectValue
                placeholder={
                  guildsLoading ? 'Loading servers...' : 'Select a server'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {guilds.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}

      <FormField
        label='Channel'
        htmlFor={`channel-${platform}`}
        hint={`The ${platform === 'discord' ? 'Discord' : 'Slack'} channel where notifications will be sent`}
      >
        <Select
          value={config.channelId}
          onValueChange={(v) => onChange({ ...config, channelId: v })}
          disabled={
            channelsLoading || (platform === 'discord' && !config.guildId)
          }
        >
          <SelectTrigger id={`channel-${platform}`}>
            <SelectValue
              placeholder={
                channelsLoading
                  ? 'Loading channels...'
                  : platform === 'discord' && !config.guildId
                    ? 'Select a server first'
                    : 'Select a channel'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {channels.map((ch) => (
              <SelectItem key={ch.id} value={ch.id}>
                # {ch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <TagsInput
        tags={config.tags}
        onChange={(tags) => onChange({ ...config, tags })}
      />
    </div>
  );
}

interface MultiPlatformNotificationStepProps {
  platformConfigs: MultiPlatformState;
  setPlatformConfigs: Dispatch<SetStateAction<MultiPlatformState>>;
}

export function MultiPlatformNotificationStep({
  platformConfigs,
  setPlatformConfigs,
}: MultiPlatformNotificationStepProps) {
  const platforms = [
    { key: 'discord' as const, label: 'Discord' },
    { key: 'slack' as const, label: 'Slack' },
  ];

  return (
    <div className='space-y-4'>
      {platforms.map(({ key, label }) => (
        <div key={key} className='rounded-lg border p-4 space-y-4'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium'>{label}</span>
            <Switch
              checked={platformConfigs[key].enabled}
              onCheckedChange={(checked: boolean) =>
                setPlatformConfigs((prev) => ({
                  ...prev,
                  [key]: { ...prev[key], enabled: checked },
                }))
              }
            />
          </div>
          {platformConfigs[key].enabled && (
            <PlatformSection
              platform={key}
              config={platformConfigs[key]}
              onChange={(config) =>
                setPlatformConfigs((prev) => ({ ...prev, [key]: config }))
              }
            />
          )}
        </div>
      ))}
      {!platformConfigs.discord.enabled && !platformConfigs.slack.enabled && (
        <p className='text-sm text-destructive'>
          At least one platform must be enabled.
        </p>
      )}
    </div>
  );
}

// --- Original form component (used for editing) ---

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
    <form onSubmit={handleSubmit} className='space-y-8'>
      {/* Source section */}
      <div className='space-y-4'>
        <h3 className='text-sm font-medium text-muted-foreground'>Source</h3>
        <SourceStepContent
          values={values}
          setValues={setValues}
          initialProviderRepo={initialValues?.providerRepo}
        />
      </div>

      <Separator />

      {/* Notification section */}
      <div className='space-y-4'>
        <h3 className='text-sm font-medium text-muted-foreground'>
          Notification Target
        </h3>
        <NotificationStepContent
          values={values}
          setValues={setValues}
          initialValues={initialValues}
        />
      </div>

      <Button type='submit' disabled={isSubmitting} className='w-full'>
        {isSubmitting
          ? 'Saving...'
          : initialValues
            ? 'Update Repository'
            : 'Add Repository'}
      </Button>
    </form>
  );
}
