import { useMemo, useState } from "react";
import type { Staff } from "../lib/parse";
import { METRICS, METRIC_BY_KEY } from "../lib/metrics";
import { getStatus, metricAggregate, meanSeries, staffPoints, buildRows, completeness, pct, meetsTarget } from "../lib/stats";
import type { Pt } from "../lib/stats";
import { hospitalInsights } from "../lib/insights";
import { fmt, shortName } from "../lib/format";
import { useSettings } from "../lib/settings";
import { useIsMobile } from "../hooks/useIsMobile";
import { T } from "../theme";
import { Bullets, Card, Delta, KpiCards, SectionTitle, Seg, Sparkline } from "../components/ui";
import { MetricChart } from "../components/MetricChart";
import { Heatmap } from "../components/Heatmap";

export function OverviewView({ staff, onOpen }: { staff: Record<string, Staff>; onOpen: (id: string, key?: string) => void }) {
  const { settings } = useSettings();
  const th = settings.threshold / 100;
  const axis = settings.chart.axis;
  const mob = useIsMobile();
  const all = useMemo(() => Object.values(staff), [staff]);
  const depts = useMemo(() => [...new Set(all.map((d) => d.dept))], [all]);
  const [sel, setSel] = useState("exam");
  const [group, setGroup] = useState<"all" | "dept" | "staff">("all");

  const completed = all.filter((d) => getStatus(d.from, d.to) === "completed").length;
  const ongoing = all.filter((d) => getStatus(d.from, d.to) === "ongoing").length;
  const comp = useMemo(() => completeness(all), [all]);

  const aggs = useMemo(
    () =>
      METRICS.map((m) => ({
        m,
        agg: metricAggregate(all, m),
        comp: completeness(all, m.key),
        spark: meanSeries(all.filter((d) => Object.keys(d.metrics[m.key] || {}).length), m, "aligned").map((p) => p.v),
      })),
    [all]
  );

  const metric = METRIC_BY_KEY[sel];
  const { rows, series } = useMemo(() => {
    const withData = all.filter((d) => Object.keys(d.metrics[sel] || {}).length);
    let entries: { name: string; pts: Pt[] }[] = [];
    if (group === "all") entries = [{ name: "TB toàn viện", pts: meanSeries(withData, metric, axis) }];
    else if (group === "dept")
      entries = depts.map((dp) => ({ name: dp.replace("Khoa ", ""), pts: meanSeries(withData.filter((d) => d.dept === dp), metric, axis) }));
    else entries = withData.map((d) => ({ name: shortName(d.name), pts: staffPoints(d, sel, axis) }));
    entries = entries.filter((e) => e.pts.length);
    const keyed = entries.map((e, i) => ({ ...e, key: `s${i}` }));
    return {
      rows: buildRows(keyed, { phase: axis === "aligned" || keyed.length === 1 }),
      series: keyed.map((e) => ({ key: e.key, name: e.name })),
    };
  }, [all, depts, sel, group, axis, metric]);

  const insights = useMemo(() => hospitalInsights(all, th), [all, th]);

  return (
    <div>
      <KpiCards
        items={[
          { label: "Tổng nhân viên", value: all.length, sub: `${depts.length} khoa phòng`, accent: T.blue },
          { label: "Đã hoàn thành", value: completed, color: T.teal, sub: "Đã ra lớp", accent: T.teal },
          { label: "Đang đào tạo", value: ongoing, color: T.amber, sub: "Chờ kết thúc khoá", accent: T.amber },
          { label: "Đầy đủ dữ liệu", value: comp.ratio == null ? "–" : `${Math.round(comp.ratio * 100)}%`, color: comp.ratio != null && comp.ratio < 0.5 ? T.red : T.text, sub: `${comp.filled}/${comp.slots} kỳ có số liệu`, accent: T.slate },
        ]}
      />

      <SectionTitle sub="Trung bình các nhân viên có đủ dữ liệu trước & sau đào tạo. Bấm một thẻ để xem biểu đồ chi tiết bên dưới.">
        Bảng điểm 9 tiêu chí
      </SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill,minmax(${mob ? 150 : 215}px,1fr))`, gap: mob ? 8 : 12, marginBottom: 18 }}>
        {aggs.map(({ m, agg, comp: cp, spark }) => {
          const on = sel === m.key;
          const target = settings.targets[m.key];
          const ok = meetsTarget(m, agg.after, target);
          return (
            <div
              key={m.key}
              onClick={() => setSel(m.key)}
              style={{ background: T.white, border: `1.5px solid ${on ? m.color : T.border}`, boxShadow: on ? `0 0 0 3px ${m.color}22` : "none", borderRadius: 12, padding: mob ? "10px 12px" : "14px 16px", cursor: "pointer", position: "relative", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: m.color }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 6 }}>
                <span style={{ color: m.color }}>{m.icon}</span> {m.label}
                {m.dir < 0 && <span style={{ color: T.muted, fontWeight: 400 }}> ↓</span>}
              </div>
              {agg.n ? (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, color: T.muted, fontVariantNumeric: "tabular-nums" }}>{fmt(agg.before)}</span>
                    <span style={{ color: T.muted }}>→</span>
                    <span style={{ fontSize: mob ? 18 : 22, fontWeight: 800, color: T.text, fontVariantNumeric: "tabular-nums" }}>{fmt(agg.after)}{m.unit === "%" ? "%" : ""}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, gap: 6 }}>
                    <Delta val={pct(agg.before, agg.after)} dir={m.dir} />
                    <Sparkline values={spark} color={m.color} w={mob ? 56 : 72} />
                  </div>
                  <div style={{ fontSize: 10.5, color: T.muted, marginTop: 6 }}>
                    {agg.n} NV
                    {target != null && ok != null && <span style={{ color: ok ? T.teal : T.red, fontWeight: 700 }}> · {ok ? "✓ đạt" : "✗ chưa đạt"} mục tiêu</span>}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
                  {cp.filled ? "Chưa đủ dữ liệu trước & sau để so sánh" : "Chưa có số liệu"}
                  <div style={{ marginTop: 6 }}><Sparkline values={spark} color={m.color} w={72} /></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <MetricChart
        metric={metric}
        rows={rows}
        series={series}
        filename={`xu-huong-${metric.key}.png`}
        title={`Xu hướng: ${metric.full}`}
        subtitle="Giá trị trung bình mỗi nhân viên tại từng kỳ"
        actions={
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Seg value={group} onChange={setGroup} options={[{ value: "all", label: "Toàn viện" }, { value: "dept", label: "Theo khoa" }, { value: "staff", label: "Từng nhân viên" }]} />
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 16, margin: "16px 0" }}>
        <Card style={{ padding: mob ? 14 : 20 }}>
          <SectionTitle sub="Tự động tổng hợp từ dữ liệu đang xem">Nhận định nhanh</SectionTitle>
          <Bullets items={insights} />
        </Card>
        <Card style={{ padding: mob ? 14 : 20 }}>
          <SectionTitle sub="Số kỳ có số liệu / số kỳ file dành cho từng tiêu chí">Mức đầy đủ dữ liệu theo tiêu chí</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {aggs.map(({ m, comp: cp }) => {
              const r = cp.ratio == null ? 0 : cp.ratio;
              return (
                <div key={m.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                    <span style={{ color: T.text, fontWeight: 600 }}>{m.icon} {m.label}</span>
                    <span style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>{cp.filled}/{cp.slots} · {Math.round(r * 100)}%</span>
                  </div>
                  <div style={{ background: T.slateL, borderRadius: 5, height: 7, overflow: "hidden" }}>
                    <div style={{ width: `${r * 100}%`, height: "100%", background: r < 0.3 ? T.red : r < 0.8 ? T.amber : T.teal }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Heatmap staff={all} th={th} onPick={onOpen} />
    </div>
  );
}
