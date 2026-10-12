import type { Risposte } from "../stato";
import { ANNO_CORRENTE } from "../stato";
import { Avviso, Campo, Euro, Interruttore, Numero, Sezione } from "../componenti/ui";
import { parametriPerAnno } from "@motore/parametri";
import { euro } from "../formato";

export function Passo2Ricavi({ r, set }: { r: Risposte; set: (patch: Partial<Risposte>) => void }) {
  const f = parametriPerAnno(ANNO_CORRENTE).forfettario;
  const setRicavo = (i: 0 | 1 | 2, v: number) => {
    const ricavi: [number, number, number] = [...r.ricavi];
    ricavi[i] = v;
    set({ ricavi });
  };
  const massimo = Math.max(...(r.ricaviCostanti ? [r.ricavi[0]] : r.ricavi));
  return (
    <Sezione numero="02" titolo="Quanto pensi di incassare?" sotto="Incassi dell'anno, IVA esclusa. Se non sai gli anni dopo, lascia lo stesso importo.">
      <Interruttore id="ricavi-costanti" valore={r.ricaviCostanti} onChange={(ricaviCostanti) => set({ ricaviCostanti })} etichetta="Stessi incassi ogni anno" />
      <div className={`grid gap-3 ${r.ricaviCostanti ? "max-w-[320px]" : "sm:grid-cols-3"}`}>
        {(r.ricaviCostanti ? [0] : [0, 1, 2]).map((i) => (
          <Campo key={i} id={`ricavi-${i}`} etichetta={r.ricaviCostanti ? "Ogni anno" : `${ANNO_CORRENTE + i}`}>
            <Euro id={`ricavi-${i}`} valore={r.ricavi[i]} onChange={(v) => setRicavo(i as 0 | 1 | 2, v)} />
          </Campo>
        ))}
      </div>
      {massimo > f.limiteRicavi && massimo <= f.limiteUscitaImmediata && <Avviso tono="attenzione">Sopra {euro(f.limiteRicavi)} resti nel forfettario per quell'anno, ma dall'anno dopo passi all'ordinario. La simulazione lo mostra.</Avviso>}
      {massimo > f.limiteUscitaImmediata && <Avviso tono="attenzione">Sopra {euro(f.limiteUscitaImmediata)} si esce dal forfettario nello stesso anno. La simulazione lo mostra.</Avviso>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="fatture" etichetta="Quante fatture emetti in un anno?" aiuto="Nel forfettario ogni fattura sopra 77,47 € paga 2 € di bollo.">
          <Numero id="fatture" valore={r.fattureAnnue} onChange={(fattureAnnue) => set({ fattureAnnue: Math.max(0, fattureAnnue) })} />
        </Campo>
        {r.natura === "professionista" && (
          <Campo id="quota-aziende" etichetta="Quanta parte fatturi ad aziende o professionisti?" aiuto="Nell'ordinario trattengono il 20% di ritenuta d'acconto.">
            <div className="flex items-center gap-3 pt-1">
              <input id="quota-aziende" type="range" min={0} max={100} step={10} value={Math.round(r.quotaVersoAziende * 100)} onChange={(e) => set({ quotaVersoAziende: Number(e.target.value) / 100 })} />
              <span className="w-12 text-right font-mono cifre">{Math.round(r.quotaVersoAziende * 100)}%</span>
            </div>
          </Campo>
        )}
      </div>
      <Interruttore id="bollo" valore={r.bolloRiaddebitato} onChange={(bolloRiaddebitato) => set({ bolloRiaddebitato })} etichetta="Il bollo lo riaddebito al cliente in fattura" aiuto="Se sì, i 2 € diventano un tuo incasso e fanno reddito." />

      <h3 className="m-0 mt-2 text-[20px] font-bold">La tua situazione</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="altri-redditi" etichetta="Altri redditi nell'anno" aiuto="Dipendente, pensione, affitti. Nell'ordinario si sommano e alzano l'aliquota IRPEF.">
          <Euro id="altri-redditi" valore={r.altriRedditi} onChange={(altriRedditi) => set({ altriRedditi })} />
        </Campo>
      </div>
      <Interruttore
        id="reddito-dipendente"
        valore={r.redditoDipendenteAnnoPrecedente}
        onChange={(redditoDipendenteAnnoPrecedente) => set({ redditoDipendenteAnnoPrecedente })}
        etichetta={`L'anno scorso ho guadagnato più di ${euro(f.sogliaRedditoDipendente)} da lavoro dipendente o pensione`}
        aiuto="Se sì, il forfettario è escluso. Non conta se il rapporto è finito e non hai altri redditi di quel tipo."
      />
      <Interruttore id="roma" valore={r.abitaRoma} onChange={(abitaRoma) => set({ abitaRoma })} etichetta="Risiedo a Roma" aiuto="Le addizionali IRPEF regionale e comunale dipendono da dove abiti. Spegni per inserirle a mano." />
      {!r.abitaRoma && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="add-reg" etichetta="Addizionale regionale (%)">
            <input id="add-reg" type="number" step={0.01} min={0} max={5} value={+(r.addizionaleRegionale * 100).toFixed(2)} onChange={(e) => set({ addizionaleRegionale: Number(e.target.value) / 100 })} className="w-full rounded-full border-[1.5px] border-bordo2 bg-carta px-4 py-2.5 text-right font-mono text-testo" />
          </Campo>
          <Campo id="add-com" etichetta="Addizionale comunale (%)">
            <input id="add-com" type="number" step={0.01} min={0} max={1} value={+(r.addizionaleComunale * 100).toFixed(2)} onChange={(e) => set({ addizionaleComunale: Number(e.target.value) / 100 })} className="w-full rounded-full border-[1.5px] border-bordo2 bg-carta px-4 py-2.5 text-right font-mono text-testo" />
          </Campo>
        </div>
      )}
    </Sezione>
  );
}
