const MIROFISH_BACKEND_URL =
  process.env.MIROFISH_BACKEND_INTERNAL_URL ?? process.env.MIROFISH_BACKEND_URL;

export function getMiroFishBackendUrl() {
  if (!MIROFISH_BACKEND_URL) {
    throw new Error("MIROFISH_BACKEND_URL is not configured");
  }

  return MIROFISH_BACKEND_URL.replace(/\/$/, "");
}

export async function fetchMiroFish(
  path: string,
  init?: RequestInit
) {
  const baseUrl = getMiroFishBackendUrl();
  return fetch(`${baseUrl}${path}`, init);
}

