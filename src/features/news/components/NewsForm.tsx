import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { newsFormSchema } from '../schemas';
import { NewsArticle, NewsFormValues } from '../types';
import { Button, Input, Select, Toggle, Textarea, ImageUpload } from '@/shared/components';
import { NEWS_CATEGORIES } from '@/shared/lib/constants';
import { format } from 'date-fns';

interface NewsFormProps {
  initial?: NewsArticle;
  onSave: (data: Omit<NewsArticle, 'id'>) => void;
  onClose: () => void;
}

export function NewsForm({ initial, onSave, onClose }: NewsFormProps) {
  const [image, setImage] = useState<string | undefined>(initial?.image);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NewsFormValues>({
    resolver: zodResolver(newsFormSchema),
    defaultValues: {
      title: initial?.title ?? '',
      content: initial?.content ?? '',
      author: initial?.author ?? 'Admin',
      category: initial?.category ?? 'General',
      date: initial?.date ?? format(new Date(), 'yyyy-MM-dd'),
      hot: initial?.hot ?? false,
    },
  });

  const hot = watch('hot');

  const onSubmit = (values: NewsFormValues) => {
    onSave({
      ...values,
      image,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-gray-400">Image Cover</label>
        <ImageUpload
          value={image}
          onChange={setImage}
          onRemove={() => setImage(undefined)}
        />
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-gray-400">Headline *</label>
        <Input {...register('title')} placeholder="Article headline" error={errors.title?.message} />
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-gray-400">Content</label>
        <Textarea rows={4} {...register('content')} placeholder="Write the article content..." error={errors.content?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-gray-400">Author</label>
          <Input {...register('author')} error={errors.author?.message} />
        </div>
        <div className="grid gap-2">
          <label className="text-[12px] font-medium text-gray-400">Category</label>
          <Select
            {...register('category')}
            options={NEWS_CATEGORIES.map(c => ({ label: c, value: c }))}
            error={errors.category?.message}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-[12px] font-medium text-gray-400">Date</label>
        <Input type="date" {...register('date')} error={errors.date?.message} />
      </div>

      <div className="bg-popover border border-border p-3 rounded-lg mt-2">
        <Toggle label="Mark as hot / featured" checked={hot} onChange={v => setValue('hot', v)} className="bg-background border-none" />
      </div>

      <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-border">
        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
        <Button type="submit">{initial ? 'Save changes' : 'Publish'}</Button>
      </div>
    </form>
  );
}
