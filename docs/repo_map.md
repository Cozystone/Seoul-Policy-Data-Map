# Repository Map

## Top-Level Files

- `app/`: Next.js app router pages and global styles.
- `lib/`: Typed sample data and domain types.
- `docs/`: Architecture, data model, ontology, license, and demo documentation.
- `public/`: Static files exposed by the deployed web app.
- `seoul_policy_twin_codex_prompt.md`: Original local product prompt. The file appears to have encoding damage, but core requirements were readable.
- `seoul_policy_twin_dashboard_mockup.png`: Original dashboard mockup reference.

## Main Modules

- `app/page.tsx`: Dashboard UI, scenario switching, derived metrics, charts, and panels.
- `app/globals.css`: Responsive operations-room visual system.
- `lib/sample-data.ts`: Seoul policy scenarios and base city signal values.
- `lib/types.ts`: Scenario type definition.

## Reused, Replaced, Added

- Reused: The supplied product intent and high-level dashboard concepts.
- Replaced: The exact mockup styling and title. The official service name is now Seoul Policy Data Map (SPDM).
- Added: A complete Next.js prototype, docs, AGPL notice files, and Vercel-ready project metadata.
