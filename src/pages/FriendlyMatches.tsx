import { useState, useMemo, useEffect } from 'react';
import { useFootballStore } from '@/store/footballStore';
import { Input } from '@/shared/components';
import { fuzzyFilter } from '@/shared/lib/utils';
import { Search, Swords } from 'lucide-react';

export function FriendlyMatches() {
  const { friendlyMatches, fetchFriendlyMatches, players, fetchPlayers } = useFootballStore();
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchFriendlyMatches(), fetchPlayers()]);
      setIsLoading(false);
    };
    load();
  }, [fetchFriendlyMatches, fetchPlayers]);

  const playerMap = useMemo(() => {
    const map = new Map<string, string>();
    players.forEach(p => map.set(p.id, p.name));
    return map;
  }, [players]);

  // Enrich matches with player names for search
  const enriched = useMemo(() =>
    friendlyMatches.map(m => ({
      ...m,
      player1Name: playerMap.get(m.player1Id) ?? 'Unknown',
      player2Name: playerMap.get(m.player2Id) ?? 'Unknown',
    })),
    [friendlyMatches, playerMap]
  );

  const filtered = fuzzyFilter(enriched, search, ['player1Name', 'player2Name', 'notes']);

  const getResult = (m: typeof enriched[0]) => {
    if (m.player1Goals > m.player2Goals) return { winner: m.player1Name, label: 'WIN', color: 'emerald' };
    if (m.player2Goals > m.player1Goals) return { winner: m.player2Name, label: 'WIN', color: 'emerald' };
    return { winner: null, label: 'DRAW', color: 'amber' };
  };

  if (isLoading) {
    return (
      <div className="animate-in fade-in duration-300 space-y-4">
        <div className="flex items-center justify-between mb-6 animate-pulse">
          <div className="h-6 w-48 bg-muted rounded-md" />
          <div className="h-9 w-48 bg-muted rounded-md" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="font-bold text-[22px] mb-1 flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" />
            Friendly Matches
          </h2>
          <p className="text-muted-foreground text-[13px]">{friendlyMatches.length} internal training matches</p>
        </div>
        <div className="flex gap-3 items-center justify-between sm:justify-end flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by player name..."
              className="pl-9 w-full sm:w-[220px]"
            />
          </div>
        </div>
      </div>

      {/* Match List */}
      <div className="grid gap-3">
        {filtered.map(m => {
          const result = getResult(m);
          return (
            <div key={m.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-sm hover:border-primary/40 transition-colors">
              {/* Player 1 */}
              <div className="flex-1 text-center sm:text-right">
                <p className={`font-bold text-[15px] ${m.player1Goals > m.player2Goals ? 'text-emerald-400' : 'text-foreground'}`}>
                  {m.player1Name}
                </p>
                <p className="text-muted-foreground text-[11px] uppercase tracking-wider mt-0.5">Player 1</p>
              </div>

              {/* Score */}
              <div className="flex-shrink-0 text-center px-4 border-x border-border/50 min-w-[130px]">
                <p className="font-black text-[26px] tracking-[6px] font-mono text-foreground">
                  {m.player1Goals} - {m.player2Goals}
                </p>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                  result.label === 'DRAW'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {result.label === 'DRAW' ? 'Draw' : `${result.winner} wins`}
                </span>
                <p className="text-muted-foreground text-[11px] mt-1.5">{m.date}</p>
              </div>

              {/* Player 2 */}
              <div className="flex-1 text-center sm:text-left">
                <p className={`font-bold text-[15px] ${m.player2Goals > m.player1Goals ? 'text-emerald-400' : 'text-foreground'}`}>
                  {m.player2Name}
                </p>
                <p className="text-muted-foreground text-[11px] uppercase tracking-wider mt-0.5">Player 2</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 items-center sm:ml-auto w-full sm:w-auto justify-center sm:justify-end border-t sm:border-none border-border pt-3 sm:pt-0 mt-1 sm:mt-0">
                {m.notes && (
                  <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border/50 max-w-[180px] truncate" title={m.notes}>
                    {m.notes}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-16 text-center border-2 border-dashed border-border rounded-xl">
            <Swords className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-[14px]">No friendly matches found</p>
            <p className="text-muted-foreground text-[12px] mt-1">Add one to start tracking internal training results</p>
          </div>
        )}
      </div>
    </div>
  );
}
