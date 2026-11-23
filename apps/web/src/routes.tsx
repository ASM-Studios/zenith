import type { RouteObject } from 'react-router';
import { LanguageRedirect } from './components/LanguageRedirect.tsx';
import { LanguageRoute } from './components/LanguageRoute.tsx';
import { Layout } from './components/Layout.tsx';
import { NotFoundPage } from './components/NotFoundPage.tsx';
import { HomePage } from './features/home/HomePage.tsx';

export const routes: RouteObject[] = [
  {
    path: '/:lang',
    element: <LanguageRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <LanguageRedirect /> },
];
