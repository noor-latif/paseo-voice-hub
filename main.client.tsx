import type { PluginSurfaceProps } from "@getpaseo/plugin";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRpc } from "@getpaseo/plugin";
import { saveSettings, testVoice } from "./shared";

export function MainSurface({ theme }: PluginSurfaceProps) {
  const { colors } = theme;
  const save = useRpc(saveSettings);
  const test = useRpc(testVoice);
  const [groqApiKey, setGroqApiKey] = useState("");
  const [language, setLanguage] = useState<"sv" | "en">("sv");
  const [sttModel, setSttModel] = useState<"whisper-large-v3-turbo" | "whisper-large-v3">("whisper-large-v3-turbo");
  const [ttsModel, setTtsModel] = useState<"tts-1" | "tts-1-hd">("tts-1");
  const [ttsVoice, setTtsVoice] = useState<"autumn" | "diana" | "hannah" | "austin" | "daniel" | "troy">("troy");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface0, padding: 16, gap: 12 } as never}>
      <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "700" }}>Voice Hub</Text>
      <Text style={{ color: colors.foregroundMuted }}>Paste free Groq key (console.groq.com/keys, gsk_…), Save — voice button works.</Text>

      <Text style={{ color: colors.foreground, fontWeight: "600" }}>Groq API key</Text>
      <TextInput value={groqApiKey} onChangeText={setGroqApiKey} placeholder="gsk_..." placeholderTextColor={colors.foregroundMuted} secureTextEntry style={{ backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.foreground } as never} autoCapitalize="none" />

      <Text style={{ color: colors.foreground, fontWeight: "600" }}>Language</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>{(["sv", "en"] as const).map((v) => (
        <Pressable key={v} onPress={() => setLanguage(v)} style={{ padding: 8, borderRadius: 20, borderWidth: 1, borderColor: language === v ? colors.accent : colors.border, backgroundColor: language === v ? colors.accent : colors.surface0 }}><Text style={{ color: language === v ? colors.accentForeground : colors.foreground, fontSize: 13 }}>{v}</Text></Pressable>
      ))}</View>

      <Text style={{ color: colors.foreground, fontWeight: "600" }}>STT model</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>{(["whisper-large-v3-turbo", "whisper-large-v3"] as const).map((v) => (
        <Pressable key={v} onPress={() => setSttModel(v)} style={{ padding: 8, borderRadius: 20, borderWidth: 1, borderColor: sttModel === v ? colors.accent : colors.border, backgroundColor: sttModel === v ? colors.accent : colors.surface0 }}><Text style={{ color: sttModel === v ? colors.accentForeground : colors.foreground, fontSize: 13 }}>{v === "whisper-large-v3-turbo" ? "Turbo" : "Accurate"}</Text></Pressable>
      ))}</View>

      <Text style={{ color: colors.foreground, fontWeight: "600" }}>TTS model</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>{(["tts-1", "tts-1-hd"] as const).map((v) => (
        <Pressable key={v} onPress={() => setTtsModel(v)} style={{ padding: 8, borderRadius: 20, borderWidth: 1, borderColor: ttsModel === v ? colors.accent : colors.border, backgroundColor: ttsModel === v ? colors.accent : colors.surface0 }}><Text style={{ color: ttsModel === v ? colors.accentForeground : colors.foreground, fontSize: 13 }}>{v}</Text></Pressable>
      ))}</View>

      <Text style={{ color: colors.foreground, fontWeight: "600" }}>Voice</Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" as never }}>{(["troy", "hannah", "autumn", "diana", "austin", "daniel"] as const).map((v) => (
        <Pressable key={v} onPress={() => setTtsVoice(v)} style={{ padding: 8, borderRadius: 20, borderWidth: 1, borderColor: ttsVoice === v ? colors.accent : colors.border, backgroundColor: ttsVoice === v ? colors.accent : colors.surface0 }}><Text style={{ color: ttsVoice === v ? colors.accentForeground : colors.foreground, fontSize: 13 }}>{v}</Text></Pressable>
      ))}</View>

      <Pressable onPress={async () => { try { const r = await save({ groqApiKey, language, sttModel, ttsModel, ttsVoice }) as unknown as { _daemonChanged?: boolean }; setMsg({ text: r._daemonChanged ? "Saved! Restarting daemon… ready in 5s." : "Saved!", ok: true }); } catch (e) { setMsg({ text: e instanceof Error ? e.message : String(e), ok: false }); } }} style={{ backgroundColor: colors.accent, padding: 12, borderRadius: 10, alignItems: "center" }}><Text style={{ color: colors.accentForeground, fontWeight: "600" }}>Save and enable</Text></Pressable>

      <Pressable onPress={async () => { try { const r = await test({ text: "Hej! Det här är Voice Hub — din röst för kod, på svenska.", voice: ttsVoice }) as { ok: boolean; bytes?: number; error?: string }; setMsg({ text: r.ok ? `Voice OK ${r.bytes}b` : r.error || "Voice failed", ok: !!r.ok }); } catch (e) { setMsg({ text: e instanceof Error ? e.message : String(e), ok: false }); } }} style={{ backgroundColor: colors.surface1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: "center" }}><Text style={{ color: colors.foreground }}>Test voice</Text></Pressable>

      {msg && <View style={{ padding: 10, borderRadius: 8, backgroundColor: msg.ok ? "#0f5132" : "#842029" }}><Text style={{ color: "white" }}>{msg.text}</Text></View>}
    </ScrollView>
  );
}
