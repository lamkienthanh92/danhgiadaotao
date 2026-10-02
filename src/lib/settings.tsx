import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AxisMode } from "./stats";

export interface ChartPrefs {
  type: "line" | "area" | "bar";
  smooth: boolean;
  dots: boolean;
  labels: boolean;
  bands: boolean;
  phaseAvg: boolean;
  trend: boolean;
  target: boolean;
  brush: boolean;
  ma: 0 | 3 | 6;
  palette: string;
  size: "S" | "M" | "L";
  axis: AxisMode;
}
export interface Settings {
  threshold: number; // % — ngưỡng coi là "cải thiện / giảm sút"
  chart: ChartPrefs;
  targets: Record<string, number | null>; // mục tiêu theo từng tiêu chí
}

export const DEFAULT_CHART: ChartPrefs = {
  type: "line", smooth: true, dots: true, labels: false, bands: true, phaseAvg: false,
  trend: false, target: true, brush: false, ma: 0, palette: "default", size: "M", axis: "aligned",
};
const DEFAULTS: Settings = { threshold: 10, chart: DEFAULT_CHART, targets: {} };
const KEY = "bs-ngoai-dashboard-settings-v1";

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        threshold: typeof p.threshold === "number" ? p.threshold : DEFAULTS.threshold,
        chart: { ...DEFAULT_CHART, ...(p.chart || {}) },
        targets: { ...(p.targets || {}) },
      };
    }
  } catch {
    /* bỏ qua: trình duyệt chặn localStorage */
  }
  return DEFAULTS;
}

interface Ctx {
  settings: Settings;
  setChart: (p: Partial<ChartPrefs>) => void;
  resetChart: () => void;
  setThreshold: (n: number) => void;
  setTarget: (key: string, v: number | null) => void;
  resetAll: () => void;
}
const SettingsCtx = createContext<Ctx>(null as any);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* ignore */ }
  }, [settings]);
  const value = useMemo<Ctx>(
    () => ({
      settings,
      setChart: (p) => setSettings((s) => ({ ...s, chart: { ...s.chart, ...p } })),
      resetChart: () => setSettings((s) => ({ ...s, chart: DEFAULT_CHART })),
      setThreshold: (n) => setSettings((s) => ({ ...s, threshold: n })),
      setTarget: (key, v) => setSettings((s) => ({ ...s, targets: { ...s.targets, [key]: v } })),
      resetAll: () => setSettings(DEFAULTS),
    }),
    [settings]
  );
  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}
export const useSettings = () => useContext(SettingsCtx);
