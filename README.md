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

## Seoul Realtime City Data

SPDM includes a server-side adapter for Seoul real-time city data:

- API route: `/api/seoul/realtime?area=광화문·덕수궁`
- Environment variable: `SEOUL_OPEN_API_KEY`
- Fallback: if the key is missing or the API call fails, the dashboard uses a deterministic sample snapshot so demos and Vercel deployments remain stable.

Create `.env.local` from `.env.example` and set:

```bash
SEOUL_OPEN_API_KEY="your-seoul-open-api-key"
```

## Build

```bash
npm run build
```

## Data Status

This prototype uses deterministic sample policy scenarios in `lib/sample-data.ts`. Seoul real-time city data is wired through `app/api/seoul/realtime/route.ts` and `lib/seoul-realtime.ts`, with fallback data for keyless demos. It does not yet connect to long-range Seoul Open Data Plaza datasets, news feeds, or social/community sources. Those adapters are described in `docs/architecture.md` and `docs/data_model.md`.

## License and Source Access

The project is released under AGPL-3.0-only. See `LICENSE`, `NOTICE.md`, and `docs/license-compliance.md`.

Source repository: <https://github.com/Cozystone/Seoul-Policy-Data-Map>
