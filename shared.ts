import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";

export const VoiceHubSettingsSchema = z.object({
  groqApiKey: z.string().trim().min(1).optional(),
  language: z.enum(["sv", "en"]).default("sv"),
  sttModel: z.enum(["whisper-large-v3-turbo", "whisper-large-v3"]).default("whisper-large-v3-turbo"),
  ttsVoice: z.enum(["autumn", "diana", "hannah", "austin", "daniel", "troy"]).default("troy"),
});

export type VoiceHubSettings = z.output<typeof VoiceHubSettingsSchema>;

export const saveSettings = defineRpc({
  name: "voice-hub.save-settings",
  input: VoiceHubSettingsSchema,
  output: VoiceHubSettingsSchema,
});

export const testVoice = defineRpc({
  name: "voice-hub.test-voice",
  input: z.object({
    text: z.string().min(1).max(500),
    voice: z.string().optional(),
  }),
  output: z.object({ ok: z.boolean(), bytes: z.number().optional(), error: z.string().optional() }),
});

export const testStt = defineRpc({
  name: "voice-hub.test-stt",
  input: z.object({}),
  output: z.object({ ok: z.boolean(), error: z.string().optional() }),
});
