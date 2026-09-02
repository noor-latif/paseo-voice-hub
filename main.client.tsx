import type { PluginSurfaceProps } from "@getpaseo/plugin";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { usePaseo } from "@getpaseo/plugin";
import { saveSettings, testVoice, testStt } from "./shared";

export function MainSurface({ theme }: PluginSurfaceProps) {
  const { colors } = theme;
  const paseo = usePaseo();
  const [groqApiKey, setGroqApiKey] = useState("");
  const [language, setLanguage] = useState<"sv" | "en">("sv");
  const [sttModel, setSttModel] = useState<"whisper-large-v3-turbo" | "whisper-large-v3">("whisper-large-v3-turbo");
  const [ttsVoice, setTtsVoice] = useState<"autumn" | "diana" | "hannah" | "austin" | "daniel" | "troy">("troy");
  const [testText, setTestText] = useState("Hej! Det här är Voice Hub — din röst för kod, på svenska.");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const chip = (active: boolean) => ({ padding: 8, borderRadius: 20, borderWidth: 1, borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accent : colors.surface0 });
  const chipT = (active: boolean) => ({ color: active ? colors.accentForeground : colors.foreground, fontSize: 13 });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface0, padding: 16, gap: 12 } as never}>
      <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "700" }}>Voice Hub</Text>
      <Text style={{ color: colors.foregroundMuted }}>Paste free Groq key (console.groq.com/keys, gsk_…), Save — voice button works. No terminal.</Text>

      <Text style={{ color: colors.foreground, fontWeight: "600" }}>Groq API key</Text>
      <TextInput value={groqApiKey} onChangeText={setGroqApiKey} placeholder="gsk_..." placeholderTextColor={colors.foregroundMuted} secureTextEntry style={{ backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.foreground } as never} autoCapitalize="none" />
      <View style={{ flexDirection: "row", gap: 8 }}><Pressable onPress={async () => { try { const r = await paseo.rpc(testStt, {}) as { ok: boolean; error?: string }; setMsg({ text: r.ok ? "STT key OK" : r.error || "STT failed", ok: !!r.ok }); } catch (e) { setMsg({ text: e instanceof Error ? e.message : String(e), ok: false }); } }} style={{ backgroundColor: colors.surface2, padding: 10, borderRadius: 8 }}><Text style={{ color: colors.foreground }}>Check key</Text></Pressable></View>

      <Text style={{ color: colors.foreground, fontWeight: "600" }}>Language</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>{(["sv", "en"] as const).map((v) => (
        <Pressable key={v} onPress={() => setLanguage(v)} style={chip(language === v)}><Text style={chipT(language === v)}>{v}</Text></Pressable>
      ))}</View>

      <Text style={{ color: colors.foreground, fontWeight: "600" }}>STT</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>{(["whisper-large-v3-turbo", "whisper-large-v3"] as const).map((v) => (
        <Pressable key={v} onPress={() => setSttModel(v)} style={chip(sttModel === v)}><Text style={chipT(sttModel === v)}>{v === "whisper-large-v3-turbo" ? "Turbo" : "Accurate"}</Text></Pressable>
      ))}</View>

      <Text style={{ color: colors.foreground, fontWeight: "600" }}>Voice</Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" as never }}>{(["troy", "hannah", "autumn", "diana", "austin", "daniel"] as const).map((v) => (
        <Pressable key={v} onPress={() => setTtsVoice(v)} style={chip(ttsVoice === v)}><Text style={chipT(ttsVoice === v)}>{v}</Text></Pressable>
      ))}</View>

      <Pressable onPress={async () => { try { const r = await paseo.rpc(saveSettings, { groqApiKey, language, sttModel, ttsVoice }) as unknown as { _daemonChanged?: boolean }; setMsg({ text: r._daemonChanged ? "Saved! Restarting daemon… ready in 5s." : "Saved!", ok: true }); } catch (e) { setMsg({ text: e instanceof Error ? e.message : String(e), ok: false }); } }} style={{ backgroundColor: colors.accent, padding: 12, borderRadius: 10, alignItems: "center" }}><Text style={{ color: colors.accentForeground, fontWeight: "600" }}>Save and enable</Text></Pressable>

      <TextInput value={testText} onChangeText={setTestText} placeholder="Text to speak" multiline style={{ backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.foreground, minHeight: 60 } as never} />
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable onPress={async () => { try { const r = await paseo.rpc(testVoice, { text: testText, voice: ttsVoice }) as { ok: boolean; bytes?: number; error?: string }; setMsg({ text: r.ok ? `Voice OK ${r.bytes}b` : r.error || "Voice failed", ok: !!r.ok }); } catch (e) { setMsg({ text: e instanceof Error ? e.message : String(e), ok: false }); } }} style={{ backgroundColor: colors.accent, padding: 10, borderRadius: 8 }}><Text style={{ color: colors.accentForeground }}>Test voice</Text></Pressable>
        <Pressable onPress={async () => { try { const r = await paseo.rpc(testVoice, { text: "Jag vill refaktorera functionen", voice: ttsVoice }) as { ok: boolean; bytes?: number; error?: string }; setMsg({ text: r.ok ? `Voice OK ${r.bytes}b` : r.error || "Voice failed", ok: !!r.ok }); } catch (e) { setMsg({ text: e instanceof Error ? e.message : String(e), ok: false }); } }} style={{ backgroundColor: colors.surface2, padding: 10, borderRadius: 8 }}><Text style={{ color: colors.foreground }}>Test sv+en</Text></Pressable>
      </View>

      {msg && <View style={{ padding: 10, borderRadius: 8, backgroundColor: msg.ok ? "#0f5132" : "#842029" }}><Text style={{ color: "white" }}>{msg.text}</Text></View>}
    </ScrollView>
  );
}
