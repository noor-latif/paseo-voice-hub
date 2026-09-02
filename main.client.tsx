import type { PluginSurfaceProps } from "@getpaseo/plugin";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { usePaseo } from "@getpaseo/plugin";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loadSettings, saveSettings, testVoice, testStt } from "./shared";

export function MainSurface({ theme }: PluginSurfaceProps) {
  const { colors } = theme;
  const paseo = usePaseo();
  const qc = useQueryClient();
  const [groqApiKey, setGroqApiKey] = useState("");
  const [language, setLanguage] = useState<"sv" | "en">("sv");
  const [sttModel, setSttModel] = useState<"whisper-large-v3-turbo" | "whisper-large-v3">("whisper-large-v3-turbo");
  const [ttsVoice, setTtsVoice] = useState<"autumn" | "diana" | "hannah" | "austin" | "daniel" | "troy">("troy");
  const [testText, setTestText] = useState("Hej! Det här är Voice Hub — din röst för kod, på svenska.");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: ["voice-hub", "settings"],
    queryFn: () => paseo.rpc(loadSettings, {}),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data) {
      if (data.groqApiKey !== undefined) setGroqApiKey(data.groqApiKey || "");
      setLanguage(data.language);
      setSttModel(data.sttModel);
      setTtsVoice(data.ttsVoice);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: (s: { groqApiKey?: string; language: "sv" | "en"; sttModel: "whisper-large-v3-turbo" | "whisper-large-v3"; ttsVoice: "autumn" | "diana" | "hannah" | "austin" | "daniel" | "troy" }) => paseo.rpc(saveSettings, s),
    onSuccess: (r: unknown) => {
      qc.invalidateQueries({ queryKey: ["voice-hub", "settings"] });
      const changed = (r as { _daemonChanged?: boolean })._daemonChanged;
      setMsg({ text: changed ? "Saved! Restarting daemon… ready in 5s." : "Saved!", ok: true });
    },
    onError: (e: unknown) => setMsg({ text: e instanceof Error ? e.message : String(e), ok: false }),
  });

  const voice = useMutation({
    mutationFn: (v: { text: string; voice: string }) => paseo.rpc(testVoice, v),
    onSuccess: (r: { ok: boolean; bytes?: number; error?: string }) => setMsg({ text: r.ok ? `Voice OK ${r.bytes}b` : r.error || "Voice failed", ok: !!r.ok }),
    onError: (e: unknown) => setMsg({ text: e instanceof Error ? e.message : String(e), ok: false }),
  });

  const stt = useMutation({
    mutationFn: () => paseo.rpc(testStt, {}),
    onSuccess: (r: { ok: boolean; error?: string }) => setMsg({ text: r.ok ? "STT key OK" : r.error || "STT failed", ok: !!r.ok }),
    onError: (e: unknown) => setMsg({ text: e instanceof Error ? e.message : String(e), ok: false }),
  });

  const chip = (active: boolean) => ({ padding: 8, borderRadius: 20, borderWidth: 1, borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accent : colors.surface0 });
  const chipT = (active: boolean) => ({ color: active ? colors.accentForeground : colors.foreground, fontSize: 13 });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface0, padding: 16, gap: 12 } as never}>
      {isFetching && !data && <Text style={{ color: colors.foregroundMuted }}>Syncing…</Text>}
      <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "700" }}>Voice Hub</Text>
      <Text style={{ color: colors.foregroundMuted }}>Paste free Groq key (console.groq.com/keys, gsk_…), Save — voice button works. No terminal.</Text>

      <Text style={{ color: colors.foreground, fontWeight: "600" }}>Groq API key</Text>
      <TextInput value={groqApiKey} onChangeText={setGroqApiKey} placeholder="gsk_..." placeholderTextColor={colors.foregroundMuted} secureTextEntry style={{ backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.foreground } as never} autoCapitalize="none" />
      <View style={{ flexDirection: "row", gap: 8 }}><Pressable onPress={() => stt.mutate()} style={{ backgroundColor: colors.surface2, padding: 10, borderRadius: 8 }}><Text style={{ color: colors.foreground }}>{stt.isPending ? "..." : "Check key"}</Text></Pressable></View>

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

      <Pressable onPress={() => save.mutate({ groqApiKey, language, sttModel, ttsVoice })} style={{ backgroundColor: colors.accent, padding: 12, borderRadius: 10, alignItems: "center" }}><Text style={{ color: colors.accentForeground, fontWeight: "600" }}>{save.isPending ? "Saving…" : "Save and enable"}</Text></Pressable>

      <TextInput value={testText} onChangeText={setTestText} placeholder="Text to speak" multiline style={{ backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.foreground, minHeight: 60 } as never} />
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable onPress={() => voice.mutate({ text: testText, voice: ttsVoice })} style={{ backgroundColor: colors.accent, padding: 10, borderRadius: 8 }}><Text style={{ color: colors.accentForeground }}>{voice.isPending ? "..." : "Test voice"}</Text></Pressable>
        <Pressable onPress={() => voice.mutate({ text: "Jag vill refaktorera functionen", voice: ttsVoice })} style={{ backgroundColor: colors.surface2, padding: 10, borderRadius: 8 }}><Text style={{ color: colors.foreground }}>Test sv+en</Text></Pressable>
      </View>

      {msg && <View style={{ padding: 10, borderRadius: 8, backgroundColor: msg.ok ? "#0f5132" : "#842029" }}><Text style={{ color: "white" }}>{msg.text}</Text></View>}
    </ScrollView>
  );
}
