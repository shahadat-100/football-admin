// ─────────────────────────────────────────────────────────
// UNICODE NORMALIZER (Converts bold/sans-serif Unicode chars to ASCII)
// ─────────────────────────────────────────────────────────
function normalizeUnicodeText(text: string): string {
  const RANGES: [number, number, number][] = [
    [0x1D400, 0x1D419, 65], [0x1D41A, 0x1D433, 97],
    [0x1D434, 0x1D44D, 65], [0x1D44E, 0x1D467, 97],
    [0x1D468, 0x1D481, 65], [0x1D482, 0x1D49B, 97],
    [0x1D538, 0x1D551, 65], [0x1D552, 0x1D56B, 97],
    [0x1D5A0, 0x1D5B9, 65], [0x1D5BA, 0x1D5D3, 97],
    [0x1D5D4, 0x1D5ED, 65], [0x1D5EE, 0x1D607, 97],
    [0x1D608, 0x1D621, 65], [0x1D622, 0x1D63B, 97],
    [0x1D63C, 0x1D655, 65], [0x1D656, 0x1D66F, 97],
    [0x1D670, 0x1D689, 65], [0x1D68A, 0x1D6A3, 97],
    [0x1D7CE, 0x1D7D7, 48], [0x1D7D8, 0x1D7E1, 48],
    [0x1D7E2, 0x1D7EB, 48], [0x1D7EC, 0x1D7F5, 48],
    [0x1D7F6, 0x1D7FF, 48],
  ];
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const hi = text.charCodeAt(i);
    if (hi >= 0xD800 && hi <= 0xDBFF && i + 1 < text.length) {
      const lo = text.charCodeAt(i + 1);
      if (lo >= 0xDC00 && lo <= 0xDFFF) {
        const cp = 0x10000 + ((hi - 0xD800) << 10) + (lo - 0xDC00);
        let mapped = false;
        for (const [s, e, b] of RANGES) {
          if (cp >= s && cp <= e) { result += String.fromCharCode(b + (cp - s)); mapped = true; break; }
        }
        if (!mapped) result += text[i] + text[i + 1];
        i++; continue;
      }
    }
    result += text[i];
  }
  result = result.replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ');
  return result;
}

function cleanPlayerName(name: string): string {
  return name
    .replace(/👑/gu, '')
    .replace(/[🔑🟨⭐@\-]/gu, '') // also strip dashes if any left
    .replace(/\uFE0F/g, '')
    .replace(/\uFFFD/g, '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface ParsedFriendlyMatch {
  rawLine: string;
  player1RawName: string;
  player2RawName: string;
  player1Goals: number;
  player2Goals: number;
  date: string;
}

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseDateHeader(line: string, year: number): string | null {
  const cleanLine = line.replace(/⏰|📅|🗓️|date|-/gi, '').trim();

  // DD/MM/YYYY or DD/MM
  const dmy = cleanLine.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
  if (dmy) {
    const y = dmy[3] || String(year);
    return `${y}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }

  // DD Mon YYYY or DD Mon
  const long = cleanLine.match(/(\d{1,2})\s+([A-Za-z]{3,})(?:\s+(\d{4}))?/);
  if (long) {
    const mo = MONTH_MAP[long[2].toLowerCase().slice(0, 3)];
    if (mo !== undefined) {
      const y = long[3] || String(year);
      return `${y}-${(mo + 1).toString().padStart(2, '0')}-${parseInt(long[1]).toString().padStart(2, '0')}`;
    }
  }

  // Mon DD YYYY or Mon DD
  const mdy = cleanLine.match(/([A-Za-z]{3,})\s+(\d{1,2})(?:\s+(\d{4}))?/);
  if (mdy) {
    const mo = MONTH_MAP[mdy[1].toLowerCase().slice(0, 3)];
    if (mo !== undefined) {
      const y = mdy[3] || String(year);
      return `${y}-${(mo + 1).toString().padStart(2, '0')}-${parseInt(mdy[2]).toString().padStart(2, '0')}`;
    }
  }

  return null;
}

export function parseFriendlyMatchBlock(rawText: string, defaultYear: number = new Date().getFullYear()): { matches: ParsedFriendlyMatch[], errors: string[] } {
  const normalized = normalizeUnicodeText(rawText);
  const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);
  
  const matches: ParsedFriendlyMatch[] = [];
  const errors: string[] = [];
  
  let currentDate = `${defaultYear}-${(new Date().getMonth()+1).toString().padStart(2,'0')}-${new Date().getDate().toString().padStart(2,'0')}`;

  for (const line of lines) {
    // Check if line is header metadata
    const lower = line.toLowerCase();
    if (lower.includes('warmup') || lower.includes('update') || lower.includes('result') || /^[\-_=]{3,}$/.test(line)) {
      continue;
    }

    // Check if line is a Date line (e.g. "Date - 15/08/2026")
    if (lower.includes('date')) {
      const parsedDate = parseDateHeader(line, defaultYear);
      if (parsedDate) {
        currentDate = parsedDate;
      }
      continue;
    }

    // Match patterns like "-istiack shanto 3-1 abdur rahman" or "Istiack shanto 3-2 taz islam"
    // Regex matches: [optional dash][Name 1] [goals 1]-[goals 2] [Name 2]
    const matchRegex = /^-?\s*([A-Za-z\u0980-\u09FF\s.'👑🔑🟨⭐]+?)\s+(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z\u0980-\u09FF\s.'👑🔑🟨⭐]+)$/;
    const parts = line.match(matchRegex);

    if (parts) {
      matches.push({
        rawLine: line,
        player1RawName: cleanPlayerName(parts[1]),
        player2RawName: cleanPlayerName(parts[4]),
        player1Goals: parseInt(parts[2], 10),
        player2Goals: parseInt(parts[3], 10),
        date: currentDate,
      });
    } else {
      // If line contains digit-digit pattern but didn't match perfectly, flag it as unparsed or bad line
      if (/\d\s*-\s*\d/.test(line)) {
        errors.push(`Could not parse match line: "${line}"`);
      }
    }
  }

  return { matches, errors };
}
