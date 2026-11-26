type Props = {
  label: string;
  value: string;
  inputMode?: 'decimal';
  onChange: (value: string) => void;
};

export function LocationField({ label, value, inputMode, onChange }: Props) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        className="field__input"
        type="text"
        value={value}
        inputMode={inputMode}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
