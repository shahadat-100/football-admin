import React, { createContext, useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { playerFormSchema } from '../schemas';
import { Player, PlayerFormValues, Season } from '../types';
import { Button, Input, ImageUpload } from '@/shared/components';
import { PlayerTagSelector } from './PlayerTagSelector';
import { SeasonStatsEditor } from './SeasonStatsEditor';

import { ChevronDown, ChevronUp } from 'lucide-react';

const CollapsibleContext = createContext<{ open: boolean; setOpen: (open: boolean) => void }>({ open: false, setOpen: () => {} });

function Collapsible({ children, className }: { children: React.ReactNode, className?: string }) {
  const [open, setOpen] = useState(false);
  return <CollapsibleContext.Provider value={{ open, setOpen }}><div className={className}>{children}</div></CollapsibleContext.Provider>;
}

function CollapsibleTrigger({ children, className }: { children: React.ReactNode | ((open: boolean) => React.ReactNode), className?: string }) {
  const { open, setOpen } = useContext(CollapsibleContext);
  return <button type="button" onClick={() => setOpen(!open)} className={className}>
    {typeof children === 'function' ? children(open) : children}
  </button>;
}

function CollapsibleContent({ children, className }: { children: React.ReactNode, className?: string }) {
  const { open } = useContext(CollapsibleContext);
  if (!open) return null;
  return <div className={className}>{children}</div>;
}

interface PlayerFormProps {
  initial?: Partial<Player>;
  onSave: (data: PlayerFormValues) => void;
  onClose: () => void;
}

export function PlayerForm({ initial, onSave, onClose }: PlayerFormProps) {
  const [seasons, setSeasons] = useState<Season[]>((initial as any)?.seasons ?? []);
  const [showAddSeason, setShowAddSeason] = useState(false);
  const [newSeasonYear, setNewSeasonYear] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      profileImageUrl: initial?.profileImageUrl ?? '',
      jerseyNumber: initial?.jerseyNumber ?? '',
      email: initial?.email ?? '',
      playerRoles: initial?.playerRoles ?? [],
      customTags: initial?.customTags?.join(', ') ?? '',
    } as any,
  });

  const handleAddSeason = () => {
    const yr = Number(newSeasonYear);
    if (!yr || yr < 1900 || yr >= new Date().getFullYear() + 1) {
      alert('Enter a valid year (e.g., 2023)');
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

  const onSubmit = (values: PlayerFormValues) => {
    for (const season of seasons) {
      for (const month of season.monthlyStats || []) {
        for (const week of month.weeklyStats || []) {
          if (week.matches > 0 && week.win + week.loss + week.draw !== week.matches) {
            const monthName = new Date(2000, month.month - 1, 1).toLocaleString('default', { month: 'long' });
            alert(`Season ${season.year} - ${monthName} - Week ${week.week}:\nWins, Draws, and Losses (${week.win + week.draw + week.loss}) must exactly equal the number of matches (${week.matches}).`);
            return;
          }
        }
      }
    }
    onSave({ ...values, seasons } as any);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-gray-400">Name</label>
        <Input {...register('name')} placeholder="Mohamed Salah" error={errors.name?.message} />
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-gray-400">Profile Image</label>
        <ImageUpload
          value={watch('profileImageUrl')}
          onChange={(val) => setValue('profileImageUrl', val || '')}
          onRemove={() => setValue('profileImageUrl', '')}
        />
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-gray-400">Jersey Number</label>
        <Input type="number" {...register('jerseyNumber')} error={errors.jerseyNumber?.message} />
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-gray-400">
          Email <span className="text-red-500">*</span>
        </label>
        <Input
          type="email"
          {...register('email')}
          placeholder="player@example.com"
          error={(errors as any).email?.message}
        />
      </div>

      {/* Player Roles — hardcoded chips, also upserted to player_role table */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">
          Player Roles
        </label>
        <Collapsible>
          <CollapsibleTrigger className="w-full flex justify-between items-center border-2 border-foreground px-3 py-2 font-mono text-xs uppercase tracking-widest shadow-retro bg-card">
            {(open) => (
              <>
                <span>
                  {watch("playerRoles")?.length
                    ? `${watch("playerRoles").length} tag(s) selected`
                    : "Select roles & status..."}
                </span>
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="border-2 border-t-0 border-foreground p-3 bg-card">
            <PlayerTagSelector
              value={watch("playerRoles") ?? []}
              onChange={(val) => setValue("playerRoles", val)}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Custom Tags — free text, also upserted to custom_tags table */}
      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-gray-400">
          Custom Tags
          <span className="ml-2 text-[10px] text-muted-foreground font-normal">(comma separated)</span>
        </label>
        <Input
          {...register('customTags')}
          placeholder="pacey, clinical, season 3 champs"
          error={errors.customTags?.message}
        />
      </div>

      {!initial && (
        <div className="border-t border-border mt-2 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-gray-400">Previous season stats</span>
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
      )}

      <div className="flex gap-2 justify-end mt-4">
        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
        <Button type="submit">{initial ? 'Save changes' : 'Add player'}</Button>
      </div>
    </form>
  );
}
