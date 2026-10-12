import type { Profilo, RisultatoAnno } from "./tipi";
import type { ParametriAnno } from "./parametri/tipi";
import { calcolaContributi } from "./previdenza";
import { costiDeducibili, costiReali, ivaDetraibileSuiCosti } from "./costi";
import { addizionaleRegionaleSu, impostaIncrementale } from "./utilita";

/** Detrazione per redditi di lavoro autonomo e impresa minore (art. 13 c. 5 TUIR). */
export function detrazioneAutonomi(redditoComplessivo: number, parametri: ParametriAnno): number {
  const d = parametri.irpef.detrazioneAutonomi;
  if (redditoComplessivo <= 0) return 0;
  if (redditoComplessivo <= d.redditoPieno) return d.importoPieno;
  const maggiorazione =
    redditoComplessivo > d.maggiorazione.da && redditoComplessivo <= d.maggiorazione.a ? d.maggiorazione.importo : 0;
  if (redditoComplessivo <= d.redditoIntermedio) {
    return maggiorazione + d.importoBase + d.quotaDecrescente * ((d.redditoIntermedio - redditoComplessivo) / (d.redditoIntermedio - d.redditoPieno));
  }
  if (redditoComplessivo <= d.redditoMassimo) {
    return d.importoBase * ((d.redditoMassimo - redditoComplessivo) / (d.redditoMassimo - d.redditoIntermedio));
  }
  return 0;
}

export const ALIQUOTA_RITENUTA = 0.20;

/**
 * Un anno nel regime ordinario (semplificato per cassa o professionista art. 54).
 * L'IRPEF è calcolata in modo incrementale: solo la parte che il reddito di
 * lavoro autonomo aggiunge sopra gli altri redditi già tassati. Così il
 * confronto con il forfettario è a parità di tutto il resto.
 */
export function calcolaOrdinarioAnno(
  profilo: Profilo,
  anno: number,
  ricavi: number,
  contributiVersatiNellAnno: number,
  parametri: ParametriAnno,
): Omit<RisultatoAnno, "versamenti" | "nettoCassa" | "applicabile" | "motiviNonApplicabile" | "accontiVersati"> {
  const avvisi: string[] = [];
  const rivalsa =
    profilo.previdenza.tipo === "gestione_separata" && profilo.previdenza.rivalsaInFattura
      ? ricavi * parametri.gestioneSeparata.rivalsa
      : 0;
  const ricaviFiscali = ricavi + rivalsa;

  const deducibili = costiDeducibili(profilo.costi, ricaviFiscali, anno - profilo.annoInizio, parametri);
  const redditoLordo = Math.max(0, ricaviFiscali - deducibili.totale);

  const contributi = calcolaContributi(profilo.previdenza, redditoLordo, {
    anno,
    annoAperturaPiva: profilo.annoAperturaPiva,
    regime: "ordinario",
    ricavi,
    parametri,
  });

  const redditoImponibile = Math.max(0, redditoLordo - contributiVersatiNellAnno);
  const altri = Math.max(0, profilo.altriRedditiIrpef);
  const lorda = impostaIncrementale(altri, redditoImponibile, parametri.irpef.scaglioni);

  // La detrazione per lavoro autonomo non si cumula con quella da dipendente
  // (art. 13 c. 6): se ci sono altri redditi da lavoro si assume già usata.
  const detrazioni = altri > 0 ? 0 : Math.min(lorda, detrazioneAutonomi(redditoImponibile, parametri));
  if (altri > 0) avvisi.push("Hai altri redditi: il reddito di lavoro autonomo si somma e paga l'IRPEF sugli scaglioni più alti.");

  const complessivo = altri + redditoImponibile;
  const addizionaleRegionale = Math.max(
    0,
    addizionaleRegionaleSu(complessivo, profilo.addizionali.regionale) - addizionaleRegionaleSu(altri, profilo.addizionali.regionale),
  );
  const com = profilo.addizionali.comunale;
  const comunaleSu = (r: number) => (r > com.esenzioneFino ? r * com.aliquota : 0);
  const addizionaleComunale = Math.max(0, comunaleSu(complessivo) - comunaleSu(altri));

  const netta = Math.max(0, lorda - detrazioni) + addizionaleRegionale + addizionaleComunale;

  const ritenuteSubite = profilo.natura === "professionista" ? ricaviFiscali * profilo.quotaRicaviConRitenuta * ALIQUOTA_RITENUTA : 0;
  if (ritenuteSubite > 0) avvisi.push("Parte dei compensi subisce la ritenuta d'acconto del 20%: anticipi l'IRPEF in fattura e la recuperi a saldo.");

  const ivaDebito = ricaviFiscali * profilo.aliquotaIva;
  const ivaCredito = ivaDetraibileSuiCosti(profilo.costi, profilo.aliquotaIva, profilo.quotaCostiConIva);
  const ivaDaVersare = Math.max(0, ivaDebito - ivaCredito);

  const costi = costiReali(profilo.costi);
  const nettoCompetenza = ricaviFiscali - costi - netta - contributi.totale;

  return {
    anno,
    regime: "ordinario",
    avvisi,
    ricavi,
    ricaviFiscali,
    costiReali: costi,
    costiDeducibili: deducibili.totale,
    contributi,
    contributiVersatiNellAnno,
    imposta: {
      redditoImponibile,
      lorda,
      detrazioni,
      addizionaleRegionale,
      addizionaleComunale,
      netta,
      aliquotaEffettiva: ricaviFiscali > 0 ? netta / ricaviFiscali : 0,
    },
    ritenuteSubite,
    bollo: 0,
    ivaDaVersare,
    nettoCompetenza,
  };
}
