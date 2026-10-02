import { METRICS } from "./metrics";
import type { Staff } from "./parse";
import { staffSummary, metricAggregate, completeness, meetsTarget } from "./stats";
import type { StaffSummary } from "./stats";
import { fmt, signPct } from "./format";

type Targets = Record<string, number | null | undefined>;

export function staffInsights(sum: StaffSummary, targets: Targets, th: number): string[] {
  const out: string[] = [];
  const withEff = sum.rows.filter((r) => r.eff != null);
  if (!withEff.length) {
    out.push("Chưa đủ dữ liệu trước và sau đào tạo để so sánh — cần có số liệu ở cả hai mốc.");
  } else {
    out.push(
      `${sum.up}/${sum.n} tiêu chí cải thiện, ${sum.down} giảm sút, ${sum.n - sum.up - sum.down} ổn định (ngưỡng ±${Math.round(th * 100)}%).`
    );
    const sorted = [...withEff].sort((a, b) => (b.eff as number) - (a.eff as number));
    const best = sorted[0], worst = sorted[sorted.length - 1];
    if ((best.eff as number) > th)
      out.push(`Cải thiện rõ nhất: ${best.m.full} (${fmt(best.s.before)} → ${fmt(best.s.after)}, ${signPct(best.pctAfter)}).`);
    if ((worst.eff as number) < -th)
      out.push(`Cần chú ý: ${worst.m.full} (${fmt(worst.s.before)} → ${fmt(worst.s.after)}, ${signPct(worst.pctAfter)}).`);
  }
  sum.rows
    .filter((r) => r.trend && r.trend.good === false)
    .forEach((r) => out.push(`Sau đào tạo, "${r.m.label}" đang có xu hướng ${r.trend!.text} theo chiều bất lợi.`));
  const miss = sum.rows.filter((r) => r.status.key === "nodata").map((r) => r.m.label);
  if (miss.length) out.push(`Chưa có số liệu: ${miss.join(", ")}.`);
  const unmet = sum.rows.filter((r) => meetsTarget(r.m, r.s.after, targets[r.m.key]) === false).map((r) => r.m.label);
  if (unmet.length) out.push(`Chưa đạt mục tiêu đặt ra: ${unmet.join(", ")}.`);
  return out;
}

export function hospitalInsights(all: Staff[], th: number): string[] {
  const out: string[] = [];
  const aggs = METRICS.map((m) => ({ m, a: metricAggregate(all, m) })).filter((x) => x.a.n > 0 && x.a.eff != null);
  if (!aggs.length) {
    out.push("Chưa có tiêu chí nào đủ dữ liệu trước/sau đào tạo để tổng hợp.");
  } else {
    aggs.sort((x, y) => (y.a.eff as number) - (x.a.eff as number));
    const best = aggs[0], worst = aggs[aggs.length - 1];
    out.push(
      `Tiêu chí cải thiện nhiều nhất: ${best.m.full} (${fmt(best.a.before)} → ${fmt(best.a.after)}, trung bình ${signPct(Math.round((best.a.eff as number) * 100))}, ${best.a.n} NV).`
    );
    if (worst !== best && (worst.a.eff as number) < 0)
      out.push(
        `Tiêu chí kém đi nhiều nhất: ${worst.m.full} (${fmt(worst.a.before)} → ${fmt(worst.a.after)}, ${signPct(Math.round((worst.a.eff as number) * 100))}, ${worst.a.n} NV).`
      );
  }
  const watch = all
    .map((d) => ({ d, s: staffSummary(d, th) }))
    .filter((x) => x.s.n > 0 && x.s.down > x.s.up)
    .map((x) => x.d.name);
  if (watch.length) out.push(`Cần theo dõi (nhiều tiêu chí giảm hơn tăng): ${watch.join(", ")}.`);
  const c = completeness(all);
  if (c.ratio != null) out.push(`Mức đầy đủ dữ liệu toàn viện: ${Math.round(c.ratio * 100)}% (${c.filled}/${c.slots} kỳ có số liệu).`);
  const empty = METRICS.filter((m) => completeness(all, m.key).filled === 0).map((m) => m.label);
  if (empty.length) out.push(`Tiêu chí chưa có số liệu nào: ${empty.join(", ")}.`);
  return out;
}
