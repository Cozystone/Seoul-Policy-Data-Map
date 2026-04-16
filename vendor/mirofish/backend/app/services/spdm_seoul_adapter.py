"""
Seoul Policy Reaction Twin adapter layer for MiroFish-Offline.

This module intentionally reuses MiroFish core structures:
- EntityNode from entity_reader
- OasisAgentProfile from oasis_profile_generator
- SimulationParameters / AgentActivityConfig / EventConfig / PlatformConfig from
  simulation_config_generator

The adapter only translates Seoul policy inputs into MiroFish/OASIS-compatible
seed, agent, and simulation configuration artifacts.
"""

import json
import os
import re
from dataclasses import asdict
from datetime import datetime
from typing import Any, Dict, List, Optional

from .entity_reader import EntityNode
from .oasis_profile_generator import OasisAgentProfile
from .simulation_config_generator import (
    AgentActivityConfig,
    EventConfig,
    PlatformConfig,
    SimulationParameters,
    TimeSimulationConfig,
)
from .simulation_runner import SimulationRunner


SEOUL_PERSONAS = [
    {
        "name": "직장인",
        "entity_type": "Worker",
        "profession": "Office worker",
        "bias": 0.08,
        "active_hours": [7, 8, 9, 12, 18, 19, 20, 21, 22],
        "summary": "Commutes through Seoul business districts and reacts strongly to mobility, commute time, and crowding changes.",
    },
    {
        "name": "자영업자",
        "entity_type": "SmallBusinessOwner",
        "profession": "Local merchant",
        "bias": 0.03,
        "active_hours": [9, 10, 11, 12, 13, 18, 19, 20, 21, 22, 23],
        "summary": "Operates a local shop and evaluates policy by foot traffic, sales, loading access, and district reputation.",
    },
    {
        "name": "고령층 주민",
        "entity_type": "SeniorResident",
        "profession": "Senior resident",
        "bias": -0.05,
        "active_hours": [6, 7, 8, 9, 10, 16, 17, 18, 19],
        "summary": "Long-term resident who is sensitive to safety, noise, accessibility, health, and clear public guidance.",
    },
    {
        "name": "학부모",
        "entity_type": "Parent",
        "profession": "Parent",
        "bias": 0.02,
        "active_hours": [7, 8, 9, 15, 16, 17, 20, 21, 22],
        "summary": "Tracks child safety, school routes, care schedules, traffic risk, and neighborhood stability.",
    },
    {
        "name": "관광객",
        "entity_type": "Tourist",
        "profession": "Visitor",
        "bias": 0.12,
        "active_hours": [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
        "summary": "Visits Seoul landmarks and reacts to wayfinding, congestion, multilingual information, and public transit clarity.",
    },
    {
        "name": "청년층",
        "entity_type": "Youth",
        "profession": "Student or early-career resident",
        "bias": 0.0,
        "active_hours": [11, 12, 13, 18, 19, 20, 21, 22, 23],
        "summary": "Highly active online and responds to fairness, affordability, digital services, nightlife, and peer sentiment.",
    },
    {
        "name": "교통약자",
        "entity_type": "MobilityVulnerable",
        "profession": "Mobility-vulnerable citizen",
        "bias": -0.02,
        "active_hours": [8, 9, 10, 11, 14, 15, 16, 17, 18],
        "summary": "Evaluates policy by barrier-free routes, transfer burden, walking distance, elevators, and service reliability.",
    },
    {
        "name": "행정 담당자",
        "entity_type": "GovernmentOfficial",
        "profession": "Seoul policy officer",
        "bias": 0.18,
        "active_hours": [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
        "summary": "Represents operational constraints, legal accountability, interdepartment coordination, and public communication risk.",
    },
    {
        "name": "온라인 커뮤니티 사용자",
        "entity_type": "OnlineCommunityUser",
        "profession": "Community participant",
        "bias": -0.08,
        "active_hours": [0, 1, 12, 13, 18, 19, 20, 21, 22, 23],
        "summary": "Amplifies narratives through online forums and reacts quickly to perceived unfairness, surveillance, or inconvenience.",
    },
]

PERSONA_AGES = {
    "Worker": 34,
    "SmallBusinessOwner": 48,
    "SeniorResident": 72,
    "Parent": 41,
    "Tourist": 29,
    "Youth": 24,
    "MobilityVulnerable": 58,
    "GovernmentOfficial": 39,
    "OnlineCommunityUser": 27,
}


def _slug(value: str) -> str:
    slug = re.sub(r"[^0-9a-zA-Z가-힣]+", "-", value.strip()).strip("-")
    return slug.lower() or "seoul-policy"


def parse_policy_document(text: str) -> Dict[str, Any]:
    """Lightweight parser for txt/md/html-derived policy text."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    title = lines[0] if lines else "서울 정책 시나리오"
    joined = "\n".join(lines)

    region_patterns = ["강남", "송파", "서초", "중구", "종로", "홍대", "신촌", "건대", "광화문", "청계천"]
    target_patterns = ["직장인", "자영업자", "고령층", "학부모", "관광객", "청년층", "교통약자", "주민"]

    regions = [region for region in region_patterns if region in joined]
    targets = [target for target in target_patterns if target in joined]

    return {
        "policy_name": title,
        "summary": joined[:1200],
        "regions": regions or ["서울시"],
        "target_groups": targets or [persona["name"] for persona in SEOUL_PERSONAS[:4]],
        "objective": lines[1] if len(lines) > 1 else joined[:240],
    }


def build_world_seed(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Create a Seoul world seed while preserving MiroFish's document-first workflow."""
    policy_document = payload.get("policy_document", "")
    parsed = parse_policy_document(policy_document)
    current_city_state = payload.get("current_city_state") or {}
    external_signals = payload.get("external_signals") or []

    seed = {
        "seed_type": "seoul_policy_reaction_twin",
        "created_at": datetime.now().isoformat(),
        "policy": {
            "name": payload.get("policy_name") or parsed["policy_name"],
            "objective": payload.get("objective") or parsed["objective"],
            "regions": payload.get("regions") or parsed["regions"],
            "target_groups": payload.get("target_groups") or parsed["target_groups"],
            "time_window": payload.get("time_window", "T-48h to T+72h"),
        },
        "city_state": current_city_state,
        "external_signals": external_signals,
        "ontology": {
            "nodes": ["Policy", "Region", "Place", "PopulationGroup", "Metric", "Event", "Reaction", "Document"],
            "edges": ["APPLIES_TO", "AFFECTS", "INFLUENCES", "REACTS_TO", "AMPLIFIES", "MITIGATES", "MENTIONS"],
        },
        "source_document": parsed["summary"],
    }
    return seed


def build_entity_nodes(seed: Dict[str, Any]) -> List[EntityNode]:
    """Map Seoul policy seed into MiroFish EntityNode objects."""
    policy = seed["policy"]
    entities: List[EntityNode] = [
        EntityNode(
            uuid=f"policy-{_slug(policy['name'])}",
            name=policy["name"],
            labels=["Entity", "Policy"],
            summary=policy["objective"],
            attributes={"time_window": policy.get("time_window", "")},
        )
    ]

    for region in policy.get("regions", []):
        entities.append(
            EntityNode(
                uuid=f"region-{_slug(region)}",
                name=region,
                labels=["Entity", "Region"],
                summary=f"Seoul region affected by policy: {region}",
                attributes={"city": "Seoul"},
            )
        )

    for persona in SEOUL_PERSONAS:
        entities.append(
            EntityNode(
                uuid=f"group-{_slug(persona['entity_type'])}",
                name=persona["name"],
                labels=["Entity", persona["entity_type"]],
                summary=persona["summary"],
                attributes={
                    "profession": persona["profession"],
                    "sentiment_bias": persona["bias"],
                },
            )
        )

    for signal in seed.get("external_signals", []):
        title = signal.get("title", signal.get("source", "external signal"))
        entities.append(
            EntityNode(
                uuid=f"event-{_slug(title)}",
                name=title,
                labels=["Entity", "Event"],
                summary=signal.get("summary", json.dumps(signal, ensure_ascii=False)),
                attributes={"source": signal.get("source", "manual")},
            )
        )

    return entities


def build_oasis_profiles(seed: Dict[str, Any]) -> List[OasisAgentProfile]:
    """Create OASIS-compatible profiles without replacing MiroFish's profile format."""
    profiles: List[OasisAgentProfile] = []

    for user_id, persona in enumerate(SEOUL_PERSONAS):
        profile = OasisAgentProfile(
            user_id=user_id,
            user_name=f"spdm_{persona['entity_type'].lower()}_{user_id}",
            name=persona["name"],
            bio=persona["summary"][:150],
            persona=(
                f"{persona['name']} in Seoul. {persona['summary']} "
                f"Policy context: {seed['policy']['name']} / {seed['policy']['objective']}"
            ),
            age=PERSONA_AGES.get(persona["entity_type"], 30),
            gender="other",
            mbti="ISTJ" if persona["entity_type"] == "GovernmentOfficial" else "ENFP",
            country="South Korea",
            profession=persona["profession"],
            interested_topics=["Seoul", "Public Policy", "Mobility", "Public Reaction"],
            source_entity_uuid=f"group-{_slug(persona['entity_type'])}",
            source_entity_type=persona["entity_type"],
        )
        profiles.append(profile)

    return profiles


def build_simulation_parameters(
    seed: Dict[str, Any],
    simulation_id: str,
    project_id: Optional[str] = None,
    graph_id: Optional[str] = None,
) -> SimulationParameters:
    """Create MiroFish SimulationParameters for Seoul policy reaction rehearsal."""
    project_id = project_id or f"spdm-project-{_slug(seed['policy']['name'])}"
    graph_id = graph_id or f"spdm-graph-{_slug(seed['policy']['name'])}"

    agent_configs = []
    for agent_id, persona in enumerate(SEOUL_PERSONAS):
        agent_configs.append(
            AgentActivityConfig(
                agent_id=agent_id,
                entity_uuid=f"group-{_slug(persona['entity_type'])}",
                entity_name=persona["name"],
                entity_type=persona["entity_type"],
                activity_level=0.72 if persona["entity_type"] == "OnlineCommunityUser" else 0.52,
                posts_per_hour=0.6,
                comments_per_hour=1.4,
                active_hours=persona["active_hours"],
                response_delay_min=2 if persona["entity_type"] == "OnlineCommunityUser" else 8,
                response_delay_max=30 if persona["entity_type"] == "OnlineCommunityUser" else 90,
                sentiment_bias=persona["bias"],
                stance="neutral",
                influence_weight=2.6 if persona["entity_type"] == "GovernmentOfficial" else 1.0,
            )
        )

    initial_posts = [
        {
            "content": f"서울시 정책 리허설: {seed['policy']['name']} - {seed['policy']['objective']}",
            "poster_type": "GovernmentOfficial",
            "poster_agent_id": 7,
        },
        {
            "content": "현장 혼잡과 이동 변화가 실제 생활에 어떤 부담을 만들지 지켜봐야 합니다.",
            "poster_type": "OnlineCommunityUser",
            "poster_agent_id": 8,
        },
    ]

    return SimulationParameters(
        simulation_id=simulation_id,
        project_id=project_id,
        graph_id=graph_id,
        simulation_requirement=(
            "Simulate Seoul policy structural externalities and citizen reaction with equal weight. "
            "Separate mobility/crowding/accessibility effects from social support, concern, opposition, conflict, and adoption."
        ),
        time_config=TimeSimulationConfig(
            total_simulation_hours=72,
            minutes_per_round=60,
            agents_per_hour_min=3,
            agents_per_hour_max=9,
            peak_hours=[18, 19, 20, 21, 22],
            off_peak_hours=[1, 2, 3, 4, 5],
            morning_hours=[7, 8, 9],
            work_hours=[9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
        ),
        agent_configs=agent_configs,
        event_config=EventConfig(
            initial_posts=initial_posts,
            scheduled_events=[],
            hot_topics=["Seoul policy", "mobility", "crowding", "merchant impact", "public acceptance"],
            narrative_direction="Track the split between administrative effectiveness, everyday inconvenience, and online amplification.",
        ),
        twitter_config=PlatformConfig(platform="twitter", viral_threshold=12, echo_chamber_strength=0.45),
        reddit_config=PlatformConfig(platform="reddit", viral_threshold=15, echo_chamber_strength=0.58),
        llm_model=os.getenv("LLM_MODEL_NAME", "qwen2.5:7b"),
        llm_base_url=os.getenv("LLM_BASE_URL", "http://localhost:11434/v1"),
        generation_reasoning="Generated by SPDM Seoul adapter using MiroFish-Offline simulation dataclasses.",
    )


def write_rehearsal_artifacts(payload: Dict[str, Any], output_dir: str) -> Dict[str, Any]:
    """Write MiroFish-compatible seed, profiles, config, and report artifacts."""
    seed = build_world_seed(payload)
    simulation_id = payload.get("simulation_id") or f"spdm_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    sim_dir = os.path.join(output_dir, simulation_id)
    os.makedirs(sim_dir, exist_ok=True)
    os.makedirs(os.path.join(sim_dir, "twitter"), exist_ok=True)
    os.makedirs(os.path.join(sim_dir, "reddit"), exist_ok=True)

    entities = build_entity_nodes(seed)
    profiles = build_oasis_profiles(seed)
    params = build_simulation_parameters(seed, simulation_id)

    world_seed_path = os.path.join(sim_dir, "spdm_world_seed.json")
    entities_path = os.path.join(sim_dir, "spdm_entities.json")
    reddit_profiles_path = os.path.join(sim_dir, "reddit_profiles.json")
    twitter_profiles_path = os.path.join(sim_dir, "twitter_profiles.csv")
    config_path = os.path.join(sim_dir, "simulation_config.json")
    state_path = os.path.join(sim_dir, "state.json")
    output_path = os.path.join(sim_dir, "spdm_output.json")
    report_path = os.path.join(sim_dir, "spdm_report.md")

    with open(world_seed_path, "w", encoding="utf-8") as f:
        json.dump(seed, f, ensure_ascii=False, indent=2)

    with open(entities_path, "w", encoding="utf-8") as f:
        json.dump([entity.to_dict() for entity in entities], f, ensure_ascii=False, indent=2)

    with open(reddit_profiles_path, "w", encoding="utf-8") as f:
        json.dump([profile.to_reddit_format() for profile in profiles], f, ensure_ascii=False, indent=2)

    import csv

    with open(twitter_profiles_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["user_id", "name", "username", "user_char", "description"])
        for profile in profiles:
            writer.writerow([profile.user_id, profile.name, profile.user_name, profile.persona, profile.bio])

    with open(config_path, "w", encoding="utf-8") as f:
        f.write(params.to_json())

    state = {
        "simulation_id": simulation_id,
        "project_id": params.project_id,
        "graph_id": params.graph_id,
        "status": "ready",
        "config_generated": True,
        "entities_count": len(entities),
        "entity_types": sorted({label for entity in entities for label in entity.labels if label != "Entity"}),
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }
    with open(state_path, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)

    structured_output = {
        "simulation_id": simulation_id,
        "world_seed": seed,
        "structural_externalities": {
            "flow_change": "Derived from realtime crowding and target region mobility signals.",
            "crowding_change": seed.get("city_state", {}).get("crowding", "sample"),
            "consumption_change": "Estimated from merchant persona reactions and district footfall assumptions.",
            "accessibility_change": "Estimated from mobility-vulnerable and transit-user agent reactions.",
            "vulnerable_group_impact": "Tracked through senior resident, parent, and mobility-vulnerable agents.",
        },
        "social_reaction": {
            "support": "Tracked through supportive agent actions and report sentiment.",
            "opposition": "Tracked through opposing posts, replies, and amplification.",
            "concern": "Tracked through uncertainty, risk, and inconvenience narratives.",
            "conflict": "Tracked through reply chains and stance polarization.",
            "acceptance": "Tracked through final report and agent interviews.",
            "spread": "Tracked through MiroFish action logs and platform diffusion.",
        },
        "mirofish_artifacts": {
            "simulation_config": config_path,
            "reddit_profiles": reddit_profiles_path,
            "twitter_profiles": twitter_profiles_path,
            "state": state_path,
        },
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(structured_output, f, ensure_ascii=False, indent=2)

    with open(report_path, "w", encoding="utf-8") as f:
        f.write(
            f"# Seoul Policy Reaction Twin Report\n\n"
            f"Simulation: `{simulation_id}`\n\n"
            f"Policy: **{seed['policy']['name']}**\n\n"
            f"## Verdict\n\n"
            f"MiroFish-compatible artifacts are ready. Run the core simulation with "
            f"`/api/simulation/start` or `run_spdm_policy_rehearsal.py --execute-core` after Neo4j and Ollama are available.\n\n"
            f"## Structural Externalities\n\n"
            f"- Flow change\n- Crowding change\n- Consumption change\n- Accessibility change\n- Vulnerable group impact\n\n"
            f"## Social Reaction\n\n"
            f"- Support\n- Opposition\n- Concern\n- Conflict\n- Acceptance\n- Spread\n"
        )

    return {
        "simulation_id": simulation_id,
        "simulation_dir": sim_dir,
        "artifacts": structured_output["mirofish_artifacts"],
        "output_json": output_path,
        "report": report_path,
    }


def execute_core_if_requested(simulation_id: str, platform: str = "parallel", max_rounds: int = 8) -> Dict[str, Any]:
    """Delegate actual execution to MiroFish SimulationRunner."""
    state = SimulationRunner.start_simulation(
        simulation_id=simulation_id,
        platform=platform,
        max_rounds=max_rounds,
        enable_graph_memory_update=False,
    )
    return state.to_dict()
