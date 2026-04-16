# Simulation Rounds

## Objective

Preserve MiroFish as a time-evolving multi-agent system rather than a one-shot calculator.

## Round model

Each round should represent:

1. Event perception
2. Memory lookup
3. Observation of other agents and groups
4. Attitude update
5. Action generation
6. World-state update
7. Graph memory write-back

## Output layers

- Structural effects
  - Flow
  - Congestion
  - Consumption
  - Accessibility
  - Vulnerable-group impact
- Social reactions
  - Support
  - Backlash
  - Concern
  - Conflict
  - Acceptability
  - Diffusion

## Current runtime linkage

- Simulation starts via upstream `/api/simulation/start`
- SPDM enables `enable_graph_memory_update=true`
- UI polls:
  - `/run-status`
  - `/run-status/detail`
  - `/graph/data/:graph_id`

