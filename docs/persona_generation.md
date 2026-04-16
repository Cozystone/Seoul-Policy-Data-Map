# Persona Generation

## Principle

Personas are graph-grounded simulation agents, not fixed dashboard cards.

## Source

- Upstream: `vendor/mirofish/backend/app/services/oasis_profile_generator.py`
- Grounding: `vendor/mirofish/backend/app/services/entity_reader.py`
- Seoul extension: `vendor/mirofish/backend/app/services/spdm_seoul_adapter.py`

## SPDM persona targets

- 직장인
- 자영업자
- 주민
- 관광객
- 고령층
- 학부모
- 교통약자
- 행정 담당자
- 온라인 커뮤니티 참여자

## Persona fields to preserve

- Background
- Interests
- Sensitive metrics
- Information trust path
- Reaction tendency
- Memory / context

## Generation flow

1. Read graph entities
2. Filter relevant entity groups for the scenario
3. Generate upstream OASIS-compatible profiles
4. Export runtime profiles for Twitter/Reddit style parallel simulation
5. Surface profiles in SPDM environment view

