import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '../components/layout/AppLayout'
import { VoteDetailLayout } from '../components/layout/VoteDetailLayout'
import { HostGuard } from '../guards/HostGuard'
import { WalletGuard } from '../guards/WalletGuard'
import { HostDashboardPage } from '../pages/host/HostDashboardPage'
import { VoteCreatePage } from '../pages/host/VoteCreatePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { UnauthorizedPage } from '../pages/UnauthorizedPage'
import { VoteDetailPage } from '../pages/vote/VoteDetailPage'
import { VoteListPage } from '../pages/vote/VoteListPage'
import { VoteResultPage } from '../pages/vote/VoteResultPage'

export const router = createBrowserRouter([
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/vote" replace />,
      },
      {
        path: '/vote',
        element: <VoteListPage />,
      },
      {
        element: <WalletGuard />,
        children: [
          {
            element: <HostGuard />,
            children: [
              {
                path: '/host',
                element: <HostDashboardPage />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    element: <VoteDetailLayout />,
    children: [
      {
        path: '/vote/:id',
        element: <VoteDetailPage />,
      },
      {
        path: '/vote/:id/result',
        element: <VoteResultPage />,
      },
    ],
  },
  // Host create — own full-screen layout, guarded
  {
    element: <WalletGuard />,
    children: [
      {
        element: <HostGuard />,
        children: [
          {
            path: '/host/create',
            element: <VoteCreatePage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
