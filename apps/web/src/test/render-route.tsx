import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '../routes.tsx';

export function renderRoute(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}
