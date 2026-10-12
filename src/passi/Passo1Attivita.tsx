import type { Risposte } from "../stato";
import { ANNO_CORRENTE, GRUPPI } from "../stato";
import { Campo, Interruttore, Numero, Scelte, Sezione } from "../componenti/ui";
import { parametriPerAnno } from "@motore/parametri";

export function Passo1Attivita({ r, set }: { r: Risposte; set: (patch: Partial<Risposte>) => void }) {
  const gruppi = GRUPPI.filter((g) => g.natura.includes(r.natura));
  const coeff = parametriPerAnno(ANNO_CORRENTE).forfettario.coefficienti;
  return (
    <Sezione titolo="Che lavoro fai?" sotto="Serve per capire quanta parte dei tuoi incassi lo Stato considera reddito nel forfettario, e a quale previdenza sei iscritto.">
      <Campo etichetta="Sei un professionista o hai un'impresa?">
        <Scelte
          valore={r.natura}
          onChange={(natura) => {
            const primo = GRUPPI.find((g) => g.natura.includes(natura))!.id;
            set({
              natura,
              gruppo: GRUPPI.find((g) => g.id === r.gruppo && g.natura.includes(natura)) ? r.gruppo : primo,
              previdenza: natura === "professionista" ? "gestione_separata" : "commercianti",
            });
          }}
          colonne={2}
          opzioni={[
            { id: "professionista", nome: "Professionista", descrizione: "Lavoro intellettuale o servizi: consulente, sviluppatore, medico, avvocato, designer" },
            { id: "impresa", nome: "Impresa individuale", descrizione: "Commercio, artigianato, ristorazione, agenti di commercio" },
          ]}
        />
      </Campo>

      <Campo etichetta="In quale settore?" aiuto="Il settore decide il coefficiente di redditività del forfettario.">
        <Scelte
          valore={r.gruppo}
          onChange={(gruppo) => set({ gruppo })}
          opzioni={gruppi.map((g) => ({ id: g.id, nome: `${g.nome} · ${Math.round(coeff[g.id] * 100)}%`, descrizione: g.esempi }))}
        />
      </Campo>

      <Interruttore
        valore={r.nuovaAttivita}
        onChange={(nuovaAttivita) => set({ nuovaAttivita })}
        etichetta={`Apro la partita IVA nel ${ANNO_CORRENTE}`}
        aiuto="Spegni se la partita IVA è già aperta da prima."
      />
      {!r.nuovaAttivita && (
        <Campo etichetta="In che anno l'hai aperta?">
          <Numero valore={r.annoApertura} onChange={(annoApertura) => set({ annoApertura })} min={1990} max={ANNO_CORRENTE - 1} />
        </Campo>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium">Per l'aliquota ridotta al 5% nei primi cinque anni</p>
        <Interruttore
          valore={r.startup.nessunaAttivitaTreAnni}
          onChange={(v) => set({ startup: { ...r.startup, nessunaAttivitaTreAnni: v } })}
          etichetta="Nei tre anni prima dell'apertura non ho avuto altre partite IVA o quote in società di persone"
        />
        <Interruttore
          valore={r.startup.nonProsecuzione}
          onChange={(v) => set({ startup: { ...r.startup, nonProsecuzione: v } })}
          etichetta="Non sto continuando lo stesso lavoro che facevo da dipendente o collaboratore"
          aiuto="Il praticantato obbligatorio non conta."
        />
      </div>
    </Sezione>
  );
}
