# Literature references

Scientific and data sources used by the two observation indices.

- [night_sky_index.md](night_sky_index.md)
- [aurora_index.md](aurora_index.md)

---

## Night-sky index

### Don Cross — Astronomy Engine (MIT)

Cross, D. (2019–). *Astronomy Engine*. MIT Licence. https://github.com/cosinekitty/astronomy

Used throughout for solar and lunar positions (`Horizon`), Moon phase angle and illuminated fraction (`Illumination`), and twilight times (`SearchAltitude` at −18° and −12°). All geometric inputs fed into the K&S and score formulas come from this library. No scientific citation required; mentioning the library as the source is sufficient.

### Krisciunas & Schaefer (1991) — moonlight model

Krisciunas, K., & Schaefer, B. E. (1991). A model of the brightness of moonlight. *Publications of the Astronomical Society of the Pacific, 103*, 1033–1039. https://doi.org/10.1086/132921

The night-sky index implements equations 20–22, evaluated at the zenith (observer zenith angle = 0°, separation angle = moon zenith distance). Accuracy 8–23 % against observations at Mauna Kea. Published mathematical formulas; no data license.

### Duriscoe et al. (2018) — all-sky skyglow model (CC BY 4.0)

Duriscoe, D. M., Anderson, S. J., Luginbuhl, C. B., & Baugh, K. E. (2018). A simplified model of all-sky artificial sky glow derived from VIIRS Day/Night band data. *Journal of Quantitative Spectroscopy and Radiative Transfer, 214*, 133–145. https://doi.org/10.1016/j.jqsrt.2018.04.028

Both indices implement equations 9 and 11. The calibration constant 562.72 was fit against 24 NPS field sites in the western United States; absolute values may shift ±30 % in Europe. Attribution required on the Sources screen.

### Elvidge et al. (2021) — VIIRS nighttime-lights grid (CC BY 4.0)

Elvidge, C. D., Zhizhin, M., Ghosh, T., Hsu, F.-C., & Taneja, J. (2021). Annual time series of global VIIRS nighttime lights derived from monthly averages: 2012 to 2019. *Remote Sensing, 13*(5), 922. https://doi.org/10.3390/rs13050922

Annual masked average radiance (nW/cm²/sr), from the Earth Observation Group (EOG), Colorado School of Mines. License: CC BY 4.0 (https://eogdata.mines.edu/files/EOG_products_CC_License.pdf). Read offline; EOG attribution on the Sources screen. Product page: https://eogdata.mines.edu/products/vnl/

---

## Aurora index

### Newell et al. (2007) — solar-wind coupling function

Newell, P. T., Sotirelis, T., Liou, K., Meng, C.-I., & Rich, F. J. (2007). A nearly universal solar wind-magnetosphere coupling function inferred from 10 magnetospheric state variables. *Journal of Geophysical Research, 112*, A01206. https://doi.org/10.1029/2006JA012015

dΦ/dt = v^(4/3) · BT^(2/3) · sin(|θ|/2)^(8/3), BT = √(By²+Bz²) in GSM. Outperforms 20+ alternatives including pressure-based functions against 10 magnetospheric indices. This is the driver of OVATION.

### Newell, Sotirelis & Wing (2009, 2010) — OVATION Prime

Newell, P. T., Sotirelis, T., & Wing, S. (2009). Diffuse, monoenergetic, and broadband aurora: The global precipitation budget. *Journal of Geophysical Research, 114*. https://doi.org/10.1029/2009JA014326

Newell, P. T., Sotirelis, T., & Wing, S. (2010). Seasonal variations in diffuse, monoenergetic, and broadband aurora. *Journal of Geophysical Research, 115*. https://doi.org/10.1029/2009JA014805

Auroral precipitation maps on an AACGM grid. Each bin is a linear fit of electron energy flux to the coupling function above, with separate fits per aurora type and season.

### Newell et al. (2014) — OVATION Prime 2013

Newell, P. T., Liou, K., Zhang, Y., Sotirelis, T., Paxton, L. J., & Mitchell, E. J. (2014). OVATION Prime-2013: Extension of auroral precipitation model to higher disturbance levels. *Space Weather, 12*, 368–379. https://doi.org/10.1002/2014SW001056

Operational model used by NOAA/SWPC. Extended to Kp 8 using TIMED/GUVI UV data. This is the model behind the probability grid the index reads.

### Machol et al. (2012) — visible-aurora energy threshold

Machol, J. L., Green, J. C., Redmon, R. J., Viereck, R. A., & Newell, P. T. (2012). Evaluation of OVATION Prime as a forecast model for visible aurorae. *Space Weather, 10*. https://doi.org/10.1029/2011SW000746

1 erg/cm²/s of electron energy flux ≈ visible green aurora (557.7 nm, ~1 kR). Basis for the 18 % floor in the NOAA probability formula.

### Case, MacDonald & Viereck (2016) — NOAA probability formula

Case, N. A., MacDonald, E. A., & Viereck, R. A. (2016). Using citizen science reports to define the equatorial extent of auroral visibility. *Space Weather, 14*. https://doi.org/10.1002/2015SW001320

Documents `P_aurora = min(100, max(0, 10 + 8 * E_electron))`. The index reads this probability directly from the SWPC grid.

### Mooney et al. (2021) — forecast skill

Mooney, M. K., et al. (2021). Evaluating auroral forecasts against satellite observations. *Space Weather, 19*, e2020SW002688. https://doi.org/10.1029/2020SW002688

OVATION Prime 2013: ROC ≈ 0.82 for oval location; probabilities systematically low at Kp 7–8.

### Shepherd (2014) — AACGM-v2 coordinates

Shepherd, S. G. (2014). Altitude-adjusted corrected geomagnetic coordinates: Definition and functional approximations. *Journal of Geophysical Research: Space Physics, 119*, 7501–7521. https://doi.org/10.1002/2014JA020264

Defines the coordinate system of OVATION's grid. Conversion performed server-side by `aacgmv2` (MIT licence, https://github.com/aburrell/aacgmv2). Reference altitude: 110 km.

### Newell & Gjerloev (2014) — Kp as three-day alert only

Newell, P. T., & Gjerloev, J. W. (2014). Local geomagnetic indices and the prediction of auroral power. *Journal of Geophysical Research: Space Physics, 119*(12), 9790–9803. https://doi.org/10.1002/2014JA020524

Kp correlates only moderately and non-linearly with auroral power. Used for the three-day alert (L1 data cannot support that lead time); not a factor of `I_aurora`.

---

## NOAA runtime products

- SWPC. *Aurora — 30-minute forecast* (OVATION Prime probability + hemispheric power). https://www.swpc.noaa.gov/products/aurora-30-minute-forecast
- SWPC. *Planetary K-index*. https://www.swpc.noaa.gov/products/planetary-k-index
