import type { PluginSurfaceProps } from "@getpaseo/plugin";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from "react-native";
import { usePaseo } from "@getpaseo/plugin";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loadSettings, saveSettings, testVoice, testStt } from "./shared";

type Settings = {
  groqApiKey?: string;
  language: "sv" | "en";
  sttModel: "whisper-large-v3-turbo" | "whisper-large-v3";
  ttsVoice: "autumn" | "diana" | "hannah" | "austin" | "daniel" | "troy";
};

export function MainSurface({ theme, layout }: PluginSurfaceProps) {
  const { colors } = theme;
  const compact = layout.compact;
  const paseo = usePaseo();
  const qc = useQueryClient();

  const [groqApiKey, setGroqApiKey] = useState("");
  const [language, setLanguage] = useState<Settings["language"]>("sv");
  const [sttModel, setSttModel] = useState<Settings["sttModel"]>("whisper-large-v3-turbo");
  const [ttsVoice, setTtsVoice] = useState<Settings["ttsVoice"]>("troy");
  const [testText, setTestText] = useState("Hej! Det här är Voice Hub — din röst för kod, på svenska.");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const styles = useMemo(
    () => ({
      screen: { flex: 1, backgroundColor: colors.surface0 },
      scroll: { padding: compact ? 16 : 24, gap: 16 },
      card: { backgroundColor: colors.surface1, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 12 },
      label: { color: colors.foreground, fontWeight: "600" as const, fontSize: 14 },
      muted: { color: colors.foregroundMuted, fontSize: 13, lineHeight: 18 },
      input: { backgroundColor: colors.surface0, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14 },
      row: { flexDirection: "row" as const, gap: 8, flexWrap: "wrap" as const },
      chip: (active: boolean) => ({
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
        borderColor: active ? colors.accent : colors.border,
        backgroundColor: active ? colors.accent : colors.surface0,
      }),
      chipText: (active: boolean) => ({ color: active ? colors.accentForeground : colors.foreground, fontSize: 13, fontWeight: "500" as const }),
      button: (primary?: boolean) => ({
        paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignItems: "center" as const,
        backgroundColor: primary ? colors.accent : colors.surface2,
        opacity: 1,
      }),
      buttonText: (primary?: boolean) => ({ color: primary ? colors.accentForeground : colors.foreground, fontWeight: "600" as const, fontSize: 14 }),
      banner: (ok: boolean) => ({ padding: 12, borderRadius: 8, backgroundColor: ok ? "#0f5132" : "#842029", borderWidth: 1, borderColor: ok ? "#198754" : "#dc3545" }),
      bannerText: { color: "white", fontSize: 13 },
      link: { color: colors.accent, fontSize: 13 },
    }),
    [colors, compact],
  );

  const { isLoading, data } = useQuery({
    queryKey: ["voice-hub", "settings"],
    queryFn: () => paseo.rpc(loadSettings, {}),
  });

  useEffect(() => {
    if (data) {
      setGroqApiKey(data.groqApiKey || "");
      setLanguage(data.language);
      setSttModel(data.sttModel);
      setTtsVoice(data.ttsVoice);
    }
  }, [data]);

  const saveMut = useMutation({
    mutationFn: (s: Settings) => paseo.rpc(saveSettings, s) as Promise<Settings & { _daemonChanged?: boolean; _needsRestart?: boolean }>,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["voice-hub", "settings"] });
      if ((r as unknown as { _daemonChanged?: boolean })._daemonChanged) {
        setMessage({ text: "Saved! Restarting Paseo daemon… voice button ready in ~5s. Test voice after.", ok: true });
      } else {
        setMessage({ text: "Saved! Voice Hub is ready. Try Test voice below.", ok: true });
      }
    },
    onError: (e: unknown) => setMessage({ text: e instanceof Error ? e.message : String(e), ok: false }),
  });
  const voiceMut = useMutation({
    mutationFn: (v: { text: string; voice: string }) => paseo.rpc(testVoice, v),
    onSuccess: (r: { ok: boolean; bytes?: number; error?: string }) => {
      if (r.ok) setMessage({ text: `Voice OK — ${r.bytes} bytes wav. If you heard nothing, check volume.`, ok: true });
      else setMessage({ text: r.error || "Voice failed", ok: false });
    },
    onError: (e: unknown) => setMessage({ text: e instanceof Error ? e.message : String(e), ok: false }),
  });

  const sttMut = useMutation({
    mutationFn: () => paseo.rpc(testStt, {}),
    onSuccess: (r: { ok: boolean; error?: string }) => {
      if (r.ok) setMessage({ text: "STT key OK — Groq sees your model.", ok: true });
      else setMessage({ text: r.error || "STT failed", ok: false });
    },
    onError: (e: unknown) => setMessage({ text: e instanceof Error ? e.message : String(e), ok: false }),
  });

  if (isLoading) {
    return (
      <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.muted}>Loading Voice Hub…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      <View style={styles.card}>
        <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "700" }}>Voice Hub</Text>
        <Text style={styles.muted}>Friendly hub for better voices — no terminal needed. Add your free Groq key, pick Swedish, and test. Works for everyone, even on a tiny VPS (no local AI needed).</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>1. Groq API key (free)</Text>
        <Text style={styles.muted}>Get one in 30s at console.groq.com/keys → Create API Key (starts with gsk_). We store it safely on your Paseo machine (600 perms), never in git.</Text>
        <TextInput value={groqApiKey} onChangeText={setGroqApiKey} placeholder="gsk_..." placeholderTextColor={colors.foregroundMuted} secureTextEntry style={styles.input} autoCapitalize="none" autoCorrect={false} />
        <View style={styles.row}>
          <Pressable onPress={() => sttMut.mutate()} style={styles.button()}><Text style={styles.buttonText()}>{sttMut.isPending ? "Checking…" : "Check key"}</Text></Pressable>
        </View>
        <Text style={styles.muted}>Free tier is enough to start. No credit card for STT/TTS at Groq.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>2. Language</Text>
        <Text style={styles.muted}>We force this for Groq so mixed Swedish + English tech like "refaktorera functionen" stays Swedish. Your AI can still fix the ~1% extra errors from turbo.</Text>
        <View style={styles.row}>
          {(["sv", "en"] as const).map((v) => (
            <Pressable key={v} onPress={() => setLanguage(v)} style={styles.chip(language === v)}><Text style={styles.chipText(language === v)}>{v === "sv" ? "Svenska (sv)" : "English (en)"}</Text></Pressable>
          ))}
        </View>

        <Text style={styles.label}>STT speed vs accuracy</Text>
        <View style={styles.row}>
          {(["whisper-large-v3-turbo", "whisper-large-v3"] as const).map((v) => (
            <Pressable key={v} onPress={() => setSttModel(v)} style={styles.chip(sttModel === v)}><Text style={styles.chipText(sttModel === v)}>{v === "whisper-large-v3-turbo" ? "Turbo (fast, we recommend)" : "Accurate (slower)"}</Text></Pressable>
          ))}
        </View>
        <Text style={styles.muted}>Turbo is 8× faster on Groq LPU, WER only ~1% worse — your coding agent fills the gaps.</Text>

        <Text style={styles.label}>Voice</Text>
        <View style={styles.row}>
          {(["troy", "hannah", "autumn", "diana", "austin", "daniel"] as const).map((v) => (
            <Pressable key={v} onPress={() => setTtsVoice(v)} style={styles.chip(ttsVoice === v)}><Text style={styles.chipText(ttsVoice === v)}>{v}</Text></Pressable>
          ))}
        </View>
        <Text style={styles.muted}>English Orpheus voices on Groq. For Swedish speech, Orpheus is English-only — we keep it English for now.</Text>
      </View>

      <View style={styles.card}>
        <Pressable
          onPress={() => saveMut.mutate({ groqApiKey, language, sttModel, ttsVoice })}
          style={styles.button(true)}
        >
          <Text style={styles.buttonText(true)}>{saveMut.isPending ? "Saving…" : "Save and enable"}</Text>
        </Pressable>
        <Text style={styles.muted}>Saves to ~/.paseo/plugins/voice-hub/settings.json (safe). Daemon proxy restarts automatically.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>3. Test</Text>
        <TextInput value={testText} onChangeText={setTestText} placeholder="Text to speak" placeholderTextColor={colors.foregroundMuted} multiline style={[styles.input, { minHeight: 60, textAlignVertical: "top" }]} />
        <View style={styles.row}>
          <Pressable onPress={() => voiceMut.mutate({ text: testText, voice: ttsVoice })} style={styles.button(true)}><Text style={styles.buttonText(true)}>{voiceMut.isPending ? "Testing…" : "Test voice"}</Text></Pressable>
          <Pressable onPress={() => voiceMut.mutate({ text: "Jag vill refaktorera functionen till att använda async await", voice: ttsVoice })} style={styles.button()}><Text style={styles.buttonText()}>Test sv+en mix</Text></Pressable>
        </View>
        <Text style={styles.muted}>This calls Groq directly — if it says "bytes", your Paseo voice button will work in app.paseo.sh. No terminal needed.</Text>
      </View>

      {message && (
        <View style={styles.banner(message.ok)}><Text style={styles.bannerText}>{message.text}</Text></View>
      )}

      <View style={styles.card}>
        <Text style={styles.muted}>After Save: dictation → Groq whisper-large-v3-turbo (sv forced), TTS → http://127.0.0.1:8789 via plugin → Groq orpheus. No local AI models, perfect for tiny VPS. No PASEO_PASSWORD needed on fresh desktop — only on headless VPS where daemon has a password.</Text>
      </View>
    </ScrollView>
  );
}
