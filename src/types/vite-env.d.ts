/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RECAPTCHA_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  grecaptcha?: {
    render: (container: HTMLElement, options: Record<string, any>) => number;
    reset: (widgetId?: number) => void;
  };
}
