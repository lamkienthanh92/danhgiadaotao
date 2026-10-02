import { METRICS, emptyMetrics } from "./metrics";

// ─── ĐỌC DỮ LIỆU TỪ CÁC SHEET (hàm thuần, không phụ thuộc thư viện Excel) ───────
// Mỗi sheet có cấu trúc:
//  - dòng tiêu đề, dòng header (Mã NV, Xưng hô, Họ tên, Khoa, Tên lớp, Từ ngày, Đến ngày, ...)
//  - dòng "mốc thời gian": 7 cột đầu trống, từ cột 8 là các kỳ
//      · ô ngày                      → theo tháng   → "09/2019"
//      · text "09/2019-02/2020"      → theo 6 tháng
//      · text "09/2019-08/2020"      → theo năm
//  - các dòng nhân viên ngay bên dưới; một sheet có thể có nhiều block như vậy

export interface Staff {
  id: string;
  title: string;
  name: string;
  dept: string;
  specialty: string;
  from: string; // "MM/YYYY"
  to: string; // "MM/YYYY"
  metrics: Record<string, Record<string, number>>; // metricKey → { nhãn kỳ → giá trị }
  slots: Record<string, number>; // metricKey → số kỳ (cột) mà file dành cho NV này
}

export interface ParseResult {
  staff: Record<string, Staff>;
  found: number;
  missing: string[];
  empty: string[];
  sheetMap: Record<string, string>;
}

export function norm(s: any): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}
const pad2 = (n: number) => String(n).padStart(2, "0");

export function toDateAny(v: any): Date | null {
  if (v instanceof Date && !isNaN(v.getTime())) return new Date(v.getFullYear(), v.getMonth(), v.getDate());
  if (typeof v === "number" && v > 20000 && v < 80000) {
    // Excel serial → Date (25569 = 01/01/1970)
    const u = new Date(Math.round((v - 25569) * 86400000));
    return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate());
  }
  return null;
}

export function periodLabel(v: any): string | null {
  const d = toDateAny(v);
  if (d) return `${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
  if (typeof v === "string") {
    const ms = [...v.matchAll(/(\d{1,2})\s*\/\s*(\d{4})/g)];
    if (ms.length === 1) return `${pad2(+ms[0][1])}/${ms[0][2]}`;
    if (ms.length >= 2) return `${pad2(+ms[0][1])}/${ms[0][2]}-${pad2(+ms[1][1])}/${ms[1][2]}`;
  }
  return null;
}

// Nhãn kỳ → { s: đầu kỳ, e: cuối kỳ } (đều là ngày 1 của tháng)
export function parsePeriod(label: string): { s: Date; e: Date } {
  const ms = [...String(label).matchAll(/(\d{2})\/(\d{4})/g)];
  if (!ms.length) return { s: new Date(0), e: new Date(0) };
  const s = new Date(+ms[0][2], +ms[0][1] - 1, 1);
  const e = ms[1] ? new Date(+ms[1][2], +ms[1][1] - 1, 1) : s;
  return { s, e };
}

function fmtDateSlash(v: any): string {
  const d = toDateAny(v);
  if (d) return `${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
  return periodLabel(v) || "";
}

export function parseSheetRows(rows: any[][]) {
  const map: Record<string, any> = {};
  let currentPeriods: (string | null)[] = [];

  for (const row of rows) {
    if (!row || row.every((v) => v == null || v === "")) continue;

    const isPeriodRow =
      row.slice(0, 7).every((v) => v == null || v === "") && row[7] != null && periodLabel(row[7]) !== null;
    if (isPeriodRow) {
      currentPeriods = [];
      for (let ci = 7; ci < row.length; ci++) currentPeriods.push(row[ci] != null ? periodLabel(row[ci]) : null);
      continue;
    }

    const id = row[0];
    if (!id || typeof id !== "string" || !id.trim()) continue;
    if (norm(id) === "ma nhan vien") continue;
    if (!row[2] || !String(row[2]).trim()) continue; // dòng tiêu đề / dòng rác: phải có Họ tên

    const staffId = id.trim();
    if (!map[staffId]) {
      map[staffId] = {
        id: staffId,
        title: String(row[1] || "").trim(),
        name: String(row[2] || "").trim(),
        dept: String(row[3] || "").trim(),
        specialty: String(row[4] || "").trim(),
        from: fmtDateSlash(row[5]),
        to: fmtDateSlash(row[6]),
        monthly: {},
        slots: currentPeriods.filter(Boolean).length,
      };
    }
    for (let ci = 7; ci < row.length; ci++) {
      const key = currentPeriods[ci - 7];
      const val = row[ci];
      if (key && val != null && val !== "" && !isNaN(Number(val))) map[staffId].monthly[key] = Number(val);
    }
  }
  return map;
}

export function parseWorkbook(sheets: Record<string, any[][]>): ParseResult {
  const names = Object.keys(sheets);
  const sheetMap: Record<string, string> = {};
  const used = new Set<string>();
  METRICS.forEach((m) => {
    const name = names.find((n) => !used.has(n) && m.sheetKeys.some((k) => norm(n).includes(k)));
    if (name) {
      sheetMap[m.key] = name;
      used.add(name);
    }
  });
  if (!Object.keys(sheetMap).length)
    throw new Error(
      "Không tìm thấy sheet phù hợp. File cần có các sheet như 'Số lượt khám bệnh', 'Tỷ lệ tự chủ phẫu thuật', 'Tỷ lệ biến chứng phẫu thuật', ..."
    );

  const staff: Record<string, Staff> = {};
  Object.entries(sheetMap).forEach(([metricKey, sheetName]) => {
    const inSheet = parseSheetRows(sheets[sheetName]);
    Object.values<any>(inSheet).forEach((info) => {
      if (!staff[info.id]) {
        staff[info.id] = {
          id: info.id, title: info.title, name: info.name, dept: info.dept, specialty: info.specialty,
          from: info.from, to: info.to, metrics: emptyMetrics(), slots: {},
        };
      }
      staff[info.id].metrics[metricKey] = info.monthly;
      staff[info.id].slots[metricKey] = info.slots;
      if (!staff[info.id].from && info.from) staff[info.id].from = info.from;
      if (!staff[info.id].to && info.to) staff[info.id].to = info.to;
    });
  });
  if (!Object.keys(staff).length) throw new Error("Không đọc được dữ liệu nhân viên nào từ file.");

  const list = Object.values(staff);
  const found = METRICS.filter((m) => sheetMap[m.key]);
  return {
    staff,
    found: found.length,
    missing: METRICS.filter((m) => !sheetMap[m.key]).map((m) => m.full),
    empty: found.filter((m) => !list.some((s) => Object.keys(s.metrics[m.key]).length)).map((m) => m.full),
    sheetMap,
  };
}
