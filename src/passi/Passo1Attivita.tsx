import type { Risposte } from "../stato";
import { ANNO_CORRENTE, GRUPPI } from "../stato";
import { Badge, Campo, Interruttore, Numero, Scelte, Sezione } from "../componenti/ui";
import { parametriPerAnno } from "@motore/parametri";

export function Passo1Attivita({ r, set }: { r: Risposte; set: (patch: Partial<Risposte>) => void }) {
  const gruppi = GRUPPI.filter((g) => g.natura.includes(r.natura));
  const coeff = parametriPerAnno(ANNO_CORRENTE).forfettario.coefficienti;
  return (
    <Sezione numero="01" titolo="Che lavoro fai?" sotto="Serve a capire quanta parte dei tuoi incassi il fisco considera reddito nel forfettario, e a quale previdenza sei iscritto.">
      <Campo etichetta="Sei un professionista o hai un'impresa?">
        <Scelte
          nome="Natura dell'attività"
          valore={r.natura}
          onChange={(natura) => {
            const primo = GRUPPI.find((g) => g.natura.includes(natura))!.id;
            const gruppo = GRUPPI.find((g) => g.id === r.gruppo && g.natura.includes(natura)) ? r.gruppo : primo;
            set({ natura, gruppo, previdenza: natura === "professionista" ? "gestione_separata" : "commercianti", riduzione: "nessuna" });
          }}
          colonne={2}
          opzioni={[
            { id: "professionista", nome: "Professionista", descrizione: "Lavoro intellettuale o servizi: consulente, sviluppatore, medico, avvocato, designer" },
            { id: "impresa", nome: "Impresa individuale", descrizione: "Commercio, artigianato, ristorazione, agenti di commercio" },
          ]}
        />
      </Campo>

      <Campo etichetta="In quale settore?" aiuto="Il settore decide il coefficiente di redditività del forfettario: la parte degli incassi che diventa reddito.">
        <Scelte
          nome="Settore"
          valore={r.gruppo}
          onChange={(gruppo) => set({ gruppo, previdenza: gruppo === "intermediari_commercio" ? "commercianti" : r.previdenza })}
          opzioni={gruppi.map((g) => ({ id: g.id, nome: g.nome, descrizione: g.esempi, accessorio: <Badge tono="blu">{Math.round(coeff[g.id] * 100)}%</Badge> }))}
        />
      </Campo>

      <div className="flex flex-col gap-2.5">
        <Interruttore id="nuova-attivita" valore={r.nuovaAttivita} onChange={(nuovaAttivita) => set({ nuovaAttivita })} etichetta={`Apro la partita IVA nel ${ANNO_CORRENTE}`} aiuto="Spegni se la partita IVA è già aperta." />
        {!r.nuovaAttivita && (
          <Campo id="anno-apertura" etichetta="In che anno l'hai aperta?">
            <div className="max-w-[220px]">
              <Numero id="anno-apertura" valore={r.annoApertura} onChange={(annoApertura) => set({ annoApertura: Math.min(ANNO_CORRENTE - 1, Math.max(1990, annoApertura)) })} min={1990} max={ANNO_CORRENTE - 1} />
            </div>
          </Campo>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <p className="m-0 text-[14px] font-semibold">Per l'aliquota del 5% nei primi cinque anni</p>
        <Interruttore id="startup-tre-anni" valore={r.startup.nessunaAttivitaTreAnni} onChange={(v) => set({ startup: { ...r.startup, nessunaAttivitaTreAnni: v } })} etichetta="Nei tre anni prima dell'apertura non ho avuto altre partite IVA né quote in società di persone" />
        <Interruttore id="startup-prosecuzione" valore={r.startup.nonProsecuzione} onChange={(v) => set({ startup: { ...r.startup, nonProsecuzione: v } })} etichetta="Non sto continuando lo stesso lavoro che facevo da dipendente o collaboratore" aiuto="Il praticantato obbligatorio non conta." />
      </div>
    </Sezione>
  );
}
