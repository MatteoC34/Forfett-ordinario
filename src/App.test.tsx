import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "./App";
import { calcolaModello } from "./risultato/useModello";
import { risposteIniziali } from "./stato";
import { riepilogo, emailValida, inviaRichiesta } from "./lead";

describe("percorso completo", () => {
  it("dalle domande al risultato, con le due schede e i costi interattivi", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /che lavoro fai/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /avanti/i }));
    expect(screen.getByRole("heading", { name: /quanto pensi di incassare/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /avanti/i }));
    expect(screen.getByRole("heading", { name: /a chi versi i contributi/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /vedi il risultato/i }));

    expect(screen.getByRole("heading", { level: 1, name: /ti conviene/i })).toBeTruthy();
    const tabOrd = screen.getByRole("tab", { name: /ordinario/i });
    const tabForf = screen.getByRole("tab", { name: /forfettario/i });
    expect(tabOrd.getAttribute("aria-selected")).toBe("true");

    // Nella scheda ordinario ogni voce ha il suo cursore: azzerare l'auto cambia il netto.
    const nettoPrima = within(tabOrd).getAllByText(/€/)[0].textContent;
    fireEvent.change(screen.getByLabelText(/auto: rata, leasing/i), { target: { value: "6000" } });
    const nettoDopo = within(screen.getByRole("tab", { name: /ordinario/i })).getAllByText(/€/)[0].textContent;
    expect(nettoDopo).not.toBe(nettoPrima);

    fireEvent.click(tabForf);
    expect(screen.getByRole("tab", { name: /forfettario/i }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText(/come si calcola l'imposta/i)).toBeTruthy();
    expect(screen.getByRole("heading", { name: /quando esce, davvero/i })).toBeTruthy();
  });

  it("il modulo di contatto non dice mai inviato senza database: dà il testo da mandare", async () => {
    render(<App />);
    fireEvent.click(within(screen.getByRole("navigation", { name: "Passi" })).getByRole("button", { name: /risultato/i }));
    fireEvent.change(screen.getByLabelText(/nome e cognome/i), { target: { value: "Mario Rossi" } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "mario@esempio.it" } });
    fireEvent.click(screen.getByRole("button", { name: /chiedi una consulenza/i }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/acconsento/i));
    fireEvent.click(screen.getByRole("button", { name: /chiedi una consulenza/i }));
    expect(await screen.findByText(/mandaci questo testo/i)).toBeTruthy();
  });
});

describe("richiesta di contatto", () => {
  const m = calcolaModello(risposteIniziali);
  it("riepilogo leggibile con il verdetto", () => {
    const t = riepilogo(risposteIniziali, m);
    expect(t).toMatch(/Netto in tre anni/);
    expect(t).toMatch(/Conviene/);
  });
  it("senza configurazione l'invio è manuale", async () => {
    const e = await inviaRichiesta({ nome: "A", email: "a@b.it", telefono: "", messaggio: "", consenso: true }, risposteIniziali, m);
    expect(e.esito).toBe("manuale");
  });
  it("controllo dell'email", () => {
    expect(emailValida("nome@esempio.it")).toBe(true);
    expect(emailValida("nome@esempio")).toBe(false);
  });
});
