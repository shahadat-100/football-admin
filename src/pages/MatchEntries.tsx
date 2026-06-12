import { useState } from 'react';
import { useFootballStore } from '@/store/footballStore';
import { MatchEntry } from '@/features/match-entries/types';
import { MatchEntryForm } from '@/features/match-entries';
import { Button, Input, Modal, DeleteConfirm, Avatar, Badge } from '@/shared/components';
import { Search, Plus, Trophy, Target, TrendingUp, Star, Zap, Shield } from 'lucide-react';
import { RESULT_BADGE } from '@/shared/lib/constants';

export function MatchEntries() {
  const { matchEntries, players, matches, addMatchEntry, updateMatchEntry, removeMatchEntry } = useFootballStore();
  const [modal, setModal] = useState<{ type: 'add' | 'edit' | 'delete', data?: MatchEntry } | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'entries'>('overview');
  const PAGE_SIZE = 50;

  const getPlayer = (id: string) => players.find(p => p.id === id);

  // ── Aggregated totals ──────────────────────────────────────────
  const totals = matchEntries.reduce((acc, e) => ({
    matches: acc.matches + 1,
    goals: acc.goals + (e.goals || 0),
    conceded: acc.conceded + (e.goalsConceded || 0),
    wins: acc.wins + (e.result === 'win' ? 1 : 0),
    losses: acc.losses + (e.result === 'loss' ? 1 : 0),
    draws: acc.draws + (e.result === 'draw' ? 1 : 0),
    hattricks: acc.hattricks + (e.hattricks || 0),
    motm: acc.motm + (e.motm ? 1 : 0),
    cleanSheets: acc.cleanSheets + (e.cleanSheet ? 1 : 0),
  }), { matches: 0, goals: 0, conceded: 0, wins: 0, losses: 0, draws: 0, hattricks: 0, motm: 0, cleanSheets: 0 });

  const winRate = totals.matches > 0 ? Math.round((totals.wins / totals.matches) * 100) : 0;

  // ── Per-player breakdown ──────────────────────────────────────
  const playerStats = players.map(p => {
    const entries = matchEntries.filter(e => e.playerId === p.id);
    return {
      player: p,
      matches: entries.length,
      goals: entries.reduce((s, e) => s + (e.goals || 0), 0),
      conceded: entries.reduce((s, e) => s + (e.goalsConceded || 0), 0),
      wins: entries.filter(e => e.result === 'win').length,
      losses: entries.filter(e => e.result === 'loss').length,
      draws: entries.filter(e => e.result === 'draw').length,
      hattricks: entries.reduce((s, e) => s + (e.hattricks || 0), 0),
      motm: entries.filter(e => e.motm).length,
      cleanSheets: entries.filter(e => e.cleanSheet).length,
    };
  }).filter(ps => ps.matches > 0).sort((a, b) => b.goals - a.goals);

  // ── Filtered entries ──────────────────────────────────────────
  const filtered = matchEntries
    .filter(me => {
      if (!search) return true;
      const p = getPlayer(me.playerId);
      return p && p.name.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const STAT_CARDS = [
    { label: 'Total Entries', value: totals.matches, icon: Trophy, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Goals Scored', value: totals.goals, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Win Rate', value: `${winRate}%`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'MOTM Awards', value: totals.motm, icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Hat-tricks', value: totals.hattricks, icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Clean Sheets', value: totals.cleanSheets, icon: Shield, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Modals */}
      {modal?.type === 'add' && (
        <Modal title="Add Match Entry" onClose={() => setModal(null)} isOpen wide>
          <MatchEntryForm
            players={players} matches={matches}
            onSave={(d) => { addMatchEntry({ ...d, id: Math.random().toString(36).slice(2, 9) } as MatchEntry); setModal(null); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.type === 'edit' && modal.data && (
        <Modal title="Edit Match Entry" onClose={() => setModal(null)} isOpen wide>
          <MatchEntryForm
            initial={modal.data} players={players} matches={matches}
            onSave={(d) => { updateMatchEntry({ ...d, id: modal.data!.id } as MatchEntry); setModal(null); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      <DeleteConfirm
        isOpen={modal?.type === 'delete'}
        label={`Entry for ${getPlayer(modal?.data?.playerId ?? '')?.name ?? 'player'}`}
        onConfirm={() => { if (modal?.data) removeMatchEntry(modal.data.id); setModal(null); }}
        onClose={() => setModal(null)}
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="font-bold text-[22px] mb-1">Match Entries</h2>
          <p className="text-muted-foreground text-[13px]">
            {totals.matches} entries · {totals.wins}W {totals.losses}L {totals.draws}D · {totals.goals} goals
          </p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by player..."
              className="pl-9 w-full sm:w-[200px]"
            />
          </div>
          <Button onClick={() => setModal({ type: 'add' })}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Entry
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {STAT_CARDS.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`${card.bg} border border-border rounded-xl p-3 flex flex-col gap-1`}>
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${card.color}`} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{card.label}</span>
              </div>
              <p className={`text-[22px] font-black ${card.color}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-muted/50 rounded-lg p-1 w-fit">
        {(['overview', 'entries'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors capitalize ${
              activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'overview' ? '📊 Player Overview' : '📋 All Entries'}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB — Per-player breakdown */}
      {activeTab === 'overview' && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-left">
              <thead className="bg-muted text-muted-foreground font-medium border-b border-border">
                <tr>
                  {['Player', 'Matches', 'W', 'L', 'D', 'Win%', 'Goals', 'Conceded', 'HT', 'MOTM', 'CS'].map(h => (
                    <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 bg-popover">
                {playerStats.map(ps => {
                  const wr = ps.matches > 0 ? Math.round((ps.wins / ps.matches) * 100) : 0;
                  return (
                    <tr key={ps.player.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={ps.player.name} size={28} src={ps.player.profileImageUrl} />
                          <div>
                            <p className="font-semibold text-foreground">{ps.player.name}</p>
                            <p className="text-[11px] text-muted-foreground">#{ps.player.jerseyNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-foreground">{ps.matches}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-400">{ps.wins}</td>
                      <td className="px-4 py-3 font-semibold text-red-400">{ps.losses}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ps.draws}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-1.5">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${wr}%` }} />
                          </div>
                          <span className="text-[12px] font-semibold">{wr}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-black text-[15px] text-gray-100">{ps.goals}</td>
                      <td className="px-4 py-3 font-semibold text-red-400">{ps.conceded}</td>
                      <td className="px-4 py-3">
                        {ps.hattricks > 0 ? <Badge bg="#1a1a1a" c="#e5e5e5" className="border border-gray-500/30 text-[10px]">HT×{ps.hattricks}</Badge> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {ps.motm > 0 ? <Badge bg="#78350f" c="#fcd34d" className="border border-amber-500/30 text-[10px]">★{ps.motm}</Badge> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {ps.cleanSheets > 0 ? <Badge bg="#111827" c="#67e8f9" className="border border-cyan-500/30 text-[10px]">CS×{ps.cleanSheets}</Badge> : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  );
                })}
                {playerStats.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-muted-foreground">
                      No match entries yet. Add entries manually.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ENTRIES TAB — All individual entries */}
      {activeTab === 'entries' && (
        <>
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-left">
                <thead className="bg-muted text-muted-foreground font-medium border-b border-border">
                  <tr>
                    {['Player', 'Date', 'Goals', 'Conceded', 'Result', 'Flags', 'Notes', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 bg-popover">
                  {paginated.map(me => {
                    const p = getPlayer(me.playerId);
                    const rb = RESULT_BADGE[me.result as keyof typeof RESULT_BADGE] ?? RESULT_BADGE.draw;
                    const isBulk = (me as any).source === 'bulk';
                    return (
                      <tr key={me.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={p?.name ?? 'Unknown'} size={26} src={p?.profileImageUrl} />
                            <span className="font-semibold text-foreground">{p?.name ?? 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{me.date}</td>
                        <td className="px-4 py-3 font-black text-gray-100 text-[15px]">{me.goals}</td>
                        <td className="px-4 py-3 font-semibold text-red-400">{me.goalsConceded}</td>
                        <td className="px-4 py-3"><Badge bg={rb.bg} c={rb.c}>{me.result}</Badge></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {me.hattricks > 0 && <Badge bg="#1a1a1a" c="#e5e5e5" className="border border-gray-500/30 text-[10px] px-1.5 py-0">HT×{me.hattricks}</Badge>}
                            {me.motm && <Badge bg="#78350f" c="#fcd34d" className="border border-amber-500/30 text-[10px] px-1.5 py-0">MOTM</Badge>}
                            {me.cleanSheet && <Badge bg="#111827" c="#67e8f9" className="border border-cyan-500/30 text-[10px] px-1.5 py-0">CS</Badge>}
                            {isBulk && <Badge bg="#1e1b4b" c="#a5b4fc" className="border border-indigo-500/30 text-[10px] px-1.5 py-0">Bulk</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{(me as any).notes || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {!isBulk && <Button size="sm" variant="secondary" onClick={() => setModal({ type: 'edit', data: me })}>✎</Button>}
                            <Button size="sm" variant="danger" onClick={() => setModal({ type: 'delete', data: me })}>✕</Button>
                          </div>
                        </td>
                      </tr>
                    );
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
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <div className="flex items-center px-3 text-[12px] font-medium border border-border rounded-md bg-muted/30">Page {page}/{totalPages}</div>
                <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
