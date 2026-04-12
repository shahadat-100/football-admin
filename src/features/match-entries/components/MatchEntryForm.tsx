import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { matchEntryFormSchema } from '../schemas';
import { MatchEntry, MatchEntryFormValues } from '../types';
import { Player } from '@/features/players/types';
import { Match } from '@/features/matches/types';
import { Button, Input, Select, Toggle, Textarea } from '@/shared/components';
import { RESULTS } from '@/shared/lib/constants';
import { calcHattricks } from '@/shared/lib/utils';
import { format } from 'date-fns';
import { useEffect } from 'react';

interface MatchEntryFormProps {
  initial?: MatchEntry;
  players: Player[];
  matches: Match[];
  onSave: (data: Omit<MatchEntry, 'id'>) => void;
  onClose: () => void;
}

export function MatchEntryForm({ initial, players, matches, onSave, onClose }: MatchEntryFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MatchEntryFormValues>({
    resolver: zodResolver(matchEntryFormSchema),
    defaultValues: {
      playerId: initial?.playerId ?? (players[0]?.id || ''),
      matchId: initial?.matchId ?? '',
      goals: initial?.goals ?? 0,
      goalsConceded: initial?.goalsConceded ?? 0,
      result: initial?.result ?? 'win',
      cleanSheet: initial?.cleanSheet ?? false,
      motm: initial?.motm ?? false,
      date: initial?.date ?? format(new Date(), 'yyyy-MM-dd'),
      notes: initial?.notes ?? '',
    },
  });

  const goals = Number(watch('goals') ?? 0);
  const goalsConceded = Number(watch('goalsConceded') ?? 0);
  const hattricks = calcHattricks(goals);

  const cleanSheet = watch('cleanSheet');
  const motm = watch('motm');

  useEffect(() => {
    // Auto-calculate Clean Sheet
    setValue('cleanSheet', goalsConceded === 0);

    // Auto-calculate Result
    if (goals > goalsConceded) setValue('result', 'win');
    else if (goals < goalsConceded) setValue('result', 'loss');
    else setValue('result', 'draw');
  }, [goals, goalsConceded, setValue]);

  const onSubmit = (values: MatchEntryFormValues) => {
    onSave({
      ...values,
      hattricks,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-slate-300">Player</label>
          <Select
            {...register('playerId')}
            options={players.map(p => ({ label: p.name, value: p.id }))}
            error={errors.playerId?.message}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-slate-300">Match</label>
          <Select
            {...register('matchId')}
            options={[
              { label: '— None (Custom Date) —', value: '' },
              ...matches.map(m => ({ label: `${m.homeTeam} vs ${m.awayTeam}`, value: m.id }))
            ]}
            error={errors.matchId?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-slate-300">Goals</label>
          <Input type="number" min={0} {...register('goals')} error={errors.goals?.message} />
        </div>
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-slate-300">Goals Conceded</label>
          <Input type="number" min={0} {...register('goalsConceded')} error={errors.goalsConceded?.message} />
        </div>
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-slate-300">Result (auto)</label>
          <Select
            {...register('result')}
            disabled
            options={RESULTS.map(r => ({ label: r, value: r }))}
            error={errors.result?.message}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-slate-300">Date</label>
        <Input type="date" {...register('date')} error={errors.date?.message} />
      </div>

      <div className="bg-muted/50 border border-border p-3 rounded-lg mb-2">
        <label className="text-[12px] font-semibold text-slate-300 mb-3 block">Flags</label>
        <div className="flex items-center justify-between bg-background border border-border rounded-lg px-3 py-2 mb-2">
          <span className="text-[12px] text-slate-300">Hat-tricks (auto-calculated)</span>
          <span className={`text-[13px] font-bold py-0.5 px-3 rounded-md border ${hattricks > 0 ? 'bg-accent text-accent-foreground border-accent-foreground/50' : 'bg-muted text-muted-foreground border-border'}`}>
            {hattricks}
          </span>
        </div>
        <Toggle label="Clean sheet (auto)" checked={cleanSheet} disabled onChange={v => setValue('cleanSheet', v)} className="mb-2 bg-background" />
        <Toggle label="Man of the match" checked={motm} onChange={v => setValue('motm', v)} className="bg-background" />
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-slate-300">Notes</label>
        <Textarea rows={2} {...register('notes')} error={errors.notes?.message} />
      </div>

      <div className="flex gap-2 justify-end mt-2">
        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
        <Button type="submit">{initial ? 'Save changes' : 'Add entry'}</Button>
      </div>
    </form>
  );
}
