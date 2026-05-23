import React, { createContext, useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { playerFormSchema } from '../schemas';
import { Player, PlayerFormValues } from '../types';
import { Button, Input } from '@/shared/components';
import { PlayerTagSelector } from './PlayerTagSelector';

const CollapsibleContext = createContext<{ open: boolean; setOpen: (open: boolean) => void }>({ open: false, setOpen: () => {} });

function Collapsible({ children, className }: { children: React.ReactNode, className?: string }) {
  const [open, setOpen] = useState(false);
  return <CollapsibleContext.Provider value={{ open, setOpen }}><div className={className}>{children}</div></CollapsibleContext.Provider>;
}

function CollapsibleTrigger({ children, className }: { children: React.ReactNode, className?: string }) {
  const { open, setOpen } = useContext(CollapsibleContext);
  return <button type="button" onClick={() => setOpen(!open)} className={className}>{children}</button>;
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
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      email: initial?.email ?? '',
      password: initial?.password ?? '',
      profileImageUrl: initial?.profileImageUrl ?? '',
      jerseyNumber: initial?.jerseyNumber ?? '',
      playerRoles: initial?.playerRoles ?? [],
      customTags: initial?.customTags?.join(', ') ?? '',
    } as any,
  });

  const onSubmit = (values: PlayerFormValues) => {
    onSave(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-slate-300">Name</label>
        <Input {...register('name')} placeholder="Mohamed Salah" error={errors.name?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-slate-300">Email</label>
          <Input {...register('email')} placeholder="player@team.com" error={errors.email?.message} />
        </div>
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-slate-300">Password</label>
          <Input type="password" {...register('password')} placeholder="****" error={errors.password?.message} />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-slate-300">Profile Image URL</label>
        <Input {...register('profileImageUrl')} placeholder="https://api.dicebear.com/7.x/avataaars/svg?seed=Salah" error={errors.profileImageUrl?.message} />
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-slate-300">Jersey Number</label>
        <Input type="number" {...register('jerseyNumber')} error={errors.jerseyNumber?.message} />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">
          Player Roles
        </label>
        <Collapsible>
          <CollapsibleTrigger className="w-full flex justify-between items-center border-2 border-foreground px-3 py-2 font-mono text-xs uppercase tracking-widest shadow-retro bg-card">
            {watch("playerRoles")?.length
              ? `${watch("playerRoles").length} tag(s) selected`
              : "Select roles & status..."}
            <i className="ti ti-chevron-down" />
          </CollapsibleTrigger>
          <CollapsibleContent className="border-2 border-t-0 border-foreground p-3 bg-card">
            <PlayerTagSelector
              value={watch("playerRoles") ?? []}
              onChange={(val) => setValue("playerRoles", val)}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-slate-300">Custom Tags</label>
        <Input {...register('customTags')} placeholder="pacey, clinical, season 3 champs" error={errors.customTags?.message} />
      </div>

      <div className="flex gap-2 justify-end mt-4">
        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
        <Button type="submit">{initial ? 'Save changes' : 'Add player'}</Button>
      </div>
    </form>
  );
}
