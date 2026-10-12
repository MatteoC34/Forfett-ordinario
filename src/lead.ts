import { CONFIG, invioAttivo } from "./config";
import type { Risposte } from "./stato";
import { GRUPPI, NOMI_PREVIDENZA, ricaviPerAnno } from "./stato";
import type { Modello } from "./risultato/useModello";
import { euro, oggiIt } from "./formato";

export interface Richiesta {
  nome: string;
  email: string;
  telefono: string;
  messaggio: string;
  consenso: boolean;
}

/** Il riepilogo in parole: va nell'email, nel testo da copiare e nella riga salvata. */
export function riepilogo(r: Risposte, m: Modello): string {
  const settore = GRUPPI.find((g) => g.id === r.gruppo)?.nome ?? r.gruppo;
  const c = m.confronto;
  const righe = [
    `Simulazione partita IVA del ${oggiIt()}`,
    `Attività: ${r.natura === "professionista" ? "professionista" : "impresa individuale"}, ${settore}`,
    `Apertura: ${r.nuovaAttivita ? "nel " + m.anni[0] : r.annoApertura}`,
    `Incassi: ${ricaviPerAnno(r).map(euro).join(" / ")}`,
    `Previdenza: ${r.previdenza === "cassa" ? m.profilo.previdenza.tipo === "cassa" ? m.profilo.previdenza.cassa.nome : "Cassa" : NOMI_PREVIDENZA[r.previdenza]}`,
    `Spese annue: ${euro(m.spese1.totale)}`,
    `Netto in tre anni: forfettario ${m.forfApplicabile ? euro(c.forfettario.totaleNettoCompetenza) : "non applicabile"}, ordinario ${euro(c.ordinario.totaleNettoCompetenza)}`,
    m.vince ? `Conviene: ${m.vince} (+${euro(Math.abs(c.differenzaNettoTotale))})` : "",
  ];
  return righe.filter(Boolean).join("\n");
}

export type EsitoInvio = { esito: "inviata" } | { esito: "manuale"; testo: string } | { esito: "errore"; messaggio: string };

/**
 * Manda la richiesta allo studio. Con il database configurato la salva; senza
 * (o nell'anteprima) restituisce il testo da mandare a mano: la pagina non
 * dice mai "inviato" se non lo è.
 */
export async function inviaRichiesta(richiesta: Richiesta, r: Risposte, m: Modello): Promise<EsitoInvio> {
  const testo = `${riepilogo(r, m)}\n\nNome: ${richiesta.nome}\nEmail: ${richiesta.email}${richiesta.telefono ? `\nTelefono: ${richiesta.telefono}` : ""}${richiesta.messaggio ? `\n\n${richiesta.messaggio}` : ""}`;
  if (!invioAttivo()) return { esito: "manuale", testo };
  try {
    const risposta = await fetch(`${CONFIG.supabaseUrl}/rest/v1/richieste_simulazione`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: CONFIG.supabaseAnonKey,
        // Le chiavi anon classiche sono JWT e vanno anche come Bearer; le nuove "sb_publishable" no.
        ...(CONFIG.supabaseAnonKey.startsWith("eyJ") ? { Authorization: `Bearer ${CONFIG.supabaseAnonKey}` } : {}),
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        nome: richiesta.nome,
        email: richiesta.email,
        telefono: richiesta.telefono || null,
        messaggio: richiesta.messaggio || null,
        consenso_privacy: richiesta.consenso,
        riepilogo: riepilogo(r, m),
        risposte: r,
        risultato: {
          netto_forfettario: m.forfApplicabile ? Math.round(m.confronto.forfettario.totaleNettoCompetenza) : null,
          netto_ordinario: Math.round(m.confronto.ordinario.totaleNettoCompetenza),
          conviene: m.vince,
          spese_annue: Math.round(m.spese1.totale),
        },
      }),
    });
    if (!risposta.ok) return { esito: "errore", messaggio: `Il server ha risposto ${risposta.status}. Riprova, oppure scrivici a ${CONFIG.emailStudio}.` };
    return { esito: "inviata" };
  } catch {
    return { esito: "errore", messaggio: `Connessione non riuscita. Riprova, oppure scrivici a ${CONFIG.emailStudio}.` };
  }
}

export function emailValida(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
}
