
REVOKE EXECUTE ON FUNCTION public.get_class_occupancy() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_class_occupancy() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_class_occupancy() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_class_occupancy() TO service_role;
