import { useEffect, useState } from "react";
import type { Risposte } from "./stato";
import { risposteIniziali } from "./stato";
import { Passo1Attivita } from "./passi/Passo1Attivita";
import { Passo2Ricavi } from "./passi/Passo2Ricavi";
import { Passo3Previdenza } from "./passi/Passo3Previdenza";
import { Passo4Costi } from "./passi/Passo4Costi";
import { Risultato } from "./componenti/Risultato";
import { Bottone } from "./componenti/ui";

const PASSI = ["Attività", "Fatturato", "Contributi", "Costi", "Risultato"];
const CHIAVE = "c34-simulatore-piva:risposte";

function leggiSalvate(): Risposte {
  try {
    const raw = localStorage.getItem(CHIAVE);
    if (raw) return { ...risposteIniziali, ...JSON.parse(raw) };
  } catch {
    /* niente di salvato, o storage non disponibile */
  }
  return risposteIniziali;
}

export default function App() {
  const [passo, setPasso] = useState(0);
  const [r, setR] = useState<Risposte>(leggiSalvate);
  const set = (patch: Partial<Risposte>) => setR((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    try {
      localStorage.setItem(CHIAVE, JSON.stringify(r));
    } catch {
      /* ignora */
    }
  }, [r]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [passo]);

  const ultimo = PASSI.length - 1;
  return (
    <div className="pagina mx-auto max-w-5xl px-4 py-6 sm:px-8">
      <header className="no-stampa mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div className="flex items-baseline gap-2.5">
          <span className="text-lg font-bold tracking-tight">Consulting/34 <span className="font-normal">STP</span></span>
          <span className="text-[14px] text-[color:var(--inchiostro-2)]">Simulatore partita IVA</span>
        </div>
        <ol className="flex flex-wrap gap-x-2 text-[14px] text-[color:var(--inchiostro-2)]">
          {PASSI.map((p, i) => (
            <li key={p} className="flex items-center gap-2">
              <button type="button" onClick={() => i < passo && setPasso(i)} className={i === passo ? "font-semibold text-[color:var(--inchiostro)]" : i < passo ? "underline-offset-2 hover:underline" : "cursor-default"} disabled={i > passo}>
                {p}
              </button>
              {i < ultimo && <span className="text-neutral-300">·</span>}
            </li>
          ))}
        </ol>
      </header>
      <div className="solo-stampa mb-6 text-lg font-bold">Consulting/34 STP · Simulazione partita IVA</div>

      <main>
        {passo === 0 && <Passo1Attivita r={r} set={set} />}
        {passo === 1 && <Passo2Ricavi r={r} set={set} />}
        {passo === 2 && <Passo3Previdenza r={r} set={set} />}
        {passo === 3 && <Passo4Costi r={r} set={set} />}
        {passo === 4 && <Risultato r={r} onModifica={() => setPasso(0)} />}
      </main>

      {passo < ultimo && (
        <nav className="mt-10 flex items-center justify-between border-t border-neutral-200 pt-6">
          <div>{passo > 0 && <Bottone secondario onClick={() => setPasso(passo - 1)}>Indietro</Bottone>}</div>
          <Bottone onClick={() => setPasso(passo + 1)}>{passo === ultimo - 1 ? "Vedi il risultato" : "Avanti"}</Bottone>
        </nav>
      )}
    </div>
  );
}
