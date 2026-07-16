
CREATE POLICY "Public can read payment-assets"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'payment-assets');

CREATE POLICY "Admins can upload payment-assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'payment-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payment-assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'payment-assets' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'payment-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete payment-assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'payment-assets' AND public.has_role(auth.uid(), 'admin'));
