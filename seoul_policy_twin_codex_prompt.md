# Seoul Policy Reaction Twin — Codex 메인 프롬프트

너는 AGPL-3.0 라이선스를 준수하는 공개형 프로토타입을 만드는 수석 엔지니어다.  
목표는 **MiroFish 또는 MiroFish-Offline 계열 오픈소스를 기반으로**, 서울시 공공데이터와 정책 문서를 입력받아 **정책 외부효과와 시민 반응을 동시에 시뮬레이션**하는 웹 프로토타입을 구현하는 것이다.

## 최우선 원칙
1. **기존 코드를 버리지 말고 최대한 활용**한다. 다만 repo 구조를 먼저 실제로 읽고, 파일/디렉터리명을 추정하지 말고 확인해서 작업한다.
2. **AGPL-3.0을 준수**한다. 원본 LICENSE 유지, NOTICE 추가, README에 fork 출처/변경사항/소스 접근 경로 명시, UI 하단에 Source / License 링크 추가.
3. **정책 외부효과와 사회 반응의 비중을 거의 동일하게** 둔다.
4. 첫 목표는 “완벽한 예측”이 아니라 **설명 가능한 정책 리허설 프로토타입**이다.
5. 프론트는 **심사위원이 즉시 이해할 수 있는 고급 대시보드**로 만든다. 기능보다 시연력과 설득력을 우선한다.

## 우리가 만들 제품
제품명: **Seoul Policy Reaction Twin**

한 줄 정의:
서울시 실시간/정기 공공데이터와 정책 문서, 뉴스/외부 신호를 결합해  
**정책 시행 시 발생할 도시 외부효과와 시민·이해관계자 반응을 함께 리허설하는 멀티에이전트 정책 시뮬레이션 프로토타입**.

## 필수 결과물
- 로컬에서 실행 가능한 전체 시스템
- `docker compose up` 또는 유사한 단일 진입점
- README 설치 가이드
- 샘플 데이터/샘플 정책 시나리오
- 대시보드 UI
- 정책 입력 → 시뮬레이션 → 결과 리포트 흐름
- AGPL 준수 고지
- 최소한의 테스트
- 개발 로그/구현 메모

## 작업 순서

### 0단계 — 저장소 분석
1. 현재 repo 구조를 실제로 스캔한다.
2. 핵심 파일과 모듈을 표로 정리한다.
3. 다음 항목을 구분한다:
   - 그대로 재사용할 부분
   - 서울형으로 교체할 부분
   - 새로 추가할 부분
4. 이 내용을 `docs/repo_map.md`로 저장한다.

### 1단계 — 라이선스/포크 정리
1. 원본 LICENSE를 유지한다.
2. `NOTICE.md` 생성:
   - upstream repo
   - fork 목적
   - 주요 변경점
   - AGPL 고지
3. README 최상단에 다음 정보를 추가:
   - upstream 링크
   - 본 프로젝트 목적
   - 소스코드 접근 경로
   - 변경 내역 요약
4. 웹앱 footer에 `Source`, `License`, `Notice` 링크를 추가한다.

### 2단계 — 서울 데이터 파이프라인 추가
다음 입력 소스를 수용하는 ingestion layer를 추가한다.

#### A. 서울시 실시간 도시데이터
- 121개 주요 장소 기준으로 수집
- 장소별 1회 1개 호출 구조를 고려해 queue/poller 설계
- raw JSON 저장
- 정규화 테이블 적재
- 최근 수집 시각, 호출 성공/실패, 재시도 로깅

#### B. 서울 열린데이터광장 정기 데이터
초기에는 파일 업로드 또는 수동 CSV 적재를 지원하고,
향후 API 연동 가능한 구조로 설계한다.
우선 대상 예:
- 유동인구
- 생활이동
- 카드소비
- 강우/기상
- 복지/취약계층 관련 공간데이터

#### C. 정책 문서/보도자료
- HTML/PDF/TXT/Markdown 입력 지원
- 정책명, 시행 기간, 대상 지역, 대상 집단, 기대효과 추출
- 요약 + 엔티티 추출

#### D. 뉴스/외부 신호
- 우선은 RSS / 공식 API / 수동 업로드 중심
- 커뮤니티/SNS는 generic adapter interface만 만들고, 실제 수집은 플러그인 방식으로 분리
- robots / TOS 준수 경고 문구를 코드와 README에 명시

### 3단계 — 공통 스키마와 저장 구조
PostgreSQL(+PostGIS 가능하면 사용) + 그래프 저장소(Neo4j 우선)를 사용한다.

#### 관계형 DB 기본 테이블
- raw_documents
- raw_api_responses
- regions
- places
- facilities
- metrics_timeseries
- policies
- policy_scenarios
- extracted_entities
- simulation_runs
- simulation_outputs

#### 그래프 모델
노드:
- Policy
- Region
- Place
- Facility
- PopulationGroup
- Metric
- Event
- Reaction
- Document
- Organization

엣지:
- APPLIES_TO
- LOCATED_IN
- TARGETS
- AFFECTS
- INFLUENCES
- REACTS_TO
- AMPLIFIES
- MITIGATES
- MENTIONS

### 4단계 — 서울형 world seed 생성기
MiroFish가 원래 문서 기반으로 world를 만든다면, 여기에 서울형 시드 생성기를 추가한다.

입력:
- 정책 문서
- 현재 도시 상태 요약
- 관련 지역/장소 메타데이터
- 관련 기사/반응 요약

출력:
- MiroFish core가 받을 수 있는 structured seed payload
- 사람/집단/지역/논쟁 포인트가 포함된 simulation context

`simulation/world_seed/` 아래에 구현한다.

### 5단계 — 서울형 에이전트 설계
다음 에이전트 타입을 우선 구현한다.
- 직장인
- 자영업자
- 고령층 주민
- 학부모
- 관광객
- 청년층
- 장애인/교통약자
- 구청/행정 담당자
- 온라인 커뮤니티 사용자

에이전트 속성:
- 생활권
- 이동 패턴
- 관심 지표
- 정책 민감도
- 정보 신뢰 소스
- 반응 성향
- 온라인 발화 빈도
- 영향력

에이전트 생성 로직은 deterministic seed + configurable randomness를 사용해서 재현 가능하게 만든다.

### 6단계 — 시뮬레이션 설계
시뮬레이션 결과는 반드시 두 축으로 나뉘어야 한다.

#### A. 구조적 외부효과
예:
- 유동 변화
- 혼잡 변화
- 소비 변화
- 접근성 변화
- 취약계층 영향
- 민원 가능성

#### B. 사회적 반응
예:
- 지지
- 반발
- 불안
- 오해
- 확산
- 갈등
- 수용성 변화

반드시 두 결과를 별도 카드와 종합 verdict로 보여준다.

### 7단계 — 정책 시나리오 입력기
프론트와 백엔드 모두 구조화된 정책 입력을 지원한다.

필수 입력 예시:
- 정책명
- 정책유형
- 대상 지역
- 대상 장소
- 시행 기간
- 시간대
- 대상 집단
- 정책 강도
- 정책 목표

샘플 시나리오 3개를 미리 제공한다.
1. 잠실 대형행사 확대
2. 우천 시 운영정책 변경
3. 야간 안전 강화

### 8단계 — 결과 후처리/설명
출력은 다음 4개를 생성한다.
1. 정량 요약
2. 영향 경로 그래프
3. 사회 반응 요약
4. 정책 verdict 리포트

Verdict 리포트 예시 섹션:
- 기대효과
- 부작용
- 반발 가능 집단
- 수용성 위험
- 보완 권고
- 신뢰도 / 근거 데이터

### 9단계 — UI / 시각화
프론트는 어두운 “operations room” 스타일로 만든다.
**핵심은 예쁘고, 이해가 쉽고, 데모에서 강해야 한다.**

#### 화면 1: Situation Overview
- 상단: 현재 서울 상태 헤더
- 좌측: 정책 composer
- 중앙: 현재 도시 상태 카드 + 장소별 시그널
- 우측: 반응 stream / hot reaction panel
- 하단: verdict preview

#### 화면 2: Simulation Result
- 좌측 상단: 정책 요약
- 중앙: 외부효과 Sankey/flow 또는 causal graph
- 우측 상단: 반응 river / stance distribution
- 좌측 하단: 대상 지역/집단 breakdown
- 우측 하단: recommended mitigations

#### 시각화 필수 요소
- **Impact Graph**: 정책 → 지표 → 집단 → 반응
- **Reaction River**: 시간에 따라 지지/반발/불안/무관심 흐름
- **Persona Cluster**: 비슷한 반응을 보이는 집단 군집
- **Verdict Card**: “정책은 상권에 긍정적이나 출퇴근 불만과 소음 반발 가능성이 큼” 같은 한 줄 판단
- **Confidence Strip**: 근거 데이터 강도 표시

#### 시각화 미감
- 전체 배경: charcoal / midnight
- 강조색: cyan, amber, crimson 3색 이내
- 카드 모서리 라운드, 그림자 최소
- 과한 3D 금지
- “서울 정책 통제실” 느낌
- 숫자보다 관계와 흐름을 먼저 보이게 할 것

### 10단계 — 개발 품질
- Python backend + FastAPI 우선
- frontend는 Next.js 또는 repo 기존 프론트에 맞춰 증설
- environment variables 정리
- `.env.example` 제공
- tests 최소 포함
- sample seed 데이터 제공
- 에러 처리와 fallback UI 추가

### 11단계 — 필수 문서
다음 문서를 생성한다.
- `docs/repo_map.md`
- `docs/architecture.md`
- `docs/data_model.md`
- `docs/ontology.md`
- `docs/license-compliance.md`
- `docs/demo-script.md`

### 12단계 — 데모 스크립트
심사위원용 시연 순서를 문서로 남긴다.
- 현재 서울 상태 확인
- 정책 선택
- 시뮬레이션 실행
- 외부효과 확인
- 시민 반응 확인
- verdict와 보완권고 확인

## 구현 시 주의사항
- repo 내부 실제 코드 구조를 먼저 읽고 난 뒤 수정한다.
- 기존 코드를 대규모로 갈아엎지 말고 adapter layer를 선호한다.
- 하드코딩보다 설정 파일/registry 방식을 우선한다.
- 스크래핑이 필요한 외부 소스는 기본 비활성화하고 인터페이스만 만든다.
- 예측 모델을 과장하지 말고 “policy rehearsal prototype”으로 일관되게 표현한다.
- 모든 변경은 commit-friendly한 작은 단위로 나눈다.

## 최종 산출 방식
작업을 시작하기 전에 아래를 먼저 출력하라.
1. repo 구조 분석 요약
2. 변경 계획
3. 리스크 목록
4. 1차 구현 순서

그 다음 단계별로 구현하라.  
작업 중간마다 변경 파일 목록과 이유를 요약하라.

---

# Codex 서브태스크 프롬프트 모음

## 1) Repo 분석 전용
현재 저장소를 읽고 구조를 파악하라. 파일명을 추정하지 말고 실제 트리를 확인하라.
다음을 표로 정리해서 `docs/repo_map.md`로 저장하라:
- 핵심 디렉터리
- 핵심 모듈
- 어떤 역할인지
- 그대로 재사용 / 교체 / 신규추가 여부

## 2) 라이선스 정리 전용
AGPL-3.0 준수형 포크로 쓰기 위해 다음을 구현하라:
- LICENSE 유지
- NOTICE.md 생성
- README 상단에 upstream, fork 목적, 변경 사항, source access 링크 추가
- UI footer에 Source / License / Notice 링크 추가

## 3) 서울 데이터 수집기 전용
FastAPI 백엔드에 ingestion layer를 추가하라.
지원 소스:
- 서울 실시간 도시데이터 (place-by-place polling)
- CSV 업로드형 정기 데이터
- 정책 문서 업로드
각 소스마다 raw 저장 + 정규화 저장을 분리하라.

## 4) World seed 생성기 전용
정책 문서 + 현재 도시 상태 + 관련 기사 요약을 받아
MiroFish core가 이해할 수 있는 structured world seed를 만들어라.
출력 포맷은 JSON으로 정의하고 예시 3개를 포함하라.

## 5) 서울형 에이전트 생성기 전용
서울 생활권 기반 에이전트 생성기를 구현하라.
필수 유형:
직장인, 자영업자, 고령층, 학부모, 관광객, 청년층, 교통약자, 행정담당자, 온라인 커뮤니티 사용자.
각 페르소나의 민감 지표와 반응 성향을 설정 가능하게 하라.

## 6) 결과 시각화 전용
어두운 ops-room 스타일 대시보드를 구현하라.
필수 컴포넌트:
- Policy Composer
- Situation Signals
- Impact Graph
- Reaction River
- Persona Cluster
- Verdict Card
과도한 애니메이션 없이 고급스럽게 구현하라.

---

# 시각화 브리프

## 한 줄 콘셉트
“서울시 정책 통제실 + 사회 반응 실험실”

## 화면 구성
1. 헤더
   - Seoul Policy Reaction Twin
   - 현재 시각 / 데이터 freshness / active scenario
2. 좌측 컬럼
   - 정책 입력
   - 타깃 지역/집단
   - 시뮬레이션 버튼
3. 중앙 메인
   - Impact Graph
   - 현재 도시 상태 카드
4. 우측 컬럼
   - Reaction River
   - Persona Cluster
5. 하단
   - Verdict / 리스크 / 보완 권고

## 반드시 보이는 것
- “이 정책이 누구에게 어떻게 번지는가”
- “어디서 반발이 커지는가”
- “보완정책을 넣으면 결과가 어떻게 달라지는가”

## 피해야 할 것
- 일반 BI 대시보드처럼 숫자만 많은 화면
- 지도만 커다랗게 놓고 의미 없는 핀만 많이 찍는 구성
- 화려하지만 해석이 어려운 3D
