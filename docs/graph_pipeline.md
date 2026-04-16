# Graph Pipeline

## Goal

The graph is the simulation's world skeleton, not a decorative result view.

## Pipeline

1. Seed intake
   - Policy document
   - News/external signal
   - Seoul realtime state or uploaded JSON/CSV
   - Forecast question
2. Document parsing
   - Normalize uploaded documents into text blocks
   - Bundle policy and city-state context into a single seed package
3. Ontology generation
   - Upstream MiroFish `ontology_generator.py`
   - Extract entity and edge type candidates
4. Graph build
   - Chunk text
   - Extract entity/relation candidates
   - Persist nodes/edges into Neo4j via MiroFish graph builder
5. Evidence grounding
   - Document -> mentions -> entity
   - Policy -> applies_to -> region/place
   - Policy/Event -> affects -> metric/reaction
6. Graph summary
   - Issue axis
   - Conflict axis
   - Key places / groups / organizations
7. Simulation grounding
   - Read entities back from graph
   - Generate personas and configs
8. Explanation reuse
   - Poll graph during simulation
   - Reuse graph as explanation graph for report and follow-up

## Required graph semantics

- Each entity has `type` and aliases when available.
- Each relation should be explainable from evidence.
- Policy, Region, Place, Organization, PopulationGroup, Metric, Event, Issue, Reaction, Document must be representable.

