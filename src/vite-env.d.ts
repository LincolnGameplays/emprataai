/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_AI_KEY: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_LICENSE_PUBLIC_KEY: string;
  readonly VITE_ENCRYPTION_SECRET: string;
  // ... adicione outras
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Corrige erro de 'window.recaptchaVerifier' se houver
interface Window {
  recaptchaVerifier: any;
  confirmationResult: any;
}
