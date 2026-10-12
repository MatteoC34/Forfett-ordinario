import { useState } from "react";
import { CATALOGO_COSTI, GRUPPI_COSTI, importiSuggeriti, quotaIvaDi } from "@motore/catalogoCosti";
import type { Modello } from "./useModello";
import type { Risposte } from "../stato";
import { Badge } from "../componenti/ui";
import { tonoQuota } from "../componenti/toni";
import { euro, percento } from "../formato";

const COLONNE = "lg:grid-cols-[minmax(0,1fr)_168px_58px_58px_86px_86px] print:grid-cols-[minmax(0,1fr)_80px_52px_52px_76px_76px]";

/**
 * Le spese voce per voce: quanto si scarica dal reddito, quanta IVA si
 * recupera, quanto fa risparmiare davvero. È la parte della pagina dove si
 * capisce la differenza tra i due regimi.
 */
export function CatalogoCosti({ m, r, set }: { m: Modello; r: Risposte; set: (patch: Partial<Risposte>) => void }) {
  const righe = new Map(m.spese1.righe.map((x) => [x.voce.id, x]));
  const setCosto = (id: string, v: number) => set({ costi: { ...r.costi, [id]: v } });
  const azzera = () => set({ costi: Object.fromEntries(CATALOGO_COSTI.map((v) => [v.id, 0])) });
  const tipici = () => set({ costi: importiSuggeriti() });
  const s = m.spese1;
  // Su schermo largo i gruppi partono aperti; sul telefono chiusi, col totale in vista.
  const [aperti, setAperti] = useState<Record<string, boolean>>(() => {
    let largo = true;
    try {
      largo = window.matchMedia("(min-width: 1024px)").matches;
    } catch {
      /* senza matchMedia si parte aperti */
    }
    return Object.fromEntries(GRUPPI_COSTI.map((g) => [g.nome, largo]));
  });

  return (
    <div className="flex min-w-0 flex-col">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="m-0 text-[24px] font-bold leading-tight">Ogni spesa, con la sua regola</h3>
          <p className="m-0 mt-1 max-w-[62ch] text-[14px] text-testo2">
            Quanto si scarica dal reddito e quanta IVA recuperi. {m.ctx1.natura === "professionista" ? "Regole del professionista (art. 54 TUIR)." : "Regole dell'impresa individuale (art. 66 TUIR)."}
            {m.ctx1.agente && " Da agente di commercio l'auto vale l'80% e l'IVA è intera."}
          </p>
        </div>
        <div className="no-stampa flex gap-2">
          <button type="button" onClick={tipici} className="min-h-[32px] rounded-full border border-bordo2 px-3 text-[12.5px] font-semibold text-testo2 hover:border-blu hover:text-bluTesto">Valori tipici</button>
          <button type="button" onClick={azzera} className="min-h-[32px] rounded-full border border-bordo2 px-3 text-[12.5px] font-semibold text-testo2 hover:border-blu hover:text-bluTesto">Azzera</button>
        </div>
      </div>

      <div className={`hidden gap-3 border-b border-bordo pb-1.5 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-testo3 lg:grid print:grid ${COLONNE}`}>
        <span>Voce di spesa</span>
        <span>Quanto spendi l'anno</span>
        <span className="text-center">IRPEF</span>
        <span className="text-center">IVA</span>
        <span className="text-right">Dedotto</span>
        <span className="text-right">Risparmi</span>
      </div>

      {GRUPPI_COSTI.map((g) => {
        const voci = CATALOGO_COSTI.filter((v) => v.gruppo === g.nome);
        const totaleGruppo = voci.reduce((t, v) => t + (r.costi[v.id] ?? 0), 0);
        const dedottoGruppo = voci.reduce((t, v) => t + (righe.get(v.id)?.dedotto ?? 0), 0);
        const aperto = aperti[g.nome];
        const idGruppo = `gruppo-${g.nome.replace(/\W+/g, "-").toLowerCase()}`;
        return (
          <div key={g.nome} className={totaleGruppo === 0 ? "riga-vuota" : ""}>
            <button type="button" aria-expanded={aperto} aria-controls={idGruppo} onClick={() => setAperti({ ...aperti, [g.nome]: !aperto })} className="flex w-full flex-wrap items-baseline gap-x-2.5 gap-y-0.5 border-t border-bordo pb-1.5 pt-4 text-left first-of-type:border-t-0">
              <span aria-hidden="true" className={`no-stampa inline-block w-3 font-mono text-[12px] text-testo3 transition-transform ${aperto ? "rotate-90" : ""}`}>›</span>
              <span className="font-display text-[16px] font-bold tracking-[-0.02em]">{g.nome}</span>
              <span className="ml-auto font-mono text-[12.5px] text-testo2 cifre">{euro(totaleGruppo)} · dedotti {euro(dedottoGruppo)}</span>
              {g.nota && <span className="basis-full pl-[22px] text-[12px] text-testo3">{g.nota}</span>}
            </button>
            <div id={idGruppo} hidden={!aperto} className="pannello-scheda">
            {voci.map((voce) => {
              const riga = righe.get(voce.id);
              const importo = r.costi[voce.id] ?? 0;
              const dedotto = riga?.dedotto ?? 0;
              const quota = voce.quota(m.ctx1);
              const quotaEff = importo > 0 ? dedotto / importo : quota;
              const qIva = quotaIvaDi(voce, m.ctx1);
              const risparmio = dedotto * m.marginale + (riga?.ivaRecuperata ?? 0);
              return (
                <div key={voce.id} className={`riga-costo grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 border-t border-neutroTenue py-2.5 ${COLONNE} ${importo === 0 ? "riga-vuota" : ""}`}>
                  <div className="col-start-1 row-start-1 min-w-0 lg:col-start-auto lg:row-start-auto print:col-start-auto print:row-start-auto">
                    <label htmlFor={`costo-${voce.id}`} className="block text-[13.5px] font-semibold leading-tight">{voce.nome}</label>
                    <span className="block text-[11.5px] leading-snug text-testo3">{voce.regola(m.ctx1)}</span>
                  </div>
                  <div className="col-span-2 col-start-1 row-start-2 lg:col-span-1 lg:col-start-auto lg:row-start-auto print:col-span-1 print:col-start-auto print:row-start-auto">
                    <input id={`costo-${voce.id}`} className="ordinario no-stampa" type="range" min={0} max={voce.massimo} step={voce.passo} value={importo} onChange={(e) => setCosto(voce.id, Number(e.target.value))} />
                    <span className="-mt-0.5 block text-right font-mono text-[12.5px] font-medium cifre">{euro(importo)}</span>
                  </div>
                  <span className="col-start-2 row-start-1 justify-self-end lg:col-start-auto lg:row-start-auto lg:justify-self-center print:col-start-auto print:row-start-auto print:justify-self-center">
                    <Badge tono={voce.fuoriReddito ? "neutro" : tonoQuota(quota)}>{voce.fuoriReddito ? "fuori" : percento(quotaEff)}</Badge>
                  </span>
                  <span className="hidden justify-self-center lg:inline print:inline">
                    <Badge tono={tonoQuota(qIva)}>{qIva > 0 && voce.conIva ? percento(qIva) : "no"}</Badge>
                  </span>
                  <span className="col-span-2 flex justify-between gap-3 text-[12.5px] lg:col-span-1 lg:block lg:text-right print:col-span-1 print:block print:text-right">
                    <span className="text-testo3 lg:hidden print:hidden">Dedotto · IVA {qIva > 0 && voce.conIva ? percento(qIva) : "no"}</span>
                    <span className="font-mono cifre">{euro(dedotto)}</span>
                  </span>
                  <span className="col-span-2 flex justify-between gap-3 text-[12.5px] lg:col-span-1 lg:block lg:text-right print:col-span-1 print:block print:text-right">
                    <span className="text-testo3 lg:hidden print:hidden">Risparmi</span>
                    <span className="font-mono font-medium text-verde cifre">{euro(risparmio)}</span>
                  </span>
                </div>
              );
            })}
            </div>
          </div>
        );
      })}

      <div className={`mt-3 grid grid-cols-2 gap-3 border-t-2 border-testo pt-3 text-[14px] font-bold ${COLONNE}`}>
        <span>Totale spese</span>
        <span className="text-right font-mono cifre">{euro(s.totale)}</span>
        <span className="hidden text-center text-[12px] font-semibold text-testo2 lg:block print:block">{s.totale > 0 ? percento(s.dedotto / s.totale) : ""}</span>
        <span className="hidden text-center text-[12px] font-semibold text-testo2 lg:block print:block">{s.ivaPagata > 0 ? percento(s.ivaRecuperata / s.ivaPagata) : ""}</span>
        <span className="text-testo2 lg:hidden print:hidden">Dedotto</span>
        <span className="text-right font-mono cifre">{euro(s.dedotto)}</span>
        <span className="text-testo2 lg:hidden print:hidden">Risparmi</span>
        <span className="text-right font-mono text-verde cifre">{euro(s.dedotto * m.marginale + s.ivaRecuperata)}</span>
      </div>
      <p className="m-0 mt-3 text-[12px] leading-relaxed text-testo3">
        Risparmi è il dedotto per {percento(m.marginale)}, quanto vale a regime un euro dedotto tra IRPEF, addizionali e contributi, più l'IVA che recuperi. Dal 2025 vitto, alloggio, taxi, NCC e rappresentanza si deducono solo se pagati con carta o bonifico.
      </p>
    </div>
  );
}
