# Repository Map

## Top-Level Files

- `app/`: Next.js app router pages and global styles.
- `lib/`: Typed sample data and domain types.
- `docs/`: Architecture, data model, ontology, license, and demo documentation.
- `public/`: Static files exposed by the deployed web app.
- `vendor/mirofish/`: Actual vendored MiroFish-Offline upstream source.
- `samples/`: Sample Seoul policy documents, city metrics, external reaction signals, and SPDM rehearsal payloads.
- `seoul_policy_twin_codex_prompt.md`: Original local product prompt. The file appears to have encoding damage, but core requirements were readable.
- `seoul_policy_twin_dashboard_mockup.png`: Original dashboard mockup reference.

## SPDM Next.js Modules

- `app/page.tsx`: Dashboard UI, scenario switching, derived metrics, charts, and panels.
- `app/api/seoul/realtime/route.ts`: Server route for normalized Seoul real-time city data.
- `app/api/simulation/run/route.ts`: Server route that executes deterministic SPDM scenario runs.
- `app/globals.css`: Responsive operations-room visual system.
- `lib/seoul-realtime.ts`: Seoul citydata API adapter with fallback snapshot behavior.
- `lib/simulation.ts`: Deterministic policy rehearsal scoring logic.
- `lib/sample-data.ts`: Seoul policy scenarios and base city signal values.
- `lib/types.ts`: Scenario type definition.

## MiroFish Core Map

### Core Simulation

- `vendor/mirofish/backend/app/api/simulation.py`: 그대로 사용. Simulation create/prepare/start/status/interview routes.
- `vendor/mirofish/backend/app/services/simulation_runner.py`: 그대로 사용. OASIS subprocess execution, action logs, rounds, interviews.
- `vendor/mirofish/backend/scripts/run_parallel_simulation.py`: 그대로 사용. Parallel Twitter/Reddit simulation entry.
- `vendor/mirofish/backend/scripts/run_twitter_simulation.py`: 그대로 사용.
- `vendor/mirofish/backend/scripts/run_reddit_simulation.py`: 그대로 사용.

### Agent / Persona

- `vendor/mirofish/backend/app/services/oasis_profile_generator.py`: 그대로 사용. OASIS profile dataclass and profile export formats.
- `vendor/mirofish/backend/app/services/simulation_config_generator.py`: 그대로 사용. `AgentActivityConfig`, `SimulationParameters`, platform/time/event configs.
- `vendor/mirofish/backend/app/services/spdm_seoul_adapter.py`: 신규 추가. Seoul personas are translated into MiroFish `OasisAgentProfile` and `AgentActivityConfig`.

### World Generation

- `vendor/mirofish/backend/app/api/graph.py`: 그대로 사용. File upload, ontology generation, graph build.
- `vendor/mirofish/backend/app/services/ontology_generator.py`: 그대로 사용.
- `vendor/mirofish/backend/app/services/graph_builder.py`: 그대로 사용.
- `vendor/mirofish/backend/app/services/spdm_seoul_adapter.py`: 신규 추가. Builds Seoul policy world seed and MiroFish-compatible entities.

### Memory / Graph

- `vendor/mirofish/backend/app/storage/graph_storage.py`: 그대로 사용. Abstract graph interface.
- `vendor/mirofish/backend/app/storage/neo4j_storage.py`: 그대로 사용. Neo4j implementation.
- `vendor/mirofish/backend/app/services/entity_reader.py`: 그대로 사용.
- `vendor/mirofish/backend/app/services/graph_memory_updater.py`: 그대로 사용.

### Report / Output

- `vendor/mirofish/backend/app/api/report.py`: 그대로 사용.
- `vendor/mirofish/backend/app/services/report_agent.py`: 그대로 사용.
- `vendor/mirofish/backend/scripts/run_spdm_policy_rehearsal.py`: 신규 추가. Writes SPDM JSON and Markdown outputs around MiroFish artifacts.

### Frontend

- `vendor/mirofish/frontend/`: 그대로 보존. MiroFish-Offline Vue UI remains available on docker host port `3002`.
- `app/`: 신규 추가. SPDM Next.js control-room UI remains the public prototype UI.

### Config / Env

- `vendor/mirofish/.env.example`: 그대로 보존.
- Root `.env.example`: 신규 추가. Combines SPDM, Seoul API, Neo4j, Ollama, and MiroFish backend settings.

### Docker / Runtime

- `vendor/mirofish/docker-compose.yml`: upstream compose retained.
- Root `docker-compose.yml`: 신규 추가. Runs SPDM UI, MiroFish backend/frontend, Neo4j, and Ollama together.

## Reuse / Replace / Add Summary

- Reused: The supplied product intent and high-level dashboard concepts.
- Reused from upstream: MiroFish graph, persona, simulation runner, OASIS scripts, report agent, Neo4j storage, Docker runtime.
- Seoul-type replacement: world seed content, persona set, policy ontology, input adapters, dashboard surface.
- Added: SPDM Next.js UI, Seoul data adapters, `spdm_seoul_adapter.py`, sample Seoul datasets, root Docker Compose, AGPL documentation.
