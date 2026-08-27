ALTER TABLE public.registrations ALTER COLUMN address DROP NOT NULL;

DROP POLICY IF EXISTS "Public can submit registrations with required fields" ON public.registrations;

CREATE POLICY "Public can submit registrations with required fields"
ON public.registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (length(btrim(full_name)) >= 2 AND length(btrim(full_name)) <= 120)
  AND (length(btrim(email)) >= 5 AND length(btrim(email)) <= 160)
  AND (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
  AND (length(btrim(cpf)) >= 11 AND length(btrim(cpf)) <= 20)
  AND (length(btrim(phone)) >= 10 AND length(btrim(phone)) <= 20)
);