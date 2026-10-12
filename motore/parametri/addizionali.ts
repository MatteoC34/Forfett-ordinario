import type { Addizionali } from "../tipi";

/**
 * Addizionali di default: Lazio e Roma Capitale, 2026.
 * Lazio: L.R. 20/2025 art. 2. Fino a 28.000 € aliquota unica 1,73%; oltre,
 * 1,73% fino a 15.000 e 3,33% sull'eccedenza, con 60 € di detrazione tra
 * 28.001 e 30.000. Roma: 0,90% con esenzione fino a 14.000 € (DAC 186/2024).
 */
export const ADDIZIONALI_LAZIO_ROMA: Addizionali = {
  regionale: {
    etichetta: "Lazio",
    scaglioni: [
      { fino: 15_000, aliquota: 0.0173 },
      { fino: null, aliquota: 0.0333 },
    ],
    aliquotaUnicaFino: { reddito: 28_000, aliquota: 0.0173 },
    detrazione: { da: 28_000, a: 30_000, importo: 60 },
  },
  comunale: { etichetta: "Roma", aliquota: 0.009, esenzioneFino: 14_000 },
};

/** Addizionali personalizzate: una sola aliquota regionale e una comunale. */
export function addizionaliSemplici(regionale: number, comunale: number, esenzioneComunale = 0): Addizionali {
  return {
    regionale: { etichetta: "personalizzata", scaglioni: [{ fino: null, aliquota: regionale }] },
    comunale: { etichetta: "personalizzata", aliquota: comunale, esenzioneFino: esenzioneComunale },
  };
}
