/**
 * Le poche cose che cambiano tra un'installazione e l'altra. Si impostano
 * con variabili d'ambiente al momento della build (file `.env`), mai nel codice.
 */
export const CONFIG = {
  /** Build di anteprima: la pagina gira in una cornice che non stampa e non invia. */
  anteprima: import.meta.env.VITE_ANTEPRIMA === "1",
  emailStudio: import.meta.env.VITE_EMAIL_STUDIO || "hello@consulting34.com",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  privacyUrl: import.meta.env.VITE_PRIVACY_URL || "",
  studio: {
    nome: "Consulting/34 STP",
    indirizzo: "Via di Affogalasino 34, 00148 Roma",
    piva: "15573151006",
    referente: "Alessandro Filipponi",
  },
} as const;

export const invioAttivo = () => !CONFIG.anteprima && !!CONFIG.supabaseUrl && !!CONFIG.supabaseAnonKey;
