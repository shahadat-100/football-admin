import { forwardRef } from 'react';

export interface MatchDuel {
  matchNumber?: number;
  // Support both naming conventions
  teePlayerName?: string;
  leftPlayerName?: string;
  teeAvatarUrl?: string;
  leftPlayerAvatar?: string;
  opponentName?: string;
  rightPlayerName?: string;
  goals?: number;
  leftGoals?: number;
  goalsConceded?: number;
  rightGoals?: number;
  result?: 'win' | 'loss' | 'draw';
  cleanSheet?: boolean;
  isMotm?: boolean;
}

export interface MotmPlayer {
  name: string;
  avatarUrl?: string;
  goals: number;
}

export interface SocialMatchPosterProps {
  matchId?: string | number;
  competition?: string;
  round?: string;
  date?: string;
  homeClub?: string;
  opponentClub?: string;
  awayClub?: string;
  homeScore?: number;
  awayScore?: number;
  homeLogoUrl?: string;
  awayLogoUrl?: string;
  handle?: string;
  motmPlayer?: MotmPlayer | null;
  matches?: MatchDuel[];
  hexOverlay?: boolean;
  statusOverride?: 'auto' | 'victory' | 'draw' | 'defeat';
  theme?: 'light' | 'dark';
}

function getInitials(name: string, max = 2): string {
  if (!name) return '??';
  return name
    .split(/\s+/)
    .filter(w => w && !/^the$/i.test(w))
    .map(w => w[0])
    .join('')
    .slice(0, max)
    .toUpperCase() || '??';
}

function getClubAbbreviation(name: string): string {
  if (!name) return 'OPP';
  const words = name
    .trim()
    .split(/[\s\-_]+/)
    .filter(Boolean);

  // Exclude common stop words like 'of', 'and', '&' so they do not appear in the short form acronym (e.g. United Warriors Pro -> UWP)
  const filtered = words.filter(w => !/^(of|and|&)$/i.test(w));
  const targetWords = filtered.length > 0 ? filtered : words;

  if (targetWords.length >= 2) {
    return targetWords.map(w => w[0]).join('').slice(0, 4).toUpperCase();
  }
  // Single word: take first 3 letters
  return targetWords[0].slice(0, 3).toUpperCase();
}

export const SocialMatchPoster = forwardRef<HTMLDivElement, SocialMatchPosterProps>(
  (
    {
      competition = 'BeFA Club World Cup 2026',
      date = '24 SEP 2026',
      homeClub = 'The Enigmatic Elite',
      opponentClub,
      awayClub = 'The Glitcher',
      homeScore = 25,
      awayScore = 7,
      homeLogoUrl = '',
      awayLogoUrl = '',
      handle = '@TheEnigmaticElite',
      motmPlayer,
      matches = [],
      hexOverlay = true,
      statusOverride = 'auto',
    },
    ref
  ) => {
    const finalOpponent = opponentClub || awayClub || 'The Glitcher';
    const opponentAbbr = getClubAbbreviation(finalOpponent);

    const dateUpper = date.toUpperCase();

    // Format matches rows
    const RC = {
      win: { t: '#6EE7B7', bg: 'rgba(16,185,129,0.14)', b: 'rgba(16,185,129,0.55)', g: 'rgba(16,185,129,0.18)' },
      draw: { t: '#FCD34D', bg: 'rgba(245,158,11,0.13)', b: 'rgba(245,158,11,0.55)', g: 'rgba(245,158,11,0.15)' },
      loss: { t: '#FDA4AF', bg: 'rgba(225,29,72,0.15)', b: 'rgba(225,29,72,0.6)', g: 'rgba(225,29,72,0.18)' },
    };

    const rows = matches.map(m => {
      const pName = m.teePlayerName || m.leftPlayerName || 'Player';
      const oppName = m.opponentName || m.rightPlayerName || 'Opponent';
      const goals = m.goals ?? m.leftGoals ?? 0;
      const goalsConceded = m.goalsConceded ?? m.rightGoals ?? 0;
      const avatarUrl = m.teeAvatarUrl || m.leftPlayerAvatar;

      let res = m.result;
      if (!res) {
        res = goals > goalsConceded ? 'win' : goals < goalsConceded ? 'loss' : 'draw';
      }

      const c = RC[res] || RC.draw;
      const isMotm = !!m.isMotm;
      const cleanSheet = !!(m.cleanSheet || goalsConceded === 0);
      const isHattrick = goals >= 3 && goals < 6;
      const isDoubleHattrick = goals >= 6;

      const badges: string[] = [];
      if (isMotm) badges.push('👑 MOTM');
      if (isDoubleHattrick) badges.push('🔥 DOUBLE HATTRICK');
      else if (isHattrick) badges.push('⚡ HATTRICK');
      if (cleanSheet) badges.push('🛡️ CS');

      return {
        teePlayerName: pName,
        teeAvatarUrl: avatarUrl,
        opponentName: oppName,
        goals,
        goalsConceded,
        result: res,
        isMotm,
        cleanSheet,
        isHattrick,
        isDoubleHattrick,
        badges,
        hasBadges: badges.length > 0,
        teeInitials: getInitials(pName, 2),
        oppInitials: getInitials(oppName, 2),
        ring: isMotm
          ? 'linear-gradient(135deg,#F7E7A6,#B8862B)'
          : 'linear-gradient(135deg,#22D3EE,#2F7BFF)',
        pillText: c.t,
        pillBg: c.bg,
        pillBorder: c.b,
        pillGlow: c.g,
      };
    });

    const record = { w: 0, d: 0, l: 0 };
    rows.forEach(m => {
      record[m.result === 'win' ? 'w' : m.result === 'loss' ? 'l' : 'd']++;
    });

    // Check if we have MOTM
    let mp = motmPlayer;
    if (mp === undefined) {
      // Find if any match was designated as MOTM
      const motmDuel = rows.find(m => m.isMotm);
      if (motmDuel) {
        mp = {
          name: motmDuel.teePlayerName,
          avatarUrl: motmDuel.teeAvatarUrl,
          goals: motmDuel.goals,
        };
      } else {
        mp = null;
      }
    }

    const hasMotm = !!(mp && mp.name);
    const motm = hasMotm && mp ? {
      ...mp,
      initials: getInitials(mp.name, 2),
    } : null;

    // Status Banner Logic
    const autoStatus = homeScore > awayScore ? 'victory' : homeScore < awayScore ? 'defeat' : 'draw';
    const activeStatus = (statusOverride && statusOverride !== 'auto') ? statusOverride : autoStatus;

    const S = {
      victory: {
        label: 'MATCH VICTORY',
        text: '#F4FFF8',
        bg: 'linear-gradient(90deg,rgba(16,185,129,0.28),rgba(212,167,60,0.30))',
        border: 'rgba(247,231,166,0.55)',
        glow: 'rgba(16,185,129,0.35)',
        dot: '#34D399',
      },
      draw: {
        label: 'MATCH DRAW',
        text: '#FFF7E0',
        bg: 'linear-gradient(90deg,rgba(245,158,11,0.22),rgba(245,158,11,0.10))',
        border: 'rgba(245,158,11,0.55)',
        glow: 'rgba(245,158,11,0.3)',
        dot: '#FBBF24',
      },
      defeat: {
        label: 'MATCH DEFEAT',
        text: '#FFF0F2',
        bg: 'linear-gradient(90deg,rgba(225,29,72,0.26),rgba(225,29,72,0.10))',
        border: 'rgba(251,113,133,0.55)',
        glow: 'rgba(225,29,72,0.32)',
        dot: '#FB7185',
      },
    }[activeStatus];

    // Grid row sizing based on whether MOTM is present or skipped
    const nRows = Math.max(1, Math.ceil(rows.length / 2));
    // If no MOTM, available height is much larger (~640px) vs (~470px) with MOTM
    const rowH = Math.min(84, Math.floor((!hasMotm ? 630 : 470 - (nRows - 1) * 10) / nRows));

    return (
      <div
        ref={ref}
        data-screen-label="Match Poster"
        style={{
          position: 'relative',
          width: '1080px',
          height: '1350px',
          overflow: 'hidden',
          background: 'linear-gradient(180deg,#080C15 0%,#0B1220 45%,#0F172A 100%)',
          fontFamily: "'Barlow', sans-serif",
          color: '#E8EEF8',
          boxSizing: 'border-box',
          userSelect: 'none',
        }}
      >
        <style>{`
          @keyframes motmSpin { to { transform: rotate(360deg); } }
          @keyframes motmPulse { 0%, 100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.06); } }
        `}</style>

        {/* Diagonal subtle line pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(45deg,rgba(255,255,255,0.018) 0 2px,transparent 2px 6px),repeating-linear-gradient(-45deg,rgba(0,0,0,0.25) 0 2px,transparent 2px 6px)',
            pointerEvents: 'none',
          }}
        />

        {/* Hex Overlay */}
        {hexOverlay && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100' fill='none' stroke='%23ffffff' stroke-opacity='0.045'/%3E%3Cpath d='M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34' fill='none' stroke='%23ffffff' stroke-opacity='0.045'/%3E%3C/svg%3E\")",
              WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 28%,#000 0%,transparent 100%)',
              maskImage: 'radial-gradient(ellipse 70% 55% at 50% 28%,#000 0%,transparent 100%)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Ambient Glows */}
        <div
          style={{
            position: 'absolute',
            left: '-220px',
            top: '120px',
            width: '760px',
            height: '620px',
            background: 'radial-gradient(circle,rgba(47,123,255,0.34) 0%,rgba(34,211,238,0.10) 40%,transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '-260px',
            top: '160px',
            width: '700px',
            height: '560px',
            background: 'radial-gradient(circle,rgba(244,63,122,0.16) 0%,transparent 65%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '-180px',
            width: '900px',
            height: '420px',
            marginLeft: '-450px',
            background: 'radial-gradient(ellipse,rgba(34,211,238,0.14) 0%,transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Massive TEE Watermark */}
        <div
          style={{
            position: 'absolute',
            right: '-30px',
            bottom: '40px',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '380px',
            lineHeight: 1,
            letterSpacing: '-6px',
            color: 'rgba(255,255,255,0.022)',
            pointerEvents: 'none',
          }}
        >
          TEE
        </div>

        {/* MAIN POSTER CONTENT CONTAINER */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '44px 56px 40px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* HEADER (Full Width, No Right-side Capsule or Date) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '58px',
                height: '58px',
                borderRadius: '50%',
                padding: '2px',
                flexShrink: 0,
                background: 'linear-gradient(135deg,#F7E7A6 0%,#D4A73C 40%,#FFF1C1 55%,#B8862B 100%)',
                boxShadow: '0 0 28px rgba(212,167,60,0.45)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: '#0B1220',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                }}
              >
                🏆
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '13px',
                  letterSpacing: '4px',
                  color: '#D4A73C',
                  fontWeight: 700,
                }}
              >
                OFFICIAL COMPETITION
              </div>
              <div
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: competition.length > 42 ? '34px' : competition.length > 30 ? '38px' : '44px',
                  lineHeight: 1.1,
                  letterSpacing: '1.5px',
                  background: 'linear-gradient(180deg,#FFFFFF 0%,#C9D6EA 100%)',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={competition}
              >
                {competition}
              </div>
            </div>
          </div>

          {/* DIVIDER LINE WITH CYAN DIAMOND */}
          <div
            style={{
              position: 'relative',
              height: '1px',
              margin: '24px 0 0',
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.14) 20%,rgba(255,255,255,0.14) 80%,transparent)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '-1px',
                width: '220px',
                height: '3px',
                marginLeft: '-110px',
                background: 'linear-gradient(90deg,transparent,#22D3EE,transparent)',
                boxShadow: '0 0 16px #22D3EE',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '-4px',
                width: '9px',
                height: '9px',
                marginLeft: '-4.5px',
                transform: 'rotate(45deg)',
                background: '#E8FBFF',
                boxShadow: '0 0 12px #22D3EE',
              }}
            />
          </div>

          {/* SCOREBOARD */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '250px minmax(0,1fr) 250px',
              alignItems: 'center',
              marginTop: '30px',
            }}
          >
            {/* HOME CLUB */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: '-20px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle,rgba(212,167,60,0.4) 0%,rgba(47,123,255,0.2) 40%,transparent 70%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    padding: '3px',
                    background: 'linear-gradient(135deg,#F7E7A6 0%,#D4A73C 45%,#B8862B 80%,#6B4E1B 100%)',
                    boxShadow: '0 0 25px rgba(212,167,60,0.5), inset 0 0 15px rgba(212,167,60,0.3)',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: '#120D08',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={homeLogoUrl || '/tee-logo.jpg'}
                      alt={homeClub}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        // Fallback if image fails to load
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '28px',
                  lineHeight: 1.05,
                  letterSpacing: '1.5px',
                  color: '#FFFFFF',
                  maxWidth: '240px',
                }}
              >
                {homeClub}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '3px',
                  color: '#D4A73C',
                  fontWeight: 700,
                }}
              >
                HOME
              </div>
            </div>

            {/* BIG SCORE */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '22px' }}>
              <div
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '200px',
                  lineHeight: 0.8,
                  letterSpacing: '-2px',
                  background: 'linear-gradient(180deg,#FFFFFF 0%,#BFF4FF 55%,#4FA3FF 100%)',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  filter: 'drop-shadow(0 0 28px rgba(34,211,238,0.45))',
                  paddingTop: '18px',
                }}
              >
                {homeScore}
              </div>
              <div
                style={{
                  position: 'relative',
                  width: '62px',
                  height: '62px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    transform: 'rotate(45deg)',
                    border: '1.5px solid rgba(34,211,238,0.7)',
                    background: 'rgba(10,20,40,0.8)',
                    boxShadow: '0 0 24px rgba(34,211,238,0.4), inset 0 0 14px rgba(34,211,238,0.25)',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '26px',
                    letterSpacing: '1px',
                    color: '#E8FBFF',
                  }}
                >
                  VS
                </div>
              </div>
              <div
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '200px',
                  lineHeight: 0.8,
                  letterSpacing: '-2px',
                  background: 'linear-gradient(180deg,#E3E7EF 0%,#8C97AA 100%)',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  opacity: 0.78,
                  paddingTop: '18px',
                }}
              >
                {awayScore}
              </div>
            </div>

            {/* AWAY CLUB */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: '-20px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle,rgba(244,63,122,0.3) 0%,rgba(255,255,255,0.05) 50%,transparent 70%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    padding: '3px',
                    background: 'linear-gradient(135deg,#FDA4C4 0%,#C0265E 60%,#4A0F2A 100%)',
                    boxShadow: '0 0 25px rgba(192,38,94,0.45)',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: 'linear-gradient(145deg,#24101A 0%,#12080D 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {awayLogoUrl ? (
                      <img src={awayLogoUrl} alt={finalOpponent} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                          background: 'radial-gradient(circle at 50% 35%,#350E22 0%,#160710 100%)',
                          userSelect: 'none',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: opponentAbbr.length > 3 ? '44px' : '52px',
                            lineHeight: 0.95,
                            letterSpacing: '2.5px',
                            background: 'linear-gradient(180deg,#FFFFFF 0%,#FDA4C4 50%,#F43F5E 100%)',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                            filter: 'drop-shadow(0 2px 14px rgba(244,63,94,0.6))',
                          }}
                        >
                          {opponentAbbr}
                        </div>
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '9px',
                            letterSpacing: '2.5px',
                            color: '#F47BA3',
                            fontWeight: 700,
                            opacity: 0.85,
                            marginTop: '2px',
                          }}
                        >
                          CLUB
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '28px',
                  lineHeight: 1.05,
                  letterSpacing: '1.5px',
                  color: '#FFFFFF',
                  maxWidth: '240px',
                }}
              >
                {finalOpponent}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '3px',
                  color: '#F47BA3',
                  fontWeight: 700,
                }}
              >
                AWAY
              </div>
            </div>
          </div>

          {/* STATUS BANNER */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '22px' }}>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '10px 34px',
                borderRadius: '999px',
                background: S.bg,
                border: `1px solid ${S.border}`,
                boxShadow: `0 0 40px ${S.glow}`,
              }}
            >
              <div
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: S.dot,
                  boxShadow: `0 0 12px ${S.dot}`,
                }}
              />
              <div
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '34px',
                  lineHeight: 1,
                  letterSpacing: '6px',
                  color: S.text,
                  paddingTop: '3px',
                }}
              >
                {S.label}
              </div>
              <div
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: S.dot,
                  boxShadow: `0 0 12px ${S.dot}`,
                }}
              />
            </div>
          </div>

          {/* MAN OF THE MATCH SECTION — ONLY IF hasMotm IS TRUE */}
          {hasMotm && motm && (
            <div
              style={{
                marginTop: '26px',
                padding: '1px',
                borderRadius: '22px',
                background:
                  'linear-gradient(110deg,rgba(247,231,166,0.9) 0%,rgba(184,134,43,0.35) 35%,rgba(255,255,255,0.08) 70%,rgba(212,167,60,0.6) 100%)',
                boxShadow: '0 18px 50px rgba(0,0,0,0.45), 0 0 40px rgba(212,167,60,0.12)',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  height: '148px',
                  borderRadius: '21px',
                  overflow: 'hidden',
                  background:
                    'linear-gradient(100deg,rgba(40,30,10,0.92) 0%,rgba(14,18,30,0.9) 45%,rgba(11,18,32,0.88) 100%)',
                  backdropFilter: 'blur(14px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '30px',
                  padding: '0 34px 0 30px',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    right: '28px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '170px',
                    lineHeight: 1,
                    letterSpacing: '4px',
                    color: 'rgba(247,231,166,0.06)',
                    pointerEvents: 'none',
                  }}
                >
                  MVP
                </div>
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '340px',
                    height: '100%',
                    background: 'radial-gradient(circle at 20% 50%,rgba(212,167,60,0.28) 0%,transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />
                <div style={{ position: 'relative', width: '104px', height: '104px', flexShrink: 0 }}>
                  {/* Halo pulse and spin */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: -16,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle,rgba(247,231,166,0.45) 0%,transparent 70%)',
                      animation: 'motmPulse 2.8s ease-in-out infinite',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: -5,
                      borderRadius: '50%',
                      background:
                        'conic-gradient(from 0deg,#FFF1C1,#D4A73C,rgba(184,134,43,0.1) 35%,#F7E7A6 55%,#B8862B 75%,#FFF1C1)',
                      animation: 'motmSpin 5s linear infinite',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      background: '#0B1220',
                      padding: '3px',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'linear-gradient(145deg,#3A2E12 0%,#141A2A 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {motm.avatarUrl ? (
                        <img src={motm.avatarUrl} alt={motm.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div
                          style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: '40px',
                            color: '#F7E7A6',
                            letterSpacing: '1px',
                          }}
                        >
                          {motm.initials}
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '-24px',
                      transform: 'translateX(-50%) rotate(-8deg)',
                      fontSize: '30px',
                      filter: 'drop-shadow(0 0 10px rgba(247,231,166,0.8))',
                    }}
                  >
                    👑
                  </div>
                </div>

                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '12px',
                      letterSpacing: '4px',
                      fontWeight: 700,
                      color: '#D4A73C',
                    }}
                  >
                    MAN OF THE MATCH
                  </div>
                  <div
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '58px',
                      lineHeight: 0.9,
                      letterSpacing: '1.5px',
                      background: 'linear-gradient(180deg,#FFF6D2 0%,#F2D27A 45%,#C9962F 100%)',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      filter: 'drop-shadow(0 2px 14px rgba(212,167,60,0.35))',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {motm.name}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                    <div
                      style={{
                        padding: '6px 13px',
                        borderRadius: '999px',
                        background: 'linear-gradient(135deg,#F7E7A6 0%,#D4A73C 60%,#B8862B 100%)',
                        color: '#1A1204',
                        fontSize: '14px',
                        fontWeight: 800,
                        letterSpacing: '0.5px',
                      }}
                    >
                      {motm.goals} Goals Scored
                    </div>
                    <div
                      style={{
                        padding: '6px 13px',
                        borderRadius: '999px',
                        border: '1px solid rgba(247,231,166,0.45)',
                        background: 'rgba(212,167,60,0.12)',
                        color: '#F7E7A6',
                        fontSize: '14px',
                        fontWeight: 700,
                      }}
                    >
                      MOTM Winner
                    </div>
                    <div
                      style={{
                        padding: '6px 13px',
                        borderRadius: '999px',
                        border: '1px solid rgba(34,211,238,0.4)',
                        background: 'rgba(34,211,238,0.10)',
                        color: '#9FEFFB',
                        fontSize: '14px',
                        fontWeight: 700,
                      }}
                    >
                      Match MVP
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DUELS HEADER */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: hasMotm ? '26px' : '36px',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  transform: 'rotate(45deg)',
                  background: '#22D3EE',
                  boxShadow: '0 0 10px #22D3EE',
                }}
              />
              <div
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '26px',
                  letterSpacing: '4px',
                  color: '#FFFFFF',
                  paddingTop: '2px',
                }}
              >
                PLAYER DUELS
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  letterSpacing: '2px',
                  color: '#6B7890',
                }}
              >
                {rows.length} MATCHES
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                letterSpacing: '1.5px',
                fontWeight: 700,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34D399' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                {record.w}W
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FBBF24' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
                {record.d}D
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FB7185' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E11D48' }} />
                {record.l}L
              </div>
            </div>
          </div>

          {/* DUELS GRID */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gridAutoRows: `${rowH}px`,
              gap: '10px 14px',
              alignContent: 'start',
            }}
          >
            {rows.map((m, idx) => (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) 80px minmax(0, 1fr)',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '0 14px',
                  borderRadius: '14px',
                  background:
                    'linear-gradient(90deg,rgba(47,123,255,0.07) 0%,rgba(255,255,255,0.025) 50%,rgba(244,63,122,0.04) 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(10px)',
                  boxSizing: 'border-box',
                }}
              >
                {/* LEFT PLAYER */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      flexShrink: 0,
                      borderRadius: '50%',
                      padding: '2px',
                      background: m.ring,
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'linear-gradient(145deg,#1A3263 0%,#0B1428 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {m.teeAvatarUrl ? (
                        <img src={m.teeAvatarUrl} alt={m.teePlayerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#CFEFFF', letterSpacing: '0.5px' }}>
                          {m.teeInitials}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        lineHeight: 1.18,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                        letterSpacing: '0.2px',
                      }}
                      title={m.teePlayerName}
                    >
                      {m.teePlayerName}
                    </div>
                  </div>
                </div>

                {/* SCORE PILL */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    height: '38px',
                    borderRadius: '10px',
                    background: m.pillBg,
                    border: `1px solid ${m.pillBorder}`,
                    boxShadow: `0 0 18px ${m.pillGlow}`,
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '27px',
                    lineHeight: 1,
                    letterSpacing: '1px',
                    color: m.pillText,
                    paddingTop: '3px',
                  }}
                >
                  <span>{m.goals}</span>
                  <span style={{ opacity: 0.5, fontSize: '20px' }}>–</span>
                  <span>{m.goalsConceded}</span>
                </div>

                {/* RIGHT OPPONENT */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', minWidth: 0 }}>
                  <div style={{ minWidth: 0, flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: '#E2E8F0',
                        lineHeight: 1.18,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                        textAlign: 'right',
                        letterSpacing: '0.2px',
                      }}
                      title={m.opponentName}
                    >
                      {m.opponentName}
                    </div>
                  </div>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      flexShrink: 0,
                      borderRadius: '50%',
                      border: '1.5px solid rgba(244,63,122,0.5)',
                      background: 'linear-gradient(145deg,#3A1024 0%,#1A0A14 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#FBB6CE',
                    }}
                  >
                    {m.oppInitials}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FOOTER */}
          <div
            style={{
              height: '1px',
              marginTop: '18px',
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.12) 15%,rgba(255,255,255,0.12) 85%,transparent)',
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              paddingTop: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '30px',
                  height: '34px',
                  clipPath: 'polygon(50% 0, 100% 13%, 100% 58%, 50% 100%, 0 58%, 0 13%)',
                  background: 'linear-gradient(160deg,#7DE8F7,#2F7BFF 60%,#0E2A66)',
                }}
              />
              <div
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '21px',
                  letterSpacing: '3px',
                  color: '#DCE4F0',
                  paddingTop: '2px',
                }}
              >
                {homeClub.toUpperCase()} <span style={{ color: '#22D3EE' }}>•</span> OFFICIAL MATCH REPORT
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: '#9FEFFB',
                }}
              >
                {handle}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12.5px',
                  letterSpacing: '1.5px',
                  color: '#6B7890',
                }}
              >
                {dateUpper}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

SocialMatchPoster.displayName = 'SocialMatchPoster';
