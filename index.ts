import type { PluginContext } from "@getpaseo/plugin";
import { createServer, type Server } from "node:http";
import { mkdir, readFile, writeFile, chmod } from "node:fs/promises";
import { execFile } from "node:child_process";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { MainSurface } from "./main.client";
import { loadSettings, saveSettings, testVoice, testStt, type VoiceHubSettings } from "./shared";

function execFileAsync(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, (err) => (err ? reject(err) : resolve()));
  });
}
const PROXY_PORT = 8789;
const GROQ_BASE = "https://api.groq.com/openai/v1";
const PLUGIN_ID = "voice-hub";

function paseoHome(): string {
  return process.env.PASEO_HOME ?? join(homedir(), ".paseo");
}

function settingsPath(): string {
  return join(paseoHome(), "plugins", PLUGIN_ID, "settings.json");
}

function daemonConfigPath(): string {
  return join(paseoHome(), "config.json");
}

const DEFAULTS: VoiceHubSettings = {
  language: "sv",
  sttModel: "whisper-large-v3-turbo",
  ttsVoice: "troy",
};

async function readSettings(): Promise<VoiceHubSettings> {
  try {
    const raw = await readFile(settingsPath(), "utf8");
    const parsed = JSON.parse(raw);
    const withDefaults: VoiceHubSettings = { ...DEFAULTS, ...parsed };
    if (!withDefaults.groqApiKey || withDefaults.groqApiKey.trim() === "") {
      const envKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENAI_TTS_API_KEY || "";
      if (envKey) withDefaults.groqApiKey = envKey;
    }
    return withDefaults;
  } catch {
    const envKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENAI_TTS_API_KEY || "";
    if (envKey) return { ...DEFAULTS, groqApiKey: envKey };
    return { ...DEFAULTS };
  }
}

async function writeSettings(settings: VoiceHubSettings): Promise<VoiceHubSettings> {
  const path = settingsPath();
  await mkdir(dirname(path), { recursive: true });
  const toSave: Record<string, unknown> = { ...settings };
  if (!toSave.groqApiKey || (toSave.groqApiKey as string).trim() === "") delete toSave.groqApiKey;
  await writeFile(path, JSON.stringify(toSave, null, 2) + "\n", { mode: 0o600 });
  try {
    await chmod(path, 0o600);
  } catch {}
  return settings;
}

async function ensureDaemonSpeechConfig(settings: VoiceHubSettings): Promise<{ changed: boolean; needsRestart: boolean }> {
  const path = daemonConfigPath();
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
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
  dictStt.provider = "openai";
  dictStt.language = settings.language;
  if (settings.sttModel) dictStt.model = settings.sttModel;

  voiceMode.enabled = true;
  voiceStt.provider = "openai";
  voiceStt.language = settings.language;
  if (settings.sttModel) voiceStt.model = settings.sttModel;
  voiceTts.provider = "openai";
  voiceTts.voice = "alloy";
  voiceTts.model = "tts-1";

  const stt = (openai.stt as Record<string, unknown> | undefined) ?? {};
  const tts = (openai.tts as Record<string, unknown> | undefined) ?? {};
  if (settings.groqApiKey) {
    openai.apiKey = settings.groqApiKey;
    stt.apiKey = settings.groqApiKey;
    tts.apiKey = settings.groqApiKey;
  }
  stt.baseUrl = "https://api.groq.com/openai/v1";
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

  if (!config.pluginsEnabled) config.pluginsEnabled = true;

  const next = JSON.stringify(config, null, 2) + "\n";
  if (next === original + "\n" || JSON.stringify(JSON.parse(next)) === JSON.stringify(JSON.parse(original))) {
    return { changed: false, needsRestart: false };
  }
  await writeFile(path, next, { mode: 0o600 });
  try {
    await chmod(path, 0o600);
  } catch {}
  return { changed: true, needsRestart: true };
}

function mapVoice(inputVoice?: string): string {
  const allowed: Record<string, true> = { autumn: true, diana: true, hannah: true, austin: true, daniel: true, troy: true };
  const v = (inputVoice || "troy").toLowerCase();
  if (allowed[v]) return v;
  return "troy";
}

export default function contribute(plugin: PluginContext) {
  plugin.addSurface("main", MainSurface);
  plugin.addSidebarItem({ id: "voice-hub", title: "Voice Hub", icon: "Mic", surface: "main" });
  plugin.addCommandCenterItem({ id: "open-voice-hub", title: "Open Voice Hub", icon: "Mic", keywords: ["voice", "speech", "groq", "stt", "tts"], context: "global", onSelect({ openSurface }) { openSurface("main"); } });
  plugin.handle(loadSettings, async () => {
    const s = await readSettings();
    return s;
  });

  plugin.handle(saveSettings, async ({ groqApiKey, language, sttModel, ttsVoice }) => {
    const trimmed = groqApiKey?.trim();
    if (trimmed && !trimmed.startsWith("gsk_")) throw new Error("Groq key should start with gsk_ — get one at console.groq.com/keys");
    const next: VoiceHubSettings = { groqApiKey: trimmed || undefined, language, sttModel, ttsVoice };
    await writeSettings(next);
    console.log(`[voice-hub] saved settings language=${language} stt=${sttModel} tts=${ttsVoice} key=${trimmed ? "set" : "cleared"}`);

    const { changed, needsRestart } = await ensureDaemonSpeechConfig(next);
    if (changed) {
      console.log(`[voice-hub] daemon config updated, scheduling restart`);
      setTimeout(async () => {
        try {
          await execFileAsync("paseo", ["daemon", "restart"]);
        } catch {
          try {
            await execFileAsync("systemctl", ["--user", "restart", "paseo.service"]);
          } catch (e) {
            console.error(`[voice-hub] auto-restart failed: ${e}`);
          }
        }
      }, 1200);
    }
    return { ...next, _daemonChanged: changed, _needsRestart: needsRestart } as VoiceHubSettings & { _daemonChanged: boolean; _needsRestart: boolean };
  });

  plugin.handle(testVoice, async ({ text, voice }) => {
    const s = await readSettings();
    const key = s.groqApiKey || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENAI_TTS_API_KEY || "";
    if (!key) return { ok: false, error: "No Groq API key saved — paste one first." };
    const v = mapVoice(voice || s.ttsVoice);
    const res = await fetch(`${GROQ_BASE}/audio/speech`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "canopylabs/orpheus-v1-english", input: text, voice: v, response_format: "wav" }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, error: `Groq ${res.status}: ${t.slice(0, 300)}` };
    }
    const buf = await res.arrayBuffer();
    return { ok: true, bytes: buf.byteLength };
  });

  plugin.handle(testStt, async () => {
    const s = await readSettings();
    const key = s.groqApiKey || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENAI_STT_API_KEY || "";
    if (!key) return { ok: false, error: "No Groq API key saved." };
    const res = await fetch(`${GROQ_BASE}/models`, { headers: { Authorization: `Bearer ${key}` } });
    if (!res.ok) return { ok: false, error: `Key check failed ${res.status}` };
    const j = (await res.json()) as { data: { id: string }[] };
    const hasTurbo = j.data.some((m) => m.id === s.sttModel || m.id === "whisper-large-v3-turbo");
    if (!hasTurbo) return { ok: false, error: `Model ${s.sttModel} not visible` };
    return { ok: true };
  });

  let server: Server | null = null;

  const startProxy = async () => {
    const s = await readSettings();
    const keyFromSettings = s.groqApiKey;
    server = createServer(async (req, res) => {
      if (req.method === "GET" && req.url === "/health") {
        const cur = await readSettings();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, proxy: "orpheus", port: PROXY_PORT, hasKey: !!cur.groqApiKey, voice: cur.ttsVoice }));
        return;
      }
      if (req.method !== "POST" || !req.url?.startsWith("/v1/audio/speech")) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: { message: "Not found" } }));
        return;
      }
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", async () => {
        try {
          const parsed = JSON.parse(body || "{}");
          const input: string = parsed.input || parsed.text || "";
          if (!input.trim()) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: { message: "input is required" } }));
            return;
          }
          const curSettings = await readSettings();
          const key = curSettings.groqApiKey || process.env.GROQ_API_KEY || process.env.OPENAI_TTS_API_KEY || process.env.OPENAI_API_KEY || keyFromSettings || "";
          if (!key) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: { message: "No Groq API key — open Voice Hub in Paseo to paste one." } }));
            return;
          }
          const voice = mapVoice(parsed.voice || curSettings.ttsVoice);
          const groqRes = await fetch(`${GROQ_BASE}/audio/speech`, {
            method: "POST",
            headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "canopylabs/orpheus-v1-english", input, voice, response_format: "wav" }),
          });
          if (!groqRes.ok) {
            const t = await groqRes.text();
            console.error(`[voice-hub] Groq ${groqRes.status}: ${t.slice(0, 400)}`);
            res.writeHead(groqRes.status, { "Content-Type": "application/json" });
            res.end(t);
            return;
          }
          const wav = Buffer.from(await groqRes.arrayBuffer());
          console.log(`[voice-hub] ${input.slice(0, 50)} -> ${wav.length}b voice=${voice}`);
          res.writeHead(200, { "Content-Type": "audio/wav", "Content-Length": wav.length });
          res.end(wav);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(`[voice-hub] proxy error: ${msg}`);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: { message: msg } }));
        }
      });
    });
    server.listen(PROXY_PORT, "127.0.0.1", () => {
      console.log(`[voice-hub] proxy listening http://127.0.0.1:${PROXY_PORT}/v1/audio/speech -> Groq orpheus (hasKey=${!!s.groqApiKey})`);
    });
  };

  void startProxy();

  return async () => {
    if (server) await new Promise<void>((r) => server!.close(() => r()));
    console.log("[voice-hub] stopped");
  };
}
