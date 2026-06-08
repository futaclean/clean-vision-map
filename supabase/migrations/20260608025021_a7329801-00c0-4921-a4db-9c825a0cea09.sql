
CREATE TABLE public.smart_bins (
  bin_id TEXT PRIMARY KEY,
  bin_name TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  fill_level DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'LOW',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.smart_bins TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.smart_bins TO authenticated;
GRANT ALL ON public.smart_bins TO service_role;

ALTER TABLE public.smart_bins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view smart bins"
  ON public.smart_bins FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage smart bins"
  ON public.smart_bins FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Hardware ingestion function (callable by anon)
CREATE OR REPLACE FUNCTION public.ingest_bin_reading(
  _bin_id TEXT,
  _latitude DOUBLE PRECISION,
  _longitude DOUBLE PRECISION,
  _fill_level DOUBLE PRECISION,
  _status TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _bin_id IS NULL OR length(_bin_id) = 0 OR length(_bin_id) > 64 THEN
    RAISE EXCEPTION 'invalid bin_id';
  END IF;
  IF _latitude < -90 OR _latitude > 90 OR _longitude < -180 OR _longitude > 180 THEN
    RAISE EXCEPTION 'invalid coordinates';
  END IF;
  IF _fill_level < 0 OR _fill_level > 100 THEN
    RAISE EXCEPTION 'invalid fill_level';
  END IF;
  IF _status NOT IN ('LOW','MEDIUM','HIGH','FULL') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;

  INSERT INTO public.smart_bins (bin_id, latitude, longitude, fill_level, status, last_updated)
  VALUES (_bin_id, _latitude, _longitude, _fill_level, _status, now())
  ON CONFLICT (bin_id) DO UPDATE
  SET latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      fill_level = EXCLUDED.fill_level,
      status = EXCLUDED.status,
      last_updated = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.ingest_bin_reading(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT) TO anon, authenticated, service_role;

ALTER PUBLICATION supabase_realtime ADD TABLE public.smart_bins;
