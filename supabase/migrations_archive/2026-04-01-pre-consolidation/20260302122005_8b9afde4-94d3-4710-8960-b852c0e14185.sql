
CREATE TABLE public.usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read usage_logs" ON public.usage_logs
  FOR SELECT USING (true);

CREATE POLICY "Public insert usage_logs" ON public.usage_logs
  FOR INSERT WITH CHECK (true);
