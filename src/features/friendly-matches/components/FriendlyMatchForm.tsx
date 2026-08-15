import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { friendlyMatchFormSchema } from '../schemas';
import { FriendlyMatch, FriendlyMatchFormValues } from '../types';
import { Player } from '@/features/players/types';
import { Button, Input, SearchableSelect, Textarea } from '@/shared/components';
import { format } from 'date-fns';

interface FriendlyMatchFormProps {
  initial?: FriendlyMatch;
  players: Player[];
  onSave: (data: Omit<FriendlyMatch, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export function FriendlyMatchForm({ initial, players, onSave, onClose }: FriendlyMatchFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FriendlyMatchFormValues>({
    resolver: zodResolver(friendlyMatchFormSchema),
    defaultValues: {
      player1Id: initial?.player1Id ?? '',
      player2Id: initial?.player2Id ?? '',
      player1Goals: initial?.player1Goals ?? 0,
      player2Goals: initial?.player2Goals ?? 0,
      date: initial?.date ?? format(new Date(), 'yyyy-MM-dd'),
      time: initial?.time ?? '',
      notes: initial?.notes ?? '',
    },
  });

  const p1Goals = Number(watch('player1Goals') ?? 0);
  const p2Goals = Number(watch('player2Goals') ?? 0);
  const result =
    p1Goals > p2Goals ? '⚽ Player 1 Wins' :
    p2Goals > p1Goals ? '⚽ Player 2 Wins' :
    '🤝 Draw';

  const onSubmit = (values: FriendlyMatchFormValues) => {
    onSave({
      ...values,
      player1Goals: Number(values.player1Goals),
      player2Goals: Number(values.player2Goals),
    });
  };

  const playerOptions = players.map(p => ({ label: p.name, value: p.id }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

      {/* Players row */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-gray-400">Player 1 *</label>
          <Controller
            name="player1Id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                value={field.value}
                onChange={field.onChange}
                options={playerOptions}
                error={errors.player1Id?.message}
              />
            )}
          />
        </div>

        <div className="pb-2 text-muted-foreground font-semibold text-[13px]">vs</div>

        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-gray-400">Player 2 *</label>
          <Controller
            name="player2Id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                value={field.value}
                onChange={field.onChange}
                options={playerOptions}
                error={errors.player2Id?.message}
              />
            )}
          />
        </div>
      </div>

      {/* Scores row */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-gray-400">Player 1 Goals</label>
          <Input type="number" min={0} {...register('player1Goals')} error={errors.player1Goals?.message} className="text-center font-bold text-lg" />
        </div>

        <div className="pb-2 text-center">
          <span className={`text-[11px] font-semibold px-2 py-1 rounded-md ${
            p1Goals > p2Goals ? 'bg-emerald-500/10 text-emerald-400' :
            p2Goals > p1Goals ? 'bg-red-500/10 text-red-400' :
            'bg-amber-500/10 text-amber-400'
          }`}>{result}</span>
        </div>

        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-gray-400">Player 2 Goals</label>
          <Input type="number" min={0} {...register('player2Goals')} error={errors.player2Goals?.message} className="text-center font-bold text-lg" />
        </div>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-gray-400">Date *</label>
          <Input type="date" {...register('date')} error={errors.date?.message} />
        </div>
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-gray-400">Time (Optional)</label>
          <Input type="time" {...register('time')} error={errors.time?.message} />
        </div>
      </div>

      {/* Notes */}
      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-gray-400">Notes (Optional)</label>
        <Textarea rows={2} {...register('notes')} error={errors.notes?.message} placeholder="e.g. Training session, rematch..." />
      </div>

      <div className="flex gap-2 justify-end mt-2">
        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
        <Button type="submit">{initial ? 'Save changes' : 'Add friendly match'}</Button>
      </div>
    </form>
  );
}
