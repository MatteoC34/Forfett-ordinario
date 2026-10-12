import type { Scaglione } from "./parametri/tipi";

export function arrotonda(n: number, decimali = 2): number {
  const f = 10 ** decimali;
  return Math.round((n + Number.EPSILON) * f) / f;
}

export function limita(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Imposta per scaglioni progressivi su una base. */
export function applicaScaglioni(base: number, scaglioni: Scaglione[]): number {
  if (base <= 0) return 0;
  let imposta = 0;
  let precedente = 0;
  for (const s of scaglioni) {
    const tetto = s.fino ?? Infinity;
    const quota = Math.max(0, Math.min(base, tetto) - precedente);
    imposta += quota * s.aliquota;
    precedente = tetto;
    if (base <= tetto) break;
  }
  return imposta;
}

/** Imposta progressiva sulla sola parte di reddito che si aggiunge ad altri redditi già tassati. */
export function impostaIncrementale(altri: number, aggiunta: number, scaglioni: Scaglione[]): number {
  return applicaScaglioni(altri + aggiunta, scaglioni) - applicaScaglioni(altri, scaglioni);
}

/** "mm-gg" + anno -> "aaaa-mm-gg". */
export function dataIso(anno: number, meseGiorno: string): string {
  return `${anno}-${meseGiorno}`;
}

export function somma(valori: number[]): number {
  return valori.reduce((a, b) => a + b, 0);
}

import type { AddizionaleRegionale } from "./tipi";

/** Addizionale regionale su un reddito, con deroga ad aliquota unica e detrazione di fascia. */
export function addizionaleRegionaleSu(reddito: number, a: AddizionaleRegionale): number {
  if (reddito <= 0) return 0;
  let importo: number;
  if (a.aliquotaUnicaFino && reddito <= a.aliquotaUnicaFino.reddito) {
    importo = reddito * a.aliquotaUnicaFino.aliquota;
  } else {
    importo = applicaScaglioni(reddito, a.scaglioni);
  }
  if (a.detrazione && reddito > a.detrazione.da && reddito <= a.detrazione.a) {
    importo = Math.max(0, importo - a.detrazione.importo);
  }
  return importo;
}
