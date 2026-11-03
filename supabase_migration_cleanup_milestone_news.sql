-- ==============================================================================
-- Migration: Automatic Cleanup for 90-Day Old Automated Milestone News
-- ==============================================================================
-- Purpose:
--   Automatically removes automated milestone news (Club Records) older than
--   90 days (approx. 3 months), while permanently preserving manual news
--   created by admins.
-- ==============================================================================

-- 1. Create the cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_milestone_news(days_threshold integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
  cutoff_date text;
  cutoff_timestamp timestamptz;
BEGIN
  -- Calculate cutoffs
  cutoff_date := TO_CHAR(CURRENT_DATE - (days_threshold || ' days')::interval, 'YYYY-MM-DD');
  cutoff_timestamp := CURRENT_TIMESTAMP - (days_threshold || ' days')::interval;

  -- Delete only automated milestone news older than cutoff
  DELETE FROM news
  WHERE (author = 'Club Records' OR category = 'Milestone')
    AND (
      (date IS NOT NULL AND date < cutoff_date)
      OR (date IS NULL AND created_at < cutoff_timestamp)
    );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grant execution to authenticated users (admin)
GRANT EXECUTE ON FUNCTION cleanup_old_milestone_news(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_milestone_news(integer) TO service_role;

-- 2. (Optional) Automated Scheduling with pg_cron:
-- If you have pg_cron enabled in your Supabase project (Project Settings -> Database -> Extensions):
-- You can run the following query in the Supabase SQL Editor to schedule a daily run at 3:00 AM UTC:
--
-- SELECT cron.schedule(
--   'cleanup-milestone-news-daily',
--   '0 3 * * *',
--   'SELECT cleanup_old_milestone_news(90)'
-- );
