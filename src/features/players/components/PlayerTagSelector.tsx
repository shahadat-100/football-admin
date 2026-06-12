
export interface PlayerTagSelectorProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

type TagColorType = 'gold' | 'red' | 'plain';

interface TagConfig {
  value: string;
  color: TagColorType;
}

interface TagCategory {
  name: string;
  tags: TagConfig[];
}

export const TAG_CATEGORIES: TagCategory[] = [
  {
    name: 'Status',
    tags: [
      { value: 'Club Legend', color: 'gold' },
      { value: 'Main Team', color: 'plain' },
      { value: 'Academy Team', color: 'plain' },
      { value: 'Youth Team', color: 'plain' },
    ],
  },
  {
    name: 'Role',
    tags: [
      { value: 'Captain', color: 'gold' },
      { value: 'Vice Captain', color: 'plain' },
    ],
  },
  {
    name: 'Form',
    tags: [
      { value: 'In Form', color: 'plain' },
      { value: 'Average', color: 'plain' },
      { value: 'Out of Form', color: 'red' },
    ],
  },
];

export function PlayerTagSelector({ value = [], onChange }: PlayerTagSelectorProps) {
  const toggleTag = (tagValue: string) => {
    if (value.includes(tagValue)) {
      onChange(value.filter((t) => t !== tagValue));
    } else {
      onChange([...value, tagValue]);
    }
  };

  const getTagClasses = (isSelected: boolean, colorType: TagColorType) => {
    const baseClasses = 'font-mono uppercase tracking-widest text-xs px-3 py-1.5 rounded-none transition-all active:translate-y-0.5';
    
    if (!isSelected) {
      return `${baseClasses} bg-card text-foreground border-2 border-foreground shadow-retro hover:shadow-retro-active`;
    }

    const selectedShadow = 'shadow-retro-active translate-y-[2px] border-2 border-transparent';
    switch (colorType) {
      case 'gold':
        return `${baseClasses} bg-accent text-foreground ${selectedShadow}`;
      case 'red':
        return `${baseClasses} bg-primary text-primary-foreground ${selectedShadow}`;
      case 'plain':
      default:
        return `${baseClasses} bg-secondary text-secondary-foreground ${selectedShadow}`;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {TAG_CATEGORIES.map((category) => (
        <div key={category.name} className="flex flex-col gap-3">
          <h4 className="text-muted-foreground uppercase tracking-widest text-[10px] border-b border-dashed border-muted-foreground pb-1">
            {category.name}
          </h4>
          <div className="flex flex-wrap gap-3">
            {category.tags.map((tag) => {
              const isSelected = value.includes(tag.value);
              return (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleTag(tag.value)}
                  className={getTagClasses(isSelected, tag.color)}
                >
                  {tag.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest border-t border-dashed border-muted-foreground/30 pt-3 flex justify-between items-center">
        <span>Selected Tags</span>
        <span className="bg-foreground text-background px-2 py-0.5 rounded-none">
          {value.length}
        </span>
      </div>
    </div>
  );
}
