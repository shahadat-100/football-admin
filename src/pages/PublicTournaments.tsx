import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tournament, TournamentMatch, TournamentGroup, TournamentParticipant, TournamentRegistration } from '@/features/tournaments/types';
import { calculateGroupStandings } from '@/features/tournaments/utils/tournamentEngine';
import { TournamentRegistrationModal } from '@/features/tournaments/components/TournamentRegistrationModal';
import { MatchScoreSubmissionModal } from '@/features/tournaments/components/MatchScoreSubmissionModal';
import { TournamentKnockoutBracket } from '@/features/tournaments/components/TournamentKnockoutBracket';
import { TournamentPlayerCard } from '@/features/tournaments/components/TournamentPlayerCard';
import { useFootballStore } from '@/store/footballStore';
import { 
  Trophy, Calendar, Users, Gamepad2, Smartphone,
  Clock, Award, Sparkles, CheckCircle2, Eye, X
} from 'lucide-react';

export function PublicTournaments() {
  const storePlayers = useFootballStore((state) => state.players) || [];
  const [, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  
  const [groups, setGroups] = useState<TournamentGroup[]>([]);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  
  const [activeTab, setActiveTab] = useState<'matches' | 'groups' | 'bracket' | 'participants' | 'awards'>('matches');
  const [selectedMatchday, setSelectedMatchday] = useState<number>(1);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [selectedMatchForSubmission, setSelectedMatchForSubmission] = useState<TournamentMatch | null>(null);
  const [viewingPlayerCard, setViewingPlayerCard] = useState<TournamentRegistration | null>(null);
  const [, setLoading] = useState(true);

  // Fetch Tournaments
  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
      if (data && data.length > 0) {
        setSelectedTournament(data[0]);
      }
    } catch (err) {
      console.error('Error fetching tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Tournament Details
  const fetchTournamentDetails = async (tournamentId: string) => {
    try {
      const [groupsRes, participantsRes, matchesRes, regRes] = await Promise.all([
        supabase.from('tournament_groups').select('*').eq('tournament_id', tournamentId).order('name', { ascending: true }),
        supabase.from('tournament_participants').select('*, player:players(*)').eq('tournament_id', tournamentId),
        supabase.from('tournament_matches').select('*, player1:players!player1_id(*), player2:players!player2_id(*)').eq('tournament_id', tournamentId).order('matchday', { ascending: true }),
        supabase.from('tournament_registrations').select('*, player:players(*)').eq('tournament_id', tournamentId).eq('status', 'approved')
      ]);

      setGroups(groupsRes.data || []);
      setParticipants(participantsRes.data || []);
      setMatches(matchesRes.data || []);
      setRegistrations(regRes.data || []);
    } catch (err) {
      console.error('Error fetching tournament details:', err);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchTournamentDetails(selectedTournament.id);
    }
  }, [selectedTournament]);

  const matchdayMatches = matches.filter(m => m.stage === 'group' && m.matchday === selectedMatchday);
  const availableMatchdays = Array.from(new Set(matches.filter(m => m.stage === 'group').map(m => m.matchday))).sort((a, b) => a - b);

  // Tournament Status Step Indicator
  const getStageIndex = (status?: string) => {
    switch (status) {
      case 'registration_open': return 1;
      case 'group_stage': return 2;
      case 'knockout_stage': return 3;
      case 'completed': return 4;
      default: return 1;
    }
  };

  const currentStep = getStageIndex(selectedTournament?.status);

  return (
    <div className="min-h-screen pb-16 bg-[#030d1d] text-white">
      {/* ─── Hero Banner in Club Navy (#00265a) and Gold (#c89850) ─── */}
      <div 
        className="relative overflow-hidden border-b border-[#c89850]/20 py-10 px-4 sm:px-8"
        style={{
          background: 'linear-gradient(135deg, #001738 0%, #00265a 50%, #00112a 100%)'
        }}
      >
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-[#c89850]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#c89850]/20 border border-[#c89850]/40 text-[#c89850] text-xs font-bold uppercase tracking-wider mb-3">
              <Trophy className="w-4 h-4" />
              Solo Championship Engine
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase font-sans">
              {selectedTournament?.title || 'eFootball Solo Tournament'}
            </h1>
            <p className="text-white/70 text-sm sm:text-base mt-2 max-w-xl">
              Competitive equal-group league with automated walkover rules, fair ranking, and knockout glory.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {selectedTournament?.status === 'registration_open' && (
              <button
                onClick={() => setIsRegModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-[#c89850] hover:bg-[#b58641] text-[#00265a] font-black text-sm tracking-wide shadow-xl transition active:scale-95"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                Register & Get Player Card
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Live Tournament Timeline / Lifecycle Progress Bar ─── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-4 relative z-20">
        <div className="bg-[#001738] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
            {[
              { step: 1, title: '1. Registration', desc: `${registrations.length} Players Registered`, icon: Users },
              { step: 2, title: '2. Group Stage', desc: `${availableMatchdays.length || (selectedTournament?.group_size ? (selectedTournament.group_size % 2 === 0 ? selectedTournament.group_size - 1 : selectedTournament.group_size) : 'Round-Robin')} Matchdays`, icon: Calendar },
              { step: 3, title: '3. Knockout Rounds', desc: 'R16 → Quarters → Semis', icon: Trophy },
              { step: 4, title: '4. Grand Final', desc: 'Podium & Awards Ceremony', icon: Award },
            ].map((s) => {
              const Icon = s.icon;
              const isActive = currentStep === s.step;
              const isPast = currentStep > s.step;

              return (
                <div
                  key={s.step}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                    isActive
                      ? 'bg-[#c89850]/15 border-[#c89850] text-white shadow-lg'
                      : isPast
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-white/90'
                      : 'bg-white/5 border-white/5 text-white/40'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isActive
                        ? 'bg-[#c89850] text-[#00265a]'
                        : isPast
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-black block leading-tight">{s.title}</span>
                    <span className="text-[10px] text-white/60 block mt-0.5">{s.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto">
          {[
            { id: 'matches', label: 'Matchday Fixtures', icon: Calendar },
            { id: 'groups', label: 'Group Tables', icon: Users },
            { id: 'bracket', label: 'Knockout Bracket', icon: Trophy },
            { id: 'participants', label: `Registered Players (${registrations.length})`, icon: Users },
            { id: 'awards', label: 'Awards & Podium', icon: Award },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2.5 px-5 rounded-xl font-bold text-sm whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-[#c89850] text-[#00265a] shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ─── TAB 1: MATCHDAY FIXTURES ─── */}
        {activeTab === 'matches' && (
          <div className="pt-6 space-y-6">
            {availableMatchdays.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {availableMatchdays.map(md => (
                  <button
                    key={md}
                    onClick={() => setSelectedMatchday(md)}
                    className={`py-2 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition ${
                      selectedMatchday === md
                        ? 'bg-[#00265a] text-[#c89850] border border-[#c89850] shadow'
                        : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10'
                    }`}
                  >
                    Matchday {md}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/10 text-white/50 text-sm">
                Matches have not been generated yet. Registrations are currently open!
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchdayMatches.map((match) => (
                <div
                  key={match.id}
                  className="p-5 rounded-2xl bg-[#001738]/80 border border-white/10 hover:border-[#c89850]/40 transition shadow-lg relative overflow-hidden"
                >
                  <div className="flex items-center justify-between text-xs text-white/50 mb-4 pb-2 border-b border-white/5">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-[#c89850]" />
                      Play by: {new Date(match.play_deadline).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      match.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : match.status === 'disputed'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {match.is_auto_win ? 'Auto Win' : match.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-white/10 border border-[#c89850]/30 overflow-hidden mb-2">
                        {match.player1?.profileImageUrl ? (
                          <img src={match.player1.profileImageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">⚽</div>
                        )}
                      </div>
                      <span className="font-bold text-sm truncate max-w-[120px]">
                        {match.player1_is_dummy ? 'BYE / Walkover' : match.player1?.name || 'TBD'}
                      </span>
                      {match.player1 && (
                        <div className="flex items-center gap-1 text-[11px] text-[#c89850] font-mono mt-0.5">
                          <Gamepad2 className="w-3 h-3" />
                          <span>IGN</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-center justify-center px-4">
                      {match.status === 'completed' ? (
                        <div className="flex items-center gap-2 text-2xl font-black text-[#c89850] font-sans">
                          <span>{match.player1_score ?? 0}</span>
                          <span className="text-white/30 text-lg">-</span>
                          <span>{match.player2_score ?? 0}</span>
                        </div>
                      ) : (
                        <span className="text-xl font-black text-white/30 tracking-widest">VS</span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-white/10 border border-[#c89850]/30 overflow-hidden mb-2">
                        {match.player2?.profileImageUrl ? (
                          <img src={match.player2.profileImageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">⚽</div>
                        )}
                      </div>
                      <span className="font-bold text-sm truncate max-w-[120px]">
                        {match.player2_is_dummy ? 'BYE / Walkover' : match.player2?.name || 'TBD'}
                      </span>
                      {match.player2 && (
                        <div className="flex items-center gap-1 text-[11px] text-[#c89850] font-mono mt-0.5">
                          <Gamepad2 className="w-3 h-3" />
                          <span>IGN</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    {match.status !== 'completed' ? (
                      <button
                        onClick={() => setSelectedMatchForSubmission(match)}
                        className="w-full py-2 px-3 rounded-xl bg-[#c89850]/20 hover:bg-[#c89850]/30 text-[#c89850] font-bold text-xs uppercase tracking-wider border border-[#c89850]/30 transition flex items-center justify-center gap-1.5"
                      >
                        <span>Submit Score / Claim Walkover</span>
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-between text-xs text-white/40">
                        <span className="font-semibold text-emerald-400/90 flex items-center gap-1">
                          ✓ Match Verified
                        </span>
                        {match.screenshot_url && (
                          <a
                            href={match.screenshot_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#c89850] hover:underline font-mono text-[11px]"
                          >
                            View Scoreboard
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 2: GROUP TABLES ─── */}
        {activeTab === 'groups' && (
          <div className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {groups.map((group) => {
              const groupParticipants = participants.filter(p => p.group_id === group.id);
              const groupMatches = matches.filter(m => m.group_id === group.id);
              const standings = calculateGroupStandings(groupParticipants, groupMatches);

              return (
                <div key={group.id} className="p-5 rounded-2xl bg-[#001738]/80 border border-white/10 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-black text-[#c89850] uppercase tracking-wider">
                      {group.name}
                    </h3>
                    <span className="text-xs text-white/40">Top 2 Qualify</span>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead className="text-white/40 uppercase font-bold border-b border-white/10 pb-2">
                      <tr>
                        <th className="py-2">#</th>
                        <th className="py-2">Player</th>
                        <th className="py-2 text-center">P</th>
                        <th className="py-2 text-center">W</th>
                        <th className="py-2 text-center">D</th>
                        <th className="py-2 text-center">L</th>
                        <th className="py-2 text-center">GD</th>
                        <th className="py-2 text-right font-black text-[#c89850]">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {standings.map((row) => (
                        <tr key={row.participant_id} className="hover:bg-white/5 transition">
                          <td className="py-2.5 font-bold text-white/50">{row.rank}</td>
                          <td className="py-2.5 font-bold text-white flex items-center gap-2">
                            {row.avatar_url && (
                              <img src={row.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                            )}
                            <span className="truncate max-w-[120px]">{row.player_name}</span>
                          </td>
                          <td className="py-2.5 text-center text-white/70">{row.played}</td>
                          <td className="py-2.5 text-center text-emerald-400">{row.won}</td>
                          <td className="py-2.5 text-center text-white/50">{row.drawn}</td>
                          <td className="py-2.5 text-center text-rose-400">{row.lost}</td>
                          <td className="py-2.5 text-center font-mono">
                            {row.gd > 0 ? `+${row.gd}` : row.gd}
                          </td>
                          <td className="py-2.5 text-right font-black text-[#c89850] text-sm">
                            {row.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── TAB 3: KNOCKOUT BRACKET ─── */}
        {activeTab === 'bracket' && (
          <div className="pt-6">
            <TournamentKnockoutBracket
              matches={matches}
              championName={selectedTournament?.champion_player_id ? 'Tournament Champion' : null}
            />
          </div>
        )}

        {/* ─── TAB 4: REGISTERED PLAYERS VISUAL SHOWCASE ─── */}
        {activeTab === 'participants' && (
          <div className="pt-6">
            {registrations.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/10 text-white/50 text-sm">
                No approved participants yet. Be the first to register!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="p-4 rounded-2xl bg-[#001738] border border-white/10 hover:border-[#c89850]/50 transition shadow-lg flex flex-col items-center text-center group relative overflow-hidden"
                  >
                    {/* Top Gold Corner Accent */}
                    <div className="absolute top-0 right-0 w-8 h-8 bg-[#c89850]/20 rounded-bl-2xl flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-[#c89850]" />
                    </div>

                    <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-[#c89850]/40 overflow-hidden mb-3 group-hover:scale-105 transition">
                      {reg.player?.profileImageUrl ? (
                        <img src={reg.player.profileImageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">⚽</div>
                      )}
                    </div>

                    <h4 className="font-black text-sm text-white truncate max-w-[130px]">
                      {reg.player?.name || 'Player'}
                    </h4>

                    <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-white/60">
                      <span className="flex items-center gap-1 font-mono text-[#c89850]">
                        <Gamepad2 className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{reg.game_id}</span>
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-white/40">
                        <Smartphone className="w-2.5 h-2.5" />
                        <span className="truncate max-w-[120px]">{reg.device_model}</span>
                      </span>
                    </div>

                    <button
                      onClick={() => setViewingPlayerCard(reg)}
                      className="mt-3 w-full py-1.5 px-2 rounded-xl bg-white/5 hover:bg-[#c89850] hover:text-[#00265a] text-white/80 font-bold text-[10px] uppercase tracking-wider transition flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Card</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 5: AWARDS & PODIUM ─── */}
        {activeTab === 'awards' && (
          <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-[#001738] border border-[#c89850]/40 text-center shadow-xl">
              <span className="text-4xl mb-2 block">🥇</span>
              <h4 className="text-xs uppercase font-bold text-[#c89850] tracking-widest">Champion</h4>
              <p className="text-xl font-black text-white mt-1">To Be Decided</p>
              <span className="text-xs text-white/40 mt-1 block">Gold Trophy & Permanent Profile Badge</span>
            </div>

            <div className="p-6 rounded-3xl bg-[#001738] border border-white/10 text-center shadow-xl">
              <span className="text-4xl mb-2 block">🥈</span>
              <h4 className="text-xs uppercase font-bold text-white/60 tracking-widest">Runner-up</h4>
              <p className="text-xl font-black text-white mt-1">To Be Decided</p>
              <span className="text-xs text-white/40 mt-1 block">Silver Medal & Profile Badge</span>
            </div>

            <div className="p-6 rounded-3xl bg-[#001738] border border-white/10 text-center shadow-xl">
              <span className="text-4xl mb-2 block">🥉</span>
              <h4 className="text-xs uppercase font-bold text-[#c89850]/70 tracking-widest">3rd Place</h4>
              <p className="text-xl font-black text-white mt-1">To Be Decided</p>
              <span className="text-xs text-white/40 mt-1 block">Bronze Medal Playoff Winner</span>
            </div>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {selectedTournament && (
        <TournamentRegistrationModal
          isOpen={isRegModalOpen}
          onClose={() => setIsRegModalOpen(false)}
          tournamentId={selectedTournament.id}
          tournamentTitle={selectedTournament.title}
          players={storePlayers}
          onRegistrationSuccess={() => {
            if (selectedTournament) fetchTournamentDetails(selectedTournament.id);
          }}
        />
      )}

      {/* Match Score & Auto-Win Submission Modal */}
      {selectedMatchForSubmission && (
        <MatchScoreSubmissionModal
          isOpen={Boolean(selectedMatchForSubmission)}
          onClose={() => setSelectedMatchForSubmission(null)}
          match={selectedMatchForSubmission}
          onSubmitted={() => {
            if (selectedTournament) fetchTournamentDetails(selectedTournament.id);
            setSelectedMatchForSubmission(null);
          }}
        />
      )}

      {/* View Official Tournament Player Card Modal */}
      {viewingPlayerCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-sm bg-[#001738] border border-[#c89850]/30 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setViewingPlayerCard(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white/70 hover:text-white transition z-20"
            >
              <X className="w-4 h-4" />
            </button>

            <TournamentPlayerCard
              playerName={viewingPlayerCard.player?.name || 'PLAYER'}
              playerAvatarUrl={viewingPlayerCard.player?.profileImageUrl}
              gameId={viewingPlayerCard.game_id}
              deviceModel={viewingPlayerCard.device_model}
              tournamentTitle={selectedTournament?.title}
              seasonName={selectedTournament?.season_name || 'SEASON 1 • 2026'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
