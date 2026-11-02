# Night-sky index

Hourly score from 0 to 100 for astronomical observation at one site. It is the product of a clear-sky factor and the residual darkness of the sky. References are in [literature_references.md](literature_references.md).

## Inputs

| Symbol | Meaning | Range | Source |
| --- | --- | --- | --- |
| `c_low`, `c_mid`, `c_high` | Fractional cloud cover per layer | 0–1 | Weather provider (total cover if layers unavailable) |
| `h_sun` | Solar altitude above the horizon | degrees | `Astronomy.Horizon(…, Body.Sun).altitude` |
| `h_moon` | Lunar altitude above the horizon | degrees | `Astronomy.Horizon(…, Body.Moon).altitude` |
| `α_deg` | Moon phase angle (0° = full, 180° = new) | 0–180 | `Astronomy.Illumination(Body.Moon, time).phase_angle` |
| `r_i` | Masked annual average upward radiance of VIIRS cell `i` | nW/cm²/sr | EOG annual VNL, read offline |

## Clear sky

Low cloud is optically thicker than high cloud.

```text
c = 0.70 * c_low + 0.20 * c_mid + 0.10 * c_high
C = 1 - c
```

| Weight | Layer | Reason |
| --- | --- | --- |
| 0.70 | Low | Optically thick, masks the sky entirely |
| 0.20 | Middle | Partial mask |
| 0.10 | High | Veil rather than a mask |

## Sky brightness

The three brightness terms are luminances and add physically. `S_astro` can exceed 1 (full moon + city); `max(0, 1 − S_astro)` clamps the residual darkness to zero and the score to zero for any hour brighter than the natural reference.

### Sun

```text
B_sun = min(1, max(0, (h_sun + 18) / 18))²
```

Zero at −18° (end of astronomical twilight, as computed by Astronomy Engine's `SearchAltitude`). One at the horizon. The square exponent concentrates darkening in the last degrees of twilight, which is physically more realistic than a linear ramp.

### Moon — Krisciunas & Schaefer (1991), evaluated at the zenith

For an all-sky hourly score the zenith is the representative worst-case point. The angular separation from the Moon to the zenith equals its zenith distance (90° − `h_moon`). The phase angle `α_deg` comes directly from Astronomy Engine and is fed into the K&S equations.

```text
# α_deg from Astronomy.Illumination(Body.Moon, time).phase_angle

# Lunar illuminance above atmosphere (K&S eq. 20)
Istar = 10^(-0.4 * (3.84 + 0.026 * |α_deg| + 4e-9 * α_deg^4))

# Zenith distance of the Moon
ρ_deg = max(1, 90 - h_moon)                            # clamp to 1° to avoid singularity
ρ_rad = ρ_deg * π / 180

# Scattering function (K&S eq. 21)
f_ρ = 10^(6.15 - ρ_deg / 40) + 229086 * (1.06 + cos(ρ_rad)²)

# Moon airmass
Xm = 1 / (cos(ρ_rad) + 0.025 * exp(-11 * cos(ρ_rad)))

# V-band extinction, sea level, clear sky
k = 0.172

# Scattered moonlight at the zenith, nanoLambert (K&S eq. 22)
B_moon_nL = f_ρ * Istar * 10^(-0.4 * k * Xm) * (1 - 10^(-0.4 * k))

# Normalize: full moon at zenith ≈ 10 000 nL (K&S fig. 6)
B_moon = 0                        if h_moon <= 0
B_moon = B_moon_nL / 10000        otherwise
```

Accuracy of K&S is 8–23 % against observations. The formula does not correct for site altitude or local aerosol.

### Urban sky — Duriscoe et al. (2018), from VIIRS

```text
# Distance-dependent Walker exponent (Duriscoe eq. 11)
α_LP(d) = 2.3 * (d / 350)^0.28          # d in km; 0.45 at 1 km, 2.16 at 300 km

# All-sky light-pollution ratio (Duriscoe eq. 9)
# Sum over VIIRS cells within 300 km; minimum d clamped to 1 km
ALR = (1 / 562.72) * Σ r_i * d_i^(-α_LP(d_i))

B_urban = ALR / (1 + ALR)
```

`ALR` is artificial all-sky luminance divided by the natural reference of 250 μcd/m². The constant 562.72 was fit by linear regression on 24 NPS field sites in the western United States. Absolute ALR may shift ±30 % in Europe due to different aerosol and spectral conditions; site ranking within a region remains reliable.

The annual masked VNL grid (CC BY 4.0, EOG) is read locally. EOG attribution is shown on the Sources screen.

## Score

```text
S_astro = B_sun + 0.70 * B_moon + 1.00 * B_urban
I_astro = 100 * C * max(0, 1 - S_astro)
```

| Weight | Term | Reason |
| --- | --- | --- |
| 1.00 | `B_sun` | Daylight and bright twilight close the sky completely |
| 0.70 | `B_moon` | Full moon at zenith leaves ~30 % residual usability, consistent with observer practice |
| 1.00 | `B_urban` | Artificial luminance matching the natural reference → unusable for faint objects |

`C` and `(1 − S_astro)` are multiplied: a covered sky or a sky brighter than the reference both drive the score to zero independently.

## Known limits

- ALR measures the full hemisphere, not the zenith alone. ALR/ZLR ≈ 1.6–3.3 (Duriscoe Table 2), so the index is conservatively strict for zenith-only observers at rural sites.
- VIIRS is weak below 500 nm: white LED lighting is under-counted.
- The annual grid does not track night-to-night dimming or aerosol events.
- This score is about sky darkness. It is not a transparency or seeing forecast.
