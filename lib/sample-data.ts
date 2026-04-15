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
    name: "강남역 심야 혼잡 완화 확대",
    shortName: "강남 심야 확대",
    type: "대중교통 · 혼잡 관리",
    region: "송파구 / 강남구 / 서초구",
    realtimeArea: "강남 MICE 관광특구",
    timeWindow: "18:00 - 23:00",
    personas: ["관광객", "직장인", "상인"],
    objective:
      "강남역과 인접 환승권역의 야간 보행 혼잡을 낮추고, 귀가 시간대 대중교통 접근성을 높인다.",
    intensity: 0.72,
    disruption: 0.46,
    benefitClarity: 0.74,
    personaSensitivity: 0.63,
    evidenceStrength: 0.78,
    novelty: 0.38,
    verdict: "중간",
    judgement: "상권 매출과 퇴근 편의는 개선되지만 주민 체감 혼잡은 중간 수준으로 남는다.",
    fragility: "택시 대기열, 버스 정류장 체류, 이면도로 소음 민원이 동시에 움직인다.",
    mitigation: "정류장 분산 안내, 임시 보행 안전요원, 상권 종료 시간대 셔틀 연계를 병행한다.",
    effect: "대중교통 분산과 보행 동선 정리로 혼잡 피크가 낮아지고 관광객 체류 안정성이 오른다.",
    sideEffect: "주민은 소음과 쓰레기 증가를 우려하고, 택시 업계는 승차 대기 운영 변경에 민감하다.",
    evidence: "실시간 도시데이터 혼잡 신호, 지하철 승하차 추정, 민원 키워드 샘플을 함께 반영했다."
  },
  {
    id: "cheonggye-access-shift",
    name: "청계천 주말 접근 운영 변경",
    shortName: "청계천 접근 변경",
    type: "보행 · 관광 운영",
    region: "중구 / 종로구",
    realtimeArea: "광화문·덕수궁",
    timeWindow: "토·일 11:00 - 19:00",
    personas: ["관광객", "상인", "주민"],
    objective:
      "주말 보행 밀집도를 완화하면서 주변 상권 유입을 유지하도록 접근 구간과 안내 체계를 조정한다.",
    intensity: 0.58,
    disruption: 0.38,
    benefitClarity: 0.66,
    personaSensitivity: 0.57,
    evidenceStrength: 0.7,
    novelty: 0.44,
    verdict: "관리 가능",
    judgement: "방문객 불편은 제한적이고 상인 반발은 안내 동선 품질에 따라 좌우된다.",
    fragility: "우천 시 대체 동선, 노점 밀집, 버스 정류장 접근성이 민감한 지점이다.",
    mitigation: "다국어 안내, 실시간 혼잡 표출, 우천 대체 루트와 상권 쿠폰을 함께 배치한다.",
    effect: "보행 밀집 구간이 나뉘고 체류 흐름이 넓게 퍼져 안전관리 부담이 낮아진다.",
    sideEffect: "일부 상권은 유동 인구 감소를 우려하고 관광객은 진입 동선 변경을 불편하게 느낄 수 있다.",
    evidence: "보행량 샘플, 관광 안내소 문의 패턴, 주말 교통 카드 승하차 흐름을 사용했다."
  },
  {
    id: "night-safety-zone",
    name: "야간 안전구역 강화",
    shortName: "야간 안전 강화",
    type: "안전 · 치안 · 조명",
    region: "홍대 / 신촌 / 건대입구",
    realtimeArea: "홍대 관광특구",
    timeWindow: "22:00 - 02:00",
    personas: ["청년층", "직장인", "온라인 커뮤니티"],
    objective:
      "야간 유흥 밀집권역의 안전 체감도를 높이고, 사고 취약 구간에 조명·순찰·신고 동선을 집중한다.",
    intensity: 0.81,
    disruption: 0.31,
    benefitClarity: 0.82,
    personaSensitivity: 0.69,
    evidenceStrength: 0.73,
    novelty: 0.52,
    verdict: "긍정",
    judgement: "안전 체감 개선 효과가 뚜렷하나 사생활 감시 우려를 투명하게 관리해야 한다.",
    fragility: "CCTV 증설, 순찰 빈도, 신고 데이터 활용 범위가 반응의 분기점이다.",
    mitigation: "개인정보 처리 기준 공개, 시민 감시단, 여성 안심 귀가 서비스와 연동한다.",
    effect: "위험 신고 대응 시간이 줄고 야간 이동 약자의 안전 체감 지수가 상승한다.",
    sideEffect: "온라인 커뮤니티에서 감시 강화와 특정 업종 낙인 우려가 빠르게 확산될 수 있다.",
    evidence: "112 신고 공개 통계, 조도 취약지점, 야간 유동 인구 추정치를 결합했다."
  }
];
