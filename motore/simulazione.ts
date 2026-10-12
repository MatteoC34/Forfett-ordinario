import type { Confronto, CostiOrdinario, Profilo, Regime, RisultatoAnno, RisultatoRegime, Versamento } from "./tipi";
import { importiSuggeriti } from "./catalogoCosti";
import { parametriPerAnno } from "./parametri";
import { calcolaForfettarioAnno, verificaForfettario } from "./forfettario";
import { calcolaOrdinarioAnno } from "./ordinario";
import {
  quartaRataInpsAnnoPrecedente,
  totaleVersamentiNellAnno,
  versamentiDaAnnoPrecedente,
  versamentiFissiDellAnno,
  versamentiIvaEBollo,
} from "./calendario";
import { somma } from "./utilita";
import { enasarcoAnno } from "./previdenza";

/**
 * Simula un regime per tutti gli anni del profilo. Gli anni si tengono per
 * mano: l'anno N paga il saldo di N-1 e gli acconti su N-1, e deduce i
 * contributi usciti davvero in N. È qui che si vede il secondo anno.
 *
 * Se il forfettario non è applicabile in un anno, quell'anno viene calcolato
 * con l'ordinario e marcato: la serie resta leggibile e onesta.
 */
export function simulaRegime(profilo: Profilo, regimeRichiesto: Regime): RisultatoRegime {
  const anni: RisultatoAnno[] = [];
  let precedente: RisultatoAnno | null = null;

  // Attività già avviata: un anno di rodaggio nascosto, così il primo anno
  // mostrato ha già saldo e acconti come succede nella realtà.
  if (profilo.annoAperturaPiva < profilo.annoInizio) {
    precedente = simulaAnno(profilo, regimeRichiesto, profilo.annoInizio - 1, profilo.ricaviPerAnno[0], null);
  }

  profilo.ricaviPerAnno.forEach((ricavi, i) => {
    const anno = profilo.annoInizio + i;
    const r = simulaAnno(profilo, regimeRichiesto, anno, ricavi, precedente);
    anni.push(r);
    precedente = r;
  });

  const ultimo = anni[anni.length - 1];
  const annoCoda = ultimo.anno + 1;
  const coda = [
    ...versamentiDaAnnoPrecedente(annoCoda, ultimo, profilo, parametriPerAnno(annoCoda)).versamenti,
    ...ultimo.versamenti.filter((v) => v.data.startsWith(`${annoCoda}-`)),
  ].sort((a, b) => a.data.localeCompare(b.data));

  return {
    regime: regimeRichiesto,
    anni,
    totaleNettoCompetenza: somma(anni.map((a) => a.nettoCompetenza)),
    totaleImposte: somma(anni.map((a) => a.imposta.netta)),
    totaleContributi: somma(anni.map((a) => a.contributi.totale)),
    codaVersamenti: coda,
  };
}

function simulaAnno(profilo: Profilo, regimeRichiesto: Regime, anno: number, ricavi: number, precedente: RisultatoAnno | null): RisultatoAnno {
  const parametri = parametriPerAnno(anno);

  let regime: Regime = regimeRichiesto;
  let applicabile = true;
  let motivi: string[] = [];
  let avvisiVerifica: string[] = [];
  if (regimeRichiesto === "forfettario") {
    const v = verificaForfettario(profilo, anno, ricavi, precedente ? precedente.ricaviFiscali : null, parametri);
    if (!v.applicabile) {
      regime = "ordinario";
      applicabile = false;
      motivi = v.motivi;
    }
    avvisiVerifica = v.avvisi;
  }

  const daPrecedente = versamentiDaAnnoPrecedente(anno, precedente, profilo, parametri);
  const fissi = versamentiFissiDellAnno(anno, regime, ricavi, profilo, parametri);
  // L'Enasarco lo trattiene la mandante sulle provvigioni dell'anno: si deduce nello stesso anno.
  const enasarco = enasarcoAnno(profilo, ricavi, parametri);
  const contributiVersati = daPrecedente.contributiVersati + fissi.contributiVersati + quartaRataInpsAnnoPrecedente(anno, precedente) + enasarco;

  const base =
    regime === "forfettario"
      ? calcolaForfettarioAnno(profilo, anno, ricavi, contributiVersati, parametri)
      : calcolaOrdinarioAnno(profilo, anno, ricavi, contributiVersati, parametri);

  const ivaEBollo = versamentiIvaEBollo(anno, base, profilo, parametri);
  const versamenti: Versamento[] = [...daPrecedente.versamenti, ...fissi.versamenti, ...ivaEBollo].sort((a, b) => a.data.localeCompare(b.data));

  // Cassa dell'anno: entrate meno costi, meno tutto ciò che esce (IVA esclusa:
  // è denaro dei clienti che transita), meno le ritenute trattenute alla fonte.
  const usciteNellAnno = totaleVersamentiNellAnno(versamenti, anno, ["iva"]);
  const quartaRata = quartaRataInpsAnnoPrecedente(anno, precedente);
  const nettoCassa =
    base.ricaviFiscali - base.costiReali - base.ivaSuAcquistiNonRecuperata - usciteNellAnno - quartaRata - base.ritenuteSubite - base.contributi.enasarco;

  const avvisi = [...avvisiVerifica, ...base.avvisi];
  if (regime === "ordinario" && regimeRichiesto === "forfettario") {
    avvisi.unshift("Anno calcolato con il regime ordinario perché il forfettario non è applicabile.");
  }
  if (!precedente && anno === profilo.annoAperturaPiva) {
    avvisi.push("Primo anno di attività: niente acconti. L'anno prossimo pagherai saldo e acconti insieme.");
  }

  return {
    ...base,
    regime,
    applicabile,
    motiviNonApplicabile: motivi,
    avvisi,
    nettoCompetenza: base.nettoCompetenza - base.bollo,
    nettoCassa,
    accontiVersati: { imposta: daPrecedente.accontiImposta, contributi: daPrecedente.accontiContributi },
    versamenti,
  };
}

/** Il confronto tra i due regimi, con il punto in cui l'ordinario pareggia. */
export function confronta(profilo: Profilo): Confronto {
  const forfettario = simulaRegime(profilo, "forfettario");
  const ordinario = simulaRegime(profilo, "ordinario");
  const forfettarioApplicabile = forfettario.anni.some((a) => a.applicabile);
  const differenza = forfettario.totaleNettoCompetenza - ordinario.totaleNettoCompetenza;
  const conviene: Regime | null = !forfettarioApplicabile ? null : differenza >= 0 ? "forfettario" : "ordinario";
  return {
    forfettario,
    ordinario,
    conviene,
    differenzaNettoTotale: differenza,
    puntoIndifferenzaCosti: forfettarioApplicabile ? puntoIndifferenzaCosti(profilo) : null,
  };
}

/**
 * Quante spese servono, nel primo anno, perché l'ordinario renda quanto il
 * forfettario: si scalano tutte le voci in proporzione e si cerca per
 * bisezione il totale che pareggia il netto di competenza.
 */
export function puntoIndifferenzaCosti(profilo: Profilo): number | null {
  const unAnno: Profilo = { ...profilo, ricaviPerAnno: [profilo.ricaviPerAnno[0]] };
  if (!simulaRegime(unAnno, "forfettario").anni[0].applicabile) return null;
  const base = Object.keys(profilo.costi).length > 0 ? profilo.costi : importiSuggeriti();
  const totaleBase = Object.values(base).reduce((a, b) => a + b, 0);
  if (totaleBase <= 0) return null;
  const scala = (k: number): CostiOrdinario => Object.fromEntries(Object.entries(base).map(([id, v]) => [id, v * k]));
  const diff = (k: number) => {
    const p = { ...unAnno, costi: scala(k) };
    return simulaRegime(p, "ordinario").anni[0].nettoCompetenza - simulaRegime(p, "forfettario").anni[0].nettoCompetenza;
  };
  let lo = 0;
  let hi = 10;
  if (diff(lo) >= 0) return 0;
  if (diff(hi) < 0) return null;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (diff(mid) >= 0) hi = mid;
    else lo = mid;
  }
  return Math.round(hi * totaleBase);
}
