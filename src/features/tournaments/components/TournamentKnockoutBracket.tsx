import React from 'react';
import { TournamentMatch } from '../types';
import { Trophy } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

interface TournamentKnockoutBracketProps {
  matches: TournamentMatch[];
  championName?: string | null;
}

export const TournamentKnockoutBracket: React.FC<TournamentKnockoutBracketProps> = ({
  matches,
  championName,
}) => {
  const qfMatches = matches
    .filter(m => m.stage === 'quarter_final')
    .sort((a, b) => (a.bracket_match_number || 0) - (b.bracket_match_number || 0));
  const sfMatches = matches
    .filter(m => m.stage === 'semi_final')
    .sort((a, b) => (a.bracket_match_number || 0) - (b.bracket_match_number || 0));
  const finalMatch = matches.find(m => m.stage === 'final');

  // A Single Match Card in the Bracket
  const MatchCard = ({
    match,
    title,
  }: {
    match?: TournamentMatch;
    title: string;
  }) => {
    const isCompleted = match?.status === 'completed';
    const p1Won = isCompleted && match?.winner_id && match.winner_id === match.player1_id;
    const p2Won = isCompleted && match?.winner_id && match.winner_id === match.player2_id;

    return (
      <div className="w-56 bg-card border border-border rounded-xl shadow-sm overflow-hidden hover:border-primary/50 transition duration-200">
        <div className="bg-muted/40 px-3 py-1.5 text-[11px] font-bold text-muted-foreground flex items-center justify-between border-b border-border/50">
          <span>{title}</span>
          <span className={cn(
            'text-[10px] px-1.5 py-0.2 rounded font-bold uppercase',
            isCompleted ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
          )}>
            {isCompleted ? 'Final' : 'Upcoming'}
          </span>
        </div>

        <div className="p-2 space-y-1">
          {/* Player 1 */}
          <div className={cn(
            'flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold transition',
            p1Won ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-foreground'
          )}>
            <div className="flex items-center gap-2 truncate">
              {match?.player1?.profileImageUrl ? (
                <img src={match.player1.profileImageUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[9px]">⚽</span>
              )}
              <span className="truncate">{match?.player1?.name || 'TBD'}</span>
            </div>
            <span className="font-mono text-xs ml-2 font-black">
              {isCompleted ? match?.player1_score ?? 0 : '-'}
            </span>
          </div>

          {/* Player 2 */}
          <div className={cn(
            'flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold transition',
            p2Won ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-foreground'
          )}>
            <div className="flex items-center gap-2 truncate">
              {match?.player2?.profileImageUrl ? (
                <img src={match.player2.profileImageUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[9px]">⚽</span>
              )}
              <span className="truncate">{match?.player2?.name || 'TBD'}</span>
            </div>
            <span className="font-mono text-xs ml-2 font-black">
              {isCompleted ? match?.player2_score ?? 0 : '-'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto py-6">
      {championName && (
        <div className="mb-8 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center max-w-sm mx-auto">
          <Trophy className="w-10 h-10 text-amber-500 mx-auto mb-2 animate-bounce" />
          <span className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Tournament Champion
          </span>
          <h3 className="text-2xl font-black text-foreground mt-1">
            {championName}
          </h3>
        </div>
      )}

      {/* ─── CONNECTED BRACKET TREE WITH DRAW CONNECTOR LINES ─── */}
      <div className="min-w-[780px] flex items-center justify-start gap-0 py-4 px-2">
        {/* ROUND 1: QUARTER FINALS (4 Matches) */}
        <div className="flex flex-col justify-around gap-6">
          <div className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-1 px-1">
            Quarter-Finals
          </div>

          {/* Pair 1 */}
          <div className="space-y-4">
            <MatchCard match={qfMatches[0]} title="QF 1" />
            <MatchCard match={qfMatches[1]} title="QF 2" />
          </div>

          {/* Pair 2 */}
          <div className="space-y-4 mt-6">
            <MatchCard match={qfMatches[2]} title="QF 3" />
            <MatchCard match={qfMatches[3]} title="QF 4" />
          </div>
        </div>

        {/* CONNECTING LINES: QF TO SF */}
        <div className="flex flex-col justify-around h-full w-12 flex-shrink-0 pt-6">
          {/* Top Branch Connector */}
          <div className="h-[148px] border-r-2 border-border relative flex items-center">
            {/* Upper arm from QF1 */}
            <div className="absolute -top-[1px] right-0 w-6 border-t-2 border-border" />
            {/* Lower arm from QF2 */}
            <div className="absolute -bottom-[1px] right-0 w-6 border-b-2 border-border" />
            {/* Horizontal line out to SF1 */}
            <div className="w-6 border-t-2 border-border ml-auto" />
          </div>

          {/* Bottom Branch Connector */}
          <div className="h-[148px] border-r-2 border-border relative flex items-center mt-12">
            {/* Upper arm from QF3 */}
            <div className="absolute -top-[1px] right-0 w-6 border-t-2 border-border" />
            {/* Lower arm from QF4 */}
            <div className="absolute -bottom-[1px] right-0 w-6 border-b-2 border-border" />
            {/* Horizontal line out to SF2 */}
            <div className="w-6 border-t-2 border-border ml-auto" />
          </div>
        </div>

        {/* ROUND 2: SEMI FINALS (2 Matches) */}
        <div className="flex flex-col justify-around gap-20 pl-2">
          <div className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-1 px-1">
            Semi-Finals
          </div>

          <div className="space-y-28">
            <MatchCard match={sfMatches[0]} title="Semi-Final 1" />
            <MatchCard match={sfMatches[1]} title="Semi-Final 2" />
          </div>
        </div>

        {/* CONNECTING LINES: SF TO FINAL */}
        <div className="flex flex-col justify-center h-full w-12 flex-shrink-0 pt-6">
          <div className="h-[240px] border-r-2 border-border relative flex items-center">
            {/* Upper arm from SF1 */}
            <div className="absolute -top-[1px] right-0 w-6 border-t-2 border-border" />
            {/* Lower arm from SF2 */}
            <div className="absolute -bottom-[1px] right-0 w-6 border-b-2 border-border" />
            {/* Horizontal line out to Final */}
            <div className="w-6 border-t-2 border-border ml-auto" />
          </div>
        </div>

        {/* ROUND 3: GRAND FINAL 🏆 */}
        <div className="flex flex-col justify-center pl-2">
          <div className="text-xs font-black uppercase text-amber-500 tracking-wider mb-2 px-1 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" />
            Grand Championship
          </div>
          <MatchCard match={finalMatch} title="Grand Final" />
        </div>
      </div>
    </div>
  );
};
