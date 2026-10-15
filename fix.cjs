const fs = require('fs');

// 1. Fix providers.tsx
let providers = fs.readFileSync('src/app/providers.tsx', 'utf8');
providers = providers.replace(/import \{ useAuthStore \}.*\n/g, '');
providers = providers.replace(/\s*const \{ checkAuth \} = useAuthStore\(\);\n/g, '');
providers = providers.replace(/\s*useEffect\(\(\) => \{\n\s+checkAuth\(\);\n\s+\}, \[checkAuth\]\);\n/g, '');
fs.writeFileSync('src/app/providers.tsx', providers);

// 2. Recreate index files
fs.writeFileSync('src/features/match-entries/index.ts', ''); 
fs.writeFileSync('src/features/matches/index.ts', '');
fs.writeFileSync('src/features/news/index.ts', '');
fs.writeFileSync('src/features/players/index.ts', "export * from './components/PlayerCard';\nexport * from './components/PlayerDetail';\n");

// 3. Fix unused variables
let players = fs.readFileSync('src/pages/Players.tsx', 'utf8');
players = players.replace(/import \{ Player \} from '@\/features\/players\/types';\n/g, '');
fs.writeFileSync('src/pages/Players.tsx', players);

let matchEntries = fs.readFileSync('src/pages/MatchEntries.tsx', 'utf8');
matchEntries = matchEntries.replace(/import \{ MatchEntry \} from '@\/features\/match-entries\/types';\n/g, '');
fs.writeFileSync('src/pages/MatchEntries.tsx', matchEntries);

let hallOfFame = fs.readFileSync('src/pages/HallOfFame.tsx', 'utf8');
hallOfFame = hallOfFame.replace(/import \{ useState, useEffect \} from 'react';/g, "import { useEffect } from 'react';");
fs.writeFileSync('src/pages/HallOfFame.tsx', hallOfFame);

let playerDetail = fs.readFileSync('src/features/players/components/PlayerDetail.tsx', 'utf8');
playerDetail = playerDetail.replace(/import \{ useState \} from 'react';\n/g, '');
playerDetail = playerDetail.replace(/import \{ Player \} from '\.\.\/types';\n/g, '');
playerDetail = playerDetail.replace(/matches,/g, "");
fs.writeFileSync('src/features/players/components/PlayerDetail.tsx', playerDetail);

let pieChart = fs.readFileSync('src/shared/components/PieChart.tsx', 'utf8');
pieChart = pieChart.replace(/const strokeDasharray = `\$\{value\} \$\{100 - value\}`;/g, '');
fs.writeFileSync('src/shared/components/PieChart.tsx', pieChart);

