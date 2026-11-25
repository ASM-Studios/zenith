import type { ProviderAttribution } from '@zenith/core';

export const METEO_FRANCE_ID = 'meteo-france';
export const METEO_FRANCE_FORECAST_URL = 'https://api.open-meteo.com/v1/meteofrance';

export const METEO_FRANCE_ATTRIBUTION: ProviderAttribution = {
  name: 'Météo-France (via Open-Meteo)',
  url: 'https://open-meteo.com/en/docs/meteofrance-api',
  licence: 'Licence Ouverte 2.0 (Météo-France), CC BY 4.0 (Open-Meteo)',
  licenceUrl: 'https://www.etalab.gouv.fr/wp-content/uploads/2017/04/ETALAB-Licence-Ouverte-v2.0.pdf',
};
