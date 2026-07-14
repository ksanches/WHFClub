
REVOKE EXECUTE ON FUNCTION public.get_class_occupancy() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.auto_rotate_lots() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.force_rotate_lot_on_schedule() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_class_occupancy() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.force_rotate_lot_on_schedule() TO service_role;
