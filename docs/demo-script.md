# Demo Script

## Product Demo

1. Open `http://localhost:3000` or the production URL.
2. Confirm the console starts from `Seed Input`, not from a static dashboard.
3. Let the app bootstrap:
   - Seoul realtime data fetch
   - ontology generation
   - graph build task polling
   - simulation create / prepare
4. Watch the left graph panel:
   - node/edge counts increase
   - `Graph Building` task progress advances
   - graph ID is assigned
5. Inspect `Environment / Persona`:
   - generated persona list
   - prepare status
   - simulation ID
6. Click `듀얼 플랫폼 시뮬레이션 시작`.
7. Watch `Round Simulation`:
   - run status
   - current round
   - action feed
   - graph memory updates reflected by graph polling
8. Explain the next intended stage:
   - final report view
   - targeted agent/report follow-up interaction

## Local Runtime Demo

1. Copy `.env.example` to `.env`.
2. Add `SEOUL_OPEN_API_KEY` if live Seoul city data is required.
3. Start the stack:

```bash
docker compose up -d
```

4. Confirm services:

```bash
docker compose ps
```

5. Optional direct upstream validation:

```bash
curl http://localhost:5001/api/graph/project/list
```

6. MiroFish core artifacts remain under:

- `vendor/mirofish/backend/uploads/simulations/<simulation_id>/`
- graph/project state under MiroFish backend project storage
