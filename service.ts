import { createServer, type Server } from 'node:http';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import type { VoiceHubSettings } from './shared';

const PROXY_PORT = 8789;
const GROQ_BASE = 'https://api.groq.com/openai/v1';

const VOICE_ALLOWLIST: Record<string, true> = {
  autumn: true,
  diana: true,
  hannah: true,
  austin: true,
  daniel: true,
  troy: true,
};

function normalizeVoice(input: string | undefined): string {
  const v = (input ?? 'troy').toLowerCase();
  return VOICE_ALLOWLIST[v] ? v : 'troy';
}

function daemonConfigPath(): string {
  return join(process.env.PASEO_HOME ?? join(homedir(), '.paseo'), 'config.json');
}

async function writeAtomic(path: string, data: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, data);
  await rename(tmp, path);
}

export interface VoiceHubService {
  ensureDaemonSpeechConfig(settings: VoiceHubSettings): Promise<{ changed: boolean }>;
  testVoice(
    settings: VoiceHubSettings,
    text: string,
    voice: string | undefined
  ): Promise<{ ok: boolean; bytes?: number; error?: string }>;
  startProxy(getSettings: () => Promise<VoiceHubSettings>): Promise<Server>;
}

export function createVoiceHubService(): VoiceHubService {
  return {
    async ensureDaemonSpeechConfig(settings: VoiceHubSettings): Promise<{ changed: boolean }> {
      const path = daemonConfigPath();
      let raw: string;
      try {
        raw = await readFile(path, 'utf8');
      } catch {
        return { changed: false };
      }
      let config: Record<string, unknown>;
      try {
        config = JSON.parse(raw);
      } catch {
        return { changed: false };
      }
      const original = JSON.stringify(config);
      const features = (config.features as Record<string, unknown> | undefined) ?? {};
      const providers = (config.providers as Record<string, unknown> | undefined) ?? {};
      const openai = (providers.openai as Record<string, unknown> | undefined) ?? {};
      const dictation = (features.dictation as Record<string, unknown> | undefined) ?? {};
      const voiceMode = (features.voiceMode as Record<string, unknown> | undefined) ?? {};
      const dictStt = (dictation.stt as Record<string, unknown> | undefined) ?? {};
      const voiceStt = (voiceMode.stt as Record<string, unknown> | undefined) ?? {};
      const voiceTts = (voiceMode.tts as Record<string, unknown> | undefined) ?? {};

      dictation.enabled = true;
      dictStt.provider = 'openai';
      dictStt.language = settings.language;
      dictStt.model = settings.sttModel;
      voiceMode.enabled = true;
      voiceStt.provider = 'openai';
      voiceStt.language = settings.language;
      voiceStt.model = settings.sttModel;
      voiceTts.provider = 'openai';
      voiceTts.voice = 'alloy';
      voiceTts.model = settings.ttsModel || 'tts-1';

      const stt = (openai.stt as Record<string, unknown> | undefined) ?? {};
      const tts = (openai.tts as Record<string, unknown> | undefined) ?? {};
      if (settings.groqApiKey) {
        openai.apiKey = settings.groqApiKey;
        stt.apiKey = settings.groqApiKey;
        tts.apiKey = settings.groqApiKey;
      }
      if (settings.provider === 'custom' && settings.baseUrl) {
        const base = settings.baseUrl.replace(/\/$/, '');
        stt.baseUrl = base;
        tts.baseUrl = base;
      } else {
        stt.baseUrl = 'https://api.groq.com/openai/v1';
        tts.baseUrl = `http://127.0.0.1:${PROXY_PORT}/v1`;
      }
      openai.stt = stt;
      openai.tts = tts;
      providers.openai = openai;
      dictation.stt = dictStt;
      voiceMode.stt = voiceStt;
      voiceMode.tts = voiceTts;
      features.dictation = dictation;
      features.voiceMode = voiceMode;
      config.features = features;
      config.providers = providers;

      const next = JSON.stringify(config, null, 2) + '\n';
      if (
        next === original + '\n' ||
        JSON.stringify(JSON.parse(next)) === JSON.stringify(JSON.parse(original))
      ) {
        return { changed: false };
      }
      await writeAtomic(path, next);
      return { changed: true };
    },

    async testVoice(
      settings: VoiceHubSettings,
      text: string,
      voice: string | undefined
    ): Promise<{ ok: boolean; bytes?: number; error?: string }> {
      const key = settings.groqApiKey ?? '';
      if (!key) return { ok: false, error: 'No API key saved — paste one first.' };
      const isGroq = settings.provider !== 'custom';
      const baseUrl = isGroq ? GROQ_BASE : (settings.baseUrl?.replace(/\/$/, '') ?? GROQ_BASE);
      const model = isGroq ? 'canopylabs/orpheus-v1-english' : settings.ttsModel || 'tts-1';
      const v = isGroq
        ? normalizeVoice(voice ?? settings.ttsVoice)
        : (voice ?? settings.ttsVoice ?? 'alloy');
      const res = await fetch(`${baseUrl}/audio/speech`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, input: text, voice: v, response_format: 'wav' }),
      });
      if (!res.ok) {
        const t = await res.text();
        return {
          ok: false,
          error: `${isGroq ? 'Groq' : 'Provider'} ${res.status}: ${t.slice(0, 300)}`,
        };
      }
      const buf = await res.arrayBuffer();
      return { ok: true, bytes: buf.byteLength };
    },

    async startProxy(getSettings: () => Promise<VoiceHubSettings>): Promise<Server> {
      const initial = await getSettings();
      const keyFromSettings = initial.groqApiKey;
      const server = createServer(async (req, res) => {
        if (req.method === 'GET' && req.url === '/health') {
          const cur = await getSettings();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              ok: true,
              proxy: 'orpheus',
              port: PROXY_PORT,
              hasKey: !!cur.groqApiKey,
              voice: cur.ttsVoice,
              provider: cur.provider,
            })
          );
          return;
        }
        if (req.method !== 'POST' || !req.url?.startsWith('/v1/audio/speech')) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: { message: 'Not found' } }));
          return;
        }
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const input: string = parsed.input || parsed.text || '';
            if (!input.trim()) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: { message: 'input is required' } }));
              return;
            }
            const curSettings = await getSettings();
            if (curSettings.provider === 'custom') {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  error: { message: 'Proxy only for Groq — custom uses direct baseUrl' },
                })
              );
              return;
            }
            const key = curSettings.groqApiKey || keyFromSettings || '';
            if (!key) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  error: { message: 'No Groq API key — open Voice Hub in Paseo to paste one.' },
                })
              );
              return;
            }
            const voice = normalizeVoice(parsed.voice || curSettings.ttsVoice);
            const groqRes = await fetch(`${GROQ_BASE}/audio/speech`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'canopylabs/orpheus-v1-english',
                input,
                voice,
                response_format: 'wav',
              }),
            });
            if (!groqRes.ok) {
              const t = await groqRes.text();
              res.writeHead(groqRes.status, { 'Content-Type': 'application/json' });
              res.end(t);
              return;
            }
            const wav = Buffer.from(await groqRes.arrayBuffer());
            res.writeHead(200, { 'Content-Type': 'audio/wav', 'Content-Length': wav.length });
            res.end(wav);
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { message: msg } }));
          }
        });
      });
      await new Promise<void>((resolve) => server.listen(PROXY_PORT, '127.0.0.1', () => resolve()));
      return server;
    },
  };
}
