import { useMemo } from "react";
import type { Confronto, Profilo, Regime, RisultatoAnno, Versamento } from "@motore/tipi";
import { confronta, simulaRegime } from "@motore/simulazione";
import { parametriPerAnno } from "@motore/parametri";
import { aliquotaForfettario } from "@motore/forfettario";
import { calcolaSpese, type SpeseCalcolate } from "@motore/catalogoCosti";
import { contestoCosti, type ContestoCosti } from "@motore/costi";
import { costruisciProfilo, type Risposte } from "../stato";

export interface MeseCassa {
  /** Imposte, contributi e bollo: soldi tuoi che escono. */
  tasse: number;
  /** IVA versata: soldi dei clienti che transitano. */
  iva: number;
  voci: Versamento[];
}

export interface Modello {
  profilo: Profilo;
  confronto: Confronto;
  anni: number[];
  f1: RisultatoAnno;
  o1: RisultatoAnno;
  spese1: SpeseCalcolate;
  ctx1: ContestoCosti;
  coefficiente: number;
  aliquotaForf: number;
  /** Quanto rende ogni euro dedotto nell'ordinario, tra IRPEF, addizionali e contributi, a regime. */
  marginale: number;
  forfApplicabile: boolean;
  motiviForf: string[];
  vince: Regime | null;
  riferimento: Regime;
  pareggio: number | null;
  cassa: (regime: Regime, anno: number) => MeseCassa[];
  giugnoSecondoAnno: number;
  accantonaMese: number;
  ultimoAnnoStartup: number | null;
  nuovaAttivita: boolean;
}

function mesiCassa(anno: RisultatoAnno | undefined, a: number): MeseCassa[] {
  const mesi: MeseCassa[] = Array.from({ length: 12 }, () => ({ tasse: 0, iva: 0, voci: [] }));
  if (!anno) return mesi;
  for (const v of anno.versamenti) {
    if (!v.data.startsWith(`${a}-`)) continue;
    const m = mesi[Number(v.data.slice(5, 7)) - 1];
    m.voci.push(v);
    if (v.tipo === "iva") m.iva += Math.max(0, v.importo);
    else m.tasse += Math.max(0, v.importo);
  }
  return mesi;
}

/** Imposte e contributi di competenza dell'ultimo anno simulato. */
function caricoUltimoAnno(p: Profilo): number {
  const r = simulaRegime(p, "ordinario");
  const a = r.anni[r.anni.length - 1];
  return a.imposta.netta + a.contributi.totale;
}

export function calcolaModello(r: Risposte): Modello {
  const profilo = costruisciProfilo(r);
  const confronto = confronta(profilo);
  const anni = confronto.forfettario.anni.map((a) => a.anno);
  const f1 = confronto.forfettario.anni[0];
  const o1 = confronto.ordinario.anni[0];
  const P = parametriPerAnno(anni[0]);
  const ctx1 = contestoCosti(profilo, o1.ricaviFiscali, anni[0]);
  const spese1 = calcolaSpese(profilo.costi, ctx1);

  // Il risparmio di un euro dedotto: si misura sull'ultimo anno, quando anche
  // i contributi dell'anno prima sono già stati dedotti. È il valore a regime.
  const conRc = (extra: number): Profilo => ({ ...profilo, costi: { ...profilo.costi, rc: (profilo.costi.rc ?? 0) + extra } });
  const marginale = Math.max(0, (caricoUltimoAnno(conRc(0)) - caricoUltimoAnno(conRc(100))) / 100);

  const forfApplicabile = f1.applicabile;
  const vince = confronto.conviene;
  const riferimento: Regime = vince ?? "ordinario";
  const serieRif = riferimento === "forfettario" ? confronto.forfettario : confronto.ordinario;
  const secondo = serieRif.anni[1];
  const mesiSecondo = mesiCassa(secondo, anni[1]);
  const startupAttivo = profilo.requisitiStartup && aliquotaForfettario(profilo, anni[0], P) === P.forfettario.impostaStartup;

  return {
    profilo,
    confronto,
    anni,
    f1,
    o1,
    spese1,
    ctx1,
    coefficiente: P.forfettario.coefficienti[profilo.gruppoCoefficiente],
    aliquotaForf: aliquotaForfettario(profilo, anni[0], P),
    marginale,
    forfApplicabile,
    motiviForf: f1.motiviNonApplicabile,
    vince,
    riferimento,
    pareggio: confronto.puntoIndifferenzaCosti,
    cassa: (regime, anno) => mesiCassa((regime === "forfettario" ? confronto.forfettario : confronto.ordinario).anni.find((a) => a.anno === anno), anno),
    giugnoSecondoAnno: secondo ? mesiSecondo[5].tasse : 0,
    accantonaMese: secondo ? mesiSecondo.reduce((t, m) => t + m.tasse, 0) / 12 : 0,
    ultimoAnnoStartup: startupAttivo ? profilo.annoAperturaPiva + P.forfettario.anniStartup - 1 : null,
    nuovaAttivita: profilo.annoAperturaPiva === profilo.annoInizio,
  };
}

export function useModello(r: Risposte): Modello {
  return useMemo(() => calcolaModello(r), [r]);
}
