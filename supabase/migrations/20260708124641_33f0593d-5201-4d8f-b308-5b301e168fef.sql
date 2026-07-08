
CREATE OR REPLACE FUNCTION public.auto_rotate_lots()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_lot RECORD;
  sold INT;
  next_lot_id TEXT;
BEGIN
  SELECT * INTO current_lot FROM public.lots WHERE label = NEW.ticket_batch LIMIT 1;
  IF current_lot IS NULL OR NOT current_lot.active THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(CASE WHEN ticket_type = 'dupla' THEN 2 ELSE 1 END), 0)
    INTO sold
  FROM public.registrations
  WHERE ticket_batch = current_lot.label
    AND status <> 'cancelado';

  IF sold >= current_lot.total THEN
    UPDATE public.lots SET active = false WHERE id = current_lot.id;

    SELECT id INTO next_lot_id
    FROM public.lots
    WHERE sort_order > current_lot.sort_order
    ORDER BY sort_order ASC
    LIMIT 1;

    IF next_lot_id IS NOT NULL THEN
      UPDATE public.lots SET active = true WHERE id = next_lot_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_rotate_lots_ins ON public.registrations;
CREATE TRIGGER trg_auto_rotate_lots_ins
AFTER INSERT ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.auto_rotate_lots();

DROP TRIGGER IF EXISTS trg_auto_rotate_lots_upd ON public.registrations;
CREATE TRIGGER trg_auto_rotate_lots_upd
AFTER UPDATE OF status, ticket_type, ticket_batch ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.auto_rotate_lots();
