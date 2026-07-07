
CREATE OR REPLACE FUNCTION public.get_class_occupancy()
RETURNS TABLE(class_time text, participants integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    class_time,
    SUM(CASE WHEN ticket_type = 'dupla' THEN 2 ELSE 1 END)::int AS participants
  FROM public.registrations
  WHERE status <> 'cancelado'
  GROUP BY class_time
$$;

REVOKE EXECUTE ON FUNCTION public.get_class_occupancy() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_class_occupancy() TO anon, authenticated;
