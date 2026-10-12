import { describe, expect, it } from "vitest";
import { profiloBase } from "./profiloBase";
import { confronta, simulaRegime } from "./simulazione";
import { accontiImposta } from "./acconti";
import { detrazioneAutonomi } from "./ordinario";
import { verificaForfettario, aliquotaForfettario } from "./forfettario";
import { parametriPerAnno } from "./parametri";
import { addizionaleRegionaleSu } from "./utilita";
import { ADDIZIONALI_LAZIO_ROMA } from "./parametri/addizionali";

const P = parametriPerAnno(2026);
const vicino = (a: number, b: number) => expect(a).toBeCloseTo(b, 1);

describe("forfettario, professionista in Gestione Separata", () => {
  const r = simulaRegime(profiloBase(), "forfettario");
  const [a1, a2] = r.anni;

  it("primo anno: reddito col coefficiente, 5%, niente acconti, contributi di competenza", () => {
    vicino(a1.contributi.baseImponibile, 39_000);
    vicino(a1.contributi.totale, 39_000 * 0.2607);
    expect(a1.contributiVersatiNellAnno).toBe(0);
    vicino(a1.imposta.redditoImponibile, 39_000);
    vicino(a1.imposta.netta, 1_950);
    expect(a1.bollo).toBe(24);
    vicino(a1.nettoCompetenza, 50_000 - 1_950 - 39_000 * 0.2607 - 24);
    expect(a1.versamenti.filter((v) => v.tipo.startsWith("imposta"))).toHaveLength(0);
  });

  it("secondo anno: saldo più acconti, e i contributi versati abbassano l'imponibile", () => {
    const contributi2026 = 39_000 * 0.2607;
    const acconti2027 = contributi2026 * 0.8;
    vicino(a2.contributiVersatiNellAnno, contributi2026 + acconti2027);
    vicino(a2.imposta.redditoImponibile, 39_000 - contributi2026 - acconti2027);
    vicino(a2.imposta.netta, (39_000 - contributi2026 - acconti2027) * 0.05);
    const saldo = a2.versamenti.find((v) => v.tipo === "imposta_saldo");
    vicino(saldo!.importo, 1_950);
    const acconti = a2.versamenti.filter((v) => v.tipo === "imposta_acconto");
    expect(acconti).toHaveLength(2);
    vicino(acconti[0].importo, 975);
    vicino(acconti[1].importo, 975);
    expect(a2.nettoCassa).toBeLessThan(a1.nettoCassa);
  });

  it("la coda contiene saldo e acconti dell'anno dopo l'ultimo", () => {
    expect(r.codaVersamenti.some((v) => v.tipo === "imposta_saldo")).toBe(true);
    expect(r.codaVersamenti.some((v) => v.tipo === "inps_acconto")).toBe(true);
  });
});

describe("forfettario, artigiano con riduzione 35%", () => {
  const r = simulaRegime(
    profiloBase({
      natura: "impresa",
      gruppoCoefficiente: "altre_attivita",
      ricaviPerAnno: [30_000, 30_000],
      previdenza: { tipo: "artigiani", riduzione: "35", esoneroDipendentePieno: false },
    }),
    "forfettario",
  );
  const a1 = r.anni[0];

  it("fissi ridotti sull'IVS ma non sulla maternità, eccedenza ridotta", () => {
    const reddito = 30_000 * 0.67;
    vicino(a1.contributi.fissi, 18_808 * 0.24 * 0.65 + 7.44);
    vicino(a1.contributi.variabili, (reddito - 18_808) * 0.24 * 0.65);
  });

  it("tre rate fisse escono nell'anno, la quarta a febbraio e si deduce l'anno dopo", () => {
    const rate = a1.versamenti.filter((v) => v.tipo === "inps_fisso");
    expect(rate).toHaveLength(4);
    expect(rate[3].data).toBe("2027-02-16");
    vicino(a1.contributiVersatiNellAnno, a1.contributi.fissi * 0.75);
    const a2 = r.anni[1];
    expect(a2.contributiVersatiNellAnno).toBeGreaterThan(a1.contributi.fissi);
  });
});

describe("riduzione 50% nuovi iscritti", () => {
  it("spetta solo a chi si è iscritto nel 2025, per 36 mesi", () => {
    const base = { natura: "impresa" as const, gruppoCoefficiente: "altre_attivita" as const, ricaviPerAnno: [20_000, 20_000, 20_000, 20_000] };
    const iscritto2025 = simulaRegime(
      profiloBase({ ...base, annoAperturaPiva: 2025, previdenza: { tipo: "commercianti", riduzione: "50", esoneroDipendentePieno: false } }),
      "forfettario",
    );
    vicino(iscritto2025.anni[0].contributi.fissi, 18_808 * 0.2448 * 0.5 + 7.44);
    vicino(iscritto2025.anni[1].contributi.fissi, 18_808 * 0.2448 * 0.5 + 7.44);
    vicino(iscritto2025.anni[2].contributi.fissi, 18_808 * 0.2448 + 7.44);

    const iscritto2026 = simulaRegime(
      profiloBase({ ...base, previdenza: { tipo: "commercianti", riduzione: "50", esoneroDipendentePieno: false } }),
      "forfettario",
    );
    vicino(iscritto2026.anni[0].contributi.fissi, 18_808 * 0.2448 + 7.44);
    expect(iscritto2026.anni[0].contributi.note.join(" ")).toContain("2025");
  });
});

describe("ordinario, professionista", () => {
  const r = simulaRegime(
    profiloBase({
      ricaviPerAnno: [60_000],
      costi: { interamenteDeducibili: 10_000, auto: 0, telefonia: 0, vittoAlloggio: 0, rappresentanza: 0, formazione: 0, beniStrumentali: 0 },
    }),
    "ordinario",
  );
  const a = r.anni[0];

  it("IRPEF 2026 a tre aliquote, addizionali Lazio e Roma, IVA al netto dei costi", () => {
    vicino(a.costiDeducibili, 10_000);
    vicino(a.contributi.totale, 50_000 * 0.2607);
    vicino(a.imposta.lorda, 28_000 * 0.23 + 22_000 * 0.33);
    expect(a.imposta.detrazioni).toBe(0);
    vicino(a.imposta.addizionaleRegionale, 15_000 * 0.0173 + 35_000 * 0.0333);
    vicino(a.imposta.addizionaleComunale, 50_000 * 0.009);
    vicino(a.ivaDaVersare, 60_000 * 0.22 - 10_000 * 0.22);
    expect(a.versamenti.filter((v) => v.tipo === "iva")).toHaveLength(5);
  });

  it("le deducibilità parziali e i tetti si applicano", () => {
    const r2 = simulaRegime(
      profiloBase({
        ricaviPerAnno: [60_000],
        costi: { interamenteDeducibili: 0, auto: 5_000, telefonia: 1_000, vittoAlloggio: 2_000, rappresentanza: 1_000, formazione: 12_000, beniStrumentali: 0 },
      }),
      "ordinario",
    );
    const vitto = Math.min(2_000 * 0.75, 60_000 * 0.02);
    vicino(r2.anni[0].costiDeducibili, 5_000 * 0.2 + 1_000 * 0.8 + vitto + Math.min(1_000, 600) + 10_000);
  });

  it("la ritenuta d'acconto anticipa l'imposta e riduce il saldo", () => {
    const r3 = simulaRegime(profiloBase({ ricaviPerAnno: [60_000, 60_000], quotaRicaviConRitenuta: 1 }), "ordinario");
    vicino(r3.anni[0].ritenuteSubite, 12_000);
    const saldo = r3.anni[1].versamenti.find((v) => v.tipo === "imposta_saldo");
    vicino(saldo!.importo, r3.anni[0].imposta.netta - 12_000);
    const acconti = r3.anni[1].versamenti.filter((v) => v.tipo === "imposta_acconto");
    vicino(acconti[0].importo + acconti[1].importo, r3.anni[0].imposta.netta - 12_000);
  });

  it("con altri redditi l'IRPEF è incrementale e niente detrazione autonomi", () => {
    const r4 = simulaRegime(profiloBase({ ricaviPerAnno: [20_000], altriRedditiIrpef: 30_000 }), "ordinario");
    vicino(r4.anni[0].imposta.lorda, 20_000 * 0.33);
    expect(r4.anni[0].imposta.detrazioni).toBe(0);
  });
});

describe("detrazione lavoro autonomo art. 13 c. 5", () => {
  it("piena, decrescente con maggiorazione, decrescente alta, zero", () => {
    expect(detrazioneAutonomi(5_000, P)).toBe(1_265);
    vicino(detrazioneAutonomi(16_750, P), 500 + 765 * (11_250 / 22_500) + 50);
    vicino(detrazioneAutonomi(39_000, P), 250);
    expect(detrazioneAutonomi(60_000, P)).toBe(0);
  });
});

describe("addizionale regionale Lazio", () => {
  it("aliquota unica fino a 28.000, scaglioni oltre, detrazione di fascia", () => {
    vicino(addizionaleRegionaleSu(20_000, ADDIZIONALI_LAZIO_ROMA.regionale), 346);
    vicino(addizionaleRegionaleSu(29_000, ADDIZIONALI_LAZIO_ROMA.regionale), 15_000 * 0.0173 + 14_000 * 0.0333 - 60);
  });
});

describe("acconti", () => {
  it("soglie e rate 50/50", () => {
    expect(accontiImposta(50, P).totale).toBe(0);
    expect(accontiImposta(200, P)).toEqual({ totale: 200, primaRata: 0, secondaRata: 200 });
    expect(accontiImposta(1_000, P)).toEqual({ totale: 1_000, primaRata: 500, secondaRata: 500 });
  });
});

describe("applicabilità del forfettario", () => {
  const p = profiloBase();
  it("oltre 100.000 esce subito; oltre 85.000 l'anno prima esce dopo; dipendente oltre soglia", () => {
    expect(verificaForfettario(p, 2026, 101_000, null, P).applicabile).toBe(false);
    expect(verificaForfettario(p, 2027, 50_000, 90_000, P).applicabile).toBe(false);
    expect(verificaForfettario(p, 2026, 90_000, null, P).applicabile).toBe(true);
    expect(verificaForfettario(p, 2026, 90_000, null, P).avvisi.length).toBeGreaterThan(0);
    expect(verificaForfettario(profiloBase({ redditoDipendenteAnnoPrecedente: 36_000 }), 2026, 50_000, null, P).applicabile).toBe(false);
    expect(verificaForfettario(profiloBase({ redditoDipendenteAnnoPrecedente: 35_000 }), 2026, 50_000, null, P).applicabile).toBe(true);
  });

  it("nella serie l'anno dopo lo sforamento è calcolato in ordinario e marcato", () => {
    const r = simulaRegime(profiloBase({ ricaviPerAnno: [90_000, 90_000] }), "forfettario");
    expect(r.anni[0].regime).toBe("forfettario");
    expect(r.anni[1].regime).toBe("ordinario");
    expect(r.anni[1].applicabile).toBe(false);
  });

  it("il 5% dura cinque anni dall'apertura", () => {
    expect(aliquotaForfettario(profiloBase({ annoAperturaPiva: 2022 }), 2026, P)).toBe(0.05);
    expect(aliquotaForfettario(profiloBase({ annoAperturaPiva: 2022 }), 2027, P)).toBe(0.15);
    expect(aliquotaForfettario(profiloBase({ requisitiStartup: false }), 2026, P)).toBe(0.15);
  });
});

describe("Cassa privata", () => {
  it("avvocato forfettario: soggettivo sul reddito col coefficiente, integrativo in fattura, maternità", () => {
    const r = simulaRegime(
      profiloBase({ ricaviPerAnno: [40_000], previdenza: { tipo: "cassa", cassa: P.casse.forense, agevolazioneGiovaniAttiva: false } }),
      "forfettario",
    );
    const a = r.anni[0];
    vicino(a.contributi.variabili, 31_200 * 0.17);
    vicino(a.contributi.integrativoRivalsa, 1_600);
    expect(a.contributi.fissi).toBe(94);
    expect(a.contributi.note.join(" ")).toContain("integrativo");
  });

  it("agevolazione neo-iscritti: minimi dimezzati", () => {
    const r = simulaRegime(
      profiloBase({ ricaviPerAnno: [5_000], previdenza: { tipo: "cassa", cassa: P.casse.forense, agevolazioneGiovaniAttiva: true } }),
      "forfettario",
    );
    vicino(r.anni[0].contributi.variabili, 2_790 / 2);
  });
});

describe("rivalsa 4% e bollo riaddebitato concorrono al reddito", () => {
  it("rivalsa in fattura", () => {
    const r = simulaRegime(profiloBase({ ricaviPerAnno: [50_000], previdenza: { tipo: "gestione_separata", altraCopertura: false, rivalsaInFattura: true } }), "forfettario");
    vicino(r.anni[0].ricaviFiscali, 52_000);
    vicino(r.anni[0].contributi.integrativoRivalsa, 2_000);
  });
  it("bollo riaddebitato", () => {
    const r = simulaRegime(profiloBase({ ricaviPerAnno: [50_000], bolloRiaddebitato: true }), "forfettario");
    vicino(r.anni[0].ricaviFiscali, 50_024);
  });
});

describe("confronto", () => {
  it("un professionista senza costi conviene forfettario, e il punto di indifferenza è positivo", () => {
    const c = confronta(profiloBase());
    expect(c.conviene).toBe("forfettario");
    expect(c.differenzaNettoTotale).toBeGreaterThan(0);
    expect(c.puntoIndifferenzaCosti).toBeGreaterThan(0);
    expect(c.puntoIndifferenzaCosti).toBeLessThan(50_000);
  });

  it("con il forfettario inapplicabile il confronto non sceglie", () => {
    const c = confronta(profiloBase({ ricaviPerAnno: [120_000] }));
    expect(c.conviene).toBeNull();
  });

  it("attività già avviata: il primo anno mostrato ha già saldo e acconti", () => {
    const r = simulaRegime(profiloBase({ annoAperturaPiva: 2023 }), "forfettario");
    expect(r.anni[0].versamenti.some((v) => v.tipo === "imposta_acconto")).toBe(true);
  });
});
