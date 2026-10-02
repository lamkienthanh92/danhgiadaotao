export const T = {
  navy: "#0B1E35",
  blue: "#1A6BC4",
  blueL: "#EBF3FD",
  teal: "#0D8E7A",
  tealL: "#E3F5F2",
  amber: "#D97706",
  amberL: "#FEF3E2",
  red: "#DC2626",
  redL: "#FEE8E8",
  slate: "#64748B",
  slateL: "#F1F5F9",
  border: "#E2E8F0",
  bg: "#F7F9FC",
  white: "#FFFFFF",
  text: "#1E293B",
  muted: "#94A3B8",
};

export type Phase = "before" | "during" | "after";
export const PHASES: Phase[] = ["before", "during", "after"];
export const PC: Record<Phase, string> = { before: "#3B82F6", during: "#F59E0B", after: "#10B981" };
export const PL: Record<Phase, string> = { before: "#EFF6FF", during: "#FFFBEB", after: "#ECFDF5" };
export const PT: Record<Phase, string> = { before: "#1D4ED8", during: "#B45309", after: "#065F46" };
export const BAND: Record<Phase, string> = {
  before: "rgba(59,130,246,0.07)",
  during: "rgba(245,158,11,0.12)",
  after: "rgba(16,185,129,0.08)",
};
export const PHASE_SHORT: Record<Phase, string> = { before: "Trước", during: "Trong", after: "Sau" };
export const PHASE_LONG: Record<Phase, string> = {
  before: "Trước đào tạo",
  during: "Trong đào tạo",
  after: "Sau đào tạo",
};

export const PALETTES: Record<string, { name: string; colors: string[] }> = {
  default: {
    name: "Mặc định",
    colors: ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#EC4899", "#84CC16"],
  },
  soft: {
    name: "Dịu mắt",
    colors: ["#6C8EBF", "#82B366", "#D6B656", "#9673A6", "#B85450", "#5FA8A8", "#C77DA5", "#A3B86C"],
  },
  contrast: {
    name: "Tương phản cao",
    colors: ["#0000CC", "#008000", "#FF8C00", "#800080", "#D00000", "#008B8B", "#C71585", "#4B5320"],
  },
  mono: {
    name: "Xanh đơn sắc",
    colors: ["#0B3C7A", "#1A6BC4", "#4F9BE0", "#8DBFF0", "#0D8E7A", "#3FB5A2", "#7AD3C4", "#B5E6DD"],
  },
};

export const SIZES = { S: 220, M: 300, L: 420 };
