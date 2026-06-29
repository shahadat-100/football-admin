export type CommunityId = 'auto' | 'cobeg' | 'pesbd' | 'gkec' | 'ecob' | 'efob';

export interface CommunityMeta {
  id: CommunityId;
  name: string;
  emoji: string;
  description: string;
  exampleScore: string;
}

export const COMMUNITIES: CommunityMeta[] = [
  {
    id: 'auto',
    name: 'Auto-detect',
    emoji: '🔧',
    description: 'Tries to detect format automatically',
    exampleScore: 'MATCH POINTS / WINS: / Match Win:',
  },
  {
    id: 'cobeg',
    name: 'COBEG',
    emoji: '⚒️',
    description: 'COBEG eFootball League',
    exampleScore: 'WINS: 🆃🅴🅴 10 | OPP 01',
  },
  {
    id: 'pesbd',
    name: 'PESBD',
    emoji: '⚔️',
    description: 'PESBD Classic Showdown',
    exampleScore: 'Match Win: OPP 01 | 09 🆃🅴🅴',
  },
  {
    id: 'gkec',
    name: 'GKEC',
    emoji: '🏆',
    description: 'GKEC Club World Cup',
    exampleScore: '🏆 POINTS - 📁Team : XX',
  },
  {
    id: 'ecob',
    name: 'ECOB',
    emoji: '🛡️',
    description: 'ECOB Elite Cup',
    exampleScore: 'POINT:\n🆃🅴🅴: 22',
  },
  {
    id: 'efob',
    name: 'eFOB',
    emoji: '🏅',
    description: 'eFOB Copa Cup',
    exampleScore: 'MATCH POINTS: TEE : 14 ║ OPP : 20',
  },
];
