CREATE TABLE public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hero_title text not null,
  hero_subtitle text,
  hero_quote text,
  hero_location_line text,
  manifesto text,
  date_label text not null,
  time_label text,
  venue_name text,
  venue_sub text,
  maps_url text,
  description text,
  lots_intro text,
  lots_note text,
  pix_copy_paste text,
  pix_key text,
  pix_beneficiary text,
  whatsapp_url text,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active events" ON public.events FOR SELECT USING (active = true);
CREATE POLICY "Admins can view all events" ON public.events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- only one active event at a time
CREATE OR REPLACE FUNCTION public.enforce_single_active_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.active THEN
    UPDATE public.events SET active = false WHERE id <> NEW.id AND active = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER events_single_active AFTER INSERT OR UPDATE OF active ON public.events FOR EACH ROW WHEN (NEW.active) EXECUTE FUNCTION public.enforce_single_active_event();

INSERT INTO public.events (name, hero_title, hero_subtitle, hero_quote, hero_location_line, manifesto, date_label, time_label, venue_name, venue_sub, maps_url, description, lots_intro, lots_note, pix_copy_paste, pix_key, pix_beneficiary, whatsapp_url, active)
VALUES (
  'Talk with WHF',
  E'Talk\nwith WHF.',
  'Uma noite de inglês & jantar',
  '"Treinar é o plano. Se divertir é a regra."',
  'Califórnia Food · Pinheiros · São Paulo',
  'Aqui ninguém precisa se provar pra pertencer.',
  '11 de Setembro',
  '18h30',
  'Califórnia Food',
  'Pinheiros, São Paulo',
  'https://www.google.com/maps/search/?api=1&query=Calif%C3%B3rnia+Food+Pinheiros,+S%C3%A3o+Paulo',
  'Uma noite para nos reunirmos e treinarmos o nosso inglês enquanto desfrutamos de um jantar delicioso com o Califórnia — que libera 25% de desconto em cada conta.',
  'Talk with WHF · 11 de setembro',
  E'Ingresso individual · pagamento via Pix.\nVagas limitadas.',
  '00020126510014BR.GOV.BCB.PIX0129whfclub.comercial@hotmail.com520400005303986540679.905802BR592535.952.024 EDUARDA BARCEL6009SAO PAULO62140510YNqHWGH9QR6304B30C',
  'whfclub.comercial@hotmail.com',
  '35.952.024 EDUARDA BARCELLOS CHAMBARELLI DE NOVAES',
  'https://wa.me/5511965008538',
  true
);