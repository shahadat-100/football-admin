export interface ParsedMatchEntry {
  rawLine: string;
  teePlayerRawName: string;
  opponentPlayerRawName: string;
  goals: number | null;
  goalsConceded: number | null;
  result: 'win' | 'loss' | 'draw' | null;
  cleanSheet: boolean;
  motm: boolean;
  date: string;
  time: string;
}

export interface ParsedMatchData {
  competition: string;
  opponentClub: string;
  teeSide: 'left' | 'right';
  homeScore: number | null;
  awayScore: number | null;
  entries: ParsedMatchEntry[];
  errors: string[];
}

function cleanPlayerName(name: string): string {
  // Strip specific emojis and trim
  return name.replace(/[🔑🟨⚔️⭐]/g, '').replace(/👑/g, '').trim();
}

function hasMotm(name: string): boolean {
  return name.includes('👑');
}

function parseDateTime(dateStr: string): { date: string; time: string } {
  // Attempt to parse '29 Jun 2026 12:00 AM'
  // Or fallback to current date
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) throw new Error();
    const date = d.toISOString().split('T')[0];
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return { date, time: `${hours}:${mins}` };
  } catch {
    const now = new Date();
    return { date: now.toISOString().split('T')[0], time: '' };
  }
}

export function parseMatchResult(rawText: string): ParsedMatchData {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const data: ParsedMatchData = {
    competition: '',
    opponentClub: '',
    teeSide: 'left',
    homeScore: null,
    awayScore: null,
    entries: [],
    errors: [],
  };

  if (lines.length < 2) {
    data.errors.push("Not enough lines to parse header.");
    return data;
  }

  // 1. Header parsing
  data.competition = lines[0];
  const matchupLine = lines[1];
  
  if (matchupLine.toLowerCase().includes('enigmatic elite')) {
    const sides = matchupLine.split(/⚔️|🆚/);
    if (sides.length === 2) {
      const left = sides[0].trim();
      const right = sides[1].trim();
      
      if (left.toLowerCase().includes('enigmatic elite')) {
        data.teeSide = 'left';
        data.opponentClub = cleanPlayerName(right);
      } else {
        data.teeSide = 'right';
        data.opponentClub = cleanPlayerName(left);
      }
    } else {
      data.errors.push("Could not split matchup line correctly.");
    }
  } else {
    data.errors.push("Could not find 'Enigmatic Elite' in the second line.");
  }

  let currentDate = new Date().toISOString().split('T')[0];
  let currentTime = '';

  // 2. Parse lines
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];

    // Check for section headers for Date/Time
    // Example: 🔔BUILD UP PLAYERS ║ 29 Jun 2026 12:00 AM
    if (line.includes('║') || line.includes('Star:') || line.includes('First Day:')) {
      let dateStringPart = '';
      if (line.includes('║')) {
        dateStringPart = line.split('║')[1].trim();
      } else if (line.includes('Star:')) {
        dateStringPart = line.split('Star:')[1].trim();
      } else if (line.includes('First Day:')) {
        dateStringPart = line.split('First Day:')[1].trim();
      }
      
      const { date, time } = parseDateTime(dateStringPart);
      if (date) currentDate = date;
      if (time) currentTime = time;
      continue;
    }

    // Check Match Points
    if (line.toUpperCase().includes('MATCH POINTS') || line.toUpperCase().includes('MATCH P')) {
      // Look for two numbers separated by a VS-like character or just non-digits
      // Extract all numbers from the line, assuming the last two are the scores if there are more
      const numbersMatch = line.match(/\d+/g);
      if (numbersMatch && numbersMatch.length >= 2) {
        const score1 = parseInt(numbersMatch[numbersMatch.length - 2], 10);
        const score2 = parseInt(numbersMatch[numbersMatch.length - 1], 10);
        if (data.teeSide === 'left') {
          data.homeScore = score1;
          data.awayScore = score2;
        } else {
          data.homeScore = score2;
          data.awayScore = score1;
        }
      }
      continue;
    }

    // Check Player Match Line
    if (line.includes('🆚')) {
      // Split on 🆚
      // Match goals before and after 🆚
      // E.g., Moin Uddin Nirob 🔑 4🆚2 Ripon Sarkar
      const parts = line.split('🆚');
      if (parts.length === 2) {
        let leftPart = parts[0].trim();
        let rightPart = parts[1].trim();

        // Extract goals
        const leftMatch = leftPart.match(/(\d+)$/);
        const rightMatch = rightPart.match(/^(\d+)/);

        let leftGoals: number | null = null;
        let rightGoals: number | null = null;

        if (leftMatch && rightMatch) {
          leftGoals = parseInt(leftMatch[1], 10);
          rightGoals = parseInt(rightMatch[1], 10);
          // strip numbers from names
          leftPart = leftPart.substring(0, leftPart.length - leftMatch[1].length).trim();
          rightPart = rightPart.substring(rightMatch[1].length).trim();
        }

        const isTeeLeft = data.teeSide === 'left';
        
        const teePlayerRaw = isTeeLeft ? leftPart : rightPart;
        const oppPlayerRaw = isTeeLeft ? rightPart : leftPart;
        
        const teeGoals = isTeeLeft ? leftGoals : rightGoals;
        const oppGoals = isTeeLeft ? rightGoals : leftGoals;

        let result: 'win' | 'loss' | 'draw' | null = null;
        let cleanSheet = false;

        if (teeGoals !== null && oppGoals !== null) {
          if (teeGoals > oppGoals) result = 'win';
          else if (teeGoals < oppGoals) result = 'loss';
          else result = 'draw';

          if (oppGoals === 0) cleanSheet = true;
        }

        const isMotm = hasMotm(teePlayerRaw);

        data.entries.push({
          rawLine: line,
          teePlayerRawName: cleanPlayerName(teePlayerRaw),
          opponentPlayerRawName: cleanPlayerName(oppPlayerRaw),
          goals: teeGoals,
          goalsConceded: oppGoals,
          result,
          cleanSheet,
          motm: isMotm,
          date: currentDate,
          time: currentTime,
        });
      }
    }
  }

  return data;
}
