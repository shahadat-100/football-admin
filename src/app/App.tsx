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
      <header className="bg-popover border-b border-border h-16 flex items-center justify-between px-6 shrink-0 shadow-sm z-10 w-full">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-red-800 flex items-center justify-center shadow-sm">
              <span className="text-white text-lg leading-none">⚽</span>
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-foreground">Football Admin</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(t => {
              const Icon = t.icon;
              const isActive = location.pathname.includes('/' + t.id);
              return (
                <NavLink
                  key={t.id}
                  to={`/${t.id}`}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} strokeWidth={2} />
                  <span>{t.label}</span>
                  {counts[t.id] > 0 && (
                    <span className={cn(
                      "ml-1 flex h-4 items-center justify-center px-1.5 rounded-full text-[10px] font-semibold",
                      isActive ? "bg-background border border-border" : "bg-muted-foreground/10"
                    )}>
                      {counts[t.id]}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[11px] font-semibold uppercase tracking-wider">Live System</span>
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[12px] font-semibold text-white shadow-sm">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden lg:block">
                <p className="text-[13px] font-medium text-foreground leading-none">{user?.name || 'Admin User'}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{user?.email || 'Super admin'}</p>
              </div>
            </div>
            <button 
              onClick={() => logout()}
              className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors tooltip outline-none"
              title="Logout"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden h-full">
        <main className="flex-1 bg-background overflow-y-auto p-6 sm:p-8 lg:p-10 relative w-full h-full">
          <div className="max-w-[1200px] mx-auto pb-12 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
