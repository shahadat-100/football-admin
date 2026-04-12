import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from './App';
import { Overview } from '@/pages/Overview';
import { Players } from '@/pages/Players';
import { MatchEntries } from '@/pages/MatchEntries';
import { Matches } from '@/pages/Matches';
import { News } from '@/pages/News';

// A proxy component so Overview can still call `setTab` logically, mapped to navigate since we use React Router now.
function OverviewRouterProxy() {
  const navigate = useNavigate();
  return <Overview setTab={(tab) => navigate(`/${tab}`)} />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/overview" replace /> },
      { path: "overview", element: <OverviewRouterProxy /> },
      { path: "players", element: <Players /> },
      { path: "entries", element: <MatchEntries /> },
      { path: "matches", element: <Matches /> },
      { path: "news", element: <News /> },
    ]
  }
]);
