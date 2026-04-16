import type { Scenario } from "./types";

export const signalBase = {
  crowding: 82,
  mobilityLoad: 68,
  complaintVelocity: 54,
  evidenceCoverage: 61
};

export const scenarios: Scenario[] = [
  {
    id: "gangnam-crowd-extension",
    name: "강남 MICE 대형행사 분산 운영 시나리오",
    shortName: "강남 행사 분산 운영",
    type: "대중행사 혼잡 관리",
    region: "송파구 / 강남구 / 서초구",
    realtimeArea: "강남 MICE 관광특구",
    timeWindow: "18:00 - 23:00",
    personas: ["관광객", "직장인", "자영업자", "온라인 커뮤니티 사용자"],
    objective:
      "잠실과 강남권 야간 방문 수요를 분산해 보행 혼잡과 교통 지체를 낮추고, 상권 매출과 체류 안전성을 동시에 관리한다.",
    intensity: 0.72,
    disruption: 0.46,
    benefitClarity: 0.74,
    personaSensitivity: 0.63,
    evidenceStrength: 0.78,
    novelty: 0.38,
    verdict: "중간",
    judgement:
      "상권 매출과 이동 효율은 개선될 가능성이 높지만, 출퇴근 시간대 체감 혼잡과 주민 민원 부담은 중간 수준으로 남는다.",
    fragility:
      "행사 종료 시점 집중, 버스 정류장 체류, 택시 승하차 지점 병목에서 반응이 급격히 악화될 수 있다.",
    mitigation:
      "정류장 분산 안내, 임시 보행 안전요원, 행사 종료 시간 분산, 상권 쿠폰 연계를 함께 배치한다.",
    effect:
      "대중교통 수요 분산과 보행 동선 정리로 혼잡 피크가 낮아지고 관광객 체류 안정성이 오른다.",
    sideEffect:
      "주변 주거지 소음과 쓰레기 증가 우려, 택시 대기 수요 변화에 대한 불만이 빠르게 확산될 수 있다.",
    evidence:
      "서울 실시간 도시데이터, 생활이동 추정, 민원 키워드, 상권 반응 샘플 데이터를 결합했다."
  },
  {
    id: "cheonggye-access-shift",
    name: "청계천 주말 보행 우선 운영 전환",
    shortName: "청계천 보행 우선",
    type: "보행 및 관광 운영",
    region: "중구 / 종로구",
    realtimeArea: "광화문광장",
    timeWindow: "11:00 - 19:00",
    personas: ["관광객", "자영업자", "주민", "학부모"],
    objective:
      "주말 방문 밀도를 완화하면서도 체류 경험을 유지하기 위해 진입 구간과 안내 체계를 재조정한다.",
    intensity: 0.58,
    disruption: 0.38,
    benefitClarity: 0.66,
    personaSensitivity: 0.57,
    evidenceStrength: 0.7,
    novelty: 0.44,
    verdict: "관리 가능",
    judgement:
      "방문객 불편은 제한적이지만, 상인 반발은 안내 동선 설계와 대체 유입 설계에 따라 크게 달라진다.",
    fragility:
      "주변 진입 대체 동선, 노점 배치, 버스 정류장 접근성이 민감한 변수다.",
    mitigation:
      "권역별 안내, 실시간 혼잡 노출, 대체 루트 추천, 상권 할인 캠페인을 동시에 운영한다.",
    effect:
      "보행 집중 구간의 체류 흐름이 안정되고 안전관리 부담이 낮아진다.",
    sideEffect:
      "일부 점포는 유동 감소를 우려하고, 관광객은 진입 경로 변경에 대한 불만을 제기할 수 있다.",
    evidence:
      "보행 센서 샘플, 관광 문의 패턴, 카드 소비 흐름을 반영했다."
  },
  {
    id: "night-safety-zone",
    name: "야간 안전관리 구역 강화",
    shortName: "야간 안전 구역 강화",
    type: "안전·치안·조명",
    region: "마포구 / 용산구 / 관악구",
    realtimeArea: "홍대 관광특구",
    timeWindow: "22:00 - 02:00",
    personas: ["청년층", "직장인", "교통약자", "온라인 커뮤니티 사용자"],
    objective:
      "야간 활동 밀집 구역의 안전 체감도를 높이기 위해 조명, 순찰, 신고 동선을 집중 강화한다.",
    intensity: 0.81,
    disruption: 0.31,
    benefitClarity: 0.82,
    personaSensitivity: 0.69,
    evidenceStrength: 0.73,
    novelty: 0.52,
    verdict: "긍정",
    judgement:
      "안전 체감 개선 효과는 분명하지만, 사생활 침해와 과잉 감시에 대한 우려를 명확히 관리해야 한다.",
    fragility:
      "CCTV 증설, 순찰 빈도, 신고 데이터 사용 범위가 반응의 분기점이 된다.",
    mitigation:
      "개인정보 처리 기준을 선공개하고, 감시 강화가 아닌 안전 지원 서비스로 설명한다.",
    effect:
      "위험 신고 대응 시간이 줄고, 야간 이동 약자의 안전 체감 지표가 상승한다.",
    sideEffect:
      "온라인 커뮤니티에서 특정 집단 표적화 우려가 빠르게 퍼질 수 있다.",
    evidence:
      "112 공개 통계, 조도 취약지점, 야간 이동 인구 추정치를 결합했다."
  }
];
