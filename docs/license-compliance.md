# License Compliance

SPDM is an AGPL-3.0 project built from actual MiroFish-Offline source.

## Upstream

- Original project: `666ghj/MiroFish`
- Selected upstream fork: `nikmcfly/MiroFish-Offline`
- Selected revision: `313fe642853ff9fff05e3ecae2e439886c2d29f4`
- License: AGPL-3.0
- Vendored path: `vendor/mirofish`

## Current Measures

- Upstream `vendor/mirofish/LICENSE` is preserved.
- Root `LICENSE` contains the AGPL-3.0 license text.
- `NOTICE.md` states upstream source, selected revision, local changes, and source access obligations.
- `README.md` lists upstream source and SPDM changes.
- UI footer includes Source / License / Notice links.
- Root `docker-compose.yml` provides a local execution path for SPDM and MiroFish-Offline.

## Operational Requirement

If a modified version of SPDM is deployed over a network, users must be able to obtain the complete corresponding source code of that modified version under AGPL-compatible terms.

## External Services

Production ingestion adapters should document:

- Data provider terms.
- API keys and rate limits.
- Robots/TOS review for web or community sources.
- Retention and privacy policy for collected reaction data.
