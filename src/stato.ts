import type { CostiOrdinario, GruppoCoefficiente, NaturaAttivita, Profilo, Previdenza } from "@motore/tipi";
import { importiSuggeriti } from "@motore/catalogoCosti";
import { parametriPerAnno } from "@motore/parametri";
import { ADDIZIONALI_LAZIO_ROMA, addizionaliSemplici } from "@motore/parametri/addizionali";

/**
 * Lo stato del percorso: parla la lingua del cliente ("che lavoro fai",
 * "quanto pensi di fatturare") e si traduce in un Profilo per il motore.
 */
export interface Risposte {
  natura: NaturaAttivita;
  gruppo: GruppoCoefficiente;
  nuovaAttivita: boolean;
  annoApertura: number;
  startup: { nessunaAttivitaTreAnni: boolean; nonProsecuzione: boolean };
  ricavi: [number, number, number];
  ricaviCostanti: boolean;
  fattureAnnue: number;
  quotaVersoAziende: number;
  bolloRiaddebitato: boolean;
  altriRedditi: number;
  redditoDipendenteAnnoPrecedente: boolean;
  previdenza: "gestione_separata" | "artigiani" | "commercianti" | "cassa";
  cassaId: string;
  altraCopertura: boolean;
  rivalsa: boolean;
  riduzione: "nessuna" | "35" | "50";
  esoneroDipendentePieno: boolean;
  agevolazioneGiovani: boolean;
  enasarcoTipo: "mono" | "pluri";
  enasarcoMandati: number;
  costi: CostiOrdinario;
  periodicitaIva: "mensile" | "trimestrale";
  abitaRoma: boolean;
  addizionaleRegionale: number;
  addizionaleComunale: number;
}

export const ANNO_CORRENTE = 2026;
export const CHIAVE_ARCHIVIO = "forfett-ordinario:risposte:v2";

export const risposteIniziali: Risposte = {
  natura: "professionista",
  gruppo: "professionali_tecnici_sanitari",
  nuovaAttivita: true,
  annoApertura: ANNO_CORRENTE - 1,
  startup: { nessunaAttivitaTreAnni: true, nonProsecuzione: true },
  ricavi: [45_000, 45_000, 45_000],
  ricaviCostanti: true,
  fattureAnnue: 12,
  quotaVersoAziende: 0.5,
  bolloRiaddebitato: true,
  altriRedditi: 0,
  redditoDipendenteAnnoPrecedente: false,
  previdenza: "gestione_separata",
  cassaId: "cnpadc",
  altraCopertura: false,
  rivalsa: true,
  riduzione: "nessuna",
  esoneroDipendentePieno: false,
  agevolazioneGiovani: false,
  enasarcoTipo: "mono",
  enasarcoMandati: 1,
  costi: importiSuggeriti(),
  periodicitaIva: "trimestrale",
  abitaRoma: true,
  addizionaleRegionale: 0.0173,
  addizionaleComunale: 0.008,
};

export const isAgente = (r: Pick<Risposte, "gruppo">) => r.gruppo === "intermediari_commercio";

/** I ricavi effettivi per anno: con "stesso fatturato" vale il primo per tutti. */
export function ricaviPerAnno(r: Risposte): number[] {
  return r.ricaviCostanti ? [r.ricavi[0], r.ricavi[0], r.ricavi[0]] : [...r.ricavi];
}

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
      previdenza = { tipo: "cassa", cassa: parametri.casse[r.cassaId] ?? parametri.casse.cnpadc, agevolazioneGiovaniAttiva: r.agevolazioneGiovani };
      break;
  }
  return {
    annoInizio: ANNO_CORRENTE,
    annoAperturaPiva: r.nuovaAttivita ? ANNO_CORRENTE : r.annoApertura,
    natura: r.natura,
    gruppoCoefficiente: r.gruppo,
    ricaviPerAnno: ricaviPerAnno(r),
    requisitiStartup: r.startup.nessunaAttivitaTreAnni && r.startup.nonProsecuzione,
    redditoDipendenteAnnoPrecedente: r.redditoDipendenteAnnoPrecedente ? parametri.forfettario.sogliaRedditoDipendente + 1 : 0,
    altriRedditiIrpef: r.altriRedditi,
    speseLavoroDipendente: 0,
    previdenza,
    costi: r.costi,
    quotaRicaviConRitenuta: r.natura === "professionista" ? r.quotaVersoAziende : 0,
    fattureAnnue: r.fattureAnnue,
    bolloRiaddebitato: r.bolloRiaddebitato,
    periodicitaIva: r.periodicitaIva,
    aliquotaIva: 0.22,
    quotaCostiConIva: 1,
    addizionali: r.abitaRoma ? ADDIZIONALI_LAZIO_ROMA : addizionaliSemplici(r.addizionaleRegionale, r.addizionaleComunale),
    enasarco: isAgente(r) ? { tipo: r.enasarcoTipo, mandati: r.enasarcoMandati } : null,
  };
}

/** Legge le risposte salvate nel browser, se ci sono e se il browser lo permette. */
export function leggiRisposte(): Risposte {
  try {
    const raw = localStorage.getItem(CHIAVE_ARCHIVIO);
    if (raw) {
      const salvate = JSON.parse(raw) as Partial<Risposte>;
      return { ...risposteIniziali, ...salvate, costi: { ...risposteIniziali.costi, ...(salvate.costi ?? {}) } };
    }
  } catch {
    /* niente di salvato, o storage non disponibile */
  }
  return risposteIniziali;
}

export function salvaRisposte(r: Risposte): void {
  try {
    localStorage.setItem(CHIAVE_ARCHIVIO, JSON.stringify(r));
  } catch {
    /* storage non disponibile: la pagina funziona lo stesso */
  }
}

export const GRUPPI: Array<{ id: GruppoCoefficiente; nome: string; esempi: string; natura: NaturaAttivita[] }> = [
  { id: "professionali_tecnici_sanitari", nome: "Professioni, consulenza, sanità, istruzione", esempi: "Consulente, sviluppatore, psicologo, avvocato, formatore, fisioterapista", natura: ["professionista"] },
  { id: "altre_attivita", nome: "Servizi e altre attività", esempi: "Grafico, fotografo, artigiano, trasporti, servizi alla persona", natura: ["professionista", "impresa"] },
  { id: "intermediari_commercio", nome: "Agente o rappresentante di commercio", esempi: "Monomandatario o plurimandatario, procacciatore", natura: ["impresa"] },
  { id: "commercio_ingrosso_dettaglio", nome: "Commercio all'ingrosso o al dettaglio", esempi: "Negozio, e-commerce, ingrosso", natura: ["impresa"] },
  { id: "commercio_ambulante_alimentari", nome: "Commercio ambulante di alimentari e bevande", esempi: "Banco al mercato, food truck", natura: ["impresa"] },
  { id: "commercio_ambulante_altri", nome: "Commercio ambulante di altri prodotti", esempi: "Abbigliamento e oggetti al mercato", natura: ["impresa"] },
  { id: "servizi_alloggio_ristorazione", nome: "Alloggio e ristorazione", esempi: "Bar, ristorante, B&B, affittacamere", natura: ["impresa"] },
  { id: "industrie_alimentari", nome: "Produzione alimentare", esempi: "Laboratorio, pasticceria, birrificio", natura: ["impresa"] },
  { id: "costruzioni_immobiliari", nome: "Costruzioni e immobiliare", esempi: "Impresa edile, agente immobiliare", natura: ["impresa"] },
];

export const NOMI_PREVIDENZA: Record<Risposte["previdenza"], string> = {
  gestione_separata: "INPS Gestione Separata",
  artigiani: "INPS artigiani",
  commercianti: "INPS commercianti",
  cassa: "Cassa professionale",
};
