import React from 'react';
import { TournamentMatch } from '../types';
import { Trophy, Award } from 'lucide-react';

interface TournamentKnockoutBracketProps {
  matches: TournamentMatch[];
  championName?: string | null;
  championAvatar?: string | null;
}

export const TournamentKnockoutBracket: React.FC<TournamentKnockoutBracketProps> = ({
  matches,
  championName,
}) => {
  // Filter matches by knockout stages
  const qfMatches = matches.filter(m => m.stage === 'quarter_final').sort((a, b) => (a.bracket_match_number || 0) - (b.bracket_match_number || 0));
  const sfMatches = matches.filter(m => m.stage === 'semi_final').sort((a, b) => (a.bracket_match_number || 0) - (b.bracket_match_number || 0));
  const finalMatch = matches.find(m => m.stage === 'final');
  const thirdPlaceMatch = matches.find(m => m.stage === 'third_place');

  // Match Box Component
  const BracketMatchNode = ({ match, title }: { match?: TournamentMatch; title: string }) => {
    if (!match) {
      return (
        <div className="w-56 p-3 rounded-xl bg-white/5 border border-dashed border-white/10 text-center text-white/30 text-xs">
          {title} (TBD)
        </div>
      );
    }

    const p1Won = match.status === 'completed' && match.winner_id && match.winner_id === match.player1_id;
    const p2Won = match.status === 'completed' && match.winner_id && match.winner_id === match.player2_id;

    return (
      <div className="w-60 rounded-xl bg-[#001738] border border-white/10 shadow-lg overflow-hidden relative group hover:border-[#c89850]/50 transition">
        {/* Stage Header */}
        <div className="bg-[#00112a] px-3 py-1 text-[10px] font-mono uppercase text-[#c89850] font-bold flex items-center justify-between border-b border-white/5">
          <span>{title}</span>
          <span className="text-white/40">{match.status === 'completed' ? 'Final' : 'Scheduled'}</span>
        </div>

        {/* Competitors */}
        <div className="p-2 space-y-1">
          {/* Player 1 */}
          <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold transition ${
            p1Won ? 'bg-[#c89850]/20 text-[#c89850]' : 'text-white'
          }`}>
            <div className="flex items-center gap-2 truncate">
              {match.player1?.profileImageUrl ? (
                <img src={match.player1.profileImageUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">⚽</span>
              )}
              <span className="truncate">{match.player1?.name || 'TBD'}</span>
            </div>
            <span className="font-mono text-sm ml-2">
              {match.status === 'completed' ? match.player1_score ?? 0 : '-'}
            </span>
          </div>

          {/* Player 2 */}
          <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold transition ${
            p2Won ? 'bg-[#c89850]/20 text-[#c89850]' : 'text-white'
          }`}>
            <div className="flex items-center gap-2 truncate">
              {match.player2?.profileImageUrl ? (
                <img src={match.player2.profileImageUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">⚽</span>
              )}
              <span className="truncate">{match.player2?.name || 'TBD'}</span>
            </div>
            <span className="font-mono text-sm ml-2">
              {match.status === 'completed' ? match.player2_score ?? 0 : '-'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto py-6">
      {/* Champion Podium if Completed */}
      {championName && (
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-[#001738] via-[#00265a] to-[#001738] border-2 border-[#c89850] shadow-2xl text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#c89850] text-[#00265a] flex items-center justify-center mx-auto mb-3 shadow-lg animate-bounce">
            <Trophy className="w-9 h-9 fill-current" />
          </div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#c89850]">
            Official Champion
          </span>
          <h3 className="text-2xl font-black text-white mt-1 uppercase">
            {championName}
          </h3>
          <p className="text-white/60 text-xs mt-1">
            Undisputed Tournament Winner • Gold Badge Awarded
          </p>
        </div>
      )}

      {/* Bracket Tree Columns */}
      <div className="flex items-center justify-center gap-8 min-w-[700px] px-4">
        {/* Quarter Finals Column */}
        <div className="flex flex-col gap-6">
          <h4 className="text-xs uppercase font-black tracking-wider text-center text-[#c89850] mb-2 font-mono">
            Quarter-Finals
          </h4>
          {[0, 1, 2, 3].map(idx => (
            <BracketMatchNode key={idx} match={qfMatches[idx]} title={`QF ${idx + 1}`} />
          ))}
        </div>

        {/* Semi Finals Column */}
        <div className="flex flex-col gap-24">
          <h4 className="text-xs uppercase font-black tracking-wider text-center text-[#c89850] mb-2 font-mono">
            Semi-Finals
          </h4>
          {[0, 1].map(idx => (
            <BracketMatchNode key={idx} match={sfMatches[idx]} title={`SF ${idx + 1}`} />
          ))}
        </div>

        {/* Grand Final & 3rd Place Column */}
        <div className="flex flex-col gap-10">
          <div>
            <h4 className="text-xs uppercase font-black tracking-wider text-center text-[#c89850] mb-2 font-mono flex items-center justify-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              Championship Final
            </h4>
            <BracketMatchNode match={finalMatch} title="Grand Final" />
          </div>

          <div>
            <h4 className="text-[11px] uppercase font-bold tracking-wider text-center text-white/40 mb-2 font-mono flex items-center justify-center gap-1">
              <Award className="w-3 h-3" />
              3rd Place Playoff
            </h4>
            <BracketMatchNode match={thirdPlaceMatch} title="Bronze Match" />
          </div>
        </div>
      </div>
    </div>
  );
};
