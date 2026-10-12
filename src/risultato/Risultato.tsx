import { useState } from "react";
import type { Regime } from "@motore/tipi";
import { useModello } from "./useModello";
import type { Risposte } from "../stato";
import { GRUPPI, NOMI_PREVIDENZA, ricaviPerAnno } from "../stato";
import { Schede, BloccoNero } from "./Schede";
import { AnnoPerAnno } from "./AnnoPerAnno";
import { Calendario } from "./Calendario";
import { Contatto } from "./Contatto";
import { Dettagli } from "./Dettagli";
import { Bottone, Eyebrow, Sottolineato, Tessera } from "../componenti/ui";
import { euro, euroSegno, percento } from "../formato";
import { CONFIG } from "../config";

export function Risultato({ r, set, onModifica }: { r: Risposte; set: (patch: Partial<Risposte>) => void; onModifica: () => void }) {
  const m = useModello(r);
  const [scheda, setScheda] = useState<Regime>("ordinario");
  const c = m.confronto;
  const ricavi = ricaviPerAnno(r);
  const settore = GRUPPI.find((g) => g.id === r.gruppo)?.nome ?? "";
  const previdenza = r.previdenza === "cassa" && m.profilo.previdenza.tipo === "cassa" ? m.profilo.previdenza.cassa.nome : NOMI_PREVIDENZA[r.previdenza];

  // Il cursore scala tutti gli anni nella stessa proporzione: la forma della crescita resta.
  const setIncassi = (v: number) => {
    if (r.ricaviCostanti || ricavi[0] <= 0) return set({ ricavi: [v, v, v] });
    const k = v / ricavi[0];
    set({ ricavi: [v, Math.round((r.ricavi[1] * k) / 500) * 500, Math.round((r.ricavi[2] * k) / 500) * 500] });
  };

  const titolo = m.vince ? (
    <>
      Ti conviene <Sottolineato>il {m.vince}</Sottolineato>.
    </>
  ) : (
    <>
      Per te <Sottolineato>c'è l'ordinario</Sottolineato>.
    </>
  );
  const quotaContributi = (m.forfApplicabile ? m.f1 : m.o1).contributi.totale / Math.max(1, (m.forfApplicabile ? m.f1 : m.o1).ricaviFiscali);

  return (
    <div className="flex flex-col gap-7">
      <div className="solo-stampa text-[12px] text-testo2">Simulazione indicativa con i parametri {m.anni[0]}. {CONFIG.studio.nome} · {CONFIG.studio.indirizzo}</div>

      <section className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-7">
          <Eyebrow>Il tuo risultato · {m.anni[0]}–{m.anni[m.anni.length - 1]}</Eyebrow>
          <h1 className="m-0 text-[38px] font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-[52px]">{titolo}</h1>
          <p className="m-0 max-w-[60ch] text-[16px] leading-relaxed text-testo2">
            {m.vince
              ? `Sui tre anni, con acconti e saldi, ti restano ${euro(Math.abs(c.differenzaNettoTotale))} in più che con l'${m.vince === "forfettario" ? "ordinario" : "forfettario"}. `
              : `${m.motiviForf.join(" ")} `}
            Apri le due schede: nel forfettario conta il coefficiente, nell'ordinario conta ogni spesa.
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-5">
          <div className="no-stampa rounded-2xl border border-bordo bg-carta p-4 shadow-carta">
            <label htmlFor="incassi-risultato" className="flex items-baseline justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.07em] text-testo3">
              {r.ricaviCostanti ? "Incassi l'anno" : `Incassi ${m.anni[0]}`}
              <span className="font-mono text-[19px] font-medium normal-case tracking-normal text-testo cifre">{euro(ricavi[0])}</span>
            </label>
            <input id="incassi-risultato" type="range" min={5_000} max={150_000} step={1_000} value={ricavi[0]} onChange={(e) => setIncassi(Number(e.target.value))} className="mt-2" />
            {!r.ricaviCostanti && <p className="m-0 mt-1 text-[12px] text-testo2">Poi {euro(ricavi[1])} e {euro(ricavi[2])}, nella stessa proporzione.</p>}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[12.5px]">
            {[r.natura === "professionista" ? "Professionista" : "Impresa individuale", settore, previdenza, r.nuovaAttivita ? `Apertura ${m.anni[0]}` : `Aperta nel ${r.annoApertura}`].map((t) => (
              <span key={t} className="rounded-full border border-bordo bg-carta px-2.5 py-1 font-medium text-testo2">{t}</span>
            ))}
            <span className="no-stampa">
              <Bottone tono="linea" piccolo onClick={onModifica}>Modifica</Bottone>
            </span>
          </div>
        </div>
      </section>

      <Schede m={m} r={r} set={set} scheda={scheda} setScheda={setScheda} />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tessera etichetta="Forfettario, tre anni" valore={<span className="text-bluTesto">{m.forfApplicabile ? euro(c.forfettario.totaleNettoCompetenza) : "—"}</span>} nota={m.forfApplicabile ? `imposte ${euro(c.forfettario.totaleImposte)} · contributi ${euro(c.forfettario.totaleContributi)}` : "non applicabile"} />
        <Tessera etichetta="Ordinario, tre anni" valore={<span className="text-coralloTesto">{euro(c.ordinario.totaleNettoCompetenza)}</span>} nota={`imposte ${euro(c.ordinario.totaleImposte)} · contributi ${euro(c.ordinario.totaleContributi)}`} />
        <Tessera evidenza etichetta={m.vince ? `Col ${m.vince}` : "Differenza"} valore={<span className="text-giallo">{m.vince ? euroSegno(Math.abs(c.differenzaNettoTotale)) : "—"}</span>} nota="netto in più in tre anni" />
        <Tessera etichetta="Punto di pareggio" valore={m.pareggio == null ? "mai" : euro(m.pareggio)} nota={m.pareggio == null ? "con queste spese l'ordinario non raggiunge il forfettario" : `di spese l'anno: oltre, conviene l'ordinario. Oggi sono ${euro(m.spese1.totale)}.`} />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-7">
          <AnnoPerAnno m={m} />
        </div>
        <div className="min-w-0 xl:col-span-5">
          <BloccoNero
            titolo="Quello che il numero non dice"
            righe={[
              [euro(m.giugnoSecondoAnno), `escono a giugno ${m.anni[1]} nel ${m.riferimento}, in un giorno: saldo dell'anno prima e primo acconto. Accantona ${euro(m.accantonaMese)} al mese da subito.`],
              m.ultimoAnnoStartup != null && m.forfApplicabile
                ? [String(m.ultimoAnnoStartup + 1), `è l'anno in cui il 5% finisce e l'imposta sostitutiva sale al 15%. Il confronto di oggi va rifatto lì.`]
                : [percento(m.aliquotaForf), "è l'aliquota del forfettario per te. Con i requisiti start-up sarebbe il 5% per cinque anni."],
              [percento(quotaContributi), `degli incassi se ne va in contributi ${r.previdenza === "gestione_separata" ? "INPS: più delle imposte. La Gestione Separata non ha minimi, paghi in proporzione." : r.previdenza === "cassa" ? "alla Cassa, minimi compresi." : "INPS. I fissi sul minimale si pagano anche se non incassi."}`],
            ]}
          />
        </div>
      </div>

      <Calendario m={m} r={r} set={set} />

      <Contatto m={m} r={r} />

      <Dettagli m={m} />
    </div>
  );
}
