import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AddLocationForm } from './AddLocationForm.tsx';
import { LocationItem } from './LocationItem.tsx';
import { useFavorites } from './useFavorites.ts';

export function LocationsPage() {
  const { t } = useTranslation();
  const { favorites, ready, loadFailed, remove } = useFavorites();
  const [removeFailed, setRemoveFailed] = useState(false);

  function removeFavorite(id: string) {
    setRemoveFailed(false);
    remove(id).catch(() => setRemoveFailed(true));
  }

  return (
    <div className="locations-page">
      <h1>{t('locations.title')}</h1>
      {(loadFailed || removeFailed) && (
        <p className="locations-error" role="alert">
          {t('locations.errors.generic')}
        </p>
      )}
      {ready && favorites.length === 0 && <p className="locations-empty">{t('locations.empty')}</p>}
      {favorites.length > 0 && (
        <ul className="locations-list" aria-label={t('locations.listLabel')}>
          {favorites.map((favorite) => (
            <LocationItem key={favorite.id} favorite={favorite} onRemove={removeFavorite} />
          ))}
        </ul>
      )}
      <AddLocationForm />
    </div>
  );
}
