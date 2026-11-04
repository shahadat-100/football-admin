import { TournamentParticipant, TournamentMatch, GroupStandingRow, MatchStage } from '../types';

/**
 * Calculates number of matchdays needed for any group size (even or odd).
 * E.g. Group of 4 -> 3 matchdays
 *      Group of 5 -> 5 matchdays (1 bye per round)
 *      Group of 6 -> 5 matchdays
 *      Group of 8 -> 7 matchdays
 */
export function getMatchdaysForGroupSize(groupSize: number): number {
  if (groupSize <= 1) return 1;
  return groupSize % 2 === 0 ? groupSize - 1 : groupSize;
}

/**
 * Calculates all chronological deadlines from Registration to Final.
 */
export function calculateTournamentTimeline(params: {
  startDate: Date;
  registrationDeadline: Date;
  groupMatchdaysCount: number;
  intervalDays: number;        // e.g. 2 days per matchday
  graceHours: number;          // e.g. 24 hours
  knockoutRoundsCount: number; // e.g. 3 for R16 -> QF -> SF -> Final
}) {
  const {
    registrationDeadline,
    groupMatchdaysCount,
    intervalDays,
    graceHours,
    knockoutRoundsCount
  } = params;

  const timeline: {
    stage: MatchStage;
    matchday?: number;
    title: string;
    playDeadline: Date;
    submissionDeadline: Date;
  }[] = [];

  let currentPlayCursor = new Date(registrationDeadline.getTime() + 24 * 60 * 60 * 1000); // 1 day after reg close

  // 1. Group Stage Matchdays
  for (let md = 1; md <= groupMatchdaysCount; md++) {
    const playDeadline = new Date(currentPlayCursor.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    const submissionDeadline = new Date(playDeadline.getTime() + graceHours * 60 * 60 * 1000);

    timeline.push({
      stage: 'group',
      matchday: md,
      title: `Group Stage - Matchday ${md}`,
      playDeadline,
      submissionDeadline
    });

    // Advance cursor to after submission deadline + small rest
    currentPlayCursor = new Date(submissionDeadline.getTime());
  }

  // 2. Tie Breakers Day buffer (if needed)
  const tieBreakerPlay = new Date(currentPlayCursor.getTime() + 1 * 24 * 60 * 60 * 1000);
  const tieBreakerSubmit = new Date(tieBreakerPlay.getTime() + graceHours * 60 * 60 * 1000);
  timeline.push({
    stage: 'tie_breaker',
    title: 'Tie-Breakers & Group Verification',
    playDeadline: tieBreakerPlay,
    submissionDeadline: tieBreakerSubmit
  });
  currentPlayCursor = new Date(tieBreakerSubmit.getTime());

  // 3. Knockout Stages (e.g. Round of 16, Quarter-Finals, Semi-Finals, Final)
  const knockoutStages: { stage: MatchStage; title: string }[] = [];
  if (knockoutRoundsCount >= 4) knockoutStages.push({ stage: 'round_of_32', title: 'Round of 32' });
  if (knockoutRoundsCount >= 3) knockoutStages.push({ stage: 'round_of_16', title: 'Round of 16' });
  if (knockoutRoundsCount >= 2) knockoutStages.push({ stage: 'quarter_final', title: 'Quarter-Finals' });
  if (knockoutRoundsCount >= 1) knockoutStages.push({ stage: 'semi_final', title: 'Semi-Finals' });
  knockoutStages.push({ stage: 'third_place', title: '3rd Place Playoff' });
  knockoutStages.push({ stage: 'final', title: 'Grand Final Championship' });

  for (const ko of knockoutStages) {
    const playDeadline = new Date(currentPlayCursor.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    const submissionDeadline = new Date(playDeadline.getTime() + graceHours * 60 * 60 * 1000);

    timeline.push({
      stage: ko.stage,
      title: ko.title,
      playDeadline,
      submissionDeadline
    });

    currentPlayCursor = new Date(submissionDeadline.getTime());
  }

  return timeline;
}

/**
 * Calculates equal groups of given size (default 6) and inserts BYE dummies if needed.
 */
export function partitionIntoEqualGroups<T extends { id: string; name: string }>(
  realParticipants: T[],
  groupSize: number = 6
) {
  const total = realParticipants.length;
  if (total === 0) return { groups: [], totalDummies: 0 };

  const remainder = total % groupSize;
  const missingSlots = remainder === 0 ? 0 : groupSize - remainder;
  const totalSlots = total + missingSlots;
  const totalGroupsCount = totalSlots / groupSize;

  // Generate Group Names: Group A, Group B, ... Group Z, Group AA, etc.
  const groupNames: string[] = [];
  for (let i = 0; i < totalGroupsCount; i++) {
    const letter = String.fromCharCode(65 + (i % 26));
    const prefix = i >= 26 ? `Group A${letter}` : `Group ${letter}`;
    groupNames.push(prefix);
  }

  // Shuffle real participants for random fair draw
  const shuffled = [...realParticipants].sort(() => Math.random() - 0.5);

  // Group buckets
  const groups: {
    name: string;
    participants: (T | { id: string; name: string; is_dummy: boolean })[];
  }[] = groupNames.map((name) => ({ name, participants: [] }));

  // Distribute real participants
  let gIdx = 0;
  for (const p of shuffled) {
    groups[gIdx].participants.push(p);
    gIdx = (gIdx + 1) % totalGroupsCount;
  }

  // Fill in dummies where needed
  let dummyIdCounter = 1;
  for (const g of groups) {
    while (g.participants.length < groupSize) {
      g.participants.push({
        id: `dummy_${dummyIdCounter}`,
        name: 'BYE / Walkover',
        is_dummy: true
      });
      dummyIdCounter++;
    }
  }

  return {
    groups,
    totalDummies: missingSlots,
    totalGroupsCount
  };
}

/**
 * Generates Round Robin fixtures for any group size (4, 5, 6, 8, etc.).
 * Uses standard Berger polygon rotation so every player plays 1 match per matchday.
 */
export function generateGroupFixtures(
  participants: { id: string; is_dummy?: boolean }[],
  deadlinesByMatchday: Record<number, { playDeadline: Date; submissionDeadline: Date }>
) {
  const list = [...participants];
  // If odd, add a dummy BYE slot so round-robin polygon rotates cleanly
  if (list.length % 2 !== 0) {
    list.push({ id: `bye_slot_${Math.random().toString(36).substring(7)}`, is_dummy: true });
  }

  const n = list.length;
  const matchdaysCount = n - 1;
  const matchesPerMatchday = n / 2;

  const fixtures: {
    matchday: number;
    player1_id: string;
    player2_id: string;
    player1_is_dummy: boolean;
    player2_is_dummy: boolean;
    is_auto_win: boolean;
    auto_win_player_id?: string;
    status: 'scheduled' | 'completed';
    play_deadline: Date;
    submission_deadline: Date;
  }[] = [];

  for (let round = 0; round < matchdaysCount; round++) {
    const md = round + 1;
    const deadlines = deadlinesByMatchday[md] || {
      playDeadline: new Date(),
      submissionDeadline: new Date()
    };

    for (let i = 0; i < matchesPerMatchday; i++) {
      const p1 = list[i];
      const p2 = list[n - 1 - i];

      const p1Dummy = Boolean(p1.is_dummy);
      const p2Dummy = Boolean(p2.is_dummy);
      const isAutoWin = p1Dummy || p2Dummy;
      const autoWinPlayerId = p1Dummy ? p2.id : p2Dummy ? p1.id : undefined;

      fixtures.push({
        matchday: md,
        player1_id: p1.id,
        player2_id: p2.id,
        player1_is_dummy: p1Dummy,
        player2_is_dummy: p2Dummy,
        is_auto_win: isAutoWin,
        auto_win_player_id: autoWinPlayerId,
        status: isAutoWin ? 'completed' : 'scheduled',
        play_deadline: deadlines.playDeadline,
        submission_deadline: deadlines.submissionDeadline
      });
    }

    // Polygon rotation: keep list[0] fixed, rotate list[1..n-1]
    const last = list.pop()!;
    list.splice(1, 0, last);
  }

  return fixtures;
}

/**
 * Calculates Group Standings based strictly on user rules:
 * 1. Total Points (Win=3, Draw=1, Loss=0, Inactive Draw=0)
 * 2. Goal Difference (GD = GF - GA)
 * 3. Goals For (GF)
 * 4. Least Goals Conceded (GA)
 * (NO Head-to-Head)
 */
export function calculateGroupStandings(
  participants: TournamentParticipant[],
  matches: TournamentMatch[]
): GroupStandingRow[] {
  const statsMap = new Map<string, GroupStandingRow>();

  for (const p of participants) {
    statsMap.set(p.id, {
      participant_id: p.id,
      player_id: p.player_id,
      player_name: p.player?.name || (p.is_dummy ? 'BYE / Walkover' : 'Player'),
      avatar_url: p.player?.profileImageUrl,
      game_id: p.game_id,
      device_model: p.device_model,
      is_dummy: p.is_dummy,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
      rank: 1,
      is_qualified: false
    });
  }

  for (const m of matches) {
    if (m.status !== 'completed') continue;

    const p1Stats = m.player1_id ? statsMap.get(m.player1_id) : undefined;
    const p2Stats = m.player2_id ? statsMap.get(m.player2_id) : undefined;

    // Handle Auto-Win
    if (m.is_auto_win) {
      if (m.auto_win_player_id) {
        const winner = statsMap.get(m.auto_win_player_id);
        if (winner) {
          winner.played += 1;
          winner.won += 1;
          winner.points += 3;
          // NO fake goals added!
        }
      }
      continue;
    }

    // Handle Inactive Double Loss
    if (m.is_inactive_double_loss) {
      if (p1Stats) { p1Stats.played += 1; p1Stats.lost += 1; /* 0 pts */ }
      if (p2Stats) { p2Stats.played += 1; p2Stats.lost += 1; /* 0 pts */ }
      continue;
    }

    // Standard Match
    const s1 = m.player1_score ?? 0;
    const s2 = m.player2_score ?? 0;

    if (p1Stats) {
      p1Stats.played += 1;
      p1Stats.gf += s1;
      p1Stats.ga += s2;
      p1Stats.gd = p1Stats.gf - p1Stats.ga;

      if (s1 > s2) {
        p1Stats.won += 1;
        p1Stats.points += 3;
      } else if (s1 === s2) {
        p1Stats.drawn += 1;
        p1Stats.points += 1;
      } else {
        p1Stats.lost += 1;
      }
    }

    if (p2Stats) {
      p2Stats.played += 1;
      p2Stats.gf += s2;
      p2Stats.ga += s1;
      p2Stats.gd = p2Stats.gf - p2Stats.ga;

      if (s2 > s1) {
        p2Stats.won += 1;
        p2Stats.points += 3;
      } else if (s1 === s2) {
        p2Stats.drawn += 1;
        p2Stats.points += 1;
      } else {
        p2Stats.lost += 1;
      }
    }
  }

  // Filter out dummy bots from ranking
  const rows = Array.from(statsMap.values()).filter(r => !r.is_dummy);

  // Sort strictly by Points -> GD -> GF -> Least GA
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.ga - b.ga; // smaller goals conceded is better
  });

  // Assign ranks
  rows.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return rows;
}
