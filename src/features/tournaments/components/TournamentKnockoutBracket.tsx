import React from 'react';
import { TournamentMatch, MatchStage } from '../types';
import { Trophy } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

interface TournamentKnockoutBracketProps {
  matches: TournamentMatch[];
  championName?: string | null;
}

/**
 * Ordered knockout stages (excluding third_place which is rendered separately).
 * The bracket dynamically detects which stages have matches and renders them.
 */
const KNOCKOUT_STAGE_ORDER: { stage: MatchStage; label: string; shortLabel: string }[] = [
  { stage: 'round_of_64', label: 'Round of 64', shortLabel: 'R64' },
  { stage: 'round_of_32', label: 'Round of 32', shortLabel: 'R32' },
  { stage: 'round_of_16', label: 'Round of 16', shortLabel: 'R16' },
  { stage: 'quarter_final', label: 'Quarter-Finals', shortLabel: 'QF' },
  { stage: 'semi_final', label: 'Semi-Finals', shortLabel: 'SF' },
  { stage: 'final', label: 'Grand Final', shortLabel: 'Final' },
];

export const TournamentKnockoutBracket: React.FC<TournamentKnockoutBracketProps> = ({
  matches,
  championName,
}) => {
  const thirdPlaceMatch = matches.find(m => m.stage === 'third_place');

  // Detect which stages actually have matches and collect them
  const activeRounds = KNOCKOUT_STAGE_ORDER
    .map(def => {
      const roundMatches = matches
        .filter(m => m.stage === def.stage)
        .sort((a, b) => (a.bracket_match_number || 0) - (b.bracket_match_number || 0));
      return { ...def, matches: roundMatches };
    })
    .filter(r => r.matches.length > 0);

  // ─── Single Match Card ───
  const MatchCard = ({
    match,
    title,
    compact = false,
  }: {
    match?: TournamentMatch;
    title: string;
    compact?: boolean;
  }) => {
    const isCompleted = match?.status === 'completed';
    const p1Won = isCompleted && match?.winner_id && match.winner_id === match.player1_id;
    const p2Won = isCompleted && match?.winner_id && match.winner_id === match.player2_id;

    return (
      <div className={cn(
        "bg-card border border-border rounded-xl shadow-sm overflow-hidden hover:border-primary/50 transition duration-200",
        compact ? "w-44" : "w-52"
      )}>
        <div className="bg-muted/40 px-3 py-1.5 text-[11px] font-bold text-muted-foreground flex items-center justify-between border-b border-border/50">
          <span>{title}</span>
          <span className={cn(
            'text-[10px] px-1.5 py-0.5 rounded font-bold uppercase',
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
                <img src={match.player1.profileImageUrl} alt="" className="w-6 h-6 rounded-full object-cover ring-1 ring-border" />
              ) : (
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px]">⚽</span>
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
                <img src={match.player2.profileImageUrl} alt="" className="w-6 h-6 rounded-full object-cover ring-1 ring-border" />
              ) : (
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px]">⚽</span>
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

  /**
   * Renders connector lines between two adjacent rounds.
   * Each pair of matches in the current round merges into one match in the next round.
   * @param matchCount - number of matches in the LEFT (current) round
   * @param isLast - whether the next round is the final
   */
  const ConnectorLines = ({ matchCount }: { matchCount: number }) => {
    // Number of pairs = matchCount / 2 (each pair feeds into one match of next round)
    const pairCount = Math.ceil(matchCount / 2);

    return (
      <div className="flex flex-col justify-around h-full w-10 flex-shrink-0">
        {Array.from({ length: pairCount }).map((_, i) => (
          <div key={i} className={cn("relative flex items-center", i > 0 && "mt-6")}>
            {/* Vertical bar connecting two matches */}
            <div className="h-[120px] border-r-2 border-border relative flex items-center">
              {/* Top arm */}
              <div className="absolute -top-[1px] right-0 w-5 border-t-2 border-border" />
              {/* Bottom arm */}
              <div className="absolute -bottom-[1px] right-0 w-5 border-b-2 border-border" />
              {/* Horizontal out */}
              <div className="w-5 border-t-2 border-border ml-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ─── Pair matches into groups of 2 for bracket display ───
  const pairMatches = (roundMatches: TournamentMatch[]) => {
    const pairs: TournamentMatch[][] = [];
    for (let i = 0; i < roundMatches.length; i += 2) {
      pairs.push(roundMatches.slice(i, i + 2));
    }
    return pairs;
  };

  // Determine if we should use compact cards (many rounds)
  const useCompact = activeRounds.length > 3;

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

      {/* ─── DYNAMIC BRACKET TREE ─── */}
      <div className={cn(
        "flex items-center justify-start gap-0 py-4 px-2",
        useCompact ? "min-w-[600px]" : "min-w-[780px]"
      )}>
        {activeRounds.map((round, roundIdx) => {
          const isFinal = round.stage === 'final';
          const isFirstRound = roundIdx === 0;
          const pairs = pairMatches(round.matches);

          return (
            <React.Fragment key={round.stage}>
              {/* Connector lines BEFORE this round (except for the first round) */}
              {!isFirstRound && roundIdx > 0 && (
                <ConnectorLines
                  matchCount={activeRounds[roundIdx - 1].matches.length}
                />
              )}

              {/* The round column */}
              <div className={cn(
                "flex flex-col justify-around",
                !isFirstRound && "pl-2"
              )}>
                {/* Round title */}
                <div className={cn(
                  "text-xs font-black uppercase tracking-wider mb-2 px-1 flex items-center gap-1",
                  isFinal ? "text-amber-500" : "text-muted-foreground"
                )}>
                  {isFinal && <Trophy className="w-3.5 h-3.5" />}
                  {round.label}
                </div>

                {/* Match cards */}
                {isFinal ? (
                  // Final is a single card
                  <MatchCard match={round.matches[0]} title="Grand Final" compact={useCompact} />
                ) : (
                  // Other rounds: show pairs with spacing
                  <div className="space-y-4">
                    {pairs.map((pair, pairIdx) => (
                      <div key={pairIdx} className={cn("space-y-4", pairIdx > 0 && "mt-4")}>
                        {pair.map((m, mIdx) => (
                          <MatchCard
                            key={m.id}
                            match={m}
                            title={`${round.shortLabel} ${pairIdx * 2 + mIdx + 1}`}
                            compact={useCompact}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* ─── 3RD PLACE PLAYOFF (separate section below the bracket) ─── */}
      {thirdPlaceMatch && (
        <div className="mt-8 pt-6 border-t border-border/50">
          <div className="max-w-xs mx-auto">
            <div className="text-xs font-black uppercase text-orange-400 tracking-wider mb-2 px-1 flex items-center gap-1.5">
              🥉 3rd Place Playoff
            </div>
            <MatchCard match={thirdPlaceMatch} title="3rd Place" />
          </div>
        </div>
      )}
    </div>
  );
};
