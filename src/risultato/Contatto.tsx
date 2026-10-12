import { useState, type FormEvent } from "react";
import type { Modello } from "./useModello";
import type { Risposte } from "../stato";
import { CONFIG } from "../config";
import { emailValida, inviaRichiesta, type EsitoInvio } from "../lead";

const campo = "w-full rounded-full border-[1.5px] border-white/30 bg-white/10 px-4 py-2.5 text-[14px] text-white placeholder:text-white/60 focus:border-white focus:outline-none";

export function Contatto({ m, r }: { m: Modello; r: Risposte }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [messaggio, setMessaggio] = useState("");
  const [consenso, setConsenso] = useState(false);
  const [stato, setStato] = useState<"pronto" | "invio">("pronto");
  const [esito, setEsito] = useState<EsitoInvio | null>(null);
  const [errore, setErrore] = useState("");
  const [copiato, setCopiato] = useState(false);

  const invia = async (e: FormEvent) => {
    e.preventDefault();
    setErrore("");
    if (!nome.trim()) return setErrore("Scrivi il tuo nome.");
    if (!emailValida(email)) return setErrore("Controlla l'email: manca qualcosa.");
    if (!consenso) return setErrore("Per ricontattarti ci serve il consenso al trattamento dei dati.");
    setStato("invio");
    const risultato = await inviaRichiesta({ nome: nome.trim(), email: email.trim(), telefono: telefono.trim(), messaggio: messaggio.trim(), consenso }, r, m);
    setStato("pronto");
    if (risultato.esito === "errore") setErrore(risultato.messaggio);
    else setEsito(risultato);
  };

  const copia = async (testo: string) => {
    try {
      await navigator.clipboard.writeText(testo);
      setCopiato(true);
    } catch {
      const area = document.getElementById("testo-richiesta") as HTMLTextAreaElement | null;
      area?.select();
    }
  };

  return (
    <section className="no-stampa grid grid-cols-1 gap-6 rounded-[20px] bg-blu p-6 text-white sm:p-8 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <h2 className="m-0 text-[30px] font-bold leading-[1.05]">Vuoi che lo guardiamo insieme?</h2>
        <p className="m-0 mt-3 max-w-[46ch] text-[15px] leading-relaxed text-white/85">
          Questa è una stima. Con i tuoi numeri veri, i contratti e le spese reali ti diciamo quale regime scegliere e come aprire. Ti ricontatta {CONFIG.studio.referente}, referente per le nuove partite IVA di {CONFIG.studio.nome}.
        </p>
        {!CONFIG.anteprima && (
          <button type="button" onClick={() => window.print()} className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full border-[1.5px] border-white/50 px-5 text-[14px] font-semibold hover:border-white">
            Scarica la simulazione in PDF
          </button>
        )}
      </div>

      <div className="lg:col-span-7">
        {esito?.esito === "inviata" ? (
          <div className="rounded-2xl bg-white/10 p-5">
            <p className="m-0 font-display text-[22px] font-bold">Richiesta ricevuta.</p>
            <p className="m-0 mt-2 text-[14px] text-white/85">Ti scriviamo a {email} entro un giorno lavorativo.</p>
          </div>
        ) : esito?.esito === "manuale" ? (
          <div className="flex flex-col gap-3 rounded-2xl bg-white/10 p-5">
            <p className="m-0 text-[15px] font-semibold">Mandaci questo testo a <span className="select-all font-mono">{CONFIG.emailStudio}</span></p>
            <textarea id="testo-richiesta" readOnly value={esito.testo} rows={8} className="w-full resize-y rounded-xl border border-white/30 bg-white/10 p-3 font-mono text-[12.5px] text-white" />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => copia(esito.testo)} className="inline-flex min-h-[40px] items-center rounded-full bg-white px-4 text-[13.5px] font-semibold text-[#0a0f1f]">{copiato ? "Copiato" : "Copia il testo"}</button>
              <a href={`mailto:${CONFIG.emailStudio}?subject=${encodeURIComponent("Simulazione partita IVA")}&body=${encodeURIComponent(esito.testo)}`} className="inline-flex min-h-[40px] items-center rounded-full border-[1.5px] border-white/50 px-4 text-[13.5px] font-semibold text-white no-underline">Apri l'email</a>
            </div>
          </div>
        ) : (
          <form onSubmit={invia} noValidate className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-[12.5px] font-semibold">
                Nome e cognome
                <input id="lead-nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" className={campo} />
              </label>
              <label className="flex flex-col gap-1 text-[12.5px] font-semibold">
                Email
                <input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="nome@esempio.it" className={campo} />
              </label>
              <label className="flex flex-col gap-1 text-[12.5px] font-semibold">
                Telefono, se preferisci una chiamata
                <input id="lead-telefono" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} autoComplete="tel" className={campo} />
              </label>
              <label className="flex flex-col gap-1 text-[12.5px] font-semibold">
                Qualcosa da aggiungere
                <input id="lead-messaggio" value={messaggio} onChange={(e) => setMessaggio(e.target.value)} className={campo} />
              </label>
            </div>
            <label className="flex items-start gap-2.5 text-[12.5px] leading-snug text-white/90">
              <input id="lead-consenso" type="checkbox" checked={consenso} onChange={(e) => setConsenso(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-white" />
              <span>
                Acconsento al trattamento dei miei dati da parte di {CONFIG.studio.nome} per essere ricontattato su questa simulazione
                {CONFIG.privacyUrl ? (
                  <>
                    {" "}(<a href={CONFIG.privacyUrl} target="_blank" rel="noreferrer" className="text-white underline">informativa privacy</a>)
                  </>
                ) : null}
                .
              </span>
            </label>
            {errore && <p role="alert" className="m-0 rounded-xl bg-[#0a0f1f]/30 px-3 py-2 text-[13px] font-semibold">{errore}</p>}
            <div>
              <button type="submit" disabled={stato === "invio"} className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0a0f1f] transition hover:-translate-y-px disabled:opacity-60">
                {stato === "invio" ? "Invio in corso" : "Chiedi una consulenza"} <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
