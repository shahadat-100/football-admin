import { Avatar } from '@/shared/components';
import { Player, SeasonDb } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Stats {
  totalMatches: number;
  totalGoals: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  totalMOTM: number;
  totalCleanSheets: number;
  totalHattricks: number;
  totalGoalsConceded: number;
}

interface HistoryEntry {
  id: string | number;
  date: string;
  result: 'win' | 'draw' | 'loss';
  goals?: number;
}

export interface PlayerHeroCardProps {
  player: Player;
  stats: Stats;
  historyEntries: HistoryEntry[];
  currentRank?: number;
  currentSeasonRank?: number;
  currentSeason?: SeasonDb | null;
  onEdit: () => void;
  onAddEntry: () => void;
  onRepair: () => void;
  onMilestones: () => void;
  onDelete: () => void;
  recheckLoading?: boolean;
  recheckResult?: string | null;
}

// ─── Football Pitch Fallback SVG ─────────────────────────────────────────────

function FootballPitchOverlay() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 800 300"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.06 }}
    >
      {/* Outer pitch */}
      <rect x="40" y="20" width="720" height="260" rx="4" fill="none" stroke="white" strokeWidth="2" />
      {/* Centre circle */}
      <circle cx="400" cy="150" r="55" fill="none" stroke="white" strokeWidth="2" />
      {/* Centre line */}
      <line x1="400" y1="20" x2="400" y2="280" stroke="white" strokeWidth="2" />
      {/* Centre spot */}
      <circle cx="400" cy="150" r="3" fill="white" />
      {/* Left penalty area */}
      <rect x="40" y="80" width="120" height="140" fill="none" stroke="white" strokeWidth="2" />
      {/* Left 6-yard box */}
      <rect x="40" y="115" width="50" height="70" fill="none" stroke="white" strokeWidth="2" />
      {/* Left penalty spot */}
      <circle cx="130" cy="150" r="2.5" fill="white" />
      {/* Left penalty arc */}
      <path d="M 160 113 A 55 55 0 0 1 160 187" fill="none" stroke="white" strokeWidth="2" />
      {/* Right penalty area */}
      <rect x="640" y="80" width="120" height="140" fill="none" stroke="white" strokeWidth="2" />
      {/* Right 6-yard box */}
      <rect x="710" y="115" width="50" height="70" fill="none" stroke="white" strokeWidth="2" />
      {/* Right penalty spot */}
      <circle cx="670" cy="150" r="2.5" fill="white" />
      {/* Right penalty arc */}
      <path d="M 640 113 A 55 55 0 0 0 640 187" fill="none" stroke="white" strokeWidth="2" />
      {/* Corner arcs */}
      <path d="M 40 30 A 12 12 0 0 1 52 20" fill="none" stroke="white" strokeWidth="1.5" />
      <path d="M 748 20 A 12 12 0 0 1 760 32" fill="none" stroke="white" strokeWidth="1.5" />
      <path d="M 40 268 A 12 12 0 0 0 52 280" fill="none" stroke="white" strokeWidth="1.5" />
      <path d="M 748 280 A 12 12 0 0 0 760 268" fill="none" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

// ─── Radar Chart (6-axis, custom SVG) ────────────────────────────────────────

function HeroRadarChart({ stats }: { stats: Stats }) {
  const cx = 110;
  const cy = 100;
  const R = 75;

  const axes = [
    { label: 'Goals',    value: stats.totalGoals },
    { label: 'Wins',     value: stats.totalWins },
    { label: 'MOTM',     value: stats.totalMOTM },
    { label: 'CS',       value: stats.totalCleanSheets },
    { label: 'HT',       value: stats.totalHattricks },
    { label: 'Matches',  value: stats.totalMatches },
  ];

  const n = axes.length;
  const maxVal = Math.max(...axes.map(a => a.value), 1);

  const angleOf = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const tipPoint = (i: number, r: number): [number, number] => [
    cx + r * Math.cos(angleOf(i)),
    cy + r * Math.sin(angleOf(i)),
  ];

  // Concentric hexagon rings
  const rings = [0.33, 0.66, 1.0];

  const ringPath = (scale: number) => {
    const pts = axes.map((_, i) => tipPoint(i, R * scale));
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ') + ' Z';
  };

  const dataPath = (() => {
    const pts = axes.map((a, i) => tipPoint(i, R * (a.value / maxVal)));
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ') + ' Z';
  })();

  // Pill colors for the stat pills below
  const pillData = [
    { label: 'Goals',   value: stats.totalGoals,       color: '#60a5fa' },
    { label: 'Wins',    value: stats.totalWins,         color: '#4ade80' },
    { label: 'MOTM',    value: stats.totalMOTM,         color: '#fbbf24' },
    { label: 'CS',      value: stats.totalCleanSheets,  color: '#38bdf8' },
    { label: 'HT',      value: stats.totalHattricks,    color: '#c084fc' },
  ];

  return (
    <div className="flex flex-col items-center gap-3 h-full justify-center">
      <svg width="220" height="200" viewBox="0 0 220 200">
        {/* Axis lines */}
        {axes.map((_, i) => {
          const [x, y] = tipPoint(i, R);
          return <line key={i} x1={cx} y1={cy} x2={x.toFixed(2)} y2={y.toFixed(2)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
        })}

        {/* Concentric rings */}
        {rings.map((s, ri) => (
          <path key={ri} d={ringPath(s)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        ))}

        {/* Data polygon */}
        <path d={dataPath} fill="rgba(59,130,246,0.18)" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Data dots */}
        {axes.map((a, i) => {
          const [x, y] = tipPoint(i, R * (a.value / maxVal));
          return <circle key={i} cx={x.toFixed(2)} cy={y.toFixed(2)} r="3" fill="#3b82f6" />;
        })}

        {/* Axis labels */}
        {axes.map((a, i) => {
          const labelR = R + 16;
          const [x, y] = tipPoint(i, labelR);
          const anchor = x < cx - 4 ? 'end' : x > cx + 4 ? 'start' : 'middle';
          return (
            <text
              key={i}
              x={x.toFixed(2)}
              y={(y + 3).toFixed(2)}
              textAnchor={anchor}
              fontSize="9"
              fill="rgba(255,255,255,0.5)"
              fontFamily="system-ui, sans-serif"
            >
              {a.label}
            </text>
          );
        })}
      </svg>

      {/* Stat pills */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {pillData.map(p => (
          <span
            key={p.label}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: `${p.color}18`,
              color: p.color,
              border: `1px solid ${p.color}40`,
            }}
          >
            {p.value} {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PlayerHeroCard({
  player,
  stats,
  historyEntries,
  currentRank,
  currentSeasonRank,
  currentSeason,
  onEdit,
  onAddEntry,
  onRepair,
  onMilestones,
  onDelete,
  recheckLoading,
  recheckResult,
}: PlayerHeroCardProps) {
  const winRate = stats.totalMatches > 0
    ? Math.round((stats.totalWins / stats.totalMatches) * 100)
    : 0;

  const recent10 = [...historyEntries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
    .reverse();

  const hasCover = !!player.coverImageUrl;

  // ── Career stat grid items ──────────────────────────────────
  const careerStats = [
    { label: 'Matches',     value: stats.totalMatches,       accent: '#818cf8' },
    { label: 'Goals',       value: stats.totalGoals,         accent: '#60a5fa' },
    { label: 'Wins',        value: stats.totalWins,          accent: '#4ade80' },
    { label: 'MOTM',        value: stats.totalMOTM,          accent: '#fbbf24' },
    { label: 'Losses',      value: stats.totalLosses,        accent: '#f87171' },
    { label: 'Draws',       value: stats.totalDraws,         accent: '#fb923c' },
    { label: 'Clean Sheets',value: stats.totalCleanSheets,   accent: '#38bdf8' },
    { label: 'Hat-tricks',  value: stats.totalHattricks,     accent: '#c084fc' },
  ];

  // ── Tag renderer ───────────────────────────────────────────
  const tagStyle = (type: 'role' | 'custom' | 'string') => {
    if (type === 'role')   return { bg: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.9)',  border: 'rgba(255,255,255,0.18)' };
    if (type === 'custom') return { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24',                border: 'rgba(251,191,36,0.28)' };
    return               { bg: 'rgba(59,130,246,0.12)',          color: '#93c5fd',                border: 'rgba(59,130,246,0.28)' };
  };

  const allTags = [
    ...(player.playerRoles ?? []).map(t => ({ label: t, type: 'role' as const })),
    ...(player.customTags ?? []).map(t => ({ label: t, type: 'custom' as const })),
    ...(player.customStringTags ?? []).map(t => ({ label: t, type: 'string' as const })),
  ];

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
      style={{ minHeight: '300px' }}
    >
      {/* ── BACKGROUND ──────────────────────────────────────── */}
      {hasCover ? (
        <>
          <img
            src={player.coverImageUrl!}
            alt="cover"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          {/* Bottom 40% gradient overlay only */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, transparent 55%, rgba(10,15,30,0.85) 80%, rgba(10,15,30,0.97) 100%)',
            }}
          />
          {/* Subtle dark veil for left panel readability */}
          <div
            className="absolute inset-0 pointer-events-none lg:w-[70%]"
            style={{ background: 'linear-gradient(to right, rgba(10,15,30,0.55) 0%, transparent 100%)' }}
          />
        </>
      ) : (
        <>
          {/* Dark navy gradient fallback */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}
          />
          <FootballPitchOverlay />
        </>
      )}

      {/* ── ACTION BUTTONS (absolute top-right) ─────────────── */}
      <div className="absolute top-4 right-4 z-30 flex flex-wrap gap-1.5 justify-end max-w-[360px]">
        {[
          { label: '✎ Edit',       onClick: onEdit,       red: false },
          { label: '+ Entry',      onClick: onAddEntry,   red: false },
          { label: '🔧 Repair',    onClick: onRepair,     red: false },
          { label: recheckLoading ? '⏳…' : '🔔 Milestones', onClick: onMilestones, red: false },
          { label: 'Delete',       onClick: onDelete,     red: true  },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            disabled={btn.label.includes('⏳')}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            style={{
              background: btn.red ? 'rgba(220,38,38,0.45)' : 'rgba(0,0,0,0.50)',
              border: btn.red ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.20)',
              color: btn.red ? '#fca5a5' : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {recheckResult && (
        <div
          className={`absolute top-12 right-4 z-30 text-[11px] font-medium px-3 py-1.5 rounded-lg border ${
            recheckResult.startsWith('✅')
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
              : 'text-red-400 bg-red-500/10 border-red-500/30'
          }`}
        >
          {recheckResult}
        </div>
      )}

      {/* ── CONTENT GRID ─────────────────────────────────────── */}
      <div className="relative z-20 grid grid-cols-1 lg:grid-cols-[1fr_auto] min-h-[300px]">

        {/* LEFT SIDE ─────────────────────────────────────────── */}
        <div className="flex flex-col justify-end px-6 pb-6 pt-20 gap-4">

          {/* 1. Avatar + Name row */}
          <div className="flex items-center gap-4 flex-wrap">
            <div
              className="shrink-0 rounded-full overflow-hidden"
              style={{
                width: 72,
                height: 72,
                border: '2px solid rgba(255,255,255,0.85)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            >
              <Avatar name={player.name} size={72} src={player.profileImageUrl} />
            </div>

            <div className="flex flex-col gap-1">
              <h2
                className="text-2xl font-medium leading-tight"
                style={{ color: '#fff', letterSpacing: '-0.3px', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
              >
                {player.name}
              </h2>

              <div className="flex items-center gap-2 flex-wrap">
                {player.jerseyNumber != null && (
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(255,255,255,0.10)',
                      color: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(255,255,255,0.18)',
                    }}
                  >
                    #{player.jerseyNumber}
                  </span>
                )}
                {player.email && (
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {player.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Tags row — max 2 rows overflow hidden */}
          {allTags.length > 0 && (
            <div
              className="flex flex-wrap gap-1.5"
              style={{ maxHeight: '3.4rem', overflow: 'hidden' }}
            >
              {allTags.map((tag, idx) => {
                const s = tagStyle(tag.type);
                return (
                  <span
                    key={idx}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                  >
                    {tag.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* 3. Career stats grid — 4×2 */}
          <div className="grid grid-cols-4 gap-1.5">
            {careerStats.map(({ label, value, accent }) => (
              <div
                key={label}
                className="flex flex-col gap-0.5 rounded-xl px-2.5 py-2"
                style={{
                  background: 'rgba(0,0,0,0.42)',
                  border: `1px solid ${accent}30`,
                  backdropFilter: 'blur(6px)',
                }}
              >
                <span
                  className="text-[22px] font-black leading-none tabular-nums"
                  style={{ color: accent }}
                >
                  {value}
                </span>
                <span className="text-[9px] uppercase tracking-wider leading-none" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* 4. Bottom strip */}
          <div className="flex items-center gap-4 flex-wrap">

            {/* Recent form dots */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Form
              </span>
              <div className="flex gap-1">
                {recent10.length === 0
                  ? <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                  : recent10.map((e, i) => {
                      const isW = e.result === 'win';
                      const isD = e.result === 'draw';
                      const bg  = isW ? 'rgba(20,83,45,0.85)' : isD ? 'rgba(120,53,15,0.85)' : 'rgba(127,29,29,0.85)';
                      const col = isW ? '#4ade80' : isD ? '#fcd34d' : '#f87171';
                      const brd = isW ? 'rgba(74,222,128,0.3)' : isD ? 'rgba(252,211,77,0.3)' : 'rgba(248,113,113,0.3)';
                      return (
                        <div
                          key={e.id ?? i}
                          title={`${e.date} · ${e.result.toUpperCase()}`}
                          className="flex items-center justify-center font-black text-[10px] rounded cursor-default transition-transform hover:scale-110"
                          style={{ width: 22, height: 22, background: bg, color: col, border: `1px solid ${brd}` }}
                        >
                          {e.result.charAt(0).toUpperCase()}
                        </div>
                      );
                    })}
              </div>
            </div>

            {/* Thin divider */}
            <div className="self-stretch w-px" style={{ background: 'rgba(255,255,255,0.12)' }} />

            {/* Rank chips */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Rank
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {currentRank && (
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(251,191,36,0.85)', color: '#1c1917' }}
                  >
                    🏆 All-time #{currentRank}
                  </span>
                )}
                {currentSeasonRank && (
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(59,130,246,0.85)', color: '#fff' }}
                  >
                    📅 Season #{currentSeasonRank}
                    {currentSeason?.name ? ` · ${currentSeason.name.replace('Season ', '')}` : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Thin divider */}
            <div className="self-stretch w-px" style={{ background: 'rgba(255,255,255,0.12)' }} />

            {/* Win rate */}
            <div className="flex flex-col gap-1 min-w-[70px]">
              <span className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Win rate
              </span>
              <span className="text-[22px] font-black leading-none" style={{ color: '#4ade80' }}>
                {winRate}%
              </span>
              {/* Thin progress bar */}
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.10)', width: 72 }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${winRate}%`, background: 'linear-gradient(90deg,#22c55e,#4ade80)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE — Radar chart (desktop only) ───────────── */}
        <div
          className="hidden lg:flex flex-col justify-center items-center px-6 py-6"
          style={{
            borderLeft: '1px solid rgba(255,255,255,0.07)',
            minWidth: 240,
            backdropFilter: 'blur(6px)',
            background: 'rgba(0,0,0,0.25)',
          }}
        >
          <HeroRadarChart stats={stats} />
        </div>
      </div>
    </div>
  );
}
