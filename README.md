# CoolHK – Walk in the shade

**Original idea & app by [@Alison-lhc](https://github.com/Alison-lhc)**
原創構思及開發：[@Alison-lhc](https://github.com/Alison-lhc)

CoolHK helps people in Hong Kong walk in the shade on hot days. Type where you're going and it suggests the most shaded walking route — through covered walkways, footbridges, tree-lined streets and air-conditioned cool shelters — and compares it with the fastest route.

A Premium dashboard concept for government departments and NGOs maps "cool island deserts": neighbourhoods where older people and children live more than a 10-minute walk from any cool shelter, ranked so teams can decide where to deploy cooling resources first.

CoolHK 幫助香港人在酷熱天氣下行陰涼路線。輸入目的地，就會建議最多遮蔭的步行路線（有蓋行人道、天橋、樹蔭街道、冷氣避暑中心），並與最快路線比較。進階版為政府部門及 NGO 而設，標示長者和兒童距離避暑中心超過 10 分鐘步程的「熱島荒漠」，協助決定資源投放的優先次序。

## Features

The public app (free) offers shaded route search with Hong Kong addresses, MTR stations and exits, live temperature and humidity from the Hong Kong Observatory, heat-warning advice, and nearby cool shelters, in English and Traditional Chinese.

The Premium concept (demo) shows walk-time catchments around cool shelters, surface heat hotspots, at-risk population by district, a priority ranking, deployment suggestions and CSV export.

## Built with

Plain HTML, CSS and JavaScript in a single page, with no build step. Maps use the ArcGIS Maps SDK for JavaScript with the Lands Department basemap. Data comes from Hong Kong Observatory open data, the Address Lookup Service, GeoInfo Map location search, OpenStreetMap (MTR exits, via Overpass) and OSRM walking routes.

## Contributors

| Who | Contribution |
| --- | --- |
| [@Alison-lhc](https://github.com/Alison-lhc) | Original idea, design and development of the app |
| [@hk62638634-create](https://github.com/hk62638634-create) | UI/UX review and bug fixes (October 2026) |
| Mandy | Contributor |

### UI/UX fixes in this fork

- The app no longer asks for your location or draws a route as soon as it opens; routing starts when you choose to search.
- On phones, the zoom buttons and basemap picker move with the bottom panel instead of being hidden behind it, and the panel is taller so the search button is fully visible.
- Tapping a search box expands the panel so suggestions are no longer cut off.
- A "Loading map…" message shows while the map loads.
- If live weather data can't be loaded, the app no longer shows a made-up Very Hot warning.
- The layout button is labelled clearly and only appears on large screens.
- Cancelling a Premium plan asks for confirmation first.
- Search results from external services are escaped before display, and the map attribution required by the map providers is restored.

## Data notice

This is a test build with sample data. Shelter and walkway locations are approximate; population, surface temperature and demand figures are made up. Do not use it for real decisions yet.

本版本使用示範數據。避暑中心及行人通道位置為約數，人口、地表溫度及需求數字均為虛構，暫不適合用作實際決策。

## Roadmap

1. Replace sample data with real open data: 2021 Population Census small-area figures, Home Affairs Department temporary heat shelters, the Lands Department 3D Pedestrian Network, and Landsat land-surface temperature.
2. Add a Python (FastAPI + PostGIS) backend for real shaded routing on the pedestrian network, accounts and anonymised demand statistics.
3. Pilot with one district or NGO before wider rollout, with a privacy policy that follows Hong Kong's Personal Data (Privacy) Ordinance.

## Live demo

Original version: https://coolhkapp.github.io/
