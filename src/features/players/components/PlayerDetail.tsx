import { useState } from 'react';
import { Player } from '../types';
import { Avatar, Badge, Button, Modal, DeleteConfirm } from '@/shared/components';
import { usePlayerStats } from '../hooks/usePlayerStats';
import { useFootballStore } from '@/store/footballStore';
import { PlayerForm } from './PlayerForm';
import { MatchEntryForm } from '@/features/match-entries/components/MatchEntryForm';
import { RESULT_BADGE } from '@/shared/lib/constants';
import { PlayerRadarChart } from './PlayerRadarChart';
import { PlayerFormHistory } from './PlayerFormHistory';

interface PlayerDetailProps {
  playerId: string;
  onBack: () => void;
}
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

  const historyEntries = [...entries]
    .sort((a, b) => {
      const dateTimeA = a.time ? `${a.date}T${a.time}` : (a.date ? `${a.date}T00:00:00` : 0);
      const dateTimeB = b.time ? `${b.date}T${b.time}` : (b.date ? `${b.date}T00:00:00` : 0);
      const dateA = new Date(dateTimeA).getTime();
      const dateB = new Date(dateTimeB).getTime();
      const validA = isNaN(dateA) ? 0 : dateA;
      const validB = isNaN(dateB) ? 0 : dateB;
      if (validA !== validB) return validB - validA;
      return String(b.id).localeCompare(String(a.id));
    })
    .slice(0, 50);

  return (
    <div>
      {modal === 'edit' && (
         <Modal title="Edit player" onClose={() => setModal(null)} isOpen wide>
           <PlayerForm 
             initial={player} 
             onSave={(d) => { updatePlayer({ ...d, id: player.id, createdAt: player.createdAt } as unknown as Player); setModal(null); }}
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
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
          <div className="flex gap-5 items-center flex-wrap flex-1">
            <Avatar name={player.name} size={100} src={player.profileImageUrl} />
            <div className="flex-1">
              <div className="flex justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-bold text-[26px]">{player.name}</h2>
                  <p className="text-muted-foreground text-[14px] font-medium">#{player.jerseyNumber || '—'}</p>
                  <div className="flex gap-1.5 flex-wrap mt-2">
                    {(player.playerRoles ?? []).map(t => (
                      <Badge key={t} bg="#1a1a1a" c="#e5e5e5">{t}</Badge>
                    ))}
                    {(player.customTags ?? []).map(t => (
                      <Badge key={t} bg="#4b5563" c="#e5e7eb">{t}</Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-[12px] bg-muted/30 p-2.5 rounded-lg border border-border/50 w-max flex-wrap">
                     {player.email && (
                       <>
                         <div className="flex items-center gap-2">
                            <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Email</span>
                            <span className="text-foreground font-semibold">{player.email}</span>
                         </div>
                         <div className="w-px h-4 bg-border hidden sm:block"></div>
                       </>
                     )}
                     <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Win Rate</span>
                        <span className="text-foreground font-semibold text-[#10b981]">
                          {stats.totalMatches > 0 ? Math.round((stats.totalWins / stats.totalMatches) * 100) : 0}%
                        </span>
                     </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap h-fit">
                  <Button size="sm" variant="secondary" onClick={() => setModal('edit')}>✎ Edit</Button>
                  <Button size="sm" variant="secondary" onClick={() => setModal('addEntry')}>+ Entry</Button>
                  <Button size="sm" variant="danger" onClick={() => setModal('delete')}>Delete</Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-auto lg:min-w-[250px] border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-8 flex justify-center">
             <PlayerRadarChart stats={{
               goals: stats.totalGoals,
               cleanSheets: stats.totalCleanSheets,
               motm: stats.totalMOTM,
               wins: stats.totalWins,
               matches: stats.totalMatches
             }} />
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

      <PlayerFormHistory entries={entries} />

      <div className="bg-card border border-border rounded-xl p-5 mb-4 shadow-sm">
        <h3 className="font-semibold text-[14px] mb-3">Season Breakdown</h3>
        <div className="flex gap-3 flex-wrap">
          {stats.seasonBreakdown.map(sb => (
             <div key={sb.year} className="bg-popover border border-border py-2 px-3 rounded-lg text-[12px] flex items-center gap-2">
                <span className="bg-primary/20 text-primary px-1.5 rounded">{sb.year}</span>
                <span className="font-medium">{sb.goals} goals</span>
                <span className="text-muted-foreground">·</span>
                <span>{sb.matches} matches</span>
             </div>
          ))}
          {stats.seasonBreakdown.length === 0 && (
             <p className="text-muted-foreground text-[12px]">No data available yet.</p>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 mb-4 shadow-sm">
        <h3 className="font-semibold text-[14px] mb-3">Last 10 Matches Form</h3>
        {(() => {
          const recent10 = historyEntries.slice(0, 10).reverse(); // oldest to newest for the chart
          if (recent10.length === 0) return <p className="text-muted-foreground text-[12px]">Not enough data</p>;

          const points = recent10.reduce((acc, entry) => {
            if (entry.result === 'win') return acc + 3;
            if (entry.result === 'draw') return acc + 1;
            return acc;
          }, 0);
          
          const maxPoints = recent10.length * 3;
          const percentage = (points / maxPoints) * 100;
          let formText = 'Low';
          let formColor = 'text-red-500';
          if (percentage >= 65) {
            formText = 'High';
            formColor = 'text-green-500';
          } else if (percentage >= 35) {
            formText = 'Average';
            formColor = 'text-amber-500';
          }

          return (
            <div className="flex flex-col gap-4">
              <div className="flex items-end gap-2 h-[60px]">
                {recent10.map((entry, i) => {
                  const isWin = entry.result === 'win';
                  const isDraw = entry.result === 'draw';
                  const height = isWin ? '100%' : (isDraw ? '50%' : '20%');
                  const bgColor = isWin ? 'bg-[#10b981]' : (isDraw ? 'bg-amber-500' : 'bg-red-500');
                  
                  return (
                    <div key={entry.id || i} className="group relative flex-1 flex flex-col justify-end items-center h-full">
                      <div 
                        className={`w-full max-w-[24px] rounded-t-sm ${bgColor} transition-all duration-300 hover:opacity-80 cursor-pointer`}
                        style={{ height }}
                      />
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-popover border border-border text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap z-10 transition-opacity">
                        {entry.date}: {entry.result.toUpperCase()}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center text-[13px] border-t border-border pt-3 mt-1">
                <span className="text-muted-foreground">Recent Form:</span>
                <span className={`font-bold ${formColor}`}>{formText}</span>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <p className="font-semibold mb-3 text-[13px]">Match Entries & History (Recent 50)</p>
        {historyEntries.length === 0 ? (
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
                {historyEntries.map(e => {
                  const rb = RESULT_BADGE[e.result as keyof typeof RESULT_BADGE] ?? RESULT_BADGE.draw;
                  return (
                    <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{e.date}</td>
                      <td className="px-3 py-2.5 font-bold text-foreground">{e.goals}</td>
                      <td className="px-3 py-2.5 text-red-400 font-medium">{e.goalsConceded}</td>
                      <td className="px-3 py-2.5"><Badge bg={rb.bg} c={rb.c}>{e.result}</Badge></td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1.5 flex-wrap">
                          {e.hattricks > 0 && <Badge bg="#1a1a1a" c="#e5e5e5" className="border border-gray-500/30 text-[10px] px-1.5 py-0">HT×{e.hattricks}</Badge>}
                          {e.motm && <Badge bg="#78350f" c="#fcd34d" className="border border-amber-500/30 text-[10px] px-1.5 py-0">MOTM</Badge>}
                          {e.cleanSheet && <Badge bg="#111111" c="#e5e5e5" className="border border-gray-500/30 text-[10px] px-1.5 py-0">CS</Badge>}
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
