/// <reference types="vite/client" />

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.mp3" {
  const src: string;
  export default src;
}

declare module "*.webp" {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_ANIMATION_URL?: string;
  readonly VITE_IMAGE_BASE_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_PORTAL_APP?: string;
  readonly VITE_PORTAL_GAME_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
