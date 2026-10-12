const euroFmt = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const pctFmt = new Intl.NumberFormat("it-IT", { style: "percent", maximumFractionDigits: 2 });

/** Euro senza decimali, col segno meno tipografico per i negativi. */
export const euro = (n: number) => {
  const v = Math.round(n);
  return (v < 0 ? "−" : "") + euroFmt.format(Math.abs(v));
};
/** Euro con il segno sempre visibile: per le differenze. */
export const euroSegno = (n: number) => (Math.round(n) > 0 ? "+" : "") + euro(n);
export const percento = (n: number) => pctFmt.format(n);
/** Data ISO in gg/mm/aa, come vuole lo studio. */
export const dataIt = (iso: string) => {
  const [a, m, g] = iso.split("-");
  return `${g}/${m}/${a.slice(2)}`;
};
export const oggiIt = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`;
};
export const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
export const MESI_ESTESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
