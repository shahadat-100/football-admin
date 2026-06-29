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

/**
 * Converts Unicode math/bold/stylized characters (used in Facebook/WhatsApp formatting)
 * back to their regular ASCII equivalents.
 * e.g., 𝗕𝗡𝗖 → BNC, 𝟲 → 6
 */
function normalizeUnicodeText(text: string): string {
  const RANGES: [number, number, number][] = [
    // [start, end, base_ascii_offset]
    // Bold Capital Letters (A-Z)
    [0x1D400, 0x1D419, 65],
    // Bold Small Letters (a-z)
    [0x1D41A, 0x1D433, 97],
    // Italic Capital
    [0x1D434, 0x1D44D, 65],
    // Italic Small
    [0x1D44E, 0x1D467, 97],
    // Bold Italic Capital
    [0x1D468, 0x1D481, 65],
    // Bold Italic Small
    [0x1D482, 0x1D49B, 97],
    // Monospace Capital
    [0x1D670, 0x1D689, 65],
    // Monospace Small
    [0x1D68A, 0x1D6A3, 97],
    // Sans-Serif Capital
    [0x1D5A0, 0x1D5B9, 65],
    // Sans-Serif Small
    [0x1D5BA, 0x1D5D3, 97],
    // Sans-Serif Bold Capital (used in Facebook bold)
    [0x1D5D4, 0x1D5ED, 65],
    // Sans-Serif Bold Small (used in Facebook bold)
    [0x1D5EE, 0x1D607, 97],
    // Sans-Serif Italic Capital
    [0x1D608, 0x1D621, 65],
    // Sans-Serif Italic Small
    [0x1D622, 0x1D63B, 97],
    // Sans-Serif Bold Italic Capital
    [0x1D63C, 0x1D655, 65],
    // Sans-Serif Bold Italic Small
    [0x1D656, 0x1D66F, 97],
    // Double-struck Capital
    [0x1D538, 0x1D551, 65],
    // Double-struck Small
    [0x1D552, 0x1D56B, 97],
    // Bold Digits (0-9)
    [0x1D7CE, 0x1D7D7, 48],
    // Double-struck Digits
    [0x1D7D8, 0x1D7E1, 48],
    // Sans-Serif Digits
    [0x1D7E2, 0x1D7EB, 48],
    // Sans-Serif Bold Digits (used in Facebook bold numbers like 𝟲)
    [0x1D7EC, 0x1D7F5, 48],
    // Monospace Digits
    [0x1D7F6, 0x1D7FF, 48],
  ];

  // We need to iterate over surrogate pairs (code points > 0xFFFF)
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // Check if this is a high surrogate
    if (charCode >= 0xD800 && charCode <= 0xDBFF && i + 1 < text.length) {
      const nextCharCode = text.charCodeAt(i + 1);
      if (nextCharCode >= 0xDC00 && nextCharCode <= 0xDFFF) {
        // It's a surrogate pair - decode the code point
        const codePoint = 0x10000 + ((charCode - 0xD800) << 10) + (nextCharCode - 0xDC00);
        let mapped = false;
        for (const [start, end, base] of RANGES) {
          if (codePoint >= start && codePoint <= end) {
            result += String.fromCharCode(base + (codePoint - start));
            mapped = true;
            break;
          }
        }
        if (!mapped) {
          result += text[i] + text[i + 1];
        }
        i++; // Skip the low surrogate
        continue;
      }
    }
    result += text[i];
  }
  return result;
}

function cleanPlayerName(name: string): string {
  // Strip specific emojis and trim
  return name.replace(/[🔑🟨⚔️⭐@]/g, '').replace(/👑/g, '').trim();
}

function hasMotm(name: string): boolean {
  return name.includes('👑');
}

/**
 * Manually parse date strings like "29 Jun 2026 12:00 AM" to avoid timezone shifts.
 */
function parseDateTime(dateStr: string): { date: string; time: string } {
  const MONTHS: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  try {
    const cleaned = dateStr.replace(/\u00a0/g, ' ').trim();
    // Match: "29 Jun 2026 12:00 AM" or "29 Jun 2026"
    const dateMatch = cleaned.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?/i);
    if (!dateMatch) throw new Error('No date match');

    const day = parseInt(dateMatch[1], 10);
    const monthKey = dateMatch[2].toLowerCase().slice(0, 3);
    const month = MONTHS[monthKey];
    if (month === undefined) throw new Error('Invalid month');
    const year = parseInt(dateMatch[3], 10);

    let hours = 0;
    let mins = 0;

    if (dateMatch[4] !== undefined) {
      hours = parseInt(dateMatch[4], 10);
      mins = parseInt(dateMatch[5] || '0', 10);
      const ampm = (dateMatch[6] || '').toUpperCase();
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }

    const date = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const time = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    return { date, time };
  } catch {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const dateNum = now.getDate().toString().padStart(2, '0');
    return { date: `${year}-${month}-${dateNum}`, time: '' };
  }
}

export function parseMatchResult(rawText: string): ParsedMatchData {
  // Normalize the entire raw text first to convert Unicode styled chars to ASCII
  const normalizedText = normalizeUnicodeText(rawText);
  const lines = normalizedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

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

  const now = new Date();
  let currentDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  let currentTime = '';

  // 2. Parse lines
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];

    // Section header: 🔔BUILD UP PLAYERS ║ 29 Jun 2026 12:00 AM
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
      currentTime = time;
      continue;
    }

    // Match Points line
    if (line.toUpperCase().includes('MATCH POINTS') || line.toUpperCase().includes('MATCH P')) {
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

    // Player match line
    if (line.includes('🆚')) {
      const parts = line.split('🆚');
      if (parts.length === 2) {
        let leftPart = parts[0].trim();
        let rightPart = parts[1].trim();

        const leftMatch = leftPart.match(/(\d+)$/);
        const rightMatch = rightPart.match(/^(\d+)/);

        let leftGoals: number | null = null;
        let rightGoals: number | null = null;

        if (leftMatch && rightMatch) {
          leftGoals = parseInt(leftMatch[1], 10);
          rightGoals = parseInt(rightMatch[1], 10);
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
