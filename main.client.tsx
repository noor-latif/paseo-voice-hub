import type { PluginSurfaceProps } from '@getpaseo/plugin';
import { Icon, useRpc } from '@getpaseo/plugin';
import { useToast } from '@getpaseo/plugin/react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { getSettings, saveSettings, testVoice, type VoiceHubSettings } from './shared';
import { BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, ICON_SIZE, SPACING } from './theme';
import { CONTROL_HEIGHTS } from './control-geometry';
import { createSettingsStyles } from './styles/settings';

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

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onValueChange: (v: T) => void;
  colors: { foreground: string; foregroundMuted: string; surface2: string };
}

function Segmented<T extends string>({ options, value, onValueChange, colors }: SegmentedProps<T>) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[1] }}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onValueChange(opt.value)}
            style={{
              minHeight: CONTROL_HEIGHTS.tight,
              paddingHorizontal: SPACING[2],
              borderRadius: BORDER_RADIUS.md,
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

interface DropdownOption {
  value: string;
  label: string;
  description?: string;
}

function SearchableDropdown({
  options,
  value,
  onValueChange,
  open,
  onOpenChange,
  icon,
  width,
  dropdownWidth,
  placeholder,
  searchable,
  searchPlaceholder,
  colors,
}: {
  options: DropdownOption[];
  value: string;
  onValueChange: (v: string) => void;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  icon: string;
  width: number;
  dropdownWidth?: number;
  placeholder?: string;
  searchable: boolean;
  searchPlaceholder: string;
  colors: {
    surface0: string;
    surface1: string;
    border: string;
    foreground: string;
    foregroundMuted: string;
  };
}) {
  const [filter, setFilter] = useState('');
  useEffect(() => {
    if (!open) setFilter('');
  }, [open]);
  const filtered = useMemo(() => {
    if (!searchable || !filter) return options;
    const q = filter.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        (o.description && o.description.toLowerCase().includes(q))
    );
  }, [options, filter, searchable]);
  const selected = options.find((o) => o.value === value);
  return (
    <View style={{ position: 'relative', width, overflow: 'visible' }}>
      <Pressable
        onPress={() => onOpenChange(!open)}
        style={{
          backgroundColor: colors.surface0,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: BORDER_RADIUS.lg,
          paddingHorizontal: SPACING[3],
          paddingVertical: SPACING[2],
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING[2],
          width,
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2], flex: 1 }}>
          <Icon name={icon} size={ICON_SIZE.sm} color={colors.foregroundMuted} />
          <Text style={{ color: colors.foreground, fontSize: FONT_SIZE.base }} numberOfLines={1}>
            {selected
              ? selected.label === selected.value
                ? selected.label
                : `${selected.value} — ${selected.label}`
              : (placeholder ?? value)}
          </Text>
        </View>
        <Icon name="ChevronDown" size={ICON_SIZE.sm} color={colors.foregroundMuted} />
      </Pressable>
      {open && (
        <View
          style={{
            position: 'absolute',
            top: 36,
            right: 0,
            left: 'auto' as const,
            width: dropdownWidth ?? width,
            marginTop: SPACING[1],
            zIndex: 30,
            elevation: 30,
            backgroundColor: colors.surface0,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: BORDER_RADIUS.lg,
            overflow: 'hidden',
            maxHeight: 280,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          {searchable && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: SPACING[3],
                gap: SPACING[2],
                backgroundColor: colors.surface1,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Icon name="Search" size={ICON_SIZE.sm} color={colors.foregroundMuted} />
              <TextInput
                value={filter}
                onChangeText={setFilter}
                placeholder={searchPlaceholder}
                placeholderTextColor={colors.foregroundMuted}
                // @ts-expect-error - outlineStyle is web-only
                style={
                  {
                    flex: 1,
                    paddingVertical: SPACING[3],
                    color: colors.foreground,
                    fontSize: FONT_SIZE.base,
                    outlineStyle: 'none',
                  } as const
                }
                autoCapitalize="none"
                autoFocus
              />
            </View>
          )}
          <ScrollView
            style={{ maxHeight: searchable ? 200 : 220 } as const}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: SPACING[1] } as const}
          >
            <View style={{ paddingVertical: SPACING[1] }}>
              {filtered.map((o) => {
                const active = value === o.value;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => {
                      onValueChange(o.value);
                      onOpenChange(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      minHeight: 36,
                      gap: SPACING[2],
                      paddingHorizontal: SPACING[3],
                      paddingVertical: SPACING[2],
                      backgroundColor: active ? colors.surface1 : 'transparent',
                    }}
                  >
                    <View style={{ width: ICON_SIZE.sm, alignItems: 'center' }}>
                      <Icon
                        name={icon}
                        size={ICON_SIZE.sm}
                        color={active ? colors.foreground : colors.foregroundMuted}
                      />
                    </View>
                    <View
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: SPACING[2],
                        minWidth: 0,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.foreground,
                          fontSize: FONT_SIZE.base,
                          flexShrink: 1,
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {o.label}
                      </Text>
                      {o.description ? (
                        <Text
                          style={{
                            color: colors.foregroundMuted,
                            fontSize: FONT_SIZE.sm,
                            flexShrink: 1,
                          }}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {o.description}
                        </Text>
                      ) : o.label !== o.value ? (
                        <Text
                          style={{
                            color: colors.foregroundMuted,
                            fontSize: FONT_SIZE.sm,
                            flexShrink: 1,
                          }}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {o.value}
                        </Text>
                      ) : null}
                    </View>
                    {active && <Icon name="Check" size={ICON_SIZE.sm} color={colors.foreground} />}
                  </Pressable>
                );
              })}
              {filtered.length === 0 && (
                <View style={{ paddingHorizontal: SPACING[3], paddingVertical: SPACING[2] }}>
                  <Text style={{ color: colors.foregroundMuted, fontSize: FONT_SIZE.base }}>
                    No results
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function useDropdownManager() {
  const [openId, setOpenId] = useState<string | null>(null);
  return {
    isOpen: (id: string) => openId === id,
    bind: (id: string) => ({
      open: openId === id,
      onOpenChange: (v: boolean) => setOpenId(v ? id : null),
    }),
  };
}

export function MainSurface({ theme }: PluginSurfaceProps) {
  const { colors } = theme;
  const s = useMemo(() => createSettingsStyles(colors), [colors]);
  const toast = useToast();
  const get = useRpc(getSettings);
  const save = useRpc(saveSettings);
  const test = useRpc(testVoice);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [form, setForm] = useState<VoiceHubSettings>({
    provider: 'groq',
    language: 'sv',
    sttModel: 'whisper-large-v3-turbo',
    ttsModel: 'tts-1',
    ttsVoice: 'troy',
  });

  const dropdowns = useDropdownManager();
  const languageOpen = dropdowns.isOpen('language');
  const voiceOpen = dropdowns.isOpen('voice');
  useEffect(() => {
    let cancelled = false;
    get({})
      .then((saved) => {
        if (cancelled) return;
        setForm({
          groqApiKey: saved.groqApiKey,
          provider: saved.provider ?? 'groq',
          baseUrl: saved.baseUrl,
          language: saved.language ?? 'sv',
          sttModel: saved.sttModel ?? 'whisper-large-v3-turbo',
          ttsModel: saved.ttsModel ?? 'tts-1',
          ttsVoice: saved.ttsVoice ?? 'troy',
        });
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [get]);

  const isGroq = form.provider === 'groq';

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = (await save({
        groqApiKey: form.groqApiKey,
        provider: form.provider,
        baseUrl: form.provider === 'custom' ? form.baseUrl : undefined,
        language: form.language,
        sttModel: form.sttModel,
        ttsModel: form.ttsModel,
        ttsVoice: form.ttsVoice,
      })) as unknown as { _daemonChanged?: boolean };
      if (res._daemonChanged) {
        toast.show('Saved — daemon will restart, ready in ~5s', { variant: 'success' });
      } else {
        toast.show('Saved', { variant: 'success' });
      }
    } catch (e) {
      toast.show(e instanceof Error ? e.message : String(e), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }, [save, form, toast]);

  const handleTest = useCallback(async () => {
    setTesting(true);
    try {
      const res = (await test({
        text: 'Hej! Det här är Voice Hub — din röst för kod, på svenska.',
        voice: form.ttsVoice,
      })) as { ok: boolean; bytes?: number; error?: string };
      if (res.ok) {
        toast.show(`Voice OK — ${res.bytes} bytes received`, { variant: 'success' });
      } else {
        toast.show(res.error ?? 'Voice failed', { variant: 'error' });
      }
    } catch (e) {
      toast.show(e instanceof Error ? e.message : String(e), { variant: 'error' });
    } finally {
      setTesting(false);
    }
  }, [test, form.ttsVoice, toast]);

  const inputStyle = useMemo(
    () => ({
      backgroundColor: colors.surface0,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.lg,
      paddingHorizontal: SPACING[3],
      paddingVertical: SPACING[3],
      color: colors.foreground,
      fontSize: FONT_SIZE.base,
    }),
    [colors]
  );

  const smallInputStyle = useMemo(
    () => ({
      backgroundColor: colors.surface0,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.lg,
      paddingHorizontal: SPACING[3],
      paddingVertical: SPACING[2],
      color: colors.foreground,
      fontSize: FONT_SIZE.base,
      minWidth: 140,
      textAlign: 'right' as const,
    }),
    [colors]
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.surface0,
          alignItems: 'center',
          justifyContent: 'center',
          padding: SPACING[4],
        }}
      >
        <Text style={{ color: colors.foregroundMuted, fontSize: FONT_SIZE.base }}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface0 }}>
      <ScrollView
        contentContainerStyle={{
          padding: SPACING[4],
          gap: SPACING[3],
          maxWidth: 720,
          alignSelf: 'center',
          width: '100%',
        }}
      >
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionHeaderTitle}>API key &amp; provider</Text>
          </View>
          <View style={{ gap: SPACING[3] }}>
            <View style={s.card}>
              <View
                style={{
                  paddingVertical: SPACING[4],
                  paddingHorizontal: SPACING[4],
                  gap: SPACING[3],
                }}
              >
                <View>
                  <Text style={s.rowTitle}>API key</Text>
                  <Text style={s.rowHint}>Your key is saved securely on this device</Text>
                </View>
                <TextInput
                  value={form.groqApiKey ?? ''}
                  onChangeText={(v) => setForm((f) => ({ ...f, groqApiKey: v }))}
                  placeholder="gsk_... or sk-..."
                  placeholderTextColor={colors.foregroundMuted}
                  secureTextEntry
                  style={inputStyle}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={[s.row, s.rowBorder]}>
                <View style={s.rowContent}>
                  <Text style={s.rowTitle}>Provider</Text>
                  <Text style={s.rowHint}>
                    Choose Groq (recommended) or Custom for other providers
                  </Text>
                </View>
                <Segmented
                  colors={colors}
                  value={form.provider}
                  onValueChange={(v) => setForm((f) => ({ ...f, provider: v }))}
                  options={[
                    { value: 'groq', label: 'Groq' },
                    { value: 'custom', label: 'Custom' },
                  ]}
                />
              </View>
              {!isGroq && (
                <View
                  style={{
                    paddingVertical: SPACING[4],
                    paddingHorizontal: SPACING[4],
                    gap: SPACING[3],
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <View>
                    <Text style={s.rowTitle}>Custom base URL</Text>
                    <Text style={s.rowHint}>
                      Only for Custom provider: e.g. https://api.openai.com/v1
                    </Text>
                  </View>
                  <TextInput
                    value={form.baseUrl ?? ''}
                    onChangeText={(v) => setForm((f) => ({ ...f, baseUrl: v }))}
                    placeholder="https://api.openai.com/v1"
                    placeholderTextColor={colors.foregroundMuted}
                    style={inputStyle}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}
            </View>
          </View>
        </View>

        <View
          style={
            languageOpen
              ? [s.section, { zIndex: 20, elevation: 20, position: 'relative' }]
              : s.section
          }
        >
          <View style={s.sectionHeader}>
            <Text style={s.sectionHeaderTitle}>Language &amp; speech-to-text</Text>
          </View>
          <View style={{ gap: SPACING[3] }}>
            <View
              style={
                languageOpen
                  ? {
                      ...s.card,
                      overflow: 'visible',
                      zIndex: 20,
                      elevation: 20,
                      position: 'relative',
                    }
                  : s.card
              }
            >
              <View
                style={
                  languageOpen
                    ? {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: SPACING[4],
                        paddingHorizontal: SPACING[4],
                        gap: SPACING[3],
                        zIndex: 1,
                        position: 'relative',
                      }
                    : {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: SPACING[4],
                        paddingHorizontal: SPACING[4],
                        gap: SPACING[3],
                      }
                }
              >
                <View style={s.rowContent}>
                  <Text style={s.rowTitle}>Language selection</Text>
                  <Text style={s.rowHint}>Choose the language you'll be speaking</Text>
                </View>
                <SearchableDropdown
                  {...dropdowns.bind('language')}
                  options={LANGUAGES.map((l) => ({
                    value: l.code,
                    label: l.label,
                    description: l.code,
                  }))}
                  value={form.language}
                  onValueChange={(v) => setForm((f) => ({ ...f, language: v }))}
                  icon="Globe"
                  width={140}
                  dropdownWidth={220}
                  searchable
                  searchPlaceholder="Search language…"
                  colors={colors}
                />
              </View>
              <View
                style={
                  languageOpen
                    ? [s.row, s.rowBorder, { zIndex: 0, position: 'relative' }]
                    : [s.row, s.rowBorder]
                }
              >
                <View style={s.rowContent}>
                  <Text style={s.rowTitle}>STT model</Text>
                  <Text style={s.rowHint}>
                    Turbo: faster transcription | Accurate: higher accuracy
                  </Text>
                </View>
                {isGroq ? (
                  <Segmented
                    colors={colors}
                    value={form.sttModel}
                    onValueChange={(v) => setForm((f) => ({ ...f, sttModel: v }))}
                    options={[
                      { value: 'whisper-large-v3-turbo', label: 'Turbo' },
                      { value: 'whisper-large-v3', label: 'Accurate' },
                    ]}
                  />
                ) : (
                  <TextInput
                    value={form.sttModel}
                    onChangeText={(v) => setForm((f) => ({ ...f, sttModel: v }))}
                    placeholder="whisper-1"
                    placeholderTextColor={colors.foregroundMuted}
                    style={smallInputStyle}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                )}
              </View>
            </View>
          </View>
        </View>

        <View
          style={
            voiceOpen ? [s.section, { zIndex: 20, elevation: 20, position: 'relative' }] : s.section
          }
        >
          <View style={s.sectionHeader}>
            <Text style={s.sectionHeaderTitle}>Voice &amp; text-to-speech</Text>
          </View>
          <View style={{ gap: SPACING[3] }}>
            <View
              style={
                voiceOpen
                  ? {
                      ...s.card,
                      overflow: 'visible',
                      zIndex: 20,
                      elevation: 20,
                      position: 'relative',
                      backgroundColor: colors.surface1,
                    }
                  : s.card
              }
            >
              <View style={[s.row, { paddingVertical: SPACING[4], paddingHorizontal: SPACING[4] }]}>
                <View style={s.rowContent}>
                  <Text style={s.rowTitle}>TTS model</Text>
                  <Text style={s.rowHint}>
                    {isGroq ? 'Groq Orpheus (recommended voices)' : 'Enter your TTS model ID'}
                  </Text>
                </View>
                {isGroq ? (
                  <Segmented
                    colors={colors}
                    value={form.ttsModel}
                    onValueChange={(v) => setForm((f) => ({ ...f, ttsModel: v }))}
                    options={[
                      { value: 'tts-1', label: 'tts-1' },
                      { value: 'tts-1-hd', label: 'tts-1-hd' },
                    ]}
                  />
                ) : (
                  <TextInput
                    value={form.ttsModel}
                    onChangeText={(v) => setForm((f) => ({ ...f, ttsModel: v }))}
                    placeholder="tts-1"
                    placeholderTextColor={colors.foregroundMuted}
                    style={smallInputStyle}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                )}
              </View>
              <View style={[s.row, s.rowBorder]}>
                <View style={s.rowContent}>
                  <Text style={s.rowTitle}>Voice selection</Text>
                  <Text style={s.rowHint}>
                    {isGroq
                      ? 'Choose an English voice (e.g., troy, hannah)'
                      : 'Enter voice ID (e.g., alloy)'}
                  </Text>
                </View>
                {isGroq ? (
                  <SearchableDropdown
                    {...dropdowns.bind('voice')}
                    options={VOICES.map((v) => ({
                      value: v,
                      label: v,
                      description: `groq/orpheus-${v}`,
                    }))}
                    value={form.ttsVoice}
                    onValueChange={(v) => setForm((f) => ({ ...f, ttsVoice: v }))}
                    icon="Mic"
                    width={140}
                    dropdownWidth={260}
                    searchable
                    searchPlaceholder="Search voice…"
                    colors={colors}
                  />
                ) : (
                  <TextInput
                    value={form.ttsVoice}
                    onChangeText={(v) => setForm((f) => ({ ...f, ttsVoice: v }))}
                    placeholder="alloy"
                    placeholderTextColor={colors.foregroundMuted}
                    style={smallInputStyle}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionHeaderTitle}>Save &amp; test</Text>
          </View>
          <View style={{ gap: SPACING[3] }}>
            <View style={s.card}>
              <View style={s.row}>
                <View style={s.rowContent}>
                  <Text style={s.rowTitle}>Save & enable</Text>
                  <Text style={s.rowHint}>Writes settings and updates daemon speech config</Text>
                </View>
                <Pressable
                  onPress={handleSave}
                  disabled={saving}
                  style={{
                    backgroundColor: colors.accent,
                    paddingHorizontal: SPACING[4],
                    paddingVertical: SPACING[2],
                    borderRadius: BORDER_RADIUS.lg,
                    alignItems: 'center',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  <Text
                    style={{
                      color: colors.accentForeground,
                      fontWeight: FONT_WEIGHT.semibold,
                      fontSize: FONT_SIZE.base,
                    }}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </Text>
                </Pressable>
              </View>
              <View style={[s.row, s.rowBorder]}>
                <View style={s.rowContent}>
                  <Text style={s.rowTitle}>Test voice</Text>
                  <Text style={s.rowHint}>Test your voice settings with a short sentence</Text>
                </View>
                <Pressable
                  onPress={handleTest}
                  disabled={testing}
                  style={{
                    backgroundColor: colors.surface0,
                    paddingHorizontal: SPACING[4],
                    paddingVertical: SPACING[2],
                    borderRadius: BORDER_RADIUS.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                    opacity: testing ? 0.6 : 1,
                  }}
                >
                  <Text
                    style={{
                      color: colors.foreground,
                      fontWeight: FONT_WEIGHT.medium,
                      fontSize: FONT_SIZE.base,
                    }}
                  >
                    {testing ? 'Testing…' : 'Test'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
