
DROP POLICY IF EXISTS "Anyone can insert a registration" ON public.registrations;

CREATE POLICY "Public can submit registrations with required fields"
  ON public.registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(btrim(full_name)) between 2 and 120
    AND length(btrim(email)) between 5 and 160
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(btrim(cpf)) between 11 and 20
    AND length(btrim(phone)) between 10 and 20
  );
