import { type SubmitEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocationField } from './LocationField.tsx';
import { getDevicePosition, PositionError } from './device-position.ts';
import { parseLocationFields } from './location-input.ts';
import { useFavorites } from './useFavorites.ts';

const positionErrors = {
  unsupported: 'positionUnsupported',
  denied: 'positionDenied',
  unavailable: 'positionUnavailable',
} as const;

type FormError =
  'invalidName' | 'invalidCoordinates' | 'generic' | (typeof positionErrors)[keyof typeof positionErrors];

const emptyFields = { name: '', latitude: '', longitude: '' };

export function AddLocationForm() {
  const { t } = useTranslation();
  const { add } = useFavorites();
  const [fields, setFields] = useState(emptyFields);
  const [error, setError] = useState<FormError | null>(null);
  const [locating, setLocating] = useState(false);

  const change = (key: keyof typeof emptyFields) => (value: string) =>
    setFields((previous) => ({ ...previous, [key]: value }));

  async function fillFromPosition() {
    setLocating(true);
    setError(null);
    try {
      const { latitude, longitude } = await getDevicePosition();
      setFields((previous) => ({
        name: previous.name.trim() === '' ? t('locations.defaultName') : previous.name,
        latitude: latitude.toFixed(4),
        longitude: longitude.toFixed(4),
      }));
    } catch (failure) {
      setError(failure instanceof PositionError ? positionErrors[failure.reason] : 'generic');
    } finally {
      setLocating(false);
    }
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseLocationFields(fields);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    try {
      await add(parsed.value);
      setFields(emptyFields);
      setError(null);
    } catch {
      setError('generic');
    }
  }

  return (
    <form className="locations-form" onSubmit={(event) => void submit(event)} noValidate>
      <h2>{t('locations.form.title')}</h2>
      <LocationField label={t('locations.form.name')} value={fields.name} onChange={change('name')} />
      <div className="locations-form__row">
        <LocationField
          label={t('locations.form.latitude')}
          value={fields.latitude}
          inputMode="decimal"
          onChange={change('latitude')}
        />
        <LocationField
          label={t('locations.form.longitude')}
          value={fields.longitude}
          inputMode="decimal"
          onChange={change('longitude')}
        />
      </div>
      {error && (
        <p className="locations-error" role="alert">
          {t(`locations.errors.${error}`)}
        </p>
      )}
      <div className="locations-form__actions">
        <button
          className="button button--secondary"
          type="button"
          onClick={() => void fillFromPosition()}
          disabled={locating}
        >
          {t(locating ? 'locations.form.locating' : 'locations.form.usePosition')}
        </button>
        <button className="button" type="submit">
          {t('locations.form.submit')}
        </button>
      </div>
    </form>
  );
}
