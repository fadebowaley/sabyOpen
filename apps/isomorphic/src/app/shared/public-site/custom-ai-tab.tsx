'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, Password, Switch, Text, Title } from 'rizzui';
import { SiAnthropic, SiGooglegemini, SiOpenai } from 'react-icons/si';
import {
  PiArrowSquareOutBold,
  PiCheckBold,
  PiCodeBlockBold,
  PiSparkleBold,
  PiTrashBold,
} from 'react-icons/pi';

export type ByokProviderId = 'openai' | 'gemini' | 'deepseek' | 'claude' | 'opencode';

export type ByokProviderData = {
  provider: ByokProviderId;
  enabled: boolean;
  keyMask: string;
  defaultModel?: string;
  hasKey: boolean;
  updatedAt?: string;
};

function DeepSeekIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M23.748 4.651c-.254-.124-.364.113-.512.233-.051.04-.094.09-.137.137-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.155-.708-.311-.955-.65-.172-.24-.219-.509-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.094.172.187.129.323-.082.28-.18.553-.266.833-.055.179-.137.218-.328.14a5.5 5.5 0 0 1-1.737-1.179c-.857-.828-1.631-1.743-2.597-2.46a12 12 0 0 0-.689-.47c-.985-.957.13-1.743.387-1.836.27-.098.094-.433-.778-.428-.872.003-1.67.295-2.687.685a3 3 0 0 1-.465.136 9.6 9.6 0 0 0-2.883-.101c-1.885.21-3.39 1.1-4.497 2.622C.082 8.776-.231 10.854.152 13.02c.403 2.284 1.568 4.175 3.36 5.653 1.857 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.132-.284 4.994-1.86.47.234.962.328 1.78.398.629.058 1.235-.031 1.705-.129.735-.155.684-.836.418-.961-2.155-1.004-1.682-.595-2.112-.926 1.095-1.295 2.768-3.598 3.284-6.733.05-.346.115-.834.108-1.114-.004-.171.035-.238.23-.257a4.2 4.2 0 0 0 1.545-.475c1.397-.763 1.96-2.016 2.093-3.517.02-.23-.004-.467-.247-.588M11.58 18.168c-2.088-1.642-3.101-2.183-3.52-2.16-.39.024-.32.472-.234.763.09.288.207.487.371.74.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.168-1.361-.801-2.5-1.86-3.301-3.306-.775-1.393-1.225-2.888-1.299-4.482-.02-.385.094-.522.477-.592a4.7 4.7 0 0 1 1.53-.038c2.131.311 3.946 1.264 5.467 2.774.868.86 1.525 1.887 2.202 2.89.72 1.066 1.494 2.082 2.48 2.915.348.291.626.513.892.677-.802.09-2.14.109-3.055-.615zm1.001-6.44a.306.306 0 0 1 .415-.287.3.3 0 0 1 .113.074.3.3 0 0 1 .086.214c0 .17-.136.307-.308.307a.303.303 0 0 1-.306-.307m3.11 1.596c-.2.081-.4.151-.591.16a1.25 1.25 0 0 1-.798-.254c-.274-.23-.47-.358-.551-.758a1.7 1.7 0 0 1 .015-.588c.07-.327-.007-.537-.238-.727-.188-.156-.426-.199-.689-.199a.6.6 0 0 1-.254-.078.253.253 0 0 1-.114-.358 1 1 0 0 1 .192-.21c.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.392.451.462.576.685.915.176.264.336.536.446.848.066.194-.02.353-.25.45" />
    </svg>
  );
}

export const CUSTOM_AI_PROVIDERS = [
  {
    id: 'openai' as const,
    name: 'OpenAI',
    Icon: SiOpenai,
    models: 'gpt-4o, gpt-4o-mini, o1, o3-mini',
    placeholder: 'sk-proj-...',
    consoleUrl: 'https://platform.openai.com/api-keys',
    description: 'GPT-4o, o1, and high-reasoning intelligence models.',
  },
  {
    id: 'gemini' as const,
    name: 'Google Gemini',
    Icon: SiGooglegemini,
    models: 'gemini-2.5-flash, gemini-2.5-pro, gemini-1.5-flash',
    placeholder: 'AIzaSy...',
    consoleUrl: 'https://aistudio.google.com/app/apikey',
    description: 'High-speed multimodal AI from Google DeepMind.',
  },
  {
    id: 'deepseek' as const,
    name: 'DeepSeek',
    Icon: DeepSeekIcon,
    models: 'deepseek-chat (V3), deepseek-reasoner (R1)',
    placeholder: 'sk-...',
    consoleUrl: 'https://platform.deepseek.com/api_keys',
    description: 'Cost-efficient reasoning and technical coding models.',
  },
  {
    id: 'claude' as const,
    name: 'Anthropic Claude',
    Icon: SiAnthropic,
    models: 'claude-3-7-sonnet, claude-3-5-sonnet',
    placeholder: 'sk-ant-...',
    consoleUrl: 'https://console.anthropic.com/settings/keys',
    description: 'Frontier models with structured thinking from Anthropic.',
  },
  {
    id: 'opencode' as const,
    name: 'OpenCode',
    Icon: PiCodeBlockBold,
    models:
      'big-pickle, mimo-v2.5-free, nemotron-3-super-free, minimax-m2.7, minimax-m2.5, glm-5.1, glm-5, kimi-k2.5, kimi-k2.6, grok-build-0.1',
    placeholder: 'opencode BYOK Console token',
    consoleUrl: 'https://opencode.ai/console',
    description:
      'BYOK Console catalog from opencode.ai. Free tier (mimo-v2.5-free, nemotron-3-super-free) runs only from within OpenCode; the flags here probe the BYOK gateway for paid Console keys.',
  },
];

type CustomAiTabProps = {
  isLightTheme: boolean;
};

export default function CustomAiTab({ isLightTheme }: CustomAiTabProps) {
  const [keys, setKeys] = useState<Record<string, ByokProviderData>>({});
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] =
    useState<ByokProviderId>('openai');
  const [inputKey, setInputKey] = useState('');
  const [testState, setTestState] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    latencyMs?: number;
  }>({ loading: false });
  const [saveState, setSaveState] = useState<{
    loading: boolean;
    message?: string;
    type?: 'success' | 'error';
  }>({ loading: false });

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/byok', { cache: 'no-store' });
      if (res.ok) {
        const payload: any = await res.json().catch(() => ({}));
        setKeys(payload?.data || {});
      }
    } catch (e) {
      console.error('Failed to load BYOK keys:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  const activeProvider = useMemo(
    () => CUSTOM_AI_PROVIDERS.find((p) => p.id === selectedProvider)!,
    [selectedProvider]
  );
  const configuredKey = keys[activeProvider.id];

  const handleTestKey = async () => {
    if (!inputKey.trim()) return;
    setTestState({ loading: true });
    try {
      const res = await fetch('/api/byok/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: inputKey.trim(),
        }),
      });
      const data: any = await res.json().catch(() => ({}));
      const isSuccess = Boolean(res.ok && (data?.data?.success ?? data?.success));
      const latencyMs = data?.data?.latencyMs ?? data?.latencyMs;
      const message =
        data?.data?.message ||
        data?.message ||
        data?.data?.error ||
        data?.error ||
        (isSuccess ? 'Connected successfully' : 'Verification failed');

      if (isSuccess) {
        setTestState({
          loading: false,
          success: true,
          message: latencyMs ? `Connected successfully (${latencyMs}ms)` : 'Connected successfully',
          latencyMs,
        });
        toast.success(`Key verified with ${activeProvider.name}!`);
      } else {
        setTestState({
          loading: false,
          success: false,
          message,
        });
        toast.error(message);
      }
    } catch (err: any) {
      setTestState({
        loading: false,
        success: false,
        message: err?.message || 'Network error during probe',
      });
      toast.error('Network error during probe');
    }
  };

  const handleSaveKey = async () => {
    if (!inputKey.trim()) return;
    setSaveState({ loading: true });
    try {
      const res = await fetch('/api/byok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: inputKey.trim(),
          enabled: true,
        }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (res.ok) {
        setSaveState({
          loading: false,
          type: 'success',
          message: `Key for ${activeProvider.name} encrypted & saved!`,
        });
        setInputKey('');
        setTestState({ loading: false });
        toast.success(`${activeProvider.name} key saved securely`);
        await loadKeys();
      } else {
        setSaveState({
          loading: false,
          type: 'error',
          message: data?.message || 'Failed to save key',
        });
        toast.error(data?.message || 'Failed to save key');
      }
    } catch (err: any) {
      setSaveState({
        loading: false,
        type: 'error',
        message: err?.message || 'Network error while saving key',
      });
      toast.error('Network error while saving key');
    }
  };

  const handleToggleKeyEnabled = async (
    providerId: ByokProviderId,
    newEnabledState: boolean
  ) => {
    try {
      const res = await fetch('/api/byok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerId,
          enabled: newEnabledState,
        }),
      });
      if (res.ok) {
        setKeys((prev) => ({
          ...prev,
          [providerId]: {
            ...prev[providerId],
            enabled: newEnabledState,
          },
        }));
        toast.success(
          `${CUSTOM_AI_PROVIDERS.find((p) => p.id === providerId)?.name} ${
            newEnabledState ? 'enabled' : 'disabled'
          }`
        );
      }
    } catch (err) {
      console.error('Failed to toggle key status:', err);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteKey = async (providerId: string) => {
    try {
      const res = await fetch(`/api/byok/${providerId}`, { method: 'DELETE' });
      if (res.ok) {
        setKeys((prev) => {
          const next = { ...prev };
          delete next[providerId];
          return next;
        });
        setSaveState({ loading: false });
        setTestState({ loading: false });
        toast.success(`${activeProvider.name} key removed`);
      }
    } catch (err) {
      console.error('Failed to delete key:', err);
      toast.error('Failed to remove key');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Info Banner */}
      <div
        className={`rounded-xl border p-4 transition-colors ${
          isLightTheme
            ? 'border-slate-200 bg-slate-50/70 text-slate-800'
            : 'border-white/10 bg-[#161c27] text-slate-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-[#1f2737] dark:text-slate-200">
            <PiSparkleBold className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <Title as="h4" className="text-sm font-semibold">
              Custom AI Providers
            </Title>
            <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Connect your organization’s own API keys. When configured, AI
              workflows run directly through your provider account, bypassing
              Saby platform token consumption limits. All keys are encrypted at
              rest using AES-256-GCM.
            </Text>
          </div>
        </div>
      </div>

      {/* Provider Selection Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {CUSTOM_AI_PROVIDERS.map((p) => {
          const isConfigured = Boolean(keys[p.id]?.hasKey);
          const isEnabled = Boolean(keys[p.id]?.enabled);
          const isSelected = selectedProvider === p.id;
          const ProviderIcon = p.Icon;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelectedProvider(p.id);
                setInputKey('');
                setTestState({ loading: false });
                setSaveState({ loading: false });
              }}
              className={`group relative flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                isSelected
                  ? isLightTheme
                    ? 'border-slate-900 bg-slate-50/80 shadow-sm ring-1 ring-slate-900'
                    : 'border-white/40 bg-white/5 shadow-sm ring-1 ring-white/30'
                  : isLightTheme
                    ? 'border-slate-200 bg-white hover:border-slate-300'
                    : 'border-white/10 bg-[#151a23] hover:border-white/20'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-[#1e2535] dark:text-slate-200">
                  <ProviderIcon className="h-4 w-4" />
                </span>
                {isConfigured ? (
                  <Badge
                    size="sm"
                    variant="flat"
                    color={isEnabled ? 'primary' : 'secondary'}
                    className="text-[10px] font-semibold"
                  >
                    {isEnabled ? 'Active' : 'Paused'}
                  </Badge>
                ) : (
                  <span className="text-[11px] text-slate-400">Default Saby</span>
                )}
              </div>

              <span className="mt-2.5 text-xs font-semibold text-slate-900 dark:text-white">
                {p.name}
              </span>
              <span className="mt-0.5 line-clamp-1 w-full text-[11px] text-slate-500 dark:text-slate-400">
                {p.models}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Provider Card */}
      <div
        className={`rounded-xl border p-5 transition-colors ${
          isLightTheme
            ? 'border-slate-200 bg-white'
            : 'border-white/10 bg-[#151a23]'
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-white/10 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-800 dark:border-white/10 dark:bg-[#1e2535] dark:text-slate-200">
              <activeProvider.Icon className="h-4 w-4" />
            </span>
            <div>
              <Title as="h5" className="text-sm font-semibold text-slate-900 dark:text-white">
                {activeProvider.name}
              </Title>
              <Text className="text-xs text-slate-500 dark:text-slate-400">
                {activeProvider.description}
              </Text>
            </div>
          </div>

          <a
            href={activeProvider.consoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <span>Get API Key</span>
            <PiArrowSquareOutBold className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Existing Configured Key Status */}
        {configuredKey?.hasKey ? (
          <div
            className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 ${
              isLightTheme
                ? 'border-slate-200 bg-slate-50/80'
                : 'border-white/10 bg-[#1b2230]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                <PiCheckBold className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Key:{' '}
                  <code className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {configuredKey.keyMask}
                  </code>
                </p>
                <p className="text-[11px] text-slate-500">
                  AES-256-GCM Encrypted
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Neutral Switch: no brilliant colors */}
              <div className="flex items-center gap-2">
                <Switch
                  size="sm"
                  checked={Boolean(configuredKey.enabled)}
                  onChange={(e) =>
                    handleToggleKeyEnabled(activeProvider.id, e.target.checked)
                  }
                  switchClassName="peer-checked:!bg-slate-700 dark:peer-checked:!bg-slate-300 !bg-slate-200 dark:!bg-slate-700"
                  className="cursor-pointer"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {configuredKey.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <Button
                size="sm"
                variant="text"
                color="danger"
                onClick={() => handleDeleteKey(activeProvider.id)}
                className="h-8 px-2 text-xs"
              >
                <PiTrashBold className="mr-1 h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          </div>
        ) : null}

        {/* Enter API Key Input */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {configuredKey?.hasKey
              ? 'Replace API Key'
              : `Enter ${activeProvider.name} API Key`}
          </label>
          <div className="mt-1.5">
            <Password
              size="md"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setTestState({ loading: false });
                setSaveState({ loading: false });
              }}
              placeholder={
                configuredKey?.hasKey
                  ? 'Paste new API key to update...'
                  : activeProvider.placeholder
              }
              inputClassName="font-mono text-xs rounded-xl border-slate-200 dark:border-white/10 dark:bg-[#161c27]"
            />
          </div>
        </div>

        {/* Actions & Feedback */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2.5">
            <Button
              size="sm"
              variant="outline"
              disabled={!inputKey.trim() || testState.loading}
              onClick={handleTestKey}
              isLoading={testState.loading}
              className="rounded-xl border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
            >
              Test Connection
            </Button>

            <Button
              size="sm"
              variant="solid"
              color="primary"
              disabled={!inputKey.trim() || saveState.loading}
              onClick={handleSaveKey}
              isLoading={saveState.loading}
              className="rounded-xl text-xs font-semibold"
            >
              Save Key
            </Button>
          </div>

          {testState.message ? (
            <span
              className={`text-xs font-medium ${
                testState.success
                  ? 'text-slate-700 dark:text-slate-300'
                  : 'text-red-500'
              }`}
            >
              {testState.success ? '✓ ' : '✕ '}
              {testState.message}
            </span>
          ) : saveState.message ? (
            <span
              className={`text-xs font-medium ${
                saveState.type === 'success'
                  ? 'text-slate-700 dark:text-slate-300'
                  : 'text-red-500'
              }`}
            >
              {saveState.type === 'success' ? '✓ ' : '✕ '}
              {saveState.message}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
