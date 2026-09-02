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

const VOICES = ['troy', 'hannah', 'autumn', 'diana', 'austin', 'daniel'] as const;

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
  colors: { foreground: string; foregroundMuted: string; surface2: string };
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

function RowInfo({
  text,
  colors,
}: {
  text: string;
  colors: { border: string; foregroundMuted: string; surface0: string; foreground: string };
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colors.foregroundMuted, fontSize: 9, fontWeight: '600' as const }}>
          i
        </Text>
      </Pressable>
      {open && (
        <View
          style={{
            marginTop: SPACING[2],
            backgroundColor: colors.surface0,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: RADIUS.md,
            padding: SPACING[2],
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: FONT_SIZE.sm, lineHeight: 16 }}>
            {text}
          </Text>
        </View>
      )}
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
  const [voiceOpen, setVoiceOpen] = useState(false);
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
  const rowBorder = { borderTopWidth: 1, borderTopColor: colors.border };
  const rowContent = { flex: 1, marginRight: SPACING[3], gap: SPACING[1] };
  const rowTitleRow = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: SPACING[2],
  };
  const rowTitle = { color: colors.foreground, fontSize: FONT_SIZE.base };
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
          Paste key, choose provider, Save.
        </Text>
      </View>

      <View style={section}>
        <View style={sectionHeader}>
          <Text style={sectionHeaderTitle}>Connection</Text>
        </View>
        <View style={sectionContent}>
          <View style={card}>
            <View
              style={{
                paddingVertical: SPACING[4],
                paddingHorizontal: SPACING[4],
                gap: SPACING[3],
              }}
            >
              <View style={rowTitleRow}>
                <Text style={rowTitle}>API key</Text>
                <RowInfo
                  colors={colors as never}
                  text="Stored at ~/.paseo/plugins/voice-hub/settings.json. Groq = gsk_..., OpenAI = sk-..."
                />
              </View>
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
              <View style={{ flex: 1, marginRight: SPACING[3] }}>
                <View style={rowTitleRow}>
                  <Text style={rowTitle}>Provider</Text>
                  <RowInfo
                    colors={colors as never}
                    text="Groq = preconfigured Orpheus + Whisper Turbo via 127.0.0.1:8789. Custom = any OpenAI-compatible URL."
                  />
                </View>
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
              <View
                style={
                  {
                    paddingVertical: SPACING[4],
                    paddingHorizontal: SPACING[4],
                    gap: SPACING[3],
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  } as never
                }
              >
                <Text style={rowTitle}>Base URL</Text>
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
          <Text style={sectionHeaderTitle}>Listen</Text>
        </View>
        <View style={sectionContent}>
          <View style={card}>
            <View
              style={{
                paddingVertical: SPACING[4],
                paddingHorizontal: SPACING[4],
                gap: SPACING[3],
              }}
            >
              <View style={rowTitleRow}>
                <Text style={rowTitle}>Language</Text>
                <RowInfo
                  colors={colors as never}
                  text="Forced for STT — keeps “refaktorera functionen” Swedish. Search any Whisper language."
                />
              </View>
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
            <View style={[row, rowBorder] as never}>
              <View style={rowContent}>
                <View style={rowTitleRow}>
                  <Text style={rowTitle}>STT model</Text>
                  <RowInfo
                    colors={colors as never}
                    text="Turbo is 8× faster on Groq, ~1% worse WER. Accurate is whisper-large-v3."
                  />
                </View>
              </View>
              {isGroq ? (
                <Segmented
                  colors={colors as never}
                  value={sttModel as never}
                  onValueChange={setSttModel as never}
                  options={[
                    { value: 'whisper-large-v3-turbo', label: 'Turbo' },
                    { value: 'whisper-large-v3', label: 'Accurate' },
                  ]}
                />
              ) : (
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
                      paddingVertical: SPACING[2],
                      color: colors.foreground,
                      fontSize: FONT_SIZE.base,
                      minWidth: 140,
                      textAlign: 'right' as const,
                    } as never
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            </View>
          </View>
        </View>
      </View>

      <View style={section}>
        <View style={sectionHeader}>
          <Text style={sectionHeaderTitle}>Speak</Text>
        </View>
        <View style={sectionContent}>
          <View style={card}>
            <View
              style={[row, { paddingVertical: SPACING[4], paddingHorizontal: SPACING[4] } as never]}
            >
              <View style={rowContent}>
                <View style={rowTitleRow}>
                  <Text style={rowTitle}>TTS model</Text>
                  <RowInfo
                    colors={colors as never}
                    text={
                      isGroq ? 'Groq Orpheus via proxy 127.0.0.1:8789.' : 'Custom TTS model ID.'
                    }
                  />
                </View>
              </View>
              {isGroq ? (
                <Segmented
                  colors={colors as never}
                  value={ttsModel as never}
                  onValueChange={setTtsModel as never}
                  options={[
                    { value: 'tts-1', label: 'tts-1' },
                    { value: 'tts-1-hd', label: 'tts-1-hd' },
                  ]}
                />
              ) : (
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
                      paddingVertical: SPACING[2],
                      color: colors.foreground,
                      fontSize: FONT_SIZE.base,
                      minWidth: 140,
                      textAlign: 'right' as const,
                    } as never
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            </View>
            <View style={[row, rowBorder] as never}>
              <View style={rowContent}>
                <View style={rowTitleRow}>
                  <Text style={rowTitle}>Voice</Text>
                  <RowInfo
                    colors={colors as never}
                    text={isGroq ? 'English Orpheus voices.' : 'Voice ID, e.g. alloy.'}
                  />
                </View>
              </View>
              {isGroq ? (
                <View style={{ minWidth: 140 }}>
                  <Pressable
                    onPress={() => setVoiceOpen((v) => !v)}
                    style={{
                      backgroundColor: colors.surface0,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: RADIUS.lg,
                      paddingHorizontal: SPACING[3],
                      paddingVertical: SPACING[2],
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      minWidth: 120,
                    }}
                  >
                    <Text style={{ color: colors.foreground, fontSize: FONT_SIZE.base }}>
                      {ttsVoice}
                    </Text>
                    <Text style={{ color: colors.foregroundMuted }}>{voiceOpen ? '▲' : '▼'}</Text>
                  </Pressable>
                  {voiceOpen && (
                    <View
                      style={{
                        marginTop: SPACING[1],
                        backgroundColor: colors.surface0,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: RADIUS.lg,
                        overflow: 'hidden',
                      }}
                    >
                      {VOICES.map((v) => (
                        <Pressable
                          key={v}
                          onPress={() => {
                            setTtsVoice(v);
                            setVoiceOpen(false);
                          }}
                          style={{
                            paddingHorizontal: SPACING[3],
                            paddingVertical: SPACING[2],
                            backgroundColor: ttsVoice === v ? colors.surface1 : colors.surface0,
                          }}
                        >
                          <Text
                            style={{
                              color: ttsVoice === v ? colors.foreground : colors.foregroundMuted,
                              fontSize: FONT_SIZE.base,
                            }}
                          >
                            {v}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
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
                      paddingVertical: SPACING[2],
                      color: colors.foreground,
                      fontSize: FONT_SIZE.base,
                      minWidth: 140,
                      textAlign: 'right' as const,
                    } as never
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            </View>
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
