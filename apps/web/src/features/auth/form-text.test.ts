import { expect, test } from 'vitest';
import { textValue } from './form-text.ts';

test('textValue reads a text entry and turns a missing or file entry into an empty string', () => {
  const form = new FormData();
  form.append('email', 'ada@example.com');
  form.append('avatar', new Blob(['x']));

  expect(textValue(form, 'email')).toBe('ada@example.com');
  expect(textValue(form, 'avatar')).toBe('');
  expect(textValue(form, 'name')).toBe('');
});
