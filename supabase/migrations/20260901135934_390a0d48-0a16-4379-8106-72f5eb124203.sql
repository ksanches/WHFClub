ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE CASCADE;

CREATE POLICY "Admins can insert lots" ON public.lots FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete lots" ON public.lots FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lots TO authenticated;
GRANT SELECT ON public.lots TO anon;
GRANT ALL ON public.lots TO service_role;