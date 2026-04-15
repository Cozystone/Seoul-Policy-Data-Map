# Architecture

SPDM is currently a frontend-first prototype. The first deployable slice focuses on policy rehearsal UX and deterministic sample outputs.

## Current Runtime

- Next.js renders the dashboard.
- React state selects one of three sample scenarios.
- `app/api/seoul/realtime/route.ts` calls the Seoul real-time city data adapter.
- `app/api/simulation/run/route.ts` executes a deterministic policy rehearsal run.
- `lib/seoul-realtime.ts` normalizes crowding, weather, and traffic signals, and falls back to sample data when `SEOUL_OPEN_API_KEY` is not configured or an upstream call fails.
- `lib/simulation.ts` combines scenario parameters and city signals into run scores, verdict grades, reaction scores, and mitigation text.
- Derived metrics are calculated in `app/page.tsx` from scenario controls and the current city snapshot.
- Recharts renders the Reaction River.
- SVG and CSS render the Impact Graph and Persona Cluster.

## Planned Backend

The intended production architecture adds a FastAPI ingestion and simulation backend:

- `ingestion/realtime_city`: place-by-place polling for Seoul real-time city data. The frontend prototype already includes a lightweight Next.js server adapter for this source.
- `ingestion/open_data`: CSV/API ingestion for Seoul Open Data Plaza datasets.
- `ingestion/documents`: HTML, PDF, TXT, and Markdown policy document parsing.
- `ingestion/reactions`: official news/RSS and manually governed community adapters.
- `simulation/world_seed`: structured scenario payloads for a policy reaction model.
- `simulation/personas`: deterministic agent generation by region and stakeholder type.
- `api`: scenario run, report retrieval, and evidence trace endpoints.

## Design Principles

- Keep raw input data separate from normalized policy objects.
- Show policy impact and social reaction with similar visual weight.
- Make every verdict traceable to data sources and assumptions.
- Treat online/community collection as a governed adapter layer with robots/TOS review.

## Seoul Realtime API Notes

The adapter expects the Seoul Open API citydata endpoint shape:

`http://openapi.seoul.go.kr:8088/{SEOUL_OPEN_API_KEY}/json/citydata/1/5/{AREA_NM}`

The citydata API returns one area per call. Production polling should queue target areas, store raw responses, normalize metrics, and expose last-success timestamps per area.

## Simulation Run Notes

The current simulation is deterministic and explainable. It is not a predictive model. It uses policy intensity, disruption, benefit clarity, persona sensitivity, evidence strength, novelty, and the latest city signal snapshot to produce a rehearsal verdict. This gives a working execution path now while leaving room for a future agent-based simulator or graph model.
