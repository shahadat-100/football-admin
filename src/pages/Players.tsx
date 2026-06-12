import { useState } from 'react';
import { useFootballStore } from '@/store/footballStore';
import { Player } from '@/features/players/types';
import { PlayerCard, PlayerDetail, PlayerForm } from '@/features/players';
import { Button, Input, Modal, DeleteConfirm } from '@/shared/components';
import { fuzzyFilter } from '@/shared/lib/utils';
import { Search, UserPlus } from 'lucide-react';

export function Players() {
  const { players, addPlayer, updatePlayer, removePlayer } = useFootballStore();
  const [modal, setModal] = useState<{ type: 'add' | 'edit' | 'delete', data?: Player } | null>(null);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (selectedId) {
    return <PlayerDetail playerId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  const filtered = fuzzyFilter(players, search, ['name']);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {modal?.type === 'add' && (
        <Modal title="Add player" onClose={() => setModal(null)} isOpen wide>
          <PlayerForm 
            onSave={(d) => { addPlayer({ ...d, id: Math.random().toString(36).slice(2,9), createdAt: new Date().toISOString() } as unknown as Player); setModal(null); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.type === 'edit' && modal.data && (
        <Modal title="Edit player" onClose={() => setModal(null)} isOpen wide>
          <PlayerForm 
            initial={modal.data}
            onSave={(d) => { updatePlayer({ ...d, id: modal.data!.id, createdAt: modal.data!.createdAt } as unknown as Player); setModal(null); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      <DeleteConfirm 
        isOpen={modal?.type === 'delete'}
        label={modal?.data?.name ?? ''}
        onConfirm={() => { if (modal?.data) removePlayer(modal.data.id); setModal(null); }}
        onClose={() => setModal(null)}
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="font-bold text-[22px] mb-1">Players</h2>
          <p className="text-muted-foreground text-[13px]">{players.length} registered players</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search players..." 
              className="pl-9 w-full sm:w-[220px]"
            />
          </div>
          <Button onClick={() => setModal({ type: 'add' })}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Player
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(p => (
          <PlayerCard 
            key={p.id} 
            player={p} 
            onView={() => setSelectedId(p.id)}
            onEdit={() => setModal({ type: 'edit', data: p })}
            onDelete={() => setModal({ type: 'delete', data: p })}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl">
            <p className="text-muted-foreground text-[14px]">No players found</p>
          </div>
        )}
      </div>
    </div>
  );
}
