import { useState } from 'react';
import { useFootballStore } from '@/store/footballStore';
import { Match } from '@/features/matches/types';
import { MatchForm } from '@/features/matches';
import { Button, Input, Modal, DeleteConfirm, Badge } from '@/shared/components';
import { fuzzyFilter } from '@/shared/lib/utils';
import { Search, Plus } from 'lucide-react';
import { STATUS_BADGE } from '@/shared/lib/constants';

export function Matches() {
  const { matches, addMatch, updateMatch, removeMatch } = useFootballStore();
  const [modal, setModal] = useState<{ type: 'add' | 'edit' | 'delete' | 'info', data?: Match } | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const visibleMatches = matches.filter(m => m.competition !== 'Bulk Season');
  const filtered = fuzzyFilter(visibleMatches, search, ['homeTeam', 'awayTeam', 'competition'])
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {modal?.type === 'add' && (
        <Modal title="Add match" onClose={() => setModal(null)} isOpen>
          <MatchForm 
            onSave={(d) => { addMatch({ ...d, id: Math.random().toString(36).slice(2,9) } as Match); setModal(null); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.type === 'edit' && modal.data && (
        <Modal title="Edit match" onClose={() => setModal(null)} isOpen>
          <MatchForm 
            initial={modal.data}
            onSave={(d) => { updateMatch({ ...d, id: modal.data!.id } as Match); setModal(null); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.type === 'info' && (
        <Modal title="Generated Match" onClose={() => setModal(null)} isOpen>
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
        label={`${modal?.data?.homeTeam} vs ${modal?.data?.awayTeam}`}
        onConfirm={() => { if (modal?.data) removeMatch(modal.data.id); setModal(null); }}
        onClose={() => setModal(null)}
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="font-bold text-[22px] mb-1">Matches</h2>
          <p className="text-muted-foreground text-[13px]">{visibleMatches.length} matches</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search matches..." 
              className="pl-9 w-full sm:w-[220px]"
            />
          </div>
          <Button onClick={() => setModal({ type: 'add' })}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Match
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {paginated.map(m => {
          const sb = STATUS_BADGE[m.status as keyof typeof STATUS_BADGE] ?? STATUS_BADGE.finished;
          return (
            <div key={m.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row items-center gap-6 shadow-sm hover:border-primary/50 transition-colors">
              <div className="flex-1 text-center sm:text-right">
                <p className="font-bold text-[15px]">{m.homeTeam}</p>
                <p className="text-muted-foreground text-[11px] uppercase tracking-wider mt-0.5">Home</p>
              </div>
              
              <div className="flex-shrink-0 text-center px-4 border-x border-border/50 min-w-[120px]">
                <p className="font-black text-[22px] tracking-[4px] font-mono text-foreground">
                  {m.status !== 'upcoming' ? `${m.homeScore} - ${m.awayScore}` : 'VS'}
                </p>
                <div className="flex gap-2 justify-center mt-2">
                  <Badge bg={sb.bg} c={sb.c}>{m.status}</Badge>
                </div>
                <p className="text-muted-foreground text-[11px] mt-2">{m.date}</p>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <p className="font-bold text-[15px]">{m.awayTeam}</p>
                <p className="text-muted-foreground text-[11px] uppercase tracking-wider mt-0.5">Away</p>
              </div>

               <div className="flex gap-2 items-center sm:ml-auto w-full sm:w-auto justify-center sm:justify-end border-t sm:border-none border-border pt-4 sm:pt-0 mt-2 sm:mt-0">
                  <Badge className="bg-muted text-muted-foreground hidden lg:block mr-2 border border-border/50">{m.competition}</Badge>
                  {m.id.startsWith('bulk-') ? (
                    <button 
                      onClick={() => setModal({ type: 'info' })}
                      className="text-[11px] text-gray-300 font-medium px-2 py-0.5 bg-gray-500/10 rounded border border-gray-500/20 hover:bg-gray-500/20 transition-colors"
                    >
                      Generated
                    </button>
                  ) : (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => setModal({ type: 'edit', data: m })}>✎ Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => setModal({ type: 'delete', data: m })}>✕</Button>
                    </>
                  )}
               </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center border-2 border-dashed border-border rounded-xl">
            <p className="text-muted-foreground text-[14px]">No matches found</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-card border border-border p-3 rounded-xl">
          <p className="text-[12px] text-muted-foreground">
            Showing {(page-1)*PAGE_SIZE + 1} to {Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length} matches
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
