import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '../components/layout/AppLayout'
import { VoteDetailLayout } from '../components/layout/VoteDetailLayout'
import { WalletGuard } from '../guards/WalletGuard'
import { HostDashboardPage } from '../pages/host/HostDashboardPage'
import { HostLiveTallyPage } from '../pages/host/HostLiveTallyPage'
import { HostSettlementPage } from '../pages/host/HostSettlementPage'
import { VoteCreatePage } from '../pages/host/VoteCreatePage'
import { VoteEditPage } from '../pages/host/VoteEditPage'
import { VoteManagePage } from '../pages/host/VoteManagePage'
import { UnauthorizedPage } from '../pages/UnauthorizedPage'
import { MyPage } from '../pages/user/MyPage'
import { VerifiedAdminPage } from '../pages/verified/VerifiedAdminPage'
import { VerifiedRequestPage } from '../pages/verified/VerifiedRequestPage'
import { VoteDetailPage } from '../pages/vote/VoteDetailPage'
import { VoteListPage } from '../pages/vote/VoteListPage'
import { VoteResultPage } from '../pages/vote/VoteResultPage'
import { VoteSeriesPage } from '../pages/vote/VoteSeriesPage'

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
        path: '/vote/series/:seriesKey',
        element: <VoteSeriesPage />,
      },
      {
        path: '/mypage',
        element: <MyPage />,
      },
      {
        path: '/verified/admin',
        element: <VerifiedAdminPage />,
      },
      {
        element: <WalletGuard />,
        children: [
          {
            path: '/verified',
            element: <VerifiedRequestPage />,
          },
          {
            path: '/host',
            element: <HostDashboardPage />,
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
      {
        element: <WalletGuard />,
        children: [
          {
            path: '/host/manage/:id',
            element: <VoteManagePage />,
          },
          {
            path: '/host/:id/live',
            element: <HostLiveTallyPage />,
          },
          {
            path: '/host/:id/settlement',
            element: <HostSettlementPage />,
          },
        ],
      },
    ],
  },
  // Host create — own full-screen layout, wallet required only
  {
    element: <WalletGuard />,
    children: [
      {
        path: '/host/create',
        element: <VoteCreatePage />,
      },
      {
        path: '/host/edit/:id',
        element: <VoteEditPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/vote" replace />,
  },
])
