import { useState } from 'react';
import { Player } from '../types';
import { Avatar, Badge, Button, Modal, DeleteConfirm } from '@/shared/components';
import { usePlayerStats } from '../hooks/usePlayerStats';
import { useFootballStore } from '@/store/footballStore';
import { PlayerForm } from './PlayerForm';
import { MatchEntryForm } from '@/features/match-entries/components/MatchEntryForm';
import { RESULT_BADGE } from '@/shared/lib/constants';
import { cn } from '@/shared/lib/cn';

interface PlayerDetailProps {
  playerId: string;
  onBack: () => void;
}

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function PlayerDetail({ playerId, onBack }: PlayerDetailProps) {
  const { players, matchEntries, matches, updatePlayer, removePlayer, addMatchEntry } = useFootballStore();
  const player = players.find(p => p.id === playerId);
  const stats = usePlayerStats(playerId);
  
  const [modal, setModal] = useState<'edit' | 'addEntry' | 'delete' | null>(null);

  if (!player) {
    onBack();
    return null;
  }

  const entries = matchEntries.filter(me => me.playerId === playerId);
  const prevSeasons = player.seasons ?? [];

  return (
    <div>
      {modal === 'edit' && (
         <Modal title="Edit player" onClose={() => setModal(null)} isOpen wide>
           <PlayerForm 
             initial={player} 
             onSave={(d) => { updatePlayer({ ...d, id: player.id, createdAt: player.createdAt } as Player); setModal(null); }}
             onClose={() => setModal(null)} 
           />
         </Modal>
      )}
      {modal === 'addEntry' && (
        <Modal title="Add match entry" onClose={() => setModal(null)} isOpen wide>
           <MatchEntryForm 
             players={[player]} 
             matches={matches} 
             onSave={(d) => { addMatchEntry({ ...d, id: Math.random().toString(36).slice(2,9) } as any); setModal(null); }}
             onClose={() => setModal(null)} 
           />
        </Modal>
      )}
      <DeleteConfirm 
        isOpen={modal === 'delete'}
        label={player.name} 
        onConfirm={() => { removePlayer(playerId); onBack(); }}
        onClose={() => setModal(null)}
      />

      <div className="flex items-center gap-3 mb-5">
        <Button variant="secondary" size="sm" onClick={onBack}>← Back</Button>
        <span className="text-muted-foreground text-[12px]">Players /</span>
        <span className="text-[12px] font-semibold">{player.name}</span>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 mb-4 shadow-sm">
        <div className="flex gap-4 items-start flex-wrap">
          <Avatar name={player.name} size={64} src={player.profileImage} />
          <div className="flex-1">
            <div className="flex justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-bold text-[20px]">{player.name}</h2>
                <p className="text-muted-foreground text-[13px] font-medium">#{player.jersey || '—'} · {player.position}</p>
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {(player.tags ?? []).map(t => (
                    <Badge key={t} bg="#2e1065" c="#c4b5fd">{t}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="secondary" onClick={() => setModal('edit')}>✎ Edit</Button>
                <Button size="sm" variant="secondary" onClick={() => setModal('addEntry')}>+ Entry</Button>
                <Button size="sm" variant="danger" onClick={() => setModal('delete')}>Delete</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 mb-4 shadow-sm">
        <h3 className="font-semibold text-[14px] mb-3 border-b border-border pb-2">Career Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {[
            ['Matches', stats.totalMatches],
            ['Goals', stats.totalGoals],
            ['Goals Conceded', stats.totalGoalsConceded],
            ['Wins', stats.totalWins],
            ['Draws', stats.totalDraws],
            ['Losses', stats.totalLosses],
            ['MOTM', stats.totalMOTM],
            ['Clean Sheets', stats.totalCleanSheets],
            ['Hat-tricks', stats.totalHattricks]
          ].map(([l, v]) => (
            <div key={l as string} className="bg-popover border border-border rounded-lg p-3 shadow-inner">
              <p className="text-muted-foreground text-[11px] mb-1">{l}</p>
              <p className="text-[20px] font-bold text-foreground">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 mb-4 shadow-sm">
        <h3 className="font-semibold text-[14px] mb-3">Season Breakdown</h3>
        <div className="flex gap-3 flex-wrap">
          {stats.seasonBreakdown.map(sb => (
             <div key={'old-'+sb.year} className="bg-popover border border-border py-2 px-3 rounded-lg text-[12px] flex items-center gap-2">
                <span className="bg-primary/20 text-primary px-1.5 rounded">{sb.year}</span>
                <span className="text-muted-foreground text-[11px]">Historic</span>
                <span className="font-medium">{sb.goals} goals</span>
                <span className="text-muted-foreground">·</span>
                <span>{sb.matches} matches</span>
             </div>
          ))}
          {stats.liveEntryBreakdown.map(sb => (
             <div key={'live-'+sb.year} className="bg-popover border border-border py-2 px-3 rounded-lg text-[12px] flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-400 px-1.5 rounded">{sb.year}</span>
                <span className="text-muted-foreground text-[11px]">Live entries</span>
                <span className="font-medium">{sb.goals} goals</span>
                <span className="text-muted-foreground">·</span>
                <span>{sb.matches} matches</span>
             </div>
          ))}
          {stats.seasonBreakdown.length === 0 && stats.liveEntryBreakdown.length === 0 && (
             <p className="text-muted-foreground text-[12px]">No data available yet.</p>
          )}
        </div>
      </div>

      {prevSeasons.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-4 shadow-sm">
          <p className="font-semibold mb-3 text-[13px]">Detailed Historic Stats</p>
          {prevSeasons.map((s, si) => (
            <div key={si} className="mb-4 bg-muted/30 p-3 rounded-lg border border-border/50">
              <p className="text-[13px] text-primary font-semibold mb-2">Season {s.year}</p>
              {s.monthlyStats.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">No monthly data for this season</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {s.monthlyStats.map((m, mi) => (
                    <div key={mi} className="bg-popover border border-border rounded-lg overflow-hidden">
                      <p className="text-[11px] font-medium bg-muted px-2 py-1.5 border-b border-border">
                        {MONTHS_SHORT[m.month - 1] || ('Month ' + m.month)}
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px] text-left">
                          <thead className="text-muted-foreground">
                            <tr>
                              {['Wk','MP','W','L','D','GF','GA','HT','MOTM','CS'].map(h => (
                                <th key={h} className="px-1.5 py-1 font-medium border-b border-border text-center">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {m.weeklyStats.map((w, wi) => (
                              <tr key={wi} className="hover:bg-muted/50 transition-colors">
                                {[w.week, w.matches, w.win, w.loss, w.draw, w.goalsScored, w.goalsConceded, w.hattricks, w.motm, w.cleanSheet].map((v, i) => (
                                  <td key={i} className={cn("px-1.5 py-1 text-center", i === 7 && (v as number) > 0 ? "text-accent-foreground font-bold" : "")}>
                                    {v}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <p className="font-semibold mb-3 text-[13px]">Live Match Entries</p>
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-[12px] bg-muted/30 p-4 rounded-lg border border-border/50 text-center">No entries yet. Click "+ Entry" above.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-[12px] text-left">
              <thead className="bg-muted text-muted-foreground border-b border-border">
                <tr>
                  {['Date','Goals','Conceded','Result','Flags','Notes'].map(h => (
                    <th key={h} className="px-3 py-2.5 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-popover">
                {entries.map(e => {
                  const rb = RESULT_BADGE[e.result as keyof typeof RESULT_BADGE] ?? RESULT_BADGE.draw;
                  return (
                    <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{e.date}</td>
                      <td className="px-3 py-2.5 font-bold text-cyan-400">{e.goals}</td>
                      <td className="px-3 py-2.5 text-red-400 font-medium">{e.goalsConceded}</td>
                      <td className="px-3 py-2.5"><Badge bg={rb.bg} c={rb.c}>{e.result}</Badge></td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1.5 flex-wrap">
                          {e.hattricks > 0 && <Badge bg="#2e1065" c="#c4b5fd" className="border border-purple-500/30 text-[10px] px-1.5 py-0">HT×{e.hattricks}</Badge>}
                          {e.motm && <Badge bg="#78350f" c="#fcd34d" className="border border-amber-500/30 text-[10px] px-1.5 py-0">MOTM</Badge>}
                          {e.cleanSheet && <Badge bg="#1e3a5f" c="#93c5fd" className="border border-blue-500/30 text-[10px] px-1.5 py-0">CS</Badge>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground max-w-[160px] truncate">{e.notes || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
