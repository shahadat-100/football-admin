import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Select, Textarea } from '@/shared/components';
import { Player } from '@/features/players/types';
import { HallOfFameEntry } from '@/store/footballStore';

const schema = z.object({
  playerId: z.string().min(1, "Player selection required"),
  category: z.string().min(1, "Category is required"),
  seasonText: z.string().min(1, "Season/Year text is required"),
  subTitle: z.string().min(1, "Sub-title is required"),
  descriptions: z.string().min(1, "Description is required"),
});

type FormValues = z.infer<typeof schema>;

interface HallOfFameFormProps {
  initial?: HallOfFameEntry;
  players: Player[];
  onSave: (data: Omit<HallOfFameEntry, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export function HallOfFameForm({ initial, players, onSave, onClose }: HallOfFameFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      playerId: initial?.playerId ?? (players[0]?.id || ''),
      category: initial?.category ?? '',
      seasonText: initial?.seasonText ?? '',
      subTitle: initial?.subTitle ?? '',
      descriptions: initial?.descriptions ?? '',
    },
  });

  const onSubmit = (values: FormValues) => {
    onSave(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-gray-400">Inductee (Player) *</label>
        <Select
          {...register('playerId')}
          options={players.map(p => ({ label: p.name, value: p.id }))}
          error={errors.playerId?.message}
          className="text-[#1a1f3c] bg-[#fdf6e3]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-gray-400">Category *</label>
          <Input 
            {...register('category')} 
            placeholder="e.g. Club Legend, Top Scorer" 
            error={errors.category?.message}
            className="text-[#1a1f3c] bg-[#fdf6e3]"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-gray-400">Season / Year *</label>
          <Input 
            {...register('seasonText')} 
            placeholder="e.g. Season 2024, 2023-24" 
            error={errors.seasonText?.message}
            className="text-[#1a1f3c] bg-[#fdf6e3]"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-gray-400">Sub-title *</label>
        <Input 
          {...register('subTitle')} 
          placeholder="e.g. 45 Goals in 30 Matches" 
          error={errors.subTitle?.message}
          className="text-[#1a1f3c] bg-[#fdf6e3]"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-gray-400">Description / Achievement *</label>
        <Textarea 
          rows={3} 
          {...register('descriptions')} 
          placeholder="Describe their outstanding performance or induction summary..." 
          error={errors.descriptions?.message}
          className="text-[#1a1f3c] bg-[#fdf6e3]"
        />
      </div>

      <div className="flex gap-2 justify-end mt-2">
        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
        <Button type="submit">{initial ? 'Save Changes' : 'Induct Player'}</Button>
      </div>
    </form>
  );
}
