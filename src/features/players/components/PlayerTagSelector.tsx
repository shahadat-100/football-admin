import React from 'react';

type TagColor = 'gold' | 'red' | 'plain';

interface TagDefinition {
  value: string;
  color: TagColor;
}

interface TagCategory {
  name: string;
  tags: TagDefinition[];
}

const TAG_CATEGORIES: TagCategory[] = [
  {
    name: 'Status',
    tags: [
      { value: 'Club Legend', color: 'gold' },
      { value: 'Icon', color: 'gold' },
      { value: 'First Team', color: 'plain' },
      { value: 'Squad Player', color: 'plain' },
      { value: 'Fringe', color: 'plain' },
    ],
  },
  {
    name: 'Role',
    tags: [
      { value: 'Captain', color: 'gold' },
      { value: 'Vice Captain', color: 'plain' },
      { value: 'Key Player', color: 'gold' },
      { value: 'Rotation', color: 'plain' },
      { value: 'Impact Sub', color: 'plain' },
    ],
  },
  {
    name: 'Contract',
    tags: [
      { value: 'Contracted', color: 'plain' },
      { value: 'Transfer Listed', color: 'red' },
      { value: 'Left Club', color: 'red' },
      { value: 'On Loan', color: 'plain' },
      { value: 'Loan Return', color: 'plain' },
      { value: 'Contract Expired', color: 'red' },
    ],
  },
  {
    name: 'Availability',
    tags: [
      { value: 'Available', color: 'plain' },
      { value: 'Injured', color: 'red' },
      { value: 'Suspended', color: 'red' },
      { value: 'Doubtful', color: 'red' },
      { value: 'Returning', color: 'plain' },
    ],
  },
  {
    name: 'Development',
    tags: [
      { value: 'Academy', color: 'plain' },
      { value: 'Prospect', color: 'plain' },
      { value: 'Breakthrough', color: 'plain' },
      { value: 'Elite', color: 'gold' },
      { value: 'Veteran', color: 'plain' },
    ],
  },
  {
    name: 'Form',
    tags: [
      { value: 'In Form', color: 'plain' },
      { value: 'Average', color: 'plain' },
      { value: 'Out of Form', color: 'red' },
      { value: 'MOTM Streak', color: 'gold' },
    ],
  },
];

interface PlayerTagSelectorProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export const PlayerTagSelector: React.FC<PlayerTagSelectorProps> = ({ value, onChange }) => {
  const toggleTag = (tagValue: string) => {
    if (value.includes(tagValue)) {
      onChange(value.filter((t) => t !== tagValue));
    } else {
      onChange([...value, tagValue]);
    }
  };

  const getTagStyles = (isSelected: boolean, colorType: TagColor) => {
    const baseStyles = 'px-3 py-1.5 font-mono uppercase tracking-widest text-xs rounded-none border-2 transition-all cursor-pointer select-none font-bold text-center';
    
    if (!isSelected) {
      return `${baseStyles} bg-card text-foreground border-foreground shadow-retro hover:shadow-retro-hover`;
    }

    const colorStyles = {
      gold: 'bg-accent text-foreground border-foreground',
      red: 'bg-primary text-primary-foreground border-foreground',
      plain: 'bg-secondary text-secondary-foreground border-foreground'
    };

    return `${baseStyles} ${colorStyles[colorType]} shadow-retro-active translate-y-[2px] translate-x-[2px]`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TAG_CATEGORIES.map((category) => (
          <div key={category.name} className="flex flex-col gap-3">
            <h3 className="text-muted-foreground uppercase tracking-widest text-[10px] border-b border-dashed border-muted-foreground pb-1">
              {category.name}
            </h3>
            <div className="flex flex-wrap gap-3">
              {category.tags.map((tag) => {
                const isSelected = value.includes(tag.value);
                return (
                  <button
                    type="button"
                    key={tag.value}
                    onClick={() => toggleTag(tag.value)}
                    className={getTagStyles(isSelected, tag.color)}
                  >
                    {tag.value}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
        Selected Tags: {value.length}
      </div>
    </div>
  );
};
