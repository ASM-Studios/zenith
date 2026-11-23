import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { createI18n } from '../i18n/i18n.ts';
import type { Language } from '../i18n/languages.ts';
import { routes } from '../routes.tsx';

export function renderRoute(path: string, language: Language = 'en') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(
    <I18nextProvider i18n={createI18n(language)}>
      <RouterProvider router={router} />
    </I18nextProvider>,
  );
}
