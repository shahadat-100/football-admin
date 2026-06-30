// import type { CommunityId } from './communityConfigs';

// export interface ParsedMatchEntry {
//   rawLine: string;
//   teePlayerRawName: string;
//   opponentPlayerRawName: string;
//   goals: number | null;
//   goalsConceded: number | null;
//   result: 'win' | 'loss' | 'draw' | null;
//   cleanSheet: boolean;
//   motm: boolean;
//   date: string;
//   time: string;
// }

// export interface ParsedMatchData {
//   competition: string;
//   opponentClub: string;
//   teeSide: 'left' | 'right';
//   homeScore: number | null;
//   awayScore: number | null;
//   entries: ParsedMatchEntry[];
//   errors: string[];
// }

// // ─────────────────────────────────────────────────────────
// // UNICODE NORMALIZER
// // Converts Facebook/WhatsApp bold/italic/sans-serif Unicode
// // math chars to plain ASCII. e.g. 𝗕𝗡𝗖 → BNC, 𝟲 → 6
// // ─────────────────────────────────────────────────────────
// function normalizeUnicodeText(text: string): string {
//   const RANGES: [number, number, number][] = [
//     [0x1D400, 0x1D419, 65], [0x1D41A, 0x1D433, 97],
//     [0x1D434, 0x1D44D, 65], [0x1D44E, 0x1D467, 97],
//     [0x1D468, 0x1D481, 65], [0x1D482, 0x1D49B, 97],
//     [0x1D538, 0x1D551, 65], [0x1D552, 0x1D56B, 97],
//     [0x1D5A0, 0x1D5B9, 65], [0x1D5BA, 0x1D5D3, 97],
//     [0x1D5D4, 0x1D5ED, 65], [0x1D5EE, 0x1D607, 97],
//     [0x1D608, 0x1D621, 65], [0x1D622, 0x1D63B, 97],
//     [0x1D63C, 0x1D655, 65], [0x1D656, 0x1D66F, 97],
//     [0x1D670, 0x1D689, 65], [0x1D68A, 0x1D6A3, 97],
//     [0x1D7CE, 0x1D7D7, 48], [0x1D7D8, 0x1D7E1, 48],
//     [0x1D7E2, 0x1D7EB, 48], [0x1D7EC, 0x1D7F5, 48],
//     [0x1D7F6, 0x1D7FF, 48],
//   ];
//   let result = '';
//   for (let i = 0; i < text.length; i++) {
//     const hi = text.charCodeAt(i);
//     if (hi >= 0xD800 && hi <= 0xDBFF && i + 1 < text.length) {
//       const lo = text.charCodeAt(i + 1);
//       if (lo >= 0xDC00 && lo <= 0xDFFF) {
//         const cp = 0x10000 + ((hi - 0xD800) << 10) + (lo - 0xDC00);
//         let mapped = false;
//         for (const [s, e, b] of RANGES) {
//           if (cp >= s && cp <= e) { result += String.fromCharCode(b + (cp - s)); mapped = true; break; }
//         }
//         if (!mapped) result += text[i] + text[i + 1];
//         i++; continue;
//       }
//     }
//     result += text[i];
//   }
//   return result;
// }

// // ─────────────────────────────────────────────────────────
// // JUNK LINE DETECTION
// // ─────────────────────────────────────────────────────────
// function isJunkLine(line: string): boolean {
//   const l = line.toLowerCase();
//   return (
//     l.startsWith('http') ||
//     l.includes('cobegbd.com') ||
//     l.includes('pesbd.xyz') ||
//     l.includes('forwarded') ||
//     /^\[live\]/i.test(l) ||
//     /match\s*remain/i.test(l) ||
//     /📋/.test(line) ||
//     /^[-─=]{3,}$/.test(line.trim())  // separator lines like --------
//   );
// }

// // ─────────────────────────────────────────────────────────
// // PLAYER NAME HELPERS
// // ─────────────────────────────────────────────────────────
// function cleanPlayerName(name: string): string {
//   return name
//     .replace(/[🔑🟨⭐@]/g, '')
//     .replace(/👑/g, '')
//     .replace(/\s+/g, ' ')
//     .trim();
// }

// function hasMotm(name: string): boolean {
//   return name.includes('👑');
// }

// // ─────────────────────────────────────────────────────────
// // DATE / TIME PARSERS
// // ─────────────────────────────────────────────────────────
// const MONTH_MAP: Record<string, number> = {
//   jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
//   jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
// };

// function todayString(): string {
//   const n = new Date();
//   return `${n.getFullYear()}-${(n.getMonth()+1).toString().padStart(2,'0')}-${n.getDate().toString().padStart(2,'0')}`;
// }

// /** Extracts the FIRST time-like token: "12:20am", "12:20 AM", "23:00" */
// function extractTime(s: string): string {
//   const m = s.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
//   if (!m) return '';
//   let h = parseInt(m[1], 10);
//   const min = m[2];
//   const mer = (m[3] || '').toLowerCase();
//   if (mer === 'pm' && h !== 12) h += 12;
//   if (mer === 'am' && h === 12) h = 0;
//   return `${h.toString().padStart(2,'0')}:${min}`;
// }

// /**
//  * Parses date from a string.
//  * Supports: DD/MM/YYYY, DD Mon YYYY, Mon DD, DD,Mon,YYYY (comma-separated)
//  */
// function parseDate(raw: string): string | null {
//   // Replace commas used as date separators (e.g. 15,Nov,2024 → 15 Nov 2024)
//   const s = raw.replace(/\u00a0/g, ' ').replace(/(\d),(\w)/g, '$1 $2').replace(/(\w),(\d)/g, '$1 $2');

//   // DD/MM/YYYY
//   const dmy = s.match(/(\d{1,2})\/(\d{2})\/(\d{4})/);
//   if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;

//   // DD Mon YYYY
//   const long = s.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
//   if (long) {
//     const mo = MONTH_MAP[long[2].toLowerCase().slice(0,3)];
//     if (mo !== undefined)
//       return `${long[3]}-${(mo+1).toString().padStart(2,'0')}-${parseInt(long[1]).toString().padStart(2,'0')}`;
//   }

//   // Mon DD YYYY
//   const mdy = s.match(/([A-Za-z]{3,})\s+(\d{1,2})\s+(\d{4})/);
//   if (mdy) {
//     const mo = MONTH_MAP[mdy[1].toLowerCase().slice(0,3)];
//     if (mo !== undefined)
//       return `${mdy[3]}-${(mo+1).toString().padStart(2,'0')}-${parseInt(mdy[2]).toString().padStart(2,'0')}`;
//   }

//   // Mon DD (no year → current year)
//   const short = s.match(/([A-Za-z]{3,})\s+(\d{1,2})/);
//   if (short) {
//     const mo = MONTH_MAP[short[1].toLowerCase().slice(0,3)];
//     if (mo !== undefined) {
//       const yr = new Date().getFullYear();
//       return `${yr}-${(mo+1).toString().padStart(2,'0')}-${parseInt(short[2]).toString().padStart(2,'0')}`;
//     }
//   }

//   return null;
// }

// // ─────────────────────────────────────────────────────────
// // SECTION HEADER DETECTION (generic)
// // A line is a section header if it has a date pattern and no 🆚
// // ─────────────────────────────────────────────────────────
// function isGenericSectionHeader(line: string): boolean {
//   if (line.includes('🆚')) return false;
//   const hasMonthName = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(line);
//   const hasDMY = /\d{1,2}\/\d{2}\/\d{4}/.test(line);
//   return hasMonthName || hasDMY;
// }

// // ─────────────────────────────────────────────────────────
// // SCORE EXTRACTION HELPERS
// // ─────────────────────────────────────────────────────────

// /** eFOB: score on next line after "MATCH POINTS:" → "Team1 : 14 ║ Team2 : 20" */
// function extractEfobScores(scoreLine: string, teeSide: 'left' | 'right'): { home: number; away: number } | null {
//   // Split by ║ or pipe
//   const segments = scoreLine.split(/║|\|/);
//   if (segments.length < 2) {
//     // Try just extracting two numbers from the line with team name matching
//     const nums = (scoreLine.match(/\d+/g) || []).map(Number);
//     if (nums.length < 2) return null;
//     const n1 = nums[nums.length - 2], n2 = nums[nums.length - 1];
//     return teeSide === 'left' ? { home: n1, away: n2 } : { home: n2, away: n1 };
//   }
//   let teeScore: number | null = null;
//   let oppScore: number | null = null;
//   for (const seg of segments) {
//     const m = seg.match(/(\d+)/);
//     if (!m) continue;
//     const score = parseInt(m[1], 10);
//     if (/enigmatic\s*elite|the\s*elits/i.test(seg)) teeScore = score;
//     else oppScore = score;
//   }
//   if (teeScore !== null) return { home: teeScore, away: oppScore ?? 0 };
//   // Fallback: use segment positions
//   const allNums = (scoreLine.match(/\d+/g) || []).map(Number);
//   if (allNums.length < 2) return null;
//   return teeSide === 'left'
//     ? { home: allNums[0], away: allNums[allNums.length - 1] }
//     : { home: allNums[allNums.length - 1], away: allNums[0] };
// }

// /** Generic: MATCH POINTS / WINS: / Match Win: */
// function isGenericScoreLine(line: string): boolean {
//   const u = line.toUpperCase();
//   return u.includes('MATCH POINTS') || u.includes('MATCH P') ||
//     /\bWINS\s*:/.test(u) || /MATCH\s*WIN\s*:/.test(u);
// }

// function extractGenericScores(line: string, teeSide: 'left' | 'right'): { home: number; away: number } | null {
//   const nums = (line.match(/\d+/g) || []).map(Number);
//   if (nums.length < 2) return null;
//   const n1 = nums[nums.length - 2];
//   const n2 = nums[nums.length - 1];
//   return teeSide === 'left' ? { home: n1, away: n2 } : { home: n2, away: n1 };
// }

// /** GKEC: 🏆 POINTS block with "Team Name : XX" */
// function extractGkecScores(lines: string[], teeSide: 'left' | 'right'): { home: number; away: number } | null {
//   const idx = lines.findIndex(l => /POINTS?\s*[-:]/i.test(l));
//   if (idx === -1) return null;
//   let teeScore: number | null = null;
//   let oppScore: number | null = null;
//   for (let i = idx + 1; i < Math.min(idx + 8, lines.length); i++) {
//     const l = lines[i];
//     const m = l.match(/:\s*(\d+)\s*$/);
//     if (!m) continue;
//     const score = parseInt(m[1], 10);
//     if (/enigmatic\s*elite|the\s*elits/i.test(l)) teeScore = score;
//     else oppScore = score;
//   }
//   if (teeScore === null) return null;
//   return { home: teeScore, away: oppScore ?? 0 };
// }

// /** ECOB: POINT: block with 🆃🅴🅴 or TEE keyword */
// function extractEcobScores(lines: string[]): { home: number; away: number } | null {
//   const idx = lines.findIndex(l => /^\s*POINTS?\s*:?\s*$/i.test(l));
//   if (idx === -1) return null;
//   let teeScore: number | null = null;
//   let oppScore: number | null = null;
//   for (let i = idx + 1; i < Math.min(idx + 8, lines.length); i++) {
//     const l = lines[i];
//     const m = l.match(/:\s*(\d+)\s*$/);
//     if (!m) continue;
//     const score = parseInt(m[1], 10);
//     // 🆃🅴🅴 is the TEE boxed-letter emoji sequence, or plain "TEE"
//     if (/🆃🅴🅴|\bTEE\b|enigmatic|the elits/i.test(l)) teeScore = score;
//     else oppScore = score;
//   }
//   if (teeScore === null) return null;
//   return { home: teeScore, away: oppScore ?? 0 };
// }

// // ─────────────────────────────────────────────────────────
// // MATCHUP LINE FINDER
// // ─────────────────────────────────────────────────────────
// function findMatchupLineIndex(lines: string[], communityId: CommunityId): number {
//   if (communityId === 'gkec') {
//     // Find first line with 🆚 but NO adjacent digits (pure team name vs team name)
//     const idx = lines.findIndex((l, i) =>
//       i > 0 && l.includes('🆚') && !/\d\s*🆚/.test(l) && !/🆚\s*\d/.test(l)
//     );
//     return idx === -1 ? 1 : idx;
//   }
//   // Default: line index 1
//   return 1;
// }

// // ─────────────────────────────────────────────────────────
// // MAIN PARSER
// // ─────────────────────────────────────────────────────────
// export function parseMatchResult(rawText: string, communityId: CommunityId = 'auto'): ParsedMatchData {
//   const normalizedText = normalizeUnicodeText(rawText);
//   const lines = normalizedText
//     .split('\n')
//     .map(l => l.trim())
//     .filter(l => l.length > 0 && !isJunkLine(l));

//   const data: ParsedMatchData = {
//     competition: '',
//     opponentClub: '',
//     teeSide: 'left',
//     homeScore: null,
//     awayScore: null,
//     entries: [],
//     errors: [],
//   };

//   if (lines.length < 2) {
//     data.errors.push('Not enough lines to parse.');
//     return data;
//   }

//   // ── Competition (always line 0) ──────────────────────
//   data.competition = lines[0];

//   // ── Matchup line (community-dependent) ───────────────
//   const matchupIdx = findMatchupLineIndex(lines, communityId);
//   const matchupLine = lines[matchupIdx] || '';

//   // Try splitting on any known separator
//   const sepRegex = /(⚔️|⚒️|⚔|⚒)/;
//   const sepMatch = matchupLine.match(sepRegex);

//   const isTeeLine = (s: string) =>
//     s.toLowerCase().includes('enigmatic elite') || s.toLowerCase().includes('the elits');

//   if (isTeeLine(matchupLine)) {
//     const sep = sepMatch?.[0];
//     const parts = sep
//       ? matchupLine.split(sep)
//       : matchupLine.split(/\s{2,}/);

//     if (parts.length >= 2) {
//       const left  = parts[0].trim();
//       const right = parts.slice(1).join(sep ?? ' ').trim();
//       if (isTeeLine(left)) {
//         data.teeSide = 'left';
//         data.opponentClub = cleanPlayerName(right);
//       } else {
//         data.teeSide = 'right';
//         data.opponentClub = cleanPlayerName(left);
//       }
//     } else {
//       // For GKEC: matchup is "Aether athletic 🆚 The Enigmatic Elite"
//       if (matchupLine.includes('🆚')) {
//         const vsparts = matchupLine.split('🆚');
//         const left  = vsparts[0].trim();
//         const right = vsparts[1].trim();
//         if (isTeeLine(right)) {
//           data.teeSide = 'right';
//           data.opponentClub = cleanPlayerName(left);
//         } else {
//           data.teeSide = 'left';
//           data.opponentClub = cleanPlayerName(right);
//         }
//       } else {
//         data.errors.push('Could not determine matchup sides.');
//       }
//     }
//   } else {
//     data.errors.push("Could not find 'Enigmatic Elite' in the matchup line.");
//   }

//   // ── Global date (GKEC: from header line with DATE:) ──
//   let currentDate = todayString();
//   let currentTime = '';

//   if (communityId === 'gkec') {
//     // Line 1 has: MATCH - 2 | DATE: 26/06/2026 | ROUND: ...
//     for (let i = 0; i < Math.min(3, lines.length); i++) {
//       if (/DATE:/i.test(lines[i])) {
//         const d = parseDate(lines[i]);
//         if (d) { currentDate = d; break; }
//       }
//     }
//   }

//   // ── Body line parsing ─────────────────────────────────
//   let scorePendingNextLine = false; // for eFOB multi-line MATCH POINTS

//   for (let i = matchupIdx + 1; i < lines.length; i++) {
//     const line = lines[i];

//     // ── Pending score from previous line (eFOB MATCH POINTS: + next line) ──
//     if (scorePendingNextLine) {
//       scorePendingNextLine = false;
//       const s = extractEfobScores(line, data.teeSide);
//       if (s) { data.homeScore = s.home; data.awayScore = s.away; }
//       continue;
//     }

//     // ── Generic score lines (MATCH POINTS, WINS:, Match Win:) ──
//     if (isGenericScoreLine(line)) {
//       const nums = (line.match(/\d+/g) || []).map(Number);
//       if (nums.length >= 2) {
//         // Scores are on the same line
//         const s = extractGenericScores(line, data.teeSide);
//         if (s) { data.homeScore = s.home; data.awayScore = s.away; }
//       } else {
//         // No numbers found → scores are on the NEXT line (eFOB format)
//         scorePendingNextLine = true;
//       }
//       continue;
//     }

//     // GKEC POINTS block header
//     if (communityId === 'gkec' && /POINTS?\s*[-:]/i.test(line)) {
//       const s = extractGkecScores(lines, data.teeSide);
//       if (s) { data.homeScore = s.home; data.awayScore = s.away; }
//       continue;
//     }

//     // ECOB POINT: block header
//     if ((communityId === 'ecob' || communityId === 'auto') && /^\s*POINTS?\s*:?\s*$/i.test(line)) {
//       const s = extractEcobScores(lines);
//       if (s) { data.homeScore = s.home; data.awayScore = s.away; }
//       continue;
//     }

//     // ── GKEC: Skip Deadline lines (they come AFTER matches, not before) ──
//     if (communityId === 'gkec' && /deadline/i.test(line)) continue;

//     // ── Section header → update date/time ──
//     if (isGenericSectionHeader(line)) {
//       // For ECOB headers: "⏰ FIRST DAY | June 22 | PRIORITY 12:20-30:AM"
//       // date is between first and second |
//       let datePart = line;
//       let timePart = line;
//       if (line.includes('|')) {
//         const segments = line.split('|');
//         datePart = segments[1] || segments[0]; // middle segment usually has date
//         timePart = segments[segments.length - 1]; // last segment has time
//       }
//       const d = parseDate(datePart) || parseDate(line);
//       const t = extractTime(timePart) || extractTime(line);
//       if (d) currentDate = d;
//       currentTime = t;
//       continue;
//     }

//     // ── GKEC section labels (colored emojis, no date) — just skip ──
//     if (communityId === 'gkec' && /[🟣🟡🔴⏰🛑⏳🎖️⭐🌃]/.test(line) && !line.includes('🆚')) continue;

//     // ── Player match line ──
//     if (line.includes('🆚')) {
//       const parts = line.split('🆚');
//       if (parts.length !== 2) continue;

//       let leftPart  = parts[0].trim();
//       let rightPart = parts[1].trim();

//       const leftGoalM  = leftPart.match(/(\d+)$/);
//       const rightGoalM = rightPart.match(/^(\d+)/);

//       let leftGoals:  number | null = null;
//       let rightGoals: number | null = null;

//       if (leftGoalM && rightGoalM) {
//         leftGoals  = parseInt(leftGoalM[1],  10);
//         rightGoals = parseInt(rightGoalM[1], 10);
//         leftPart   = leftPart.slice(0, leftPart.length - leftGoalM[1].length).trim();
//         rightPart  = rightPart.slice(rightGoalM[1].length).trim();
//       }

//       const isTeeLeft    = data.teeSide === 'left';
//       const teePlayerRaw = isTeeLeft ? leftPart  : rightPart;
//       const oppPlayerRaw = isTeeLeft ? rightPart : leftPart;
//       const teeGoals     = isTeeLeft ? leftGoals  : rightGoals;
//       const oppGoals     = isTeeLeft ? rightGoals : leftGoals;

//       let result: 'win' | 'loss' | 'draw' | null = null;
//       let cleanSheet = false;

//       if (teeGoals !== null && oppGoals !== null) {
//         if (teeGoals > oppGoals)      result = 'win';
//         else if (teeGoals < oppGoals) result = 'loss';
//         else                          result = 'draw';
//         if (oppGoals === 0)           cleanSheet = true;
//       }

//       data.entries.push({
//         rawLine:               line,
//         teePlayerRawName:      cleanPlayerName(teePlayerRaw),
//         opponentPlayerRawName: cleanPlayerName(oppPlayerRaw),
//         goals:       teeGoals,
//         goalsConceded: oppGoals,
//         result,
//         cleanSheet,
//         motm: hasMotm(teePlayerRaw),
//         date: currentDate,
//         time: currentTime,
//       });
//     }
//   }

//   // ── Post-process: score extraction for GKEC/ECOB if not found in loop ──
//   if (data.homeScore === null) {
//     if (communityId === 'gkec') {
//       const s = extractGkecScores(lines, data.teeSide);
//       if (s) { data.homeScore = s.home; data.awayScore = s.away; }
//     } else if (communityId === 'ecob') {
//       const s = extractEcobScores(lines);
//       if (s) { data.homeScore = s.home; data.awayScore = s.away; }
//     }
//   }

//   return data;
// }



import type { CommunityId } from './communityConfigs';

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
  /** true when the score was extracted from an ambiguous joined-digit token
   *  (e.g. "11" with no separator) and should be double-checked by the admin. */
  ambiguousScore: boolean;
}

export interface ParsedMatchData {
  competition: string;
  opponentClub: string;
  teeSide: 'left' | 'right';
  homeScore: number | null;
  awayScore: number | null;
  entries: ParsedMatchEntry[];
  errors: string[];
  /** lines that looked like they might be a player result but couldn't be parsed */
  unparsedLines: string[];
}

// ─────────────────────────────────────────────────────────
// TEE IDENTIFIER
// Anything that identifies "our" club across all community formats.
// ─────────────────────────────────────────────────────────
const TEE_RE = /enigmatic\s*elite|the\s*elits|🆃🅴🅴|\bTEE\b/i;

// ─────────────────────────────────────────────────────────
// UNICODE NORMALIZER
// Converts Facebook/WhatsApp bold/italic/sans-serif Unicode
// math chars to plain ASCII. e.g. 𝗕𝗡𝗖 → BNC, 𝟲 → 6
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
  // Collapse non-breaking / odd unicode spaces to regular spaces, but
  // KEEP double-space runs intact since some formats use them as a
  // column separator between scores ("1  3" = 1 vs 3).
  result = result.replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ');
  return result;
}

// ─────────────────────────────────────────────────────────
// JUNK LINE DETECTION
// ─────────────────────────────────────────────────────────
function isJunkLine(line: string): boolean {
  const l = line.toLowerCase();
  return (
    l.startsWith('http') ||
    l.includes('cobegbd.com') ||
    l.includes('pesbd.xyz') ||
    l.includes('forwarded') ||
    /^\[live\]/i.test(l) ||
    /match\s*remain/i.test(l) ||
    /📋/.test(line) ||
    /^[-─=_]{3,}$/.test(line.trim()) // separator lines like --------
  );
}

// Decorative / structural banner lines that should never be mistaken
// for a player result line or a team-name line.
const BANNER_RE = /RESULT|DEADLINE|POINT|WINS?\s*:|MATCH\s*WIN|ROUND|GROUP\s*STAGE|SHOWTIME|RESPONSE\s*TIME|PRIORITY|^MATCH\b|BUILD\s*UP|ANCHOR\s*MAN|GOAL\s*POCHER/i;

// ─────────────────────────────────────────────────────────
// PLAYER NAME HELPERS
// ─────────────────────────────────────────────────────────
function cleanPlayerName(name: string): string {
  return name
    .replace(/[🔑🟨⭐@]/g, '')
    .replace(/👑/g, '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTeamName(name: string): string {
  return cleanPlayerName(name)
    .replace(/\s*\([A-Za-z0-9]{2,6}\)\s*$/, '') // strip trailing "(TEE)"-style abbreviation
    .trim();
}

function hasMotm(name: string): boolean {
  return name.includes('👑');
}

// ─────────────────────────────────────────────────────────
// DATE / TIME PARSERS
// ─────────────────────────────────────────────────────────
const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function todayString(): string {
  const n = new Date();
  return `${n.getFullYear()}-${(n.getMonth() + 1).toString().padStart(2, '0')}-${n.getDate().toString().padStart(2, '0')}`;
}

/** Extracts the FIRST time-like token: "12:20am", "12:20 AM", "23:00" */
function extractTime(s: string): string {
  const m = s.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (!m) return '';
  let h = parseInt(m[1], 10);
  const min = m[2];
  const mer = (m[3] || '').toLowerCase();
  if (mer === 'pm' && h !== 12) h += 12;
  if (mer === 'am' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${min}`;
}

/**
 * Best-effort year to use when a date string has no explicit year
 * (e.g. "Jun 28"). Pulled from anywhere in the whole pasted text
 * (competition titles often contain "2024", "2026" etc). Falls back
 * to the current system year only if nothing is found at all.
 */
function findDocYear(fullText: string): number {
  const matches = fullText.match(/\b(20\d{2})\b/g);
  if (matches && matches.length > 0) {
    // Prefer the first occurrence (usually in the competition/title line).
    return parseInt(matches[0], 10);
  }
  return new Date().getFullYear();
}

/**
 * Parses date from a string.
 * Supports: DD/MM/YYYY, DD Mon YYYY, Mon DD YYYY, Mon DD (uses docYear),
 * DD,Mon,YYYY (comma-separated).
 */
function parseDate(raw: string, docYear: number): string | null {
  // Replace commas used as date separators (e.g. 15,Nov,2024 → 15 Nov 2024)
  const s = raw.replace(/(\d),(\w)/g, '$1 $2').replace(/(\w),(\d)/g, '$1 $2');

  // DD/MM/YYYY
  const dmy = s.match(/(\d{1,2})\/(\d{2})\/(\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;

  // DD Mon YYYY
  const long = s.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
  if (long) {
    const mo = MONTH_MAP[long[2].toLowerCase().slice(0, 3)];
    if (mo !== undefined)
      return `${long[3]}-${(mo + 1).toString().padStart(2, '0')}-${parseInt(long[1]).toString().padStart(2, '0')}`;
  }

  // Mon DD YYYY
  const mdy = s.match(/([A-Za-z]{3,})\s+(\d{1,2})\s+(\d{4})/);
  if (mdy) {
    const mo = MONTH_MAP[mdy[1].toLowerCase().slice(0, 3)];
    if (mo !== undefined)
      return `${mdy[3]}-${(mo + 1).toString().padStart(2, '0')}-${parseInt(mdy[2]).toString().padStart(2, '0')}`;
  }

  // Mon DD (no year → best-effort doc year, NOT necessarily current system year)
  const short = s.match(/([A-Za-z]{3,})\s+(\d{1,2})\b/);
  if (short) {
    const mo = MONTH_MAP[short[1].toLowerCase().slice(0, 3)];
    if (mo !== undefined) {
      return `${docYear}-${(mo + 1).toString().padStart(2, '0')}-${parseInt(short[2]).toString().padStart(2, '0')}`;
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────
// SECTION HEADER DETECTION (generic)
// A line is a section header if it has a date pattern and no 🆚
// ─────────────────────────────────────────────────────────
function isGenericSectionHeader(line: string): boolean {
  if (line.includes('🆚')) return false;
  const hasMonthName = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(line);
  const hasDMY = /\d{1,2}\/\d{2}\/\d{4}/.test(line);
  return hasMonthName || hasDMY;
}

// ─────────────────────────────────────────────────────────
// SCORE EXTRACTION (generic, label-based)
// Works for every format seen so far because each one tags its score
// numbers with some kind of label right before/after them:
//   "TEE : 14  ║  Stars OF BPG : 20"
//   "Aether athletic : 4   The Enigmatic Elite : 31"
//   "🆂🅷🅵: 13 🆃🅴🅴: 22"
//   "WINS: 🆃🅴🅴 06 | 🆃🅾︎🆁 03"
// whether the labels are on the same line or spread across a block of
// lines after a "POINTS / WINS / MATCH WIN" header.
// ─────────────────────────────────────────────────────────
function extractLabeledScores(text: string): { tee: number; opp: number } | null {
  let tee: number | null = null;
  let opp: number | null = null;

  // label : number  (label can be before the number)
  const reBefore = /([\p{L}][\p{L}\p{N}\s.'()-]{0,40}?)\s*:\s*(\d{1,3})/gu;
  let m: RegExpExecArray | null;
  while ((m = reBefore.exec(text))) {
    const label = m[1];
    const score = parseInt(m[2], 10);
    if (TEE_RE.test(label)) tee = score;
    else if (opp === null) opp = score;
  }

  // label number   (no colon, label right before the number — eFOB style: "TEE : 14" already
  // covered above; this covers "🆃🅴🅴 06" with no colon)
  if (tee === null) {
    const reNoColon = /([\p{L}][\p{L}\p{N}\s.'()-]{0,30}?)\s+(\d{1,3})(?!\d)/gu;
    while ((m = reNoColon.exec(text))) {
      const label = m[1];
      const score = parseInt(m[2], 10);
      if (TEE_RE.test(label)) { tee = score; continue; }
      if (opp === null && /\p{L}/u.test(label)) opp = score;
    }
  }

  if (tee === null) return null;
  return { tee, opp: opp ?? 0 };
}

/** Fallback when no label is found at all: just take the last two numbers
 *  on the line and assign by teeSide position. */
function extractPositionalScores(text: string, teeSide: 'left' | 'right'): { tee: number; opp: number } | null {
  const nums = (text.match(/\d+/g) || []).map(Number);
  if (nums.length < 2) return null;
  const n1 = nums[nums.length - 2];
  const n2 = nums[nums.length - 1];
  return teeSide === 'left' ? { tee: n1, opp: n2 } : { tee: n2, opp: n1 };
}

const SCORE_TRIGGER_RE = /\bPOINTS?\b|\bWINS?\s*:|MATCH\s*WIN/i;

// ─────────────────────────────────────────────────────────
// MATCHUP (team vs team) DETECTION
// Tries several strategies, in order of reliability:
//   1. explicit 🆚 on one line (not glued to digits, i.e. not a score line)
//   2. explicit "VS"/"vs" word on one line
//   3. ⚔️ / ⚒️ symbol on one line
//   4. two team names on the same line separated by a double-space
//   5. two consecutive "team-name-looking" lines (no symbol at all)
// ─────────────────────────────────────────────────────────
function looksLikeTeamNameLine(line: string): boolean {
  if (!line) return false;
  if (line.length > 60) return false;
  if (/\d/.test(line)) return false;
  if (BANNER_RE.test(line)) return false;
  if (/🆚|⚔️|⚒️/.test(line)) return false;
  return /[A-Za-z\u0980-\u09FF]/.test(line); // has letters (incl. Bengali)
}

interface MatchupResult {
  teeSide: 'left' | 'right';
  opponentClub: string;
  consumedIdx: number[]; // line indices used up by the matchup, skip them later
}

function findMatchup(lines: string[]): MatchupResult | null {
  const scanLimit = Math.min(lines.length, 12);

  // Strategies 1–4: single-line separators
  for (let i = 1; i < scanLimit; i++) {
    const line = lines[i];
    if (!TEE_RE.test(line) && !/🆚|⚔️|⚒️|\bVS\b/i.test(line)) continue;

    let left = '', right = '', matched = false;

    if (line.includes('🆚') && !/\d\s*🆚/.test(line) && !/🆚\s*\d/.test(line)) {
      const parts = line.split('🆚');
      if (parts.length === 2) { left = parts[0]; right = parts[1]; matched = true; }
    } else if (/\bVS\b/i.test(line) && !/\d/.test(line)) {
      const parts = line.split(/\bVS\b/i);
      if (parts.length === 2) { left = parts[0]; right = parts[1]; matched = true; }
    } else if (/[⚔️⚒️]/.test(line)) {
      const sep = line.match(/[⚔️⚒️]/)![0];
      const parts = line.split(sep);
      if (parts.length === 2) { left = parts[0]; right = parts[1]; matched = true; }
    } else if (/\s{2,}/.test(line) && !/\d/.test(line)) {
      const parts = line.split(/\s{2,}/).filter(Boolean);
      if (parts.length === 2 && looksLikeTeamNameLine(parts[0]) && looksLikeTeamNameLine(parts[1])) {
        left = parts[0]; right = parts[1]; matched = true;
      }
    }

    if (matched) {
      left = left.trim(); right = right.trim();
      if (TEE_RE.test(left)) return { teeSide: 'left', opponentClub: cleanTeamName(right), consumedIdx: [i] };
      if (TEE_RE.test(right)) return { teeSide: 'right', opponentClub: cleanTeamName(left), consumedIdx: [i] };
    }
  }

  // Strategy 5: two consecutive bare team-name lines, no symbol
  for (let i = 1; i < scanLimit - 1; i++) {
    const a = lines[i], b = lines[i + 1];
    if (!looksLikeTeamNameLine(a) || !looksLikeTeamNameLine(b)) continue;
    if (!TEE_RE.test(a) && !TEE_RE.test(b)) continue;
    if (TEE_RE.test(a)) return { teeSide: 'left', opponentClub: cleanTeamName(b), consumedIdx: [i, i + 1] };
    return { teeSide: 'right', opponentClub: cleanTeamName(a), consumedIdx: [i, i + 1] };
  }

  return null;
}

// ─────────────────────────────────────────────────────────
// PLAYER RESULT LINE PARSING
// Supports four sub-formats:
//   A) Name1 N🆚M Name2            (explicit vs symbol, optionally with 🔑/👑)
//   B) Name1 (N)  (M) Name2        (parenthesised scores)
//   C) Name1 N  M Name2            (double-space-separated scores)
//   D) Name1 NM Name2              (digits glued together, ambiguous — best-effort split)
// ─────────────────────────────────────────────────────────
interface PlayerLineResult {
  leftName: string;
  rightName: string;
  leftGoals: number | null;
  rightGoals: number | null;
  ambiguous: boolean;
}

function splitAmbiguousDigits(digits: string): [number, number, boolean] {
  if (digits.length === 2) return [parseInt(digits[0], 10), parseInt(digits[1], 10), false];
  if (digits.length === 4) return [parseInt(digits.slice(0, 2), 10), parseInt(digits.slice(2), 10), true];
  if (digits.length === 3) return [parseInt(digits.slice(0, 1), 10), parseInt(digits.slice(1), 10), true];
  // 1 digit or 5+ digits: nothing sane to split, treat whole thing as one side, unknown other side
  return [parseInt(digits, 10), 0, true];
}

function parsePlayerLine(line: string): PlayerLineResult | null {
  // A) explicit 🆚
  if (line.includes('🆚')) {
    const parts = line.split('🆚');
    if (parts.length !== 2) return null;
    let leftPart = parts[0].trim();
    let rightPart = parts[1].trim();
    const leftGoalM = leftPart.match(/(\d+)$/);
    const rightGoalM = rightPart.match(/^(\d+)/);
    let leftGoals: number | null = null;
    let rightGoals: number | null = null;
    if (leftGoalM && rightGoalM) {
      leftGoals = parseInt(leftGoalM[1], 10);
      rightGoals = parseInt(rightGoalM[1], 10);
      leftPart = leftPart.slice(0, leftPart.length - leftGoalM[1].length).trim();
      rightPart = rightPart.slice(rightGoalM[1].length).trim();
    }
    return { leftName: leftPart, rightName: rightPart, leftGoals, rightGoals, ambiguous: false };
  }

  if (!/[A-Za-z\u0980-\u09FF].*\d.*[A-Za-z\u0980-\u09FF]/.test(line)) return null;
  if (BANNER_RE.test(line)) return null;

  // B) parenthesised: Name1 (N)  (M) Name2
  let m = line.match(/^(.+?)\(\s*(\d{1,3})\s*\)\s+\(\s*(\d{1,3})\s*\)\s+(.+)$/);
  if (m) {
    return {
      leftName: m[1].trim(), rightName: m[4].trim(),
      leftGoals: parseInt(m[2], 10), rightGoals: parseInt(m[3], 10),
      ambiguous: false,
    };
  }

  // C) double-space separated: Name1 N  M Name2
  m = line.match(/^(.+?)\s+(\d{1,3})\s{2,}(\d{1,3})\s+(.+)$/);
  if (m) {
    return {
      leftName: m[1].trim(), rightName: m[4].trim(),
      leftGoals: parseInt(m[2], 10), rightGoals: parseInt(m[3], 10),
      ambiguous: false,
    };
  }

  // C2) two clearly separate single-space-bounded numbers: Name1 N M Name2
  m = line.match(/^(.+?)\s+(\d{1,3})\s+(\d{1,3})\s+(.+)$/);
  if (m) {
    return {
      leftName: m[1].trim(), rightName: m[4].trim(),
      leftGoals: parseInt(m[2], 10), rightGoals: parseInt(m[3], 10),
      ambiguous: false,
    };
  }

  // D) glued digits, ambiguous: Name1 NM Name2
  m = line.match(/^(.+?)\s+(\d{2,4})\s+(.+)$/);
  if (m) {
    const [g1, g2, ambiguous] = splitAmbiguousDigits(m[2]);
    return { leftName: m[1].trim(), rightName: m[3].trim(), leftGoals: g1, rightGoals: g2, ambiguous };
  }

  return null;
}

// ─────────────────────────────────────────────────────────
// MAIN PARSER
// ─────────────────────────────────────────────────────────
export function parseMatchResult(
  rawText: string,
  _communityId: CommunityId = 'auto',
  overrideYear?: number,
): ParsedMatchData {
  const normalizedText = normalizeUnicodeText(rawText);
  // Admin-supplied year always wins; only fall back to guessing from the
  // pasted text (and then system year) if the admin didn't provide one.
  const docYear = overrideYear ?? findDocYear(normalizedText);

  const lines = normalizedText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !isJunkLine(l));

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

  if (lines.length < 2) {
    data.errors.push('Not enough lines to parse.');
    return data;
  }

  // ── Competition (always line 0) ──────────────────────
  data.competition = lines[0];

  // ── Matchup detection ────────────────────────────────
  const matchup = findMatchup(lines);
  const consumed = new Set<number>();
  if (!matchup) {
    data.errors.push("Could not determine matchup sides (no recognizable 'Enigmatic Elite' vs opponent pattern found).");
  } else {
    data.teeSide = matchup.teeSide;
    data.opponentClub = matchup.opponentClub;
    matchup.consumedIdx.forEach(i => consumed.add(i));
  }

  // ── Global "DATE:" header line (any format that has one) ──
  let currentDate = todayString();
  let currentTime = '';
  for (let i = 0; i < Math.min(4, lines.length); i++) {
    if (/DATE:/i.test(lines[i])) {
      const d = parseDate(lines[i], docYear);
      if (d) { currentDate = d; break; }
    }
  }

  // ── Pass 1: find the score block / line and mark consumed lines ──
  for (let i = 0; i < lines.length; i++) {
    if (consumed.has(i)) continue;
    const line = lines[i];
    if (!SCORE_TRIGGER_RE.test(line)) continue;

    // Build a window: this line + following lines until we hit another
    // section header or run out of plausible score lines.
    const windowLines: string[] = [line];
    consumed.add(i);
    for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
      if (isGenericSectionHeader(lines[j])) break;
      if (lines[j].includes('🆚')) break; // back into player results, stop
      windowLines.push(lines[j]);
      consumed.add(j);
      // Stop early once we've clearly captured two scores already.
      const probe = extractLabeledScores(windowLines.join(' | '));
      if (probe) break;
    }

    const windowText = windowLines.join(' | ');
    const labeled = extractLabeledScores(windowText);
    const result = labeled ?? extractPositionalScores(windowText, data.teeSide);
    if (result) {
      data.homeScore = result.tee;
      data.awayScore = result.opp;
    }
    break; // only need the first score block found
  }

  // ── Pass 2: walk remaining lines for date headers + player results ──
  for (let i = 0; i < lines.length; i++) {
    if (consumed.has(i)) continue;
    const line = lines[i];

    if (/deadline/i.test(line)) continue;
    if (/[🟣🟡🔴⏰🛑⏳🎖️⭐🌃]/.test(line) && !line.includes('🆚')) continue;

    // Section header → update date/time
    if (isGenericSectionHeader(line)) {
      let datePart = line;
      let timePart = line;
      if (line.includes('|')) {
        const segments = line.split('|');
        datePart = segments[0];
        timePart = segments[segments.length - 1];
      }
      const d = parseDate(datePart, docYear) || parseDate(line, docYear);
      const t = extractTime(timePart) || extractTime(line);
      if (d) currentDate = d;
      currentTime = t;
      continue;
    }

    // Player result line
    const parsed = parsePlayerLine(line);
    if (!parsed) {
      // Only flag as "unparsed" if it genuinely looked like it might be a result line.
      if (/[A-Za-z\u0980-\u09FF].*\d/.test(line) && !BANNER_RE.test(line) && line.length < 80) {
        data.unparsedLines.push(line);
      }
      continue;
    }

    const isTeeLeft = data.teeSide === 'left';
    const teePlayerRaw = isTeeLeft ? parsed.leftName : parsed.rightName;
    const oppPlayerRaw = isTeeLeft ? parsed.rightName : parsed.leftName;
    const teeGoals = isTeeLeft ? parsed.leftGoals : parsed.rightGoals;
    const oppGoals = isTeeLeft ? parsed.rightGoals : parsed.leftGoals;

    let result: 'win' | 'loss' | 'draw' | null = null;
    let cleanSheet = false;
    if (teeGoals !== null && oppGoals !== null) {
      if (teeGoals > oppGoals) result = 'win';
      else if (teeGoals < oppGoals) result = 'loss';
      else result = 'draw';
      if (oppGoals === 0) cleanSheet = true;
    }

    data.entries.push({
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
      ambiguousScore: parsed.ambiguous,
    });
  }

  if (data.entries.length === 0) {
    data.errors.push('No player result lines could be parsed — paste format may be unrecognized.');
  }

  return data;
}