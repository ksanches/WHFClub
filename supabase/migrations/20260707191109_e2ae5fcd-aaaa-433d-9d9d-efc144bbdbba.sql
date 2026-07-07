
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_status') THEN
    CREATE TYPE public.registration_status AS ENUM ('pendente', 'confirmado', 'cancelado', 'reembolsado');
  END IF;
END $$;

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS status public.registration_status NOT NULL DEFAULT 'pendente';

CREATE INDEX IF NOT EXISTS registrations_status_idx ON public.registrations(status);
