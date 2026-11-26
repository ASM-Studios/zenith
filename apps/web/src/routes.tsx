import type { RouteObject } from 'react-router';
import { LanguageRedirect } from './components/LanguageRedirect.tsx';
import { LanguageRoute } from './components/LanguageRoute.tsx';
import { Layout } from './components/Layout.tsx';
import { NotFoundPage } from './components/NotFoundPage.tsx';
import { SignInPage } from './features/auth/SignInPage.tsx';
import { SignUpPage } from './features/auth/SignUpPage.tsx';
import { VerifyEmailPage } from './features/auth/VerifyEmailPage.tsx';
import { HomePage } from './features/home/HomePage.tsx';
import { LocationsPage } from './features/locations/LocationsPage.tsx';
import { DeleteAccountPage } from './features/settings/DeleteAccountPage.tsx';
import { RequireSession } from './features/settings/RequireSession.tsx';
import { SettingsPage } from './features/settings/SettingsPage.tsx';

export const routes: RouteObject[] = [
  {
    path: '/:lang',
    element: <LanguageRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'sign-in', element: <SignInPage /> },
          { path: 'sign-up', element: <SignUpPage /> },
          { path: 'verify-email', element: <VerifyEmailPage /> },
          { path: 'locations', element: <LocationsPage /> },
          {
            element: <RequireSession />,
            children: [
              { path: 'settings', element: <SettingsPage /> },
              { path: 'settings/delete-account', element: <DeleteAccountPage /> },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <LanguageRedirect /> },
];
