-- ==============================================================================
-- MIGRATION: ALLOW RE-SUBMISSION OF REJECTED/PENDING TOURNAMENT REGISTRATIONS
-- ==============================================================================

-- 1. Ensure RLS allows public updates on rejected or pending registrations
DROP POLICY IF EXISTS "Public update registrations" ON public.tournament_registrations;
CREATE POLICY "Public update registrations" ON public.tournament_registrations 
FOR UPDATE 
USING (status IN ('rejected', 'pending'))
WITH CHECK (status = 'pending');

-- 2. Ensure delete policy exists for admin or cleanup
DROP POLICY IF EXISTS "Public delete registrations" ON public.tournament_registrations;
CREATE POLICY "Public delete registrations" ON public.tournament_registrations
FOR DELETE USING (true);

-- 3. Stored Procedure (RPC) for guaranteed atomic re-submission
CREATE OR REPLACE FUNCTION public.resubmit_tournament_registration(
    p_tournament_id UUID,
    p_player_id TEXT,
    p_game_id TEXT,
    p_device_model TEXT,
    p_facebook_post_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing RECORD;
    v_result JSONB;
BEGIN
    SELECT * INTO v_existing
    FROM public.tournament_registrations
    WHERE tournament_id = p_tournament_id AND player_id = p_player_id
    LIMIT 1;

    -- If no existing registration, insert fresh
    IF v_existing.id IS NULL THEN
        INSERT INTO public.tournament_registrations (
            tournament_id, player_id, game_id, device_model, facebook_post_url, status
        ) VALUES (
            p_tournament_id, p_player_id, p_game_id, p_device_model, p_facebook_post_url, 'pending'
        )
        RETURNING to_jsonb(public.tournament_registrations.*) INTO v_result;
        RETURN v_result;
    END IF;

    -- If already approved, reject duplicate registration
    IF v_existing.status = 'approved' THEN
        RAISE EXCEPTION 'This player is already an approved contender in this tournament.';
    END IF;

    -- Update existing rejected or pending registration back to pending for review
    UPDATE public.tournament_registrations
    SET
        game_id = p_game_id,
        device_model = p_device_model,
        facebook_post_url = p_facebook_post_url,
        status = 'pending',
        rejection_reason = NULL,
        reviewed_at = NULL,
        reviewed_by = NULL,
        created_at = now()
    WHERE id = v_existing.id
    RETURNING to_jsonb(public.tournament_registrations.*) INTO v_result;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resubmit_tournament_registration(UUID, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
