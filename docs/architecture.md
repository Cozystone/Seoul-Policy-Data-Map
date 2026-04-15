# Architecture

SPDM is currently a frontend-first prototype. The first deployable slice focuses on policy rehearsal UX and deterministic sample outputs.

## Current Runtime

- Next.js renders the dashboard.
- React state selects one of three sample scenarios.
- Derived metrics are calculated in `app/page.tsx`.
- Recharts renders the Reaction River.
- SVG and CSS render the Impact Graph and Persona Cluster.

## Planned Backend

The intended production architecture adds a FastAPI ingestion and simulation backend:

- `ingestion/realtime_city`: place-by-place polling for Seoul real-time city data.
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
