# Ontology

## Nodes

- `Policy`
- `PolicyScenario`
- `Region`
- `Place`
- `Facility`
- `PopulationGroup`
- `Metric`
- `Event`
- `Reaction`
- `Document`
- `Organization`

## Relationships

- `APPLIES_TO`: Policy or scenario applies to a region/place.
- `LOCATED_IN`: Place or facility belongs to a region.
- `TARGETS`: Policy targets a population group.
- `AFFECTS`: Policy changes a metric or group condition.
- `INFLUENCES`: One metric shifts another metric or reaction.
- `REACTS_TO`: Population group reacts to a policy/event.
- `AMPLIFIES`: Event or reaction increases another reaction.
- `MITIGATES`: Recommendation reduces risk or side effect.
- `MENTIONS`: Document references a node.

## Prototype Mapping

The Impact Graph in the current UI maps:

`PolicyScenario -> Region -> Operational Signal / Daily Life Impact -> Expected Effect / Opposition Risk -> Verdict`
