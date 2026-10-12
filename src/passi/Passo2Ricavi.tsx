import type { Risposte } from "../stato";
import { ANNO_CORRENTE } from "../stato";
import { Campo, Euro, Interruttore, Numero, Sezione, Avviso } from "../componenti/ui";
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
    <Sezione titolo="Quanto pensi di fatturare?" sotto="Incassi dell'anno, IVA esclusa. Se non sai gli anni dopo, usa lo stesso importo.">
      <Interruttore valore={r.ricaviCostanti} onChange={(ricaviCostanti) => set({ ricaviCostanti })} etichetta="Stesso fatturato ogni anno" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Campo key={i} etichetta={`${ANNO_CORRENTE + i}`}>
            <Euro valore={r.ricaviCostanti ? r.ricavi[0] : r.ricavi[i]} onChange={(v) => setRicavo(i as 0 | 1 | 2, v)} />
          </Campo>
        ))}
      </div>
      {massimo > f.limiteRicavi && massimo <= f.limiteUscitaImmediata && (
        <Avviso tono="attenzione">Sopra {euro(f.limiteRicavi)} resti nel forfettario per quell'anno, ma dall'anno dopo passi all'ordinario.</Avviso>
      )}
      {massimo > f.limiteUscitaImmediata && (
        <Avviso tono="attenzione">Sopra {euro(f.limiteUscitaImmediata)} si esce dal forfettario nello stesso anno. La simulazione lo mostra.</Avviso>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etichetta="Quante fatture emetti in un anno?" aiuto="Nel forfettario ogni fattura sopra 77,47 € paga 2 € di bollo.">
          <Numero valore={r.fattureAnnue} onChange={(fattureAnnue) => set({ fattureAnnue })} />
        </Campo>
        {r.natura === "professionista" && (
          <Campo etichetta="Quanta parte fatturi ad aziende o professionisti?" aiuto="Nell'ordinario trattengono il 20% di ritenuta d'acconto.">
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={100} step={10} value={Math.round(r.quotaVersoAziende * 100)} onChange={(e) => set({ quotaVersoAziende: Number(e.target.value) / 100 })} className="w-full" />
              <span className="w-12 text-right font-mono tabular-nums">{Math.round(r.quotaVersoAziende * 100)}%</span>
            </div>
          </Campo>
        )}
      </div>
      <Interruttore valore={r.bolloRiaddebitato} onChange={(bolloRiaddebitato) => set({ bolloRiaddebitato })} etichetta="Il bollo lo riaddebito al cliente in fattura" aiuto="Se sì, i 2 € diventano un tuo incasso e fanno reddito." />

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etichetta="Altri redditi che hai nell'anno (dipendente, pensione, affitti)" aiuto="Nell'ordinario si sommano e alzano l'aliquota IRPEF.">
          <Euro valore={r.altriRedditi} onChange={(altriRedditi) => set({ altriRedditi })} />
        </Campo>
        <Campo etichetta="Spese per dipendenti o collaboratori" aiuto={`Sopra ${euro(f.limiteSpeseLavoro)} il forfettario non è più possibile.`}>
          <Euro valore={r.speseLavoro} onChange={(speseLavoro) => set({ speseLavoro })} />
        </Campo>
      </div>
      <Interruttore
        valore={r.redditoDipendenteAnnoPrecedente}
        onChange={(redditoDipendenteAnnoPrecedente) => set({ redditoDipendenteAnnoPrecedente })}
        etichetta={`L'anno scorso ho guadagnato più di ${euro(f.sogliaRedditoDipendente)} da lavoro dipendente o pensione`}
        aiuto="Se sì, il forfettario è escluso per quest'anno. Non conta se il rapporto è finito e non hai altri redditi di quel tipo."
      />
    </Sezione>
  );
}
