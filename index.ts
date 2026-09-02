import type { PluginContext } from '@getpaseo/plugin';
import { createServer, type Server } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { MainSurface } from './main.client';
import { saveSettings, testVoice, type VoiceHubSettings } from './shared';

const PROXY_PORT = 8789;
const GROQ_BASE = 'https://api.groq.com/openai/v1';
const PLUGIN_ID = 'voice-hub';

const DEFAULTS: VoiceHubSettings = {
  language: 'sv',
  sttModel: 'whisper-large-v3-turbo',
  ttsModel: 'tts-1',
  ttsVoice: 'troy',
};

async function readSettings(): Promise<VoiceHubSettings> {
  try {
    const raw = await readFile(
      join(
        process.env.PASEO_HOME ?? join(homedir(), '.paseo'),
        'plugins',
        PLUGIN_ID,
        'settings.json'
      ),
      'utf8'
    );
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

async function writeSettings(settings: VoiceHubSettings): Promise<VoiceHubSettings> {
  const path = join(
    process.env.PASEO_HOME ?? join(homedir(), '.paseo'),
    'plugins',
    PLUGIN_ID,
    'settings.json'
  );
  await mkdir(dirname(path), { recursive: true });
  const toSave: Record<string, unknown> = { ...settings };
  if (!toSave.groqApiKey || (toSave.groqApiKey as string).trim() === '') delete toSave.groqApiKey;
  await writeFile(path, JSON.stringify(toSave, null, 2) + '\n');
  return settings;
}

async function ensureDaemonSpeechConfig(
  settings: VoiceHubSettings
): Promise<{ changed: boolean; needsRestart: boolean }> {
  const path = join(process.env.PASEO_HOME ?? join(homedir(), '.paseo'), 'config.json');
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch {
    return { changed: false, needsRestart: false };
  }
  let config: Record<string, unknown>;
  try {
    config = JSON.parse(raw);
  } catch {
    return { changed: false, needsRestart: false };
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
  stt.baseUrl = 'https://api.groq.com/openai/v1';
  tts.baseUrl = `http://127.0.0.1:${PROXY_PORT}/v1`;
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
  )
    return { changed: false, needsRestart: false };
  await writeFile(path, next);
  return { changed: true, needsRestart: true };
}

export default function contribute(plugin: PluginContext) {
  plugin.addSurface('main', MainSurface);
  plugin.addSidebarItem({ id: 'voice-hub', title: 'Voice Hub', icon: 'Mic', surface: 'main' });
  plugin.addCommandCenterItem({
    id: 'open-voice-hub',
    title: 'Open Voice Hub',
    icon: 'Mic',
    keywords: ['voice', 'speech', 'groq', 'stt', 'tts'],
    context: 'global',
    onSelect({ openSurface }) {
      openSurface('main');
    },
  });
  plugin.handle(saveSettings, async ({ groqApiKey, language, sttModel, ttsModel, ttsVoice }) => {
    const trimmed = groqApiKey?.trim();
    if (trimmed && !trimmed.startsWith('gsk_'))
      throw new Error('Groq key should start with gsk_ — get one at console.groq.com/keys');
    const next: VoiceHubSettings = {
      groqApiKey: trimmed || undefined,
      language,
      sttModel,
      ttsModel,
      ttsVoice,
    };
    await writeSettings(next);
    const { changed, needsRestart } = await ensureDaemonSpeechConfig(next);
    return { ...next, _daemonChanged: changed, _needsRestart: needsRestart } as VoiceHubSettings & {
      _daemonChanged: boolean;
      _needsRestart: boolean;
    };
  });

  plugin.handle(testVoice, async ({ text, voice }) => {
    const s = await readSettings();
    const key = s.groqApiKey || '';
    if (!key) return { ok: false, error: 'No Groq API key saved — paste one first.' };
    const allowed: Record<string, true> = {
      autumn: true,
      diana: true,
      hannah: true,
      austin: true,
      daniel: true,
      troy: true,
    };
    const v = allowed[(voice || s.ttsVoice || 'troy').toLowerCase()]
      ? (voice || s.ttsVoice || 'troy').toLowerCase()
      : 'troy';
    const res = await fetch(`${GROQ_BASE}/audio/speech`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'canopylabs/orpheus-v1-english',
        input: text,
        voice: v,
        response_format: 'wav',
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, error: `Groq ${res.status}: ${t.slice(0, 300)}` };
    }
    const buf = await res.arrayBuffer();
    return { ok: true, bytes: buf.byteLength };
  });

  let server: Server | null = null;

  const startProxy = async () => {
    const s = await readSettings();
    const keyFromSettings = s.groqApiKey;
    server = createServer(async (req, res) => {
      if (req.method === 'GET' && req.url === '/health') {
        const cur = await readSettings();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: true,
            proxy: 'orpheus',
            port: PROXY_PORT,
            hasKey: !!cur.groqApiKey,
            voice: cur.ttsVoice,
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
          const curSettings = await readSettings();
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
          const allowed: Record<string, true> = {
            autumn: true,
            diana: true,
            hannah: true,
            austin: true,
            daniel: true,
            troy: true,
          };
          const voice = allowed[(parsed.voice || curSettings.ttsVoice || 'troy').toLowerCase()]
            ? (parsed.voice || curSettings.ttsVoice || 'troy').toLowerCase()
            : 'troy';
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
    server.listen(PROXY_PORT, '127.0.0.1', () => undefined);
  };

  void startProxy();

  return async () => {
    if (server) await new Promise<void>((r) => server!.close(() => r()));
  };
}
