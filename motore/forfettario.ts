import type { Profilo, RisultatoAnno } from "./tipi";
import type { ParametriAnno } from "./parametri/tipi";
import { calcolaContributi } from "./previdenza";
import { spese } from "./costi";

export interface VerificaForfettario {
  applicabile: boolean;
  motivi: string[];
  avvisi: string[];
}

/**
 * Il forfettario si può usare nell'anno N? Le cause di esclusione guardano
 * all'anno precedente (ricavi, redditi da dipendente, spese per personale);
 * i 100.000 € guardano all'anno stesso e fanno uscire subito.
 */
export function verificaForfettario(
  profilo: Profilo,
  anno: number,
  ricaviAnno: number,
  ricaviAnnoPrecedente: number | null,
  parametri: ParametriAnno,
): VerificaForfettario {
  const f = parametri.forfettario;
  const motivi: string[] = [];
  const avvisi: string[] = [];
  const euro = (n: number) => n.toLocaleString("it-IT") + " €";

  if (ricaviAnno > f.limiteUscitaImmediata) {
    motivi.push(`Ricavi oltre ${euro(f.limiteUscitaImmediata)}: si esce dal forfettario nello stesso anno, con IVA dovuta dal superamento.`);
  }
  if (ricaviAnnoPrecedente != null && ricaviAnnoPrecedente > f.limiteRicavi) {
    motivi.push(`Ricavi dell'anno precedente oltre ${euro(f.limiteRicavi)}: dall'anno successivo si passa all'ordinario.`);
  }
  const redditoDipendente = anno === profilo.annoInizio ? profilo.redditoDipendenteAnnoPrecedente : profilo.altriRedditiIrpef;
  if (redditoDipendente > f.sogliaRedditoDipendente) {
    motivi.push(`Redditi da lavoro dipendente o pensione dell'anno precedente oltre ${euro(f.sogliaRedditoDipendente)} (art. 1 c. 57 lett. d-ter L. 190/2014).`);
  }
  const speseLavoro = Math.max(profilo.speseLavoroDipendente, spese(profilo.costi, { natura: profilo.natura, ricavi: ricaviAnno, anniDalPrimo: 0 }).speseLavoro);
  if (anno > profilo.annoAperturaPiva && speseLavoro > f.limiteSpeseLavoro) {
    motivi.push(`Spese per dipendenti e collaboratori dell'anno precedente oltre ${euro(f.limiteSpeseLavoro)} (art. 1 c. 54 lett. b).`);
  }

  if (motivi.length === 0 && ricaviAnno > f.limiteRicavi) {
    avvisi.push(`Ricavi oltre ${euro(f.limiteRicavi)}: quest'anno resti nel forfettario, dal prossimo passi all'ordinario.`);
  }
  if (motivi.length === 0 && speseLavoro > f.limiteSpeseLavoro) {
    avvisi.push(`Spese per personale oltre ${euro(f.limiteSpeseLavoro)}: dall'anno prossimo il forfettario non è più applicabile.`);
  }
  return { applicabile: motivi.length === 0, motivi, avvisi };
}

export function aliquotaForfettario(profilo: Profilo, anno: number, parametri: ParametriAnno): number {
  const f = parametri.forfettario;
  const anniAttivita = anno - profilo.annoAperturaPiva;
  return profilo.requisitiStartup && anniAttivita < f.anniStartup ? f.impostaStartup : f.impostaOrdinaria;
}

/**
 * Un anno nel forfettario, in competenza. I contributi dedotti sono quelli
 * versati nell'anno, che il chiamante conosce dal calendario.
 */
export function calcolaForfettarioAnno(
  profilo: Profilo,
  anno: number,
  ricavi: number,
  contributiVersatiNellAnno: number,
  parametri: ParametriAnno,
): Omit<RisultatoAnno, "versamenti" | "nettoCassa" | "applicabile" | "motiviNonApplicabile" | "accontiVersati"> {
  const f = parametri.forfettario;
  const avvisi: string[] = [];
  const coefficiente = f.coefficienti[profilo.gruppoCoefficiente];

  // Bollo: dovuto sulle fatture senza IVA sopra la soglia. Se riaddebitato è un ricavo.
  const importoMedioFattura = profilo.fattureAnnue > 0 ? ricavi / profilo.fattureAnnue : 0;
  const bollo = importoMedioFattura > parametri.bollo.sogliaFattura ? profilo.fattureAnnue * parametri.bollo.importo : 0;
  const bolloRiaddebitato = profilo.bolloRiaddebitato ? bollo : 0;

  const rivalsa =
    profilo.previdenza.tipo === "gestione_separata" && profilo.previdenza.rivalsaInFattura
      ? ricavi * parametri.gestioneSeparata.rivalsa
      : 0;
  const ricaviFiscali = ricavi + rivalsa + bolloRiaddebitato;
  if (bolloRiaddebitato > 0) avvisi.push("Il bollo riaddebitato al cliente concorre al reddito (risposta AdE 428/2022).");

  const redditoLordo = ricaviFiscali * coefficiente;
  const contributi = calcolaContributi(profilo.previdenza, redditoLordo, {
    anno,
    annoAperturaPiva: profilo.annoAperturaPiva,
    regime: "forfettario",
    ricavi,
    parametri,
  });

  const redditoImponibile = Math.max(0, redditoLordo - contributiVersatiNellAnno);
  const aliquota = aliquotaForfettario(profilo, anno, parametri);
  const impostaNetta = redditoImponibile * aliquota;
  if (aliquota === f.impostaStartup) {
    const ultimoAnno = profilo.annoAperturaPiva + f.anniStartup - 1;
    avvisi.push(`Aliquota 5% start-up fino al ${ultimoAnno}; dal ${ultimoAnno + 1} si passa al 15%.`);
  }

  // Il bollo non sta nei costi: lo toglie la simulazione, che lo mette anche in calendario.
  // L'IVA sugli acquisti nel forfettario non si recupera: è un costo vero.
  const sp = spese(profilo.costi, { natura: profilo.natura, ricavi, anniDalPrimo: anno - profilo.annoInizio });
  const costi = sp.totale;
  const ivaSuAcquistiNonRecuperata = sp.ivaPagata;
  const nettoCompetenza = ricaviFiscali - costi - ivaSuAcquistiNonRecuperata - impostaNetta - contributi.totale;

  return {
    anno,
    regime: "forfettario",
    avvisi,
    ricavi,
    ricaviFiscali,
    costiReali: costi,
    costiDeducibili: 0,
    contributi,
    contributiVersatiNellAnno,
    imposta: {
      redditoImponibile,
      lorda: impostaNetta,
      detrazioni: 0,
      addizionaleRegionale: 0,
      addizionaleComunale: 0,
      netta: impostaNetta,
      aliquotaEffettiva: ricaviFiscali > 0 ? impostaNetta / ricaviFiscali : 0,
    },
    ritenuteSubite: 0,
    bollo,
    ivaDaVersare: 0,
    ivaSuAcquistiNonRecuperata,
    nettoCompetenza,
  };
}
