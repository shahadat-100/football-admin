const fs = require('fs');

// providers.tsx
let p = fs.readFileSync('src/app/providers.tsx', 'utf8');
p = p.replace(/import \{ useState, useEffect \} from 'react';/, "import { useState } from 'react';");
fs.writeFileSync('src/app/providers.tsx', p);

// MatchEntries.tsx
let me = fs.readFileSync('src/pages/MatchEntries.tsx', 'utf8');
me = me.replace(/matches,/g, '');
fs.writeFileSync('src/pages/MatchEntries.tsx', me);

// PieChart.tsx
let pc = fs.readFileSync('src/shared/components/PieChart.tsx', 'utf8');
pc = pc.replace(/const strokeDasharray = .*\n/g, '');
fs.writeFileSync('src/shared/components/PieChart.tsx', pc);

// footballStore.ts
let fsData = fs.readFileSync('src/store/footballStore.ts', 'utf8');
fsData = fsData.replace(/\/\/ ── Upsert Roles & Tags to Junction Tables ──[\s\S]*?\/\/ ── Background Aggregation Sync Helper ──/g, '// ── Background Aggregation Sync Helper ──');
fsData = fsData.replace(/\/\/ ── Background Aggregation Sync Helper ──[\s\S]*?\/\/ ── Milestone System ──/g, '// ── Milestone System ──');
fsData = fsData.replace(/\/\/ ── Milestone System ──[\s\S]*?export const useFootballStore = create<FootballStore>\(\)\(/g, 'export const useFootballStore = create<FootballStore>()(');
fsData = fsData.replace(/\(set, get\) => \(\{/g, '(set) => ({');
fsData = fsData.replace(/setCurrentSeason: async \(id\)/g, 'setCurrentSeason: async (id: number)');
fs.writeFileSync('src/store/footballStore.ts', fsData);
