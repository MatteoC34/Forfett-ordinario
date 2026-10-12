import type { Risposte } from "../stato";
import { ANNO_CORRENTE, isAgente } from "../stato";
import { Avviso, Campo, Interruttore, Numero, Scelte, Seg, Sezione } from "../componenti/ui";
import { parametriPerAnno } from "@motore/parametri";
import { euro, percento } from "../formato";

export function Passo3Previdenza({ r, set }: { r: Risposte; set: (patch: Partial<Risposte>) => void }) {
  const P = parametriPerAnno(ANNO_CORRENTE);
  const casse = Object.values(P.casse);
  const cassa = P.casse[r.cassaId] ?? P.casse.cnpadc;
  const apertura = r.nuovaAttivita ? ANNO_CORRENTE : r.annoApertura;
  const a = P.artigianiCommercianti;
  return (
    <Sezione numero="03" titolo="A chi versi i contributi?" sotto="Spesso pesano più delle imposte. Dipendono da cosa fai, non dal regime.">
      {r.natura === "professionista" ? (
        <Scelte
          nome="Previdenza"
          valore={r.previdenza}
          onChange={(previdenza) => set({ previdenza })}
          opzioni={[
            { id: "gestione_separata", nome: "Nessun albo con Cassa: INPS Gestione Separata", descrizione: "Consulenti, sviluppatori, formatori, freelance senza ordine professionale" },
            { id: "cassa", nome: "Iscritto a un ordine con Cassa propria", descrizione: "Commercialisti, avvocati, ingegneri, medici, psicologi, geometri" },
          ]}
        />
      ) : (
        <Scelte
          nome="Previdenza"
          valore={r.previdenza}
          onChange={(previdenza) => set({ previdenza })}
          colonne={2}
          opzioni={[
            { id: "commercianti", nome: "Commerciante", descrizione: "Negozio, e-commerce, bar, ristorante, agente di commercio" },
            { id: "artigiani", nome: "Artigiano", descrizione: "Produzione, riparazioni, edilizia, parrucchiere, estetista" },
          ]}
        />
      )}

      {r.previdenza === "gestione_separata" && (
        <div className="flex flex-col gap-2.5">
          <Interruttore id="altra-copertura" valore={r.altraCopertura} onChange={(altraCopertura) => set({ altraCopertura })} etichetta="Sono anche dipendente o pensionato" aiuto={`Aliquota ridotta al ${percento(P.gestioneSeparata.aliquotaRidotta)} invece del ${percento(P.gestioneSeparata.aliquotaPiena)}.`} />
          <Interruttore id="rivalsa" valore={r.rivalsa} onChange={(rivalsa) => set({ rivalsa })} etichetta="Addebito la rivalsa INPS 4% in fattura" aiuto="Il cliente la paga a te. Per il fisco è un tuo incasso." />
        </div>
      )}

      {(r.previdenza === "artigiani" || r.previdenza === "commercianti") && (
        <div className="flex flex-col gap-3">
          <Avviso>
            Contributi fissi sul minimale di {euro(a.minimale)}: circa {euro(a.minimale * (r.previdenza === "artigiani" ? a.aliquotaArtigiani : a.aliquotaCommercianti) + a.quotaFissaAggiuntiva)} l'anno in quattro rate, anche se non incassi nulla. Sul reddito oltre il minimale si paga il {percento(r.previdenza === "artigiani" ? a.aliquotaArtigiani : a.aliquotaCommercianti)}.
          </Avviso>
          <Campo etichetta="Riduzione dei contributi">
            <Scelte
              nome="Riduzione dei contributi"
              valore={r.riduzione}
              onChange={(riduzione) => set({ riduzione })}
              opzioni={[
                { id: "nessuna", nome: "Nessuna", descrizione: "Contributi pieni, pensione piena" },
                { id: "35", nome: "Riduzione del 35%, solo nel forfettario", descrizione: "Meno contributi oggi, meno mesi accreditati per la pensione" },
                { id: "50", nome: "Riduzione del 50% per i nuovi iscritti", descrizione: "Solo per chi si è iscritto per la prima volta nel 2025, per 36 mesi" },
              ]}
            />
          </Campo>
          {r.riduzione === "50" && apertura !== 2025 && <Avviso tono="attenzione">La riduzione del 50% vale solo per chi si è iscritto nel 2025. Con apertura nel {apertura} non si applica.</Avviso>}
          <Interruttore id="esonero" valore={r.esoneroDipendentePieno} onChange={(esoneroDipendentePieno) => set({ esoneroDipendentePieno })} etichetta="Sono dipendente a tempo pieno altrove" aiuto="In genere l'INPS non chiede l'iscrizione alla gestione e non ci sono contributi fissi. Va verificato con la sede." />
        </div>
      )}

      {isAgente(r) && (
        <div className="flex flex-col gap-3 rounded-2xl border border-bordo bg-carta p-4">
          <p className="m-0 text-[15px] font-semibold">Enasarco</p>
          <p className="m-0 text-[13px] leading-relaxed text-testo2">
            Come agente versi anche l'Enasarco: il {percento(P.enasarco.aliquotaAgente)} delle provvigioni, trattenuto dalla casa mandante, fino a {euro(P.enasarco.massimaleMonomandatario)} di provvigioni per il monomandatario e {euro(P.enasarco.massimalePlurimandatario)} per ogni mandato del plurimandatario. È deducibile.
          </p>
          <Seg nome="Tipo di mandato" valore={r.enasarcoTipo} onChange={(enasarcoTipo) => set({ enasarcoTipo })} opzioni={[{ id: "mono", nome: "Monomandatario" }, { id: "pluri", nome: "Plurimandatario" }]} />
          {r.enasarcoTipo === "pluri" && (
            <Campo id="mandati" etichetta="Quante case mandanti?">
              <div className="max-w-[160px]">
                <Numero id="mandati" valore={r.enasarcoMandati} onChange={(v) => set({ enasarcoMandati: Math.max(1, Math.min(20, v)) })} min={1} max={20} />
              </div>
            </Campo>
          )}
        </div>
      )}

      {r.previdenza === "cassa" && (
        <div className="flex flex-col gap-3">
          <Campo id="cassa" etichetta="Quale Cassa?">
            <select id="cassa" value={r.cassaId} onChange={(e) => set({ cassaId: e.target.value })} className="w-full rounded-full border-[1.5px] border-bordo2 bg-carta px-4 py-2.5 text-[15px] text-testo">
              {casse.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </Campo>
          <Avviso>
            Soggettivo {percento(cassa.soggettivoPercento)} sul reddito, minimo {euro(cassa.soggettivoMinimo)}
            {cassa.integrativoPercento > 0 && <>, integrativo {percento(cassa.integrativoPercento)} in fattura a carico del cliente</>}, contributi fissi {euro(cassa.fissiAnnui)}. {cassa.note}
          </Avviso>
          {cassa.agevolazioneGiovani && (
            <Interruttore
              id="giovani"
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
