REVOKE EXECUTE ON FUNCTION public.get_registration_count() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_class_occupancy() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.force_rotate_lot_on_schedule() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_registration_count() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_class_occupancy() TO service_role;
GRANT EXECUTE ON FUNCTION public.force_rotate_lot_on_schedule() TO service_role;