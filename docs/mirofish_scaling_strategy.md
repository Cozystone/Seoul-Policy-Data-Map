# MiroFish-Compatible Local Scaling Strategy

## Goal

This design targets a local-only MiroFish/SPDM runtime on:

- CPU: Ryzen 9 9950X3D, 16C/32T
- GPU: RTX 5080, 16GB VRAM
- RAM: 32-64GB
- Local LLM: 7B-8B quantized only

The design assumption is that VRAM, KV cache growth, and concurrent long-context reasoning are the hard limits. The system therefore optimizes for social emergence, not per-agent intelligence.

## Design Summary

- Keep MiroFish graph-first flow and round-based simulation.
- Decimate LLM reasoning aggressively.
- Organize agents into clusters and let only cluster leaders invoke high-cost reasoning regularly.
- Externalize memory into structured state and graph storage.
- Compress all context into small JSON summaries.
- Run most agents through rule-based state transitions and cached response templates.

## Text Diagram

```text
Seed Input
  -> Graph Build (MiroFish graph / Neo4j)
  -> Persona Expansion
       -> Individual Agents (N = 120-300)
       -> Cluster Assignment (8-24 clusters)
       -> Cluster Leaders (1 leader per cluster)
  -> Round Scheduler
       -> World State Update
       -> Salience Scoring
       -> Reasoning Selection
            -> LLM Path (leaders + small sampled frontier)
            -> Rule Path (majority of agents)
       -> Cluster Summaries
       -> World Summary
       -> Externalized Memory Write-back
  -> Outputs
       -> Structural Effects
       -> Social Reactions
       -> Verdict / Mitigation
       -> Deep Interaction
            -> Agent interview
            -> ReportAgent follow-up
```

## Hierarchical Agent Architecture

### Level 1: Individual Agents

Each agent stores structured state only:

- `cluster_id`
- `stance`
- `activation`
- `fatigue`
- `sensitivity_vector`
- `memory_refs`
- `trust_channels`
- `last_action_type`
- `last_reasoning_round`

Most individuals do not call the LLM in most rounds.

### Level 2: Cluster Agents

Clusters represent shared social positions such as:

- Songpa small merchants
- Gangnam commuters
- Jamsil nearby residents
- tourists
- parents
- elderly residents
- mobility-impaired users
- district officials
- online community amplifiers

Each cluster keeps:

- aggregate sentiment histogram
- issue salience
- attention pressure
- structural exposure
- recent conflict summary
- cached language patterns

### Level 3: World State

World state is a compact JSON object updated every round:

- mobility pressure
- crowding
- consumption delta
- accessibility delta
- vulnerable-group stress
- support / concern / backlash / acceptance
- top issue axes
- emerging narratives

## Reasoning Decimation

### Selection Rule

Per round:

- 100% of clusters update state
- 100% of individuals update rule state
- only 10-20% of clusters perform LLM reasoning
- only 3-8% of individuals perform LLM reasoning
- the rest inherit cluster drift plus deterministic local rules

### Recommended Default Budget

For a run with 180 agents, 12 clusters, 40 rounds:

- cluster leader LLM calls per round: 3
- sampled individual LLM calls per round: 6
- total LLM calls per round: 9
- total per-run LLM calls: 360

Compared with naive per-agent reasoning:

- naive: `180 * 40 = 7200` calls
- decimated: `360` calls
- reduction: about `95%`

Even a more conservative setup with 15 cluster calls and 15 individual calls per round still cuts LLM traffic by about `83%`.

## Context Compression

### Per-call Context Budget

Never send raw histories. Use compact JSON only:

```json
{
  "round": 12,
  "agent_or_cluster": "songpa_small_merchants",
  "current_stance": "concerned",
  "salient_issues": ["night traffic", "sales uplift", "pedestrian overflow"],
  "world_delta": {
    "crowding": 0.12,
    "traffic": 0.18,
    "consumption": 0.09
  },
  "recent_memory": [
    "last round concern increased after congestion spike",
    "merchant sentiment improved after footfall increase"
  ],
  "allowed_actions": ["post", "comment", "amplify", "stay_quiet"]
}
```

### Compression Rules

- 2 recent memory items max
- 3 issue axes max
- 1 world delta object
- no raw dialogue logs
- no more than 300-600 tokens per LLM call

This keeps KV cache small and predictable on 16GB VRAM.

## Externalized Memory

Long-term memory must live outside the model:

- Neo4j: issue/entity/reaction memory
- SQLite or JSONL: per-round actions and cluster summaries
- structured agent state snapshots

The LLM only receives:

- latest round summary
- current agent state
- 1-2 retrieved memory bullets

This avoids multi-round prompt growth and stabilizes VRAM.

## Hybrid Intelligence Routing

### Local 7B-8B model

Use for:

- cluster leader reaction generation
- sampled individual reaction generation
- short summarization
- lightweight interview mode

### Optional API model

Use only for:

- global verdict synthesis
- ReportAgent final narrative
- expensive cross-cluster evaluation

This keeps the local stack viable while preserving higher-quality final synthesis when available.

## Round Scheduler

### Round Stages

1. apply structural deltas
2. compute issue salience
3. update cluster states
4. choose reasoning budget
5. run LLM only for selected leaders/frontier agents
6. update remaining agents by rules
7. aggregate reactions
8. persist compact summaries

## Pseudocode

### 1. Agent Selection for Reasoning

```python
def select_reasoning_targets(round_id, clusters, agents, budget):
    leader_candidates = []
    for cluster in clusters:
        score = (
            cluster.issue_salience * 0.35 +
            cluster.conflict_level * 0.25 +
            cluster.activation * 0.20 +
            cluster.world_exposure * 0.20
        )
        leader_candidates.append((score, cluster.leader_id))

    chosen_leaders = top_k(leader_candidates, k=budget.cluster_calls)

    frontier_candidates = []
    for agent in agents:
        if agent.is_leader:
            continue
        score = (
            novelty(agent.last_action_type) * 0.20 +
            abs(agent.stance_delta) * 0.25 +
            agent.activation * 0.20 +
            agent.exposure * 0.20 +
            random() * 0.15
        )
        if round_id - agent.last_reasoning_round < budget.cooldown_rounds:
            score *= 0.3
        frontier_candidates.append((score, agent.id))

    chosen_agents = top_k(frontier_candidates, k=budget.agent_calls)
    return chosen_leaders, chosen_agents
```

### 2. Cluster Update Flow

```python
def update_cluster(cluster, member_agents, world_state):
    member_snapshot = aggregate_members(member_agents)

    cluster.sentiment = blend(
        cluster.sentiment,
        member_snapshot.sentiment,
        world_state.reaction_pressure
    )
    cluster.issue_salience = top_issues(
        member_snapshot.issue_counts,
        world_state.active_issues
    )
    cluster.conflict_level = estimate_conflict(cluster, world_state)
    cluster.activation = estimate_activation(cluster, world_state, member_snapshot)

    cluster.summary_json = {
        "cluster": cluster.name,
        "sentiment": cluster.sentiment,
        "issue_salience": cluster.issue_salience[:3],
        "activation": cluster.activation,
        "conflict_level": cluster.conflict_level
    }
```

### 3. Context Preparation Per Round

```python
def prepare_context(entity, world_state, memory_store):
    memories = memory_store.fetch_recent(
        entity_id=entity.id,
        limit=2,
        min_relevance=0.55
    )

    return {
        "round": world_state.round_id,
        "entity_id": entity.id,
        "entity_type": entity.entity_type,
        "stance": entity.stance,
        "salient_issues": entity.salient_issues[:3],
        "world_delta": {
            "crowding": world_state.crowding_delta,
            "traffic": world_state.traffic_delta,
            "consumption": world_state.consumption_delta,
            "acceptance": world_state.acceptance_delta
        },
        "memories": [m.summary for m in memories],
        "allowed_actions": entity.allowed_actions
    }
```

## Why This Fits The Hardware

### VRAM Constraint

A 7B-8B quantized model can run locally on 16GB VRAM, but large concurrent contexts and many simultaneous agents will push KV cache and fragment memory.

This design reduces VRAM usage by:

- cutting LLM calls by roughly `85-95%`
- shrinking prompt windows to structured JSON
- preventing conversation history accumulation
- keeping only one or a few inference workers hot
- shifting memory to DB/files instead of context

### CPU and RAM Usage

The Ryzen 9 9950X3D and 32-64GB RAM are best used for:

- rule-based updates
- cluster aggregation
- graph retrieval
- state persistence
- asynchronous scheduling

This keeps expensive GPU inference reserved for the few calls that actually change the social trajectory.

## Expected Operating Envelope

With this design on the target machine:

- 120-180 agents: comfortable
- 180-260 agents: realistic with strict reasoning decimation
- 260-320 agents: possible if most agents are rule-only and rounds stay text-light
- 40-72 rounds: practical

Recommended default:

- `180 agents`
- `12 clusters`
- `40 rounds`
- `3 leader calls + 6 sampled calls per round`

Stretch profile:

- `240 agents`
- `16 clusters`
- `48 rounds`
- `4 leader calls + 8 sampled calls per round`

## MiroFish Integration Points

Use this strategy at these points:

- `simulation_config_generator.py`
  - add reasoning budgets, cooldowns, cluster counts
- `oasis_profile_generator.py`
  - emit cluster metadata, sensitivity vectors, trust channels
- `run_parallel_simulation.py`
  - add reasoning scheduler and rule-path execution
- `action_logger.py`
  - log whether each action came from `llm`, `cluster_rule`, or `agent_rule`
- SPDM adapter
  - provide Seoul-specific cluster presets and structural metrics

## Concrete Implementation Order

1. add cluster metadata to generated agent profiles
2. add round budget config to simulation config
3. implement cluster state aggregation
4. implement reasoning target selection
5. add rule-path update for non-selected agents
6. add compact external memory store
7. gate ReportAgent to optional API path only

## Bottom Line

For this hardware, realism comes from broad population coverage plus structured emergence, not from giving every agent a full LLM turn every round.

The correct trade is:

- many cheap agents
- few expensive thinkers
- aggressive memory externalization
- compact round summaries

That is the only stable path to larger agent counts and longer runs on a single 16GB GPU.
