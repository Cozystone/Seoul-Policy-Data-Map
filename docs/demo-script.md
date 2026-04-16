# Demo Script

## UI Demo

1. Open `http://localhost:3000` or the Vercel URL.
2. Confirm the Seoul Policy Data Map console and current city data mode.
3. Select a policy seed.
4. Click `Start Simulation`.
5. Confirm Run ID, execution timestamp, verdict grade, reaction evolution, and prediction report.
6. Explain that the UI fallback run is for lightweight demos.

## MiroFish Core Demo

1. Copy `.env.example` to `.env`.
2. Start local stack:

```bash
docker compose up -d
```

3. Pull local models:

```bash
docker exec spdm-ollama ollama pull qwen2.5:7b
docker exec spdm-ollama ollama pull nomic-embed-text
```

4. Generate MiroFish-compatible SPDM artifacts:

```bash
docker compose exec mirofish python backend/scripts/run_spdm_policy_rehearsal.py --input /app/samples/spdm_rehearsal_gangnam.json
```

5. To delegate to MiroFish `SimulationRunner` after models are ready:

```bash
docker compose exec mirofish python backend/scripts/run_spdm_policy_rehearsal.py --input /app/samples/spdm_rehearsal_gangnam.json --execute-core --max-rounds 8
```

6. Check generated files under `vendor/mirofish/backend/uploads/simulations/<simulation_id>/`:

- `spdm_world_seed.json`
- `spdm_entities.json`
- `reddit_profiles.json`
- `twitter_profiles.csv`
- `simulation_config.json`
- `spdm_output.json`
- `spdm_report.md`
