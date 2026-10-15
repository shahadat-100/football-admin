const fs = require('fs');

let store = fs.readFileSync('src/store/footballStore.ts', 'utf8');

// Replace these implementations with nothing or empty functions
const toReplace = [
  /addPlayer: async \([^)]*\) => \{[\s\S]*?\},\s*updatePlayer:/,
  /updatePlayer: async \([^)]*\) => \{[\s\S]*?\},\s*removePlayer:/,
  /removePlayer: async \([^)]*\) => \{[\s\S]*?fetchMatches:/,
  
  /addMatch: async \([^)]*\) => \{[\s\S]*?\},\s*updateMatch:/,
  /updateMatch: async \([^)]*\) => \{[\s\S]*?\},\s*removeMatch:/,
  /removeMatch: async \([^)]*\) => \{[\s\S]*?fetchMatchEntries:/,
  
  /addMatchEntry: async \([^)]*\) => \{[\s\S]*?\},\s*updateMatchEntry:/,
  /updateMatchEntry: async \([^)]*\) => \{[\s\S]*?\},\s*removeMatchEntry:/,
  /removeMatchEntry: async \([^)]*\) => \{[\s\S]*?fetchNews:/,
  
  /addNews: async \([^)]*\) => \{[\s\S]*?\},\s*updateNews:/,
  /updateNews: async \([^)]*\) => \{[\s\S]*?\},\s*removeNews:/,
  /removeNews: async \([^)]*\) => \{[\s\S]*?fetchSeasons:/,

  /addHallOfFameEntry: async \([^)]*\) => \{[\s\S]*?\},\s*updateHallOfFameEntry:/,
  /updateHallOfFameEntry: async \([^)]*\) => \{[\s\S]*?\},\s*removeHallOfFameEntry:/,
  /removeHallOfFameEntry: async \([^)]*\) => \{[\s\S]*?\}\s*\)(?:\s*,)?\s*$/
];

store = store.replace(/addPlayer: async \(p\) => \{[\s\S]*?updatePlayer: async \(p\) => \{/g, 'updatePlayer: async (p) => {');
store = store.replace(/updatePlayer: async \(p\) => \{[\s\S]*?removePlayer: async \(id\) => \{/g, 'removePlayer: async (id) => {');
store = store.replace(/removePlayer: async \(id\) => \{[\s\S]*?fetchMatches:/g, 'fetchMatches:');

store = store.replace(/addMatch: async \(m\) => \{[\s\S]*?updateMatch: async \(m\) => \{/g, 'updateMatch: async (m) => {');
store = store.replace(/updateMatch: async \(m\) => \{[\s\S]*?removeMatch: async \(id\) => \{/g, 'removeMatch: async (id) => {');
store = store.replace(/removeMatch: async \(id\) => \{[\s\S]*?fetchMatchEntries:/g, 'fetchMatchEntries:');

store = store.replace(/addMatchEntry: async \(e\) => \{[\s\S]*?updateMatchEntry: async \(e\) => \{/g, 'updateMatchEntry: async (e) => {');
store = store.replace(/updateMatchEntry: async \(e\) => \{[\s\S]*?removeMatchEntry: async \(id\) => \{/g, 'removeMatchEntry: async (id) => {');
store = store.replace(/removeMatchEntry: async \(id\) => \{[\s\S]*?fetchNews:/g, 'fetchNews:');

store = store.replace(/addNews: async \(n\) => \{[\s\S]*?updateNews: async \(n\) => \{/g, 'updateNews: async (n) => {');
store = store.replace(/updateNews: async \(n\) => \{[\s\S]*?removeNews: async \(id\) => \{/g, 'removeNews: async (id) => {');
store = store.replace(/removeNews: async \(id\) => \{[\s\S]*?fetchSeasons:/g, 'fetchSeasons:');

store = store.replace(/addHallOfFameEntry: async \(entry\) => \{[\s\S]*?updateHallOfFameEntry: async \(entry\) => \{/g, 'updateHallOfFameEntry: async (entry) => {');
store = store.replace(/updateHallOfFameEntry: async \(entry\) => \{[\s\S]*?removeHallOfFameEntry: async \(id\) => \{/g, 'removeHallOfFameEntry: async (id) => {');
store = store.replace(/removeHallOfFameEntry: async \(id\) => \{[\s\S]*?\}\s*\)\s*\)\s*$/g, '\n    })\n  )\n');

// Also remove addSeason and setCurrentSeason as they were not in the interface anymore
store = store.replace(/addSeason: async \(name: string\) => \{[\s\S]*?setCurrentSeason: async \(id: number\) => \{/g, 'setCurrentSeason: async (id: number) => {');
store = store.replace(/setCurrentSeason: async \(id: number\) => \{[\s\S]*?fetchPlayerSeasonStats:/g, 'fetchPlayerSeasonStats:');

fs.writeFileSync('src/store/footballStore.ts', store);
