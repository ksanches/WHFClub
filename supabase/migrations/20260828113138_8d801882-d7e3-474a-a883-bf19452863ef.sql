CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.waitlist TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waitlist TO authenticated;
GRANT ALL ON public.waitlist TO service_role;

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can join waitlist" ON public.waitlist
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(full_name)) >= 2 AND length(btrim(full_name)) <= 120
  AND length(btrim(email)) >= 5 AND length(btrim(email)) <= 160
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(btrim(phone)) >= 10 AND length(btrim(phone)) <= 20
);

CREATE POLICY "Admins can view waitlist" ON public.waitlist
FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update waitlist" ON public.waitlist
FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete waitlist" ON public.waitlist
FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON public.waitlist
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_registration_count()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(CASE WHEN ticket_type = 'dupla' THEN 2 ELSE 1 END), 0)::int
  FROM public.registrations
  WHERE status <> 'cancelado'
$$;

REVOKE ALL ON FUNCTION public.get_registration_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_registration_count() TO service_role;