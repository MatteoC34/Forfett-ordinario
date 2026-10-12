import { useState } from "react";
import type { Confronto, Versamento } from "@motore/tipi";
import { euro } from "../formato";

const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

function perMese(versamenti: Versamento[], anno: number): number[] {
  const m = new Array(12).fill(0);
  for (const v of versamenti) {
    if (!v.data.startsWith(`${anno}-`) || v.tipo === "iva") continue;
    m[Number(v.data.slice(5, 7)) - 1] += Math.max(0, v.importo);
  }
  return m;
}

/**
 * Uscite mensili dei due regimi nell'anno scelto, affiancate. Due serie,
 * colori fissi, legenda sempre presente, tooltip al passaggio. L'IVA è esclusa:
 * è denaro dei clienti che transita, non un'uscita del contribuente.
 */
export function GraficoCassa({ confronto, anno }: { confronto: Confronto; anno: number }) {
  const [attivo, setAttivo] = useState<number | null>(null);
  const af = confronto.forfettario.anni.find((a) => a.anno === anno);
  const ao = confronto.ordinario.anni.find((a) => a.anno === anno);
  if (!af || !ao) return null;
  const f = perMese(af.versamenti, anno);
  const o = perMese(ao.versamenti, anno);
  const max = Math.max(1, ...f, ...o);
  const H = 180;
  return (
    <div>
      <div className="relative">
        <div className="grid grid-cols-12 items-end gap-1.5 border-b border-neutral-200" style={{ height: H }}>
          {MESI.map((_, i) => (
            <div
              key={i}
              className="flex h-full items-end gap-0.5"
              onMouseEnter={() => setAttivo(i)}
              onMouseLeave={() => setAttivo(null)}
              onFocus={() => setAttivo(i)}
              onBlur={() => setAttivo(null)}
              tabIndex={0}
              role="img"
              aria-label={`${MESI[i]}: forfettario ${euro(f[i])}, ordinario ${euro(o[i])}`}
            >
              <div className="flex-1 rounded-t" style={{ height: `${(f[i] / max) * 100}%`, background: "var(--forfettario)", minHeight: f[i] > 0 ? 2 : 0 }} />
              <div className="flex-1 rounded-t" style={{ height: `${(o[i] / max) * 100}%`, background: "var(--ordinario)", minHeight: o[i] > 0 ? 2 : 0 }} />
            </div>
          ))}
        </div>
        {attivo != null && (
          <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] shadow-sm">
            <div className="font-medium">{MESI[attivo]} {anno}</div>
            <div><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: "var(--forfettario)" }} />Forfettario <span className="font-mono">{euro(f[attivo])}</span></div>
            <div><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: "var(--ordinario)" }} />Ordinario <span className="font-mono">{euro(o[attivo])}</span></div>
          </div>
        )}
      </div>
      <div className="mt-2 grid grid-cols-12 gap-1.5 text-center text-[12px] text-[color:var(--inchiostro-2)]">
        {MESI.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-5 text-[13px] text-[color:var(--inchiostro-2)]">
        <span><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: "var(--forfettario)" }} />Forfettario, nell'anno <span className="font-mono">{euro(f.reduce((a, b) => a + b, 0))}</span></span>
        <span><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: "var(--ordinario)" }} />Ordinario, nell'anno <span className="font-mono">{euro(o.reduce((a, b) => a + b, 0))}</span> (IVA esclusa)</span>
      </div>
    </div>
  );
}
