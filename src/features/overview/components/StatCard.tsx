import { cn } from '@/shared/lib/cn';

interface StatCardProps {
  label: string;
  value: number | string;
  accent?: string;
  onClick?: () => void;
}

export function StatCard({ label, value, accent = '#1a1a1a', onClick }: StatCardProps) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-card border border-border rounded-xl p-4 transition-all duration-200",
        onClick ? "cursor-pointer hover:border-primary/50 hover:bg-card/80 hover:shadow-md" : ""
      )}
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <p className="text-muted-foreground text-[12px] font-medium mb-1.5">{label}</p>
      <p className="text-2xl font-black text-foreground" style={{ color: accent }}>{value}</p>
    </div>
  );
}
