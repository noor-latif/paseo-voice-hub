# paseo-voice-hub

Friendly hub for better voices in Paseo — adds Groq-hosted speech without touching Paseo core, so it survives `paseo update`.

| Feature | Provider | Model | Why |
|---|---|---|---|
| Dictation STT (`sv`) | Groq (OpenAI compat) | `whisper-large-v3-turbo` | Ultra-fast LPU, `sv` forced via `PASEO_DICTATION_LANGUAGE`, <250ms, ~9× cheaper than OpenAI |
| Voice TTS | Groq via local proxy | `canopylabs/orpheus-v1-english` (voice `troy`) | Proxy at `127.0.0.1:8789` translates `tts-1/alloy/pcm` → `orpheus/troy/wav`, zero local RAM on VPS |

## How it works

Paseo only knows `openai` + `local` speech providers. This plugin runs a tiny HTTP proxy (`index.ts`) that pretends to be OpenAI `POST /v1/audio/speech` on `127.0.0.1:8789`, forwards to `https://api.groq.com/openai/v1/audio/speech`, and returns `wav`. No core patches.

```
Paseo (tts-1/alloy) -> http://127.0.0.1:8789/v1/audio/speech -> Groq (orpheus/troy/wav) -> Paseo
Paseo (whisper)     -> https://api.groq.com/openai/v1/audio/transcriptions (direct, no proxy)
```

Mixing `sv+en` tech talk: keep `PASEO_DICTATION_LANGUAGE=sv`, LLM fills `turbo`'s ~1% extra WER on `åäö`/compounds.

## Install

```bash
paseo plugin add noor-latif/paseo-voice-hub
# env in ~/.config/paseo.env (chmod 600):
# OPENAI_API_KEY / GROQ_API_KEY=gsk_...
# OPENAI_STT_BASE_URL=https://api.groq.com/openai/v1
# OPENAI_TTS_BASE_URL=http://127.0.0.1:8789/v1
# STT_MODEL=whisper-large-v3-turbo
# TTS_MODEL=tts-1
# TTS_VOICE=alloy
# PASEO_DICTATION_ENABLED=true
# PASEO_DICTATION_STT_PROVIDER=openai
# PASEO_DICTATION_LANGUAGE=sv
# PASEO_VOICE_MODE_ENABLED=true
# PASEO_VOICE_TTS_PROVIDER=openai
# PASEO_VOICE_STT_PROVIDER=openai
systemctl --user restart paseo.service
curl http://127.0.0.1:8789/health
# {"ok":true,"proxy":"orpheus","port":8789}
```

Orpheus voices on Groq: `autumn, diana, hannah, austin, daniel, troy` — default `troy`. Change `TTS_VOICE` in env, reload.

## Develop

```bash
npm install
npm run typecheck
paseo plugin reload voice-hub
paseo plugin logs voice-hub
```

Requires Paseo >=0.5.0, `pluginsEnabled:true` in `~/.paseo/config.json`.

## License

MIT
