import type { CostiOrdinario, NaturaAttivita, Profilo } from "./tipi";
import { calcolaSpese, type SpeseCalcolate } from "./catalogoCosti";

export interface ContestoCosti {
  natura: NaturaAttivita;
  ricavi: number;
  anniDalPrimo: number;
  agente?: boolean;
}

/** Le spese dell'anno calcolate col catalogo: totale reale, dedotto, IVA pagata e recuperata. */
export function spese(costi: CostiOrdinario, ctx: ContestoCosti): SpeseCalcolate {
  return calcolaSpese(costi, ctx);
}

/** Quanto esce davvero dalla tasca del contribuente, IVA esclusa, a prescindere dal regime. */
export function costiReali(costi: CostiOrdinario, ctx: ContestoCosti): number {
  return calcolaSpese(costi, ctx).totale;
}

export interface CostiDeducibiliDettaglio {
  totale: number;
  voci: Array<{ voce: string; sostenuto: number; dedotto: number; regola: string }>;
}

/** Costi deducibili nell'ordinario, voce per voce, con le regole del catalogo. */
export function costiDeducibili(costi: CostiOrdinario, ctx: ContestoCosti): CostiDeducibiliDettaglio {
  const s = calcolaSpese(costi, ctx);
  return {
    totale: s.dedotto,
    voci: s.righe.filter((r) => r.importo > 0).map((r) => ({ voce: r.voce.nome, sostenuto: r.importo, dedotto: r.dedotto, regola: r.voce.regola(ctx) })),
  };
}

/** Il contesto delle regole sui costi per un profilo in un anno. */
export function contestoCosti(profilo: Profilo, ricavi: number, anno: number): ContestoCosti {
  return {
    natura: profilo.natura,
    ricavi,
    anniDalPrimo: anno - profilo.annoInizio,
    agente: profilo.gruppoCoefficiente === "intermediari_commercio",
  };
}
