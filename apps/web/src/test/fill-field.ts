import { fireEvent, screen } from '@testing-library/react';

export function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
