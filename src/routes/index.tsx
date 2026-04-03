import { createBrowserRouter, Navigate } from "react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { HostGuard } from "../guards/HostGuard";
import { WalletGuard } from "../guards/WalletGuard";
import { HostDashboardPage } from "../pages/host/HostDashboardPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { UnauthorizedPage } from "../pages/UnauthorizedPage";
import { VoteListPage } from "../pages/vote/VoteListPage";

export const router = createBrowserRouter([
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <Navigate to="/vote" replace />,
      },
      {
        path: "/vote",
        element: <VoteListPage />,
      },
      {
        element: <WalletGuard />,
        children: [
          {
            element: <HostGuard />,
            children: [
              {
                path: "/host",
                element: <HostDashboardPage />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
