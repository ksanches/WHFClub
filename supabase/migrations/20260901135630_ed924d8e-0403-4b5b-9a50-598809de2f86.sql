ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS capacity integer NOT NULL DEFAULT 15;

CREATE OR REPLACE FUNCTION public.get_registration_count()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(SUM(CASE WHEN r.ticket_type = 'dupla' THEN 2 ELSE 1 END), 0)::int
  FROM public.registrations r
  WHERE r.status = 'confirmado'
    AND r.ticket_batch = (
      SELECT l.label FROM public.lots l WHERE l.active = true ORDER BY l.sort_order ASC LIMIT 1
    )
$function$;

CREATE OR REPLACE FUNCTION public.get_event_capacity()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE((SELECT l.capacity FROM public.lots l WHERE l.active = true ORDER BY l.sort_order ASC LIMIT 1), 15)::int
$function$;

REVOKE ALL ON FUNCTION public.get_event_capacity() FROM public;
GRANT EXECUTE ON FUNCTION public.get_event_capacity() TO anon, authenticated, service_role;