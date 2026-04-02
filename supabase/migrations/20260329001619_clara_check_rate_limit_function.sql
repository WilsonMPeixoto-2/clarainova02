-- check_rate_limit function — used by chat Edge Function for IP-based rate limiting
-- Runs as SECURITY DEFINER so it can INSERT/DELETE on rate_limits regardless of caller's role

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_max_requests integer DEFAULT 15,
  p_window_minutes integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  request_count integer;
BEGIN
  -- Clean expired entries for this identifier
  DELETE FROM public.rate_limits
  WHERE identifier = p_identifier
    AND created_at < now() - (p_window_minutes || ' minutes')::interval;

  -- Count recent requests within window
  SELECT count(*) INTO request_count
  FROM public.rate_limits
  WHERE identifier = p_identifier
    AND created_at > now() - (p_window_minutes || ' minutes')::interval;

  -- If under limit, record request and allow
  IF request_count < p_max_requests THEN
    INSERT INTO public.rate_limits (identifier) VALUES (p_identifier);
    RETURN true;
  END IF;

  RETURN false;
END;
$function$;
