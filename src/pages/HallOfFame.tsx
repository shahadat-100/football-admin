import { useState, useEffect } from 'react';
import { useFootballStore, HallOfFameEntry } from '@/store/footballStore';
import { HallOfFameForm } from '@/features/players';
import { Button, Modal, DeleteConfirm, Avatar, Badge } from '@/shared/components';
import { Plus, Award, Calendar, ChevronRight, Sparkles, Trash2, Edit } from 'lucide-react';

export function HallOfFame() {
  const { 
    hallOfFame, 
    players, 
    fetchHallOfFame, 
    addHallOfFameEntry, 
    updateHallOfFameEntry, 
    removeHallOfFameEntry 
  } = useFootballStore();

  const [modal, setModal] = useState<{ type: 'add' | 'edit' | 'delete', data?: HallOfFameEntry } | null>(null);

  useEffect(() => {
    fetchHallOfFame();
  }, [fetchHallOfFame]);

  const getPlayer = (id: string) => players.find(p => p.id === id);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Modals */}
      {modal?.type === 'add' && (
        <Modal title="Induct to Hall of Fame" onClose={() => setModal(null)} isOpen wide>
          <HallOfFameForm
            players={players}
            onSave={(d) => { addHallOfFameEntry(d); setModal(null); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.type === 'edit' && modal.data && (
        <Modal title="Edit Hall of Fame Entry" onClose={() => setModal(null)} isOpen wide>
          <HallOfFameForm
            initial={modal.data}
            players={players}
            onSave={(d) => { updateHallOfFameEntry({ ...d, id: modal.data!.id, createdAt: modal.data!.createdAt }); setModal(null); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      <DeleteConfirm
        isOpen={modal?.type === 'delete'}
        label={`Hall of Fame entry for ${getPlayer(modal?.data?.playerId ?? '')?.name ?? 'player'}`}
        onConfirm={() => { if (modal?.data) removeHallOfFameEntry(modal.data.id); setModal(null); }}
        onClose={() => setModal(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-8 gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            <h2 className="font-bold text-[24px]">Hall of Fame</h2>
          </div>
          <p className="text-muted-foreground text-[13px]">
            Recognizing the exceptional records and outstanding achievements of the Enigmatic Elites
          </p>
        </div>
        <div className="flex items-center">
          <Button onClick={() => setModal({ type: 'add' })}>
            <Plus className="w-4 h-4 mr-1.5" /> Induct Player
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hallOfFame.map(entry => {
          const player = getPlayer(entry.playerId);
          return (
            <div 
              key={entry.id}
              className="bg-card border border-border/60 hover:border-amber-500/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group flex flex-col justify-between"
            >
              {/* Background Glow */}
              <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full pointer-events-none group-hover:from-amber-500/20 transition-all"></div>
              
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={player?.name ?? 'Legend'} size={48} src={player?.profileImageUrl} className="border-2 border-amber-500/20" />
                    <div>
                      <p className="font-bold text-[16px] text-foreground leading-tight">{player?.name ?? 'Unknown Legend'}</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">#{player?.jerseyNumber ?? '—'}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge bg="#78350f" c="#fcd34d" className="border border-amber-500/20 font-bold tracking-wider text-[10px] px-2 py-0.5 flex items-center gap-1">
                      <Award size={11} className="shrink-0" />
                      {entry.category}
                    </Badge>
                    <Badge bg="#1a1a1a" c="#e5e5e5" className="border border-border/50 text-[10px] font-mono flex items-center gap-1">
                      <Calendar size={11} className="shrink-0" />
                      {entry.seasonText}
                    </Badge>
                  </div>
                </div>

                {/* Subtitle & Descriptions */}
                <div className="mb-4">
                  <h4 className="text-[13px] font-bold text-amber-400 mb-1.5 flex items-center gap-1">
                    <ChevronRight size={14} className="text-amber-500" />
                    {entry.subTitle}
                  </h4>
                  <p className="text-[12.5px] leading-relaxed text-muted-foreground bg-popover/35 p-3 rounded-lg border border-border/30 font-medium">
                    {entry.descriptions}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end border-t border-border/30 pt-3 mt-3">
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={() => setModal({ type: 'edit', data: entry })}
                  className="h-8 text-[11px]"
                >
                  <Edit size={12} className="mr-1" /> Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="danger" 
                  onClick={() => setModal({ type: 'delete', data: entry })}
                  className="h-8 text-[11px]"
                >
                  <Trash2 size={12} className="mr-1" /> Delete
                </Button>
              </div>
            </div>
          );
        })}

        {hallOfFame.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-border rounded-2xl bg-card/50 flex flex-col items-center justify-center">
            <Award className="w-12 h-12 text-muted-foreground/40 mb-3 animate-bounce" />
            <p className="text-muted-foreground text-[14px] font-medium">No one inducted into the Hall of Fame yet</p>
            <p className="text-muted-foreground text-[11px] mt-1">Click the button above to honor your first player</p>
          </div>
        )}
      </div>
    </div>
  );
}
