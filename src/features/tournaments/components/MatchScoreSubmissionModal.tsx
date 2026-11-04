import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TournamentMatch, TournamentMatchStats } from '../types';
import { runEFootballOcr, ExtractedEFootballStats } from '../utils/efootballOcr';
import { X, Upload, CheckCircle2, AlertTriangle, ShieldAlert, Swords, Sparkles, Lock } from 'lucide-react';

interface MatchScoreSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: TournamentMatch;
  onSubmitted?: () => void;
}

export const MatchScoreSubmissionModal: React.FC<MatchScoreSubmissionModalProps> = ({
  isOpen,
  onClose,
  match,
  onSubmitted
}) => {
  const [mode, setMode] = useState<'score' | 'auto_win'>('score');
  const [submittingPlayerId, setSubmittingPlayerId] = useState<string>(match.player1_id || '');
  
  // Score mode state
  const [p1Score, setP1Score] = useState<number | ''>('');
  const [p2Score, setP2Score] = useState<number | ''>('');
  const [declaredWinner, setDeclaredWinner] = useState<'p1' | 'p2' | 'draw'>('p1');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Extended Match Stats (OCR Extracted & Editable)
  const [stats, setStats] = useState<TournamentMatchStats>({});
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const [ocrExtracted, setOcrExtracted] = useState<boolean>(false);
  const [rawOcrData, setRawOcrData] = useState<ExtractedEFootballStats | null>(null);

  // Aligns extracted screenshot data to the user-declared winner
  const alignScoresAndStats = (extracted: ExtractedEFootballStats, winner: 'p1' | 'p2' | 'draw') => {
    if (extracted.p1Score === undefined || extracted.p2Score === undefined) return;

    const raw1 = extracted.p1Score; // Left side in screenshot
    const raw2 = extracted.p2Score; // Right side in screenshot

    // Screenshot winning side:
    let screenshotWinnerSide: 'left' | 'right' | 'draw' = 'draw';
    if (raw1 > raw2) screenshotWinnerSide = 'left';
    else if (raw2 > raw1) screenshotWinnerSide = 'right';

    // If user says P1 won and screenshot winner was right side -> swap so P1 gets right side
    // If user says P2 won and screenshot winner was left side -> swap so P2 gets left side
    const shouldSwap = (winner === 'p1' && screenshotWinnerSide === 'right') ||
                       (winner === 'p2' && screenshotWinnerSide === 'left');

    setP1Score(shouldSwap ? raw2 : raw1);
    setP2Score(shouldSwap ? raw1 : raw2);

    setStats({
      possession_p1: shouldSwap ? extracted.possession_p2 : extracted.possession_p1,
      possession_p2: shouldSwap ? extracted.possession_p1 : extracted.possession_p2,
      shots_p1: shouldSwap ? extracted.shots_p2 : extracted.shots_p1,
      shots_p2: shouldSwap ? extracted.shots_p1 : extracted.shots_p2,
      shots_on_target_p1: shouldSwap ? extracted.shots_on_target_p2 : extracted.shots_on_target_p1,
      shots_on_target_p2: shouldSwap ? extracted.shots_on_target_p1 : extracted.shots_on_target_p2,
      passes_p1: shouldSwap ? extracted.passes_p2 : extracted.passes_p1,
      passes_p2: shouldSwap ? extracted.passes_p1 : extracted.passes_p2,
      successful_passes_p1: shouldSwap ? extracted.successful_passes_p2 : extracted.successful_passes_p1,
      successful_passes_p2: shouldSwap ? extracted.successful_passes_p1 : extracted.successful_passes_p2,
      saves_p1: shouldSwap ? extracted.saves_p2 : extracted.saves_p1,
      saves_p2: shouldSwap ? extracted.saves_p1 : extracted.saves_p2,
      tackles_p1: shouldSwap ? extracted.tackles_p2 : extracted.tackles_p1,
      tackles_p2: shouldSwap ? extracted.tackles_p1 : extracted.tackles_p2,
      fouls_p1: shouldSwap ? extracted.fouls_p2 : extracted.fouls_p1,
      fouls_p2: shouldSwap ? extracted.fouls_p1 : extracted.fouls_p2,
    });
  };

  // Auto-win mode state
  const [claimReason, setClaimReason] = useState('');
  const [proofUrl, setProofUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Handle Image Upload & OCR
  const handleFileUpload = async (file: File, isAutoWinProof: boolean = false) => {
    try {
      setUploadingImage(true);
      setError(null);

      // 1. Upload to Supabase Storage
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `tournaments/match_${match.id}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file, { contentType: file.type || 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      if (isAutoWinProof) {
        setProofUrl(publicUrl);
        setUploadingImage(false);
      } else {
        setScreenshotUrl(publicUrl);
        setUploadingImage(false);

        // 2. Trigger Client-Side eFootball OCR Extraction
        try {
          setOcrProgress(1);
          const extracted: ExtractedEFootballStats = await runEFootballOcr(file, (p) => {
            setOcrProgress(p);
          });

          setRawOcrData(extracted);
          alignScoresAndStats(extracted, declaredWinner);

          if (extracted.p1Score !== undefined && extracted.p2Score !== undefined) {
            setOcrExtracted(true);
          }
        } catch (ocrErr) {
          console.warn('OCR extraction warning:', ocrErr);
        } finally {
          setOcrProgress(null);
        }
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setError('Image upload failed. Please try again.');
      setUploadingImage(false);
      setOcrProgress(null);
    }
  };

  // Submit Match Score
  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (p1Score === '' || p2Score === '') {
      setError('Please enter scores for both players.');
      return;
    }
    if (!screenshotUrl) {
      setError('Please upload the match scoreboard screenshot.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const s1 = Number(p1Score);
      const s2 = Number(p2Score);

      // 1. Insert into tournament_submissions
      const { error: subErr } = await supabase
        .from('tournament_submissions')
        .insert({
          match_id: match.id,
          submitted_by_player_id: submittingPlayerId,
          submission_type: 'score',
          proposed_p1_score: s1,
          proposed_p2_score: s2,
          screenshot_url: screenshotUrl,
          ocr_extracted_data: stats as any,
          status: 'pending'
        });

      if (subErr) throw subErr;

      // 2. Check for existing submissions from opponent
      const opponentId = submittingPlayerId === match.player1_id ? match.player2_id : match.player1_id;
      const { data: existingSubs } = await supabase
        .from('tournament_submissions')
        .select('*')
        .eq('match_id', match.id)
        .eq('submitted_by_player_id', opponentId || '')
        .eq('submission_type', 'score');

      if (existingSubs && existingSubs.length > 0) {
        const oppSub = existingSubs[0];
        // If scores match exactly -> Auto-Complete match!
        if (oppSub.proposed_p1_score === s1 && oppSub.proposed_p2_score === s2) {
          const winnerId = s1 > s2 ? match.player1_id : s2 > s1 ? match.player2_id : null;

          await supabase
            .from('tournament_matches')
            .update({
              player1_score: s1,
              player2_score: s2,
              winner_id: winnerId,
              status: 'completed',
              screenshot_url: screenshotUrl,
              match_stats: stats as any
            })
            .eq('id', match.id);
        } else {
          // Conflicting scores -> Flag as Disputed
          await supabase
            .from('tournament_matches')
            .update({ status: 'disputed' })
            .eq('id', match.id);
        }
      } else {
        // First submission -> Pending approval
        await supabase
          .from('tournament_matches')
          .update({
            player1_score: s1,
            player2_score: s2,
            status: 'pending_approval',
            screenshot_url: screenshotUrl,
            match_stats: stats as any
          })
          .eq('id', match.id);
      }

      setSuccess(true);
      if (onSubmitted) onSubmitted();
    } catch (err: any) {
      console.error('Submission failed:', err);
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  // Submit Auto-Win Claim
  const handleAutoWinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimReason.trim()) {
      setError('Please provide a reason / explanation for the walkover claim.');
      return;
    }
    if (!proofUrl) {
      setError('Please upload chat screenshot proof showing opponent was called and did not respond.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await supabase
        .from('tournament_submissions')
        .insert({
          match_id: match.id,
          submitted_by_player_id: submittingPlayerId,
          submission_type: 'auto_win_claim',
          claim_reason: claimReason.trim(),
          screenshot_url: proofUrl,
          status: 'pending'
        });

      await supabase
        .from('tournament_matches')
        .update({
          status: 'disputed',
          auto_win_reason: claimReason.trim(),
          auto_win_proof_url: proofUrl
        })
        .eq('id', match.id);

      setSuccess(true);
      if (onSubmitted) onSubmitted();
    } catch (err: any) {
      console.error('Claim failed:', err);
      setError(err.message || 'Claim submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#001738] border border-[#c89850]/30 rounded-3xl shadow-2xl p-6 sm:p-8 text-white my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">Submission Received!</h3>
            <p className="text-white/70 text-xs mt-2 max-w-sm mx-auto">
              {mode === 'score'
                ? 'Your match score and screenshot have been recorded. Once verified or matched with opponent, the group standings will update!'
                : 'Your Auto-Win walkover claim has been submitted to the admin dispute panel with your chat proof.'}
            </p>
            <button
              onClick={onClose}
              className="mt-6 py-2 px-6 rounded-xl bg-[#c89850] text-[#00265a] font-bold text-xs uppercase tracking-wider hover:bg-[#b58641] transition"
            >
              Close
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#c89850] uppercase tracking-wider font-mono">
                Matchday {match.matchday}
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mb-4">
              Match Result Submission
            </h2>

            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-black/30 p-1 rounded-xl mb-5 border border-white/5">
              <button
                type="button"
                onClick={() => { setMode('score'); setError(null); }}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs transition ${
                  mode === 'score'
                    ? 'bg-[#c89850] text-[#00265a] shadow'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                Submit Score
              </button>

              <button
                type="button"
                onClick={() => { setMode('auto_win'); setError(null); }}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs transition ${
                  mode === 'auto_win'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Claim Auto-Win
              </button>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submitter Player Selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Submitting As *
              </label>
              <select
                value={submittingPlayerId}
                onChange={(e) => setSubmittingPlayerId(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-[#c89850]"
              >
                {match.player1 && (
                  <option value={match.player1_id!} className="bg-[#001738]">
                    {match.player1.name} (Player 1)
                  </option>
                )}
                {match.player2 && (
                  <option value={match.player2_id!} className="bg-[#001738]">
                    {match.player2.name} (Player 2)
                  </option>
                )}
              </select>
            </div>

            {/* ─── MODE A: SCORE SUBMISSION WITH OCR ─── */}
            {mode === 'score' && (
              <form onSubmit={handleScoreSubmit} className="space-y-4">
                {/* Scoreboard Screenshot Upload */}
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5 flex items-center justify-between">
                    <span>Scoreboard Screenshot *</span>
                    <span className="text-[11px] text-[#c89850] flex items-center gap-1 font-mono">
                      <Sparkles className="w-3 h-3" />
                      Auto-extracts Score & Stats
                    </span>
                  </label>
                  <div className="relative border-2 border-dashed border-white/15 rounded-2xl p-4 text-center hover:border-[#c89850]/50 transition bg-black/20">
                    {screenshotUrl ? (
                      <div className="relative">
                        <img src={screenshotUrl} alt="Screenshot" className="max-h-36 mx-auto rounded-lg object-contain" />
                        <button
                          type="button"
                          onClick={() => {
                            setScreenshotUrl('');
                            setOcrExtracted(false);
                          }}
                          className="mt-2 text-xs text-rose-400 hover:underline"
                        >
                          Change Screenshot
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <Upload className="w-7 h-7 text-[#c89850] mx-auto mb-1.5" />
                        <span className="text-xs font-bold text-white/80 block">
                          {uploadingImage
                            ? 'Uploading Screenshot...'
                            : ocrProgress !== null
                            ? `AI OCR Scanning eFootball Stats... ${ocrProgress}%`
                            : 'Click to Upload eFootball Score Screenshot'}
                        </span>
                        <span className="text-[10px] text-white/40 block mt-0.5">PNG, JPG up to 10MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUpload(f, false);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* 1. Select Winner for Direct Auto-Mapping */}
                <div className="bg-black/20 p-3.5 rounded-2xl border border-white/5">
                  <label className="block text-xs font-semibold text-white/70 mb-2">
                    Who Won This Match? (Auto-maps screenshot winning stats) *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDeclaredWinner('p1');
                        if (rawOcrData) {
                          alignScoresAndStats(rawOcrData, 'p1');
                        } else if (typeof p1Score === 'number' && typeof p2Score === 'number') {
                          const high = Math.max(p1Score, p2Score);
                          const low = Math.min(p1Score, p2Score);
                          setP1Score(high);
                          setP2Score(low);
                        }
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition truncate ${
                        declaredWinner === 'p1' ? 'bg-[#c89850] text-[#00265a] border-[#c89850] shadow' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      🏆 {match.player1?.name || 'Player 1'} Won
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeclaredWinner('p2');
                        if (rawOcrData) {
                          alignScoresAndStats(rawOcrData, 'p2');
                        } else if (typeof p1Score === 'number' && typeof p2Score === 'number') {
                          const high = Math.max(p1Score, p2Score);
                          const low = Math.min(p1Score, p2Score);
                          setP1Score(low);
                          setP2Score(high);
                        }
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition truncate ${
                        declaredWinner === 'p2' ? 'bg-[#c89850] text-[#00265a] border-[#c89850] shadow' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      🏆 {match.player2?.name || 'Player 2'} Won
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeclaredWinner('draw');
                        if (rawOcrData) {
                          alignScoresAndStats(rawOcrData, 'draw');
                        }
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                        declaredWinner === 'draw' ? 'bg-[#c89850] text-[#00265a] border-[#c89850] shadow' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      Draw
                    </button>
                  </div>
                </div>

                {/* OCR Success / Status Banner */}
                {ocrExtracted ? (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      OCR Verified & Locked (Anti-Cheat Active)
                    </span>
                    <span className="text-[11px] text-emerald-400/80 font-mono">
                      Editing Disabled
                    </span>
                  </div>
                ) : screenshotUrl && !uploadingImage && ocrProgress === null ? (
                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>OCR could not detect scores automatically. Manual entry enabled (Admin will verify screenshot proof).</span>
                  </div>
                ) : null}

                {/* Final Score Inputs mapped directly to each player */}
                <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <label className="block text-[11px] font-bold text-white/60 truncate">
                        {match.player1?.name || 'Player 1'}
                      </label>
                      {ocrExtracted && (
                        <span title="Locked by OCR">
                          <Lock className="w-3 h-3 text-emerald-400" />
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      required
                      readOnly={ocrExtracted}
                      placeholder="0"
                      value={p1Score}
                      onChange={(e) => !ocrExtracted && setP1Score(e.target.value === '' ? '' : Number(e.target.value))}
                      className={`w-20 py-2 text-center text-2xl font-black rounded-xl border focus:outline-none transition ${
                        ocrExtracted
                          ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400 cursor-not-allowed shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                          : 'bg-black/40 border-white/10 text-[#c89850] focus:border-[#c89850]'
                      }`}
                    />
                    {typeof p1Score === 'number' && typeof p2Score === 'number' && p1Score > p2Score && (
                      <span className="block text-[10px] uppercase font-black text-[#c89850] mt-1 font-mono">
                        🏆 Winner
                      </span>
                    )}
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <label className="block text-[11px] font-bold text-white/60 truncate">
                        {match.player2?.name || 'Player 2'}
                      </label>
                      {ocrExtracted && (
                        <span title="Locked by OCR">
                          <Lock className="w-3 h-3 text-emerald-400" />
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      required
                      readOnly={ocrExtracted}
                      placeholder="0"
                      value={p2Score}
                      onChange={(e) => !ocrExtracted && setP2Score(e.target.value === '' ? '' : Number(e.target.value))}
                      className={`w-20 py-2 text-center text-2xl font-black rounded-xl border focus:outline-none transition ${
                        ocrExtracted
                          ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400 cursor-not-allowed shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                          : 'bg-black/40 border-white/10 text-[#c89850] focus:border-[#c89850]'
                      }`}
                    />
                    {typeof p1Score === 'number' && typeof p2Score === 'number' && p2Score > p1Score && (
                      <span className="block text-[10px] uppercase font-black text-[#c89850] mt-1 font-mono">
                        🏆 Winner
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Stats Fields (Possession, Shots, Passes, Saves) */}
                <div className="space-y-2 bg-black/30 p-3 rounded-2xl border border-white/5 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-white/40">
                      Match Details (Shots, Passes, Saves)
                    </span>
                    {ocrExtracted && (
                      <span className="text-[10px] text-emerald-400/80 font-mono flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        Locked
                      </span>
                    )}
                  </div>

                  {/* Possession */}
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="number"
                      placeholder="%"
                      readOnly={ocrExtracted}
                      value={stats.possession_p1 ?? ''}
                      onChange={(e) => !ocrExtracted && setStats(prev => ({ ...prev, possession_p1: Number(e.target.value) }))}
                      className={`w-14 py-1 text-center border rounded-lg font-mono text-xs ${
                        ocrExtracted ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white'
                      }`}
                    />
                    <span className="text-white/60 font-semibold text-[11px]">Possession %</span>
                    <input
                      type="number"
                      placeholder="%"
                      readOnly={ocrExtracted}
                      value={stats.possession_p2 ?? ''}
                      onChange={(e) => !ocrExtracted && setStats(prev => ({ ...prev, possession_p2: Number(e.target.value) }))}
                      className={`w-14 py-1 text-center border rounded-lg font-mono text-xs ${
                        ocrExtracted ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white'
                      }`}
                    />
                  </div>

                  {/* Total Shots */}
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="number"
                      placeholder="0"
                      readOnly={ocrExtracted}
                      value={stats.shots_p1 ?? ''}
                      onChange={(e) => !ocrExtracted && setStats(prev => ({ ...prev, shots_p1: Number(e.target.value) }))}
                      className={`w-14 py-1 text-center border rounded-lg font-mono text-xs ${
                        ocrExtracted ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white'
                      }`}
                    />
                    <span className="text-white/60 font-semibold text-[11px]">Total Shots</span>
                    <input
                      type="number"
                      placeholder="0"
                      readOnly={ocrExtracted}
                      value={stats.shots_p2 ?? ''}
                      onChange={(e) => !ocrExtracted && setStats(prev => ({ ...prev, shots_p2: Number(e.target.value) }))}
                      className={`w-14 py-1 text-center border rounded-lg font-mono text-xs ${
                        ocrExtracted ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white'
                      }`}
                    />
                  </div>

                  {/* Shots on Target */}
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="number"
                      placeholder="0"
                      readOnly={ocrExtracted}
                      value={stats.shots_on_target_p1 ?? ''}
                      onChange={(e) => !ocrExtracted && setStats(prev => ({ ...prev, shots_on_target_p1: Number(e.target.value) }))}
                      className={`w-14 py-1 text-center border rounded-lg font-mono text-xs ${
                        ocrExtracted ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white'
                      }`}
                    />
                    <span className="text-white/60 font-semibold text-[11px]">Shots on Target</span>
                    <input
                      type="number"
                      placeholder="0"
                      readOnly={ocrExtracted}
                      value={stats.shots_on_target_p2 ?? ''}
                      onChange={(e) => !ocrExtracted && setStats(prev => ({ ...prev, shots_on_target_p2: Number(e.target.value) }))}
                      className={`w-14 py-1 text-center border rounded-lg font-mono text-xs ${
                        ocrExtracted ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white'
                      }`}
                    />
                  </div>

                  {/* Saves */}
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="number"
                      placeholder="0"
                      readOnly={ocrExtracted}
                      value={stats.saves_p1 ?? ''}
                      onChange={(e) => !ocrExtracted && setStats(prev => ({ ...prev, saves_p1: Number(e.target.value) }))}
                      className={`w-14 py-1 text-center border rounded-lg font-mono text-xs ${
                        ocrExtracted ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white'
                      }`}
                    />
                    <span className="text-white/60 font-semibold text-[11px]">Goalkeeper Saves</span>
                    <input
                      type="number"
                      placeholder="0"
                      readOnly={ocrExtracted}
                      value={stats.saves_p2 ?? ''}
                      onChange={(e) => !ocrExtracted && setStats(prev => ({ ...prev, saves_p2: Number(e.target.value) }))}
                      className={`w-14 py-1 text-center border rounded-lg font-mono text-xs ${
                        ocrExtracted ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || uploadingImage || ocrProgress !== null}
                  className="w-full py-3 px-4 rounded-xl bg-[#c89850] hover:bg-[#b58641] text-[#00265a] font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Submitting Result...' : 'Confirm & Submit Result'}
                </button>
              </form>
            )}

            {/* ─── MODE B: CLAIM AUTO-WIN (WALKOVER) ─── */}
            {mode === 'auto_win' && (
              <form onSubmit={handleAutoWinSubmit} className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                  ⚠️ Auto-Win grants you 3 tournament points if approved by admin, but no fake goals or stats will be credited to player profiles.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">
                    Reason / Explanation *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Opponent did not respond to messages on Messenger for 24 hours before the match deadline."
                    value={claimReason}
                    onChange={(e) => setClaimReason(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">
                    Chat Screenshot Proof *
                  </label>
                  <div className="relative border-2 border-dashed border-white/15 rounded-2xl p-4 text-center hover:border-rose-500/50 transition bg-black/20">
                    {proofUrl ? (
                      <div className="relative">
                        <img src={proofUrl} alt="Chat Proof" className="max-h-40 mx-auto rounded-lg object-contain" />
                        <button
                          type="button"
                          onClick={() => setProofUrl('')}
                          className="mt-2 text-xs text-rose-400 hover:underline"
                        >
                          Remove Proof
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <Upload className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                        <span className="text-xs font-bold text-white/80 block">
                          {uploadingImage ? 'Uploading Proof...' : 'Upload Messenger/WhatsApp Chat Proof'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUpload(f, true);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || uploadingImage}
                  className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Submitting Claim...' : 'Submit Auto-Win Claim for Review'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
