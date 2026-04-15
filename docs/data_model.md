# Data Model

## Relational Tables

- `raw_documents`: uploaded policy documents and extracted text.
- `raw_api_responses`: unmodified city data API responses.
- `regions`: Seoul district, neighborhood, and policy area records.
- `places`: stations, parks, commercial zones, event venues, and public facilities.
- `facilities`: public assets that policies may affect.
- `metrics_timeseries`: crowding, mobility, weather, safety, complaints, and usage metrics.
- `policies`: canonical policy records.
- `policy_scenarios`: proposed policy execution settings.
- `extracted_entities`: organizations, places, target groups, and policy terms.
- `simulation_runs`: execution metadata and versioned assumptions.
- `simulation_outputs`: impact, reaction, confidence, and verdict results.

## Sample Scenario Fields

- `name`: policy title.
- `type`: policy domain.
- `region`: target area.
- `timeWindow`: operation period.
- `personas`: affected stakeholder groups.
- `objective`: policy goal.
- `intensity`, `disruption`, `benefitClarity`, `personaSensitivity`, `evidenceStrength`, `novelty`: deterministic simulation controls.
- `effect`, `sideEffect`, `evidence`, `mitigation`: report outputs.
