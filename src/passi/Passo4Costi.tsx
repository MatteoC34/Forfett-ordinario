import { useMemo } from "react";
import type { Risposte } from "../stato";
import { Campo, Interruttore, Sezione, Avviso } from "../componenti/ui";
import { CATALOGO_COSTI, GRUPPI_COSTI, calcolaSpese, type VoceCosto } from "@motore/catalogoCosti";
import { euro, percento } from "../formato";

function tonoBadge(q: number): string {
  if (q >= 1) return "bg-emerald-50 text-emerald-800";
  if (q >= 0.5) return "bg-blue-50 text-blue-800";
  if (q > 0) return "bg-orange-50 text-orange-800";
  return "bg-neutral-100 text-neutral-600";
}

/**
 * Le spese, voce per voce. Ogni riga dice quanto si scarica dal reddito e
 * quanta IVA si recupera: è qui che il cliente capisce la differenza vera tra
 * i due regimi, prima ancora di vedere il risultato.
 */
export function Passo4Costi({ r, set }: { r: Risposte; set: (patch: Partial<Risposte>) => void }) {
  const ricavi = r.ricavi[0];
  const ctx = useMemo(() => ({ natura: r.natura, ricavi, anniDalPrimo: 0 }), [r.natura, ricavi]);
  const spese = useMemo(() => calcolaSpese(r.costi, ctx), [r.costi, ctx]);
  const perId = useMemo(() => new Map(spese.righe.map((x) => [x.voce.id, x])), [spese]);
  const setCosto = (id: string, v: number) => set({ costi: { ...r.costi, [id]: v } });

  return (
    <Sezione titolo="Quanto spendi per lavorare?" sotto={`Importi annui, IVA esclusa. ${r.natura === "professionista" ? "Regole del professionista (art. 54 TUIR)." : "Regole dell'impresa individuale (art. 66 TUIR)."} Nel forfettario nessuna di queste si scarica.`}>
      <div className="hidden grid-cols-[1fr_150px_56px_56px_84px] gap-3 border-b border-neutral-200 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[color:var(--inchiostro-2)] sm:grid">
        <span>Voce di spesa</span><span>Quanto spendi</span><span className="text-center">IRPEF</span><span className="text-center">IVA</span><span className="text-right">Dedotto</span>
      </div>
      {GRUPPI_COSTI.map((g) => (
        <div key={g.nome}>
          <div className="flex items-baseline gap-2 pt-3 pb-1">
            <h3 className="text-base font-semibold tracking-tight">{g.nome}</h3>
            {g.nota && <span className="text-[12px] text-[color:var(--inchiostro-2)]">{g.nota}</span>}
          </div>
          {CATALOGO_COSTI.filter((v) => v.gruppo === g.nome).map((voce) => (
            <RigaCosto key={voce.id} voce={voce} importo={r.costi[voce.id] ?? 0} dedotto={perId.get(voce.id)?.dedotto ?? 0} regola={voce.regola(ctx)} quota={voce.quota(ctx)} onChange={(v) => setCosto(voce.id, v)} />
          ))}
        </div>
      ))}
      <div className="grid grid-cols-[1fr_auto] gap-3 border-t-2 border-[color:var(--inchiostro)] pt-3 text-[14px] font-semibold sm:grid-cols-[1fr_150px_56px_56px_84px]">
        <span>Totale spese</span>
        <span className="text-right font-mono">{euro(spese.totale)}</span>
        <span className="hidden text-center text-[12px] text-[color:var(--inchiostro-2)] sm:block">{spese.totale > 0 ? percento(spese.dedotto / spese.totale) : ""}</span>
        <span className="hidden text-center text-[12px] text-[color:var(--inchiostro-2)] sm:block">{spese.ivaPagata > 0 ? percento(spese.ivaRecuperata / spese.ivaPagata) : ""}</span>
        <span className="hidden text-right font-mono sm:block">{euro(spese.dedotto)}</span>
      </div>

      <div className="space-y-2">
        <Interruttore valore={r.abitaRoma} onChange={(abitaRoma) => set({ abitaRoma })} etichetta="Risiedo a Roma" aiuto="Le addizionali IRPEF regionale e comunale dipendono da dove abiti. Spegni per inserirle a mano." />
        {!r.abitaRoma && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo etichetta="Addizionale regionale (%)">
              <input type="number" step={0.01} min={0} max={5} value={+(r.addizionaleRegionale * 100).toFixed(2)} onChange={(e) => set({ addizionaleRegionale: Number(e.target.value) / 100 })} className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-right font-mono" />
            </Campo>
            <Campo etichetta="Addizionale comunale (%)">
              <input type="number" step={0.01} min={0} max={1} value={+(r.addizionaleComunale * 100).toFixed(2)} onChange={(e) => set({ addizionaleComunale: Number(e.target.value) / 100 })} className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-right font-mono" />
            </Campo>
          </div>
        )}
      </div>
      <Avviso>Nell'ordinario l'IVA sulle vendite si versa allo Stato al netto di quella recuperabile sugli acquisti: non è un costo, ma esce di cassa. Nel forfettario l'IVA sugli acquisti resta un costo pieno.</Avviso>
    </Sezione>
  );
}

function RigaCosto({ voce, importo, dedotto, regola, quota, onChange }: { voce: VoceCosto; importo: number; dedotto: number; regola: string; quota: number; onChange: (v: number) => void }) {
  const quotaEffettiva = importo > 0 ? dedotto / importo : quota;
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-t border-neutral-100 py-2 sm:grid-cols-[1fr_150px_56px_56px_84px]">
      <div className="min-w-0 sm:col-span-1">
        <label htmlFor={`costo-${voce.id}`} className="block text-[13.5px] font-semibold leading-tight">{voce.nome}</label>
        <span className="block text-[11.5px] leading-snug text-[color:var(--inchiostro-2)]">{regola}</span>
      </div>
      <div className="row-span-2 sm:row-span-1">
        <input id={`costo-${voce.id}`} type="range" min={0} max={voce.massimo} step={voce.passo} value={importo} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[color:var(--forfettario)]" />
        <span className="-mt-0.5 block text-right font-mono text-[12.5px] font-medium tabular-nums">{euro(importo)}</span>
      </div>
      <span className={`justify-self-center rounded-full px-2 py-0.5 text-[11.5px] font-bold tabular-nums ${tonoBadge(quota)}`}>{voce.fuoriReddito ? "fuori" : percento(quotaEffettiva)}</span>
      <span className={`justify-self-center rounded-full px-2 py-0.5 text-[11.5px] font-bold tabular-nums ${tonoBadge(voce.quotaIva)}`}>{voce.quotaIva > 0 ? percento(voce.quotaIva) : "no"}</span>
      <span className="hidden text-right font-mono text-[12.5px] tabular-nums sm:block">{euro(dedotto)}</span>
    </div>
  );
}
