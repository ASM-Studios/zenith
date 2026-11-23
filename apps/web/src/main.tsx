import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { createI18n } from './i18n/i18n.ts';
import { detectLanguage } from './i18n/languages.ts';
import { routes } from './routes.tsx';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing #root element');
}

const language = detectLanguage(navigator.languages);
document.documentElement.lang = language;

createRoot(root).render(
  <StrictMode>
    <I18nextProvider i18n={createI18n(language)}>
      <RouterProvider router={createBrowserRouter(routes)} />
    </I18nextProvider>
  </StrictMode>,
);
