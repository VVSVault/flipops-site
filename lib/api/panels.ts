import type { TruthPanel, MoneyPanel, MotionPanel } from "@/types/panels";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<{ data: T; etag?: string }> {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init?.headers || {}), Accept: "application/json" },
    cache: "no-store", // panels are small; we rely on server ETag
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  const etag = res.headers.get("ETag") || undefined;
  const data = (await res.json()) as T;
  return { data, etag };
}

export async function getTruthPanel(dealId: string) {
  return fetchJSON<TruthPanel>(`/api/panels/truth?dealId=${encodeURIComponent(dealId)}`);
}

export async function getMoneyPanel(dealId: string) {
  return fetchJSON<MoneyPanel>(`/api/panels/money?dealId=${encodeURIComponent(dealId)}`);
}

export async function getMotionPanel(dealId: string) {
  return fetchJSON<MotionPanel>(`/api/panels/motion?dealId=${encodeURIComponent(dealId)}`);
}