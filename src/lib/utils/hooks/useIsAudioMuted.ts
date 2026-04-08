const LOCAL_STORAGE_KEY = "settings.audioMuted";
export const AUDIO_MUTED_EVENT = "audioMutedChanged";

export function cacheAudioMutedSetting(value: boolean) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(AUDIO_MUTED_EVENT, { detail: value }));
}

export function getAudioMutedSetting(): boolean {
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  return cached ? JSON.parse(cached) : false;
}
