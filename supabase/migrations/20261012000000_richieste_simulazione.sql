-- Le richieste di contatto lasciate dal simulatore.
-- Il simulatore scrive con la chiave pubblica (anon): può solo inserire,
-- mai leggere. Le righe le legge lo studio, dal pannello o dal CRM.

create table if not exists public.richieste_simulazione (
  id uuid primary key default gen_random_uuid(),
  creata_il timestamptz not null default now(),
  nome text not null check (char_length(nome) between 1 and 200),
  email text not null check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  telefono text check (telefono is null or char_length(telefono) <= 40),
  messaggio text check (messaggio is null or char_length(messaggio) <= 2000),
  consenso_privacy boolean not null,
  riepilogo text,
  risposte jsonb,
  risultato jsonb,
  gestita boolean not null default false
);

alter table public.richieste_simulazione enable row level security;

drop policy if exists "inserimento dal simulatore" on public.richieste_simulazione;
create policy "inserimento dal simulatore"
  on public.richieste_simulazione
  for insert
  to anon
  with check (consenso_privacy = true and gestita = false);

grant insert on public.richieste_simulazione to anon;
revoke select, update, delete on public.richieste_simulazione from anon;
