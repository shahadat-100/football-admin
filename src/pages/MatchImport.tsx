import { useState, useMemo, useEffect } from 'react';
import { parseMatchResult, ParsedMatchData, ParsedMatchEntry } from '@/shared/lib/parseMatchResult';
import { COMMUNITIES, CommunityId } from '@/shared/lib/communityConfigs';
import { useFootballStore } from '@/store/footballStore';
import { Button, Input, Select, Textarea, SearchableSelect, Toggle } from '@/shared/components';
import { calcHattricks } from '@/shared/lib/utils';
import { RESULTS } from '@/shared/lib/constants';

export function MatchImport() {
  const [step, setStep] = useState<1 | 2>(1);
  const [rawText, setRawText] = useState('');
  const [communityId, setCommunityId] = useState<CommunityId>('auto');
  const [parsedData, setParsedData] = useState<ParsedMatchData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  const players = useFootballStore(state => state.players);
  const addMatch = useFootballStore(state => state.addMatch);
  const addMatchEntry = useFootballStore(state => state.addMatchEntry);
  const competitions = useFootballStore(state => state.competitions);
  const fetchPlayers = useFootballStore(state => state.fetchPlayers);
  const fetchCompetitions = useFootballStore(state => state.fetchCompetitions);

  useEffect(() => {
    fetchPlayers();
    fetchCompetitions();
  }, [fetchPlayers, fetchCompetitions]);

  const handleParse = () => {
    const data = parseMatchResult(rawText, communityId);
    if (data.errors.length > 0) {
      setErrors(data.errors);
      return;
    }
    setErrors([]);
    setParsedData(data);
    setStep(2);
  };

  const fuzzyMatchPlayer = (rawName: string) => {
    const normalizedRaw = rawName.toLowerCase().replace(/\s+/g, '');
    const match = players.find(p => {
      const normalizedPName = p.name.toLowerCase().replace(/\s+/g, '');
      if (!normalizedPName || !normalizedRaw) return false;
      return normalizedPName.includes(normalizedRaw) || normalizedRaw.includes(normalizedPName);
    });
    return match?.id || '';
  };

  const [mappedEntries, setMappedEntries] = useState<(ParsedMatchEntry & { playerId: string })[]>([]);

  useMemo(() => {
    if (parsedData && step === 2) {
      setMappedEntries(
        parsedData.entries.map(e => ({
          ...e,
          playerId: fuzzyMatchPlayer(e.teePlayerRawName),
        }))
      );
    }
  }, [parsedData, step, players]);

  const updateMappedEntry = (index: number, updates: Partial<typeof mappedEntries[0]>) => {
    setMappedEntries(prev => {
      const nw = [...prev];
      nw[index] = { ...nw[index], ...updates };
      
      // Auto calc result
      if (updates.goals !== undefined || updates.goalsConceded !== undefined) {
        const goals = nw[index].goals ?? 0;
        const gc = nw[index].goalsConceded ?? 0;
        if (goals > gc) nw[index].result = 'win';
        else if (goals < gc) nw[index].result = 'loss';
        else nw[index].result = 'draw';

        if (gc === 0) nw[index].cleanSheet = true;
        else nw[index].cleanSheet = false;
      }
      return nw;
    });
  };

  const handleConfirm = async () => {
    if (!parsedData) return;
    setIsSaving(true);
    setErrors([]);
    try {
      // 1. Create Match
      const matchId = await addMatch({
        homeTeam: 'The Elits',
        awayTeam: parsedData.opponentClub,
        homeScore: parsedData.homeScore,
        awayScore: parsedData.awayScore,
        date: parsedData.entries[0]?.date || new Date().toISOString().split('T')[0],
        time: '',
        competition: parsedData.competition,
        status: 'finished',
      });

      if (!matchId) {
        throw new Error('Failed to create parent match. Match ID was null.');
      }

      // 2. Loop and Create Entries
      for (const e of mappedEntries) {
        if (!e.playerId) {
          throw new Error(`Player not mapped for ${e.teePlayerRawName}`);
        }
        
        await addMatchEntry({
          playerId: e.playerId,
          matchId: matchId,
          goals: e.goals ?? 0,
          goalsConceded: e.goalsConceded ?? 0,
          result: e.result ?? 'draw',
          cleanSheet: e.cleanSheet,
          motm: e.motm,
          date: e.date,
          time: e.time,
          notes: e.opponentPlayerRawName,
          hattricks: calcHattricks(e.goals ?? 0),
        });
      }
      
      alert('Match successfully imported!');
      // Reset
      setStep(1);
      setRawText('');
      setParsedData(null);
      setMappedEntries([]);
    } catch (err: any) {
      setErrors([err.message || 'Unknown error during save']);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Import Match Result</h1>
        <p className="text-sm text-gray-400">Paste announcement text to auto-generate matches and player stats.</p>
      </div>

      {errors.length > 0 && (
        <div className="p-4 bg-red-950/50 border border-red-500/50 text-red-200 rounded-lg">
          <p className="font-semibold mb-1 text-sm">Errors:</p>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          {/* Community Selector */}
          <div className="bg-[#1a1f3c] border border-white/5 rounded-xl p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Select Community</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {COMMUNITIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCommunityId(c.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center ${
                    communityId === c.id
                      ? 'border-primary bg-primary/10 text-white'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-gray-200'
                  }`}
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="text-xs font-semibold">{c.name}</span>
                  <span className="text-[10px] text-gray-500 leading-tight">{c.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Text Input */}
          <div className="bg-[#1a1f3c] border border-white/5 rounded-xl p-6 shadow-xl">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-300">Raw Announcement Text</label>
                <Textarea 
                  rows={14} 
                  value={rawText} 
                  onChange={e => setRawText(e.target.value)}
                  placeholder="Paste the raw Messenger/WhatsApp text here..."
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleParse} disabled={rawText.trim().length === 0}>
                  Parse Content →
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && parsedData && (
        <div className="space-y-6">
          <div className="bg-[#1a1f3c] border border-white/5 rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="font-bold text-lg text-white border-b border-white/5 pb-2">Match Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-gray-400 mb-1">Competition</p>
                <Input value={parsedData.competition} onChange={e => setParsedData({...parsedData, competition: e.target.value})} />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Opponent</p>
                <Input value={parsedData.opponentClub} onChange={e => setParsedData({...parsedData, opponentClub: e.target.value})} />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Home Score (TEE)</p>
                <Input type="number" value={parsedData.homeScore ?? ''} onChange={e => setParsedData({...parsedData, homeScore: parseInt(e.target.value) || 0})} />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Away Score</p>
                <Input type="number" value={parsedData.awayScore ?? ''} onChange={e => setParsedData({...parsedData, awayScore: parseInt(e.target.value) || 0})} />
              </div>
            </div>
          </div>

          <div className="bg-[#1a1f3c] border border-white/5 rounded-xl p-6 shadow-xl">
            <h2 className="font-bold text-lg text-white border-b border-white/5 pb-4 mb-4">Player Entries ({mappedEntries.length})</h2>
            
            <div className="space-y-4">
              {mappedEntries.map((entry, idx) => (
                <div key={idx} className="bg-white/5 rounded-lg p-4 grid gap-4 grid-cols-1 md:grid-cols-12 items-center">
                  <div className="md:col-span-3">
                    <p className="text-xs text-gray-400 mb-1">Player {entry.playerId ? '' : <span className="text-red-400">(Unmatched)</span>}</p>
                    <SearchableSelect 
                      options={players.map(p => ({ label: p.name, value: p.id }))}
                      value={entry.playerId}
                      onChange={v => updateMappedEntry(idx, { playerId: v })}
                    />
                    <p className="text-[10px] text-gray-500 mt-1 truncate">Raw: {entry.teePlayerRawName}</p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-400 mb-1">Opponent</p>
                    <Input value={entry.opponentPlayerRawName} onChange={e => updateMappedEntry(idx, { opponentPlayerRawName: e.target.value })} />
                  </div>

                  <div className="md:col-span-1">
                    <p className="text-xs text-gray-400 mb-1">GS</p>
                    <Input type="number" value={entry.goals ?? ''} onChange={e => updateMappedEntry(idx, { goals: parseInt(e.target.value) || 0 })} />
                  </div>
                  
                  <div className="md:col-span-1">
                    <p className="text-xs text-gray-400 mb-1">GC</p>
                    <Input type="number" value={entry.goalsConceded ?? ''} onChange={e => updateMappedEntry(idx, { goalsConceded: parseInt(e.target.value) || 0 })} />
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-400 mb-1">Result</p>
                    <Select 
                      value={entry.result || 'win'} 
                      options={RESULTS.map(r => ({ label: r, value: r }))}
                      onChange={e => updateMappedEntry(idx, { result: e.target.value as any })}
                    />
                  </div>
                  
                  <div className="md:col-span-1 flex justify-center">
                     <div className="flex flex-col items-center">
                       <p className="text-[10px] text-gray-400 mb-1">CS</p>
                       <Toggle checked={entry.cleanSheet} onChange={v => updateMappedEntry(idx, { cleanSheet: v })} />
                     </div>
                  </div>
                  <div className="md:col-span-1 flex justify-center">
                    <div className="flex flex-col items-center">
                       <p className="text-[10px] text-gray-400 mb-1">MOTM</p>
                       <Toggle checked={entry.motm} onChange={v => updateMappedEntry(idx, { motm: v })} />
                     </div>
                  </div>

                  <div className="md:col-span-1 flex flex-col justify-center items-end h-full">
                     <p className="text-[10px] text-gray-500">{entry.date}</p>
                     <p className="text-[10px] text-gray-500">{entry.time}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between mt-6 pt-4 border-t border-white/5">
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleConfirm} disabled={isSaving || mappedEntries.some(e => !e.playerId)}>
                {isSaving ? 'Saving...' : 'Confirm & Save All'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
