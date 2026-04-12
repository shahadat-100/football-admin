import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { playerFormSchema } from '../schemas';
import { Player, PlayerFormValues, Season } from '../types';
import { Button, Input, Select } from '@/shared/components';
import { POSITIONS } from '@/shared/lib/constants';
import { SeasonStatsEditor } from './SeasonStatsEditor';

interface PlayerFormProps {
  initial?: Player;
  onSave: (data: Omit<Player, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export function PlayerForm({ initial, onSave, onClose }: PlayerFormProps) {
  const [seasons, setSeasons] = useState<Season[]>(initial?.seasons ?? []);
  const [showAddSeason, setShowAddSeason] = useState(false);
  const [newSeasonYear, setNewSeasonYear] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      profileImage: initial?.profileImage ?? '',
      jersey: initial?.jersey ?? '',
      position: initial?.position ?? 'Forward',
      email: initial?.email ?? '',
      credential: initial?.credential ?? '',
      tags: initial?.tags?.join(', ') ?? '',
    },
  });

  const onSubmit = (values: PlayerFormValues) => {
    onSave({
      name: values.name,
      profileImage: values.profileImage,
      position: values.position,
      jersey: values.jersey ? Number(values.jersey) : undefined,
      email: values.email ?? '',
      credential: values.credential ?? '',
      tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      seasons: seasons,
    });
  };

  const handleAddSeason = () => {
    const yr = Number(newSeasonYear);
    if (!yr || yr < 1900 || yr >= new Date().getFullYear()) {
      alert('Enter a valid past year (e.g., 2023)');
      return;
    }
    if (seasons.find(s => s.year === yr)) {
      alert('Season ' + yr + ' already added');
      return;
    }
    setSeasons(prev => [...prev, { year: yr, monthlyStats: [] }].sort((a, b) => a.year - b.year));
    setShowAddSeason(false);
    setNewSeasonYear('');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-slate-300">Name *</label>
        <Input {...register('name')} placeholder="Mohamed Salah" error={errors.name?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-slate-300">Email</label>
          <Input {...register('email')} placeholder="player@team.com" error={errors.email?.message} />
        </div>
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-slate-300">Password / Credential</label>
          <Input type="password" {...register('credential')} placeholder="****" error={errors.credential?.message} />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-slate-300">Profile Image URL</label>
        <Input {...register('profileImage')} placeholder="https://api.dicebear.com/7.x/avataaars/svg?seed=Salah" error={errors.profileImage?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-slate-300">Jersey #</label>
          <Input type="number" {...register('jersey')} error={errors.jersey?.message} />
        </div>
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-slate-300">Position</label>
          <Select
            {...register('position')}
            options={POSITIONS.map(p => ({ label: p, value: p }))}
            error={errors.position?.message}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-slate-300">Tags (comma separated)</label>
        <Input {...register('tags')} placeholder="pacey, clinical" error={errors.tags?.message} />
      </div>

      <div className="border-t border-border mt-2 pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-semibold text-slate-300">Previous season stats</span>
          {!showAddSeason && (
            <Button size="sm" variant="secondary" onClick={() => setShowAddSeason(true)} type="button">
              + Add season
            </Button>
          )}
        </div>

        {showAddSeason && (
          <div className="bg-muted border border-border p-3 rounded-lg mb-4 flex items-end gap-3">
            <div className="flex-1">
              <label className="text-[11px] text-muted-foreground block mb-1">Year (e.g. 2023)</label>
              <Input
                type="number"
                value={newSeasonYear}
                onChange={e => setNewSeasonYear(e.target.value)}
                placeholder="2023"
              />
            </div>
            <Button type="button" onClick={handleAddSeason} className="h-9">Add</Button>
            <Button type="button" variant="ghost" onClick={() => setShowAddSeason(false)} className="h-9">Cancel</Button>
          </div>
        )}

        {seasons.length === 0 && !showAddSeason && (
          <p className="text-[12px] text-muted-foreground mb-4">
            No previous seasons. Click "+ Add season" to enter historical data.
          </p>
        )}

        {seasons.map((s, i) => (
          <SeasonStatsEditor
            key={i}
            season={s}
            onChange={(updated) => setSeasons(prev => prev.map((old, idx) => idx === i ? updated : old))}
            onRemove={() => setSeasons(prev => prev.filter((_, idx) => idx !== i))}
          />
        ))}
      </div>

      <div className="flex gap-2 justify-end mt-4">
        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
        <Button type="submit">{initial ? 'Save changes' : 'Add player'}</Button>
      </div>
    </form>
  );
}
