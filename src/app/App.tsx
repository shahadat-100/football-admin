import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useFootballStore } from '@/store/footballStore';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { Hexagon, Users, ClipboardList, Trophy, Newspaper, LogOut, Award, Menu, X, Shield, UploadCloud } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

const NAV = [
  { id: 'overview', label: 'Overview', icon: Hexagon },
  { id: 'players', label: 'Players', icon: Users },
  { id: 'entries', label: 'Match entries', icon: ClipboardList },
  { id: 'matches', label: 'Matches', icon: Trophy },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'hall-of-fame', label: 'Hall of Fame', icon: Award },
  { id: 'club-info', label: 'Club Info', icon: Shield },
  { id: 'import', label: 'Import', icon: UploadCloud },
];

export function AppShell() {
  const state = useFootballStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!state.isInitialized) {
      state.initializeData();
    }
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);



  const counts: Record<string, number> = {
    players: state.globalCounts?.players || 0,
    entries: state.globalMatchEntriesCount || 0,
    matches: state.globalCounts?.matches || 0,
    news: state.globalCounts?.news || 0,
    'hall-of-fame': state.globalCounts?.['hall-of-fame'] || 0,
  };

  return (
    <div className="flex flex-col h-screen min-h-[600px] max-h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Topbar */}
      <header className="bg-popover border-b border-border h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm z-20 w-full relative">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-1.5 -ml-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-red-800 items-center justify-center shadow-sm">
              <span className="text-white text-lg leading-none">⚽</span>
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-foreground uppercase">THE ENIGMATIC ELITE</span>
          </div>

          {/* Navigation - Desktop */}
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
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
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

        {/* Navigation - Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-popover border-b border-border shadow-lg p-4 flex flex-col gap-1 md:hidden animate-in slide-in-from-top-2 duration-200">
            {NAV.map(t => {
              const Icon = t.icon;
              const isActive = location.pathname.includes('/' + t.id);
              return (
                <NavLink
                  key={t.id}
                  to={`/${t.id}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-medium transition-colors",
                    isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} strokeWidth={2} />
                  <span>{t.label}</span>
                  {counts[t.id] > 0 && (
                    <span className={cn(
                      "ml-auto flex h-5 items-center justify-center px-2 rounded-full text-[11px] font-semibold",
                      isActive ? "bg-background border border-border" : "bg-muted/50"
                    )}>
                      {counts[t.id]}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden h-full relative">
        {/* Overlay when mobile menu is open */}
        {isMobileMenuOpen && (
          <div 
            className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 md:hidden animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        <main className="flex-1 bg-background overflow-y-auto p-4 sm:p-6 lg:p-10 relative w-full h-full">
          <div className="max-w-[1600px] mx-auto pb-12 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
