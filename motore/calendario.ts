import type { Previdenza, Profilo, Regime, RisultatoAnno, Versamento } from "./tipi";
import type { ParametriAnno } from "./parametri/tipi";
import { accontiContributi, accontiImposta } from "./acconti";
import { calcolaContributi } from "./previdenza";
import { dataIso, somma } from "./utilita";

export interface VersamentiAnno {
  versamenti: Versamento[];
  /** Contributi previdenziali usciti nell'anno: quelli che si deducono. */
  contributiVersati: number;
  accontiImposta: number;
  accontiContributi: number;
}

/**
 * Tutto ciò che esce nell'anno `anno` e dipende dall'anno prima: saldo e
 * acconti d'imposta, saldo e acconti dei contributi. Niente fissi dell'anno
 * corrente, che `versamentiFissiDellAnno` aggiunge a parte.
 */
export function versamentiDaAnnoPrecedente(
  anno: number,
  precedente: RisultatoAnno | null,
  profilo: Profilo,
  parametri: ParametriAnno,
): VersamentiAnno {
  const v: Versamento[] = [];
  let contributiVersati = 0;
  let accImposta = 0;
  let accContributi = 0;
  if (!precedente) return { versamenti: v, contributiVersati, accontiImposta: 0, accontiContributi: 0 };

  const s = parametri.scadenze;
  const dataSaldo = dataIso(anno, s.saldoPrimoAcconto);
  const dataSecondo = dataIso(anno, s.secondoAcconto);
  const annoPrec = precedente.anno;
  const nomeImposta = precedente.regime === "forfettario" ? "imposta sostitutiva" : "IRPEF e addizionali";

  // Saldo imposta anno precedente: imposta netta meno acconti già versati meno ritenute subite.
  const saldo = precedente.imposta.netta - precedente.accontiVersati.imposta - precedente.ritenuteSubite;
  if (Math.abs(saldo) >= 0.5) {
    v.push({
      data: dataSaldo,
      tipo: "imposta_saldo",
      descrizione: saldo >= 0 ? `Saldo ${nomeImposta} ${annoPrec}` : `Credito ${nomeImposta} ${annoPrec} (da compensare o rimborsare)`,
      importo: saldo,
      annoImposta: annoPrec,
    });
  }

  // Acconti imposta anno corrente, metodo storico sull'imposta "differenza" dell'anno prima.
  const baseAcconto = Math.max(0, precedente.imposta.netta - precedente.ritenuteSubite);
  const acc = accontiImposta(baseAcconto, parametri);
  if (acc.primaRata > 0) v.push({ data: dataSaldo, tipo: "imposta_acconto", descrizione: `Primo acconto ${nomeImposta} ${anno}`, importo: acc.primaRata, annoImposta: anno });
  if (acc.secondaRata > 0) v.push({ data: dataSecondo, tipo: "imposta_acconto", descrizione: `${acc.primaRata > 0 ? "Secondo" : "Unico"} acconto ${nomeImposta} ${anno}`, importo: acc.secondaRata, annoImposta: anno });
  accImposta = acc.totale;

  // Contributi: saldo dell'anno prima e acconti dell'anno corrente.
  const prev = profilo.previdenza;
  const variabiliPrec = precedente.contributi.variabili;
  if (prev.tipo === "gestione_separata" || prev.tipo === "artigiani" || prev.tipo === "commercianti") {
    const regola = prev.tipo === "gestione_separata" ? parametri.gestioneSeparata.acconto : parametri.artigianiCommercianti.acconto;
    const etichetta = prev.tipo === "gestione_separata" ? "INPS Gestione Separata" : `INPS ${prev.tipo} (eccedenza sul minimale)`;
    const saldoInps = variabiliPrec - precedente.accontiVersati.contributi;
    if (Math.abs(saldoInps) >= 0.5) {
      v.push({ data: dataSaldo, tipo: "inps_saldo", descrizione: `Saldo ${etichetta} ${annoPrec}`, importo: saldoInps, annoImposta: annoPrec });
      contributiVersati += saldoInps;
    }
    const ai = accontiContributi(variabiliPrec, regola);
    if (ai.primaRata > 0) {
      v.push({ data: dataSaldo, tipo: "inps_acconto", descrizione: `Primo acconto ${etichetta} ${anno}`, importo: ai.primaRata, annoImposta: anno });
      v.push({ data: dataSecondo, tipo: "inps_acconto", descrizione: `Secondo acconto ${etichetta} ${anno}`, importo: ai.secondaRata, annoImposta: anno });
      contributiVersati += ai.totale;
      accContributi = ai.totale;
    }
  } else if (prev.tipo === "cassa") {
    // Le Casse incassano i minimi nell'anno e l'eccedenza l'anno dopo, in genere a fine anno.
    const minimoPrec = minimoSoggettivoCassa(prev, precedente.anno, profilo, parametri);
    const eccedenza = Math.max(0, variabiliPrec - minimoPrec);
    if (eccedenza >= 0.5) {
      v.push({ data: dataIso(anno, "12-15"), tipo: "cassa", descrizione: `${prev.cassa.nome}: conguaglio soggettivo ${annoPrec}`, importo: eccedenza, annoImposta: annoPrec });
      contributiVersati += eccedenza;
    }
  }

  return { versamenti: v, contributiVersati, accontiImposta: accImposta, accontiContributi: accContributi };
}

function minimoSoggettivoCassa(prev: Extract<Previdenza, { tipo: "cassa" }>, anno: number, profilo: Profilo, parametri: ParametriAnno): number {
  return calcolaContributi(prev, 0, { anno, annoAperturaPiva: profilo.annoAperturaPiva, regime: "ordinario", ricavi: 0, parametri }).variabili;
}

/**
 * Le uscite fisse dell'anno corrente, che non dipendono dal reddito: rate
 * INPS sul minimale, minimi e maternità delle Casse. Più IVA e bollo, che
 * dipendono dai ricavi dell'anno ma non dall'anno prima.
 */
export function versamentiFissiDellAnno(
  anno: number,
  regime: Regime,
  ricavi: number,
  profilo: Profilo,
  parametri: ParametriAnno,
): VersamentiAnno {
  const v: Versamento[] = [];
  let contributiVersati = 0;
  const s = parametri.scadenze;
  const prev = profilo.previdenza;

  if (prev.tipo === "artigiani" || prev.tipo === "commercianti") {
    const c = calcolaContributi(prev, 0, { anno, annoAperturaPiva: profilo.annoAperturaPiva, regime, ricavi, parametri });
    if (c.fissi > 0) {
      const rata = c.fissi / 4;
      const date = [...s.inpsFissi.map((d) => dataIso(anno, d)), dataIso(anno + 1, s.inpsFissiUltimaRataAnnoSuccessivo)];
      date.forEach((data, i) => v.push({ data, tipo: "inps_fisso", descrizione: `INPS ${prev.tipo}: rata fissa ${i + 1}/4 ${anno}`, importo: rata, annoImposta: anno }));
      // Le prime tre rate escono nell'anno; la quarta a febbraio dell'anno dopo. Per cassa conta l'uscita.
      contributiVersati += rata * 3;
    }
  } else if (prev.tipo === "cassa") {
    const c = calcolaContributi(prev, 0, { anno, annoAperturaPiva: profilo.annoAperturaPiva, regime, ricavi, parametri });
    const minimi = c.variabili + c.fissi;
    if (minimi > 0) {
      v.push({ data: dataIso(anno, "06-30"), tipo: "cassa", descrizione: `${prev.cassa.nome}: minimi e maternità ${anno}, prima rata`, importo: minimi / 2, annoImposta: anno });
      v.push({ data: dataIso(anno, "09-30"), tipo: "cassa", descrizione: `${prev.cassa.nome}: minimi e maternità ${anno}, seconda rata`, importo: minimi / 2, annoImposta: anno });
      contributiVersati += minimi;
    }
  }

  return { versamenti: v, contributiVersati, accontiImposta: 0, accontiContributi: 0 };
}

/** La quarta rata INPS dell'anno prima, che esce a febbraio: si deduce quest'anno. */
export function quartaRataInpsAnnoPrecedente(anno: number, precedente: RisultatoAnno | null): number {
  if (!precedente) return 0;
  return precedente.versamenti
    .filter((x) => x.tipo === "inps_fisso" && x.data.startsWith(`${anno}-`))
    .reduce((a, x) => a + x.importo, 0);
}

/** IVA e bollo dell'anno: dipendono dai ricavi dell'anno, non entrano nel reddito. */
export function versamentiIvaEBollo(anno: number, risultato: Pick<RisultatoAnno, "regime" | "ivaDaVersare" | "bollo">, profilo: Profilo, parametri: ParametriAnno): Versamento[] {
  const v: Versamento[] = [];
  const s = parametri.scadenze;
  if (risultato.regime === "ordinario" && risultato.ivaDaVersare > 0) {
    const iva = risultato.ivaDaVersare;
    if (profilo.periodicitaIva === "trimestrale") {
      const trimestre = iva / 4;
      const conInteressi = trimestre * (1 + parametri.iva.interessiTrimestrali);
      s.ivaTrimestrali.forEach((d, i) => v.push({ data: dataIso(anno, d), tipo: "iva", descrizione: `IVA ${i + 1}° trimestre ${anno} (con 1% interessi)`, importo: conInteressi, annoImposta: anno }));
      const acconto = trimestre * parametri.iva.accontoDicembre;
      v.push({ data: dataIso(anno, s.ivaAcconto), tipo: "iva", descrizione: `Acconto IVA ${anno}`, importo: acconto, annoImposta: anno });
      v.push({ data: dataIso(anno + 1, s.ivaUltimoTrimestreAnnoSuccessivo), tipo: "iva", descrizione: `IVA 4° trimestre ${anno} (saldo annuale)`, importo: trimestre - acconto, annoImposta: anno });
    } else {
      const mese = iva / 12;
      for (let m = 1; m <= 11; m++) {
        const mm = String(m + 1).padStart(2, "0");
        v.push({ data: `${anno}-${mm}-16`, tipo: "iva", descrizione: `IVA mensile ${anno}-${String(m).padStart(2, "0")}`, importo: mese, annoImposta: anno });
      }
      const acconto = mese * parametri.iva.accontoDicembre;
      v.push({ data: dataIso(anno, s.ivaAcconto), tipo: "iva", descrizione: `Acconto IVA ${anno}`, importo: acconto, annoImposta: anno });
      v.push({ data: `${anno + 1}-01-16`, tipo: "iva", descrizione: `IVA mensile ${anno}-12`, importo: mese - acconto, annoImposta: anno });
    }
  }
  if (risultato.regime === "forfettario" && risultato.bollo > 0) {
    const quarto = risultato.bollo / 4;
    s.bolloTrimestrale.forEach((d, i) => v.push({ data: dataIso(anno, d), tipo: "bollo", descrizione: `Bollo su fatture ${i + 1}° trimestre ${anno}`, importo: quarto, annoImposta: anno }));
    v.push({ data: dataIso(anno + 1, s.bolloUltimoTrimestreAnnoSuccessivo), tipo: "bollo", descrizione: `Bollo su fatture 4° trimestre ${anno}`, importo: quarto, annoImposta: anno });
  }
  return v;
}

export function totaleVersamentiNellAnno(versamenti: Versamento[], anno: number, escludi: Versamento["tipo"][] = []): number {
  return somma(versamenti.filter((x) => x.data.startsWith(`${anno}-`) && !escludi.includes(x.tipo)).map((x) => x.importo));
}
