import type { ParsedMatchData, ParsedMatchEntry } from './parseMatchResult';

// ─────────────────────────────────────────────────────────
// UNICODE NORMALIZER (Converts bold/styled unicode to standard text)
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
  return result.replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ');
}

// Club Identifier for TEE across formats
const TEE_RE = /enigmatic\s*elite|the\s*elits|🆃🅴🅴|\bTEE\b/i;

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function cleanPlayerName(name: string): string {
  return name
    .replace(/👑/gu, '')
    .replace(/[🔑🟨⭐@\-]/gu, '')
    .replace(/\b(?:sub|swap)\b/gi, '')
    .replace(/\uFE0F/g, '')
    .replace(/\uFFFD/g, '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTeamName(name: string): string {
  return name
    .replace(/^MATCH-?UP:\s*/i, '')
    .replace(/[🅰🅱]/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasMotm(name: string): boolean {
  return name.includes('👑');
}

function stripLeadingNumberMarkers(line: string): string {
  return line
    .replace(/^(?:[0-9]\uFE0F?\u20E3\s*)+/, '')
    .replace(/^\d+[\.\)]\s*/, '')
    .trim();
}

function extractTime(s: string): string {
  const m = s.match(/(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)/i);
  if (!m) return '';
  let h = parseInt(m[1], 10);
  const min = m[2] ? m[2] : '00';
  const mer = (m[3] || '').toLowerCase();
  if (mer === 'pm' && h !== 12) h += 12;
  if (mer === 'am' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${min}`;
}

function parseDateHeader(raw: string, docYear: number): string | null {
  const m = raw.match(/(\d{1,2})\s+([A-Za-z]{3,})/i);
  if (m) {
    const mo = MONTH_MAP[m[2].toLowerCase().slice(0, 3)];
    if (mo !== undefined) {
      return `${docYear}-${(mo + 1).toString().padStart(2, '0')}-${parseInt(m[1], 10).toString().padStart(2, '0')}`;
    }
  }
  return null;
}

export function parseBefaMatchResult(rawText: string, defaultYear?: number): ParsedMatchData {
  const normalized = normalizeUnicodeText(rawText);
  const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

  // Doc year: extract from title e.g. "BeFA Club World Cup 2026" or fallback
  const yearMatch = normalized.match(/\b(20\d{2})\b/);
  const docYear = defaultYear ?? (yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear());

  const data: ParsedMatchData = {
    competition: '',
    opponentClub: '',
    teeSide: 'left',
    homeScore: null,
    awayScore: null,
    entries: [],
    errors: [],
    unparsedLines: [],
  };

  if (lines.length < 3) {
    data.errors.push('Not enough lines to parse BeFA match.');
    return data;
  }

  // 1. Competition line (usually line 0)
  data.competition = lines[0];

  // 2. Find matchup
  let matchupFound = false;
  for (const line of lines) {
    if (/MATCH-?UP:/i.test(line) || (/🆚/.test(line) && /Enigmatic|TEE/i.test(line))) {
      const cleaned = line.replace(/^MATCH-?UP:\s*/i, '');
      const parts = cleaned.split('🆚');
      if (parts.length === 2) {
        const left = cleanTeamName(parts[0]);
        const right = cleanTeamName(parts[1]);
        if (TEE_RE.test(left)) {
          data.teeSide = 'left';
          data.opponentClub = right;
          matchupFound = true;
        } else if (TEE_RE.test(right)) {
          data.teeSide = 'right';
          data.opponentClub = left;
          matchupFound = true;
        }
      }
      if (matchupFound) break;
    }
  }

  if (!matchupFound) {
    data.errors.push("Could not determine matchup sides (no recognizable 'The Enigmatic Elite' vs opponent pattern found).");
  }

  // 3. Find Points block
  const pointsIndex = lines.findIndex(l => /^POINTS:/i.test(l));
  if (pointsIndex !== -1) {
    for (let i = pointsIndex + 1; i < Math.min(pointsIndex + 5, lines.length); i++) {
      const line = lines[i];
      const match = line.match(/^[^:]*?([A-Za-z\s]+)\s*:\s*(\d+)/);
      if (match) {
        const team = match[1].trim();
        const score = parseInt(match[2], 10);
        if (TEE_RE.test(team)) {
          data.homeScore = score;
        } else {
          data.awayScore = score;
        }
      }
    }
  }

  // 4. Walk lines for sections (date/time) and player matches
  let currentDate = `${docYear}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}`;
  let currentTime = '';

  for (const line of lines) {
    if (
      line.startsWith('http') ||
      /^⏳\s*MATCH REMAINING/i.test(line) ||
      /^👥\s*GROUP/i.test(line) ||
      /^Match No:/i.test(line)
    ) {
      continue;
    }

    // Check position header line like "🔵 DEFENDERS: 21 September"
    if (/(?:DEFENDERS|MIDFIELDERS|FORWARDS|GOALKEEPERS)/i.test(line)) {
      const d = parseDateHeader(line, docYear);
      if (d) currentDate = d;

      // Check if time is on the same line (e.g. "🟢 MIDFIELDERS: 22 September 12.00 AM |")
      const timePart = line.split('|')[0];
      const t = extractTime(timePart);
      if (t) currentTime = t;
      continue;
    }

    // Check time line like "12 AM | Response : (11:30 PM- 12:00 AM)"
    if (/\b(?:Response\s*:|\d{1,2}\s*(?:AM|PM))\b/i.test(line) && !line.includes('🆚')) {
      const beforeResponse = line.split(/Response\s*:/i)[0];
      const t = extractTime(beforeResponse);
      if (t) currentTime = t;
      continue;
    }

    // Match player line: e.g. "1️⃣ Safayet Hossan Rashed 🔑 (  3 ) 🆚 ( 5  ) Shakib Shawon"
    if (line.includes('🆚') && !/MATCH-?UP:/i.test(line) && /\(\s*\d+\s*\)/.test(line)) {
      const stripped = stripLeadingNumberMarkers(line);
      const m = stripped.match(/^(.+?)\(\s*(\d+)\s*\)\s*🆚\s*\(\s*(\d+)\s*\)[.\s]*(.+)$/);
      if (m) {
        const rawLeft = m[1].trim();
        const leftGoals = parseInt(m[2], 10);
        const rightGoals = parseInt(m[3], 10);
        const rawRight = m[4].trim();

        const isTeeLeft = data.teeSide === 'left';
        const teePlayerRaw = isTeeLeft ? rawLeft : rawRight;
        const oppPlayerRaw = isTeeLeft ? rawRight : rawLeft;
        const teeGoals = isTeeLeft ? leftGoals : rightGoals;
        const oppGoals = isTeeLeft ? rightGoals : leftGoals;

        let result: 'win' | 'loss' | 'draw' | null = null;
        let cleanSheet = false;
        if (teeGoals > oppGoals) result = 'win';
        else if (teeGoals < oppGoals) result = 'loss';
        else result = 'draw';
        if (oppGoals === 0) cleanSheet = true;

        const entry: ParsedMatchEntry = {
          rawLine: line,
          teePlayerRawName: cleanPlayerName(teePlayerRaw),
          opponentPlayerRawName: cleanPlayerName(oppPlayerRaw),
          goals: teeGoals,
          goalsConceded: oppGoals,
          result,
          cleanSheet,
          motm: hasMotm(teePlayerRaw),
          date: currentDate,
          time: currentTime,
          ambiguousScore: false,
        };

        data.entries.push(entry);
        continue;
      }
    }

    // Track unparsed line if it looked like a match line but failed
    if (line.includes('🆚') && !/MATCH-?UP:/i.test(line) && !/POINTS/i.test(line)) {
      data.unparsedLines.push(line);
    }
  }

  if (data.entries.length === 0) {
    data.errors.push('No player match lines could be parsed for BeFA.');
  }

  return data;
}
