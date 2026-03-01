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
import type { Platform, SourceProvider } from '@/utils/constants';
import { API_URL } from '@/utils/constants';
import { Switch } from '@/components/ui/switch';
import { ExternalLinkIcon, PlusIcon, RefreshCwIcon, SettingsIcon, Trash2Icon, XIcon } from 'lucide-react';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { defaultChannelMapping, type ChannelMapping, type MultiPlatformState, type SourceValues } from './repo-config-defaults';

const providerNames: Record<SourceProvider, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  bitbucket: 'Bitbucket',
};

// --- Extracted step content components for reuse in wizard ---

interface SourceStepContentProps {
  values: SourceValues;
  setValues: React.Dispatch<React.SetStateAction<SourceValues>>;
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
  } = useConnectedRepos(values.providerType);

  const filteredRepos = connectedRepos;

  const handleProviderChange = (provider: SourceProvider) => {
    setValues((prev) => ({ ...prev, providerType: provider, providerRepo: '' }));
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
                      `${API_URL}/api/providers/${values.providerType}/install`,
                      '_blank',
                    )
                  }
                >
                  <SettingsIcon className='h-3.5 w-3.5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Configure {providerNames[values.providerType]} App settings
              </TooltipContent>
            </Tooltip>
          }
        >
          <Select
            value={values.providerType}
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
              {values.providerType === 'github' && (
                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      window.open(
                        `${API_URL}/api/providers/${values.providerType}/install`,
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

// --- Multi-platform components with channel-tag mappings ---

interface ChannelMappingRowProps {
  platform: Platform;
  mapping: ChannelMapping;
  index: number;
  canRemove: boolean;
  onChange: (mapping: ChannelMapping) => void;
  onRemove: () => void;
}

function ChannelMappingRow({
  platform,
  mapping,
  index,
  canRemove,
  onChange,
  onRemove,
}: ChannelMappingRowProps) {
  const { guilds, isLoading: guildsLoading } = useDiscordGuilds();
  const { channels: discordChannels, isLoading: discordChannelsLoading } =
    useDiscordChannels(platform === 'discord' ? mapping.guildId : null);
  const { channels: slackChannels, isLoading: slackChannelsLoading } =
    useSlackChannels();

  const channels = platform === 'discord' ? discordChannels : slackChannels;
  const channelsLoading =
    platform === 'discord' ? discordChannelsLoading : slackChannelsLoading;

  return (
    <div className='space-y-3 rounded-md border border-dashed p-3'>
      <div className='flex items-center justify-between'>
        <span className='text-xs font-medium text-muted-foreground'>
          Channel {index + 1}
        </span>
        {canRemove && (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-6 w-6'
            onClick={onRemove}
          >
            <Trash2Icon className='h-3.5 w-3.5' />
          </Button>
        )}
      </div>

      {platform === 'discord' && (
        <FormField
          label='Server'
          htmlFor={`guild-${platform}-${index}`}
          hint='Select the Discord server where the bot is installed'
        >
          <Select
            value={mapping.guildId ?? ''}
            onValueChange={(guildId) =>
              onChange({ ...mapping, guildId, channelId: '' })
            }
            disabled={guildsLoading}
          >
            <SelectTrigger id={`guild-${platform}-${index}`}>
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
        htmlFor={`channel-${platform}-${index}`}
        hint={`The ${platform === 'discord' ? 'Discord' : 'Slack'} channel where notifications will be sent`}
      >
        <Select
          value={mapping.channelId}
          onValueChange={(v) => onChange({ ...mapping, channelId: v })}
          disabled={
            channelsLoading || (platform === 'discord' && !mapping.guildId)
          }
        >
          <SelectTrigger id={`channel-${platform}-${index}`}>
            <SelectValue
              placeholder={
                channelsLoading
                  ? 'Loading channels...'
                  : platform === 'discord' && !mapping.guildId
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
        tags={mapping.tags}
        onChange={(tags) => onChange({ ...mapping, tags })}
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

  const updateMapping = (
    platformKey: 'discord' | 'slack',
    index: number,
    mapping: ChannelMapping,
  ) => {
    setPlatformConfigs((prev) => {
      const updated = [...prev[platformKey].mappings];
      updated[index] = mapping;
      return { ...prev, [platformKey]: { ...prev[platformKey], mappings: updated } };
    });
  };

  const removeMapping = (platformKey: 'discord' | 'slack', index: number) => {
    setPlatformConfigs((prev) => {
      const updated = prev[platformKey].mappings.filter((_, i) => i !== index);
      return { ...prev, [platformKey]: { ...prev[platformKey], mappings: updated } };
    });
  };

  const addMapping = (platformKey: 'discord' | 'slack') => {
    setPlatformConfigs((prev) => ({
      ...prev,
      [platformKey]: {
        ...prev[platformKey],
        mappings: [...prev[platformKey].mappings, { ...defaultChannelMapping }],
      },
    }));
  };

  const togglePlatform = (platformKey: 'discord' | 'slack', checked: boolean) => {
    setPlatformConfigs((prev) => ({
      ...prev,
      [platformKey]: {
        ...prev[platformKey],
        enabled: checked,
        mappings: checked && prev[platformKey].mappings.length === 0
          ? [{ ...defaultChannelMapping }]
          : prev[platformKey].mappings,
      },
    }));
  };

  return (
    <div className='space-y-4'>
      {platforms.map(({ key, label }) => (
        <div key={key} className='rounded-lg border p-4 space-y-4'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium'>{label}</span>
            <Switch
              checked={platformConfigs[key].enabled}
              onCheckedChange={(checked: boolean) => togglePlatform(key, checked)}
            />
          </div>
          {platformConfigs[key].enabled && (
            <div className='space-y-3'>
              {platformConfigs[key].mappings.map((mapping, idx) => (
                <ChannelMappingRow
                  key={idx}
                  platform={key}
                  mapping={mapping}
                  index={idx}
                  canRemove={platformConfigs[key].mappings.length > 1}
                  onChange={(m) => updateMapping(key, idx, m)}
                  onRemove={() => removeMapping(key, idx)}
                />
              ))}
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='w-full'
                onClick={() => addMapping(key)}
              >
                <PlusIcon className='mr-1 h-4 w-4' />
                Add Channel Mapping
              </Button>
            </div>
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
