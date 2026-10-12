import type { CostiOrdinario } from "./tipi";
import type { ParametriAnno } from "./parametri/tipi";
import { somma } from "./utilita";

/** Quanto esce davvero dalla tasca del contribuente, a prescindere dal regime. */
export function costiReali(c: CostiOrdinario): number {
  return somma([c.interamenteDeducibili, c.auto, c.telefonia, c.vittoAlloggio, c.rappresentanza, c.formazione]) + c.beniStrumentali;
}

export interface CostiDeducibiliDettaglio {
  totale: number;
  voci: Array<{ voce: string; sostenuto: number; dedotto: number; regola: string }>;
}

/**
 * Costi deducibili nell'ordinario (TUIR artt. 54 e 66), con le percentuali e
 * i tetti dell'anno. I beni strumentali si ammortizzano per quote: qui si
 * assume l'acquisto nel primo anno simulato e la quota annua costante.
 */
export function costiDeducibili(
  c: CostiOrdinario,
  ricavi: number,
  anniDalPrimo: number,
  parametri: ParametriAnno,
): CostiDeducibiliDettaglio {
  const d = parametri.deducibilita;
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const voci: CostiDeducibiliDettaglio["voci"] = [];

  voci.push({ voce: "Costi interamente deducibili", sostenuto: c.interamenteDeducibili, dedotto: c.interamenteDeducibili, regola: "100%" });
  voci.push({ voce: "Auto", sostenuto: c.auto, dedotto: c.auto * d.auto, regola: `${pct(d.auto)} (art. 164 TUIR)` });
  voci.push({ voce: "Telefonia", sostenuto: c.telefonia, dedotto: c.telefonia * d.telefonia, regola: `${pct(d.telefonia)}` });
  const vittoTetto = ricavi * d.vittoAlloggioTettoSuCompensi;
  voci.push({
    voce: "Vitto e alloggio",
    sostenuto: c.vittoAlloggio,
    dedotto: Math.min(c.vittoAlloggio * d.vittoAlloggio, vittoTetto),
    regola: `${pct(d.vittoAlloggio)}, entro il ${pct(d.vittoAlloggioTettoSuCompensi)} dei compensi`,
  });
  voci.push({
    voce: "Rappresentanza",
    sostenuto: c.rappresentanza,
    dedotto: Math.min(c.rappresentanza, ricavi * d.rappresentanzaTettoSuCompensi),
    regola: `entro l'${pct(d.rappresentanzaTettoSuCompensi)} dei compensi`,
  });
  voci.push({
    voce: "Formazione",
    sostenuto: c.formazione,
    dedotto: Math.min(c.formazione, d.formazioneTetto),
    regola: `100% entro ${d.formazioneTetto.toLocaleString("it-IT")} €`,
  });

  let quotaBeni = 0;
  let regolaBeni = "ammortamento";
  if (c.beniStrumentali > 0) {
    if (c.beniStrumentali <= d.beniStrumentaliSogliaIntegrale) {
      quotaBeni = anniDalPrimo === 0 ? c.beniStrumentali : 0;
      regolaBeni = `intero nell'anno (sotto ${d.beniStrumentaliSogliaIntegrale} €)`;
    } else {
      const anniAmmortamento = Math.round(1 / d.ammortamentoAnnuo);
      quotaBeni = anniDalPrimo < anniAmmortamento ? c.beniStrumentali * d.ammortamentoAnnuo : 0;
      regolaBeni = `quota ${pct(d.ammortamentoAnnuo)} l'anno per ${anniAmmortamento} anni`;
    }
  }
  voci.push({ voce: "Beni strumentali", sostenuto: anniDalPrimo === 0 ? c.beniStrumentali : 0, dedotto: quotaBeni, regola: regolaBeni });

  return { totale: somma(voci.map((v) => v.dedotto)), voci };
}

/** IVA detraibile sui costi: auto e telefonia hanno detrazione limitata. */
export function ivaDetraibileSuiCosti(c: CostiOrdinario, aliquotaIva: number, quotaCostiConIva: number): number {
  const base =
    (c.interamenteDeducibili + c.vittoAlloggio + c.rappresentanza + c.formazione + c.beniStrumentali) * quotaCostiConIva +
    c.auto * 0.4 +
    c.telefonia * 0.5;
  return base * aliquotaIva;
}
