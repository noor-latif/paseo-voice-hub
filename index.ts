import type { PluginContext } from '@getpaseo/plugin';
import type { Server } from 'node:http';
import { MainSurface } from './main.client';
import { getSettings, saveSettings, testVoice, type VoiceHubSettings } from './shared';
import { createVoiceHubStore } from './store';
import { createVoiceHubService } from './service';

export default function contribute(plugin: PluginContext) {
  const store = createVoiceHubStore();
  const service = createVoiceHubService();

  plugin.addSurface('main', MainSurface);
  plugin.addSidebarItem({ id: 'voice-hub', title: 'Voice Hub', icon: 'Mic', surface: 'main' });
  plugin.addCommandCenterItem({
    id: 'open-voice-hub',
    title: 'Open Voice Hub',
    icon: 'Mic',
    keywords: ['voice', 'speech', 'groq', 'stt', 'tts'],
    context: 'global',
    onSelect({ openSurface }) {
      openSurface('main');
    },
  });

  plugin.handle(getSettings, async () => store.get());

  plugin.handle(
    saveSettings,
    async ({ groqApiKey, provider, baseUrl, language, sttModel, ttsModel, ttsVoice }) => {
      const trimmed = groqApiKey?.trim();
      if (trimmed && provider === 'groq' && !trimmed.startsWith('gsk_'))
        throw new Error('Groq key should start with gsk_ — get one at console.groq.com/keys');
      if (provider === 'custom' && baseUrl && !baseUrl.startsWith('http'))
        throw new Error('Base URL should start with http');
      const next: VoiceHubSettings = {
        groqApiKey: trimmed || undefined,
        provider,
        baseUrl: provider === 'custom' ? baseUrl?.trim() || undefined : undefined,
        language,
        sttModel,
        ttsModel,
        ttsVoice,
      };
      await store.set(next);
      const { changed } = await service.ensureDaemonSpeechConfig(next);
      return { ...next, _daemonChanged: changed, _needsRestart: changed } as VoiceHubSettings & {
        _daemonChanged: boolean;
        _needsRestart: boolean;
      };
    }
  );

  plugin.handle(testVoice, async ({ text, voice }) => {
    const settings = await store.get();
    return service.testVoice(settings, text, voice);
  });
  let server: Server | null = null;

  void service
    .startProxy(() => store.get())
    .then((s) => {
      server = s;
    });

  return async () => {
    if (server) await new Promise<void>((r) => server!.close(() => r()));
  };
}
