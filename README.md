# Forfett-ordinario

Simulatore partita IVA di Consulting/34 STP, per i clienti: forfettario o ordinario, con imposte, contributi, spese deducibili voce per voce e calendario dei versamenti sui prossimi tre anni.

## Cosa fa

- **Tre domande**: attività e settore, incassi e situazione personale, previdenza (Gestione Separata, artigiani e commercianti con le riduzioni, dieci Casse professionali, Enasarco per gli agenti).
- **Due schede**. Forfettario: il conto col coefficiente, le spese che non contano. Ordinario: 29 voci di spesa con cursore, quota deducibile IRPEF, IVA recuperabile, importo dedotto e risparmio reale; accanto il conto dell'IRPEF.
- **Tre anni con acconti e saldi**: tabella anno per anno, punto di pareggio, calendario di cassa mese per mese con il secondo anno in evidenza.
- **Contatto**: richiesta di consulenza salvata su Supabase, oppure testo pronto da mandare via email se il database non è configurato. PDF della simulazione dalla stampa del browser.

## Struttura

- `motore/`: il calcolo, TypeScript puro e testato. Parametri per anno in `motore/parametri/<anno>.ts`, con norma, URL e stato di verifica per ogni cifra. Regole dei costi in `motore/catalogoCosti.ts`.
- `src/`: l'interfaccia (Vite, React, Tailwind). Colori come token CSS in `src/index.css`, con tema chiaro e scuro.
- `supabase/migrations/`: la tabella delle richieste di contatto, in sola scrittura per il simulatore.

## Comandi

```
npm install
npm run dev               # sviluppo su http://localhost:8080
npm run test              # test del motore e dell'interfaccia
npm run verifica          # typecheck, lint, test e build
npm run build             # build di produzione in dist/
npm run build:anteprima   # build per l'anteprima statica, senza stampa né invii
```

## Configurazione

Copia `.env.example` in `.env`:

- `VITE_EMAIL_STUDIO`: l'indirizzo a cui scrivere quando il database non è attivo.
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`: attivano il salvataggio delle richieste. Prima applica la migrazione in `supabase/migrations/`.
- `VITE_PRIVACY_URL`: il link all'informativa privacy accanto al consenso.

## Aggiornare i parametri

Ogni Legge di Bilancio e ogni circolare INPS cambia qualche cifra. Si tocca solo `motore/parametri/<anno>.ts` (un file nuovo per l'anno nuovo, registrato in `motore/parametri/index.ts`). Le percentuali di deducibilità stanno in `motore/catalogoCosti.ts`. I test dicono subito se qualcosa non torna.
