# Aurora index

Hourly score from 0 to 100 for seeing an aurora at one site. Occurrence comes from NOAA's OVATION Prime 2013 probability. Visibility is cloud cover and sky brightness. References are in [literature_references.md](literature_references.md).

## Inputs

| Symbol | Meaning | Source |
| --- | --- | --- |
| `P_aurora` | NOAA visible-aurora probability at the site, 0–100 % | SWPC OVATION grid, sampled via AACGM coordinates |
| `c_low`, `c_mid`, `c_high` | Fractional cloud cover per layer | Weather provider |
| `h_sun` | Solar altitude | `Astronomy.Horizon(…, Body.Sun).altitude` |
| `h_moon` | Lunar altitude | `Astronomy.Horizon(…, Body.Moon).altitude` |
| `F` | Illuminated fraction of the Moon | `Astronomy.Illumination(Body.Moon, time).phase_fraction` |
| `ALR` | All-sky light-pollution ratio | Same VIIRS computation as the night-sky index |

Speed, IMF components, density, temperature, and hemispheric power are displayed on the space-weather screen. They are already encoded inside `P_aurora` through the OVATION model and are not added as extra terms.

## Occurrence

### Coordinate conversion

OVATION's grid is in AACGM coordinates. The server converts the user's geographic position to magnetic latitude and MLT using `aacgmv2` (MIT licence), then samples the grid by bilinear interpolation.

```text
mlat, mlon, mlt = aacgmv2.get_aacgm_coord(glat, glon, height_km=110, dtime)
```

110 km is the nominal aurora emission peak altitude (Shepherd, 2014).

### Probability

OVATION Prime 2013 maps a four-hour history of the Newell coupling function (v, IMF By, Bz) onto electron energy flux per AACGM bin (Newell et al., 2007, 2009, 2014). NOAA converts that flux to probability (Case et al., 2016):

```text
P_aurora = min(100, max(0, 10 + 8 * E_electron))    # E_electron in erg/cm²/s
```

Ion precipitation is excluded (does not produce the visible green aurora). One erg/cm²/s = 18 % = visible threshold (Machol et al., 2012). Scores below 2 are shown as a "no activity" chip rather than a bar.

L1-to-Earth propagation gives 30–60 min of warning. Beyond that window, the three-day Kp forecast drives a separate alert; it does not feed into `I_aurora`.

## Visibility

### Clouds

```text
c = 0.70 * c_low + 0.20 * c_mid + 0.10 * c_high
C = 1 - c
```

### Sky brightness

An aurora at a few kR is far brighter than the stellar background, so the Moon and urban weights are smaller than in the night-sky index.

```text
B_sun   = min(1, max(0, (h_sun + 12) / 12))²    # zero at nautical twilight (−12°, per Astronomy Engine)

B_moon  = 0                    if h_moon <= 0
B_moon  = F * sin(h_moon)      otherwise

B_urban = ALR / (1 + ALR)
```

`F * sin(h_moon)` is a deliberate conservative simplification for aurora contrast scoring (overestimates by up to ~3× near zenith, which biases toward caution).

## Score

```text
S_aurora = B_sun + 0.40 * B_moon + 0.50 * B_urban
I_aurora = C * max(0, 1 - S_aurora) * P_aurora
```

`C * max(0, 1 − S_aurora)` ∈ [0, 1] × `P_aurora` ∈ [0, 100] → `I_aurora` ∈ [0, 100].

| Weight | Term | Reason |
| --- | --- | --- |
| 1.00 | `B_sun` | Sky closes at −12°; aurora invisible before nautical night |
| 0.40 | `B_moon` | Moon reduces contrast but does not erase a bright storm |
| 0.50 | `B_urban` | City skyglow reduces contrast; bright city leaves 50 % visibility |
| 1.00 | `C`, `P_aurora` | No clear sky or no aurora predicted → score is zero |

## Known limits

- OVATION Prime 2013 underestimates probability during strong storms (Kp 7–8, Mooney et al., 2021).
- AACGM accuracy at 110 km is within a fraction of a degree (Shepherd, 2014).
- Cloud cover and sky brightness affect visibility only; they do not change the NOAA probability.
