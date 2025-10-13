import useSWR from "swr";
import { getTruthPanel, getMoneyPanel, getMotionPanel } from "@/lib/api/panels";
import type { TruthPanel, MoneyPanel, MotionPanel } from "@/types/panels";

const swrFetcher = <T>(fn: () => Promise<{ data: T }>) =>
  fn().then((r) => r.data);

export function useTruthPanel(dealId: string, enabled = true) {
  return useSWR<TruthPanel>(
    enabled && dealId ? ["truth", dealId] : null,
    () => swrFetcher(() => getTruthPanel(dealId)),
    { refreshInterval: 15000, revalidateOnFocus: false }
  );
}

export function useMoneyPanel(dealId: string, enabled = true) {
  return useSWR<MoneyPanel>(
    enabled && dealId ? ["money", dealId] : null,
    () => swrFetcher(() => getMoneyPanel(dealId)),
    { refreshInterval: 15000, revalidateOnFocus: false }
  );
}

export function useMotionPanel(dealId: string, enabled = true) {
  return useSWR<MotionPanel>(
    enabled && dealId ? ["motion", dealId] : null,
    () => swrFetcher(() => getMotionPanel(dealId)),
    { refreshInterval: 15000, revalidateOnFocus: false }
  );
}