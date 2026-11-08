import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tournament, TournamentRegistration, TournamentMatch, TournamentSubmission, TournamentStatus, TournamentGroup, TournamentParticipant, MatchStage } from '@/features/tournaments/types';
import { calculateTournamentTimeline, partitionIntoEqualGroups, generateGroupFixtures, getMatchdaysForGroupSize, calculateGroupStandings } from '@/features/tournaments/utils/tournamentEngine';
import { TournamentKnockoutBracket } from '@/features/tournaments/components/TournamentKnockoutBracket';
import { 
  Trophy, Plus, CheckCircle, XCircle, 
  ExternalLink, Play, ShieldAlert, Image as ImageIcon, Trash2, Edit3,
  Clock, Lock, Shuffle, ArrowRight, Calendar
} from 'lucide-react';
import { useFootballStore } from '@/store/footballStore';

// Helper to convert date to YYYY-MM-DDTHH:mm for datetime-local input
const formatForDateTimeLocal = (isoStr?: string | null) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function AdminTournaments() {
  const storePlayers = useFootballStore((state) => state.players) || [];
  const fetchPlayers = useFootballStore((state) => state.fetchPlayers);

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [submissions, setSubmissions] = useState<TournamentSubmission[]>([]);
  const [groups, setGroups] = useState<TournamentGroup[]>([]);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);

  // Knockout Deadline & Draw Modal State
  const [deadlineModal, setDeadlineModal] = useState<{
    isOpen: boolean;
    stage: MatchStage;
    title: string;
    description: string;
    playDeadline: string;
    graceHours: number;
    isInitialDraw?: boolean;
    matchesToUpdate?: TournamentMatch[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'registrations' | 'disputes' | 'matches'>('registrations');

  // Manual Score Resolution State
  const [resolveScores, setResolveScores] = useState<Record<string, { s1: number; s2: number }>>({});

  // New Tournament Form State
  const [title, setTitle] = useState('');
  const [seasonName, setSeasonName] = useState('Season 1 • 2026');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [intervalDays, setIntervalDays] = useState(2);
  const [graceHours] = useState(24);
  const [groupSize, setGroupSize] = useState(6);
  const [creating, setCreating] = useState(false);

  // Edit Tournament Form State
  const [editTitle, setEditTitle] = useState('');
  const [editSeasonName, setEditSeasonName] = useState('');
  const [editStatus, setEditStatus] = useState<TournamentStatus>('registration_open');
  const [editRegistrationDeadline, setEditRegistrationDeadline] = useState('');
  const [editIntervalDays, setEditIntervalDays] = useState(2);
  const [editGraceHours, setEditGraceHours] = useState(24);
  const [editGroupSize, setEditGroupSize] = useState(6);
  const [editRulesText, setEditRulesText] = useState('');
  const [updating, setUpdating] = useState(false);

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
      const [regRes, matchRes, subRes, groupRes, partRes] = await Promise.all([
        supabase.from('tournament_registrations').select('*').eq('tournament_id', tournamentId).order('created_at', { ascending: false }),
        supabase.from('tournament_matches').select('*').eq('tournament_id', tournamentId).order('bracket_match_number', { ascending: true }),
        supabase.from('tournament_submissions').select('*').order('created_at', { ascending: false }),
        supabase.from('tournament_groups').select('*').eq('tournament_id', tournamentId).order('display_order', { ascending: true }),
        supabase.from('tournament_participants').select('*').eq('tournament_id', tournamentId)
      ]);

      // Resolve player info reliably without relying on PostgREST foreign key joins
      let currentPlayers = storePlayers;
      if (currentPlayers.length === 0) {
        const { data: rawPlayers } = await supabase.from('players').select('*');
        if (rawPlayers) {
          currentPlayers = rawPlayers.map(p => ({
            ...p,
            profileImageUrl: p.profileimageurl || p.profileImageUrl
          })) as any;
        }
      }

      const mappedRegs = (regRes.data || []).map(r => ({
        ...r,
        player: currentPlayers.find(p => p.id === r.player_id)
      }));

      const mappedMatches = (matchRes.data || []).map(m => ({
        ...m,
        player1: currentPlayers.find(p => p.id === m.player1_id),
        player2: currentPlayers.find(p => p.id === m.player2_id)
      }));

      const mappedParticipants = (partRes.data || []).map(p => ({
        ...p,
        player: currentPlayers.find(pl => pl.id === p.player_id)
      }));

      setRegistrations(mappedRegs);
      setMatches(mappedMatches);
      setSubmissions(subRes.data || []);
      setGroups(groupRes.data || []);
      setParticipants(mappedParticipants);
    } catch (err) {
      console.error('Error fetching tournament details:', err);
    }
  };

  useEffect(() => {
    fetchTournaments();
    fetchPlayers();
  }, [fetchPlayers]);

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
          season_name: seasonName.trim() || 'Season 1 • 2026',
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

  // Open Edit Modal & Populate Form
  const handleOpenEditModal = (t: Tournament) => {
    setEditTitle(t.title || '');
    setEditSeasonName(t.season_name || 'Season 1 • 2026');
    setEditStatus(t.status || 'registration_open');
    setEditRegistrationDeadline(formatForDateTimeLocal(t.registration_deadline));
    setEditGroupSize(t.group_size || 6);
    setEditIntervalDays(t.group_match_days_interval || 2);
    setEditGraceHours(t.result_submission_grace_hours || 24);
    setEditRulesText(t.rules_text || '');
    setIsEditModalOpen(true);
  };

  // Update Tournament Handler
  const handleUpdateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament || !editTitle.trim() || !editRegistrationDeadline) return;

    try {
      setUpdating(true);
      const regDate = new Date(editRegistrationDeadline);
      const selectedGSize = Number(editGroupSize) || 4;
      const dynamicMatchdays = getMatchdaysForGroupSize(selectedGSize);

      const timeline = calculateTournamentTimeline({
        startDate: new Date(selectedTournament.start_date || selectedTournament.created_at || new Date()),
        registrationDeadline: regDate,
        groupMatchdaysCount: dynamicMatchdays,
        intervalDays: editIntervalDays,
        graceHours: editGraceHours,
        knockoutRoundsCount: 3
      });

      const finalStage = timeline[timeline.length - 1];

      const updatePayload = {
        title: editTitle.trim(),
        season_name: editSeasonName.trim() || 'Season 1 • 2026',
        status: editStatus,
        registration_deadline: regDate.toISOString(),
        group_size: selectedGSize,
        group_match_days_interval: editIntervalDays,
        result_submission_grace_hours: editGraceHours,
        final_deadline: finalStage?.submissionDeadline.toISOString() || null,
        rules_text: editRulesText.trim() || null,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('tournaments')
        .update(updatePayload)
        .eq('id', selectedTournament.id)
        .select()
        .single();

      if (error) throw error;

      // Update state
      setTournaments(prev => prev.map(t => t.id === selectedTournament.id ? data : t));
      setSelectedTournament(data);
      setIsEditModalOpen(false);
      alert(`Tournament "${data.title}" updated successfully!`);
    } catch (err: any) {
      console.error('Failed to update tournament:', err);
      alert(err.message || 'Failed to update tournament');
    } finally {
      setUpdating(false);
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

      if (targetMatch.stage !== 'group' && s1 === s2) {
        alert('Knockout matches cannot end in a draw! Please adjust score to reflect match or penalty winner.');
        return;
      }

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

      // If Grand Final completed, crown champion and mark tournament completed!
      if (targetMatch.stage === 'final' && winnerId && selectedTournament) {
        await supabase
          .from('tournaments')
          .update({
            champion_player_id: winnerId,
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTournament.id);
        fetchTournaments();
      }

      alert('Match official score verified and completed!');
      if (selectedTournament) fetchTournamentData(selectedTournament.id);
    } catch (err) {
      console.error('Failed to resolve score:', err);
    }
  };

  // Dispute Action: Admin Approves Auto-Win Walkover
  const handleApproveAutoWin = async (matchId: string, winnerPlayerId: string) => {
    try {
      const targetMatch = matches.find(m => m.id === matchId);
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

      if (targetMatch?.stage === 'final' && winnerPlayerId && selectedTournament) {
        await supabase
          .from('tournaments')
          .update({
            champion_player_id: winnerPlayerId,
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTournament.id);
        fetchTournaments();
      }

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

  // ─── KNOCKOUT CONTROLLER & DEADLINE LOGIC ───

  // Calculate qualified players from groups (Top 2 per group)
  const getQualifiedGroupPlayers = () => {
    const qualified: { participant: TournamentParticipant; groupName: string; rank: number }[] = [];
    for (const group of groups) {
      const groupParts = participants.filter(p => p.group_id === group.id);
      const groupM = matches.filter(m => m.group_id === group.id);
      const standings = calculateGroupStandings(groupParts, groupM);
      const top2 = standings.slice(0, 2);
      for (const row of top2) {
        const part = participants.find(p => p.id === row.participant_id);
        if (part && !part.is_dummy && part.player_id) {
          qualified.push({
            participant: part,
            groupName: group.name,
            rank: row.rank
          });
        }
      }
    }
    return qualified;
  };

  // 1. Perform Random Draw for Knockouts (Stage 1)
  const handlePerformKnockoutDraw = async (playDeadlineStr: string, graceHours: number) => {
    if (!selectedTournament) return;
    const qualified = getQualifiedGroupPlayers();
    if (qualified.length < 2) {
      alert('Need at least 2 qualified players from groups to start knockouts.');
      return;
    }

    try {
      setLoading(true);
      // Fair random shuffle for draw
      const shuffled = [...qualified].sort(() => Math.random() - 0.5);

      let stage: MatchStage = 'quarter_final';
      let matchCount = 4;
      if (shuffled.length <= 4) {
        stage = 'semi_final';
        matchCount = 2;
      } else if (shuffled.length > 8) {
        stage = 'round_of_16';
        matchCount = 8;
      }

      const playDeadline = new Date(playDeadlineStr);
      const submissionDeadline = new Date(playDeadline.getTime() + graceHours * 3600000);

      const matchesToInsert: any[] = [];
      for (let i = 0; i < matchCount; i++) {
        const p1 = shuffled[i * 2]?.participant;
        const p2 = shuffled[i * 2 + 1]?.participant;

        matchesToInsert.push({
          tournament_id: selectedTournament.id,
          stage,
          matchday: 1,
          bracket_match_number: i + 1,
          player1_id: p1?.player_id || null,
          player2_id: p2?.player_id || null,
          player1_is_dummy: Boolean(p1?.is_dummy),
          player2_is_dummy: Boolean(p2?.is_dummy),
          status: 'scheduled',
          play_deadline: playDeadline.toISOString(),
          submission_deadline: submissionDeadline.toISOString()
        });
      }

      const { error: insErr } = await supabase.from('tournament_matches').insert(matchesToInsert);
      if (insErr) throw insErr;

      // Update tournament status
      await supabase.from('tournaments').update({
        status: 'knockout_stage',
        updated_at: new Date().toISOString()
      }).eq('id', selectedTournament.id);

      alert(`Random draw completed! ${matchCount} ${stage.replace('_', ' ')} matches generated.`);
      setDeadlineModal(null);
      fetchTournaments();
      fetchTournamentData(selectedTournament.id);
    } catch (err: any) {
      console.error('Failed to perform knockout draw:', err);
      alert(err.message || 'Failed to perform knockout draw');
    } finally {
      setLoading(false);
    }
  };

  // 2. Advance QF Winners to Semi-Finals (Deterministic Bracket)
  const handleAdvanceToSemiFinals = async (playDeadlineStr: string, graceHours: number) => {
    if (!selectedTournament) return;
    const qfMatches = matches.filter(m => m.stage === 'quarter_final').sort((a, b) => (a.bracket_match_number || 0) - (b.bracket_match_number || 0));

    const allCompleted = qfMatches.length === 4 && qfMatches.every(m => m.status === 'completed' && m.winner_id);
    if (!allCompleted) {
      alert('All 4 Quarter-Final matches must be completed with verified winners before advancing to Semi-Finals.');
      return;
    }

    try {
      setLoading(true);
      const playDeadline = new Date(playDeadlineStr);
      const submissionDeadline = new Date(playDeadline.getTime() + graceHours * 3600000);

      const w1 = qfMatches[0].winner_id;
      const w2 = qfMatches[1].winner_id;
      const w3 = qfMatches[2].winner_id;
      const w4 = qfMatches[3].winner_id;

      const sfMatchesToInsert = [
        {
          tournament_id: selectedTournament.id,
          stage: 'semi_final',
          matchday: 2,
          bracket_match_number: 1,
          player1_id: w1,
          player2_id: w2,
          status: 'scheduled',
          play_deadline: playDeadline.toISOString(),
          submission_deadline: submissionDeadline.toISOString()
        },
        {
          tournament_id: selectedTournament.id,
          stage: 'semi_final',
          matchday: 2,
          bracket_match_number: 2,
          player1_id: w3,
          player2_id: w4,
          status: 'scheduled',
          play_deadline: playDeadline.toISOString(),
          submission_deadline: submissionDeadline.toISOString()
        }
      ];

      const { error: insErr } = await supabase.from('tournament_matches').insert(sfMatchesToInsert);
      if (insErr) throw insErr;

      alert('Semi-Finals fixtures generated successfully!');
      setDeadlineModal(null);
      fetchTournamentData(selectedTournament.id);
    } catch (err: any) {
      console.error('Failed to advance to semi-finals:', err);
      alert(err.message || 'Failed to advance to semi-finals');
    } finally {
      setLoading(false);
    }
  };

  // 3. Advance SF Winners to Grand Final
  const handleAdvanceToGrandFinal = async (playDeadlineStr: string, graceHours: number) => {
    if (!selectedTournament) return;
    const sfMatches = matches.filter(m => m.stage === 'semi_final').sort((a, b) => (a.bracket_match_number || 0) - (b.bracket_match_number || 0));

    const allCompleted = sfMatches.length === 2 && sfMatches.every(m => m.status === 'completed' && m.winner_id);
    if (!allCompleted) {
      alert('Both Semi-Final matches must be completed with verified winners before advancing to Grand Final.');
      return;
    }

    try {
      setLoading(true);
      const playDeadline = new Date(playDeadlineStr);
      const submissionDeadline = new Date(playDeadline.getTime() + graceHours * 3600000);

      const w1 = sfMatches[0].winner_id;
      const w2 = sfMatches[1].winner_id;

      const finalMatch = {
        tournament_id: selectedTournament.id,
        stage: 'final',
        matchday: 3,
        bracket_match_number: 1,
        player1_id: w1,
        player2_id: w2,
        status: 'scheduled',
        play_deadline: playDeadline.toISOString(),
        submission_deadline: submissionDeadline.toISOString()
      };

      const { error: insErr } = await supabase.from('tournament_matches').insert(finalMatch);
      if (insErr) throw insErr;

      alert('Grand Final match generated successfully!');
      setDeadlineModal(null);
      fetchTournamentData(selectedTournament.id);
    } catch (err: any) {
      console.error('Failed to advance to grand final:', err);
      alert(err.message || 'Failed to advance to grand final');
    } finally {
      setLoading(false);
    }
  };

  // 4. Update Round Deadline (Only allowed BEFORE matches in this round start / complete)
  const handleUpdateRoundDeadline = async (matchesToUpdate: TournamentMatch[], newPlayDeadlineStr: string, graceHours: number) => {
    if (!selectedTournament || matchesToUpdate.length === 0) return;

    // Strict validation: cannot change deadline if any match is completed
    const hasCompleted = matchesToUpdate.some(m => m.status === 'completed');
    if (hasCompleted) {
      alert('Deadline is locked: Matches in this round have already started or finished.');
      return;
    }

    try {
      setLoading(true);
      const playDeadline = new Date(newPlayDeadlineStr);
      const submissionDeadline = new Date(playDeadline.getTime() + graceHours * 3600000);

      const ids = matchesToUpdate.map(m => m.id);
      const { error } = await supabase
        .from('tournament_matches')
        .update({
          play_deadline: playDeadline.toISOString(),
          submission_deadline: submissionDeadline.toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', ids);

      if (error) throw error;

      alert('Round deadline updated successfully!');
      setDeadlineModal(null);
      fetchTournamentData(selectedTournament.id);
    } catch (err: any) {
      console.error('Failed to update round deadline:', err);
      alert(err.message || 'Failed to update round deadline');
    } finally {
      setLoading(false);
    }
  };

  // Delete Tournament Handler (Cascades to groups, matches & registrations)
  const handleDeleteTournament = async (tournamentId: string, tournamentTitle: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete tournament "${tournamentTitle}"?\nAll registrations, groups, and matches will be deleted.`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentId);

      if (error) throw error;

      alert(`Tournament "${tournamentTitle}" has been removed.`);
      const remaining = tournaments.filter(t => t.id !== tournamentId);
      setTournaments(remaining);
      setSelectedTournament(remaining.length > 0 ? remaining[0] : null);
    } catch (err: any) {
      console.error('Failed to delete tournament:', err);
      alert(err.message || 'Failed to delete tournament');
    } finally {
      setLoading(false);
    }
  };

  const approvedCount = registrations.filter(r => r.status === 'approved').length;
  const pendingCount = registrations.filter(r => r.status === 'pending').length;
  const disputedMatches = matches.filter(m => m.status === 'disputed' || m.status === 'pending_approval');

  const groupMatches = matches.filter(m => m.stage === 'group');
  const allGroupMatchesCompleted = groupMatches.length > 0 && groupMatches.every(m => m.status === 'completed');
  const knockoutMatches = matches.filter(m => m.stage !== 'group');
  const qfMatches = knockoutMatches.filter(m => m.stage === 'quarter_final' || m.stage === 'round_of_16').sort((a, b) => (a.bracket_match_number || 0) - (b.bracket_match_number || 0));
  const sfMatches = knockoutMatches.filter(m => m.stage === 'semi_final').sort((a, b) => (a.bracket_match_number || 0) - (b.bracket_match_number || 0));
  const finalMatch = knockoutMatches.find(m => m.stage === 'final');
  const championPlayer = selectedTournament?.champion_player_id ? storePlayers.find(p => p.id === selectedTournament.champion_player_id) : null;

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

            <div className="flex items-center gap-2">
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

              <button
                onClick={() => handleOpenEditModal(selectedTournament)}
                disabled={loading}
                className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold text-xs transition active:scale-95 disabled:opacity-50 shadow-sm"
                title="Edit tournament settings"
              >
                <Edit3 className="w-3.5 h-3.5 text-primary" />
                Edit Tournament
              </button>

              <button
                onClick={() => handleDeleteTournament(selectedTournament.id, selectedTournament.title)}
                disabled={loading}
                className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-bold text-xs transition active:scale-95 disabled:opacity-50"
                title="Delete this tournament"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Tournament
              </button>
            </div>
          </div>

          {/* Group Stage Finished & Knockouts Paused Alert Banner */}
          {allGroupMatchesCompleted && knockoutMatches.length === 0 && (
            <div className="mx-5 my-4 p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <span>Group Stage Completed</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 uppercase font-black">
                      Paused
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    All group fixtures are verified! The tournament is currently paused until you conduct the Random Draw for Knockouts.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 2);
                  setDeadlineModal({
                    isOpen: true,
                    stage: 'quarter_final',
                    title: 'Start Knockout Stage: Random Draw',
                    description: 'Qualifying contenders from each group will be fairly shuffled into bracket pairs.',
                    playDeadline: formatForDateTimeLocal(d.toISOString()),
                    graceHours: selectedTournament?.result_submission_grace_hours || 24,
                    isInitialDraw: true
                  });
                }}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow hover:opacity-90 transition active:scale-95 whitespace-nowrap"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Start Knockouts & Random Draw
              </button>
            </div>
          )}

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

            <button
              onClick={() => setActiveTab('matches')}
              className={`py-3 px-4 font-bold text-sm border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'matches'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              Knockouts & Round Controller
              {knockoutMatches.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-primary/20 text-primary font-black">
                  {knockoutMatches.length}
                </span>
              )}
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

          {/* ─── TAB 3: KNOCKOUTS & ROUND CONTROLLER ─── */}
          {activeTab === 'matches' && (
            <div className="p-6 space-y-8">
              {/* Knockout Status Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Quarter-Finals Card */}
                <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase text-primary tracking-wider">Round 1</span>
                      {qfMatches.length > 0 ? (
                        qfMatches.every(m => m.status === 'completed') ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            Completed
                          </span>
                        ) : qfMatches.some(m => m.status === 'completed') ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            In Progress
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/15 text-blue-600 dark:text-blue-400">
                            Scheduled
                          </span>
                        )
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-muted text-muted-foreground">
                          Not Drawn
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-foreground">Quarter-Finals</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {qfMatches.length > 0
                        ? `${qfMatches.filter(m => m.status === 'completed').length} of ${qfMatches.length} matches completed`
                        : '8 qualified contenders paired via fair random draw.'}
                    </p>
                  </div>

                  {qfMatches.length > 0 ? (
                    <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5" /> Play Deadline:
                        </span>
                        <span className="font-bold text-foreground">
                          {new Date(qfMatches[0].play_deadline).toLocaleDateString()}
                        </span>
                      </div>

                      {qfMatches.every(m => m.status !== 'completed') ? (
                        <button
                          onClick={() => {
                            setDeadlineModal({
                              isOpen: true,
                              stage: 'quarter_final',
                              title: 'Edit Quarter-Finals Deadline',
                              description: 'Update match play deadline for all Quarter-Final fixtures.',
                              playDeadline: formatForDateTimeLocal(qfMatches[0].play_deadline),
                              graceHours: selectedTournament?.result_submission_grace_hours || 24,
                              matchesToUpdate: qfMatches
                            });
                          }}
                          className="w-full py-2 px-3 rounded-xl border border-border bg-muted/30 hover:bg-muted text-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          Edit QF Deadline
                        </button>
                      ) : (
                        <div className="py-1.5 px-3 rounded-xl bg-muted/40 text-muted-foreground font-semibold text-[11px] flex items-center justify-center gap-1">
                          <Lock className="w-3 h-3" /> Deadline locked (in progress)
                        </div>
                      )}

                      {qfMatches.every(m => m.status === 'completed') && sfMatches.length === 0 && (
                        <button
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 2);
                            setDeadlineModal({
                              isOpen: true,
                              stage: 'semi_final',
                              title: 'Start Semi-Finals & Set Deadline',
                              description: 'Advance Quarter-Final winners into Semi-Final pairs.',
                              playDeadline: formatForDateTimeLocal(d.toISOString()),
                              graceHours: selectedTournament?.result_submission_grace_hours || 24
                            });
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          Advance to Semi-Finals
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 2);
                        setDeadlineModal({
                          isOpen: true,
                          stage: 'quarter_final',
                          title: 'Start Knockout Stage: Random Draw',
                          description: 'Qualifying contenders from each group will be fairly shuffled into bracket pairs.',
                          playDeadline: formatForDateTimeLocal(d.toISOString()),
                          graceHours: selectedTournament?.result_submission_grace_hours || 24,
                          isInitialDraw: true
                        });
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 shadow hover:opacity-90 transition active:scale-95"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      Conduct Random Draw
                    </button>
                  )}
                </div>

                {/* 2. Semi-Finals Card */}
                <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase text-primary tracking-wider">Round 2</span>
                      {sfMatches.length > 0 ? (
                        sfMatches.every(m => m.status === 'completed') ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            Completed
                          </span>
                        ) : sfMatches.some(m => m.status === 'completed') ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            In Progress
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/15 text-blue-600 dark:text-blue-400">
                            Scheduled
                          </span>
                        )
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-muted text-muted-foreground">
                          Pending QF
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-foreground">Semi-Finals</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sfMatches.length > 0
                        ? `${sfMatches.filter(m => m.status === 'completed').length} of ${sfMatches.length} matches completed`
                        : 'Winners of QF 1 vs QF 2 and QF 3 vs QF 4.'}
                    </p>
                  </div>

                  {sfMatches.length > 0 ? (
                    <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5" /> Play Deadline:
                        </span>
                        <span className="font-bold text-foreground">
                          {new Date(sfMatches[0].play_deadline).toLocaleDateString()}
                        </span>
                      </div>

                      {sfMatches.every(m => m.status !== 'completed') ? (
                        <button
                          onClick={() => {
                            setDeadlineModal({
                              isOpen: true,
                              stage: 'semi_final',
                              title: 'Edit Semi-Finals Deadline',
                              description: 'Update match play deadline for Semi-Final fixtures.',
                              playDeadline: formatForDateTimeLocal(sfMatches[0].play_deadline),
                              graceHours: selectedTournament?.result_submission_grace_hours || 24,
                              matchesToUpdate: sfMatches
                            });
                          }}
                          className="w-full py-2 px-3 rounded-xl border border-border bg-muted/30 hover:bg-muted text-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          Edit SF Deadline
                        </button>
                      ) : (
                        <div className="py-1.5 px-3 rounded-xl bg-muted/40 text-muted-foreground font-semibold text-[11px] flex items-center justify-center gap-1">
                          <Lock className="w-3 h-3" /> Deadline locked (in progress)
                        </div>
                      )}

                      {sfMatches.every(m => m.status === 'completed') && !finalMatch && (
                        <button
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 2);
                            setDeadlineModal({
                              isOpen: true,
                              stage: 'final',
                              title: 'Start Grand Championship Final',
                              description: 'Advance Semi-Final winners into the Grand Final match.',
                              playDeadline: formatForDateTimeLocal(d.toISOString()),
                              graceHours: selectedTournament?.result_submission_grace_hours || 24
                            });
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow"
                        >
                          <Trophy className="w-3.5 h-3.5" />
                          Advance to Grand Final
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="py-2 text-center text-xs text-muted-foreground">
                      Awaiting QF results
                    </div>
                  )}
                </div>

                {/* 3. Grand Final Card */}
                <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase text-amber-500 tracking-wider flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" /> Final
                      </span>
                      {finalMatch ? (
                        finalMatch.status === 'completed' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            Crown Winner
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/15 text-blue-600 dark:text-blue-400">
                            Scheduled
                          </span>
                        )
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-muted text-muted-foreground">
                          Pending SF
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-foreground">Grand Championship</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {finalMatch
                        ? finalMatch.status === 'completed'
                          ? `🏆 Champion: ${championPlayer?.name || 'Tournament Winner'}`
                          : 'Final showdown to determine the tournament champion.'
                        : 'Winners of SF 1 vs SF 2.'}
                    </p>
                  </div>

                  {finalMatch ? (
                    <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5" /> Play Deadline:
                        </span>
                        <span className="font-bold text-foreground">
                          {new Date(finalMatch.play_deadline).toLocaleDateString()}
                        </span>
                      </div>

                      {finalMatch.status !== 'completed' ? (
                        <button
                          onClick={() => {
                            setDeadlineModal({
                              isOpen: true,
                              stage: 'final',
                              title: 'Edit Grand Final Deadline',
                              description: 'Update match play deadline for the Grand Championship match.',
                              playDeadline: formatForDateTimeLocal(finalMatch.play_deadline),
                              graceHours: selectedTournament?.result_submission_grace_hours || 24,
                              matchesToUpdate: [finalMatch]
                            });
                          }}
                          className="w-full py-2 px-3 rounded-xl border border-border bg-muted/30 hover:bg-muted text-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          Edit Final Deadline
                        </button>
                      ) : (
                        <div className="py-1.5 px-3 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-xs text-center flex items-center justify-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5" />
                          {championPlayer?.name || 'Champion'} Crowned!
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-2 text-center text-xs text-muted-foreground">
                      Awaiting SF results
                    </div>
                  )}
                </div>
              </div>

              {/* Knockout Match Score Editor List */}
              {knockoutMatches.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-black text-foreground flex items-center gap-2">
                    <span>Knockout Fixtures & Official Score Recorder</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      (Record verified score or penalties directly)
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {knockoutMatches.map((m) => {
                      const scores = resolveScores[m.id] || { s1: m.player1_score ?? 0, s2: m.player2_score ?? 0 };
                      const isCompleted = m.status === 'completed';

                      return (
                        <div key={m.id} className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3">
                          <div className="flex items-center justify-between text-xs pb-2 border-b border-border/50">
                            <span className="font-bold text-primary uppercase text-[11px]">
                              {m.stage.replace('_', ' ')} • Match #{m.bracket_match_number}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(m.play_deadline).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            {/* Player 1 */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs overflow-hidden flex-shrink-0">
                                {m.player1?.profileImageUrl ? (
                                  <img src={m.player1.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                ) : '⚽'}
                              </div>
                              <span className={`font-bold text-xs truncate ${m.winner_id === m.player1_id ? 'text-emerald-500 font-black' : 'text-foreground'}`}>
                                {m.player1?.name || (m.player1_is_dummy ? 'BYE' : 'TBD')}
                              </span>
                            </div>

                            {/* Score Inputs / Displays */}
                            {isCompleted ? (
                              <div className="px-3 py-1 rounded-lg bg-muted font-mono font-black text-sm">
                                {m.player1_score} - {m.player2_score}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <input
                                  type="number"
                                  min="0"
                                  max="99"
                                  value={scores.s1}
                                  onChange={(e) => setResolveScores(prev => ({
                                    ...prev,
                                    [m.id]: { s1: Number(e.target.value), s2: scores.s2 }
                                  }))}
                                  className="w-12 py-1 text-center font-mono font-black text-sm bg-background border border-border rounded-lg"
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
                                  className="w-12 py-1 text-center font-mono font-black text-sm bg-background border border-border rounded-lg"
                                />
                              </div>
                            )}

                            {/* Player 2 */}
                            <div className="flex items-center justify-end gap-2 flex-1 min-w-0 text-right">
                              <span className={`font-bold text-xs truncate ${m.winner_id === m.player2_id ? 'text-emerald-500 font-black' : 'text-foreground'}`}>
                                {m.player2?.name || (m.player2_is_dummy ? 'BYE' : 'TBD')}
                              </span>
                              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs overflow-hidden flex-shrink-0">
                                {m.player2?.profileImageUrl ? (
                                  <img src={m.player2.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                ) : '⚽'}
                              </div>
                            </div>
                          </div>

                          {!isCompleted && (
                            <div className="pt-2 border-t border-border/50 flex justify-end">
                              <button
                                onClick={() => handleResolveScore(m.id)}
                                className="py-1 px-3 rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow hover:opacity-90 transition"
                              >
                                Save Official Score
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bracket Visualizer Preview */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-foreground flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Tournament Bracket Visualization
                  </h3>
                  <span className="text-xs text-muted-foreground font-medium">
                    (Synchronized in real-time with public hub)
                  </span>
                </div>
                <div className="bg-card border border-border rounded-2xl overflow-hidden p-2 shadow-sm">
                  <TournamentKnockoutBracket
                    matches={knockoutMatches}
                    championName={championPlayer?.name}
                  />
                </div>
              </div>
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
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Tournament Season *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Season 1 • 2026 or Winter Cup 2026"
                  value={seasonName}
                  onChange={(e) => setSeasonName(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-background border border-border text-sm font-semibold"
                />
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  Decided freely by admin (e.g. Season 1, Season 2, Monthly Championship)
                </span>
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

      {/* Edit Tournament Modal */}
      {isEditModalOpen && selectedTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary" />
                Edit Tournament Settings
              </h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateTournament} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Tournament Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. eFootball Solo Championship 2026"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-background border border-border text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    Tournament Season *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Season 1 • 2026"
                    value={editSeasonName}
                    onChange={(e) => setEditSeasonName(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-background border border-border text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    Tournament Status *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as TournamentStatus)}
                    className="w-full py-2 px-3 rounded-xl bg-background border border-border text-sm font-semibold capitalize"
                  >
                    <option value="draft">Draft / Setup</option>
                    <option value="registration_open">Registration Open</option>
                    <option value="group_stage">Group Stage</option>
                    <option value="knockout_stage">Knockout Stage</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Registration Deadline *</label>
                <input
                  type="datetime-local"
                  required
                  disabled={selectedTournament.status !== 'registration_open'}
                  value={editRegistrationDeadline}
                  onChange={(e) => setEditRegistrationDeadline(e.target.value)}
                  className={`w-full py-2 px-3 rounded-xl bg-background border border-border text-sm font-semibold ${
                    selectedTournament.status !== 'registration_open' ? 'opacity-60 cursor-not-allowed bg-muted' : ''
                  }`}
                />
                {selectedTournament.status !== 'registration_open' ? (
                  <span className="text-[11px] text-amber-500 font-bold block mt-1 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    Registration deadline locked (Tournament is in {selectedTournament.status.replace('_', ' ')}).
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    Extending or shortening this will recalculate tournament submission timelines automatically.
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Group Size (Players / Group)</label>
                  <input
                    type="number"
                    min="3"
                    max="16"
                    value={editGroupSize}
                    onChange={(e) => setEditGroupSize(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-xl bg-background border border-border text-sm font-bold"
                  />
                  <span className="text-[10px] text-primary font-semibold block mt-0.5">
                    {editGroupSize} players = {getMatchdaysForGroupSize(editGroupSize)} Matchdays
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Days Per Matchday</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={editIntervalDays}
                    onChange={(e) => setEditIntervalDays(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-xl bg-background border border-border text-sm font-bold"
                  />
                  <span className="text-[10px] text-muted-foreground block mt-0.5">Interval between matchdays</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Submission Grace Period (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={editGraceHours}
                  onChange={(e) => setEditGraceHours(Number(e.target.value))}
                  className="w-full py-2 px-3 rounded-xl bg-background border border-border text-sm font-semibold"
                />
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  Extra hours allowed after match deadline for screenshot submission (Default: 24h)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Tournament Rules & Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Disconnect rules, tie-breaker criteria, match screenshot instructions..."
                  value={editRulesText}
                  onChange={(e) => setEditRulesText(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-background border border-border text-sm font-normal resize-y"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="py-2 px-4 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="py-2 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow hover:opacity-90 transition disabled:opacity-50"
                >
                  {updating ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Knockout Draw / Round Deadline Modal */}
      {deadlineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {deadlineModal.title}
              </h2>
              <button
                type="button"
                onClick={() => setDeadlineModal(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              {deadlineModal.description}
            </p>

            {deadlineModal.isInitialDraw && (
              <div className="mb-4 p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <span className="font-bold text-foreground block mb-1">
                  Qualified Group Contenders ({getQualifiedGroupPlayers().length} Players):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {getQualifiedGroupPlayers().map((q, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-background border border-border text-[11px] font-semibold">
                      {q.participant.player?.name || 'Player'} ({q.groupName} #{q.rank})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (deadlineModal.isInitialDraw) {
                  handlePerformKnockoutDraw(deadlineModal.playDeadline, deadlineModal.graceHours);
                } else if (deadlineModal.matchesToUpdate) {
                  handleUpdateRoundDeadline(deadlineModal.matchesToUpdate, deadlineModal.playDeadline, deadlineModal.graceHours);
                } else if (deadlineModal.stage === 'semi_final') {
                  handleAdvanceToSemiFinals(deadlineModal.playDeadline, deadlineModal.graceHours);
                } else if (deadlineModal.stage === 'final') {
                  handleAdvanceToGrandFinal(deadlineModal.playDeadline, deadlineModal.graceHours);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Match Play Deadline *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={deadlineModal.playDeadline}
                  onChange={(e) => setDeadlineModal(prev => prev ? { ...prev, playDeadline: e.target.value } : null)}
                  className="w-full py-2 px-3 rounded-xl bg-background border border-border text-sm font-semibold"
                />
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  Players must complete their match by this date & time.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Result Submission Grace Period (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={deadlineModal.graceHours}
                  onChange={(e) => setDeadlineModal(prev => prev ? { ...prev, graceHours: Number(e.target.value) } : null)}
                  className="w-full py-2 px-3 rounded-xl bg-background border border-border text-sm font-semibold"
                />
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  Additional hours allowed for uploading match result screenshots (Default: 24h).
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setDeadlineModal(null)}
                  className="py-2 px-4 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {deadlineModal.isInitialDraw ? (
                    <>
                      <Shuffle className="w-4 h-4" />
                      Confirm Draw & Create Fixtures
                    </>
                  ) : deadlineModal.matchesToUpdate ? (
                    <>
                      <Clock className="w-4 h-4" />
                      Save Deadline
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      Generate Round Fixtures
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
