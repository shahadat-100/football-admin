import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { matchFormSchema } from '../schemas';
import { Match, MatchFormValues } from '../types';
import { Button, Input, Select } from '@/shared/components';
import { MATCH_STATUSES, HOME_TEAM, COMPETITIONS } from '@/shared/lib/constants';
import { format } from 'date-fns';

interface MatchFormProps {
  initial?: Match;
  onSave: (data: Omit<Match, 'id'>) => void;
  onClose: () => void;
}

export function MatchForm({ initial, onSave, onClose }: MatchFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MatchFormValues>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
      homeTeam: initial?.homeTeam ?? HOME_TEAM,
      awayTeam: initial?.awayTeam ?? '',
      homeScore: initial?.homeScore ?? undefined,
      awayScore: initial?.awayScore ?? undefined,
      date: initial?.date ?? format(new Date(), 'yyyy-MM-dd'),
      competition: initial?.competition ?? 'Premier League',
      status: initial?.status ?? 'upcoming',
    },
  });

  const status = watch('status');
  const isFinished = status === 'finished';

  const onSubmit: SubmitHandler<MatchFormValues> = (values) => {
    onSave({
      ...values,
      homeScore: isFinished ? Number(values.homeScore) : null,
      awayScore: isFinished ? Number(values.awayScore) : null,
    } as Omit<Match, 'id'>);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end">
        <div className="grid gap-2 relative">
          <label className="text-[12px] font-medium text-gray-400">Home team</label>
          <Input value={HOME_TEAM} readOnly className="font-semibold cursor-not-allowed border-dashed text-[#1a1f3c] bg-[#fdf6e3]/50" />
        </div>
        <div className="pb-2 text-muted-foreground font-semibold text-[13px]">vs</div>
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-gray-400">Away team *</label>
          <Input {...register('awayTeam')} placeholder="Man City" error={errors.awayTeam?.message} className="text-[#1a1f3c] bg-[#fdf6e3]" />
        </div>
      </div>

      {isFinished && (
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/40 rounded-lg border border-border/50 animate-in fade-in slide-in-from-top-1">
          <div className="grid gap-2">
            <label className="text-[12px] font-medium text-gray-400">Home score</label>
            <Input type="number" min={0} {...register('homeScore')} error={errors.homeScore?.message} className="text-[#1a1f3c] bg-[#fdf6e3]" />
          </div>
          <div className="grid gap-2">
            <label className="text-[12px] font-medium text-gray-400">Away score</label>
            <Input type="number" min={0} {...register('awayScore')} error={errors.awayScore?.message} className="text-[#1a1f3c] bg-[#fdf6e3]" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-gray-400">Date</label>
          <Input type="date" {...register('date')} error={errors.date?.message} className="text-[#1a1f3c] bg-[#fdf6e3]" />
        </div>
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-gray-400">Status</label>
          <Select
            {...register('status')}
            options={MATCH_STATUSES.map(s => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))}
            error={errors.status?.message}
            className="text-[#1a1f3c] bg-[#fdf6e3]"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-gray-400">Competition</label>
        <Input 
          list="competitions"
          {...register('competition')} 
          placeholder="e.g. Premier League"
          error={errors.competition?.message}
          className="text-[#1a1f3c] bg-[#fdf6e3]"
        />
        <datalist id="competitions">
          {COMPETITIONS.map(c => <option key={c} value={c} />)}
        </datalist>
      </div>

      <div className="flex gap-2 justify-end mt-2">
        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
        <Button type="submit">{initial ? 'Save changes' : 'Add match'}</Button>
      </div>
    </form>
  );
}
