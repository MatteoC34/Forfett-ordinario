import { useState } from "react";
import type { RisultatoAnno } from "@motore/tipi";
import { parametriPerAnno } from "@motore/parametri";
import type { Modello } from "./useModello";
import { Carta } from "../componenti/ui";
import { euro, percento } from "../formato";

const righe = (a: RisultatoAnno): Array<[string, string]> => [
  ["Incassi considerati", euro(a.ricaviFiscali)],
  ["Spese sostenute", euro(a.costiReali)],
  ["Spese dedotte", euro(a.costiDeducibili)],
  ["Base contributiva", euro(a.contributi.baseImponibile)],
  ["Contributi fissi", euro(a.contributi.fissi)],
  ["Contributi sul reddito", euro(a.contributi.variabili)],
  ["Enasarco", euro(a.contributi.enasarco)],
  ["Contributi pagati e dedotti", euro(a.contributiVersatiNellAnno)],
  ["Reddito imponibile", euro(a.imposta.redditoImponibile)],
  ["Imposta lorda", euro(a.imposta.lorda)],
  ["Detrazioni", euro(a.imposta.detrazioni)],
  ["Addizionali", euro(a.imposta.addizionaleRegionale + a.imposta.addizionaleComunale)],
  ["Imposta netta", euro(a.imposta.netta)],
  ["Ritenute subite", euro(a.ritenuteSubite)],
  ["IVA da versare", euro(a.ivaDaVersare)],
  ["IVA sugli acquisti persa", euro(a.ivaSuAcquistiNonRecuperata)],
  ["Bollo", euro(a.bollo)],
  ["Netto di competenza", euro(a.nettoCompetenza)],
  ["Netto di cassa", euro(a.nettoCassa)],
  ["Imposte e contributi sugli incassi", percento((a.imposta.netta + a.contributi.totale) / Math.max(1, a.ricaviFiscali))],
];

export function Dettagli({ m }: { m: Modello }) {
  const [aperto, setAperto] = useState(false);
  const P = parametriPerAnno(m.anni[0]);
  const fonti = [P.forfettario.fonte, P.irpef.fonte, P.acconti.fonte, P.gestioneSeparata.fonte, P.artigianiCommercianti.fonte, P.enasarco.fonte, P.deducibilita.fonte, P.scadenze.fonte];
  const note = Array.from(new Set([...m.confronto.forfettario.anni, ...m.confronto.ordinario.anni].flatMap((a) => [...a.avvisi, ...a.contributi.note])));
  return (
    <Carta className="p-0 sm:p-0">
      <button type="button" aria-expanded={aperto} aria-controls="dettagli-tecnici" onClick={() => setAperto(!aperto)} className="no-stampa flex w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-6">
        <span className="font-display text-[19px] font-bold tracking-[-0.02em]">Dettagli tecnici, note e fonti</span>
        <span className="text-[13px] font-semibold text-bluTesto">{aperto ? "Chiudi" : "Apri"}</span>
      </button>
      <div id="dettagli-tecnici" hidden={!aperto} className="pannello-scheda flex flex-col gap-6 border-t border-bordo px-5 py-5 sm:px-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {[m.confronto.forfettario, m.confronto.ordinario].map((s) => (
            <div key={s.regime} className="min-w-0 overflow-x-auto">
              <table className="w-full min-w-[440px] border-collapse text-[12.5px]">
                <thead>
                  <tr className="border-b border-bordo text-left text-testo2">
                    <th className="py-2 pr-3 font-semibold">
                      <span className={`mr-1.5 inline-block h-2.5 w-2.5 rounded-[3px] align-middle ${s.regime === "forfettario" ? "bg-blu" : "bg-corallo"}`} aria-hidden="true" />
                      {s.regime === "forfettario" ? "Forfettario" : "Ordinario"}
                    </th>
                    {s.anni.map((a) => (
                      <th key={a.anno} className="py-2 pl-3 text-right font-semibold">{a.anno}{a.regime !== s.regime && " *"}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-mono cifre">
                  {righe(s.anni[0]).map(([voce], i) => (
                    <tr key={voce} className="border-b border-neutroTenue">
                      <td className="py-1.5 pr-3 font-sans">{voce}</td>
                      {s.anni.map((a) => (
                        <td key={a.anno} className="py-1.5 pl-3 text-right">{righe(a)[i][1]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {s.anni.some((a) => a.regime !== s.regime) && <p className="m-0 mt-1 text-[11.5px] text-testo3">* anno calcolato in ordinario perché il forfettario non è applicabile.</p>}
            </div>
          ))}
        </div>
        {note.length > 0 && (
          <div>
            <p className="m-0 mb-1 text-[13px] font-semibold">Note sul tuo caso</p>
            <ul className="m-0 list-disc pl-5 text-[13px] leading-relaxed text-testo2">
              {note.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="text-[12px] leading-relaxed text-testo3">
          <p className="m-0 mb-1 font-semibold text-testo2">Parametri e fonti {P.anno}</p>
          <ul className="m-0 list-disc pl-5">
            {fonti.map((f) => (
              <li key={f.norma}>
                {f.norma}
                {f.url && (
                  <>
                    {" · "}
                    <a href={f.url} target="_blank" rel="noreferrer" className="text-bluTesto underline">fonte</a>
                  </>
                )}
                {f.stato === "provvisorio" && " · valore provvisorio"}
              </li>
            ))}
          </ul>
          <p className="m-0 mt-2">Limiti noti: le date seguono il calendario ordinario; nel forfettario oltre 100.000 € l'anno intero è calcolato in ordinario; gli oneri personali (spese mediche, mutuo, familiari a carico) non sono considerati; le Casse professionali sono ridotte alle loro regole principali.</p>
        </div>
      </div>
    </Carta>
  );
}
