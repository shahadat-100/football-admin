import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useFootballStore } from '@/store/footballStore';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { Hexagon, Users, ClipboardList, Trophy, Newspaper, LogOut } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

const NAV = [
  { id: 'overview', label: 'Overview', icon: Hexagon },
  { id: 'players', label: 'Players', icon: Users },
  { id: 'entries', label: 'Match entries', icon: ClipboardList },
  { id: 'matches', label: 'Matches', icon: Trophy },
  { id: 'news', label: 'News', icon: Newspaper },
];

export function AppShell() {
  const state = useFootballStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const counts: Record<string, number> = {
    players: state.players.length,
    entries: state.matchEntries.length,
    matches: state.matches.length,
    news: state.news.length,
  };

  return (
    <div className="flex flex-col h-screen min-h-[600px] max-h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Topbar */}
      <header className="bg-popover border-b border-border h-14 flex items-center justify-between px-5 shrink-0 shadow-sm z-10 w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white text-lg leading-none">⚽</span>
          </div>
          <span className="font-bold text-[15px] tracking-wide text-white">Football Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Live System</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar */}
        <aside className="w-[60px] sm:w-[200px] lg:w-[220px] bg-popover border-r border-border flex flex-col pt-4 shrink-0 transition-all duration-300 h-full">
          <nav className="flex-1 px-2 sm:px-3 flex flex-col gap-1 overflow-y-auto">
            {NAV.map(t => {
              const Icon = t.icon;
              const isActive = location.pathname.includes('/' + t.id);
              return (
                <NavLink
                  key={t.id}
                  to={`/${t.id}`}
                  className={cn(
                    "flex items-center justify-center sm:justify-between px-0 sm:px-3 py-3 sm:py-2.5 rounded-lg border-none cursor-pointer transition-all duration-200 group relative outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isActive ? "bg-muted text-foreground font-semibold shadow-sm" : "bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-[18px] h-[18px] transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[13px] hidden sm:block">{t.label}</span>
                  </div>
                  {counts[t.id] > 0 && (
                    <span className={cn(
                      "hidden sm:flex h-5 items-center justify-center px-1.5 rounded-full text-[10px] font-bold transition-colors",
                      isActive ? "bg-background text-foreground border border-border" : "bg-muted text-muted-foreground group-hover:text-foreground"
                    )}>
                      {counts[t.id]}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-border mt-auto p-2 sm:p-3 bg-muted/20 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-md">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="hidden sm:block overflow-hidden">
                  <p className="text-[12px] font-semibold text-foreground leading-tight truncate">{user?.name || 'Admin User'}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{user?.email || 'Super admin'}</p>
                </div>
              </div>
              <button 
                onClick={() => logout()}
                className="hidden sm:flex p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors tooltip outline-none"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            {/* Mobile Logout Button Icons only */}
            <button 
              onClick={() => logout()}
              className="flex sm:hidden w-full items-center justify-center mt-3 p-2 text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </aside>


        {/* Main Content */}
        <main className="flex-1 bg-background overflow-y-auto p-4 sm:p-6 lg:p-8 relative w-full h-full">
          <div className="max-w-[1400px] mx-auto pb-12 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
