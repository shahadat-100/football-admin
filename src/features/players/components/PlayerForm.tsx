import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { playerFormSchema } from '../schemas';
import { Player, PlayerFormValues, Season } from '../types';
import { Button, Input, ImageUpload } from '@/shared/components';
import { SeasonStatsEditor } from './SeasonStatsEditor';
import { useFootballStore } from '@/store/footballStore';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface PlayerFormProps {
  initial?: Partial<Player>;
  onSave: (data: PlayerFormValues) => void;
  onClose: () => void;
}

export function PlayerForm({ initial, onSave, onClose }: PlayerFormProps) {
  const { 
    availableRoles, 
    availableTags,
    fetchAvailableRoles,
    fetchAvailableTags
  } = useFootballStore();

  useEffect(() => {
    if (availableRoles.length === 0) {
      fetchAvailableRoles();
    }
    if (availableTags.length === 0) {
      fetchAvailableTags();
    }
  }, [availableRoles.length, availableTags.length, fetchAvailableRoles, fetchAvailableTags]);
  const [seasons, setSeasons] = useState<Season[]>((initial as any)?.seasons ?? []);
  const [showAddSeason, setShowAddSeason] = useState(false);
  const [newSeasonYear, setNewSeasonYear] = useState('');
  const [rolesOpen, setRolesOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [stringTags, setStringTags] = useState<string[]>(initial?.customStringTags ?? []);
  const [tagInput, setTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      profileImageUrl: initial?.profileImageUrl ?? '',
      coverImageUrl: initial?.coverImageUrl ?? '',
      jerseyNumber: initial?.jerseyNumber ?? '',
      dateOfBirth: initial?.dateOfBirth ?? '',
      education: initial?.education ?? '',
      location: initial?.location ?? '',
      email: initial?.email ?? '',
      playerRoles: initial?.playerRoles ?? [],
      customTags: initial?.customTags ?? [],
    } as any,
  });

  const selectedRoles: string[] = watch('playerRoles') ?? [];
  const selectedTags: string[] = Array.isArray(watch('customTags')) ? watch('customTags') as string[] : [];

  const toggleRole = (name: string) => {
    if (selectedRoles.includes(name)) {
      setValue('playerRoles', selectedRoles.filter(r => r !== name));
    } else {
      setValue('playerRoles', [...selectedRoles, name]);
    }
  };

  const toggleTag = (name: string) => {
    if (selectedTags.includes(name)) {
      setValue('customTags', selectedTags.filter(t => t !== name));
    } else {
      setValue('customTags', [...selectedTags, name]);
    }
  };

  const handleAddSeason = () => {
    const yr = Number(newSeasonYear);
    if (!yr || yr < 1900 || yr >= new Date().getFullYear() + 1) {
      alert('Enter a valid year (e.g., 2023)');
      return;
    }
    if (seasons.find((s: Season) => s.year === yr)) {
      alert('Season ' + yr + ' already added');
      return;
    }
    setSeasons((prev: Season[]) => [...prev, { year: yr, monthlyStats: [] }].sort((a, b) => a.year - b.year));
    setShowAddSeason(false);
    setNewSeasonYear('');
  };

  const onSubmit = (values: PlayerFormValues) => {
    for (const season of seasons) {
      for (const month of season.monthlyStats || []) {
        if (month.matches > 0 && (month.win || 0) + (month.loss || 0) + (month.draw || 0) !== month.matches) {
          const monthName = new Date(2000, month.month - 1, 1).toLocaleString('default', { month: 'long' });
          alert(`Season ${season.year} - ${monthName}:\nWins, Draws, and Losses (${(month.win || 0) + (month.draw || 0) + (month.loss || 0)}) must exactly equal the number of matches (${month.matches}).`);
          return;
        }
      }
    }
    // Explicitly merge selectedRoles, selectedTags & stringTags from local state
    // (react-hook-form doesn't capture setValue-only fields without register())
    onSave({ ...values, playerRoles: selectedRoles, customTags: selectedTags, customStringTags: stringTags, seasons } as any);
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
        <label className="text-[12px] font-medium text-gray-400">Cover Image</label>
        <ImageUpload
          value={watch('coverImageUrl')}
          onChange={(val) => setValue('coverImageUrl', val || '')}
          onRemove={() => setValue('coverImageUrl', '')}
          className="w-full max-w-sm"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-gray-400">Jersey Number</label>
        <Input type="number" {...register('jerseyNumber')} error={errors.jerseyNumber?.message} />
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-gray-400">Date of Birth</label>
        <Input type="date" {...register('dateOfBirth')} />
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-gray-400">Education</label>
        <Input {...register('education')} placeholder="High School / College / University" />
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-gray-400">Location</label>
        <Input {...register('location')} placeholder="City, Country" />
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

      {/* Player Roles — from DB */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">
          Player Roles
          {selectedRoles.length > 0 && (
            <span className="ml-2 text-primary font-semibold">{selectedRoles.length} selected</span>
          )}
        </label>
        <button
          type="button"
          onClick={() => setRolesOpen((o: boolean) => !o)}
          className="w-full flex justify-between items-center border-2 border-foreground px-3 py-2 font-mono text-xs uppercase tracking-widest shadow-retro bg-card"
        >
          <span className="truncate">
            {selectedRoles.length ? selectedRoles.join(', ') : 'Select roles...'}
          </span>
          {rolesOpen ? <ChevronUp size={16} className="ml-2 shrink-0" /> : <ChevronDown size={16} className="ml-2 shrink-0" />}
        </button>
        {rolesOpen && (
          <div className="border-2 border-t-0 border-foreground p-3 bg-card flex flex-wrap gap-2">
            {availableRoles.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No roles found in database.</p>
            ) : (
              availableRoles.map(role => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => toggleRole(role.name)}
                  className={`font-mono uppercase tracking-widest text-xs px-3 py-1.5 border-2 transition-all active:scale-95 ${
                    selectedRoles.includes(role.name)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-foreground hover:bg-muted'
                  }`}
                >
                  {role.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Custom Tags — from DB */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">
          Custom Tags
          {selectedTags.length > 0 && (
            <span className="ml-2 text-primary font-semibold">{selectedTags.length} selected</span>
          )}
        </label>
        <button
          type="button"
          onClick={() => setTagsOpen((o: boolean) => !o)}
          className="w-full flex justify-between items-center border-2 border-foreground px-3 py-2 font-mono text-xs uppercase tracking-widest shadow-retro bg-card"
        >
          <span className="truncate">
            {selectedTags.length ? selectedTags.join(', ') : 'Select tags...'}
          </span>
          {tagsOpen ? <ChevronUp size={16} className="ml-2 shrink-0" /> : <ChevronDown size={16} className="ml-2 shrink-0" />}
        </button>
        {tagsOpen && (
          <div className="border-2 border-t-0 border-foreground p-3 bg-card flex flex-wrap gap-2">
            {availableTags.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No tags found in database.</p>
            ) : (
              availableTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.name)}
                  className={`font-mono uppercase tracking-widest text-xs px-3 py-1.5 border-2 transition-all active:scale-95 ${
                    selectedTags.includes(tag.name)
                      ? 'bg-secondary text-secondary-foreground border-secondary'
                      : 'bg-card text-foreground border-foreground hover:bg-muted'
                  }`}
                >
                  {tag.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Free-text Custom String Tags */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">
          Free Tags
          {stringTags.length > 0 && (
            <span className="ml-2 text-primary font-semibold">{stringTags.length} added</span>
          )}
        </label>
        {/* chips */}
        {stringTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {stringTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-secondary/40 border border-secondary/60 font-mono"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setStringTags(prev => prev.filter(t => t !== tag))}
                  className="hover:text-red-400 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={tagInputRef}
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const val = tagInput.trim().replace(/,$/, '');
                if (val && !stringTags.includes(val)) {
                  setStringTags(prev => [...prev, val]);
                }
                setTagInput('');
              } else if (e.key === 'Backspace' && tagInput === '' && stringTags.length > 0) {
                setStringTags(prev => prev.slice(0, -1));
              }
            }}
            placeholder="Type a tag & press Enter..."
            className="flex-1 border-2 border-foreground px-3 py-2 font-mono text-xs bg-card outline-none focus:border-primary transition-colors"
          />
          <button
            type="button"
            onClick={() => {
              const val = tagInput.trim();
              if (val && !stringTags.includes(val)) {
                setStringTags(prev => [...prev, val]);
              }
              setTagInput('');
              tagInputRef.current?.focus();
            }}
            className="border-2 border-foreground px-3 py-2 font-mono text-xs bg-card hover:bg-muted active:scale-95 transition-all"
          >
            + Add
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Enter বা comma চাপলে tag add হবে। Backspace দিয়ে শেষ tag মুছবে।</p>
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

          {seasons.map((s: Season, i: number) => (
            <SeasonStatsEditor
              key={i}
              season={s}
              onChange={(updated) => setSeasons((prev: Season[]) => prev.map((old: Season, idx: number) => idx === i ? updated : old))}
              onRemove={() => setSeasons((prev: Season[]) => prev.filter((_: any, idx: number) => idx !== i))}
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
