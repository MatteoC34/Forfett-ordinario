import type { Regime } from "@motore/tipi";
import type { Modello } from "./useModello";
import type { Risposte } from "../stato";
import { NOMI_PREVIDENZA } from "../stato";
import { CatalogoCosti } from "./CatalogoCosti";
import { Avviso, Badge, Etichetta, RigaConto } from "../componenti/ui";
import { euro, percento } from "../formato";
import { parametriPerAnno } from "@motore/parametri";

export function Schede({ m, r, set, scheda, setScheda }: { m: Modello; r: Risposte; set: (patch: Partial<Risposte>) => void; scheda: Regime; setScheda: (s: Regime) => void }) {
  const f = m.f1;
  const o = m.o1;
  const anno = m.anni[0];
  return (
    <div className="flex flex-col">
      <div role="tablist" aria-label="Regime" className="no-stampa grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Linguetta
          id="scheda-forfettario"
          attiva={scheda === "forfettario"}
          onClick={() => setScheda("forfettario")}
          nome="Forfettario"
          formula={m.forfApplicabile ? `reddito = incassi × ${percento(m.coefficiente)} · imposta ${percento(m.aliquotaForf)}` : "non applicabile nel tuo caso"}
          valore={m.forfApplicabile ? euro(f.nettoCompetenza) : "—"}
          tono="blu"
          vince={m.vince === "forfettario"}
        />
        <Linguetta id="scheda-ordinario" attiva={scheda === "ordinario"} onClick={() => setScheda("ordinario")} nome="Ordinario" formula="reddito = incassi − spese dedotte · IRPEF 23 / 33 / 43%" valore={euro(o.nettoCompetenza)} tono="corallo" vince={m.vince === "ordinario"} />
      </div>

      <section role="tabpanel" aria-labelledby="scheda-forfettario" hidden={scheda !== "forfettario"} className="pannello-scheda -mt-px rounded-b-[18px] rounded-t-none border-[1.5px] border-blu bg-carta p-5 sm:rounded-tr-[18px] sm:p-7">
        <h2 className="solo-stampa m-0 mb-3 text-[24px] font-bold">Forfettario</h2>
        {!m.forfApplicabile && (
          <div className="mb-5">
            <Avviso tono="attenzione">
              <strong>Il forfettario non è applicabile nel {anno}.</strong> {m.motiviForf.join(" ")}
            </Avviso>
          </div>
        )}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
            <div>
              <h3 className="m-0 mb-1 text-[22px] font-bold">Come si calcola l'imposta, nel {anno}</h3>
              <p className="m-0 mb-3 text-[13.5px] text-testo2">Il fisco non guarda le tue spese: decide lui quanto hai guadagnato, con una percentuale fissa per settore.</p>
              <RigaConto voce="Incassi dell'anno" importo={euro(f.ricaviFiscali)} nota={notaIncassi(m)} />
              <RigaConto segno="×" voce="Reddito forfettario, col coefficiente" badge={<Badge tono="blu">{percento(m.coefficiente)}</Badge>} importo={euro(f.ricaviFiscali * m.coefficiente)} nota="È il reddito su cui si calcolano imposta e contributi INPS." />
              <RigaConto segno="−" voce="Contributi pagati nell'anno" importo={euro(f.contributiVersatiNellAnno)} nota={notaVersati(m, f.contributiVersatiNellAnno)} />
              <RigaConto segno="=" voce="Reddito imponibile" importo={euro(f.imposta.redditoImponibile)} forte />
              <RigaConto segno="×" voce="Imposta sostitutiva" badge={<Badge tono="blu">{percento(m.aliquotaForf)}</Badge>} importo={euro(f.imposta.netta)} nota="Sostituisce IRPEF, addizionali e IRAP." forte />
            </div>
            <div>
              <h3 className="m-0 mb-3 text-[22px] font-bold">Cosa ti resta in tasca</h3>
              <RigaConto voce="Incassi" importo={euro(f.ricaviFiscali)} />
              <RigaConto segno="−" voce="Imposta sostitutiva" importo={euro(f.imposta.netta)} />
              <RigaConto segno="−" voce={`Contributi ${NOMI_PREVIDENZA[r.previdenza]}${f.contributi.enasarco > 0 ? " ed Enasarco" : ""}`} importo={euro(f.contributi.totale)} nota="Quelli che maturano nell'anno, anche se li paghi dopo." />
              <RigaConto segno="−" voce="Spese, che non scarichi" importo={euro(f.costiReali)} tenue />
              <RigaConto segno="−" voce="IVA sugli acquisti, che non recuperi" importo={euro(f.ivaSuAcquistiNonRecuperata)} tenue />
              {f.bollo > 0 && <RigaConto segno="−" voce="Bollo sulle fatture" importo={euro(f.bollo)} tenue />}
              <div className="flex items-baseline gap-3 border-t-2 border-testo pt-3">
                <span className="flex-1 text-[15px] font-bold">Netto nel {anno}</span>
                <span className="font-display text-[34px] font-bold leading-none tracking-[-0.04em] text-bluTesto cifre">{euro(f.nettoCompetenza)}</span>
              </div>
            </div>
            <div className="no-stampa flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={r.startup.nessunaAttivitaTreAnni && r.startup.nonProsecuzione}
                onClick={() => {
                  const attivo = r.startup.nessunaAttivitaTreAnni && r.startup.nonProsecuzione;
                  set({ startup: { nessunaAttivitaTreAnni: !attivo, nonProsecuzione: !attivo } });
                }}
                className={`inline-flex min-h-[36px] items-center gap-2 rounded-full border-[1.5px] px-3.5 text-[13px] font-semibold ${r.startup.nessunaAttivitaTreAnni && r.startup.nonProsecuzione ? "border-bluTenue bg-bluTenue text-bluTesto" : "border-bordo2 text-testo2"}`}
              >
                Requisiti per il 5% start-up <span className="font-mono">{r.startup.nessunaAttivitaTreAnni && r.startup.nonProsecuzione ? "sì" : "no"}</span>
              </button>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-4 lg:col-span-5">
            <div className="rounded-2xl bg-fondo p-5">
              <Etichetta>Le tue spese, qui</Etichetta>
              {m.spese1.righe.filter((x) => x.importo > 0 && !x.voce.fuoriReddito).length === 0 && <p className="m-0 mt-2 text-[13.5px] text-testo2">Nessuna spesa inserita. Aggiungile nella scheda Ordinario.</p>}
              <ul className="m-0 mt-1 list-none p-0">
                {m.spese1.righe
                  .filter((x) => x.importo > 0 && !x.voce.fuoriReddito)
                  .map((x) => (
                    <li key={x.voce.id} className="flex items-center gap-2.5 border-t border-bordo py-1.5 text-[13px]">
                      <span className="min-w-0 flex-1 text-testo2 line-through decoration-testo3">{x.voce.nome}</span>
                      <Badge tono="neutro">0%</Badge>
                      <span className="w-[72px] text-right font-mono text-testo3 cifre">{euro(x.importo)}</span>
                    </li>
                  ))}
              </ul>
              <p className="m-0 mt-3 text-[13px] leading-relaxed text-testo2">
                Il coefficiente presume già le spese: con il {percento(m.coefficiente)} di reddito ti riconosce {euro(f.ricaviFiscali * (1 - m.coefficiente))} di costi l'anno. Le tue sono {euro(m.spese1.totale + m.spese1.ivaPagata)} IVA compresa: {m.spese1.totale + m.spese1.ivaPagata < f.ricaviFiscali * (1 - m.coefficiente) ? "spendi meno di così, e il forfettario ci guadagna." : "spendi di più, e qui ci perdi."}
              </p>
            </div>
            <BloccoNero
              titolo="Cosa cambia in pratica"
              righe={[
                ["0 €", "di IVA sulle vendite: non la addebiti e non la versi. Ai clienti privati costi il 22% in meno."],
                ["0%", "di ritenuta d'acconto: incassi tutta la fattura."],
                [euro(parametriPerAnno(anno).forfettario.limiteRicavi), "di incassi è il tetto. Oltre, l'anno dopo passi all'ordinario. Oltre 100.000 € esci subito."],
              ]}
            />
          </div>
        </div>
      </section>

      <section role="tabpanel" aria-labelledby="scheda-ordinario" hidden={scheda !== "ordinario"} className="pannello-scheda rompi-prima -mt-px rounded-b-[18px] rounded-t-none border-[1.5px] border-corallo bg-carta p-5 sm:rounded-tl-[18px] sm:p-7">
        <h2 className="solo-stampa m-0 mb-3 text-[24px] font-bold">Ordinario</h2>
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8">
            <CatalogoCosti m={m} r={r} set={set} />
          </div>
          <div className="flex min-w-0 flex-col gap-4 lg:col-span-4">
            <div className="flex flex-col gap-4 lg:sticky lg:top-4 print:static">
              <div className="rounded-2xl bg-fondo p-5">
                <h3 className="m-0 mb-2 text-[19px] font-bold">Come si calcola l'IRPEF, nel {anno}</h3>
                <RigaConto voce="Incassi" importo={euro(o.ricaviFiscali)} />
                <RigaConto segno="−" voce="Spese dedotte" importo={euro(o.costiDeducibili)} />
                <RigaConto segno="−" voce="Contributi pagati nell'anno" importo={euro(o.contributiVersatiNellAnno)} nota={notaVersati(m, o.contributiVersatiNellAnno)} />
                <RigaConto segno="=" voce="Reddito imponibile" importo={euro(o.imposta.redditoImponibile)} forte />
                <RigaConto voce="IRPEF a scaglioni" importo={euro(o.imposta.lorda)} nota={r.altriRedditi > 0 ? "Calcolata sopra i tuoi altri redditi." : "23% fino a 28.000 €, 33% fino a 50.000 €, 43% oltre."} />
                <RigaConto segno="−" voce="Detrazione lavoro autonomo" importo={euro(o.imposta.detrazioni)} />
                <RigaConto segno="+" voce={r.abitaRoma ? "Addizionali Lazio e Roma" : "Addizionali regionale e comunale"} importo={euro(o.imposta.addizionaleRegionale + o.imposta.addizionaleComunale)} />
                <RigaConto segno="=" voce="IRPEF e addizionali" importo={euro(o.imposta.netta)} forte />
              </div>
              <div className="rounded-2xl bg-fondo p-5">
                <h3 className="m-0 mb-2 text-[19px] font-bold">Cosa ti resta in tasca</h3>
                <RigaConto voce="Incassi" importo={euro(o.ricaviFiscali)} />
                <RigaConto segno="−" voce="IRPEF e addizionali" importo={euro(o.imposta.netta)} />
                <RigaConto segno="−" voce={`Contributi${o.contributi.enasarco > 0 ? " ed Enasarco" : ""}`} importo={euro(o.contributi.totale)} />
                <RigaConto segno="−" voce="Spese" importo={euro(o.costiReali)} tenue />
                <RigaConto segno="−" voce="IVA sugli acquisti non recuperata" importo={euro(o.ivaSuAcquistiNonRecuperata)} tenue />
                <div className="flex items-baseline gap-3 border-t-2 border-testo pt-3">
                  <span className="flex-1 text-[15px] font-bold">Netto nel {anno}</span>
                  <span className="font-display text-[34px] font-bold leading-none tracking-[-0.04em] text-coralloTesto cifre">{euro(o.nettoCompetenza)}</span>
                </div>
              </div>
              <BloccoNero
                titolo="Cosa cambia in pratica"
                righe={[
                  [euro(o.ivaDaVersare), "di IVA da versare l'anno: la incassi dai clienti, scali quella recuperabile sugli acquisti, giri il resto allo Stato."],
                  [percento(m.marginale), "è quanto ti torna, tra IRPEF e contributi, di ogni euro di spesa dedotta."],
                  o.ritenuteSubite > 0 ? [euro(o.ritenuteSubite), "di ritenute del 20% trattenute dai clienti: anticipi l'IRPEF e la recuperi a saldo."] : ["20%", "di ritenuta sulle fatture ad aziende, se sei un professionista: anticipi l'IRPEF e la recuperi a saldo."],
                ]}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function notaIncassi(m: Modello): string | undefined {
  const extra: string[] = [];
  if (m.f1.contributi.integrativoRivalsa > 0 && m.profilo.previdenza.tipo === "gestione_separata") extra.push("rivalsa INPS 4% compresa");
  if (m.profilo.bolloRiaddebitato && m.f1.bollo > 0) extra.push("bollo riaddebitato compreso");
  return extra.length ? `Con ${extra.join(" e ")}: fanno reddito.` : undefined;
}

function notaVersati(m: Modello, versati: number): string {
  if (versati === 0 && m.nuovaAttivita) return "Nel primo anno i contributi non li hai ancora pagati: li deduci l'anno prossimo.";
  return "Si deducono nell'anno in cui li paghi.";
}

function Linguetta({ id, attiva, onClick, nome, formula, valore, tono, vince }: { id: string; attiva: boolean; onClick: () => void; nome: string; formula: string; valore: string; tono: "blu" | "corallo"; vince: boolean }) {
  const colori = attiva ? (tono === "blu" ? "border-blu bg-blu text-white" : "border-corallo bg-corallo text-[#0a0f1f]") : "border-bordo bg-carta text-testo hover:border-bordo2";
  return (
    <button id={id} type="button" role="tab" aria-selected={attiva} onClick={onClick} className={`flex items-center justify-between gap-4 rounded-[18px] border-[1.5px] px-5 py-4 text-left transition-colors sm:rounded-b-none sm:border-b-0 ${colori}`}>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="font-display text-[22px] font-extrabold tracking-[-0.03em] sm:text-[24px]">{nome}</span>
          {vince && <span className="rounded-full bg-giallo px-2.5 py-0.5 text-[11.5px] font-bold text-[#0a0f1f]">Conviene</span>}
        </span>
        <span className="mt-0.5 block text-[12.5px] opacity-80">{formula}</span>
      </span>
      <span className="text-right">
        <span className="block font-display text-[24px] font-bold leading-none tracking-[-0.03em] cifre sm:text-[28px]">{valore}</span>
        <span className="mt-1 block text-[11px] opacity-75">netto nel primo anno</span>
      </span>
    </button>
  );
}

export function BloccoNero({ titolo, righe }: { titolo: string; righe: Array<[string, string]> }) {
  return (
    <div className="carta-stampa rounded-2xl border border-inkBordo bg-ink p-5 text-[#fbfcff]">
      <h3 className="m-0 font-display text-[17px] font-bold tracking-[-0.02em] text-giallo">{titolo}</h3>
      <div className="mt-2">
        {righe.map(([n, t]) => (
          <div key={t} className="flex gap-3 border-t border-white/15 py-2.5 text-[13.5px] leading-snug">
            <span className="w-[88px] shrink-0 font-display text-[19px] font-bold leading-tight text-giallo cifre">{n}</span>
            <span className="min-w-0">{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
