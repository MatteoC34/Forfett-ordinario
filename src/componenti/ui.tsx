import type { ReactNode } from "react";

/** Titolo di sezione col numero in mono: si usa solo dove l'ordine è un percorso vero. */
export function Sezione({ numero, titolo, sotto, children, azioni }: { numero?: string; titolo: string; sotto?: ReactNode; children?: ReactNode; azioni?: ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {numero && <span className="pt-2 font-mono text-[12px] font-medium tracking-wider text-bluTesto">{numero}</span>}
          <div className="min-w-0">
            <h2 className="m-0 text-[26px] font-bold leading-[1.08] sm:text-[30px]">{titolo}</h2>
            {sotto && <p className="m-0 mt-1.5 max-w-[68ch] text-[14.5px] leading-relaxed text-testo2">{sotto}</p>}
          </div>
        </div>
        {azioni}
      </header>
      {children}
    </section>
  );
}

export function Carta({ children, className = "", as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" | "article" }) {
  return <Tag className={`min-w-0 rounded-[18px] border border-bordo bg-carta p-5 shadow-carta sm:p-6 ${className}`}>{children}</Tag>;
}

export function Etichetta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`block text-[11px] font-semibold uppercase tracking-[0.08em] text-testo3 ${className}`}>{children}</span>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex w-fit items-center gap-2 self-start rounded-full bg-bluTenue py-1 pl-2 pr-3 text-[11.5px] font-semibold text-bluTesto">
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}

/** La riga disegnata a mano sotto una frase sola del titolo. */
export function Sottolineato({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block">
      {children}
      <svg aria-hidden="true" viewBox="0 0 300 12" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-[0.2em] h-[0.3em] w-full fill-none stroke-blu" style={{ strokeWidth: 7, strokeLinecap: "round" }}>
        <path d="M3 8 C 80 2, 160 10, 297 5" />
      </svg>
    </span>
  );
}

export function Campo({ etichetta, aiuto, children, id }: { etichetta: string; aiuto?: string; children: ReactNode; id?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[14px] font-semibold">
        {etichetta}
        {aiuto && <span className="mt-0.5 block text-[12.5px] font-normal leading-snug text-testo2">{aiuto}</span>}
      </label>
      {children}
    </div>
  );
}

const inputBase =
  "w-full rounded-full border-[1.5px] border-bordo2 bg-carta px-4 py-2.5 font-mono text-[15px] text-testo cifre focus:border-blu focus:outline-none";

export function Euro({ id, valore, onChange, passo = 500, min = 0 }: { id: string; valore: number; onChange: (n: number) => void; passo?: number; min?: number }) {
  return (
    <div className="relative">
      <input id={id} type="number" inputMode="numeric" min={min} step={passo} value={Number.isFinite(valore) ? valore : ""} onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))} className={`${inputBase} pr-9 text-right`} />
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-testo3" aria-hidden="true">€</span>
    </div>
  );
}

export function Numero({ id, valore, onChange, min = 0, max }: { id: string; valore: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return <input id={id} type="number" inputMode="numeric" min={min} max={max} value={valore} onChange={(e) => onChange(Number(e.target.value) || 0)} className={`${inputBase} text-right`} />;
}

/** Scelta tra carte grandi: per le domande che decidono il percorso. */
export function Scelte<T extends string>({ nome, valore, onChange, opzioni, colonne = 1 }: { nome: string; valore: T; onChange: (v: T) => void; opzioni: Array<{ id: T; nome: string; descrizione?: string; accessorio?: ReactNode }>; colonne?: 1 | 2 | 3 }) {
  const cols = { 1: "grid-cols-1", 2: "grid-cols-1 sm:grid-cols-2", 3: "grid-cols-1 sm:grid-cols-3" }[colonne];
  return (
    <div role="radiogroup" aria-label={nome} className={`grid gap-2.5 ${cols}`}>
      {opzioni.map((o) => {
        const attiva = o.id === valore;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={attiva}
            onClick={() => onChange(o.id)}
            className={`flex items-start justify-between gap-3 rounded-2xl border-[1.5px] px-4 py-3.5 text-left transition-colors ${attiva ? "border-blu bg-bluTenue" : "border-bordo bg-carta hover:border-bordo2"}`}
          >
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold">{o.nome}</span>
              {o.descrizione && <span className="mt-0.5 block text-[13px] leading-snug text-testo2">{o.descrizione}</span>}
            </span>
            {o.accessorio}
          </button>
        );
      })}
    </div>
  );
}

/** Il segmentato: il comando che si usa di più. */
export function Seg<T extends string | number>({ nome, valore, onChange, opzioni, piccolo, tono = "ink" }: { nome: string; valore: T; onChange: (v: T) => void; opzioni: Array<{ id: T; nome: string }>; piccolo?: boolean; tono?: "ink" | "blu" | "corallo" }) {
  const attivo = { ink: "bg-ink text-white", blu: "bg-blu text-white", corallo: "bg-corallo text-[#0a0f1f]" }[tono];
  return (
    <div role="radiogroup" aria-label={nome} className="inline-flex max-w-full flex-wrap gap-1 rounded-[20px] border border-bordo bg-carta2 p-1">
      {opzioni.map((o) => (
        <button
          key={String(o.id)}
          type="button"
          role="radio"
          aria-checked={o.id === valore}
          onClick={() => onChange(o.id)}
          className={`rounded-full font-semibold transition-colors ${piccolo ? "min-h-[30px] px-3 text-[12px]" : "min-h-[36px] px-4 text-[13px]"} ${o.id === valore ? attivo : "text-testo2 hover:text-testo"}`}
        >
          {o.nome}
        </button>
      ))}
    </div>
  );
}

export function Interruttore({ id, valore, onChange, etichetta, aiuto }: { id: string; valore: boolean; onChange: (v: boolean) => void; etichetta: string; aiuto?: string }) {
  return (
    <button id={id} type="button" role="switch" aria-checked={valore} onClick={() => onChange(!valore)} className="flex w-full items-start gap-3 rounded-2xl border border-bordo bg-carta px-4 py-3 text-left hover:border-bordo2">
      <span className={`mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${valore ? "bg-blu" : "bg-bordo2"}`} aria-hidden="true">
        <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${valore ? "translate-x-5" : ""}`} />
      </span>
      <span className="min-w-0">
        <span className="block text-[14.5px] font-semibold leading-snug">{etichetta}</span>
        {aiuto && <span className="mt-0.5 block text-[12.5px] leading-snug text-testo2">{aiuto}</span>}
      </span>
    </button>
  );
}

type TonoBottone = "blu" | "ink" | "linea" | "bianco";
export function Bottone({ children, onClick, tono = "ink", disabilitato, type = "button", freccia, piccolo }: { children: ReactNode; onClick?: () => void; tono?: TonoBottone; disabilitato?: boolean; type?: "button" | "submit"; freccia?: boolean; piccolo?: boolean }) {
  const stile = {
    blu: "border-blu bg-blu text-white shadow-blu hover:bg-[#163cdc]",
    ink: "border-inkBordo bg-ink text-white",
    linea: "border-bordo2 bg-transparent text-testo hover:border-blu hover:text-bluTesto",
    bianco: "border-white bg-white text-[#0a0f1f]",
  }[tono];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabilitato}
      className={`group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border-[1.5px] font-semibold transition hover:-translate-y-px disabled:pointer-events-none disabled:opacity-40 ${piccolo ? "min-h-[36px] px-3.5 text-[13px]" : "min-h-[44px] px-5 text-[14px]"} ${stile}`}
    >
      {children}
      {freccia && <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>}
    </button>
  );
}

export function Avviso({ children, tono = "info" }: { children: ReactNode; tono?: "info" | "attenzione" }) {
  const stile = tono === "attenzione" ? "border-bordo bg-ambraTenue text-testo" : "border-bordo bg-carta2 text-testo";
  return <div className={`rounded-2xl border px-4 py-3 text-[13.5px] leading-relaxed ${stile}`}>{children}</div>;
}

/** Tessera di un numero: etichetta piccola, cifra grande, nota sotto. */
export function Tessera({ etichetta, valore, nota, evidenza }: { etichetta: string; valore: ReactNode; nota?: ReactNode; evidenza?: boolean }) {
  return (
    <div className={`min-w-0 rounded-2xl border px-4 py-4 ${evidenza ? "border-inkBordo bg-ink text-white" : "border-bordo bg-carta shadow-carta"}`}>
      <span className={`block text-[11px] font-semibold uppercase tracking-[0.07em] ${evidenza ? "text-white/70" : "text-testo3"}`}>{etichetta}</span>
      <span className="mt-2 block font-display text-[26px] font-bold leading-none tracking-[-0.035em] cifre sm:text-[28px]">{valore}</span>
      {nota && <span className={`mt-1.5 block text-[12px] leading-snug ${evidenza ? "text-white/70" : "text-testo2"}`}>{nota}</span>}
    </div>
  );
}

export function Badge({ children, tono }: { children: ReactNode; tono: "verde" | "blu" | "arancio" | "neutro" }) {
  const stile = { verde: "bg-verdeTenue text-verde", blu: "bg-bluTenue text-bluTesto", arancio: "bg-arancioTenue text-arancio", neutro: "bg-neutroTenue text-testo2" }[tono];
  return <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-bold cifre ${stile}`}>{children}</span>;
}


/** Una riga di conto: voce a sinistra, importo a destra, nota sotto. */
export function RigaConto({ voce, importo, nota, segno, forte, tenue, badge }: { voce: ReactNode; importo: string; nota?: ReactNode; segno?: "−" | "+" | "×" | "="; forte?: boolean; tenue?: boolean; badge?: ReactNode }) {
  return (
    <div className={`flex items-baseline gap-3 border-t border-bordo py-2.5 text-[14.5px] ${forte ? "font-semibold" : ""} ${tenue ? "text-testo2" : ""}`}>
      <span className="min-w-0 flex-1">
        {segno && <span className="mr-1.5 font-mono text-testo3">{segno}</span>}
        {voce}
        {badge && <span className="ml-2 align-middle">{badge}</span>}
        {nota && <span className="mt-0.5 block text-[12px] font-normal leading-snug text-testo3">{nota}</span>}
      </span>
      <span className="shrink-0 font-mono font-medium cifre">{importo}</span>
    </div>
  );
}
