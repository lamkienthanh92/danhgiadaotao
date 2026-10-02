import type { MetricDef } from "./metrics";

export const fmt = (v: any, max = 1): string =>
  v == null || isNaN(v) ? "–" : Number(v).toLocaleString("vi-VN", { maximumFractionDigits: max });
export const withUnit = (v: any, m: MetricDef): string => (v == null ? "–" : `${fmt(v)}${m.unit === "%" ? "%" : ""}`);
export const signPct = (p: number | null): string => (p == null ? "–" : `${p > 0 ? "+" : ""}${p}%`);
export const shortName = (n: string): string => n.split(" ").slice(-2).join(" ");
