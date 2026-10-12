import type { CassaParametri, GruppoCoefficiente } from "../tipi";

/** Stato di verifica di un blocco di parametri: dice quanto fidarsi. */
export interface Fonte {
  /** Norma o circolare di riferimento. */
  norma: string;
  url?: string;
  /** "confermato": cifra dell'anno pubblicata. "provvisorio": cifra dell'anno precedente in attesa. */
  stato: "confermato" | "provvisorio";
}

export interface Scaglione {
  /** Limite superiore dello scaglione; null = ultimo. */
  fino: number | null;
  aliquota: number;
}

export interface ParametriAnno {
  anno: number;

  forfettario: {
    limiteRicavi: number;
    limiteUscitaImmediata: number;
    impostaOrdinaria: number;
    impostaStartup: number;
    anniStartup: number;
    sogliaRedditoDipendente: number;
    limiteSpeseLavoro: number;
    coefficienti: Record<GruppoCoefficiente, number>;
    fonte: Fonte;
  };

  irpef: {
    scaglioni: Scaglione[];
    /** Detrazione per redditi di lavoro autonomo e impresa minore (art. 13 c. 5 TUIR). */
    detrazioneAutonomi: {
      importoPieno: number;
      redditoPieno: number;
      importoBase: number;
      quotaDecrescente: number;
      redditoIntermedio: number;
      redditoMassimo: number;
      /** Maggiorazione fissa in una fascia di reddito (art. 13 c. 5-ter). */
      maggiorazione: { da: number; a: number; importo: number };
    };
    fonte: Fonte;
  };

  acconti: {
    /** Quota dell'imposta dell'anno precedente dovuta in acconto. */
    percentuale: number;
    /** Prima rata per soggetti ISA e forfettari (art. 58 D.L. 124/2019): metà. Gli altri: 40%. */
    primaRata: number;
    /** Sotto questa soglia l'acconto si versa in unica rata a novembre. */
    sogliaUnicaRata: number;
    /** Sotto questa soglia l'acconto non è dovuto. */
    sogliaMinima: number;
    fonte: Fonte;
  };

  gestioneSeparata: {
    aliquotaPiena: number;
    aliquotaRidotta: number;
    /** Quota di rivalsa addebitabile in fattura. */
    rivalsa: number;
    minimale: number;
    massimale: number;
    acconto: { percentuale: number; primaRata: number };
    fonte: Fonte;
  };

  artigianiCommercianti: {
    minimale: number;
    aliquotaArtigiani: number;
    aliquotaCommercianti: number;
    /** Maternità e altre quote fisse annue, oltre al contributo sul minimale. */
    quotaFissaAggiuntiva: number;
    /** Reddito oltre il quale l'aliquota sale di un punto. */
    sogliaFasciaAlta: number;
    maggiorazioneFasciaAlta: number;
    massimale: number;
    riduzioneForfettari: number;
    /** Riduzione per chi si iscrive per la prima volta in una finestra di anni (L. 207/2024 c. 186: solo iscritti 2025). */
    riduzioneNuoviIscritti: { percentuale: number; mesi: number; iscrizioneDalAnno: number; iscrizioneFinoAnno: number };
    acconto: { percentuale: number; primaRata: number };
    fonte: Fonte;
  };

  /** Enasarco: previdenza integrativa obbligatoria degli agenti di commercio, oltre all'INPS. */
  enasarco: {
    aliquotaAgente: number;
    aliquotaPreponente: number;
    massimaleMonomandatario: number;
    massimalePlurimandatario: number;
    fonte: Fonte;
  };

  deducibilita: {
    auto: number;
    telefonia: number;
    vittoAlloggio: number;
    vittoAlloggioTettoSuCompensi: number;
    rappresentanzaTettoSuCompensi: number;
    formazioneTetto: number;
    beniStrumentaliSogliaIntegrale: number;
    ammortamentoAnnuo: number;
    fonte: Fonte;
  };

  iva: {
    interessiTrimestrali: number;
    accontoDicembre: number;
    fonte: Fonte;
  };

  bollo: {
    importo: number;
    sogliaFattura: number;
    fonte: Fonte;
  };

  scadenze: {
    /** Mese-giorno "mm-gg". */
    saldoPrimoAcconto: string;
    /** Differimento per soggetti ISA e forfettari, se vigente. */
    saldoPrimoAccontoDifferito: string | null;
    noteDifferimento: string;
    secondoAcconto: string;
    inpsFissi: string[];
    /** La quarta rata dei fissi cade nell'anno successivo. */
    inpsFissiUltimaRataAnnoSuccessivo: string;
    ivaTrimestrali: string[];
    ivaUltimoTrimestreAnnoSuccessivo: string;
    ivaAcconto: string;
    bolloTrimestrale: string[];
    bolloUltimoTrimestreAnnoSuccessivo: string;
    fonte: Fonte;
  };

  casse: Record<string, CassaParametri>;
}
