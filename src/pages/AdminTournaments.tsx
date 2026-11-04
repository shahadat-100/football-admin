import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tournament, TournamentRegistration, TournamentMatch, TournamentSubmission } from '@/features/tournaments/types';
import { calculateTournamentTimeline, partitionIntoEqualGroups, generateGroupFixtures, getMatchdaysForGroupSize } from '@/features/tournaments/utils/tournamentEngine';
import { 
  Trophy, Plus, CheckCircle, XCircle, 
  ExternalLink, Play, ShieldAlert, Image as ImageIcon
} from 'lucide-react';

export function AdminTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [submissions, setSubmissions] = useState<TournamentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'registrations' | 'disputes' | 'matches'>('registrations');

  // Manual Score Resolution State
  const [resolveScores, setResolveScores] = useState<Record<string, { s1: number; s2: number }>>({});

  // New Tournament Form State
  const [title, setTitle] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [intervalDays, setIntervalDays] = useState(2);
  const [graceHours] = useState(24);
  const [groupSize, setGroupSize] = useState(6);
  const [creating, setCreating] = useState(false);

  // Load Tournaments
  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
      if (data && data.length > 0 && !selectedTournament) {
        setSelectedTournament(data[0]);
      }
    } catch (err) {
      console.error('Error fetching tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Tournament Data
  const fetchTournamentData = async (tournamentId: string) => {
    try {
      const [regRes, matchRes, subRes] = await Promise.all([
        supabase.from('tournament_registrations').select('*, player:players(*)').eq('tournament_id', tournamentId).order('created_at', { ascending: false }),
        supabase.from('tournament_matches').select('*, player1:players!player1_id(*), player2:players!player2_id(*)').eq('tournament_id', tournamentId).order('matchday', { ascending: true }),
        supabase.from('tournament_submissions').select('*').order('created_at', { ascending: false })
      ]);

      setRegistrations(regRes.data || []);
      setMatches(matchRes.data || []);
      setSubmissions(subRes.data || []);
    } catch (err) {
      console.error('Error fetching tournament details:', err);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchTournamentData(selectedTournament.id);
    }
  }, [selectedTournament]);

  // Create Tournament Handler
  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !registrationDeadline) return;

    try {
      setCreating(true);
      const regDate = new Date(registrationDeadline);
      const selectedGSize = Number(groupSize) || 4;
      const dynamicMatchdays = getMatchdaysForGroupSize(selectedGSize);

      const timeline = calculateTournamentTimeline({
        startDate: new Date(),
        registrationDeadline: regDate,
        groupMatchdaysCount: dynamicMatchdays,
        intervalDays,
        graceHours,
        knockoutRoundsCount: 3
      });

      const finalStage = timeline[timeline.length - 1];

      const { data, error } = await supabase
        .from('tournaments')
        .insert({
          title,
          status: 'registration_open',
          group_size: groupSize,
          registration_deadline: regDate.toISOString(),
          group_match_days_interval: intervalDays,
          result_submission_grace_hours: graceHours,
          final_deadline: finalStage?.submissionDeadline.toISOString(),
          primary_color: '#00265a',
          accent_color: '#c89850'
        })
        .select()
        .single();

      if (error) throw error;
      setIsCreateModalOpen(false);
      fetchTournaments();
      if (data) setSelectedTournament(data);
    } catch (err) {
      console.error('Failed to create tournament:', err);
      alert('Failed to create tournament');
    } finally {
      setCreating(false);
    }
  };

  // Approve / Reject Registration
  const handleReviewRegistration = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .update({
          status,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      if (selectedTournament) fetchTournamentData(selectedTournament.id);
    } catch (err) {
      console.error('Review failed:', err);
    }
  };

  // Generate Equal Groups & Round-Robin Fixtures
  const handleGenerateGroups = async () => {
    if (!selectedTournament) return;
    const approved = registrations.filter(r => r.status === 'approved');
    if (approved.length < 2) {
      alert('Need at least 2 approved participants to generate groups.');
      return;
    }

    const confirmGen = window.confirm(
      `Generate equal groups for ${approved.length} approved participants? (Any missing slots will be filled with BYE walkover bots)`
    );
    if (!confirmGen) return;

    try {
      setLoading(true);
      const mapped = approved.map(r => ({
        id: r.player_id,
        name: r.player?.name || 'Player',
        game_id: r.game_id,
        device_model: r.device_model
      }));

      const actualGroupSize = selectedTournament.group_size || 4;
      const { groups } = partitionIntoEqualGroups(mapped, actualGroupSize);
      const dynamicMatchdays = getMatchdaysForGroupSize(actualGroupSize);

      const timeline = calculateTournamentTimeline({
        startDate: new Date(),
        registrationDeadline: new Date(selectedTournament.registration_deadline),
        groupMatchdaysCount: dynamicMatchdays,
        intervalDays: selectedTournament.group_match_days_interval || 2,
        graceHours: 24,
        knockoutRoundsCount: 3
      });

      const deadlinesByMatchday: Record<number, { playDeadline: Date; submissionDeadline: Date }> = {};
      timeline.filter(t => t.stage === 'group' && t.matchday).forEach(t => {
        deadlinesByMatchday[t.matchday!] = {
          playDeadline: t.playDeadline,
          submissionDeadline: t.submissionDeadline
        };
      });

      for (const g of groups) {
        const { data: groupData, error: gErr } = await supabase
          .from('tournament_groups')
          .insert({
            tournament_id: selectedTournament.id,
            name: g.name
          })
          .select()
          .single();

        if (gErr) throw gErr;

        const participantIdMap: { id: string; is_dummy?: boolean }[] = [];
        for (const p of g.participants) {
          const isDummy = Boolean((p as any).is_dummy);
          const { data: pData, error: pErr } = await supabase
            .from('tournament_participants')
            .insert({
              tournament_id: selectedTournament.id,
              group_id: groupData.id,
              player_id: isDummy ? null : p.id,
              game_id: (p as any).game_id || null,
              device_model: (p as any).device_model || null,
              is_dummy: isDummy,
              dummy_name: isDummy ? 'BYE / Walkover' : null
            })
            .select()
            .single();

          if (pErr) throw pErr;
          participantIdMap.push({ id: pData.id, is_dummy: isDummy });
        }

        const fixtures = generateGroupFixtures(participantIdMap, deadlinesByMatchday);
        for (const f of fixtures) {
          await supabase.from('tournament_matches').insert({
            tournament_id: selectedTournament.id,
            group_id: groupData.id,
            stage: 'group',
            matchday: f.matchday,
            player1_id: f.player1_id,
            player2_id: f.player2_id,
            player1_is_dummy: f.player1_is_dummy,
            player2_is_dummy: f.player2_is_dummy,
            is_auto_win: f.is_auto_win,
            auto_win_player_id: f.auto_win_player_id,
            status: f.status,
            play_deadline: f.play_deadline.toISOString(),
            submission_deadline: f.submission_deadline.toISOString()
          });
        }
      }

      await supabase
        .from('tournaments')
        .update({ status: 'group_stage' })
        .eq('id', selectedTournament.id);

      alert('Groups and 5-Matchday Round Robin schedule generated successfully!');
      fetchTournaments();
    } catch (err) {
      console.error('Failed to generate groups:', err);
      alert('Failed to generate groups');
    } finally {
      setLoading(false);
    }
  };

  // Dispute Action: Admin Manually Sets Official Score
  const handleResolveScore = async (matchId: string) => {
    const scores = resolveScores[matchId];
    if (!scores) return;

    try {
      const s1 = scores.s1;
      const s2 = scores.s2;
      const targetMatch = matches.find(m => m.id === matchId);
      if (!targetMatch) return;

      const winnerId = s1 > s2 ? targetMatch.player1_id : s2 > s1 ? targetMatch.player2_id : null;

      const { error } = await supabase
        .from('tournament_matches')
        .update({
          player1_score: s1,
          player2_score: s2,
          winner_id: winnerId,
          status: 'completed'
        })
        .eq('id', matchId);

      if (error) throw error;
      alert('Match official score verified and completed!');
      if (selectedTournament) fetchTournamentData(selectedTournament.id);
    } catch (err) {
      console.error('Failed to resolve score:', err);
    }
  };

  // Dispute Action: Admin Approves Auto-Win Walkover
  const handleApproveAutoWin = async (matchId: string, winnerPlayerId: string) => {
    try {
      const { error } = await supabase
        .from('tournament_matches')
        .update({
          is_auto_win: true,
          auto_win_player_id: winnerPlayerId,
          winner_id: winnerPlayerId,
          status: 'completed'
        })
        .eq('id', matchId);

      if (error) throw error;
      alert('Auto-Win walkover approved (3 points awarded, 0 fake goals).');
      if (selectedTournament) fetchTournamentData(selectedTournament.id);
    } catch (err) {
      console.error('Failed to approve auto-win:', err);
    }
  };

  // Dispute Action: Admin Declares Inactive Double Loss (0 pts to both)
  const handleSetInactiveDoubleLoss = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from('tournament_matches')
        .update({
          is_inactive_double_loss: true,
          status: 'completed',
          player1_score: 0,
          player2_score: 0
        })
        .eq('id', matchId);

      if (error) throw error;
      alert('Double forfeit marked: 0 points awarded to both players.');
      if (selectedTournament) fetchTournamentData(selectedTournament.id);
    } catch (err) {
      console.error('Failed to set inactive loss:', err);
    }
  };

  const approvedCount = registrations.filter(r => r.status === 'approved').length;
  const pendingCount = registrations.filter(r => r.status === 'pending').length;
  const disputedMatches = matches.filter(m => m.status === 'disputed' || m.status === 'pending_approval');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Trophy className="w-7 h-7 text-primary" />
            Tournament Command Center
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage solo tournaments, review Facebook player registrations, resolve disputes, and trigger automated group draws.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow hover:opacity-90 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Create Tournament
        </button>
      </div>

      {/* Tournament Selector Pills */}
      {tournaments.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {tournaments.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTournament(t)}
              className={`py-2 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition border ${
                selectedTournament?.id === t.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {t.title}
              <span className="ml-2 text-xs opacity-75 capitalize">({t.status.replace('_', ' ')})</span>
            </button>
          ))}
        </div>
      )}

      {selectedTournament ? (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {/* Tournament Overview Stats */}
          <div className="p-5 border-b border-border bg-muted/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs uppercase font-bold text-muted-foreground">Status</span>
                <p className="text-sm font-black capitalize text-foreground">{selectedTournament.status.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-muted-foreground">Approved Players</span>
                <p className="text-sm font-black text-emerald-500">{approvedCount}</p>
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-muted-foreground">Pending Review</span>
                <p className="text-sm font-black text-amber-500">{pendingCount}</p>
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-muted-foreground">Disputes Queue</span>
                <p className="text-sm font-black text-rose-500">{disputedMatches.length}</p>
              </div>
            </div>

            {selectedTournament.status === 'registration_open' && (
              <button
                onClick={handleGenerateGroups}
                disabled={loading}
                className="flex items-center gap-2 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Trigger Auto Group Draw ({approvedCount} Players)
              </button>
            )}
          </div>

          {/* Sub Navigation */}
          <div className="flex border-b border-border px-5">
            <button
              onClick={() => setActiveTab('registrations')}
              className={`py-3 px-4 font-bold text-sm border-b-2 transition ${
                activeTab === 'registrations'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Registrations Queue ({registrations.length})
            </button>

            <button
              onClick={() => setActiveTab('disputes')}
              className={`py-3 px-4 font-bold text-sm border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'disputes'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Disputes & Verification ({disputedMatches.length})
            </button>
          </div>

          {/* ─── TAB 1: REGISTRATIONS REVIEW QUEUE ─── */}
          {activeTab === 'registrations' && (
            <div className="overflow-x-auto">
              {registrations.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm">
                  No players have registered yet. Share the public registration link to get started!
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/40 text-xs uppercase font-bold text-muted-foreground border-b border-border">
                    <tr>
                      <th className="py-3 px-4">Player</th>
                      <th className="py-3 px-4">eFootball Game ID</th>
                      <th className="py-3 px-4">Device Model</th>
                      <th className="py-3 px-4">FB Proof Link</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {registrations.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/10 transition">
                        <td className="py-3 px-4 font-bold text-foreground flex items-center gap-2.5">
                          {r.player?.profileImageUrl && (
                            <img src={r.player.profileImageUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                          )}
                          <span>{r.player?.name || 'Unknown'}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">{r.game_id}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{r.device_model}</td>
                        <td className="py-3 px-4">
                          <a
                            href={r.facebook_post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline font-semibold"
                          >
                            <span>Open FB Post</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold capitalize ${
                            r.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : r.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-500'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {r.status === 'pending' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleReviewRegistration(r.id, 'approved')}
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReviewRegistration(r.id, 'rejected')}
                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ─── TAB 2: DISPUTES & AUTO-WIN QUEUE ─── */}
          {activeTab === 'disputes' && (
            <div className="p-6 space-y-4">
              {disputedMatches.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm">
                  No disputed matches or pending claims. All matchday scores are verified!
                </div>
              ) : (
                disputedMatches.map((m) => {
                  const mSubs = submissions.filter(s => s.match_id === m.id);
                  const scores = resolveScores[m.id] || { s1: m.player1_score ?? 0, s2: m.player2_score ?? 0 };

                  return (
                    <div key={m.id} className="p-5 rounded-2xl bg-muted/20 border border-border space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-primary font-mono">
                          Matchday {m.matchday} • {m.stage.replace('_', ' ')}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-rose-500/10 text-rose-500">
                          {m.auto_win_reason ? 'Auto-Win Claimed' : 'Score Disputed'}
                        </span>
                      </div>

                      {/* Opponents and Manual Override Inputs */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm">{m.player1?.name || 'Player 1'}</span>
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={scores.s1}
                            onChange={(e) => setResolveScores(prev => ({
                              ...prev,
                              [m.id]: { s1: Number(e.target.value), s2: scores.s2 }
                            }))}
                            className="w-16 py-1 text-center font-black bg-background border border-border rounded-lg text-sm"
                          />
                          <span className="text-muted-foreground font-bold">-</span>
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={scores.s2}
                            onChange={(e) => setResolveScores(prev => ({
                              ...prev,
                              [m.id]: { s1: scores.s1, s2: Number(e.target.value) }
                            }))}
                            className="w-16 py-1 text-center font-black bg-background border border-border rounded-lg text-sm"
                          />
                          <span className="font-bold text-sm">{m.player2?.name || 'Player 2'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleResolveScore(m.id)}
                            className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                          >
                            Set Official Score
                          </button>

                          <button
                            onClick={() => handleSetInactiveDoubleLoss(m.id)}
                            className="py-1.5 px-3 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground font-bold text-xs transition"
                            title="Mark both players inactive (0 pts)"
                          >
                            Double Forfeit (0 pts)
                          </button>
                        </div>
                      </div>

                      {/* Auto Win Claim Details if Present */}
                      {m.auto_win_reason && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                          <p className="font-bold">Claim Reason:</p>
                          <p className="mt-0.5">{m.auto_win_reason}</p>
                          {m.auto_win_proof_url && (
                            <a
                              href={m.auto_win_proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-500 hover:underline mt-2 font-semibold"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              View Chat Screenshot Proof
                            </a>
                          )}

                          <div className="mt-3 flex items-center gap-2">
                            {m.player1 && (
                              <button
                                onClick={() => handleApproveAutoWin(m.id, m.player1_id!)}
                                className="py-1 px-3 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                              >
                                Approve Auto-Win for {m.player1.name}
                              </button>
                            )}
                            {m.player2 && (
                              <button
                                onClick={() => handleApproveAutoWin(m.id, m.player2_id!)}
                                className="py-1 px-3 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                              >
                                Approve Auto-Win for {m.player2.name}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Submitted Player Proofs Log */}
                      {mSubs.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <span className="text-xs font-bold uppercase text-muted-foreground">Player Submissions Proof:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {mSubs.map(s => (
                              <div key={s.id} className="p-3 rounded-xl bg-card border border-border text-xs flex items-center justify-between">
                                <div>
                                  <span className="font-bold block">
                                    Reported: {s.proposed_p1_score ?? '-'} : {s.proposed_p2_score ?? '-'}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    Type: {s.submission_type}
                                  </span>
                                </div>
                                <a
                                  href={s.screenshot_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-semibold"
                                >
                                  <span>View Image</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border p-12 text-center rounded-2xl text-muted-foreground">
          No tournament selected. Create a new tournament to start!
        </div>
      )}

      {/* Create Tournament Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-black text-foreground mb-4">Create New Solo Tournament</h2>
            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Tournament Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. eFootball Solo Championship 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-background border border-border text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Registration Deadline *</label>
                <input
                  type="datetime-local"
                  required
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-background border border-border text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Group Size (Players / Group)</label>
                  <input
                    type="number"
                    min="3"
                    max="16"
                    value={groupSize}
                    onChange={(e) => setGroupSize(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-xl bg-background border border-border text-sm font-bold"
                  />
                  <span className="text-[10px] text-primary font-semibold block mt-0.5">
                    {groupSize} players = {getMatchdaysForGroupSize(groupSize)} Matchdays
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Days Per Matchday</label>
                  <input
                    type="number"
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-xl bg-background border border-border text-sm"
                  />
                  <span className="text-[10px] text-muted-foreground">Default: 2 days</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="py-2 px-4 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="py-2 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow hover:opacity-90 transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create & Calculate Timeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
