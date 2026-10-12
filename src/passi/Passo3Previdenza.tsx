import type { Risposte } from "../stato";
import { ANNO_CORRENTE } from "../stato";
import { Campo, Interruttore, Scelte, Sezione, Avviso } from "../componenti/ui";
import { parametriPerAnno } from "@motore/parametri";

export function Passo3Previdenza({ r, set }: { r: Risposte; set: (patch: Partial<Risposte>) => void }) {
  const P = parametriPerAnno(ANNO_CORRENTE);
  const casse = Object.values(P.casse);
  const cassa = P.casse[r.cassaId];
  const apertura = r.nuovaAttivita ? ANNO_CORRENTE : r.annoApertura;
  const opzioniProfessionista = [
    { id: "gestione_separata" as const, nome: "Nessun albo con Cassa: INPS Gestione Separata", descrizione: "Consulenti, sviluppatori, formatori, freelance senza ordine professionale" },
    { id: "cassa" as const, nome: "Iscritto a un ordine con Cassa propria", descrizione: "Commercialisti, avvocati, ingegneri, medici, psicologi, geometri…" },
  ];
  const opzioniImpresa = [
    { id: "commercianti" as const, nome: "Commerciante", descrizione: "Negozio, e-commerce, bar, ristorante, agente di commercio" },
    { id: "artigiani" as const, nome: "Artigiano", descrizione: "Produzione, riparazione, edilizia, parrucchiere, estetista" },
  ];
  return (
    <Sezione titolo="A chi versi i contributi?" sotto="È la voce più pesante dopo le imposte, spesso di più. Dipende da cosa fai, non dal regime.">
      <Scelte valore={r.previdenza} onChange={(previdenza) => set({ previdenza })} opzioni={r.natura === "professionista" ? opzioniProfessionista : opzioniImpresa} />

      {r.previdenza === "gestione_separata" && (
        <div className="space-y-2">
          <Interruttore
            valore={r.altraCopertura}
            onChange={(altraCopertura) => set({ altraCopertura })}
            etichetta="Sono anche dipendente o pensionato"
            aiuto={`Aliquota ridotta al ${(P.gestioneSeparata.aliquotaRidotta * 100).toLocaleString("it-IT")}% invece del ${(P.gestioneSeparata.aliquotaPiena * 100).toLocaleString("it-IT")}%.`}
          />
          <Interruttore valore={r.rivalsa} onChange={(rivalsa) => set({ rivalsa })} etichetta="Addebito la rivalsa INPS 4% in fattura" aiuto="Il cliente la paga a te; per il fisco è un tuo incasso." />
        </div>
      )}

      {(r.previdenza === "artigiani" || r.previdenza === "commercianti") && (
        <div className="space-y-2">
          <Campo etichetta="Riduzione dei contributi">
            <Scelte
              valore={r.riduzione}
              onChange={(riduzione) => set({ riduzione })}
              opzioni={[
                { id: "nessuna", nome: "Nessuna", descrizione: "Contributi pieni, pensione piena" },
                { id: "35", nome: "Riduzione 35% (solo forfettario)", descrizione: "Meno contributi oggi, meno mesi accreditati per la pensione" },
                { id: "50", nome: "Riduzione 50% nuovi iscritti", descrizione: "Solo per chi si è iscritto per la prima volta nel 2025, per 36 mesi" },
              ]}
            />
          </Campo>
          {r.riduzione === "50" && apertura !== 2025 && <Avviso tono="attenzione">La riduzione 50% vale solo per chi si è iscritto nel 2025. Con apertura nel {apertura} non si applica.</Avviso>}
          <Interruttore
            valore={r.esoneroDipendentePieno}
            onChange={(esoneroDipendentePieno) => set({ esoneroDipendentePieno })}
            etichetta="Sono dipendente a tempo pieno altrove"
            aiuto="In genere l'INPS non chiede l'iscrizione alla gestione: nessun contributo fisso. Va verificato con la sede."
          />
        </div>
      )}

      {r.previdenza === "cassa" && (
        <div className="space-y-3">
          <Campo etichetta="Quale Cassa?">
            <select value={r.cassaId} onChange={(e) => set({ cassaId: e.target.value })} className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[15px]">
              {casse.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </Campo>
          <Avviso>
            Soggettivo {(cassa.soggettivoPercento * 100).toLocaleString("it-IT")}% sul reddito, minimo {cassa.soggettivoMinimo.toLocaleString("it-IT")} €
            {cassa.integrativoPercento > 0 && <>, integrativo {(cassa.integrativoPercento * 100).toLocaleString("it-IT")}% in fattura a carico del cliente</>}
            , fissi {cassa.fissiAnnui.toLocaleString("it-IT")} €. {cassa.note}
          </Avviso>
          {cassa.agevolazioneGiovani && (
            <Interruttore
              valore={r.agevolazioneGiovani}
              onChange={(agevolazioneGiovani) => set({ agevolazioneGiovani })}
              etichetta="Rientro nell'agevolazione per i neo-iscritti"
              aiuto={`Per ${cassa.agevolazioneGiovani.anni} anni dalla prima iscrizione${cassa.agevolazioneGiovani.etaMassima ? `, se iscritto entro i ${cassa.agevolazioneGiovani.etaMassima} anni` : ""}.`}
            />
          )}
        </div>
      )}
    </Sezione>
  );
}
