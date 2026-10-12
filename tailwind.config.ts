import type { Config } from "tailwindcss";

/**
 * I colori sono token CSS (src/index.css), così il tema scuro li ridefinisce
 * in un punto solo. Qui Tailwind li conosce per nome.
 */
const token = (nome: string) => `var(--${nome})`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Bricolage Grotesque Variable'", "'Bricolage Grotesque'", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "-apple-system", "'Segoe UI'", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        fondo: token("fondo"),
        carta: token("carta"),
        carta2: token("carta-2"),
        bordo: token("bordo"),
        bordo2: token("bordo-2"),
        testo: token("testo"),
        testo2: token("testo-2"),
        testo3: token("testo-3"),
        blu: token("blu"),
        bluTesto: token("blu-testo"),
        bluTenue: token("blu-tenue"),
        corallo: token("corallo"),
        coralloTesto: token("corallo-testo"),
        coralloTenue: token("corallo-tenue"),
        ink: token("ink"),
        inkBordo: token("ink-bordo"),
        giallo: token("giallo"),
        verde: token("verde"),
        verdeTenue: token("verde-tenue"),
        arancio: token("arancio"),
        arancioTenue: token("arancio-tenue"),
        ambra: token("ambra"),
        ambraTenue: token("ambra-tenue"),
        neutroTenue: token("neutro-tenue"),
      },
      boxShadow: {
        carta: "var(--ombra)",
        alta: "var(--ombra-alta)",
        blu: "0 6px 18px -6px rgba(31, 75, 255, 0.6)",
      },
    },
  },
  plugins: [],
} satisfies Config;
