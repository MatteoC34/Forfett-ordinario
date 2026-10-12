import type { Risposte } from "../stato";
import { Campo, Euro, Interruttore, Sezione, Avviso } from "../componenti/ui";

export function Passo4Costi({ r, set }: { r: Risposte; set: (patch: Partial<Risposte>) => void }) {
  const c = r.costi;
  const setCosto = (k: keyof Risposte["costi"], v: number) => set({ costi: { ...c, [k]: v } });
  return (
    <Sezione titolo="Quanto spendi per lavorare?" sotto="Importi annui, IVA esclusa. Nel forfettario i costi non si scaricano: è qui che si decide il confronto.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etichetta="Spese generali" aiuto="Software, affitto studio o coworking, materiali, consulenze, commercialista. Deducibili per intero.">
          <Euro valore={c.generali} onChange={(v) => setCosto("generali", v)} />
        </Campo>
        <Campo etichetta="Attrezzature" aiuto="Computer, strumenti, arredi. Si scaricano in cinque anni.">
          <Euro valore={c.attrezzature} onChange={(v) => setCosto("attrezzature", v)} />
        </Campo>
        <Campo etichetta="Auto" aiuto="Carburante, assicurazione, manutenzione, rata. Deducibile al 20%.">
          <Euro valore={c.auto} onChange={(v) => setCosto("auto", v)} />
        </Campo>
        <Campo etichetta="Telefono e internet" aiuto="Deducibili all'80%.">
          <Euro valore={c.telefonia} onChange={(v) => setCosto("telefonia", v)} passo={100} />
        </Campo>
        <Campo etichetta="Trasferte, pranzi e alberghi" aiuto="Deducibili al 75%, entro il 2% dei compensi.">
          <Euro valore={c.trasferte} onChange={(v) => setCosto("trasferte", v)} />
        </Campo>
        <Campo etichetta="Formazione" aiuto="Corsi, master, convegni. Per intero fino a 10.000 €.">
          <Euro valore={c.formazione} onChange={(v) => setCosto("formazione", v)} />
        </Campo>
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
      <Avviso>Nell'ordinario l'IVA sulle vendite si versa allo Stato al netto di quella sugli acquisti: non è un costo, ma esce di cassa. La vedrai nel calendario.</Avviso>
    </Sezione>
  );
}
