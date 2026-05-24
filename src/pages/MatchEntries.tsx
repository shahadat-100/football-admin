import { useState } from 'react';
import { useFootballStore } from '@/store/footballStore';
import { MatchEntry } from '@/features/match-entries/types';
import { MatchEntryForm } from '@/features/match-entries';
import { Button, Input, Modal, DeleteConfirm, Avatar, Badge } from '@/shared/components';
import { Search, Plus } from 'lucide-react';
import { RESULT_BADGE } from '@/shared/lib/constants';

export function MatchEntries() {
  const { matchEntries, players, matches, addMatchEntry, updateMatchEntry, removeMatchEntry } = useFootballStore();
  const [modal, setModal] = useState<{ type: 'add' | 'edit' | 'delete' | 'info', data?: MatchEntry } | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const getPlayer = (id: string) => players.find(p => p.id === id);
  const getMatch = (id: string) => matches.find(m => m.id === id);

  const filtered = matchEntries
    .filter(me => {
      if (!search) return true;
      const p = getPlayer(me.playerId);
      return p && p.name.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {modal?.type === 'add' && (
        <Modal title="Add match entry" onClose={() => setModal(null)} isOpen wide>
          <MatchEntryForm 
            players={players} matches={matches}
            onSave={(d) => { addMatchEntry({ ...d, id: Math.random().toString(36).slice(2,9) } as MatchEntry); setModal(null); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.type === 'edit' && modal.data && (
        <Modal title="Edit match entry" onClose={() => setModal(null)} isOpen wide>
          <MatchEntryForm 
            initial={modal.data} players={players} matches={matches}
            onSave={(d) => { updateMatchEntry({ ...d, id: modal.data!.id } as MatchEntry); setModal(null); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.type === 'info' && (
        <Modal title="Generated Entry" onClose={() => setModal(null)} isOpen>
          <div className="p-4">
            <p className="text-[14px] text-foreground mb-4">
              This match was automatically generated from **bulk season data**. 
            </p>
            <p className="text-[13px] text-muted-foreground mb-6">
              To correct any errors, please update the **Weekly Stats** in the player's profile. 
              The system will then automatically regenerate the match history to match your changes.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setModal(null)}>I understand</Button>
            </div>
          </div>
        </Modal>
      )}
      <DeleteConfirm 
        isOpen={modal?.type === 'delete'}
        label={`Entry for ${getPlayer(modal?.data?.playerId ?? '')?.name ?? 'player'}`}
        onConfirm={() => { if (modal?.data) removeMatchEntry(modal.data.id); setModal(null); }}
        onClose={() => setModal(null)}
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="font-bold text-[22px] mb-1">Match Entries</h2>
          <p className="text-muted-foreground text-[13px]">{matchEntries.length} entries total</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Filter by player..." 
              className="pl-9 w-full sm:w-[220px]"
            />
          </div>
          <Button onClick={() => setModal({ type: 'add' })}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Entry
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left">
            <thead className="bg-muted text-muted-foreground font-medium border-b border-border">
              <tr>
                {['Player','Match','Date','Goals','Conceded','Result','Flags','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-popover">
              {paginated.map(me => {
                const p = getPlayer(me.playerId);
                const m = getMatch(me.matchId);
                const rb = RESULT_BADGE[me.result as keyof typeof RESULT_BADGE] ?? RESULT_BADGE.draw;
                return (
                  <tr key={me.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={p?.name ?? 'Unknown'} size={28} src={p?.profileImage} />
                        <span className="font-semibold text-foreground">{p?.name ?? 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {m ? `${m.homeTeam} vs ${m.awayTeam}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{me.date}</td>
                    <td className="px-4 py-3 font-black text-gray-100 text-[15px]">{me.goals}</td>
                    <td className="px-4 py-3 font-semibold text-red-400">{me.goalsConceded}</td>
                    <td className="px-4 py-3"><Badge bg={rb.bg} c={rb.c}>{me.result}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {me.hattricks > 0 && <Badge bg="#1a1a1a" c="#e5e5e5" className="border border-gray-500/30 text-[10px] px-1.5 py-0">HT×{me.hattricks}</Badge>}
                        {me.motm && <Badge bg="#78350f" c="#fcd34d" className="border border-amber-500/30 text-[10px] px-1.5 py-0">MOTM</Badge>}
                        {me.cleanSheet && <Badge bg="#111111" c="#e5e5e5" className="border border-gray-500/30 text-[10px] px-1.5 py-0">CS</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {me.id.startsWith('bulk-') ? (
                          <button 
                            onClick={() => setModal({ type: 'info' })}
                            className="text-[11px] text-gray-300 font-medium px-2 py-0.5 bg-gray-500/10 rounded border border-gray-500/20 hover:bg-gray-500/20 transition-colors"
                          >
                            Generated
                          </button>
                        ) : (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => setModal({ type: 'edit', data: me })}>✎</Button>
                            <Button size="sm" variant="danger" onClick={() => setModal({ type: 'delete', data: me })}>✕</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">No entries found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 bg-card border border-border p-3 rounded-xl">
          <p className="text-[12px] text-muted-foreground">
            Showing {(page-1)*PAGE_SIZE + 1} to {Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length} entries
          </p>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0,0); }}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center px-3 text-[12px] font-medium border border-border rounded-md bg-muted/30">
              Page {page} of {totalPages}
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0,0); }}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
