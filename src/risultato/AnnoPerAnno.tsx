import type { Modello } from "./useModello";
import { Carta } from "../componenti/ui";
import { euro } from "../formato";

export function AnnoPerAnno({ m }: { m: Modello }) {
  const c = m.confronto;
  return (
    <Carta className="carta-stampa p-0 sm:p-0">
      <div className="px-5 pb-2 pt-5 sm:px-6">
        <h3 className="m-0 text-[22px] font-bold">Anno per anno</h3>
        <p className="m-0 mt-1 text-[13.5px] text-testo2">Imposte e contributi di competenza, e quanto ti resta dopo le spese.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[14px]">
          <thead>
            <tr className="text-left text-[12px] text-testo2">
              <th className="px-5 py-2.5 font-semibold sm:px-6">Anno</th>
              <th className="px-3 py-2.5 text-right font-semibold" colSpan={2}><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-[3px] bg-blu align-middle" aria-hidden="true" />Forfettario</th>
              <th className="px-3 py-2.5 pr-5 text-right font-semibold sm:pr-6" colSpan={2}><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-[3px] bg-corallo align-middle" aria-hidden="true" />Ordinario</th>
            </tr>
            <tr className="border-b border-bordo text-right text-[11px] text-testo3">
              <th />
              <th className="px-3 pb-2 font-medium">Imposte e contributi</th>
              <th className="px-3 pb-2 font-medium">Netto</th>
              <th className="px-3 pb-2 font-medium">Imposte e contributi</th>
              <th className="px-3 pb-2 pr-5 font-medium sm:pr-6">Netto</th>
            </tr>
          </thead>
          <tbody className="font-mono cifre">
            {m.anni.map((anno, i) => {
              const f = c.forfettario.anni[i];
              const o = c.ordinario.anni[i];
              const secondo = i === 1 && m.nuovaAttivita;
              return (
                <tr key={anno} className={`border-b border-bordo last:border-b-0 ${secondo ? "bg-ambraTenue" : ""}`}>
                  <td className="px-5 py-3 font-sans font-semibold sm:px-6">
                    {anno}
                    {f.regime === "ordinario" && <span className="ml-2 font-normal text-testo2">· forfettario non applicabile</span>}
                    {secondo && <span className="ml-2 font-normal text-ambra">· saldo e acconti insieme</span>}
                  </td>
                  <td className="px-3 py-3 text-right">{euro(f.imposta.netta + f.contributi.totale)}</td>
                  <td className="px-3 py-3 text-right font-medium">{euro(f.nettoCompetenza)}</td>
                  <td className="px-3 py-3 text-right">{euro(o.imposta.netta + o.contributi.totale)}</td>
                  <td className="px-3 py-3 pr-5 text-right font-medium sm:pr-6">{euro(o.nettoCompetenza)}</td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-testo font-semibold">
              <td className="px-5 py-3 font-sans sm:px-6">Tre anni</td>
              <td className="px-3 py-3 text-right">{euro(c.forfettario.totaleImposte + c.forfettario.totaleContributi)}</td>
              <td className="px-3 py-3 text-right text-bluTesto">{euro(c.forfettario.totaleNettoCompetenza)}</td>
              <td className="px-3 py-3 text-right">{euro(c.ordinario.totaleImposte + c.ordinario.totaleContributi)}</td>
              <td className="px-3 py-3 pr-5 text-right text-coralloTesto sm:pr-6">{euro(c.ordinario.totaleNettoCompetenza)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Carta>
  );
}
