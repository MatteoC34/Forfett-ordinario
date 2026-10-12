/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "1" nella build di anteprima: niente stampa né invii verso l'esterno. */
  readonly VITE_ANTEPRIMA?: string;
  readonly VITE_EMAIL_STUDIO?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  readonly VITE_PRIVACY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
