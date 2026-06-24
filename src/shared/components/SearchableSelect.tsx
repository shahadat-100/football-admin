import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/cn';
import { Search, ChevronDown, Check } from 'lucide-react';

export interface SearchableSelectProps {
  options: { label: string; value: string; image?: string; subLabel?: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export const SearchableSelect = React.forwardRef<HTMLDivElement, SearchableSelectProps>(
  ({ options, value, onChange, placeholder = 'Select...', error, className, disabled }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    React.useImperativeHandle(ref, () => containerRef.current!);

    const selectedOption = options.find((opt) => opt.value === value);

    const filteredOptions = options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opt.subLabel?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className={cn("relative w-full", className)} ref={containerRef}>
        <div
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-muted px-3 py-1 text-[12px] shadow-sm transition-colors cursor-pointer !bg-[#fdf6e3] !border-foreground !text-[#1a1f3c]",
            error && "border-destructive",
            disabled && "cursor-not-allowed opacity-50",
            isOpen && "ring-1 ring-ring"
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : <span className="text-muted-foreground">{placeholder}</span>}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md p-1">
            <div className="flex items-center border-b border-border px-2 pb-1 sticky top-0 bg-popover z-10">
              <Search className="mr-2 h-4 w-4 opacity-50" />
              <input
                type="text"
                className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="pt-1">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">No results found.</div>
              ) : (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted hover:text-accent-foreground",
                      value === opt.value && "bg-accent text-accent-foreground font-medium"
                    )}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                  >
                    <span className="flex-1 truncate">{opt.label}</span>
                    {opt.subLabel && <span className="text-xs text-muted-foreground ml-2">{opt.subLabel}</span>}
                    {value === opt.value && <Check className="ml-2 h-4 w-4" />}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {error && <p className="mt-1 text-[10px] text-destructive">{error}</p>}
      </div>
    );
  }
);

SearchableSelect.displayName = "SearchableSelect";
