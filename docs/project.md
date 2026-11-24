An open-source application that gathers multiple weather sources, terrestrial and space, and tells you when the sky is worth observing.

## 01 · The project

### A. The observation

Free weather aggregators (Breezy Weather for example) let you choose between several providers, but ignore space weather. Conversely, aurora forecast applications are all proprietary. No free tool combines the two, even though the required data is public and free.

### B. What we propose

An open-source web and mobile application that gathers in one place:

- forecasts from several weather providers, chosen by the user;
- air quality, pollen and official alerts;
- space weather: solar activity and aurora probability at the user's position;
- an indicator that says, hour by hour, whether the night is worth observing;
- a sky map and the list of constellations visible from the user's position;
- notifications that can be tuned to these criteria.

### C. Tech stack

For the mobile application, a cross-platform solution: React Native (Expo) in TypeScript. The computation code can be shared between web and mobile, which streamlines development and testing.  
Notifications and accessibility (TalkBack) are handled natively, and the APK is produced by the CI.

## 02 · Our deliverable

### A. Multi-source terrestrial weather

Each provider has its own format, coverage and limits. We integrate them behind a common interface, and the user chooses their source.

- At least **3 providers**: Open-Meteo, Météo-France, MET Norway.
- Current conditions, **hourly forecasts over 48 h** and **daily forecasts over 7 days**.
- **Source choice per data type** (current, forecast, air quality, alerts...) through a menu; only sources that cover the location are offered.
- **Source comparison** side by side on a single chart.
- **Air quality**, **pollen** and official **weather warnings**.
- Handling of real-world cases: slow or unavailable source, quota reached. The user is notified and keeps access to the latest cached data, with its update time.

### B. Space weather

- Current **Kp** index and 3-day forecast, **solar wind**, recent **solar flares**.
- Aurora probability at the user's position (NOAA OVATION Prime 2013 model) and auroral oval map; current Kp index and 3-day forecast; solar wind (speed, density, IMF Bz) and hemispheric power of the oval.

### C. Observation indicator

Two separate hourly scores, from 0 to 100, computed server-side with Astronomy Engine for the ephemerides:

- Astronomy score: product of clear sky and residual sky brightness (Sun, Moon via the Krisciunas & Schaefer 1991 model, light pollution).
- Aurora score: the same visibility factor multiplied by the NOAA OVATION Prime 2013 probability at the user's magnetic position.

Light pollution is part of the computation: artificial luminance at the zenith is estimated from the VIIRS satellite grid (Duriscoe et al. 2018, CC BY 4.0), read locally. The formulas, weightings and sources are documented in `docs/`.

### D. Sky and constellations

- **Sky map** computed for the place and time: stars, constellation lines, Moon, horizon and cardinal points.
- **Constellations visible** from the user's position: time window, best hour, direction and altitude.

### E. Maps and notifications

- Animated **precipitation radar**, cloud cover and auroral oval layers.
- **Push notifications** on tunable rules (indicator above a threshold, Kp ≥ 5, orange warning...), evaluated server-side.

### F. User accounts

They can be added as an option for the user:

- the application stays usable without an account;
- the account syncs favorite places, notification rules and source preferences between web and mobile, across several devices;
- GDPR applies: minimal data, account deletion and export;
- a demo account for tests and demos.

**Why optional?**

- **Open-source spirit**: free weather apps like Breezy Weather work without an account.
- **No friction**: the data we display is public and free. Requiring a sign-up to check the weather or the sky would be a barrier for the user.
- **Minimal data**: without an account, places and preferences are stored locally on the device, and no position is stored on the server.
- **An account is not always needed**: it becomes useful to sync settings across several devices and to receive push notifications, which are evaluated server-side.

## 03 · Quality requirements

| Expected          | What we will do                                                                                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web + mobile      | A web application and a mobile application                                                                                                                                                                                |
| GitHub Projects   | A board updated every sprint, one issue per task, every pull request reviewed by another member before merge                                                                                                              |
| Tests             | Unit tests on source integration, ephemerides, the indicator, constellations and notifications. External APIs are mocked and everything runs with a single command                                                         |
| CI/CD             | GitHub Actions on every pull request (lint, tests, build). Every merge on main deploys the web app and the API and produces an APK                                                                                        |
| Accessibility     | WCAG 2.2 level AA: text legend on maps and charts, colors readable by colorblind users, keyboard navigation, TalkBack. Accessibility audit and statement at the end of the project                                        |
| Documentation     | User and technical docs in the repository, updated along with the pull requests                                                                                                                                           |
| Welcoming repo    | One `docker compose up` with demo data to start the project in under 15 minutes, without an API key                                                                                                                       |
| Supervised AI     | Tools used are listed in the README; each of us can explain all the code                                                                                                                                                  |

## 04 · Organization and deliverables

### A. Schedule

| Period            | Goal                                                                            |
| ----------------- | ------------------------------------------------------------------------------- |
| Early November    | Architecture, CI/CD, mockups, first sources integrated                          |
| Late November     | All sources, source choice, ephemerides, first web and mobile pages             |
| Early December    | Space weather, observation indicator, sky map                                   |
| Mid December      | Constellations, notifications. Follow-up: demo of the existing work             |
| January           | Finishing touches, accessibility audit, documentation, defense preparation      |
| Late January      | Defense: web and mobile demo                                                    |

### B. Deliverables

| Deliverable      | Content                                                                         |
| ---------------- | ------------------------------------------------------------------------------- |
| Web application  | All the features of part 02                                                     |
| Mobile app       | The same features, plus push notifications                                      |
| Product identity | Mini style guide (1 to 2 pages).                                                |
| API              | Data retrieval, computations, notification sending                              |
| Packages         | Installable web server package, Android and/or iOS app, automated GitHub release |
| GitHub repo      | Code, tests, CI/CD pipeline, GitHub Projects board                              |
| Documentation    | User and technical                                                              |
| Accessibility    | Audit and statement                                                             |
| AI usage         | Statement in the README.                                                        |
| Defense          | Presentation and demo.                                                          |

### C. Licenses and GDPR

- Compliance with the API terms of use, with visible attribution on every data screen and a "Sources and licenses" page:
  - Open-Meteo and MET Norway: CC BY 4.0;
  - Météo-France: Licence Ouverte;
  - NOAA: source cited;
  - base maps: OpenStreetMap attribution.
- Data licenses verified and listed in an `ATTRIBUTIONS.md` file. This covers the star catalog (Yale BSC 5, public domain), the constellation lines (Dominic Ford / dcf21, CC BY 4.0), the VIIRS night brightness grid (Elvidge et al. 2021, CC BY 4.0) and the skyglow model of Duriscoe et al. (2018, CC BY 4.0).
- Legal notices and GDPR compliance
