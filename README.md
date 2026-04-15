# Seoul Policy Data Map (SPDM)

Seoul Policy Data Map is a policy rehearsal dashboard prototype for Seoul policy teams. It combines policy scenario inputs, current city signals, impact paths, public reaction streams, persona clusters, and a verdict report into one operations-room interface.

This repository was created from the local SPDM prompt and mockup assets in this workspace. The current implementation is a frontend-first Next.js prototype with sample data, designed for Vercel deployment.

## Features

- Policy Composer for selecting sample Seoul policy scenarios
- Situation Signals for current crowding, acceptance, risk, and evidence strength
- Impact Graph showing policy-to-region-to-reaction causal paths
- Reaction River for support, concern, opposition, and neutral stance movement
- Persona Cluster for government-readable stakeholder grouping
- Policy Verdict with expected effects, side effects, evidence, and mitigation notes

## Tech Stack

- Next.js
- React
- TypeScript
- Recharts
- Lucide React

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
```

## Data Status

This prototype uses deterministic sample data in `lib/sample-data.ts`. It does not yet connect to Seoul Open Data Plaza, Seoul real-time city data, news feeds, or social/community sources. Those adapters are described in `docs/architecture.md` and `docs/data_model.md`.

## License and Source Access

The project is released under AGPL-3.0-only. See `LICENSE`, `NOTICE.md`, and `docs/license-compliance.md`.

Source repository: <https://github.com/Cozystone/Seoul-Policy-Data-Map>
