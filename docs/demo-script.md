# Demo Script

## UI Demo

1. Open `http://localhost:3000` or the Vercel URL.
2. Confirm the Seoul Policy Data Map console and current city data mode.
3. Select a policy seed.
4. Click `Start Simulation`.
5. Confirm Run ID, engine mode, execution timestamp, verdict grade, reaction evolution, and prediction report.
6. In local Docker, turn on `Core run` and click `Start Simulation` to start a one-round MiroFish core run.
7. On Vercel, explain that the public UI uses fallback mode until a public `MIROFISH_BACKEND_URL` is connected.

## MiroFish Core Demo

1. Copy `.env.example` to `.env`.
2. Add `SEOUL_OPEN_API_KEY` to `.env` if live Seoul city data is available.
3. Start local stack:

```bash
docker compose up -d
```

4. Pull local models:

```bash
docker exec spdm-ollama ollama pull qwen2.5:7b
docker exec spdm-ollama ollama pull nomic-embed-text
```

5. Generate MiroFish-compatible SPDM artifacts:

```bash
docker compose exec mirofish sh -lc "cd /app/backend && uv run python scripts/run_spdm_policy_rehearsal.py --input /app/samples/spdm_rehearsal_gangnam.json"
```

6. To delegate to MiroFish `SimulationRunner` after models are ready:

```bash
docker compose exec mirofish sh -lc "cd /app/backend && uv run python scripts/run_spdm_policy_rehearsal.py --input /app/samples/spdm_rehearsal_gangnam.json --execute-core --max-rounds 1"
```

7. Check generated files under `vendor/mirofish/backend/uploads/simulations/<simulation_id>/`:

- `spdm_world_seed.json`
- `spdm_entities.json`
- `reddit_profiles.json`
- `twitter_profiles.csv`
- `simulation_config.json`
- `spdm_output.json`
- `spdm_report.md`
