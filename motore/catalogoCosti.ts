import type { NaturaAttivita } from "./tipi";

/**
 * Il catalogo delle spese: una riga per tipo di costo, con la quota
 * deducibile IRPEF, l'eventuale tetto, la quota di IVA recuperabile e la
 * regola in parole. È la sola fonte di verità per il regime ordinario: la
 * UI la legge per disegnare la scheda, il motore per fare i conti.
 *
 * `quotaIva` è la frazione dell'IVA al 22% che si recupera: 0 quando la
 * spesa non ha IVA (assicurazioni, bollo, affitto da privato) o è
 * indetraibile (rappresentanza, trasporto persone).
 */
export interface VoceCosto {
  id: string;
  gruppo: string;
  nome: string;
  regola: (ctx: ContestoRegola) => string;
  /** Quota deducibile "nominale", usata per il badge. */
  quota: (ctx: ContestoRegola) => number;
  /** Importo dedotto nell'anno, con tetti e ammortamenti. */
  dedotto: (importo: number, ctx: ContestoRegola) => number;
  quotaIva: number | ((ctx: ContestoRegola) => number);
  /** La spesa ha IVA (per stimare l'IVA pagata). */
  conIva: boolean;
  /** Aliquota IVA della spesa, se diversa dal 22%. */
  aliquotaIva?: number;
  /** Entra nel plafond unico delle spese di rappresentanza (1% o 1,5%). */
  rappresentanza?: (ctx: ContestoRegola) => boolean;
  /** Esclusa dal reddito e dai tetti (rimborsi analitici). */
  fuoriReddito?: boolean;
  /** Nel forfettario conta come spesa per personale (soglia 20.000 €). */
  speseLavoro?: boolean;
  /** Valore di partenza suggerito, passo e massimo del cursore. */
  suggerito: number;
  massimo: number;
  passo: number;
}

export interface ContestoRegola {
  natura: NaturaAttivita;
  ricavi: number;
  /** Anni trascorsi dal primo anno simulato: per gli ammortamenti. */
  anniDalPrimo: number;
  /** Agente o rappresentante di commercio: auto all'80% e IVA intera (art. 164 c. 1 lett. b). */
  agente?: boolean;
}

const euro = (n: number) => Math.round(n).toLocaleString("it-IT") + " €";
const fisso = (q: number) => (importo: number) => importo * q;
const pct = (q: number) => () => q;

export const TETTO_AUTO_ACQUISTO = 18_075.99;
export const TETTO_AUTO_NOLEGGIO = 3_615.20;
export const TETTO_AUTO_ACQUISTO_AGENTI = 25_822.84;
export const TETTO_AUTO_NOLEGGIO_AGENTI = 5_164.57;

/** Quota dell'IVA recuperabile per una voce, nel contesto dato. */
export function quotaIvaDi(voce: VoceCosto, ctx: ContestoRegola): number {
  return typeof voce.quotaIva === "function" ? voce.quotaIva(ctx) : voce.quotaIva;
}

const quotaAuto = (c: ContestoRegola) => (c.agente ? 0.8 : 0.2);
const ivaAuto = (c: ContestoRegola) => (c.agente ? 1 : 0.4);
const regolaAuto = (resto: string) => (c: ContestoRegola) => (c.agente ? `80% per agenti e rappresentanti, IVA intera. ${resto}` : `20%, IVA 40%. ${resto}`);
export const SOGLIA_BENE_INTEGRALE = 516.46;
export const TETTO_FORMAZIONE = 10_000;
export const TETTO_TRASFERTA_DIPENDENTI_ITALIA = 180.76;
export const TETTO_TRASFERTA_DIPENDENTI_ESTERO = 258.23;

/** Plafond annuo delle spese di rappresentanza (art. 54-septies c. 2; art. 108 c. 2). */
export function plafondRappresentanza(ctx: ContestoRegola): number {
  return ctx.ricavi * (ctx.natura === "professionista" ? 0.01 : 0.015);
}

/**
 * Ammortamento a quote costanti; i beni piccoli si deducono subito. Per
 * l'impresa il primo anno la quota è dimezzata (art. 102 c. 2), e il bene
 * si chiude un anno dopo.
 */
function ammortamento(aliquota: number) {
  return (importo: number, ctx: ContestoRegola) => {
    if (importo <= SOGLIA_BENE_INTEGRALE) return ctx.anniDalPrimo === 0 ? importo : 0;
    const anni = Math.round(1 / aliquota);
    if (ctx.natura === "impresa") {
      if (ctx.anniDalPrimo === 0) return importo * aliquota * 0.5;
      if (ctx.anniDalPrimo < anni) return importo * aliquota;
      if (ctx.anniDalPrimo === anni) return importo * aliquota * 0.5;
      return 0;
    }
    return ctx.anniDalPrimo < anni ? importo * aliquota : 0;
  };
}

export const CATALOGO_COSTI: VoceCosto[] = [
  // ─── Sede e strumenti ─────────────────────────────────────────────────
  { id: "affitto", gruppo: "Sede e strumenti", nome: "Affitto studio, ufficio o coworking", regola: () => "100%. Da privato senza IVA; coworking con IVA 22%", quota: pct(1), dedotto: fisso(1), quotaIva: 1, conIva: true, suggerito: 0, massimo: 24_000, passo: 100 },
  { id: "casastudio", gruppo: "Sede e strumenti", nome: "Casa-studio (quota di affitto e utenze)", regola: () => "50%, se è l'unico immobile usato anche per lavoro", quota: pct(0.5), dedotto: fisso(0.5), quotaIva: 0, conIva: false, suggerito: 0, massimo: 12_000, passo: 100 },
  { id: "utenze", gruppo: "Sede e strumenti", nome: "Luce, gas, acqua dello studio", regola: () => "100% se lo studio è solo per lavoro", quota: pct(1), dedotto: fisso(1), quotaIva: 1, conIva: true, suggerito: 0, massimo: 6_000, passo: 50 },
  { id: "telefonia", gruppo: "Sede e strumenti", nome: "Telefono e internet", regola: () => "80% IRPEF; IVA al 50% su cellulari e linee promiscue", quota: pct(0.8), dedotto: fisso(0.8), quotaIva: 0.5, conIva: true, suggerito: 600, massimo: 3_000, passo: 50 },
  { id: "software", gruppo: "Sede e strumenti", nome: "Software, abbonamenti, SaaS", regola: () => "100% se annuali; licenze pluriennali in due anni", quota: pct(1), dedotto: fisso(1), quotaIva: 1, conIva: true, suggerito: 600, massimo: 8_000, passo: 50 },
  { id: "attrezzature", gruppo: "Sede e strumenti", nome: "PC, monitor, strumenti", regola: (c) => `Sotto ${euro(SOGLIA_BENE_INTEGRALE)} subito; sopra, 20% l'anno per 5 anni${c.natura === "impresa" ? " (primo anno a metà)" : ""}`, quota: pct(0.2), dedotto: ammortamento(0.2), quotaIva: 1, conIva: true, suggerito: 1500, massimo: 15_000, passo: 100 },
  { id: "arredi", gruppo: "Sede e strumenti", nome: "Arredi", regola: () => "12% l'anno (coefficienti DM 31/12/1988)", quota: pct(0.12), dedotto: ammortamento(0.12), quotaIva: 1, conIva: true, suggerito: 0, massimo: 10_000, passo: 100 },
  { id: "cancelleria", gruppo: "Sede e strumenti", nome: "Cancelleria e materiali di consumo", regola: () => "100%", quota: pct(1), dedotto: fisso(1), quotaIva: 1, conIva: true, suggerito: 100, massimo: 3_000, passo: 50 },

  // ─── Auto propria ─────────────────────────────────────────────────────
  {
    id: "auto", gruppo: "Auto propria", nome: "Auto: rata, leasing o noleggio (anche breve)",
    regola: (c) => (c.agente
      ? `80%, su un costo massimo di ${euro(TETTO_AUTO_ACQUISTO_AGENTI)} (noleggio ${euro(TETTO_AUTO_NOLEGGIO_AGENTI)} l'anno). IVA intera`
      : `20%, su un costo massimo di ${euro(TETTO_AUTO_ACQUISTO)} (noleggio ${euro(TETTO_AUTO_NOLEGGIO)} l'anno). IVA 40%. Un solo veicolo`),
    quota: quotaAuto,
    dedotto: (v, c) => Math.min(v, (c.agente ? TETTO_AUTO_ACQUISTO_AGENTI : TETTO_AUTO_ACQUISTO) * 0.25) * quotaAuto(c),
    quotaIva: ivaAuto, conIva: true, suggerito: 0, massimo: 15_000, passo: 100,
  },
  { id: "carburante", gruppo: "Auto propria", nome: "Carburante", regola: regolaAuto("Pagamento tracciato"), quota: quotaAuto, dedotto: (v, c) => v * quotaAuto(c), quotaIva: ivaAuto, conIva: true, suggerito: 600, massimo: 8_000, passo: 100 },
  { id: "telepass", gruppo: "Auto propria", nome: "Telepass e pedaggi", regola: regolaAuto("Stessa regola dell'auto"), quota: quotaAuto, dedotto: (v, c) => v * quotaAuto(c), quotaIva: ivaAuto, conIva: true, suggerito: 200, massimo: 3_000, passo: 50 },
  { id: "autoaltro", gruppo: "Auto propria", nome: "Assicurazione, bollo, manutenzione, parcheggi", regola: (c) => `${c.agente ? "80%" : "20%"}. IVA ${c.agente ? "intera" : "40%"} su manutenzione e parcheggi; assicurazione e bollo senza IVA`, quota: quotaAuto, dedotto: (v, c) => v * quotaAuto(c), quotaIva: (c) => (c.agente ? 0.5 : 0.2), conIva: true, suggerito: 0, massimo: 6_000, passo: 100 },

  // ─── Viaggi e trasferte ───────────────────────────────────────────────
  { id: "viaggi", gruppo: "Viaggi e trasferte", nome: "Treno, aereo, taxi, NCC", regola: () => "100%. IVA non recuperabile sul trasporto persone (art. 19-bis1 lett. e). Taxi e NCC solo se pagati con carta", quota: pct(1), dedotto: fisso(1), quotaIva: 0, conIva: true, suggerito: 500, massimo: 10_000, passo: 100 },
  {
    id: "alberghi", gruppo: "Viaggi e trasferte", nome: "Alberghi e ristoranti in trasferta",
    regola: (c) => (c.natura === "professionista" ? `75%, entro il 2% degli incassi (${euro(c.ricavi * 0.02)}). IVA intera solo con fattura intestata` : "75%, senza tetto per l'impresa. IVA intera solo con fattura intestata"),
    quota: pct(0.75),
    dedotto: (v, c) => (c.natura === "professionista" ? Math.min(v * 0.75, c.ricavi * 0.02) : v * 0.75),
    quotaIva: 1, conIva: true, suggerito: 500, massimo: 8_000, passo: 100,
  },
  {
    id: "pranzi", gruppo: "Viaggi e trasferte", nome: "Pranzi e cene con clienti",
    regola: (c) => `Rappresentanza: 75%, entro ${c.natura === "professionista" ? "l'1%" : "l'1,5%"} degli incassi (${euro(plafondRappresentanza(c))}, plafond condiviso con gli omaggi). IVA indetraibile`,
    quota: pct(0.75),
    dedotto: fisso(0.75),
    quotaIva: 0, conIva: true, rappresentanza: () => true, suggerito: 400, massimo: 6_000, passo: 100,
  },
  {
    id: "omaggi", gruppo: "Viaggi e trasferte", nome: "Omaggi a clienti (fino a 50 € a pezzo)",
    regola: (c) => (c.natura === "professionista" ? "Rappresentanza: 100% ma dentro il plafond dell'1%. IVA recuperabile fino a 50 € a pezzo" : "100% fuori plafond fino a 50 € a pezzo; oltre, rappresentanza. IVA recuperabile"),
    quota: pct(1), dedotto: fisso(1), quotaIva: 1, conIva: true, rappresentanza: (c) => c.natura === "professionista", suggerito: 0, massimo: 3_000, passo: 50,
  },
  { id: "rimborsi", gruppo: "Viaggi e trasferte", nome: "Spese riaddebitate al cliente in fattura", regola: (c) => (c.natura === "professionista" ? "Fuori dal reddito dal 2025 (art. 54 c. 2): non contano nei tetti, se pagate con carta" : "Per l'impresa sono ricavi e costi normali: mettile nelle voci sopra"), quota: pct(1), dedotto: () => 0, quotaIva: 1, conIva: true, fuoriReddito: true, suggerito: 0, massimo: 10_000, passo: 100 },

  // ─── Persone e benefit ────────────────────────────────────────────────
  { id: "dipendenti", gruppo: "Persone e benefit", nome: "Dipendenti e collaboratori", regola: () => "100%. Sopra 20.000 € l'anno chiude la porta al forfettario", quota: pct(1), dedotto: fisso(1), quotaIva: 0, conIva: false, speseLavoro: true, suggerito: 0, massimo: 60_000, passo: 500 },
  { id: "benefit", gruppo: "Persone e benefit", nome: "Buoni pasto e welfare ai dipendenti", regola: () => "100%. Esenti per loro fino a 4 € (10 € elettronici dal 2026, L. 199/2025) al giorno; fringe benefit fino a 1.000 € (2.000 € con figli). IVA al 4% sui buoni", quota: pct(1), dedotto: fisso(1), quotaIva: 1, conIva: true, aliquotaIva: 0.04, speseLavoro: true, suggerito: 0, massimo: 10_000, passo: 100 },
  { id: "trasfdip", gruppo: "Persone e benefit", nome: "Trasferte dei dipendenti", regola: () => `100% entro ${TETTO_TRASFERTA_DIPENDENTI_ITALIA.toLocaleString("it-IT")} € al giorno in Italia, ${TETTO_TRASFERTA_DIPENDENTI_ESTERO.toLocaleString("it-IT")} € all'estero`, quota: pct(1), dedotto: fisso(1), quotaIva: 1, conIva: true, suggerito: 0, massimo: 10_000, passo: 100 },
  { id: "benefitte", gruppo: "Persone e benefit", nome: "Benefit per te: palestra, salute, benessere", regola: () => "0%. Non è un costo dell'attività; le spese mediche vanno nel 19% personale", quota: pct(0), dedotto: () => 0, quotaIva: 0, conIva: true, suggerito: 0, massimo: 5_000, passo: 50 },
  { id: "familiari", gruppo: "Persone e benefit", nome: "Compensi a coniuge e figli minori", regola: (c) => (c.natura === "professionista" ? "0% (art. 54-septies TUIR). I figli maggiorenni invece sì, al 100%" : "0% per coniuge, figli anche maggiorenni e ascendenti (art. 60 TUIR)"), quota: pct(0), dedotto: () => 0, quotaIva: 0, conIva: false, suggerito: 0, massimo: 20_000, passo: 500 },

  // ─── Servizi, obblighi e crescita ─────────────────────────────────────
  { id: "commercialista", gruppo: "Servizi, obblighi e crescita", nome: "Commercialista, consulenti, legali, notaio", regola: () => "100%", quota: pct(1), dedotto: fisso(1), quotaIva: 1, conIva: true, suggerito: 1500, massimo: 8_000, passo: 100 },
  { id: "rc", gruppo: "Servizi, obblighi e crescita", nome: "Assicurazione RC professionale", regola: () => "100%, senza IVA", quota: pct(1), dedotto: fisso(1), quotaIva: 0, conIva: false, suggerito: 300, massimo: 3_000, passo: 50 },
  { id: "albo", gruppo: "Servizi, obblighi e crescita", nome: "Quota albo e aggiornamento obbligatorio", regola: () => "100%", quota: pct(1), dedotto: fisso(1), quotaIva: 0, conIva: false, suggerito: 0, massimo: 2_000, passo: 50 },
  { id: "formazione", gruppo: "Servizi, obblighi e crescita", nome: "Formazione: corsi, master, convegni", regola: () => `100% entro ${euro(TETTO_FORMAZIONE)} l'anno, viaggio e soggiorno compresi`, quota: pct(1), dedotto: (v) => Math.min(v, TETTO_FORMAZIONE), quotaIva: 1, conIva: true, suggerito: 500, massimo: 15_000, passo: 100 },
  { id: "marketing", gruppo: "Servizi, obblighi e crescita", nome: "Pubblicità, sito, marketing", regola: () => "100%", quota: pct(1), dedotto: fisso(1), quotaIva: 1, conIva: true, suggerito: 300, massimo: 10_000, passo: 100 },
  { id: "interessi", gruppo: "Servizi, obblighi e crescita", nome: "Interessi su finanziamenti per l'attività", regola: (c) => (c.natura === "professionista" ? "100%" : "In proporzione ai ricavi imponibili (art. 61)"), quota: pct(1), dedotto: fisso(1), quotaIva: 0, conIva: false, suggerito: 0, massimo: 5_000, passo: 50 },
  { id: "imposte", gruppo: "Servizi, obblighi e crescita", nome: "IMU e TARI dello studio", regola: () => "100%. IRPEF, sanzioni e interessi di mora: 0%", quota: pct(1), dedotto: fisso(1), quotaIva: 0, conIva: false, suggerito: 0, massimo: 3_000, passo: 50 },
];

export const GRUPPI_COSTI: Array<{ nome: string; nota: string }> = [
  { nome: "Sede e strumenti", nota: "" },
  { nome: "Auto propria", nota: "20% IRPEF e 40% IVA su tutto (art. 164 TUIR, art. 19-bis1). Agenti di commercio: 80% e IVA intera." },
  { nome: "Viaggi e trasferte", nota: "Dal 2025 vitto, alloggio, taxi, NCC e rappresentanza si deducono solo se pagati con carta o bonifico." },
  { nome: "Persone e benefit", nota: "" },
  { nome: "Servizi, obblighi e crescita", nota: "" },
];

/** Importi per voce, per id. Le voci assenti valgono zero. */
export type ImportiCosti = Record<string, number>;

export function importiSuggeriti(): ImportiCosti {
  const o: ImportiCosti = {};
  for (const v of CATALOGO_COSTI) o[v.id] = v.suggerito;
  return o;
}

export interface RigaCostoCalcolata {
  voce: VoceCosto;
  importo: number;
  dedotto: number;
  /** IVA pagata sulla spesa, se ne ha. */
  ivaPagata: number;
  /** IVA che l'ordinario recupera. */
  ivaRecuperata: number;
}

export interface SpeseCalcolate {
  righe: RigaCostoCalcolata[];
  /** Spese che escono davvero, IVA esclusa e rimborsi esclusi. */
  totale: number;
  dedotto: number;
  ivaPagata: number;
  ivaRecuperata: number;
  speseLavoro: number;
}

export const ALIQUOTA_IVA_ACQUISTI = 0.22;

export function calcolaSpese(importi: ImportiCosti, ctx: ContestoRegola): SpeseCalcolate {
  const righe: RigaCostoCalcolata[] = [];
  let totale = 0, dedotto = 0, ivaPagata = 0, ivaRecuperata = 0, speseLavoro = 0;
  const plafond = plafondRappresentanza(ctx);
  let rappresentanzaUsata = 0;
  for (const voce of CATALOGO_COSTI) {
    const importo = Math.max(0, importi[voce.id] ?? 0);
    let ded = voce.dedotto(importo, ctx);
    if (voce.rappresentanza?.(ctx)) {
      ded = Math.min(ded, Math.max(0, plafond - rappresentanzaUsata));
      rappresentanzaUsata += ded;
    }
    const ivaP = voce.conIva ? importo * (voce.aliquotaIva ?? ALIQUOTA_IVA_ACQUISTI) : 0;
    const ivaR = ivaP * quotaIvaDi(voce, ctx);
    righe.push({ voce, importo, dedotto: ded, ivaPagata: ivaP, ivaRecuperata: ivaR });
    if (voce.fuoriReddito) continue;
    totale += importo;
    dedotto += ded;
    ivaPagata += ivaP;
    ivaRecuperata += ivaR;
    if (voce.speseLavoro) speseLavoro += importo;
  }
  return { righe, totale, dedotto, ivaPagata, ivaRecuperata, speseLavoro };
}
