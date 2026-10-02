// ─── BỘ 9 TIÊU CHÍ ĐÁNH GIÁ ──────────────────────────────────────────────────
// Mỗi tiêu chí = 1 sheet trong file Excel.
//   gran      : kỳ dữ liệu của sheet → M = theo tháng, H = theo 6 tháng, Y = theo năm
//   dir       : chiều "tốt" →  1 = càng cao càng tốt, -1 = càng thấp càng tốt
//   unit      : đơn vị hiển thị ("%" sẽ được gắn vào số)
//   sheetKeys : từ khoá (không dấu, chữ thường) để nhận diện tên sheet
// → Muốn đổi tên / đơn vị / chiều đánh giá của 1 tiêu chí chỉ cần sửa tại đây.

export type Gran = "M" | "H" | "Y";

export interface MetricDef {
  key: string;
  label: string;
  short: string;
  full: string;
  icon: string;
  color: string;
  unit: string;
  gran: Gran;
  dir: 1 | -1;
  group: string;
  sheetKeys: string[];
}

export const METRICS: MetricDef[] = [
  {
    key: "exam", label: "Khám bệnh", short: "Khám bệnh",
    full: "Năng suất khám bệnh ngoại trú", icon: "◎", color: "#3B82F6",
    unit: "lượt", gran: "M", dir: 1, group: "Năng suất & kỹ năng mổ", sheetKeys: ["kham benh"],
  },
  {
    key: "auto", label: "Tự chủ phẫu thuật", short: "Tự chủ PT",
    full: "Tỷ lệ tự chủ phẫu thuật", icon: "✦", color: "#8B5CF6",
    unit: "", gran: "M", dir: 1, group: "Năng suất & kỹ năng mổ", sheetKeys: ["tu chu"],
  },
  {
    key: "join", label: "Tham gia phẫu thuật", short: "Tham gia PT",
    full: "Tỷ lệ tham gia phẫu thuật tại khoa", icon: "◈", color: "#06B6D4",
    unit: "", gran: "M", dir: 1, group: "Năng suất & kỹ năng mổ", sheetKeys: ["tham gia"],
  },
  {
    key: "hard", label: "Độ khó ca mổ", short: "Độ khó",
    full: "Phân loại độ khó ca mổ", icon: "⬡", color: "#F59E0B",
    unit: "", gran: "H", dir: 1, group: "Năng suất & kỹ năng mổ", sheetKeys: ["do kho"],
  },
  {
    key: "comp", label: "Biến chứng PT", short: "Biến chứng",
    full: "Tỷ lệ biến chứng phẫu thuật", icon: "▲", color: "#EF4444",
    unit: "%", gran: "H", dir: -1, group: "Chất lượng & an toàn", sheetKeys: ["bien chung"],
  },
  {
    key: "death", label: "Tử vong / mổ lại", short: "Tử vong/mổ lại",
    full: "Tỷ lệ tử vong hoặc tái phẫu thuật cấp cứu", icon: "✚", color: "#B91C1C",
    unit: "%", gran: "H", dir: -1, group: "Chất lượng & an toàn", sheetKeys: ["tu vong", "tai phau thuat"],
  },
  {
    key: "los", label: "Nằm viện sau mổ", short: "Nằm viện",
    full: "Thời gian nằm viện trung bình sau mổ", icon: "◷", color: "#0EA5E9",
    unit: "ngày", gran: "H", dir: -1, group: "Chất lượng & an toàn", sheetKeys: ["nam vien"],
  },
  {
    key: "sci", label: "NCKH & SKCT", short: "NCKH/SKCT",
    full: "Số lượng nghiên cứu khoa học & sáng kiến cải tiến", icon: "✎", color: "#EC4899",
    unit: "", gran: "Y", dir: 1, group: "Học thuật", sheetKeys: ["nckh", "skct", "nghien cuu", "sang kien"],
  },
  {
    key: "safe", label: "Tuân thủ an toàn PT", short: "An toàn PT",
    full: "Chỉ số tuân thủ quy trình an toàn phẫu thuật", icon: "✔", color: "#10B981",
    unit: "%", gran: "H", dir: 1, group: "Chất lượng & an toàn", sheetKeys: ["tuan thu", "an toan"],
  },
];

export const METRIC_BY_KEY: Record<string, MetricDef> = Object.fromEntries(METRICS.map((m) => [m.key, m]));
export const GRAN_LABEL: Record<Gran, string> = { M: "tháng", H: "6 tháng", Y: "năm" };
export const GRAN_LEN: Record<Gran, number> = { M: 1, H: 6, Y: 12 };
export const emptyMetrics = (): Record<string, Record<string, number>> =>
  Object.fromEntries(METRICS.map((m) => [m.key, {}]));
