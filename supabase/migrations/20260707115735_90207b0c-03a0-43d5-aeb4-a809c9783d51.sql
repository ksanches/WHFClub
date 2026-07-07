
CREATE TABLE public.registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  cpf text not null,
  email text not null,
  phone text not null,
  address text not null,
  accept_messages boolean not null default false,
  ticket_batch text not null,
  ticket_type text not null,
  ticket_price_cents integer not null,
  class_time text not null,
  partner_full_name text,
  partner_cpf text,
  partner_email text,
  partner_phone text,
  parq_q1 boolean not null,
  parq_q2 boolean not null,
  parq_q3 boolean not null,
  parq_q4 boolean not null,
  parq_q5 boolean not null,
  parq_q6 boolean not null,
  parq_q7 boolean not null,
  parq_notes text,
  event_suggestions text,
  payment_url text
);

GRANT INSERT ON public.registrations TO anon, authenticated;
GRANT ALL ON public.registrations TO service_role;

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert a registration"
  ON public.registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
