import { forwardRef } from 'react';

export interface MatchDuel {
  matchNumber: number;
  leftPlayerName: string;
  leftPlayerAvatar?: string;
  rightPlayerName: string;
  rightPlayerAvatar?: string;
  leftGoals: number;
  rightGoals: number;
  result: 'win' | 'loss' | 'draw'; // from left player perspective
  isMotm?: boolean;
  cleanSheet?: boolean;
}

export interface SocialMatchPosterProps {
  matchId?: string | number;
  competition: string;
  date: string;
  homeClub: string;
  awayClub: string;
  homeScore: number;
  awayScore: number;
  homeLogoUrl?: string;
  awayLogoUrl?: string;
  matches: MatchDuel[];
  theme?: 'light' | 'dark';
  leagueBadge?: string;
}

function getInitials(name: string, max = 2): string {
  if (!name) return '??';
  return name
    .split(/\s+/)
    .filter(w => w && !/^the$/i.test(w))
    .map(w => w[0])
    .join('')
    .slice(0, max)
    .toUpperCase();
}

export const SocialMatchPoster = forwardRef<HTMLDivElement, SocialMatchPosterProps>(
  (
    {
      matchId = '12182',
      competition = 'BeFA Club World Cup 2026',
      date = '21 SEP 2026',
      homeClub = 'The Enigmatic Elite',
      awayClub = 'The Glitcher',
      homeScore = 25,
      awayScore = 7,
      homeLogoUrl,
      awayLogoUrl,
      matches = [],
      theme = 'light',
      leagueBadge = '🏆',
    },
    ref
  ) => {
    const isDark = theme === 'dark';

    // Summary calculations
    const totalGoals = matches.reduce((sum, m) => sum + (m.leftGoals + m.rightGoals), 0);
    const cleanSheets = matches.filter(m => m.cleanSheet || m.leftGoals === 0 || m.rightGoals === 0).length;
    
    // Biggest win duel
    let biggestWinStr = '0 - 0';
    let maxDiff = -1;
    matches.forEach(m => {
      const diff = Math.abs(m.leftGoals - m.rightGoals);
      if (diff > maxDiff) {
        maxDiff = diff;
        biggestWinStr = m.leftGoals >= m.rightGoals ? `${m.leftGoals} - ${m.rightGoals}` : `${m.rightGoals} - ${m.leftGoals}`;
      }
    });

    const totalPlayers = matches.length > 0 ? matches.length * 2 : 24;
    const isHomeWinner = homeScore > awayScore;
    const isAwayWinner = awayScore > homeScore;

    return (
      <div
        ref={ref}
        style={{
          width: '1080px',
          minHeight: '1350px',
          fontFamily: "'Barlow', 'Inter', sans-serif",
          boxSizing: 'border-box',
        }}
        className={`relative p-10 flex flex-col justify-between overflow-hidden select-none transition-colors ${
          isDark
            ? 'bg-gradient-to-b from-[#080C15] via-[#0B1220] to-[#0F172A] text-slate-100'
            : 'bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] text-slate-800'
        }`}
      >
        {/* Subtle Background Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `radial-gradient(${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* 1. TOP BAR */}
        <div className="relative z-10 flex items-center justify-between border-b pb-4 border-slate-300/40 dark:border-white/10">
          <div className="font-mono text-sm tracking-widest uppercase font-bold text-slate-500 dark:text-slate-400">
            ID: #{matchId}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{leagueBadge}</span>
            <span
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              className="text-3xl tracking-widest uppercase font-black text-slate-900 dark:text-white"
            >
              {competition.split(' ')[0] || 'MATCH'}
            </span>
          </div>
          <div className="font-mono text-xs tracking-widest uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/30 flex items-center gap-1.5">
            <span>⚡</span>
            <span>{matches.length} MAN V {matches.length} MAN</span>
          </div>
        </div>

        {/* 2. MAIN SCOREBOARD */}
        <div
          className={`relative z-10 mt-6 rounded-2xl p-6 border shadow-lg ${
            isDark
              ? 'bg-[#111827]/80 border-white/10 shadow-black/40'
              : 'bg-white border-slate-200/90 shadow-slate-200/80'
          }`}
        >
          <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-6">
            {/* Left / Home Team */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/40 bg-primary/10 flex items-center justify-center shadow-md">
                {homeLogoUrl ? (
                  <img src={homeLogoUrl} alt={homeClub} className="w-full h-full object-cover" />
                ) : (
                  <span
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    className="text-2xl font-bold text-primary"
                  >
                    {getInitials(homeClub)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  className="text-3xl md:text-4xl tracking-wider uppercase font-black truncate text-slate-900 dark:text-white"
                >
                  {homeClub}
                </div>
                {isHomeWinner && (
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/30 mt-1">
                    <span>🏆</span> WINNER
                  </div>
                )}
              </div>
            </div>

            {/* Score Pill */}
            <div
              className={`flex items-center justify-center px-8 py-3 rounded-2xl border shadow-inner ${
                isDark ? 'bg-black/50 border-white/10' : 'bg-slate-100/90 border-slate-200'
              }`}
            >
              <span
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                className={`text-6xl md:text-7xl font-black ${
                  homeScore > awayScore
                    ? 'text-emerald-500'
                    : homeScore < awayScore
                    ? 'text-rose-500'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {homeScore}
              </span>
              <span className="text-2xl font-bold text-slate-400 dark:text-slate-600 mx-4">×</span>
              <span
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                className={`text-6xl md:text-7xl font-black ${
                  awayScore > homeScore
                    ? 'text-emerald-500'
                    : awayScore < homeScore
                    ? 'text-rose-500'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {awayScore}
              </span>
            </div>

            {/* Right / Away Team */}
            <div className="flex items-center justify-end gap-4 text-right">
              <div className="min-w-0">
                <div
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  className="text-3xl md:text-4xl tracking-wider uppercase font-black truncate text-slate-900 dark:text-white"
                >
                  {awayClub}
                </div>
                {isAwayWinner && (
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/30 mt-1">
                    <span>🏆</span> WINNER
                  </div>
                )}
              </div>
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-rose-500/30 bg-rose-500/10 flex items-center justify-center shadow-md">
                {awayLogoUrl ? (
                  <img src={awayLogoUrl} alt={awayClub} className="w-full h-full object-cover" />
                ) : (
                  <span
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    className="text-2xl font-bold text-rose-500"
                  >
                    {getInitials(awayClub)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. COMPETITION & DATE SUB-HEADER */}
        <div className="relative z-10 mt-6 flex items-center justify-between">
          <div
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            className="text-3xl tracking-widest uppercase font-black text-slate-800 dark:text-white"
          >
            {competition}
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-lg border text-xs font-mono font-bold tracking-wider uppercase bg-white/70 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300">
              🗓️ {date}
            </div>
            <div className="px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase bg-amber-500 text-white shadow-sm flex items-center gap-1.5">
              <span>👥</span>
              <span>{matches.length} MATCHES</span>
            </div>
          </div>
        </div>

        {/* 4. PLAYER DUELS GRID (2 Columns of 6) */}
        <div className="relative z-10 mt-5 grid grid-cols-2 gap-3 flex-1 min-h-[520px]">
          {matches.map((m, idx) => {
            const isLeftWin = m.leftGoals > m.rightGoals;
            const isRightWin = m.rightGoals > m.leftGoals;
            const isDraw = m.leftGoals === m.rightGoals;

            // Border accent colors on left & right edges
            const leftBorderColor = isLeftWin ? '#10B981' : isLeftWin === false && !isDraw ? '#EF4444' : '#94A3B8';
            const rightBorderColor = isRightWin ? '#10B981' : isRightWin === false && !isDraw ? '#EF4444' : '#94A3B8';

            return (
              <div
                key={idx}
                style={{
                  borderLeft: `4px solid ${leftBorderColor}`,
                  borderRight: `4px solid ${rightBorderColor}`,
                }}
                className={`rounded-xl p-2.5 px-3 flex items-center justify-between gap-2 shadow-sm border-t border-b ${
                  isDark
                    ? 'bg-[#151D2F] border-white/5 shadow-black/20'
                    : 'bg-white border-slate-200/80 shadow-slate-100'
                }`}
              >
                {/* Left Player */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-300/60 dark:border-white/10">
                    {m.leftPlayerAvatar ? (
                      <img src={m.leftPlayerAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-black text-slate-500 dark:text-slate-400">
                        {getInitials(m.leftPlayerName)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold truncate text-slate-900 dark:text-slate-100">
                      {m.leftPlayerName}
                    </div>
                    {m.isMotm && (
                      <div className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-500 text-white leading-none">
                        👑 MVP
                      </div>
                    )}
                  </div>
                </div>

                {/* Center Match Score Pill */}
                <div className="flex flex-col items-center justify-center px-2 flex-shrink-0">
                  <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 leading-tight">
                    ⏱️ M-{m.matchNumber || idx + 1}
                  </span>
                  <div
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    className="text-2xl font-black tracking-wider flex items-center gap-1.5 leading-none mt-0.5"
                  >
                    <span className={isLeftWin ? 'text-emerald-500' : isDraw ? 'text-slate-500' : 'text-rose-500'}>
                      {m.leftGoals}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600 text-lg">-</span>
                    <span className={isRightWin ? 'text-emerald-500' : isDraw ? 'text-slate-500' : 'text-rose-500'}>
                      {m.rightGoals}
                    </span>
                  </div>
                </div>

                {/* Right Player */}
                <div className="flex items-center justify-end gap-2.5 min-w-0 flex-1 text-right">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold truncate text-slate-900 dark:text-slate-100">
                      {m.rightPlayerName}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-300/60 dark:border-white/10">
                    {m.rightPlayerAvatar ? (
                      <img src={m.rightPlayerAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-black text-slate-500 dark:text-slate-400">
                        {getInitials(m.rightPlayerName)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 5. SUMMARY STATS (4 Cards) */}
        <div className="relative z-10 mt-6 grid grid-cols-4 gap-3">
          {/* Total Goals */}
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3.5 shadow-sm ${
              isDark ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-xl flex-shrink-0">
              ⚽
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TOTAL GOALS</div>
              <div
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-0.5"
              >
                {totalGoals}
              </div>
            </div>
          </div>

          {/* Clean Sheets */}
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3.5 shadow-sm ${
              isDark ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl flex-shrink-0">
              🛡️
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CLEAN SHEETS</div>
              <div
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                className="text-2xl font-black text-emerald-500 leading-none mt-0.5"
              >
                {cleanSheets}
              </div>
            </div>
          </div>

          {/* Biggest Win */}
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3.5 shadow-sm ${
              isDark ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl flex-shrink-0">
              🔥
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">BIGGEST WIN</div>
              <div
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                className="text-2xl font-black text-amber-500 leading-none mt-0.5"
              >
                {biggestWinStr}
              </div>
            </div>
          </div>

          {/* Total Players */}
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3.5 shadow-sm ${
              isDark ? 'bg-[#111827] border-white/5' : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl flex-shrink-0">
              👥
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TOTAL PLAYERS</div>
              <div
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                className="text-2xl font-black text-blue-500 leading-none mt-0.5"
              >
                {totalPlayers}
              </div>
            </div>
          </div>
        </div>

        {/* 6. FOOTER */}
        <div className="relative z-10 mt-6 pt-4 border-t border-slate-300/40 dark:border-white/10 flex items-center justify-between text-xs">
          <div className="font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>FEDERATION</span>
            <span className="font-black text-slate-900 dark:text-slate-200">{homeClub.toUpperCase()}</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>OFFICIALS</span>
            <div className="flex -space-x-1.5 overflow-hidden">
              <span className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-300 text-[9px] font-bold text-center leading-5 text-slate-700">A</span>
              <span className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-400 text-[9px] font-bold text-center leading-5 text-white">B</span>
              <span className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-500 text-[9px] font-bold text-center leading-5 text-white">C</span>
            </div>
          </div>

          <div className="font-mono text-xs font-bold tracking-wider text-primary">
            🌐 @TheEnigmaticElite
          </div>
        </div>
      </div>
    );
  }
);

SocialMatchPoster.displayName = 'SocialMatchPoster';
