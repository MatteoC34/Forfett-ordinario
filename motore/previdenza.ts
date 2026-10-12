import type { DettaglioContributi, Previdenza, Profilo, Regime } from "./tipi";
import type { ParametriAnno } from "./parametri/tipi";

export interface ContestoPrevidenza {
  anno: number;
  annoAperturaPiva: number;
  regime: Regime;
  /** Ricavi fiscali: base della rivalsa e dell'integrativo. */
  ricavi: number;
  parametri: ParametriAnno;
}

/**
 * Contributi di competenza dell'anno. "Competenza" vuol dire: quanto l'anno
 * genera di debito previdenziale, non quanto si paga nell'anno. Il pagamento
 * lo decide il calendario, e si deduce dal reddito nell'anno in cui esce.
 */
export function calcolaContributi(
  previdenza: Previdenza,
  baseImponibile: number,
  ctx: ContestoPrevidenza,
): DettaglioContributi {
  switch (previdenza.tipo) {
    case "gestione_separata":
      return gestioneSeparata(previdenza, baseImponibile, ctx);
    case "artigiani":
    case "commercianti":
      return artigianiCommercianti(previdenza, baseImponibile, ctx);
    case "cassa":
      return cassaPrivata(previdenza, baseImponibile, ctx);
  }
}

function gestioneSeparata(
  p: Extract<Previdenza, { tipo: "gestione_separata" }>,
  base: number,
  ctx: ContestoPrevidenza,
): DettaglioContributi {
  const g = ctx.parametri.gestioneSeparata;
  const note: string[] = [];
  const aliquota = p.altraCopertura ? g.aliquotaRidotta : g.aliquotaPiena;
  const baseEffettiva = Math.min(Math.max(0, base), g.massimale);
  if (base > g.massimale) note.push(`Reddito oltre il massimale contributivo (${g.massimale.toLocaleString("it-IT")} €): la parte eccedente non paga contributi.`);
  if (p.altraCopertura) note.push("Aliquota ridotta perché già coperto da altra previdenza obbligatoria o pensionato.");
  const variabili = baseEffettiva * aliquota;
  const rivalsa = p.rivalsaInFattura ? ctx.ricavi * g.rivalsa : 0;
  if (p.rivalsaInFattura) note.push("La rivalsa 4% addebitata in fattura è un ricavo: concorre al reddito.");
  return {
    baseImponibile: baseEffettiva,
    fissi: 0,
    variabili,
    integrativoRivalsa: rivalsa,
    enasarco: 0,
    totale: variabili,
    note,
  };
}

function artigianiCommercianti(
  p: Extract<Previdenza, { tipo: "artigiani" | "commercianti" }>,
  base: number,
  ctx: ContestoPrevidenza,
): DettaglioContributi {
  const a = ctx.parametri.artigianiCommercianti;
  const note: string[] = [];
  if (p.esoneroDipendentePieno) {
    note.push("Dipendente a tempo pieno altrove: la gestione artigiani/commercianti non è dovuta (attività prevalente).");
    return { baseImponibile: 0, fissi: 0, variabili: 0, integrativoRivalsa: 0, enasarco: 0, totale: 0, note };
  }
  const aliquota = p.tipo === "artigiani" ? a.aliquotaArtigiani : a.aliquotaCommercianti;
  /** La quota IVS sul minimale: è questa che le riduzioni toccano. La maternità resta intera. */
  const ivsSulMinimale = a.minimale * aliquota;

  const baseEffettiva = Math.min(Math.max(0, base), a.massimale);
  if (base > a.massimale) note.push(`Reddito oltre il massimale contributivo (${a.massimale.toLocaleString("it-IT")} €).`);
  let variabiliPieni = 0;
  if (baseEffettiva > a.minimale) {
    const finoFascia = Math.min(baseEffettiva, a.sogliaFasciaAlta) - a.minimale;
    variabiliPieni += Math.max(0, finoFascia) * aliquota;
    const oltreFascia = baseEffettiva - a.sogliaFasciaAlta;
    if (oltreFascia > 0) {
      variabiliPieni += oltreFascia * (aliquota + a.maggiorazioneFasciaAlta);
      note.push(`Oltre ${a.sogliaFasciaAlta.toLocaleString("it-IT")} € di reddito l'aliquota sale di un punto.`);
    }
  }

  let riduzione = 0;
  if (p.riduzione === "35") {
    if (ctx.regime === "forfettario") {
      riduzione = a.riduzioneForfettari;
      note.push("Riduzione 35% dei contributi (art. 1 c. 77 L. 190/2014): meno contributi oggi, meno montante per la pensione.");
    } else {
      note.push("La riduzione 35% spetta solo nel regime forfettario: qui non applicata.");
    }
  } else if (p.riduzione === "50") {
    const r = a.riduzioneNuoviIscritti;
    const anniDallApertura = ctx.anno - ctx.annoAperturaPiva;
    const iscrittoNellaFinestra = ctx.annoAperturaPiva >= r.iscrizioneDalAnno && ctx.annoAperturaPiva <= r.iscrizioneFinoAnno;
    if (iscrittoNellaFinestra && anniDallApertura * 12 < r.mesi) {
      riduzione = r.percentuale;
      note.push(`Riduzione ${Math.round(r.percentuale * 100)}% per i nuovi iscritti (art. 1 c. 186 L. 207/2024), valida per ${r.mesi} mesi dall'iscrizione.`);
    } else {
      note.push(
        iscrittoNellaFinestra
          ? "La riduzione 50% per i nuovi iscritti è terminata: valeva 36 mesi dall'iscrizione."
          : `La riduzione 50% spetta solo a chi si è iscritto per la prima volta nel ${r.iscrizioneFinoAnno}: qui non applicata.`,
      );
    }
  }

  const fissi = ivsSulMinimale * (1 - riduzione) + a.quotaFissaAggiuntiva;
  const variabili = variabiliPieni * (1 - riduzione);
  return {
    baseImponibile: baseEffettiva,
    fissi,
    variabili,
    integrativoRivalsa: 0,
    enasarco: 0,
    totale: fissi + variabili,
    note,
  };
}

function cassaPrivata(
  p: Extract<Previdenza, { tipo: "cassa" }>,
  base: number,
  ctx: ContestoPrevidenza,
): DettaglioContributi {
  const c = p.cassa;
  const note: string[] = [];
  const baseEffettiva = Math.max(0, base);

  let aliquota = c.soggettivoPercento;
  let minimoSoggettivo = c.soggettivoMinimo;
  let minimoIntegrativo = c.integrativoMinimo;
  if (p.agevolazioneGiovaniAttiva && c.agevolazioneGiovani) {
    const g = c.agevolazioneGiovani;
    if (ctx.anno - ctx.annoAperturaPiva < g.anni) {
      if (g.aliquotaRidotta != null) aliquota = g.aliquotaRidotta;
      minimoSoggettivo *= g.fattoreMinimi;
      minimoIntegrativo *= g.fattoreMinimi;
      note.push(`Agevolazione neo-iscritti della Cassa per ${g.anni} anni dalla prima iscrizione${g.etaMassima ? ` (entro i ${g.etaMassima} anni di età)` : ""}.`);
    } else {
      note.push("L'agevolazione neo-iscritti della Cassa è terminata in questo anno.");
    }
  }

  let soggettivo: number;
  if (c.soggettivoMassimale != null && baseEffettiva > c.soggettivoMassimale) {
    soggettivo =
      c.soggettivoMassimale * aliquota +
      (baseEffettiva - c.soggettivoMassimale) * (c.soggettivoOltreMassimalePercento ?? 0);
    note.push(`Reddito oltre il tetto della Cassa (${c.soggettivoMassimale.toLocaleString("it-IT")} €): sull'eccedenza si applica l'aliquota ridotta o nulla.`);
  } else {
    soggettivo = baseEffettiva * aliquota;
  }
  soggettivo = Math.max(soggettivo, minimoSoggettivo);

  const integrativo = Math.max(ctx.ricavi * c.integrativoPercento, minimoIntegrativo);
  if (c.integrativoPercento > 0) {
    note.push(`Contributo integrativo ${(c.integrativoPercento * 100).toLocaleString("it-IT")}% addebitato in fattura al cliente: non è un tuo costo e non concorre al reddito.`);
  }
  if (c.note) note.push(c.note);

  return {
    baseImponibile: baseEffettiva,
    fissi: c.fissiAnnui,
    variabili: soggettivo,
    integrativoRivalsa: integrativo,
    enasarco: 0,
    totale: c.fissiAnnui + soggettivo,
    note,
  };
}

/**
 * Quota Enasarco a carico dell'agente: 8,5% delle provvigioni, fino al
 * massimale per mandato. La base sono le provvigioni lorde, anche nel
 * forfettario (non ricavi × coefficiente). L'integrazione al minimale è a
 * carico della mandante e qui non entra. Con più mandati le provvigioni si
 * dividono in parti uguali.
 */
export function enasarcoAnno(profilo: Profilo, provvigioni: number, parametri: ParametriAnno): number {
  const e = profilo.enasarco;
  if (!e || provvigioni <= 0) return 0;
  const p = parametri.enasarco;
  const mandati = e.tipo === "mono" ? 1 : Math.max(1, Math.round(e.mandati));
  const massimale = e.tipo === "mono" ? p.massimaleMonomandatario : p.massimalePlurimandatario;
  const perMandato = provvigioni / mandati;
  return mandati * Math.min(perMandato, massimale) * p.aliquotaAgente;
}

/** Aggiunge l'Enasarco ai contributi di competenza, con la sua nota. */
export function conEnasarco(c: DettaglioContributi, quota: number, parametri: ParametriAnno): DettaglioContributi {
  if (quota <= 0) return c;
  return {
    ...c,
    enasarco: quota,
    totale: c.totale + quota,
    note: [...c.note, `Enasarco: ${(parametri.enasarco.aliquotaAgente * 100).toLocaleString("it-IT")}% delle provvigioni, trattenuto dalla casa mandante e deducibile. Si aggiunge all'INPS commercianti.`],
  };
}
