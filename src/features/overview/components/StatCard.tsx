import { cn } from '@/shared/lib/cn';

interface StatCardProps {
  label: string;
  value: number | string;
  accent?: string;
  onClick?: () => void;
}

export function StatCard({ label, value, accent = '#c8102e', onClick }: StatCardProps) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-card border border-border rounded-xl p-6 transition-all duration-200",
        onClick ? "cursor-pointer hover:border-border/80 hover:shadow-md hover:bg-muted/30" : ""
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }}></div>
        <p className="text-muted-foreground text-[13px] font-medium">{label}</p>
      </div>
      <p className="text-3xl font-semibold text-foreground tracking-tight">{value}</p>
    </div>
  );
}
