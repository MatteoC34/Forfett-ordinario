import type { ParametriAnno } from "./parametri/tipi";

export interface PianoAcconti {
  /** Quanto dovuto in acconto in totale per l'anno. */
  totale: number;
  primaRata: number;
  secondaRata: number;
}

/**
 * Acconti d'imposta per l'anno N, calcolati col metodo storico sull'imposta
 * dell'anno N-1 (IRPEF o sostitutiva, stessa regola). Sotto la soglia minima
 * non si versa nulla; sotto la soglia di rata unica si versa tutto a
 * novembre; altrimenti 40% a giugno e 60% a novembre.
 */
export function accontiImposta(impostaAnnoPrecedente: number, parametri: ParametriAnno): PianoAcconti {
  const a = parametri.acconti;
  if (impostaAnnoPrecedente <= a.sogliaMinima) return { totale: 0, primaRata: 0, secondaRata: 0 };
  const totale = impostaAnnoPrecedente * a.percentuale;
  if (totale <= a.sogliaUnicaRata) return { totale, primaRata: 0, secondaRata: totale };
  const primaRata = totale * a.primaRata;
  return { totale, primaRata, secondaRata: totale - primaRata };
}

/**
 * Acconti previdenziali (Gestione Separata 80%, artigiani/commercianti 100%
 * sull'eccedenza) in due rate uguali. Nessuna soglia minima.
 */
export function accontiContributi(
  contributiVariabiliAnnoPrecedente: number,
  regola: { percentuale: number; primaRata: number },
): PianoAcconti {
  if (contributiVariabiliAnnoPrecedente <= 0) return { totale: 0, primaRata: 0, secondaRata: 0 };
  const totale = contributiVariabiliAnnoPrecedente * regola.percentuale;
  const primaRata = totale * regola.primaRata;
  return { totale, primaRata, secondaRata: totale - primaRata };
}
