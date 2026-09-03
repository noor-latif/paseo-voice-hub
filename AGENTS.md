# paseo-voice-hub — agent notes

Plugin for Paseo voice (Groq STT/TTS via 127.0.0.1:8789). Must look indistinguishable from host settings.

## Paseo design system — where things live

- **Tokens**: `packages/app/src/styles/theme.ts` — `SPACING`, `FONT_SIZE`, `BORDER_RADIUS`, `ICON_SIZE`, `FONT_WEIGHT`, `BORDER_WIDTH`, `OPACITY` (via `StyleSheet.create((theme)=>...)` + `react-native-unistyles`). Control heights (`TIGHT 28 / COMPACT 32 / FIELD 44`) and geometry helpers live in `packages/app/src/components/ui/control-geometry.ts` (`CONTROL_HEIGHTS`, `fieldLineHeight`, `createControlGeometry`).
- **Shadows**: host has `darkShadow` (`sm 0.25 / md 0.20 / lg 0.40`) and `lightShadow` (`sm 0.02 / md 0.04 / lg 0.08`) in `theme.ts`. This plugin's `theme.ts` SHADOW (`sm 0.08 / md 0.16 / lg 0.40`) is an approximate vendor copy — not verbatim — because the plugin can't import the theme's shadow object.
- **Settings primitives**: `packages/app/src/styles/settings.ts` (`settingsStyles`) + `packages/app/src/screens/settings/settings-section.tsx` (`SettingsSection`) + `settings-group.tsx` (`SettingsGroup`) + `settings-info-tip.tsx` (`SettingsInfoTip`). This plugin vendors them as `theme.ts` + `control-geometry.ts` + `styles/settings.ts` (mirroring host paths) because **plugin SDK only exposes 11 colors** (`paseo-plugin.d.ts:118-132` — `surface0/1/2`, `border`, `foreground/muted`, `accent/accentForeground`, `statusSuccess/Warning/Danger`). Spacing/font/radius/icon must be vendored — values for `SPACING`/`FONT_SIZE`/`BORDER_RADIUS`/`ICON_SIZE` are verbatim from `theme.ts`, control heights from `control-geometry.ts`.
- **Design rules**: `docs/design.md` — calm/spacious, `fontSize.base 14` (controls) vs `content 15` (prose), weight `normal` inside surfaces / `medium` for structural labels and section titles (`SettingsSection` uses `medium`), `foreground` vs `foregroundMuted`, at most one `accent` CTA per page (usually zero on settings), `settingsStyles.card` (surface1, `borderRadius.lg 8`, border) + `row` (vertical `spacing[4] 16`) + `rowBorder` + `rowHint`. Section header is muted `sm`. Centered 720 max-width (`settings-screen.tsx:117`, `projects-screen.tsx`).
- **Plugin contract**: `paseo-plugin.d.ts` + `skills/paseo-plugin/SKILL.md` + `plugin-examples/local-plugin`. Available in plugin: `Icon` from `@getpaseo/plugin` (lucide names), `useToast()` from `@getpaseo/plugin/react-native`, `useRpc()`, `usePaseo()`, `Modal`. No `Button`, `DropdownMenu`, `Combobox`, `Tooltip`, `SegmentedControl` — hand-roll with `Icon`. All colors come from `theme.colors`; `layout.compact`/`layout.platform` drives spacing density.

## What looks non-maintainer (audit)

- Unicode glyphs `◐ ⌕ ▼ ✓` + `i` circle → use `Icon name="Globe|Search|ChevronDown|Check|Mic|Info"` `size={ICON_SIZE.sm 14}` `color={colors.foregroundMuted|foreground}`
- Custom `msg` state + colored banner → `useToast().show(msg, {variant:'success|error'})` (host uses `Alert` for page-level, `useToast` for transient)
- Hero title `Voice Hub` + subtitle inside surface → remove, sidebar owns title; surface starts at `Connection`
- Per-row `RowInfo` hover tooltip → `rowHint` text under `rowTitle` (`s.rowHint` — muted `sm`). `info` only on section header via `SettingsInfoTip` pattern if needed.
- `Pressable`+`absolute View` dropdowns ok (plugin has no combobox) but must use `Icon` for chevron/check/search, not glyphs; avoid `top:'100%' as unknown as number` → numeric `top:44/36` (host uses `FloatingSurface`/`OverlayRoot`, not available here)
- `Record<string,unknown> row` + `style as never` + `colors as never` → type `PluginTheme['colors']`, `useMemo` styles, no casts
- 11× `useState` scatter + no hydration (empty form on open) → single `useState<VoiceHubSettings> form` + `useEffect(()=>get({}).then(setForm))` via `getSettings` RPC; `loading` + `isSaving/isTesting` + `useCallback`/`useMemo`
- `ScrollView style={{flex:1, backgroundColor}}` + `contentContainerStyle` → wrapper `View {flex:1, backgroundColor:surface0}` + `ScrollView contentContainerStyle {padding:4, gap:3, maxWidth:720, alignSelf:'center', width:'100%'}` (required by `docs/unistyles.md` wrapper-View rule)
- `Segmented` selected `surface2` in plugin maps to host's `surface3` (`segmented-control.tsx:199` — host `segmentSelected: surface3`); plugin theme has only `surface0/1/2`, so `surface2` is the closest available

## Plugin wiring

- `paseo-plugin.json` is strictly `{ id, build? }` (`packages/server/src/server/plugins/manifest.ts:10-15` — `.strict()`). Only `id` (validated by `PluginIdSchema`) and optional `build` (array of argv arrays) are allowed — `description` or other keys break install (`strict()` throws).
- `shared.ts` RPCs: `saveSettings`, `testVoice`, `getSettings` (`defineRpc` zod). Store in `store.ts` (`~/.paseo/plugins/voice-hub/settings.json` atomic `writeFile tmp→rename` + `serialize` Map). `index.ts` `plugin.handle(getSettings, ()=>store.get())`; daemon speech config + proxy in `service.ts` (`ensureDaemonSpeechConfig` patches `~/.paseo/config.json` `features.dictation/voiceMode` + `providers.openai`, `startProxy` 127.0.0.1:8789).
- Client: `MainSurface({theme, layout})` — colors from `theme.colors`, layout from `layout.compact`, spacing/tokens from `./theme` + `./control-geometry`, styles from `./styles/settings`.

## Commands

```bash
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run format     # prettier --write
curl -fsS http://127.0.0.1:8789/health  # -> {hasKey:true}
```

### Plugin reload vs update (git-sourced install)

This plugin is installed via `git` (`paseo plugin list` shows `source: git` at `~/.paseo/plugins/voice-hub/*/checkout`).

* `paseo plugin reload voice-hub` — re-reads the **current checkout on disk** (including uncommitted `cp`'d changes). Use for local iteration without pushing.
* `paseo plugin update voice-hub` — does `git pull --ff-only origin main` in the checkout, then reloads. Use **after** `git push` in `~/dev/paseo-voice-hub` to pull the committed version. It will `reset --hard` and discard any uncommitted `cp` patches — re-apply `cp` after if you still need local patches.
* `paseo plugin logs voice-hub` — tail the plugin's stdout/stderr; check for `Plugin ready` or `hasKey` errors after reload/update.

**Local loop:** edit `~/dev/paseo-voice-hub/main.client.tsx` → `cp main.client.tsx theme.ts control-geometry.ts styles/settings.ts shared.ts index.ts ~/.paseo/plugins/voice-hub/*/checkout/` → `paseo plugin reload voice-hub` → `paseo plugin logs voice-hub` + `npm run typecheck` (same turn).
**Publish loop:** `git commit && git push origin main` → `paseo plugin update voice-hub` → verify.

## Agentic workflow — reduce prompt fatigue / babysitting

**Use the skill, not ad-hoc prompts.** Load `skill://paseo-plugin` for any UI/behavior change; it enforces `theme.ts`/`control-geometry.ts`/`styles/settings.ts` vendoring, `PluginTheme` 11-color limit, and `paseo-plugin.json` strictness. For multi-file refactors use `task` subagents with a shared `Contract` (interfaces in `shared.ts`), not sequential `edit` loops.

**Single source of truth:** `~/dev/paseo-voice-hub/main.client.tsx` is the dev checkout. Never edit `~/.paseo/plugins/voice-hub/*/checkout` directly as primary — edit dev, then `cp main.client.tsx theme.ts control-geometry.ts styles/settings.ts shared.ts index.ts` to checkout and `paseo plugin reload voice-hub`. Verify with `paseo plugin logs voice-hub` and `npm run typecheck` in the same turn; do not ask the user to re-run checks they already reported.

**DRY primitives:** Reuse `SearchableDropdown` (`width`/`dropdownWidth`/`icon`/`searchable`) via `useDropdownManager().bind(id)` — one `openId` state for N dropdowns, `right:0 + width:dropdownWidth` list wider than `width` trigger (e.g. `140→220` for Language, `140→260` for Voice), `position:relative` on `section`/`card`/`row` for `zIndex` stacking, `showsVerticalScrollIndicator={false}`. Adding a form is one line: `<SearchableDropdown {...dropdowns.bind('newId')} ... />` — no new `useState`/`zIndex` plumbing. Search `TextInput` must have `outlineStyle:'none'` (web-only) to suppress `*:focus-visible` green ring.

**Design parity check:** After any UI change, compare against `packages/app/src/components/ui/combobox.tsx` (portal `overlay-root`, `FloatingSurface`, `buildDesktopFrameStyle`) and `docs/design.md#Pickers`/`floating-panels.md` — plugin can't use `getOverlayRoot`/`createPortal`, so emulate with `Modal` or `position:absolute` + `zIndex` + `surface0` opaque `elevation` and centered `720 max-width` wrapper. Run `npm run typecheck && npm run lint` before yielding; do not yield with `typecheck` errors or `checkout` divergence (`wc -l` dev vs checkout, `grep -c SearchableDropdown`).

**Commit hygiene:** Small, frequent commits after each logical change (`git commit -m "fix: ..."`), `nixos-rebuild` not needed for plugin work. Never commit secrets or `~/.paseo` state.
