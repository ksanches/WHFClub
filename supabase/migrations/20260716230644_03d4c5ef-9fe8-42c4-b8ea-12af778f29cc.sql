
-- Add per-lot payment fields (card URLs + QR code URLs)
ALTER TABLE public.lots
  ADD COLUMN IF NOT EXISTS card_url_individual TEXT,
  ADD COLUMN IF NOT EXISTS card_url_dupla TEXT,
  ADD COLUMN IF NOT EXISTS pix_qr_individual_url TEXT,
  ADD COLUMN IF NOT EXISTS pix_qr_dupla_url TEXT;

-- Coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  individual_price_cents INTEGER,
  dupla_price_cents INTEGER,
  card_url_individual TEXT,
  card_url_dupla TEXT,
  pix_qr_individual_url TEXT,
  pix_qr_dupla_url TEXT,
  auto_confirm BOOLEAN NOT NULL DEFAULT false,
  valid_for TEXT NOT NULL DEFAULT 'both' CHECK (valid_for IN ('individual','dupla','both')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active coupons"
  ON public.coupons FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "Admins can view all coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert coupons"
  ON public.coupons FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update coupons"
  ON public.coupons FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete coupons"
  ON public.coupons FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the two current hardcoded coupons so nothing regresses
INSERT INTO public.coupons (code, description, individual_price_cents, dupla_price_cents, auto_confirm, valid_for, active)
VALUES
  ('WHFVIP', 'Preço promocional do Lote 1', 18000, 30000, false, 'both', true),
  ('INFLUWHF', 'Cortesia individual — inscrição confirmada automaticamente', 0, NULL, true, 'individual', true)
ON CONFLICT (code) DO NOTHING;

-- Seed current lot payment URLs so admin can edit from a real starting point
UPDATE public.lots SET
  card_url_individual = 'https://link.infinitepay.io/laizza-amanda/VC1D-Q1YFRZjgS3-180,00',
  card_url_dupla = 'https://link.infinitepay.io/laizza-amanda/VC1D-oUopqjjEBe-300,00'
WHERE id = 'lote1';

UPDATE public.lots SET
  card_url_individual = 'https://link.infinitepay.io/laizza-amanda/VC1D-4MpzTmn3ZF-200,00',
  card_url_dupla = 'https://link.infinitepay.io/laizza-amanda/VC1D-97SfzzpP8i-320,00'
WHERE id = 'lote2';
