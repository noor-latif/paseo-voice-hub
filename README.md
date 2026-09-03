# paseo-voice-hub

Friendly hub for better voices in Paseo — no terminal, no AI models on your VPS. Beginner-friendly.

> **You don't need to edit any config files.** Open Paseo, paste a free Groq key, tap **Save and enable** — your voice button works.

![Voice Hub wizard: Groq key, language Swedish, turbo, voice troy, Test voice](docs/screenshot.png)

## What you get

| Feature           | What it does                                                               | Why it's better                                                                        |
| ----------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Dictation STT** | Groq `whisper-large-v3-turbo` on LPU                                       | <250ms, ~9× cheaper than OpenAI; turbo is 8× faster, accurate mode for precision       |
| **Voice TTS**     | Groq `canopylabs/orpheus-v1-english` via tiny local proxy `127.0.0.1:8789` | Zero local RAM — perfect for 7.8 Gi VPS — survives `paseo update`                        |

Mixing `sv + en` tech? Keep `Svenska`, Turbo's ~1% extra WER on `åäö` is fixed by your coding agent.

## Install (30 seconds, no terminal env editing)

1. **Get a free Groq key** → https://console.groq.com/keys → Create API Key (starts `gsk_`) — no credit card needed for free tier.

2. **Add the plugin**
   ```bash
   paseo plugin add noor-latif/paseo-voice-hub
   ```
   Fresh desktop Paseo has no password — just run it. On a headless VPS where `paseo` asks for a password:
   ```bash
   PASEO_PASSWORD=$(grep PASEO_PASSWORD ~/.config/paseo.env | cut -d= -f2) paseo plugin add noor-latif/paseo-voice-hub
   ```
3. **Open Paseo app → Voice Hub** (sidebar) → paste `gsk_...` → pick `Svenska`, `Turbo`, `troy` → **Save and enable** → **Test voice**.
   The plugin saves to `~/.paseo/plugins/voice-hub/settings.json` (600 perms), **auto-writes your daemon's speech config** (`features.dictation` + `features.voiceMode` + `providers.openai` → Groq `https://api.groq.com/openai/v1` + proxy `http://127.0.0.1:8789`) and **restarts the daemon** — voice button ready in ~5s. No `~/.config/paseo.env` `OPENAI_*` editing, no manual `systemctl restart`.

That's it. Fresh `paseo daemon` with no speech config → one paste and you're done. The proxy starts on `8789` automatically (`curl http://127.0.0.1:8789/health` → `hasKey:true`).

## How it works (you don't need to know)

- Paseo only knows `openai` + `local` speech. This plugin pretends to be OpenAI `POST /v1/audio/speech` on `127.0.0.1:8789`, forwards to `https://api.groq.com/openai/v1/audio/speech` with `orpheus/troy/wav`.
- STT goes direct to `https://api.groq.com/openai/v1/audio/transcriptions` with `whisper-large-v3-turbo` + `language: sv`.
- Orpheus voices: `autumn, diana, hannah, austin, daniel, troy` — English-only, so we keep Swedish via STT `sv` forced, TTS English.

```
Paseo (tts-1/alloy) -> Voice Hub proxy 8789 -> Groq orpheus
Paseo (whisper sv)  -> Groq whisper-turbo (direct)
```

No local `kokoro`/`paraformer` models, no 1.5 Gi RAM spike.

## Troubleshoot

- **Test voice says `No Groq API key`** → paste `gsk_...` and Save again.
- **Key check fails `401`** → copy the whole `gsk_` (no spaces), new key at console.groq.com.
- **Voice button still grey** → in Paseo `paseo plugin ls` should show `voice-hub running yes`, `curl http://127.0.0.1:8789/health` should show `hasKey:true`.
- **Headless: `Password required`** → prefix with `PASEO_PASSWORD=$(grep ... )` as above, or add `source ~/.config/paseo.env` to `~/.bashrc`.

## Develop

```bash
npm install
npm run typecheck
paseo plugin reload voice-hub
paseo plugin logs voice-hub
```

Requires Paseo >=0.5.0. Plugin is trusted, unsandboxed — it can read `~/.paseo/plugins/voice-hub/settings.json` and proxy to Groq.

## License

MIT
