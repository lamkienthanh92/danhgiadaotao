import { METRICS, GRAN_LEN } from "./metrics";
import type { MetricDef } from "./metrics";
import { parsePeriod } from "./parse";
import type { Staff } from "./parse";
import { T } from "../theme";
import type { Phase } from "../theme";

// ─── NGÀY THÁNG & GIAI ĐOẠN ───────────────────────────────────────────────────
export function parseDate(s?: string): Date | null {
  if (!s) return null;
  const p = s.split("/");
  if (p.length === 2) return new Date(+p[1], +p[0] - 1, 1);
  if (p.length === 3) return new Date(+p[2], +p[1] - 1, +p[0]);
  return null;
}
export function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}
// Kỳ kết thúc trước ngày vào lớp → before; kỳ bắt đầu sau ngày ra lớp → after; còn lại → during
export function getPhase(label: string, from: Date | null, to: Date | null): Phase {
  const { s, e } = parsePeriod(label);
  if (from && e < from) return "before";
  if (to && s > to) return "after";
  return "during";
}
export function getStatus(from?: string, to?: string): "completed" | "ongoing" | "upcoming" | "unknown" {
  const now = new Date();
  const f = parseDate(from);
  let t = parseDate(to);
  if (t) t = new Date(t.getFullYear(), t.getMonth() + 1, 0, 23, 59, 59); // hết tháng kết thúc
  if (!f) return "unknown";
  if (now < f) return "upcoming";
  if (!t || now <= t) return "ongoing";
  return "completed";
}

// ─── THỐNG KÊ CƠ BẢN ──────────────────────────────────────────────────────────
export const mean = (v: number[]): number | null => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);
export const avg = (v: number[]): number | null => {
  const m = mean(v);
  return m == null ? null : +m.toFixed(2);
};
export function pct(a: number | null, b: number | null): number | null {
  if (a == null || b == null || a === 0) return null;
  return Math.round(((b - a) / Math.abs(a)) * 100);
}

export interface PhaseStats {
  before: number | null;
  during: number | null;
  after: number | null;
  nBefore: number;
  nDuring: number;
  nAfter: number;
}
// Giai đoạn không có dữ liệu → null (số 0 là giá trị hợp lệ, vd. biến chứng = 0%)
export function phaseStats(monthly: Record<string, number>, from: Date | null, to: Date | null): PhaseStats {
  const b: number[] = [], d: number[] = [], a: number[] = [];
  Object.entries(monthly || {}).forEach(([label, v]) => {
    const ph = getPhase(label, from, to);
    (ph === "before" ? b : ph === "during" ? d : a).push(v);
  });
  return { before: avg(b), during: avg(d), after: avg(a), nBefore: b.length, nDuring: d.length, nAfter: a.length };
}

// Mức thay đổi đã quy đổi theo chiều "tốt" của tiêu chí: dương = tốt lên, âm = xấu đi (đơn vị: phân số, 0.1 = 10%)
export function effect(m: MetricDef, before: number | null, after: number | null): number | null {
  if (before == null || after == null) return null;
  if (before === 0) return after === 0 ? 0 : Math.sign((after - before) * m.dir);
  return (m.dir * (after - before)) / Math.abs(before);
}
export const meetsTarget = (m: MetricDef, value: number | null, target: number | null | undefined): boolean | null =>
  value == null || target == null ? null : m.dir >= 0 ? value >= target : value <= target;

export type StatusKey = "good" | "bad" | "flat" | "training" | "nodata" | "nobase";
export interface StatusInfo { key: StatusKey; text: string; color: string; bg: string }
export function statusOf(m: MetricDef, s: PhaseStats, th: number): StatusInfo {
  if (s.before == null && s.during == null && s.after == null)
    return { key: "nodata", text: "Chưa có dữ liệu", color: T.muted, bg: T.slateL };
  if (s.after == null)
    return s.during != null
      ? { key: "training", text: "Đang đào tạo", color: T.amber, bg: T.amberL }
      : { key: "training", text: "Chưa có mốc sau", color: T.amber, bg: T.amberL };
  if (s.before == null) return { key: "nobase", text: "Thiếu mốc trước", color: T.slate, bg: T.slateL };
  const e = effect(m, s.before, s.after) as number;
  if (e > th) return { key: "good", text: "Cải thiện", color: T.teal, bg: T.tealL };
  if (e < -th) return { key: "bad", text: "Giảm sút", color: T.red, bg: T.redL };
  return { key: "flat", text: "Ổn định", color: T.blue, bg: T.blueL };
}

// ─── XU HƯỚNG ─────────────────────────────────────────────────────────────────
export function slope(ys: number[]): number {
  const n = ys.length;
  if (n < 2) return 0;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  ys.forEach((y, i) => { sx += i; sy += y; sxy += i * y; sxx += i * i; });
  const den = n * sxx - sx * sx;
  return den === 0 ? 0 : (n * sxy - sx * sy) / den;
}
export interface TrendInfo { arrow: string; text: string; good: boolean | null; rel: number }
export function trendLabel(m: MetricDef, ys: number[]): TrendInfo | null {
  if (ys.length < 3) return null;
  const mu = mean(ys.map(Math.abs)) || 0;
  const rel = mu ? (slope(ys) * (ys.length - 1)) / mu : 0;
  if (Math.abs(rel) < 0.1) return { arrow: "→", text: "đi ngang", good: null, rel };
  const up = rel > 0;
  return { arrow: up ? "↗" : "↘", text: up ? "tăng" : "giảm", good: up ? m.dir > 0 : m.dir < 0, rel };
}
export function movingAvg(vals: (number | null)[], w: number): (number | null)[] {
  return vals.map((v, i) => {
    if (v == null) return null;
    const win = vals.slice(Math.max(0, i - w + 1), i + 1).filter((x) => x != null) as number[];
    return +(win.reduce((a, b) => a + b, 0) / win.length).toFixed(2);
  });
}
export function trendLine(vals: (number | null)[]): (number | null)[] {
  const pts = vals.map((v, i) => [i, v] as [number, number | null]).filter((p) => p[1] != null) as [number, number][];
  if (pts.length < 2) return vals.map(() => null);
  const n = pts.length;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  pts.forEach(([x, y]) => { sx += x; sy += y; sxy += x * y; sxx += x * x; });
  const b = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const a = (sy - b * sx) / n;
  return vals.map((v, i) => (v == null ? null : +(a + b * i).toFixed(2)));
}

// ─── CHUỖI ĐIỂM THEO THỜI GIAN ────────────────────────────────────────────────
export type AxisMode = "aligned" | "calendar";
export interface Pt { x: string; sort: number; v: number; phase?: Phase }

export const relLabel = (rel: number): string => (rel === 0 ? "T0" : rel > 0 ? `T+${rel}` : `T${rel}`);

// aligned  : trục X = số tháng so với T0 (tháng bắt đầu đào tạo) → so sánh được giữa các khoá khác nhau
// calendar : trục X = kỳ theo lịch
export function staffPoints(d: Staff, key: string, mode: AxisMode): Pt[] {
  const from = parseDate(d.from), to = parseDate(d.to);
  const mon = d.metrics[key] || {};
  return Object.keys(mon)
    .map((label) => {
      const { s } = parsePeriod(label);
      const phase = getPhase(label, from, to);
      if (mode === "aligned" && from) {
        const rel = monthsBetween(from, s);
        return { x: relLabel(rel), sort: rel, v: mon[label], phase };
      }
      return { x: label, sort: s.getTime(), v: mon[label], phase };
    })
    .sort((a, b) => a.sort - b.sort);
}
export function phaseByRel(rel: number, len: number, dur: number): Phase {
  if (rel + len - 1 < 0) return "before";
  if (rel > dur) return "after";
  return "during";
}
// Trung bình theo từng kỳ của nhiều nhân viên
export function meanSeries(list: Staff[], m: MetricDef, mode: AxisMode): Pt[] {
  if (!list.length) return [];
  if (list.length === 1) return staffPoints(list[0], m.key, mode);
  const bucket = new Map<number, { x: string; vals: number[] }>();
  list.forEach((d) =>
    staffPoints(d, m.key, mode).forEach((p) => {
      const b = bucket.get(p.sort) || { x: p.x, vals: [] };
      b.vals.push(p.v);
      bucket.set(p.sort, b);
    })
  );
  const ref = list.map((d) => ({ f: parseDate(d.from), t: parseDate(d.to) })).find((x) => x.f && x.t);
  const dur = ref ? monthsBetween(ref.f as Date, ref.t as Date) : 23;
  return [...bucket.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([sort, b]) => ({
      x: b.x,
      sort,
      v: +(mean(b.vals) as number).toFixed(2),
      phase: mode === "aligned" ? phaseByRel(sort, GRAN_LEN[m.gran], dur) : undefined,
    }));
}
// Gộp nhiều chuỗi thành các dòng cho biểu đồ: { x, sort, [key]: giá trị, __phase }
export function buildRows(entries: { key: string; pts: Pt[] }[], opts: { phase: boolean } = { phase: true }): any[] {
  const map = new Map<number, any>();
  entries.forEach((e) =>
    e.pts.forEach((p) => {
      let r = map.get(p.sort);
      if (!r) { r = { x: p.x, sort: p.sort }; map.set(p.sort, r); }
      r[e.key] = p.v;
      if (opts.phase && p.phase && !r.__phase) r.__phase = p.phase;
    })
  );
  return [...map.values()].sort((a, b) => a.sort - b.sort);
}

// ─── TỔNG HỢP ─────────────────────────────────────────────────────────────────
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export interface SummaryRow {
  m: MetricDef;
  s: PhaseStats;
  pctDuring: number | null;
  pctAfter: number | null;
  eff: number | null;
  status: StatusInfo;
  trend: TrendInfo | null;
  spark: number[];
}
export interface StaffSummary { rows: SummaryRow[]; up: number; down: number; n: number; score: number | null }

export function staffSummary(d: Staff, th: number): StaffSummary {
  const from = parseDate(d.from), to = parseDate(d.to);
  const rows: SummaryRow[] = METRICS.map((m) => {
    const s = phaseStats(d.metrics[m.key], from, to);
    const pts = staffPoints(d, m.key, "calendar");
    return {
      m, s,
      pctDuring: pct(s.before, s.during),
      pctAfter: pct(s.before, s.after),
      eff: effect(m, s.before, s.after),
      status: statusOf(m, s, th),
      trend: trendLabel(m, pts.filter((p) => p.phase === "after").map((p) => p.v)),
      spark: pts.map((p) => p.v),
    };
  });
  const withEff = rows.filter((r) => r.eff != null);
  const up = withEff.filter((r) => (r.eff as number) > th).length;
  const down = withEff.filter((r) => (r.eff as number) < -th).length;
  const score = withEff.length ? (mean(withEff.map((r) => clamp(r.eff as number, -1, 1))) as number) * 100 : null;
  return { rows, up, down, n: withEff.length, score };
}

export function metricAggregate(list: Staff[], m: MetricDef) {
  const b: number[] = [], a: number[] = [], e: number[] = [];
  list.forEach((d) => {
    const s = phaseStats(d.metrics[m.key], parseDate(d.from), parseDate(d.to));
    if (s.before != null && s.after != null) {
      b.push(s.before); a.push(s.after);
      const ef = effect(m, s.before, s.after);
      if (ef != null) e.push(clamp(ef, -1, 1));
    }
  });
  return { n: b.length, before: avg(b), after: avg(a), eff: mean(e) };
}

export function completeness(list: Staff[], key?: string) {
  let filled = 0, slots = 0;
  list.forEach((d) =>
    METRICS.forEach((m) => {
      if (key && m.key !== key) return;
      filled += Object.keys(d.metrics[m.key] || {}).length;
      slots += d.slots?.[m.key] || 0;
    })
  );
  return { filled, slots, ratio: slots ? filled / slots : null };
}
