
interface SeasonTableRow {
  season: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  drawRate: number;
  lossRate: number;
  goals: number;
  goalsConceded: number;
  cleanSheets: number;
  motm: number;
}

interface SeasonTableProps {
  data: SeasonTableRow[];
  allTime: SeasonTableRow;
}

export function SeasonTable({ data, allTime }: SeasonTableProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-4 shadow-sm overflow-x-auto">
      <div className="mb-4">
        <h3 className="font-bold text-[16px]">Season Table</h3>
        <p className="text-muted-foreground text-[12px]">Official rank, appearances and rating history by season.</p>
      </div>

      <table className="w-full text-[13px] text-center whitespace-nowrap">
        <thead className="text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium bg-muted/30 rounded-l-full text-left min-w-[120px]">Season</th>
            <th className="px-2 py-2 font-medium bg-muted/30" title="Matches">M</th>
            <th className="px-2 py-2 font-medium bg-muted/30 text-green-500" title="Wins">W</th>
            <th className="px-2 py-2 font-medium bg-muted/30 text-amber-500" title="Draws">D</th>
            <th className="px-2 py-2 font-medium bg-muted/30 text-red-500" title="Losses">L</th>
            <th className="px-2 py-2 font-medium bg-muted/30" title="Win Rate">Win Rate</th>
            <th className="px-2 py-2 font-medium bg-muted/30" title="Goals For">GF</th>
            <th className="px-2 py-2 font-medium bg-muted/30" title="Goals Conceded">GC</th>
            <th className="px-2 py-2 font-medium bg-muted/30" title="Clean Sheets">CS</th>
            <th className="px-2 py-2 font-medium bg-muted/30 rounded-r-full" title="Man of the Match">MOTM</th>
          </tr>
        </thead>
        <tbody>
          <tr className="h-2"></tr>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-muted/10 transition-colors">
              <td className="px-3 py-2.5 font-bold text-left">{row.season}</td>
              <td className="px-2 py-2.5 font-medium">{row.matches}</td>
              <td className="px-2 py-2.5 font-medium text-green-500">{row.wins}</td>
              <td className="px-2 py-2.5 font-medium text-amber-500">{row.draws}</td>
              <td className="px-2 py-2.5 font-medium text-red-500">{row.losses}</td>
              <td className="px-2 py-2.5 font-medium">{row.winRate.toFixed(1)}%</td>
              <td className="px-2 py-2.5 font-medium">{row.goals}</td>
              <td className="px-2 py-2.5 font-medium">{row.goalsConceded}</td>
              <td className="px-2 py-2.5 font-medium">{row.cleanSheets}</td>
              <td className="px-2 py-2.5 font-medium text-amber-500">{row.motm}</td>
            </tr>
          ))}
          <tr className="border-t border-border mt-2">
            <td colSpan={10} className="p-0"><div className="h-2"></div></td>
          </tr>
          <tr className="font-bold bg-muted/10 rounded-lg">
            <td className="px-3 py-2.5 text-left rounded-l-lg">All-time</td>
            <td className="px-2 py-2.5">{allTime.matches}</td>
            <td className="px-2 py-2.5 text-green-500">{allTime.wins}</td>
            <td className="px-2 py-2.5 text-amber-500">{allTime.draws}</td>
            <td className="px-2 py-2.5 text-red-500">{allTime.losses}</td>
            <td className="px-2 py-2.5">{allTime.winRate.toFixed(1)}%</td>
            <td className="px-2 py-2.5">{allTime.goals}</td>
            <td className="px-2 py-2.5">{allTime.goalsConceded}</td>
            <td className="px-2 py-2.5">{allTime.cleanSheets}</td>
            <td className="px-2 py-2.5 rounded-r-lg text-amber-500">{allTime.motm}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
