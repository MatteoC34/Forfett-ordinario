const euroFmt = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const euroCentFmt = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pctFmt = new Intl.NumberFormat("it-IT", { style: "percent", maximumFractionDigits: 2 });

export const euro = (n: number) => euroFmt.format(Math.round(n));
export const euroCent = (n: number) => euroCentFmt.format(n);
export const percento = (n: number) => pctFmt.format(n);
export const dataIt = (iso: string) => {
  const [a, m, g] = iso.split("-");
  return `${g}/${m}/${a.slice(2)}`;
};
export const meseIt = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("it-IT", { month: "long", year: "numeric" });
