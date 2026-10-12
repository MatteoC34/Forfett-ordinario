/**
 * Tipi del motore di simulazione.
 *
 * Il motore è puro: nessuna dipendenza da UI, browser o rete. Riceve un
 * profilo, legge i parametri dell'anno e restituisce numeri e un calendario
 * di versamenti. Tutto ciò che cambia con la Legge di Bilancio sta in
 * `parametri/<anno>.ts`, mai qui.
 */

export type Regime = "forfettario" | "ordinario";

/** Natura dell'attività: decide ritenuta d'acconto, previdenza di default, art. 54 o 66 TUIR. */
export type NaturaAttivita = "professionista" | "impresa";

/** Gruppi di coefficiente di redditività del forfettario (L. 190/2014, all. 4). */
export type GruppoCoefficiente =
  | "industrie_alimentari"
  | "commercio_ingrosso_dettaglio"
  | "commercio_ambulante_alimentari"
  | "commercio_ambulante_altri"
  | "costruzioni_immobiliari"
  | "intermediari_commercio"
  | "servizi_alloggio_ristorazione"
  | "professionali_tecnici_sanitari"
  | "altre_attivita";

export type RiduzioneArtigianiCommercianti = "nessuna" | "35" | "50";

/** Come il contribuente versa i contributi previdenziali. */
export type Previdenza =
  | {
      tipo: "gestione_separata";
      /** Già coperto da altra previdenza obbligatoria o pensionato: aliquota ridotta. */
      altraCopertura: boolean;
      /** Addebita la rivalsa 4% in fattura (concorre al reddito). */
      rivalsaInFattura: boolean;
    }
  | {
      tipo: "artigiani" | "commercianti";
      riduzione: RiduzioneArtigianiCommercianti;
      /** Dipendente a tempo pieno altrove: la gestione non è dovuta (attività prevalente). */
      esoneroDipendentePieno: boolean;
    }
  | {
      tipo: "cassa";
      cassa: CassaParametri;
      /** Il contribuente rientra nell'agevolazione per i neo-iscritti della Cassa. */
      agevolazioneGiovaniAttiva: boolean;
    };

/** Una Cassa privata ridotta ai suoi tratti lineari. I preset stanno nei parametri. */
export interface CassaParametri {
  id: string;
  nome: string;
  /** Aliquota del contributo soggettivo sul reddito professionale. */
  soggettivoPercento: number;
  /** Minimo annuo del soggettivo. */
  soggettivoMinimo: number;
  /** Reddito oltre il quale il soggettivo non è più dovuto (o scende). */
  soggettivoMassimale?: number;
  /** Aliquota oltre il massimale, se la Cassa la prevede. 0 = niente. */
  soggettivoOltreMassimalePercento?: number;
  /** Aliquota del contributo integrativo in fattura, a carico del cliente. */
  integrativoPercento: number;
  integrativoMinimo: number;
  /** Contributo di maternità e altri fissi annui. */
  fissiAnnui: number;
  /**
   * Agevolazione per i neo-iscritti: per `anni` dalla prima iscrizione l'aliquota
   * del soggettivo diventa `aliquotaRidotta` (se indicata) e i minimi si
   * moltiplicano per `fattoreMinimi` (0 = esonero, 0.5 = dimezzati).
   */
  agevolazioneGiovani?: { anni: number; etaMassima?: number; aliquotaRidotta?: number; fattoreMinimi: number };
  /** Note da mostrare nell'interfaccia: cosa è approssimato. */
  note?: string;
}

export interface CostiOrdinario {
  /** Costi interamente deducibili (software, consulenze, affitto studio, materiali). */
  interamenteDeducibili: number;
  auto: number;
  telefonia: number;
  vittoAlloggio: number;
  rappresentanza: number;
  formazione: number;
  /** Beni strumentali acquistati nell'anno: ammortamento per quote. */
  beniStrumentali: number;
}

export interface AddizionaleRegionale {
  /** Scaglioni progressivi: limite superiore e aliquota. */
  scaglioni: Array<{ fino: number | null; aliquota: number }>;
  /** Fino a questo reddito si applica un'aliquota unica su tutto (deroga alla progressività). */
  aliquotaUnicaFino?: { reddito: number; aliquota: number };
  /** Detrazione fissa in una fascia di reddito, per attenuare il salto. */
  detrazione?: { da: number; a: number; importo: number };
  etichetta: string;
}

export interface Addizionali {
  regionale: AddizionaleRegionale;
  /** Sopra la soglia di esenzione si paga sull'intero reddito, non sull'eccedenza. */
  comunale: { aliquota: number; esenzioneFino: number; etichetta: string };
}

export interface Profilo {
  /** Primo anno simulato. */
  annoInizio: number;
  /** Anno in cui è stata (o sarà) aperta la partita IVA. */
  annoAperturaPiva: number;
  natura: NaturaAttivita;
  gruppoCoefficiente: GruppoCoefficiente;
  /** Ricavi o compensi previsti, un valore per ciascun anno simulato. */
  ricaviPerAnno: number[];
  /** Requisiti per l'aliquota 5% start-up (art. 1 c. 65 L. 190/2014). */
  requisitiStartup: boolean;
  /** Redditi da lavoro dipendente o pensione dell'anno precedente al primo simulato. */
  redditoDipendenteAnnoPrecedente: number;
  /** Altri redditi IRPEF dell'anno (dipendente, pensione, fabbricati). Entrano nel cumulo. */
  altriRedditiIrpef: number;
  /** Spese per dipendenti e collaboratori nell'anno (causa di esclusione sopra soglia). */
  speseLavoroDipendente: number;
  previdenza: Previdenza;
  costi: CostiOrdinario;
  /** Quota dei ricavi fatturata a sostituti d'imposta (0-1): subisce la ritenuta. */
  quotaRicaviConRitenuta: number;
  /** Numero di fatture annue (bollo nel forfettario). */
  fattureAnnue: number;
  /** Il bollo viene riaddebitato al cliente. */
  bolloRiaddebitato: boolean;
  periodicitaIva: "mensile" | "trimestrale";
  /** Aliquota IVA media sulle vendite (0-1). */
  aliquotaIva: number;
  /** Quota dei costi che porta IVA detraibile (0-1). */
  quotaCostiConIva: number;
  addizionali: Addizionali;
}

export type TipoVersamento =
  | "imposta_saldo"
  | "imposta_acconto"
  | "inps_fisso"
  | "inps_acconto"
  | "inps_saldo"
  | "cassa"
  | "iva"
  | "bollo";

export interface Versamento {
  /** Data ISO yyyy-mm-dd. */
  data: string;
  tipo: TipoVersamento;
  descrizione: string;
  importo: number;
  /** Anno d'imposta a cui si riferisce. */
  annoImposta: number;
}

export interface DettaglioContributi {
  /** Base su cui si calcola il contributo. */
  baseImponibile: number;
  fissi: number;
  variabili: number;
  /** Integrativo in fattura (Casse): a carico del cliente, non del contribuente. */
  integrativoRivalsa: number;
  totale: number;
  note: string[];
}

export interface DettaglioImposta {
  redditoImponibile: number;
  /** Imposta lorda prima delle detrazioni. */
  lorda: number;
  detrazioni: number;
  addizionaleRegionale: number;
  addizionaleComunale: number;
  /** Imposta netta dovuta per l'anno (competenza). */
  netta: number;
  aliquotaEffettiva: number;
}

export interface RisultatoAnno {
  anno: number;
  regime: Regime;
  /** Il regime è applicabile quest'anno. Se falso, `motivi` dice perché. */
  applicabile: boolean;
  motiviNonApplicabile: string[];
  avvisi: string[];
  ricavi: number;
  /** Ricavi incrementati da rivalsa o bollo riaddebitato: la base fiscale. */
  ricaviFiscali: number;
  costiReali: number;
  costiDeducibili: number;
  contributi: DettaglioContributi;
  /** Contributi effettivamente versati nell'anno (per cassa): questi si deducono. */
  contributiVersatiNellAnno: number;
  imposta: DettaglioImposta;
  ritenuteSubite: number;
  bollo: number;
  ivaDaVersare: number;
  /** Acconti versati nell'anno, da scomputare nel saldo dell'anno dopo. */
  accontiVersati: { imposta: number; contributi: number };
  /** Ricavi - costi reali - imposta di competenza - contributi di competenza. */
  nettoCompetenza: number;
  /** Ricavi - costi reali - quanto effettivamente esce di cassa nell'anno. */
  nettoCassa: number;
  versamenti: Versamento[];
}

export interface RisultatoRegime {
  regime: Regime;
  anni: RisultatoAnno[];
  totaleNettoCompetenza: number;
  totaleImposte: number;
  totaleContributi: number;
  /** Versamenti che cadranno nell'anno successivo all'ultimo simulato (saldo + acconti). */
  codaVersamenti: Versamento[];
}

export interface Confronto {
  forfettario: RisultatoRegime;
  ordinario: RisultatoRegime;
  /** Regime con netto totale più alto sui tre anni, se il forfettario è applicabile. */
  conviene: Regime | null;
  differenzaNettoTotale: number;
  /** Costi annui oltre i quali l'ordinario batte il forfettario nel primo anno. */
  puntoIndifferenzaCosti: number | null;
}
