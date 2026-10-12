import type { Profilo } from "./tipi";
import { ADDIZIONALI_LAZIO_ROMA } from "./parametri/addizionali";

/** Un profilo di partenza ragionevole: professionista nuovo, Gestione Separata, Roma. */
export function profiloBase(sovrascrivi: Partial<Profilo> = {}): Profilo {
  return {
    annoInizio: 2026,
    annoAperturaPiva: 2026,
    natura: "professionista",
    gruppoCoefficiente: "professionali_tecnici_sanitari",
    ricaviPerAnno: [50_000, 50_000, 50_000],
    requisitiStartup: true,
    redditoDipendenteAnnoPrecedente: 0,
    altriRedditiIrpef: 0,
    speseLavoroDipendente: 0,
    previdenza: { tipo: "gestione_separata", altraCopertura: false, rivalsaInFattura: false },
    costi: {},
    quotaRicaviConRitenuta: 0,
    fattureAnnue: 12,
    bolloRiaddebitato: false,
    periodicitaIva: "trimestrale",
    aliquotaIva: 0.22,
    quotaCostiConIva: 1,
    addizionali: ADDIZIONALI_LAZIO_ROMA,
    ...sovrascrivi,
  };
}
