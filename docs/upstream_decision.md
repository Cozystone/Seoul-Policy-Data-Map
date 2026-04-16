# Upstream Decision

## Candidates Checked

### 666ghj/MiroFish

- Repository: `https://github.com/666ghj/MiroFish`
- Checked revision: `fa0f6519b10c4a25b78f1bcc1f00dfcd8bf1ab41`
- License: AGPL-3.0
- Runtime: Python backend, Vue frontend, Docker, Zep Cloud, OpenAI-compatible LLM API
- Core modules found:
  - `backend/app/api/graph.py`
  - `backend/app/api/simulation.py`
  - `backend/app/api/report.py`
  - `backend/app/services/graph_builder.py`
  - `backend/app/services/oasis_profile_generator.py`
  - `backend/app/services/simulation_config_generator.py`
  - `backend/app/services/simulation_runner.py`
  - `backend/app/services/report_agent.py`

### nikmcfly/MiroFish-Offline

- Repository: `https://github.com/nikmcfly/MiroFish-Offline`
- Checked revision: `313fe642853ff9fff05e3ecae2e439886c2d29f4`
- License: AGPL-3.0
- Runtime: Python backend, Vue frontend, Docker Compose, Neo4j Community, Ollama
- Core modules found:
  - `backend/app/api/graph.py`
  - `backend/app/api/simulation.py`
  - `backend/app/api/report.py`
  - `backend/app/storage/graph_storage.py`
  - `backend/app/storage/neo4j_storage.py`
  - `backend/app/services/entity_reader.py`
  - `backend/app/services/graph_builder.py`
  - `backend/app/services/oasis_profile_generator.py`
  - `backend/app/services/simulation_config_generator.py`
  - `backend/app/services/simulation_runner.py`
  - `backend/app/services/report_agent.py`

## Selected Upstream

Selected upstream: `nikmcfly/MiroFish-Offline` at `313fe642853ff9fff05e3ecae2e439886c2d29f4`.

## Reason

MiroFish-Offline keeps the original MiroFish workflow while replacing cloud dependencies with local infrastructure. For this prototype, that is the safer base because Seoul policy rehearsal must be demonstrable as an open AGPL project without mandatory cloud accounts.

Key reasons:

- Docker Compose already defines MiroFish, Neo4j, and Ollama services.
- Neo4j `GraphStorage` abstraction gives a clean graph layer for Seoul ontology nodes and edges.
- OASIS profile generation and simulation configuration dataclasses are explicit and reusable.
- `SimulationRunner` preserves the existing MiroFish execution path for Twitter/Reddit/parallel simulations.
- The report path remains available through MiroFish `ReportAgent`.

## Actual Import Location

The selected upstream source is vendored under:

`vendor/mirofish`

The upstream source is not treated as a design reference only. SPDM adds adapter modules inside the MiroFish backend while preserving the upstream graph, persona, simulation, and report modules.

## SPDM Additions to Upstream

- `vendor/mirofish/backend/app/services/spdm_seoul_adapter.py`
- `vendor/mirofish/backend/app/api/spdm.py`
- `vendor/mirofish/backend/scripts/run_spdm_policy_rehearsal.py`

These additions translate Seoul policy inputs into MiroFish-compatible world seed, entity, profile, simulation configuration, JSON output, and human-readable report artifacts.
