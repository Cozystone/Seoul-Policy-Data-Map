# NOTICE

Project: Seoul Policy Reaction Twin / Seoul Policy Data Map (SPDM)

Repository: <https://github.com/Cozystone/Seoul-Policy-Data-Map>

This prototype includes actual vendored MiroFish-Offline source. It is not an official Seoul Metropolitan Government service.

## Upstream Source

- Original MiroFish: <https://github.com/666ghj/MiroFish>
- Selected upstream fork: <https://github.com/nikmcfly/MiroFish-Offline>
- Selected upstream revision: `313fe642853ff9fff05e3ecae2e439886c2d29f4`
- Vendored path: `vendor/mirofish`

## Purpose

SPDM is a policy rehearsal prototype for showing how a policy scenario may affect Seoul districts, population groups, mobility conditions, and public reactions using MiroFish's multi-agent social reaction simulation structure.

## Main Changes in This Prototype

- Added a Next.js application shell for a policy operations-room dashboard.
- Vendored MiroFish-Offline under `vendor/mirofish`.
- Added Seoul Policy Reaction Twin adapter routes and scripts inside MiroFish backend.
- Added Seoul world seed generation, Seoul persona mapping, and MiroFish-compatible profile/config artifact generation.
- Added sample Seoul policy documents, realtime city JSON, regular metrics CSV, and external reaction JSON.
- Added root Docker Compose for SPDM UI + MiroFish + Neo4j + Ollama.
- Added documentation for architecture, data model, ontology, demo script, and license compliance.

## License Notice

This project is released under AGPL-3.0-only. If this service is modified and made available over a network, the complete corresponding source code of the modified version must be offered to users under the same license terms.
