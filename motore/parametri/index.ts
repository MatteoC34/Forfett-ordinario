import type { ParametriAnno } from "./tipi";
import { PARAMETRI_2026 } from "./2026";

const PER_ANNO: Record<number, ParametriAnno> = {
  2026: PARAMETRI_2026,
};

/**
 * Parametri per un anno. Se l'anno non è ancora pubblicato si usa l'ultimo
 * disponibile: la simulazione su tre anni guarda avanti e la Legge di
 * Bilancio no.
 */
export function parametriPerAnno(anno: number): ParametriAnno {
  if (PER_ANNO[anno]) return PER_ANNO[anno];
  const anni = Object.keys(PER_ANNO).map(Number).sort((a, b) => a - b);
  const ultimo = anni[anni.length - 1];
  return PER_ANNO[ultimo];
}

export const ANNI_DISPONIBILI = Object.keys(PER_ANNO).map(Number);
export type { ParametriAnno, Fonte, Scaglione } from "./tipi";
