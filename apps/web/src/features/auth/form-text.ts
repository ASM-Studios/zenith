export function textValue(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}
