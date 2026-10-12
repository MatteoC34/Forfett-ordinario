import { useMemo, useState } from "react";
import type { Confronto, Regime, RisultatoAnno } from "@motore/tipi";
import { parametriPerAnno } from "@motore/parametri";
import { confronta } from "@motore/simulazione";
import { costruisciProfilo, type Risposte } from "../stato";
import { dataIt, euro, percento } from "../formato";
import { Bottone, Avviso } from "./ui";
import { GraficoCassa } from "./GraficoCassa";

function Pallino({ regime }: { regime: Regime }) {
  return <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: regime === "forfettario" ? "var(--forfettario)" : "var(--ordinario)" }} />;
}

export function Risultato({ r, onModifica }: { r: Risposte; onModifica: () => void }) {
  const profilo = useMemo(() => costruisciProfilo(r), [r]);
  const c = useMemo(() => confronta(profilo), [profilo]);
  const anni = c.forfettario.anni.map((a) => a.anno);
  const [annoGrafico, setAnnoGrafico] = useState(anni[1] ?? anni[0]);
  const [regimeScadenze, setRegimeScadenze] = useState<Regime>(c.conviene ?? "ordinario");
  const [annoScadenze, setAnnoScadenze] = useState(anni[1] ?? anni[0]);
  const P = parametriPerAnno(anni[0]);

  const vincitore = c.conviene;
  const perdente: Regime = vincitore === "forfettario" ? "ordinario" : "forfettario";
  const nome = (reg: Regime) => (reg === "forfettario" ? "forfettario" : "ordinario");
  const serie = regimeScadenze === "forfettario" ? c.forfettario : c.ordinario;
  const annoSel = serie.anni.find((a) => a.anno === annoScadenze)!;
  const scadenze = annoSel.versamenti.filter((v) => v.data.startsWith(`${annoScadenze}-`));
  const totaleScadenze = scadenze.filter((v) => v.tipo !== "iva").reduce((a, v) => a + v.importo, 0);
  const totaleIva = scadenze.filter((v) => v.tipo === "iva").reduce((a, v) => a + v.importo, 0);

  const avvisiTutti = Array.from(new Set([...c.forfettario.anni, ...c.ordinario.anni].flatMap((a) => [...a.avvisi, ...a.contributi.note])));

  return (
    <div className="space-y-10">
      <section className="grid gap-6 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <p className="text-sm font-semibold uppercase tracking-wider text-[color:var(--inchiostro-2)]">Il tuo risultato · {anni[0]}–{anni[anni.length - 1]}</p>
          {vincitore ? (
            <h1 className="mt-2 text-4xl font-semibold leading-tight tracking-tight">
              Con il {nome(vincitore)} ti restano{" "}
              <span className="font-mono font-medium" style={{ color: vincitore === "forfettario" ? "var(--forfettario)" : "var(--ordinario)" }}>
                +{euro(Math.abs(c.differenzaNettoTotale))}
              </span>{" "}
              in tre anni rispetto all'{nome(perdente)}.
            </h1>
          ) : (
            <h1 className="mt-2 text-4xl font-semibold leading-tight tracking-tight">Il forfettario non è applicabile: ecco cosa ti aspetta nell'ordinario.</h1>
          )}
          {c.puntoIndifferenzaCosti != null && vincitore === "forfettario" && (
            <p className="mt-4 max-w-[60ch] text-[17px] leading-relaxed text-[color:var(--inchiostro-2)]">
              L'ordinario pareggia solo con più di <span className="font-mono">{euro(c.puntoIndifferenzaCosti)}</span> di costi interamente deducibili nel primo anno.
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 md:col-span-5">
          {(["forfettario", "ordinario"] as Regime[]).map((reg) => {
            const s = reg === "forfettario" ? c.forfettario : c.ordinario;
            return (
              <div key={reg} className="rounded-lg border border-neutral-200 p-4" style={{ borderTopWidth: 3, borderTopColor: reg === "forfettario" ? "var(--forfettario)" : "var(--ordinario)" }}>
                <p className="text-[13px] font-semibold text-[color:var(--inchiostro-2)]">{reg === "forfettario" ? "Forfettario" : "Ordinario"}</p>
                <p className="mt-1 font-mono text-[26px] font-medium tracking-tight">{euro(s.totaleNettoCompetenza)}</p>
                <p className="text-[13px] text-[color:var(--inchiostro-2)]">netto in tre anni</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full min-w-[720px] border-collapse text-[15px]">
          <thead>
            <tr className="bg-neutral-50 text-left text-[13px] text-[color:var(--inchiostro-2)]">
              <th className="px-4 py-3 font-semibold">Anno per anno</th>
              <th className="px-4 py-3 text-right font-semibold" colSpan={2}><Pallino regime="forfettario" />Forfettario</th>
              <th className="px-4 py-3 text-right font-semibold" colSpan={2}><Pallino regime="ordinario" />Ordinario</th>
            </tr>
            <tr className="border-b border-neutral-200 text-right text-[12px] text-[color:var(--inchiostro-2)]">
              <th></th>
              <th className="px-4 pb-2 font-medium">Imposte + contributi</th>
              <th className="px-4 pb-2 font-medium">Netto</th>
              <th className="px-4 pb-2 font-medium">Imposte + contributi</th>
              <th className="px-4 pb-2 font-medium">Netto</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[14px]">
            {anni.map((anno, i) => {
              const f = c.forfettario.anni[i];
              const o = c.ordinario.anni[i];
              const secondo = i === 1 && profilo.annoAperturaPiva === profilo.annoInizio;
              return (
                <tr key={anno} className={`border-b border-neutral-100 ${secondo ? "bg-amber-50" : ""}`}>
                  <td className="px-4 py-3 font-sans font-semibold">
                    {anno}
                    {f.regime === "ordinario" && <span className="ml-2 font-normal text-[color:var(--inchiostro-2)]">· forfettario non applicabile</span>}
                    {secondo && <span className="ml-2 font-normal text-amber-800">· saldo + acconti insieme</span>}
                  </td>
                  <td className="px-4 py-3 text-right">{euro(f.imposta.netta + f.contributi.totale)}</td>
                  <td className="px-4 py-3 text-right font-medium">{euro(f.nettoCompetenza)}</td>
                  <td className="px-4 py-3 text-right">{euro(o.imposta.netta + o.contributi.totale)}</td>
                  <td className="px-4 py-3 text-right font-medium">{euro(o.nettoCompetenza)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="grid gap-6 md:grid-cols-12">
        <div className="rounded-lg border border-neutral-200 p-6 md:col-span-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">Quanto esce di cassa, mese per mese</h2>
            <div className="flex gap-1.5 text-[13px] font-semibold">
              {anni.map((a) => (
                <button key={a} type="button" onClick={() => setAnnoGrafico(a)} className={`rounded-md px-3 py-1.5 ${a === annoGrafico ? "bg-[color:var(--inchiostro)] text-white" : "bg-neutral-100 text-[color:var(--inchiostro-2)]"}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <p className="mb-5 mt-1 text-[14px] text-[color:var(--inchiostro-2)]">Imposte, contributi e bollo. Nel secondo anno saldo e acconti cadono insieme a giugno.</p>
          <GraficoCassa confronto={c} anno={annoGrafico} />
        </div>

        <div className="space-y-3 md:col-span-5">
          <div className="rounded-lg border border-neutral-200 p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Le scadenze</h2>
              <div className="flex gap-1.5 text-[12px] font-semibold">
                {(["forfettario", "ordinario"] as Regime[]).map((reg) => (
                  <button key={reg} type="button" onClick={() => setRegimeScadenze(reg)} className={`rounded-md px-2.5 py-1 ${reg === regimeScadenze ? "bg-[color:var(--inchiostro)] text-white" : "bg-neutral-100 text-[color:var(--inchiostro-2)]"}`}>
                    {reg === "forfettario" ? "Forf." : "Ord."}
                  </button>
                ))}
                {anni.map((a) => (
                  <button key={a} type="button" onClick={() => setAnnoScadenze(a)} className={`rounded-md px-2.5 py-1 ${a === annoScadenze ? "bg-[color:var(--inchiostro)] text-white" : "bg-neutral-100 text-[color:var(--inchiostro-2)]"}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            {scadenze.length === 0 ? (
              <p className="text-[14px] text-[color:var(--inchiostro-2)]">Nessun versamento nell'anno.</p>
            ) : (
              <dl className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-4 gap-y-2 text-[14px]">
                {scadenze.map((v, i) => (
                  <ScadenzaRiga key={i} data={v.data} descrizione={v.descrizione} importo={v.importo} iva={v.tipo === "iva"} />
                ))}
              </dl>
            )}
            <p className="mt-3 flex justify-between border-t border-neutral-200 pt-3 text-[14px]">
              <span className="font-semibold">Totale {annoScadenze}</span>
              <span className="font-mono font-medium">{euro(totaleScadenze)}</span>
            </p>
            {totaleIva > 0 && (
              <p className="flex justify-between text-[13px] text-[color:var(--inchiostro-2)]">
                <span>di cui IVA, che transita e non è un costo</span>
                <span className="font-mono">{euro(totaleIva)}</span>
              </p>
            )}
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5">
            <h2 className="mb-2 text-lg font-semibold tracking-tight">Da sapere</h2>
            <ul className="list-disc space-y-1 pl-5 text-[14px] leading-relaxed">
              {avvisiTutti.slice(0, 8).map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <DettagliTecnici c={c} r={r} />

      <section className="no-stampa flex flex-wrap items-center justify-between gap-4 rounded-lg bg-[color:var(--inchiostro)] px-6 py-6 text-white">
        <div>
          <p className="text-xl font-semibold">Vuoi che lo verifichiamo insieme?</p>
          <p className="mt-1 text-[14px] text-neutral-300">Scrivici: ti risponde Alessandro Filipponi, referente per le nuove partite IVA di Consulting/34 STP.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" onClick={() => window.print()} className="rounded-full border border-neutral-500 px-5 py-2.5 text-[15px] font-medium">Stampa o salva PDF</button>
          <a href="mailto:hello@consulting34.com?subject=Simulazione%20partita%20IVA" className="rounded-full bg-white px-5 py-2.5 text-[15px] font-semibold text-[color:var(--inchiostro)]">Parla con lo studio</a>
        </div>
      </section>

      <div className="no-stampa">
        <Bottone secondario onClick={onModifica}>← Modifica i dati</Bottone>
      </div>

      <footer className="border-t border-neutral-200 pt-4 text-[12px] leading-relaxed text-[color:var(--inchiostro-2)]">
        Stima indicativa calcolata con i parametri {P.anno} ({P.forfettario.fonte.norma}; {P.irpef.fonte.norma}; {P.gestioneSeparata.fonte.norma}). Non sostituisce una consulenza professionale. Le date seguono il calendario ordinario, senza slittamenti al primo giorno lavorativo. {P.scadenze.noteDifferimento}
        <br />
        Consulting/34 STP · Via di Affogalasino 34, 00148 Roma · P.IVA 15573151006
      </footer>
    </div>
  );
}

function ScadenzaRiga({ data, descrizione, importo, iva }: { data: string; descrizione: string; importo: number; iva: boolean }) {
  const credito = importo < 0;
  return (
    <>
      <dt className="font-mono text-[color:var(--inchiostro-2)]">{dataIt(data)}</dt>
      <dd className={iva || credito ? "text-[color:var(--inchiostro-2)]" : ""}>{descrizione}</dd>
      <dd className={`text-right font-mono ${credito ? "text-emerald-700" : iva ? "text-[color:var(--inchiostro-2)]" : ""}`}>{euro(importo)}</dd>
    </>
  );
}

function DettagliTecnici({ c, r }: { c: Confronto; r: Risposte }) {
  const [aperto, setAperto] = useState(false);
  const righe = (a: RisultatoAnno) => [
    ["Ricavi considerati", euro(a.ricaviFiscali)],
    ["Costi dedotti", euro(a.costiDeducibili)],
    ["Base contributiva", euro(a.contributi.baseImponibile)],
    ["Contributi di competenza", euro(a.contributi.totale)],
    ["Contributi versati nell'anno (dedotti)", euro(a.contributiVersatiNellAnno)],
    ["Reddito imponibile", euro(a.imposta.redditoImponibile)],
    ["Imposta lorda", euro(a.imposta.lorda)],
    ["Detrazioni", euro(a.imposta.detrazioni)],
    ["Addizionali", euro(a.imposta.addizionaleRegionale + a.imposta.addizionaleComunale)],
    ["Imposta netta", euro(a.imposta.netta)],
    ["Ritenute subite", euro(a.ritenuteSubite)],
    ["IVA da versare", euro(a.ivaDaVersare)],
    ["Netto di competenza", euro(a.nettoCompetenza)],
    ["Netto di cassa", euro(a.nettoCassa)],
    ["Pressione su ricavi", percento((a.imposta.netta + a.contributi.totale) / Math.max(1, a.ricaviFiscali))],
  ];
  const P = parametriPerAnno(c.forfettario.anni[0].anno);
  const coeff = P.forfettario.coefficienti[r.gruppo];
  return (
    <section className="rounded-lg border border-neutral-200">
      <button type="button" onClick={() => setAperto(!aperto)} className="flex w-full items-center justify-between px-6 py-4 text-left">
        <span className="text-lg font-semibold tracking-tight">Dettagli tecnici e parametri usati</span>
        <span className="text-[color:var(--inchiostro-2)]">{aperto ? "chiudi" : "apri"}</span>
      </button>
      {aperto && (
        <div className="space-y-6 border-t border-neutral-200 px-6 py-5">
          <Avviso>
            Coefficiente di redditività {percento(coeff)} · Imposta sostitutiva {percento(P.forfettario.impostaStartup)} start-up, poi {percento(P.forfettario.impostaOrdinaria)} · IRPEF {P.irpef.scaglioni.map((s) => percento(s.aliquota)).join(" / ")} · Gestione Separata {percento(P.gestioneSeparata.aliquotaPiena)} · Minimale artigiani e commercianti {euro(P.artigianiCommercianti.minimale)}
          </Avviso>
          <div className="grid gap-6 lg:grid-cols-2">
            {([c.forfettario, c.ordinario] as const).map((s) => (
              <div key={s.regime} className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left text-[color:var(--inchiostro-2)]">
                      <th className="py-2 pr-3 font-semibold"><Pallino regime={s.regime} />{s.regime === "forfettario" ? "Forfettario" : "Ordinario"}</th>
                      {s.anni.map((a) => (
                        <th key={a.anno} className="py-2 pl-3 text-right font-semibold">{a.anno}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {righe(s.anni[0]).map(([voce], i) => (
                      <tr key={voce} className="border-b border-neutral-100">
                        <td className="py-1.5 pr-3 font-sans">{voce}</td>
                        {s.anni.map((a) => (
                          <td key={a.anno} className="py-1.5 pl-3 text-right">{righe(a)[i][1]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <div className="text-[12px] leading-relaxed text-[color:var(--inchiostro-2)]">
            <p className="font-semibold">Fonti</p>
            <ul className="list-disc pl-5">
              {[P.forfettario.fonte, P.irpef.fonte, P.acconti.fonte, P.gestioneSeparata.fonte, P.artigianiCommercianti.fonte, P.deducibilita.fonte, P.scadenze.fonte].map((f) => (
                <li key={f.norma}>{f.norma}{f.url && <> · <a className="underline" href={f.url} target="_blank" rel="noreferrer">fonte</a></>}{f.stato === "provvisorio" && " · valore provvisorio"}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
