import { useEffect, useState } from "react";
import type { Risposte } from "./stato";
import { leggiRisposte, salvaRisposte } from "./stato";
import { Passo1Attivita } from "./passi/Passo1Attivita";
import { Passo2Ricavi } from "./passi/Passo2Ricavi";
import { Passo3Previdenza } from "./passi/Passo3Previdenza";
import { Risultato } from "./risultato/Risultato";
import { Bottone, Eyebrow } from "./componenti/ui";
import { CONFIG } from "./config";
import { oggiIt } from "./formato";

const PASSI = ["Attività", "Incassi", "Contributi", "Risultato"];

export default function App() {
  const [passo, setPasso] = useState(0);
  const [r, setR] = useState<Risposte>(leggiRisposte);
  const set = (patch: Partial<Risposte>) => setR((prev) => ({ ...prev, ...patch }));
  const ultimo = PASSI.length - 1;

  useEffect(() => salvaRisposte(r), [r]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [passo]);

  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-8 px-4 pb-12 pt-5 sm:px-7">
      <header className="no-stampa flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-[20px] font-extrabold tracking-[-0.03em]">
            Consulting/34 <span className="font-medium">STP</span>
          </span>
          <span className="text-[13.5px] text-testo2">Forfettario o ordinario</span>
        </div>
        <nav aria-label="Passi">
          <ol className="m-0 flex list-none flex-wrap gap-1.5 p-0">
            {PASSI.map((p, i) => {
              const fatto = i < passo;
              const ora = i === passo;
              return (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => (i <= passo || i === ultimo ? setPasso(i) : undefined)}
                    aria-current={ora ? "step" : undefined}
                    className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition-colors ${ora ? "bg-ink text-white" : fatto || i === ultimo ? "bg-carta text-testo hover:text-bluTesto" : "bg-carta text-testo3"} border border-bordo`}
                  >
                    <span className="font-mono text-[11px] opacity-70">{String(i + 1).padStart(2, "0")}</span>
                    {p}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </header>
      <div className="solo-stampa">
        <p className="m-0 font-display text-[22px] font-extrabold">{CONFIG.studio.nome} · Simulazione partita IVA · {oggiIt()}</p>
      </div>

      {passo < ultimo && (
        <div className="flex flex-col gap-3">
          <Eyebrow>Parametri 2026 verificati</Eyebrow>
          <h1 className="m-0 max-w-[18ch] text-[34px] font-extrabold leading-[1.04] tracking-[-0.04em] sm:text-[46px]">Forfettario o ordinario? Fai i conti in tre passi.</h1>
        </div>
      )}

      <main className="min-w-0">
        {passo < ultimo ? (
          <div className="rounded-[20px] border border-bordo bg-carta p-5 shadow-carta sm:p-8">
            {passo === 0 && <Passo1Attivita r={r} set={set} />}
            {passo === 1 && <Passo2Ricavi r={r} set={set} />}
            {passo === 2 && <Passo3Previdenza r={r} set={set} />}
            <nav className="mt-8 flex items-center justify-between gap-3 border-t border-bordo pt-6" aria-label="Avanti e indietro">
              <div>{passo > 0 && <Bottone tono="linea" onClick={() => setPasso(passo - 1)}>Indietro</Bottone>}</div>
              <Bottone tono="blu" freccia onClick={() => setPasso(passo + 1)}>{passo === ultimo - 1 ? "Vedi il risultato" : "Avanti"}</Bottone>
            </nav>
          </div>
        ) : (
          <Risultato r={r} set={set} onModifica={() => setPasso(0)} />
        )}
      </main>

      <footer className="border-t border-bordo pt-4 text-[12px] leading-relaxed text-testo3">
        Stima indicativa con i parametri 2026: L. 190/2014, L. 199/2025, TUIR, circolari INPS 8/2026 e 14/2026, regolamenti delle Casse e di Enasarco. Non sostituisce una consulenza professionale. I dati restano nel tuo browser finché non chiedi di essere ricontattato.
        <br />
        {CONFIG.studio.nome} · {CONFIG.studio.indirizzo} · P.IVA {CONFIG.studio.piva}
      </footer>
    </div>
  );
}
