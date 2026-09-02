import { defineRpc } from '@getpaseo/plugin';
import { z } from 'zod';

export const VoiceHubSettingsSchema = z.object({
  groqApiKey: z.string().trim().min(1).optional(),
  provider: z.enum(['groq', 'custom']).default('groq'),
  baseUrl: z.string().trim().optional(),
  language: z.string().trim().min(2).max(10).default('sv'),
  sttModel: z.string().trim().min(1).default('whisper-large-v3-turbo'),
  ttsModel: z.string().trim().min(1).default('tts-1'),
  ttsVoice: z.string().trim().min(1).default('troy'),
});

export type VoiceHubSettings = z.output<typeof VoiceHubSettingsSchema>;

export const saveSettings = defineRpc({
  name: 'voice-hub.save-settings',
  input: VoiceHubSettingsSchema,
  output: VoiceHubSettingsSchema,
});

export const testVoice = defineRpc({
  name: 'voice-hub.test-voice',
  input: z.object({
    text: z.string().min(1).max(500),
    voice: z.string().optional(),
  }),
  output: z.object({ ok: z.boolean(), bytes: z.number().optional(), error: z.string().optional() }),
});
