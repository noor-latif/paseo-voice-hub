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

  const card = {
    backgroundColor: colors.surface1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden' as const,
  };
  const row: Record<string, unknown> = {
    padding: 16,
    gap: 12,
  };
  const rowBorder = {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  };
  const muted = { color: colors.foregroundMuted, fontSize: 13, lineHeight: 18 };
  const label = { color: colors.foreground, fontWeight: '600' as const, fontSize: 14 };
  const isGroq = provider === 'groq';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface0 } as never}
      contentContainerStyle={
        { padding: 16, gap: 16, maxWidth: 720, alignSelf: 'center', width: '100%' } as never
      }
    >
      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '700' }}>Voice Hub</Text>
        <Text style={muted}>
          Paste Groq or OpenAI key, choose provider, Save — voice button works.
        </Text>
      </View>

      <View style={card}>
        <View style={row}>
          <Text style={label}>API key</Text>
          <Text style={muted}>
            Groq gsk_… or OpenAI sk-… — stored at ~/.paseo/plugins/voice-hub/settings.json.
          </Text>
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
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.foreground,
                fontSize: 14,
              } as never
            }
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={[row, rowBorder] as never}>
          <Text style={label}>Provider</Text>
          <Text style={muted}>
            Groq = preconfigured Orpheus/Whisper Turbo with finetuning. Custom = any
            OpenAI-compatible baseUrl + model IDs.
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['groq', 'custom'] as const).map((v) => (
              <Pressable
                key={v}
                onPress={() => setProvider(v)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: provider === v ? colors.accent : colors.border,
                  backgroundColor: provider === v ? colors.accent : colors.surface0,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: provider === v ? colors.accentForeground : colors.foreground,
                    fontSize: 13,
                    fontWeight: '500' as const,
                  }}
                >
                  {v === 'groq' ? 'Groq' : 'Custom'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {!isGroq && (
          <View style={[row, rowBorder] as never}>
            <Text style={label}>Base URL</Text>
            <Text style={muted}>OpenAI-compatible endpoint, e.g. https://api.openai.com/v1</Text>
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
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: colors.foreground,
                  fontSize: 14,
                } as never
              }
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}

        <View style={[row, rowBorder] as never}>
          <Text style={label}>Language</Text>
          <Text style={muted}>
            Forced for STT — keeps “refaktorera functionen” Swedish. Supports all Whisper languages.
          </Text>
          <Pressable
            onPress={() => setLanguageOpen((v) => !v)}
            style={{
              backgroundColor: colors.surface0,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.foreground, fontSize: 14 }}>
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
                borderRadius: 8,
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
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: colors.foreground,
                    fontSize: 14,
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
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      backgroundColor: language === l.code ? colors.surface1 : colors.surface0,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: language === l.code ? colors.foreground : colors.foregroundMuted,
                        fontSize: 14,
                      }}
                    >
                      {l.code} — {l.label}
                    </Text>
                  </Pressable>
                ))}
                {filtered.length === 0 && (
                  <View style={{ padding: 12 }}>
                    <Text style={{ color: colors.foregroundMuted, fontSize: 13 }}>No match</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {isGroq ? (
          <>
            <View style={[row, rowBorder] as never}>
              <Text style={label}>STT model</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['whisper-large-v3-turbo', 'whisper-large-v3'] as const).map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setSttModel(v)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: sttModel === v ? colors.accent : colors.border,
                      backgroundColor: sttModel === v ? colors.accent : colors.surface0,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: sttModel === v ? colors.accentForeground : colors.foreground,
                        fontSize: 13,
                        fontWeight: '500' as const,
                      }}
                    >
                      {v === 'whisper-large-v3-turbo' ? 'Turbo' : 'Accurate'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={[row, rowBorder] as never}>
              <Text style={label}>TTS model</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['tts-1', 'tts-1-hd'] as const).map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setTtsModel(v)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: ttsModel === v ? colors.accent : colors.border,
                      backgroundColor: ttsModel === v ? colors.accent : colors.surface0,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: ttsModel === v ? colors.accentForeground : colors.foreground,
                        fontSize: 13,
                        fontWeight: '500' as const,
                      }}
                    >
                      {v}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={[row, rowBorder] as never}>
              <Text style={label}>Voice</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' as never }}>
                {(['troy', 'hannah', 'autumn', 'diana', 'austin', 'daniel'] as const).map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setTtsVoice(v)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: ttsVoice === v ? colors.accent : colors.border,
                      backgroundColor: ttsVoice === v ? colors.accent : colors.surface0,
                    }}
                  >
                    <Text
                      style={{
                        color: ttsVoice === v ? colors.accentForeground : colors.foreground,
                        fontSize: 13,
                      }}
                    >
                      {v}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={muted}>Orpheus English voices via Groq proxy on 127.0.0.1:8789.</Text>
            </View>
          </>
        ) : (
          <>
            <View style={[row, rowBorder] as never}>
              <Text style={label}>STT model ID</Text>
              <Text style={muted}>e.g. whisper-1, gpt-4o-transcribe</Text>
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
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: colors.foreground,
                    fontSize: 14,
                  } as never
                }
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={[row, rowBorder] as never}>
              <Text style={label}>TTS model ID</Text>
              <Text style={muted}>e.g. tts-1, gpt-4o-mini-tts</Text>
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
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: colors.foreground,
                    fontSize: 14,
                  } as never
                }
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={[row, rowBorder] as never}>
              <Text style={label}>Voice</Text>
              <Text style={muted}>e.g. alloy, nova, shimmer</Text>
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
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: colors.foreground,
                    fontSize: 14,
                  } as never
                }
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </>
        )}
      </View>

      <View style={card}>
        <View style={row}>
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
                })) as unknown as {
                  _daemonChanged?: boolean;
                };
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
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: 'center',
            }}
          >
            <Text
              style={{ color: colors.accentForeground, fontWeight: '600' as const, fontSize: 14 }}
            >
              Save and enable
            </Text>
          </Pressable>
          <Text style={muted}>Saves to settings.json and updates daemon speech config.</Text>
        </View>
        <View style={[row, rowBorder] as never}>
          <Pressable
            onPress={async () => {
              try {
                const r = (await test({
                  text: 'Hej! Det här är Voice Hub — din röst för kod, på svenska.',
                  voice: ttsVoice,
                })) as { ok: boolean; bytes?: number; error?: string };
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
              paddingVertical: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.foreground, fontWeight: '500' as const }}>Test voice</Text>
          </Pressable>
          <Text style={muted}>
            Tests TTS via {isGroq ? 'Groq Orpheus' : baseUrl || 'custom baseUrl'} — OK means wav
            received, hear it with Paseo voice button.
          </Text>
        </View>
        {msg && (
          <View
            style={
              {
                margin: 16,
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: msg.ok ? colors.statusSuccess : colors.statusDanger,
                backgroundColor: 'transparent',
              } as never
            }
          >
            <Text
              style={{ color: msg.ok ? colors.statusSuccess : colors.statusDanger, fontSize: 13 }}
            >
              {msg.text}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
