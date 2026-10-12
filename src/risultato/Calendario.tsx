import { useState } from "react";
import type { Regime } from "@motore/tipi";
import type { Modello } from "./useModello";
import type { Risposte } from "../stato";
import { Carta, Etichetta, Seg } from "../componenti/ui";
import { dataIt, euro, MESI, MESI_ESTESI } from "../formato";

/**
 * Le uscite di cassa mese per mese. Barre piene: imposte, contributi e bollo,
 * cioè soldi tuoi. Barre chiare: IVA, soldi dei clienti che transitano.
 * Ogni mese è un bottone: cliccato mostra cosa paghi e quando.
 */
export function Calendario({ m, r, set }: { m: Modello; r: Risposte; set: (patch: Partial<Risposte>) => void }) {
  const [regime, setRegime] = useState<Regime>(m.forfApplicabile ? m.riferimento : "ordinario");
  const [anno, setAnno] = useState(m.anni[Math.min(1, m.anni.length - 1)]);
  const [mese, setMese] = useState(5);
  const regimeEff: Regime = m.forfApplicabile ? regime : "ordinario";
  const mesi = m.cassa(regimeEff, anno);
  const scala = Math.max(1, ...m.anni.flatMap((a) => (["forfettario", "ordinario"] as Regime[]).flatMap((rg) => m.cassa(rg, a).map((x) => x.tasse + x.iva))));
  const totTasse = mesi.reduce((t, x) => t + x.tasse, 0);
  const totIva = mesi.reduce((t, x) => t + x.iva, 0);
  const sel = mesi[mese];
  const pieno = regimeEff === "forfettario" ? "bg-blu" : "bg-corallo";
  const chiaro = regimeEff === "forfettario" ? "bg-bluTenue" : "bg-coralloTenue";

  return (
    <Carta className="carta-stampa flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="m-0 text-[22px] font-bold">Quando esce, davvero</h3>
          <p className="m-0 mt-1 max-w-[60ch] text-[13.5px] text-testo2">
            Clicca un mese per vedere cosa paghi. {m.nuovaAttivita && "Nel primo anno non ci sono acconti: a giugno del secondo arrivano saldo e primo acconto insieme."}
          </p>
        </div>
        <div className="no-stampa flex flex-wrap gap-2">
          {m.forfApplicabile && <Seg nome="Regime" piccolo valore={regimeEff} onChange={setRegime} opzioni={[{ id: "forfettario", nome: "Forfettario" }, { id: "ordinario", nome: "Ordinario" }]} />}
          <Seg nome="Anno" piccolo valore={anno} onChange={setAnno} opzioni={m.anni.map((a) => ({ id: a, nome: String(a) }))} />
          {regimeEff === "ordinario" && <Seg nome="Liquidazione IVA" piccolo valore={r.periodicitaIva} onChange={(periodicitaIva) => set({ periodicitaIva })} opzioni={[{ id: "trimestrale", nome: "IVA trimestrale" }, { id: "mensile", nome: "mensile" }]} />}
        </div>
      </div>

      <div>
        <div className="flex h-[190px] items-end gap-1.5 border-b border-bordo sm:gap-2" role="group" aria-label={`Uscite mensili ${anno}`}>
          {mesi.map((x, i) => {
            const hT = (x.tasse / scala) * 100;
            const hI = (x.iva / scala) * 100;
            const attivo = i === mese;
            return (
              <button key={i} type="button" onClick={() => setMese(i)} aria-pressed={attivo} aria-label={`${MESI_ESTESI[i]} ${anno}: ${euro(x.tasse)} di imposte e contributi${x.iva > 0 ? `, ${euro(x.iva)} di IVA` : ""}`} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                <span className={`mb-1 block truncate text-center font-mono text-[10.5px] font-semibold cifre ${attivo ? "text-testo" : "text-testo3"}`}>{etichettaBarra(x.tasse + x.iva)}</span>
                {hI > 0 && <span className={`block w-full rounded-t-[6px] ${chiaro} ${attivo ? "" : "opacity-80"}`} style={{ height: `${Math.max(2, hI)}%` }} />}
                {hT > 0 && <span className={`block w-full ${hI > 0 ? "" : "rounded-t-[6px]"} ${pieno} ${attivo ? "" : "opacity-60"}`} style={{ height: `${Math.max(2, hT)}%` }} />}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex gap-1.5 sm:gap-2">
          {MESI.map((n, i) => (
            <span key={n} className={`min-w-0 flex-1 text-center text-[11.5px] ${i === mese ? "font-bold text-testo" : "text-testo3"}`}>
              {n}
              <span className={`mx-auto mt-1 block h-1 w-5 rounded ${i === mese ? "bg-testo" : "bg-transparent"}`} />
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-[12px] text-testo2">
          <span className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-[3px] ${pieno}`} aria-hidden="true" />Imposte, contributi e bollo</span>
          {regimeEff === "ordinario" && <span className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-[3px] ${chiaro} border border-bordo2`} aria-hidden="true" />IVA, che transita</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 border-t border-bordo pt-4 md:grid-cols-12">
        <div className="md:col-span-4">
          <Etichetta>{MESI_ESTESI[mese]} {anno} · {regimeEff}</Etichetta>
          <span className="mt-2 block font-display text-[38px] font-bold leading-none tracking-[-0.04em] cifre">{euro(sel.tasse)}</span>
          <span className="mt-1.5 block text-[12.5px] text-testo2">
            nel mese{sel.iva > 0 && `, più ${euro(sel.iva)} di IVA`}. Nell'anno: {euro(totTasse)}
            {totIva > 0 && ` e ${euro(totIva)} di IVA`}.
          </span>
        </div>
        <div className="min-w-0 md:col-span-8">
          {sel.voci.length === 0 ? (
            <p className="m-0 text-[14px] text-testo2">Niente da versare questo mese.</p>
          ) : (
            <ul className="m-0 list-none p-0">
              {sel.voci.map((v, i) => (
                <li key={i} className="flex items-baseline gap-3 border-b border-bordo py-2 text-[14px] last:border-b-0">
                  <span className="w-[66px] shrink-0 font-mono text-[12.5px] text-testo3">{dataIt(v.data)}</span>
                  <span className={`min-w-0 flex-1 ${v.tipo === "iva" ? "text-testo2" : ""}`}>{v.descrizione}</span>
                  <span className={`font-mono font-medium cifre ${v.importo < 0 ? "text-verde" : ""}`}>{euro(v.importo)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p className="m-0 text-[11.5px] leading-relaxed text-testo3">Date secondo il calendario ordinario, senza gli slittamenti a lunedì e le proroghe decise anno per anno. Nel {m.anni[0]} il saldo di ISA e forfettari è stato prorogato al 20 luglio.</p>
    </Carta>
  );
}

/** Sopra le barre: 16,1k per le migliaia, l'importo intero sotto i mille. */
function etichettaBarra(v: number): string {
  if (v <= 0) return "";
  if (v < 1000) return String(Math.round(v));
  return (Math.round(v / 100) / 10).toLocaleString("it-IT") + "k";
}
