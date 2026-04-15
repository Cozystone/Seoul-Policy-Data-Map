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
- `realtimeArea`: Seoul citydata area name used by the live signal adapter.
- `timeWindow`: operation period.
- `personas`: affected stakeholder groups.
- `objective`: policy goal.
- `intensity`, `disruption`, `benefitClarity`, `personaSensitivity`, `evidenceStrength`, `novelty`: deterministic simulation controls.
- `effect`, `sideEffect`, `evidence`, `mitigation`: report outputs.

## Realtime Snapshot Shape

- `areaName`: Seoul citydata area name.
- `source`: `live` or `fallback`.
- `updatedAt`: upstream observation time or fallback generation time.
- `crowding.level`, `crowding.message`, `crowding.score`: citizen-readable crowding state and normalized score.
- `weather.temperatureC`, `weather.condition`, `weather.pm10`: weather indicators.
- `mobility.roadTrafficLevel`, `mobility.roadTrafficScore`, `mobility.subwayLine`: mobility indicators.

## Simulation Run Result

- `runId`: unique execution id.
- `scenarioId`: scenario used by the run.
- `createdAt`: execution timestamp.
- `signals`: pressure, acceptance, risk, and confidence.
- `verdict`: grade, headline, summary, and mitigation.
- `reaction`: support, concern, opposition, and neutral scores.
