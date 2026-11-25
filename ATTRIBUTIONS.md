# Attributions

Zenith is released under the GPL-3.0 (see [LICENSE](LICENSE)). The data, models and libraries below keep their own licences. Each entry gives the licence, the source and the wording to show in the apps. Scientific references are in [docs/literature_references.md](docs/literature_references.md).

## Weather providers

The API returns the attribution of each provider with its data (`ProviderAttribution`, see [docs/weather-providers.md](docs/weather-providers.md)). Every data screen shows it.

### Open-Meteo

- Licence: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- Source: https://open-meteo.com
- Terms: https://open-meteo.com/en/terms (the free API is for non-commercial use)
- Attribution: `Weather data by Open-Meteo.com`

### MET Norway

- Licence: [NLOD 2.0](https://data.norge.no/nlod/en/2.0) and [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- Source: https://api.met.no
- Terms: https://api.met.no/doc/TermsOfService (identifying `User-Agent` required, no more than the documented request rate)
- Attribution: `Data from MET Norway`

### Meteo-France

- Licence: [Licence Ouverte Etalab 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/)
- Source: https://portail-api.meteofrance.fr
- Attribution: `Source: Meteo-France`, with the date of the last update when the data is modified

## Space weather

### NOAA Space Weather Prediction Center

- Licence: US Government work, public domain (no copyright)
- Source: https://www.swpc.noaa.gov (planetary K-index, OVATION Prime aurora forecast, solar wind, solar flares)
- Terms: https://www.weather.gov/disclaimer
- Attribution: `Source: NOAA Space Weather Prediction Center`. Credit is requested, not required.

## Maps and geocoding

### OpenStreetMap

- Licence: [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/)
- Source: https://www.openstreetmap.org
- Terms: https://www.openstreetmap.org/copyright and the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/)
- Attribution: `© OpenStreetMap contributors`, linked to the copyright page, visible on every map

## Sky data

### Yale Bright Star Catalogue, 5th revised edition (BSC5)

- Licence: public domain
- Source: Hoffleit, D. & Warren, W. H. Jr. (1991), distributed by CDS VizieR as catalogue V/50 (https://cdsarc.cds.unistra.fr/viz-bin/cat/V/50)
- Attribution: `Star data: Yale Bright Star Catalogue, 5th revised edition (Hoffleit & Warren, 1991)`. Courtesy credit, not required.

### Constellation lines (dcf21)

- Licence: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- Source: Dominic Ford, constellation stick figures, https://github.com/dcf21/constellation-stick-figures
- Attribution: `Constellation lines: Dominic Ford (dcf21), CC BY 4.0`, with a note when the lines are modified

## Light pollution

### VIIRS nighttime lights (EOG)

- Licence: [CC BY 4.0](https://eogdata.mines.edu/files/EOG_products_CC_License.pdf)
- Source: Elvidge, C. D., Zhizhin, M., Ghosh, T., Hsu, F.-C. & Taneja, J. (2021). Annual time series of global VIIRS nighttime lights derived from monthly averages: 2012 to 2019. *Remote Sensing, 13*(5), 922. https://doi.org/10.3390/rs13050922
- Product page: https://eogdata.mines.edu/products/vnl/
- Attribution: `Nighttime lights: Earth Observation Group, Colorado School of Mines (Elvidge et al., 2021), CC BY 4.0`, shown on the Sources screen

### Skyglow model (Duriscoe et al. 2018)

- Licence: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- Source: Duriscoe, D. M., Anderson, S. J., Luginbuhl, C. B. & Baugh, K. E. (2018). A simplified model of all-sky artificial sky glow derived from VIIRS Day/Night band data. *Journal of Quantitative Spectroscopy and Radiative Transfer, 214*, 133-145. https://doi.org/10.1016/j.jqsrt.2018.04.028
- Attribution: `Skyglow model: Duriscoe et al. (2018), CC BY 4.0`. The equations are reimplemented in `packages/core`, not copied.

## Software

| Library | Licence | Use |
| --- | --- | --- |
| [Astronomy Engine](https://github.com/cosinekitty/astronomy) | MIT | Sun, Moon and planet positions |
| [aacgmv2](https://github.com/aburrell/aacgmv2) | MIT | Geographic to AACGM coordinates for OVATION |

The licences of the npm dependencies are those of each package.
