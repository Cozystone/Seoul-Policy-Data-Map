# Backend Deployment Handoff

The production Vercel deployment can host the Next.js UI, but it cannot run the full
MiroFish/Ollama/Neo4j Docker stack. A public MiroFish backend URL is the remaining
infrastructure step before production can execute the real core engine remotely.

## Already Prepared

- `docker-compose.yml` runs SPDM UI, MiroFish-Offline backend, Neo4j, and Ollama.
- `MIROFISH_BACKEND_INTERNAL_URL` lets the Docker UI call `http://mirofish:5001`.
- `MIROFISH_BACKEND_URL` is used by Vercel or any non-Docker UI runtime.
- `/api/simulation/run` uses MiroFish when the backend URL is reachable and falls
  back to deterministic SPDM output when it is not.
- `SPDM_EXECUTE_CORE`, `SPDM_CORE_MAX_ROUNDS`, and `SPDM_CORE_PLATFORM` control
  whether UI-triggered runs start the MiroFish `SimulationRunner`.

## Recommended Public Runtime

Use a VM or container platform that can run long-lived services and persistent
volumes:

- Docker-capable VM
- Fly.io Machines
- Render private services plus persistent disks
- Google Cloud Run only if Neo4j/Ollama are externalized

Expose only the MiroFish backend on HTTPS. Keep Neo4j and Ollama private on the
internal network.

## Required Environment

```bash
LLM_API_KEY="ollama"
LLM_BASE_URL="http://ollama:11434/v1"
LLM_MODEL_NAME="qwen2.5:7b"
EMBEDDING_BASE_URL="http://ollama:11434"
EMBEDDING_MODEL_NAME="nomic-embed-text"
NEO4J_URI="bolt://neo4j:7687"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="replace-me"
```

After the backend has a public HTTPS URL, set this in Vercel:

```bash
MIROFISH_BACKEND_URL="https://your-public-mirofish-backend.example.com"
```

Optional for production core execution:

```bash
SPDM_EXECUTE_CORE="true"
SPDM_CORE_MAX_ROUNDS="1"
SPDM_CORE_PLATFORM="parallel"
```

Keep `SPDM_EXECUTE_CORE=false` if the backend should generate MiroFish-compatible
artifacts without leaving live wait-mode simulation processes.

## Validation Commands

```bash
curl -X POST "$MIROFISH_BACKEND_URL/api/spdm/world-seed" \
  -H "Content-Type: application/json" \
  --data-binary @samples/spdm_rehearsal_gangnam.json
```

Expected response:

- `success: true`
- `data.simulation_id`
- `data.artifacts.simulation_config`
- `data.artifacts.reddit_profiles`
- `data.artifacts.twitter_profiles`
- `data.output_json`
- `data.report`

## User Action Still Needed

Choose and provision the public backend runtime, then provide its HTTPS URL for
the Vercel `MIROFISH_BACKEND_URL` environment variable.
