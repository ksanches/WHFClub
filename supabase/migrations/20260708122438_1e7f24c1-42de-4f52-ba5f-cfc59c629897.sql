ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_method text;

-- Atualiza registros antigos que ainda não têm payment_method preenchido,
-- inferindo a partir do campo payment_url existente.
UPDATE public.registrations
SET payment_method = CASE
  WHEN payment_url = 'pix' THEN 'pix'
  WHEN payment_url IS NOT NULL AND payment_url <> 'pix' THEN 'cartao'
  ELSE NULL
END
WHERE payment_method IS NULL;