import type { ReactNode } from "react";

export function Sezione({ titolo, sotto, children }: { titolo: string; sotto?: string; children: ReactNode }) {
  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">{titolo}</h2>
        {sotto && <p className="mt-1 text-[15px] text-[color:var(--inchiostro-2)]">{sotto}</p>}
      </header>
      {children}
    </section>
  );
}

export function Campo({ etichetta, aiuto, children }: { etichetta: string; aiuto?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium">{etichetta}</span>
      {aiuto && <span className="block text-[13px] text-[color:var(--inchiostro-2)]">{aiuto}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export function Euro({ valore, onChange, passo = 500, min = 0 }: { valore: number; onChange: (n: number) => void; passo?: number; min?: number }) {
  return (
    <div className="relative">
      <input
        type="number"
        inputMode="numeric"
        min={min}
        step={passo}
        value={Number.isFinite(valore) ? valore : ""}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 pr-8 text-right font-mono text-[15px] tabular-nums focus:border-[color:var(--forfettario)] focus:outline-none focus:ring-2 focus:ring-[color:var(--forfettario)]/20"
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-500">€</span>
    </div>
  );
}

export function Numero({ valore, onChange, min = 0, max }: { valore: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={valore}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-right font-mono text-[15px] tabular-nums focus:outline-none focus:ring-2 focus:ring-[color:var(--forfettario)]/20"
    />
  );
}

export function Scelte<T extends string>({
  valore,
  onChange,
  opzioni,
  colonne = 1,
}: {
  valore: T;
  onChange: (v: T) => void;
  opzioni: Array<{ id: T; nome: string; descrizione?: string }>;
  colonne?: 1 | 2 | 3;
}) {
  const cols = { 1: "grid-cols-1", 2: "grid-cols-1 sm:grid-cols-2", 3: "grid-cols-1 sm:grid-cols-3" }[colonne];
  return (
    <div role="radiogroup" className={`grid gap-2 ${cols}`}>
      {opzioni.map((o) => {
        const attiva = o.id === valore;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={attiva}
            onClick={() => onChange(o.id)}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              attiva ? "border-[color:var(--forfettario)] bg-[color:var(--forfettario)]/5 ring-1 ring-[color:var(--forfettario)]" : "border-neutral-200 bg-white hover:border-neutral-400"
            }`}
          >
            <span className="block text-[15px] font-medium">{o.nome}</span>
            {o.descrizione && <span className="block text-[13px] text-[color:var(--inchiostro-2)]">{o.descrizione}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Interruttore({ valore, onChange, etichetta, aiuto }: { valore: boolean; onChange: (v: boolean) => void; etichetta: string; aiuto?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={valore}
      onClick={() => onChange(!valore)}
      className="flex w-full items-start gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left hover:border-neutral-400"
    >
      <span className={`mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${valore ? "bg-[color:var(--forfettario)]" : "bg-neutral-300"}`}>
        <span className={`h-5 w-5 rounded-full bg-white shadow transition ${valore ? "translate-x-5" : ""}`} />
      </span>
      <span>
        <span className="block text-[15px] font-medium">{etichetta}</span>
        {aiuto && <span className="block text-[13px] text-[color:var(--inchiostro-2)]">{aiuto}</span>}
      </span>
    </button>
  );
}

export function Bottone({ children, onClick, secondario, disabilitato, type = "button" }: { children: ReactNode; onClick?: () => void; secondario?: boolean; disabilitato?: boolean; type?: "button" | "submit" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabilitato}
      className={`rounded-full px-5 py-2.5 text-[15px] font-medium transition disabled:opacity-40 ${
        secondario ? "border border-neutral-300 bg-white hover:border-neutral-500" : "bg-[color:var(--inchiostro)] text-white hover:bg-neutral-800"
      }`}
    >
      {children}
    </button>
  );
}

export function Avviso({ children, tono = "info" }: { children: ReactNode; tono?: "info" | "attenzione" }) {
  const stile = tono === "attenzione" ? "border-amber-300 bg-amber-50" : "border-neutral-200 bg-neutral-50";
  return <div className={`rounded-lg border px-4 py-3 text-[14px] ${stile}`}>{children}</div>;
}
