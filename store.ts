import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { VoiceHubSettingsSchema, type VoiceHubSettings } from './shared';

const PLUGIN_ID = 'voice-hub';

const DEFAULTS: VoiceHubSettings = {
  language: 'sv',
  sttModel: 'whisper-large-v3-turbo',
  ttsModel: 'tts-1',
  ttsVoice: 'troy',
};

function paseoHome(): string {
  return process.env.PASEO_HOME ?? join(homedir(), '.paseo');
}

function filePath(): string {
  return join(paseoHome(), 'plugins', PLUGIN_ID, 'settings.json');
}

export interface VoiceHubStore {
  get(): Promise<VoiceHubSettings>;
  set(next: VoiceHubSettings): Promise<VoiceHubSettings>;
}

export function createVoiceHubStore(): VoiceHubStore {
  const mutations = new Map<string, Promise<unknown>>();

  async function serialize<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = mutations.get(key) ?? Promise.resolve();
    const next = prev.catch(() => undefined).then(fn);
    mutations.set(key, next);
    try {
      return (await next) as T;
    } finally {
      if (mutations.get(key) === next) mutations.delete(key);
    }
  }

  async function writeAtomic(path: string, data: string): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    const tmp = `${path}.tmp-${process.pid}-${Date.now()}`;
    await writeFile(tmp, data);
    await rename(tmp, path);
  }

  return {
    async get(): Promise<VoiceHubSettings> {
      const path = filePath();
      try {
        const raw = await readFile(path, 'utf8');
        const parsed = VoiceHubSettingsSchema.parse(JSON.parse(raw));
        return { ...DEFAULTS, ...parsed };
      } catch {
        return { ...DEFAULTS };
      }
    },

    async set(next: VoiceHubSettings): Promise<VoiceHubSettings> {
      return serialize(filePath(), async () => {
        const validated = VoiceHubSettingsSchema.parse(next);
        const toSave: Record<string, unknown> = { ...validated };
        if (!toSave.groqApiKey || (toSave.groqApiKey as string).trim() === '')
          delete toSave.groqApiKey;
        const path = filePath();
        await writeAtomic(path, JSON.stringify(toSave, null, 2) + '\n');
        return validated;
      });
    },
  };
}
