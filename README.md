# Forfett-ordinario

Simulatore partita IVA di Consulting/34 STP: forfettario o ordinario, con imposte, contributi, calendario dei versamenti sui tre anni e il catalogo dei costi con le regole di deducibilità IRPEF e IVA.

## Struttura

- `motore/`: il motore di calcolo, TypeScript puro, senza dipendenze da interfaccia. Parametri per anno in `motore/parametri/`, con fonte e stato di verifica per ogni cifra. Catalogo dei costi in `motore/catalogoCosti.ts`.
- `src/`: l'interfaccia (Vite, React, Tailwind): percorso guidato in quattro passi e pagina del risultato.

## Comandi

```
npm install
npm run dev        # sviluppo su http://localhost:8080
npm run test       # test del motore
npm run verifica   # typecheck, lint, test e build
```

## Aggiornare i parametri

Ogni Legge di Bilancio e ogni circolare INPS cambia qualche cifra. Si tocca solo `motore/parametri/<anno>.ts`: ogni blocco porta la norma, l'URL e lo stato (`confermato` o `provvisorio`). Le regole dei costi stanno in `motore/catalogoCosti.ts`.
