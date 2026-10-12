/** Il tono di un badge di percentuale: verde pieno, blu parziale, arancio basso, grigio zero. */
export function tonoQuota(q: number): "verde" | "blu" | "arancio" | "neutro" {
  if (q >= 1) return "verde";
  if (q >= 0.5) return "blu";
  if (q > 0) return "arancio";
  return "neutro";
}
