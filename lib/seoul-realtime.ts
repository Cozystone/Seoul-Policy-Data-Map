import type { SeoulRealtimeSnapshot } from "./types";

const DEFAULT_AREA = "광화문광장";

const fallbackSnapshot: SeoulRealtimeSnapshot = {
  areaName: DEFAULT_AREA,
  source: "fallback",
  updatedAt: new Date().toISOString(),
  crowding: {
    level: "보통",
    message: "실시간 API 키가 없거나 호출에 실패해 샘플 혼잡 신호를 사용 중입니다.",
    score: 62
  },
  weather: {
    temperatureC: 18,
    condition: "관측 대기",
    pm10: 42
  },
  mobility: {
    roadTrafficLevel: "서행",
    roadTrafficScore: 58,
    subwayLine: "1호선 / 5호선"
  }
};

const crowdingScore: Record<string, number> = {
  여유: 28,
  보통: 55,
  "약간 붐빔": 72,
  붐빔: 88
};

const trafficScore: Record<string, number> = {
  원활: 30,
  서행: 58,
  정체: 84
};

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function firstRecord(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) {
    return asObject(value[0]);
  }

  return asObject(value);
}

function parseCityData(payload: unknown, areaName: string): SeoulRealtimeSnapshot {
  const root = asObject(payload);
  const cityData = asObject(root.CITYDATA);
  const livePopulation = firstRecord(cityData.LIVE_PPLTN_STTS);
  const weather = firstRecord(cityData.WEATHER_STTS);
  const roadRoot = asObject(cityData.ROAD_TRAFFIC_STTS);
  const road = asObject(roadRoot.AVG_ROAD_DATA);
  const subway = firstRecord(cityData.SUB_STTS);

  const crowdingLevel = asString(livePopulation.AREA_CONGEST_LVL, fallbackSnapshot.crowding.level);
  const trafficLevel = asString(road.ROAD_TRAFFIC_IDX, fallbackSnapshot.mobility.roadTrafficLevel);
  const populationUpdatedAt =
    asString(livePopulation.PPLTN_TIME) ||
    asString(weather.WEATHER_TIME) ||
    asString(road.ROAD_TRAFFIC_TIME) ||
    new Date().toISOString();

  return {
    areaName: asString(cityData.AREA_NM, areaName),
    source: "live",
    updatedAt: populationUpdatedAt,
    crowding: {
      level: crowdingLevel,
      message: asString(livePopulation.AREA_CONGEST_MSG, fallbackSnapshot.crowding.message),
      score: crowdingScore[crowdingLevel] ?? fallbackSnapshot.crowding.score
    },
    weather: {
      temperatureC: asNumber(weather.TEMP),
      condition: asString(weather.PCP_MSG, asString(weather.WEATHER_STTS, "관측 대기")),
      pm10: asNumber(weather.PM10)
    },
    mobility: {
      roadTrafficLevel: trafficLevel,
      roadTrafficScore: trafficScore[trafficLevel] ?? fallbackSnapshot.mobility.roadTrafficScore,
      subwayLine: asString(subway.SUB_STN_LINE, fallbackSnapshot.mobility.subwayLine)
    },
    raw: payload
  };
}

export function getFallbackSeoulRealtime(areaName = DEFAULT_AREA): SeoulRealtimeSnapshot {
  return {
    ...fallbackSnapshot,
    areaName,
    updatedAt: new Date().toISOString()
  };
}

export async function fetchSeoulRealtime(areaName = DEFAULT_AREA): Promise<SeoulRealtimeSnapshot> {
  const key = process.env.SEOUL_OPEN_API_KEY?.trim();

  if (!key) {
    return getFallbackSeoulRealtime(areaName);
  }

  const encodedArea = encodeURIComponent(areaName);
  const endpoint = `http://openapi.seoul.go.kr:8088/${key}/json/citydata/1/5/${encodedArea}`;

  try {
    const response = await fetch(endpoint, {
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      return getFallbackSeoulRealtime(areaName);
    }

    const payload = (await response.json()) as unknown;
    const root = asObject(payload);

    const result = asObject(root.RESULT);
    const resultCode = asString(result["RESULT.CODE"], asString(result.CODE));

    if (!root.CITYDATA || (resultCode && resultCode !== "INFO-000")) {
      return getFallbackSeoulRealtime(areaName);
    }

    return parseCityData(payload, areaName);
  } catch {
    return getFallbackSeoulRealtime(areaName);
  }
}
