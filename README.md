# Seoul Policy Reaction Twin / Seoul Policy Data Map (SPDM)

Seoul Policy Reaction Twin is an AGPL public prototype for Seoul policy teams. It combines Seoul public data, policy documents, external reaction signals, and MiroFish multi-agent social simulation to rehearse structural externalities and citizen response before a policy is launched.

This project does not merely imitate MiroFish. It vendors actual MiroFish-Offline source under `vendor/mirofish` and adds a Seoul policy adapter layer on top of the upstream graph, persona, simulation, and report structure.

## Upstream

- Original MiroFish: <https://github.com/666ghj/MiroFish>
- Selected upstream fork: <https://github.com/nikmcfly/MiroFish-Offline>
- Selected revision: `313fe642853ff9fff05e3ecae2e439886c2d29f4`
- Vendored source: `vendor/mirofish`
- Decision record: `docs/upstream_decision.md`

## Features

- Policy Composer for selecting sample Seoul policy scenarios
- Simulation Run API that returns a run id, verdict grade, reaction scores, and confidence
- Situation Signals for current crowding, acceptance, risk, and evidence strength
- Impact Graph showing policy-to-region-to-reaction causal paths
- Reaction River for support, concern, opposition, and neutral stance movement
- Persona Cluster for government-readable stakeholder grouping
- Policy Verdict with expected effects, side effects, evidence, and mitigation notes
- MiroFish-Offline source vendored under `vendor/mirofish`
- Seoul adapter route: `vendor/mirofish/backend/app/api/spdm.py`
- Seoul adapter service: `vendor/mirofish/backend/app/services/spdm_seoul_adapter.py`
- MiroFish-compatible CLI: `vendor/mirofish/backend/scripts/run_spdm_policy_rehearsal.py`

## Tech Stack

- Next.js
- React
- TypeScript
- Recharts
- Lucide React
- MiroFish-Offline
- Flask
- Neo4j Community
- Ollama
- OASIS simulation scripts via MiroFish

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Docker Compose

Copy environment settings and start the full local prototype:

```bash
copy .env.example .env
docker compose up -d
```

Services:

- SPDM UI: `http://localhost:3000`
- MiroFish-Offline UI: `http://localhost:3002`
- MiroFish backend: `http://localhost:5001`
- Neo4j Browser: `http://localhost:7474`
- Ollama: `http://localhost:11434`

Pull recommended local models:

```bash
docker exec spdm-ollama ollama pull qwen2.5:32b
docker exec spdm-ollama ollama pull nomic-embed-text
```

## Seoul Realtime City Data

SPDM includes a server-side adapter for Seoul real-time city data:

- API route: `/api/seoul/realtime?area=광화문·덕수궁`
- Environment variable: `SEOUL_OPEN_API_KEY`
- Fallback: if the key is missing or the API call fails, the dashboard uses a deterministic sample snapshot so demos and Vercel deployments remain stable.

Create `.env.local` from `.env.example` and set:

```bash
SEOUL_OPEN_API_KEY="your-seoul-open-api-key"
```

## Simulation Execution

The public Next.js UI button calls:

```bash
POST /api/simulation/run
```

That route is a lightweight UI fallback. The required MiroFish-based path is:

```bash
cd vendor/mirofish/backend
python scripts/run_spdm_policy_rehearsal.py --input ../../../samples/spdm_rehearsal_gangnam.json
```

Inside Docker:

```bash
docker compose exec mirofish python backend/scripts/run_spdm_policy_rehearsal.py --input /app/samples/spdm_rehearsal_gangnam.json
```

To delegate to MiroFish `SimulationRunner`:

```bash
docker compose exec mirofish python backend/scripts/run_spdm_policy_rehearsal.py --input /app/samples/spdm_rehearsal_gangnam.json --execute-core --max-rounds 8
```

The MiroFish-compatible path produces:

- `runId`
- execution timestamp
- pressure, acceptance, risk, and confidence scores
- verdict grade
- support, concern, opposition, and neutral reaction scores
- recommended mitigation summary
- `spdm_world_seed.json`
- `reddit_profiles.json`
- `twitter_profiles.csv`
- `simulation_config.json`
- `spdm_output.json`
- `spdm_report.md`

## Build

```bash
npm run build
```

## Data Status

This prototype includes deterministic sample policy scenarios in `lib/sample-data.ts` and MiroFish-compatible sample inputs in `samples/`.

Samples:

- `samples/policies/gangnam-night-crowding.md`
- `samples/policies/cheonggye-weekend-access.md`
- `samples/policies/night-safety-zone.md`
- `samples/seoul/realtime-city-sample.json`
- `samples/seoul/regular-metrics-sample.csv`
- `samples/reactions/news-signals-sample.json`
- `samples/spdm_rehearsal_gangnam.json`

Seoul real-time city data is wired through `app/api/seoul/realtime/route.ts` and `lib/seoul-realtime.ts`, with fallback data for keyless demos.

## License and Source Access

The project is released under AGPL-3.0. The selected upstream MiroFish-Offline license is preserved under `vendor/mirofish/LICENSE`; root `LICENSE` also contains AGPL-3.0. See `NOTICE.md` and `docs/license-compliance.md`.

Source repository: <https://github.com/Cozystone/Seoul-Policy-Data-Map>
