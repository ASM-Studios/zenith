Une application open-source qui rassemble de multiples sources météo, terrestres et spatiales, et indique quand le ciel vaut le coup d'être observé.

## 01 · Le projet

### A. Le constat

Les agrégateurs météo libres (Breezy Weather par exemple) permettent de choisir entre plusieurs fournisseurs, mais ignorent la météo spatiale. À l'inverse, les applications de prévision d'aurores boréales sont toutes propriétaires. Aucun outil libre ne combine les deux, alors que les données nécessaires sont publiques et gratuites.

### B. Ce que nous proposons

Une application web et mobile, open-source, qui rassemble en un seul endroit :

- les prévisions de plusieurs fournisseurs météo, au choix de l'utilisateur ;
- la qualité de l'air, le pollen et les alertes officielles ;
- la météo spatiale : activité solaire et probabilité d'aurore à sa position ;
- un indicateur qui dit, heure par heure, si la nuit vaut le coup d'être observée ;
- une carte du ciel et la liste des constellations visibles depuis sa position ;
- des notifications réglables selon ces critères.

### C. Stack Technique

Pour l’application mobile, une solution multiplateforme : React Native (Expo) en TypeScript. Le code de calcul pourra être partagé entre le web et le mobile, permettant d’optimiser le développement et la phase de test.  
Les notifications et l’accessibilité (TalkBack) sont gérées nativement, et l’APK sera produit par la CI.

## 02 · Notre livrable

### A. Météo terrestre multi-sources

Chaque fournisseur a son format, sa couverture et ses limites. Nous les intégrons derrière une interface commune, et l'utilisateur choisit sa source.

- Au moins **3 fournisseurs** : Open-Meteo, Météo-France, MET Norway.
- Conditions actuelles, prévisions **heure par heure sur 48 h** et **jour par jour sur 7 jours**.
- **Choix de la source par type de donnée** (actuel, prévisions, qualité de l'air, alertes…) via un menu ; seules les sources qui couvrent le lieu sont proposées.
- **Comparaison des sources** côte à côte sur un même graphique.
- **Qualité de l'air**, **pollen** et **vigilances** officielles.
- Gestion des cas réels : source lente, indisponible ou quota atteint. L'utilisateur est prévenu et garde accès aux dernières données en cache, avec leur heure de mise à jour.

### B. Météo spatiale

- Indice **Kp** actuel et prévu sur 3 jours, **vent solaire**, **éruptions solaires** récentes.
- Probabilité d'aurore à la position de l'utilisateur (modèle NOAA OVATION Prime 2013) et carte de l'ovale auroral ; indice Kp actuel et prévision 3 jours ; vent solaire (vitesse, densité, IMF Bz) et puissance hémisphérique de l'ovale.

### C. Indicateur d'observation

Deux scores horaires distincts, de 0 à 100, calculés côté serveur avec Astronomy Engine pour les éphémérides :

- Score astronomique : produit du ciel dégagé et de la luminosité résiduelle du ciel (Soleil, Lune via le modèle Krisciunas & Schaefer 1991, pollution lumineuse).
- Score aurore : même facteur de visibilité multiplié par la probabilité NOAA OVATION Prime 2013 à la position magnétique de l'utilisateur.

La pollution lumineuse est intégrée au calcul : luminance artificielle au zénith estimée depuis la grille satellite VIIRS (Duriscoe et al. 2018, CC BY 4.0), lue en local. Les formules, pondérations et sources sont documentées dans `docs/`.

### D. Ciel et constellations

- **Carte du ciel** calculée pour le lieu et l'heure : étoiles, tracés des constellations, Lune, horizon et points cardinaux.
- **Constellations visibles** depuis sa position : créneau, meilleure heure, direction et hauteur.

### E. Cartes et notifications

- **Radar de précipitations** animé, couches de nébulosité et d'ovale auroral.
- **Notifications push** sur des règles réglables (indicateur au-dessus d'un seuil, Kp ≥ 5, vigilance orange…), évaluées côté serveur.

### F. Des comptes pour les utilisateurs

Ils peuvent être ajoutés de manière facultative pour l’utilisateur :

- l’application reste utilisable sans compte ;
- le compte synchronise entre le web et le mobile les lieux favoris, les règles de notification et les préférences de sources, sur plusieurs appareils ;
- on applique le RGPD : données minimales, suppression et export du compte ;
- un compte de démo pour les tests et démos

**Pourquoi facultatif ?**

- **Esprit open-source** : les applis météo libres comme Breezy Weather fonctionnent sans compte.
- **Aucune friction** : les données qu’on affichera sont publiques et gratuites. Exiger une inscription pour consulter la météo ou le ciel serait une barrière pour l’utilisateur.
- **Données minimales** : sans compte, les lieux et préférences sont stockés localement sur l’appareil, et aucune position n’est stockée sur le serveur.
- **Créer un compte n’est pas toujours nécessaire** : il devient utile pour synchroniser ses réglages entre plusieurs appareils et pour recevoir des notifications push, qui sont évaluées côté serveur.

## 03 · Exigences de qualité

| Attendu              | Ce que nous ferons                                                                                                                                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web + mobile         | Une application web et une application mobile                                                                                                                                                                                                        |
| GitHub Projects      | Un tableau mis à jour à chaque sprint, une issue par tâche, chaque pull request relue par un autre membre avant merge                                                                                                                                 |
| Tests                | Tests unitaires sur l'intégration des sources, les éphémérides, l'indicateur, les constellations et les notifications. Les API externes sont simulées et tout se lance avec une seule commande                                                        |
| CI/CD                | GitHub Actions sur chaque pull request (lint, tests, build). Chaque merge sur main déploie le web et l'API et produit un APK                                                                                                                          |
| Accessibilité        | Niveau AA des WCAG 2.2 : légende textuelle sur les cartes et graphiques, couleurs lisibles pour les daltoniens, navigation au clavier, TalkBack. Audit et déclaration d'accessibilité en fin de projet                                                 |
| Documentation        | Doc utilisateur et doc technique dans le dépôt, mises à jour au fil des pull requests                                                                                                                                                                 |
| Dépôt accueillant    | Un `docker compose up` avec des données de démo pour lancer le projet en moins de 15 minutes, sans clé d'API                                                                                                                                          |
| IA encadrée          | Outils utilisés listés dans le README ; chacun de nous peut expliquer tout le code                                                                                                                                                                    |

## 04 · Organisation et livrables

### A. Calendrier

| Période         | Objectif                                                                              |
| --------------- | ------------------------------------------------------------------------------------- |
| Début novembre  | Architecture, CI/CD, maquettes, premières sources intégrées                           |
| Fin novembre    | Toutes les sources, choix de la source, éphémérides, premières pages web et mobile    |
| Début décembre  | Météo spatiale, indicateur d'observation, carte du ciel                               |
| Courant décembre | Constellations, notifications. Follow-up : démo de l'existant                        |
| Janvier         | Finitions, audit d'accessibilité, documentation, préparation de la soutenance         |
| Fin janvier     | Soutenance : démo web et mobile                                                       |

### B. Livrables

| Livrable            | Contenu                                                                    |
| ------------------- | -------------------------------------------------------------------------- |
| Application web     | Toutes les fonctionnalités de la partie 02                                 |
| Application mobile  | Les mêmes fonctionnalités, plus les notifications push                     |
| Identité du produit | Mini charte graphique (1 à 2 pages).                                       |
| API                 | Récupération des données, calculs, envoi des notifications                 |
| Paquets             | Paquet installable du serveur web, de l’application Android et/ou iOS, release GitHub automatisée |
| Dépôt GitHub        | Code, tests, pipeline CI/CD, tableau GitHub Projects                       |
| Documentation       | Utilisateur et technique                                                   |
| Accessibilité       | Audit et déclaration                                                       |
| Usage de l’IA       | Déclaration dans le README.                                                |
| Soutenance          | Présentation et démo.                                                      |

### C. Licences et RGPD

- Respect des conditions d’usage des API, avec attribution visible sur chaque écran de données et une page « Sources et licences » :
  - Open-Meteo et MET Norway : CC BY 4.0;
  - Météo-France : Licence Ouverte ;
  - NOAA : source citée ;
  - fonds de carte : attribution OpenStreetMap.
- Licences des données vérifiées et listées dans un fichier `ATTRIBUTIONS.md`. Cela concerne le catalogue d'étoiles (Yale BSC 5, domaine public) et les tracés de constellations (Dominic Ford / dcf21, CC BY 4.0)., la grille VIIRS de luminosité nocturne (Elvidge et al. 2021, CC BY 4.0) et le modèle de skyglow de Duriscoe et al. (2018, CC BY 4.0).
- Mentions légales et conformité RGPD
