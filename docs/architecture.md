# Architecture

Seoul Policy Reaction Twin is an AGPL prototype built on top of actual MiroFish-Offline source. The public UI is a Next.js control room, while the social reaction simulation layer is grounded in the vendored MiroFish-Offline backend under `vendor/mirofish`.

## Runtime Layers

### 1. SPDM UI Layer

- Next.js renders the Seoul policy control room.
- `app/spdm-redesign.tsx` is the current console UI.
- `app/api/seoul/realtime/route.ts` normalizes Seoul realtime city data with fallback.
- `app/api/simulation/run/route.ts` remains a lightweight UI fallback run path.

### 2. MiroFish Core Layer

- `vendor/mirofish/backend/app/api/graph.py`: document upload, ontology, graph build.
- `vendor/mirofish/backend/app/api/simulation.py`: create, prepare, start, status, interview routes.
- `vendor/mirofish/backend/app/api/report.py`: report generation.
- `vendor/mirofish/backend/app/services/simulation_runner.py`: OASIS simulation subprocess manager.
- `vendor/mirofish/backend/app/services/oasis_profile_generator.py`: OASIS persona profile format.
- `vendor/mirofish/backend/app/services/simulation_config_generator.py`: time, event, agent, and platform simulation configuration.
- `vendor/mirofish/backend/app/storage/neo4j_storage.py`: Neo4j-backed graph memory.

### 3. Seoul Adapter Layer

- `vendor/mirofish/backend/app/services/spdm_seoul_adapter.py`: Seoul policy world seed, entity mapping, persona mapping, simulation config, JSON output, Markdown report.
- `vendor/mirofish/backend/app/api/spdm.py`: `/api/spdm/world-seed` route.
- `vendor/mirofish/backend/scripts/run_spdm_policy_rehearsal.py`: CLI path for local SPDM rehearsal artifact generation and optional core execution.

### 4. Performance Layer

- `docs/mirofish_scaling_strategy.md`: local 7B-8B execution profile for MiroFish-compatible multi-agent simulation.
- Core policy:
  - cluster-first reasoning
  - agent reasoning decimation
  - externalized memory
  - compact JSON context
  - optional API-only report synthesis

## Working Flow

1. Input Seoul policy document, city state, CSV-derived metrics, and external reaction signals.
2. SPDM adapter creates a MiroFish-compatible `spdm_world_seed.json`.
3. Adapter maps Seoul population groups to MiroFish `EntityNode`, `OasisAgentProfile`, and `AgentActivityConfig`.
4. Adapter writes `simulation_config.json`, `reddit_profiles.json`, `twitter_profiles.csv`, and `state.json` into the MiroFish simulation directory.
5. With Neo4j/Ollama available, the existing MiroFish `SimulationRunner.start_simulation()` runs the OASIS pipeline.
6. Outputs are split into structural externalities and social reaction.
7. SPDM UI displays policy input, current situation, impact graph, reaction river, verdict, and mitigation recommendations.

## Seoul Data Layer

- Realtime city data: `lib/seoul-realtime.ts` and MiroFish adapter payloads support place-by-place polling.
- Regular data: CSV samples live in `samples/seoul/regular-metrics-sample.csv`.
- Policy documents: Markdown samples live in `samples/policies/`.
- External reactions: manual RSS/community JSON samples live in `samples/reactions/`.

## Storage Model

Relational storage is represented in the SPDM data model docs. Graph storage is implemented by MiroFish-Offline's Neo4j layer and uses the SPDM ontology: `Policy`, `Region`, `Place`, `PopulationGroup`, `Metric`, `Event`, `Reaction`, `Document`.

## Seoul Realtime API Notes

The adapter expects the Seoul Open API citydata endpoint shape:

`http://openapi.seoul.go.kr:8088/{SEOUL_OPEN_API_KEY}/json/citydata/1/5/{AREA_NM}`

The citydata API returns one area per call. Production polling should queue target areas, store raw responses, normalize metrics, and expose last-success timestamps per area.

## Simulation Run Notes

The Next.js simulation API is only a fallback UI path. The required MiroFish-based path is now in `vendor/mirofish/backend/app/services/spdm_seoul_adapter.py` and can delegate to `SimulationRunner.start_simulation()`.
