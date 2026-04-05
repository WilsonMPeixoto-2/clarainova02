ALTER TABLE public.query_analytics
  ADD COLUMN IF NOT EXISTS user_feedback_value TEXT,
  ADD COLUMN IF NOT EXISTS user_feedback_reason TEXT,
  ADD COLUMN IF NOT EXISTS user_feedback_comment TEXT,
  ADD COLUMN IF NOT EXISTS user_feedback_source TEXT,
  ADD COLUMN IF NOT EXISTS user_feedback_submitted_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'query_analytics_user_feedback_value_check'
  ) THEN
    ALTER TABLE public.query_analytics
      ADD CONSTRAINT query_analytics_user_feedback_value_check
      CHECK (
        user_feedback_value IS NULL
        OR user_feedback_value IN ('helpful', 'not_helpful')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS query_analytics_feedback_submitted_at_idx
  ON public.query_analytics (user_feedback_submitted_at DESC);
