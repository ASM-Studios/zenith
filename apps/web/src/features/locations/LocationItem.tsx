import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { Favorite } from '../../api/locations.ts';

type Props = { favorite: Favorite; onRemove: (id: string) => void };

export function LocationItem({ favorite, onRemove }: Props) {
  const { t, i18n } = useTranslation();
  const { id, name, latitude, longitude } = favorite;
  const query = new URLSearchParams({ lat: String(latitude), lon: String(longitude), name });
  return (
    <li className="locations-item">
      <div>
        <div className="locations-item__name">{name}</div>
        <div className="locations-item__coordinates">{t('locations.coordinates', { latitude, longitude })}</div>
      </div>
      <div className="locations-item__actions">
        <Link className="button button--secondary" to={`/${i18n.language}/?${query.toString()}`}>
          {t('locations.open')}
        </Link>
        <button
          className="button button--danger"
          type="button"
          aria-label={t('locations.removeNamed', { name })}
          onClick={() => onRemove(id)}
        >
          {t('locations.remove')}
        </button>
      </div>
    </li>
  );
}
