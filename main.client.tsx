import type { PluginSurfaceProps } from '@getpaseo/plugin';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRpc } from '@getpaseo/plugin';
import { saveSettings, testVoice } from './shared';

const LANGUAGES: { code: string; label: string }[] = [
  { code: 'sv', label: 'Swedish' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'Arabic' },
  { code: 'bn', label: 'Bengali' },
  { code: 'cs', label: 'Czech' },
  { code: 'da', label: 'Danish' },
  { code: 'de', label: 'German' },
  { code: 'el', label: 'Greek' },
  { code: 'es', label: 'Spanish' },
  { code: 'fa', label: 'Persian' },
  { code: 'fi', label: 'Finnish' },
  { code: 'fr', label: 'French' },
  { code: 'he', label: 'Hebrew' },
  { code: 'hi', label: 'Hindi' },
  { code: 'hu', label: 'Hungarian' },
  { code: 'id', label: 'Indonesian' },
  { code: 'it', label: 'Italian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'nl', label: 'Dutch' },
  { code: 'no', label: 'Norwegian' },
  { code: 'pl', label: 'Polish' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ro', label: 'Romanian' },
  { code: 'ru', label: 'Russian' },
  { code: 'th', label: 'Thai' },
  { code: 'tr', label: 'Turkish' },
  { code: 'uk', label: 'Ukrainian' },
  { code: 'ur', label: 'Urdu' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'zh', label: 'Chinese' },
];

const SPACING = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24 } as const;
const FONT_SIZE = { sm: 12, base: 14 } as const;
const RADIUS = { md: 6, lg: 8, xl: 12 } as const;

function Segmented<T extends string>({
  options,
  value,
  onValueChange,
  colors,
}: {
  options: { value: T; label: string }[];
  value: T;
  onValueChange: (v: T) => void;
  colors: { foreground: string; foregroundMuted: string; surface2: string; border: string };
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[1] }}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onValueChange(opt.value)}
            style={{
              minHeight: 28,
              paddingHorizontal: SPACING[2],
              borderRadius: RADIUS.md,
              backgroundColor: selected ? colors.surface2 : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: selected ? colors.foreground : colors.foregroundMuted,
                fontSize: FONT_SIZE.base,
                fontWeight: 'normal' as const,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MainSurface({ theme }: PluginSurfaceProps) {
  const { colors } = theme;
  const save = useRpc(saveSettings);
  const test = useRpc(testVoice);
  const [groqApiKey, setGroqApiKey] = useState('');
  const [provider, setProvider] = useState<'groq' | 'custom'>('groq');
  const [baseUrl, setBaseUrl] = useState('');
  const [language, setLanguage] = useState('sv');
  const [languageOpen, setLanguageOpen] = useState(false);
  const [languageFilter, setLanguageFilter] = useState('');
  const [sttModel, setSttModel] = useState('whisper-large-v3-turbo');
  const [ttsModel, setTtsModel] = useState('tts-1');
  const [ttsVoice, setTtsVoice] = useState('troy');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const filtered = LANGUAGES.filter(
    (l) =>
      !languageFilter ||
      l.code.toLowerCase().includes(languageFilter.toLowerCase()) ||
      l.label.toLowerCase().includes(languageFilter.toLowerCase())
  );
  const selectedLabel = LANGUAGES.find((l) => l.code === language)?.label ?? language;

  const section = { marginBottom: SPACING[6] };
  const sectionHeader = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: SPACING[3],
    marginLeft: SPACING[1],
  };
  const sectionHeaderTitle = {
    color: colors.foregroundMuted,
    fontSize: FONT_SIZE.sm,
    fontWeight: 'normal' as const,
  };
  const sectionContent = { gap: SPACING[3] };
  const card = {
    backgroundColor: colors.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden' as const,
  };
  const row: Record<string, unknown> = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[4],
  };
  const rowBorder = {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  };
  const rowContent = { flex: 1, marginRight: SPACING[3] };
  const rowTitle = {
    color: colors.foreground,
    fontSize: FONT_SIZE.base,
    fontWeight: 'normal' as const,
  };
  const rowHint = { color: colors.foregroundMuted, fontSize: FONT_SIZE.sm, marginTop: SPACING[1] };
  const rowStack: Record<string, unknown> = {
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[4],
    gap: SPACING[3],
  };
  const isGroq = provider === 'groq';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface0 } as never}
      contentContainerStyle={
        {
          padding: SPACING[4],
          gap: SPACING[3],
          maxWidth: 720,
          alignSelf: 'center',
          width: '100%',
        } as never
      }
    >
      <View style={{ gap: SPACING[1] }}>
        <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '700' }}>Voice Hub</Text>
        <Text style={{ color: colors.foregroundMuted, fontSize: FONT_SIZE.sm, lineHeight: 18 }}>
          Paste Groq or OpenAI key, choose provider, Save — voice button works.
        </Text>
      </View>

      <View style={section}>
        <View style={sectionHeader}>
          <Text style={sectionHeaderTitle}>Connection</Text>
        </View>
        <View style={sectionContent}>
          <View style={card}>
            <View style={rowStack}>
              <Text style={rowTitle}>API key</Text>
              <Text style={rowHint}>Stored at ~/.paseo/plugins/voice-hub/settings.json.</Text>
              <TextInput
                value={groqApiKey}
                onChangeText={setGroqApiKey}
                placeholder="gsk_... or sk-..."
                placeholderTextColor={colors.foregroundMuted}
                secureTextEntry
                style={
                  {
                    backgroundColor: colors.surface0,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: RADIUS.lg,
                    paddingHorizontal: SPACING[3],
                    paddingVertical: SPACING[3],
                    color: colors.foreground,
                    fontSize: FONT_SIZE.base,
                  } as never
                }
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={[row, rowBorder] as never}>
              <View style={rowContent}>
                <Text style={rowTitle}>Provider</Text>
                <Text style={rowHint}>Groq = Orpheus/Whisper Turbo. Custom = any OpenAI URL.</Text>
              </View>
              <Segmented
                colors={colors as never}
                value={provider}
                onValueChange={setProvider}
                options={[
                  { value: 'groq', label: 'Groq' },
                  { value: 'custom', label: 'Custom' },
                ]}
              />
            </View>

            {!isGroq && (
              <View style={[rowStack, rowBorder] as never}>
                <Text style={rowTitle}>Base URL</Text>
                <Text style={rowHint}>e.g. https://api.openai.com/v1</Text>
                <TextInput
                  value={baseUrl}
                  onChangeText={setBaseUrl}
                  placeholder="https://api.openai.com/v1"
                  placeholderTextColor={colors.foregroundMuted}
                  style={
                    {
                      backgroundColor: colors.surface0,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: RADIUS.lg,
                      paddingHorizontal: SPACING[3],
                      paddingVertical: SPACING[3],
                      color: colors.foreground,
                      fontSize: FONT_SIZE.base,
                    } as never
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={section}>
        <View style={sectionHeader}>
          <Text style={sectionHeaderTitle}>Speech</Text>
        </View>
        <View style={sectionContent}>
          <View style={card}>
            <View style={rowStack}>
              <Text style={rowTitle}>Language</Text>
              <Text style={rowHint}>Forced for STT — keeps “refaktorera functionen” Swedish.</Text>
              <Pressable
                onPress={() => setLanguageOpen((v) => !v)}
                style={{
                  backgroundColor: colors.surface0,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: RADIUS.lg,
                  paddingHorizontal: SPACING[3],
                  paddingVertical: SPACING[3],
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.foreground, fontSize: FONT_SIZE.base }}>
                  {language} — {selectedLabel}
                </Text>
                <Text style={{ color: colors.foregroundMuted }}>{languageOpen ? '▲' : '▼'}</Text>
              </Pressable>
              {languageOpen && (
                <View
                  style={{
                    backgroundColor: colors.surface0,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: RADIUS.lg,
                    overflow: 'hidden',
                    maxHeight: 220,
                  }}
                >
                  <TextInput
                    value={languageFilter}
                    onChangeText={setLanguageFilter}
                    placeholder="Search language..."
                    placeholderTextColor={colors.foregroundMuted}
                    style={
                      {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                        paddingHorizontal: SPACING[3],
                        paddingVertical: SPACING[2],
                        color: colors.foreground,
                        fontSize: FONT_SIZE.base,
                      } as never
                    }
                    autoCapitalize="none"
                  />
                  <ScrollView style={{ maxHeight: 160 } as never} nestedScrollEnabled>
                    {filtered.map((l) => (
                      <Pressable
                        key={l.code}
                        onPress={() => {
                          setLanguage(l.code);
                          setLanguageOpen(false);
                          setLanguageFilter('');
                        }}
                        style={{
                          paddingHorizontal: SPACING[3],
                          paddingVertical: SPACING[3],
                          backgroundColor: language === l.code ? colors.surface1 : colors.surface0,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                        }}
                      >
                        <Text
                          style={{
                            color: language === l.code ? colors.foreground : colors.foregroundMuted,
                            fontSize: FONT_SIZE.base,
                          }}
                        >
                          {l.code} — {l.label}
                        </Text>
                      </Pressable>
                    ))}
                    {filtered.length === 0 && (
                      <View style={{ padding: SPACING[3] }}>
                        <Text style={{ color: colors.foregroundMuted, fontSize: FONT_SIZE.sm }}>
                          No match
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {isGroq ? (
              <>
                <View style={[row, rowBorder] as never}>
                  <View style={rowContent}>
                    <Text style={rowTitle}>STT model</Text>
                    <Text style={rowHint}>Turbo 8× faster, ~1% worse WER.</Text>
                  </View>
                  <Segmented
                    colors={colors as never}
                    value={sttModel as never}
                    onValueChange={setSttModel as never}
                    options={[
                      { value: 'whisper-large-v3-turbo', label: 'Turbo' },
                      { value: 'whisper-large-v3', label: 'Accurate' },
                    ]}
                  />
                </View>
                <View style={[row, rowBorder] as never}>
                  <View style={rowContent}>
                    <Text style={rowTitle}>TTS model</Text>
                    <Text style={rowHint}>Orpheus via Groq proxy 127.0.0.1:8789.</Text>
                  </View>
                  <Segmented
                    colors={colors as never}
                    value={ttsModel as never}
                    onValueChange={setTtsModel as never}
                    options={[
                      { value: 'tts-1', label: 'tts-1' },
                      { value: 'tts-1-hd', label: 'tts-1-hd' },
                    ]}
                  />
                </View>
                <View style={[row, rowBorder] as never}>
                  <View style={rowContent}>
                    <Text style={rowTitle}>Voice</Text>
                    <Text style={rowHint}>English Orpheus.</Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: SPACING[1],
                      flexWrap: 'wrap' as never,
                      justifyContent: 'flex-end',
                      maxWidth: 240,
                    }}
                  >
                    {(['troy', 'hannah', 'autumn', 'diana', 'austin', 'daniel'] as const).map(
                      (v) => {
                        const sel = ttsVoice === v;
                        return (
                          <Pressable
                            key={v}
                            onPress={() => setTtsVoice(v)}
                            style={{
                              paddingHorizontal: SPACING[2],
                              paddingVertical: SPACING[1],
                              borderRadius: RADIUS.md,
                              backgroundColor: sel ? colors.surface2 : 'transparent',
                            }}
                          >
                            <Text
                              style={{
                                color: sel ? colors.foreground : colors.foregroundMuted,
                                fontSize: FONT_SIZE.sm,
                              }}
                            >
                              {v}
                            </Text>
                          </Pressable>
                        );
                      }
                    )}
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={[row, rowBorder] as never}>
                  <View style={rowContent}>
                    <Text style={rowTitle}>STT model ID</Text>
                    <Text style={rowHint}>e.g. whisper-1</Text>
                  </View>
                  <TextInput
                    value={sttModel}
                    onChangeText={setSttModel}
                    placeholder="whisper-1"
                    placeholderTextColor={colors.foregroundMuted}
                    style={
                      {
                        backgroundColor: colors.surface0,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: RADIUS.lg,
                        paddingHorizontal: SPACING[3],
                        paddingVertical: SPACING[3],
                        color: colors.foreground,
                        fontSize: FONT_SIZE.base,
                        minWidth: 140,
                      } as never
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <View style={[row, rowBorder] as never}>
                  <View style={rowContent}>
                    <Text style={rowTitle}>TTS model ID</Text>
                    <Text style={rowHint}>e.g. tts-1</Text>
                  </View>
                  <TextInput
                    value={ttsModel}
                    onChangeText={setTtsModel}
                    placeholder="tts-1"
                    placeholderTextColor={colors.foregroundMuted}
                    style={
                      {
                        backgroundColor: colors.surface0,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: RADIUS.lg,
                        paddingHorizontal: SPACING[3],
                        paddingVertical: SPACING[3],
                        color: colors.foreground,
                        fontSize: FONT_SIZE.base,
                        minWidth: 140,
                      } as never
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <View style={[row, rowBorder] as never}>
                  <View style={rowContent}>
                    <Text style={rowTitle}>Voice</Text>
                    <Text style={rowHint}>e.g. alloy</Text>
                  </View>
                  <TextInput
                    value={ttsVoice}
                    onChangeText={setTtsVoice}
                    placeholder="alloy"
                    placeholderTextColor={colors.foregroundMuted}
                    style={
                      {
                        backgroundColor: colors.surface0,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: RADIUS.lg,
                        paddingHorizontal: SPACING[3],
                        paddingVertical: SPACING[3],
                        color: colors.foreground,
                        fontSize: FONT_SIZE.base,
                        minWidth: 140,
                      } as never
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </View>

      <View style={section}>
        <View style={sectionHeader}>
          <Text style={sectionHeaderTitle}>Actions</Text>
        </View>
        <View style={sectionContent}>
          <View style={card}>
            <View style={row}>
              <View style={rowContent}>
                <Text style={rowTitle}>Save and enable</Text>
                <Text style={rowHint}>Writes settings.json and daemon speech config.</Text>
              </View>
              <Pressable
                onPress={async () => {
                  try {
                    const r = (await save({
                      groqApiKey,
                      provider,
                      baseUrl: provider === 'custom' ? baseUrl : undefined,
                      language,
                      sttModel,
                      ttsModel,
                      ttsVoice,
                    })) as unknown as { _daemonChanged?: boolean };
                    setMsg({
                      text: r._daemonChanged ? 'Saved! Restarting daemon… ready in 5s.' : 'Saved!',
                      ok: true,
                    });
                  } catch (e) {
                    setMsg({ text: e instanceof Error ? e.message : String(e), ok: false });
                  }
                }}
                style={{
                  backgroundColor: colors.accent,
                  paddingHorizontal: SPACING[4],
                  paddingVertical: SPACING[2],
                  borderRadius: RADIUS.lg,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: colors.accentForeground,
                    fontWeight: '600' as const,
                    fontSize: FONT_SIZE.base,
                  }}
                >
                  Save
                </Text>
              </Pressable>
            </View>
            <View style={[row, rowBorder] as never}>
              <View style={rowContent}>
                <Text style={rowTitle}>Test voice</Text>
                <Text style={rowHint}>
                  Wav via {isGroq ? 'Groq Orpheus' : baseUrl || 'custom'} — OK = wav received.
                </Text>
              </View>
              <Pressable
                onPress={async () => {
                  try {
                    const r = (await test({
                      text: 'Hej! Det här är Voice Hub — din röst för kod, på svenska.',
                      voice: ttsVoice,
                    })) as {
                      ok: boolean;
                      bytes?: number;
                      error?: string;
                    };
                    setMsg({
                      text: r.ok
                        ? `Voice OK — ${r.bytes} bytes wav received. Try the Paseo voice button to hear it.`
                        : r.error || 'Voice failed',
                      ok: !!r.ok,
                    });
                  } catch (e) {
                    setMsg({ text: e instanceof Error ? e.message : String(e), ok: false });
                  }
                }}
                style={{
                  backgroundColor: colors.surface0,
                  paddingHorizontal: SPACING[4],
                  paddingVertical: SPACING[2],
                  borderRadius: RADIUS.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: colors.foreground,
                    fontWeight: '500' as const,
                    fontSize: FONT_SIZE.base,
                  }}
                >
                  Test
                </Text>
              </Pressable>
            </View>
            {msg && (
              <View
                style={
                  {
                    padding: SPACING[4],
                    borderTopWidth: 1,
                    borderTopColor: msg.ok ? colors.statusSuccess : colors.statusDanger,
                    backgroundColor: 'transparent',
                  } as never
                }
              >
                <Text
                  style={{
                    color: msg.ok ? colors.statusSuccess : colors.statusDanger,
                    fontSize: FONT_SIZE.sm,
                  }}
                >
                  {msg.text}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
