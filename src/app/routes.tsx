import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from './App';
import { Overview } from '@/pages/Overview';
import { Players } from '@/pages/Players';
import { MatchEntries } from '@/pages/MatchEntries';
import { Matches } from '@/pages/Matches';
import { News } from '@/pages/News';
import { HallOfFame } from '@/pages/HallOfFame';
import { ClubInfo } from '@/pages/ClubInfo';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

// A proxy component so Overview can still call `setTab` logically, mapped to navigate since we use React Router now.
function OverviewRouterProxy() {
  const navigate = useNavigate();
  return <Overview setTab={(tab) => navigate(`/${tab}`)} />;
}

function LoginRedirect() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/overview" replace />;
  return <LoginForm />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginRedirect />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/overview" replace /> },
      { path: "overview", element: <OverviewRouterProxy /> },
      { path: "players", element: <Players /> },
      { path: "entries", element: <MatchEntries /> },
      { path: "matches", element: <Matches /> },
      { path: "news", element: <News /> },
      { path: "hall-of-fame", element: <HallOfFame /> },
      { path: "club-info", element: <ClubInfo /> },
    ]
  }
]);

