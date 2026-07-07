
-- LOTS
CREATE TABLE public.lots (
  id text PRIMARY KEY,
  label text NOT NULL,
  total integer NOT NULL,
  individual_price_cents integer NOT NULL,
  dupla_price_cents integer NOT NULL,
  active boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.lots TO anon, authenticated;
GRANT ALL ON public.lots TO service_role;
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active lots" ON public.lots
  FOR SELECT TO anon, authenticated USING (active = true);

INSERT INTO public.lots (id, label, total, individual_price_cents, dupla_price_cents, active, sort_order) VALUES
  ('lote1', '1º Lote', 8, 18000, 15000, true, 1),
  ('lote2', '2º Lote', 14, 21000, 17000, false, 2),
  ('lote3', '3º Lote', 14, 25000, 19000, false, 3);

-- PAR-Q DA DUPLA
ALTER TABLE public.registrations
  ADD COLUMN partner_parq_q1 boolean,
  ADD COLUMN partner_parq_q2 boolean,
  ADD COLUMN partner_parq_q3 boolean,
  ADD COLUMN partner_parq_q4 boolean,
  ADD COLUMN partner_parq_q5 boolean,
  ADD COLUMN partner_parq_q6 boolean,
  ADD COLUMN partner_parq_q7 boolean,
  ADD COLUMN partner_parq_notes text;

-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ADMIN POLICIES on registrations & lots
CREATE POLICY "Admins can view all registrations" ON public.registrations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all lots" ON public.lots
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update lots" ON public.lots
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger for lots
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_lots_updated_at
  BEFORE UPDATE ON public.lots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
