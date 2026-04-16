# MiroFish Function Mapping

| Upstream MiroFish function | Current repo file/module | Status | Reason |
|---|---|---|---|
| Seed document upload + prediction requirement intake | `vendor/mirofish/backend/app/api/graph.py`, `app/api/mirofish/bootstrap/route.ts` | Extend | Upstream graph intake is preserved; SPDM adds Seoul policy seed bundling and realtime city-state context. |
| Ontology generation | `vendor/mirofish/backend/app/services/ontology_generator.py` | Reuse | Core LLM ontology generation remains upstream behavior. |
| Graph build task orchestration | `vendor/mirofish/backend/app/api/graph.py`, `vendor/mirofish/backend/app/services/graph_builder.py` | Reuse | Graph-first world building is preserved and now proxied into SPDM UI. |
| Graph visualization and refresh semantics | `vendor/mirofish/frontend/src/components/GraphPanel.vue`, `app/spdm-redesign.tsx` | Extend | SPDM keeps graph build polling semantics while rendering them inside the Seoul console. |
| Entity read/filter for simulation setup | `vendor/mirofish/backend/app/services/entity_reader.py` | Reuse | Persona grounding still starts from graph entities. |
| Persona/profile generation | `vendor/mirofish/backend/app/services/oasis_profile_generator.py`, `vendor/mirofish/backend/app/api/simulation.py` | Reuse | Upstream profile generation path is kept. |
| Seoul persona grounding | `vendor/mirofish/backend/app/services/spdm_seoul_adapter.py` | Extend | Adds Seoul-specific persona presets and seed-to-entity translation. |
| Simulation config generation | `vendor/mirofish/backend/app/services/simulation_config_generator.py`, `vendor/mirofish/backend/app/api/simulation.py` | Reuse | Time config, agent config, and event config stay in upstream flow. |
| Round-based dual-platform simulation | `vendor/mirofish/backend/app/services/simulation_runner.py`, `vendor/mirofish/backend/scripts/run_parallel_simulation.py` | Reuse | Core time-evolving run loop stays upstream. |
| Graph memory update during simulation | `vendor/mirofish/backend/app/services/graph_memory_updater.py`, `vendor/mirofish/backend/app/api/simulation.py` | Reuse | SPDM now starts simulation with `enable_graph_memory_update=true`. |
| Report generation | `vendor/mirofish/backend/app/api/report.py`, `vendor/mirofish/backend/app/services/report_agent.py` | Reuse | Final report path remains upstream. |
| Post-run interaction / interviews | `vendor/mirofish/backend/app/api/simulation.py` interview routes | Reuse | Agent-level and report-level follow-up remain part of the intended product flow. |
| Public SPDM console orchestration | `app/spdm-redesign.tsx`, `app/api/mirofish/[...path]/route.ts` | Add | New UI layer preserves MiroFish flow while presenting Seoul policy data and verdict framing. |

