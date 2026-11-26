type TextFieldProps = {
  label: string;
  name: string;
  type: 'text' | 'email' | 'password';
  autoComplete: string;
};

export function TextField({ label, name, type, autoComplete }: TextFieldProps) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input className="field__input" name={name} type={type} autoComplete={autoComplete} required />
    </label>
  );
}
