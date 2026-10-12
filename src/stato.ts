import type { CostiOrdinario, GruppoCoefficiente, NaturaAttivita, Profilo, Previdenza } from "@motore/tipi";
import { importiSuggeriti } from "@motore/catalogoCosti";
import { parametriPerAnno } from "@motore/parametri";
import { ADDIZIONALI_LAZIO_ROMA, addizionaliSemplici } from "@motore/parametri/addizionali";

/**
 * Lo stato del percorso guidato: parla la lingua del cliente ("che lavoro
 * fai", "quanto pensi di fatturare") e si traduce in un Profilo per il motore.
 */
export interface Risposte {
  natura: NaturaAttivita;
  gruppo: GruppoCoefficiente;
  nuovaAttivita: boolean;
  annoApertura: number;
  /** Le tre condizioni del 5% start-up, una per una. */
  startup: { nessunaAttivitaTreAnni: boolean; nonProsecuzione: boolean };
  ricavi: [number, number, number];
  ricaviCostanti: boolean;
  fattureAnnue: number;
  quotaVersoAziende: number;
  bolloRiaddebitato: boolean;
  altriRedditi: number;
  redditoDipendenteAnnoPrecedente: boolean;
  speseLavoro: number;
  previdenza: "gestione_separata" | "artigiani" | "commercianti" | "cassa";
  cassaId: string;
  altraCopertura: boolean;
  rivalsa: boolean;
  riduzione: "nessuna" | "35" | "50";
  esoneroDipendentePieno: boolean;
  agevolazioneGiovani: boolean;
  costi: CostiOrdinario;
  periodicitaIva: "mensile" | "trimestrale";
  abitaRoma: boolean;
  addizionaleRegionale: number;
  addizionaleComunale: number;
}

export const ANNO_CORRENTE = 2026;

export const risposteIniziali: Risposte = {
  natura: "professionista",
  gruppo: "professionali_tecnici_sanitari",
  nuovaAttivita: true,
  annoApertura: ANNO_CORRENTE,
  startup: { nessunaAttivitaTreAnni: true, nonProsecuzione: true },
  ricavi: [40_000, 45_000, 50_000],
  ricaviCostanti: false,
  fattureAnnue: 12,
  quotaVersoAziende: 0.5,
  bolloRiaddebitato: true,
  altriRedditi: 0,
  redditoDipendenteAnnoPrecedente: false,
  speseLavoro: 0,
  previdenza: "gestione_separata",
  cassaId: "cnpadc",
  altraCopertura: false,
  rivalsa: true,
  riduzione: "nessuna",
  esoneroDipendentePieno: false,
  agevolazioneGiovani: false,
  costi: importiSuggeriti(),
  periodicitaIva: "trimestrale",
  abitaRoma: true,
  addizionaleRegionale: 0.0173,
  addizionaleComunale: 0.008,
};

export function costruisciProfilo(r: Risposte): Profilo {
  const parametri = parametriPerAnno(ANNO_CORRENTE);
  let previdenza: Previdenza;
  switch (r.previdenza) {
    case "gestione_separata":
      previdenza = { tipo: "gestione_separata", altraCopertura: r.altraCopertura, rivalsaInFattura: r.rivalsa };
      break;
    case "artigiani":
    case "commercianti":
      previdenza = { tipo: r.previdenza, riduzione: r.riduzione, esoneroDipendentePieno: r.esoneroDipendentePieno };
      break;
    case "cassa":
      previdenza = { tipo: "cassa", cassa: parametri.casse[r.cassaId], agevolazioneGiovaniAttiva: r.agevolazioneGiovani };
      break;
  }
  const ricavi = r.ricaviCostanti ? [r.ricavi[0], r.ricavi[0], r.ricavi[0]] : [...r.ricavi];
  return {
    annoInizio: ANNO_CORRENTE,
    annoAperturaPiva: r.nuovaAttivita ? ANNO_CORRENTE : r.annoApertura,
    natura: r.natura,
    gruppoCoefficiente: r.gruppo,
    ricaviPerAnno: ricavi,
    requisitiStartup: r.startup.nessunaAttivitaTreAnni && r.startup.nonProsecuzione,
    redditoDipendenteAnnoPrecedente: r.redditoDipendenteAnnoPrecedente ? parametri.forfettario.sogliaRedditoDipendente + 1 : 0,
    altriRedditiIrpef: r.altriRedditi,
    speseLavoroDipendente: r.speseLavoro,
    previdenza,
    costi: r.costi,
    quotaRicaviConRitenuta: r.quotaVersoAziende,
    fattureAnnue: r.fattureAnnue,
    bolloRiaddebitato: r.bolloRiaddebitato,
    periodicitaIva: r.periodicitaIva,
    aliquotaIva: 0.22,
    quotaCostiConIva: 1,
    addizionali: r.abitaRoma ? ADDIZIONALI_LAZIO_ROMA : addizionaliSemplici(r.addizionaleRegionale, r.addizionaleComunale),
  };
}

export const GRUPPI: Array<{ id: GruppoCoefficiente; nome: string; esempi: string; natura: NaturaAttivita[] }> = [
  { id: "professionali_tecnici_sanitari", nome: "Professioni, consulenza, sanità, istruzione", esempi: "consulente, sviluppatore, psicologo, avvocato, formatore, fisioterapista", natura: ["professionista"] },
  { id: "altre_attivita", nome: "Servizi e altre attività", esempi: "grafico, fotografo, artigiano, trasporti, agente di viaggio, servizi alla persona", natura: ["professionista", "impresa"] },
  { id: "intermediari_commercio", nome: "Agente o rappresentante di commercio", esempi: "procacciatore, agente plurimandatario", natura: ["impresa"] },
  { id: "commercio_ingrosso_dettaglio", nome: "Commercio all'ingrosso o al dettaglio", esempi: "negozio, e-commerce, ingrosso", natura: ["impresa"] },
  { id: "commercio_ambulante_alimentari", nome: "Commercio ambulante di alimentari e bevande", esempi: "banco al mercato, food truck", natura: ["impresa"] },
  { id: "commercio_ambulante_altri", nome: "Commercio ambulante di altri prodotti", esempi: "abbigliamento al mercato", natura: ["impresa"] },
  { id: "servizi_alloggio_ristorazione", nome: "Alloggio e ristorazione", esempi: "bar, ristorante, B&B, affittacamere", natura: ["impresa"] },
  { id: "industrie_alimentari", nome: "Produzione alimentare", esempi: "laboratorio, pasticceria, birrificio", natura: ["impresa"] },
  { id: "costruzioni_immobiliari", nome: "Costruzioni e immobiliare", esempi: "impresa edile, agente immobiliare", natura: ["impresa"] },
];
