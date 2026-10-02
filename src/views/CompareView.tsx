import { useMemo, useState } from "react";
import type { Staff } from "../lib/parse";
import { METRICS, METRIC_BY_KEY } from "../lib/metrics";
import { buildRows, effect, meanSeries, parseDate, pct, phaseStats, staffPoints } from "../lib/stats";
import { fmt, shortName, signPct, withUnit } from "../lib/format";
import { useSettings } from "../lib/settings";
import { useIsMobile } from "../hooks/useIsMobile";
import { T, PT } from "../theme";
import { Card, Chip, Delta, MetricPills, SectionTitle, Toggle } from "../components/ui";
import { MetricChart } from "../components/MetricChart";

// So sánh nhiều nhân viên trên cùng một tiêu chí, căn theo T0 để các khoá khác nhau so được với nhau
export function CompareView({ staff }: { staff: Record<string, Staff> }) {
  const { settings } = useSettings();
  const axis = settings.chart.axis;
  const mob = useIsMobile();
  const all = useMemo(() => Object.values(staff), [staff]);
  const [sel, setSel] = useState("exam");
  const [ids, setIds] = useState<string[] | null>(null);
  const [showAvg, setShowAvg] = useState(true);
  const metric = METRIC_BY_KEY[sel];

  const picked = useMemo(() => {
    const base = ids ?? all.slice(0, 4).map((d) => d.id);
    return base.filter((id) => staff[id]).map((id) => staff[id]);
  }, [ids, all, staff]);

  const toggle = (id: string) => {
    const cur = picked.map((d) => d.id);
    setIds(cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 8 ? cur : [...cur, id]);
  };

  const { rows, series } = useMemo(() => {
    const entries: { key: string; name: string; pts: any[]; color?: string }[] = picked.map((d, i) => ({ key: `s${i}`, name: shortName(d.name), pts: staffPoints(d, sel, axis) }));
    if (showAvg) {
      const withData = all.filter((d) => Object.keys(d.metrics[sel] || {}).length);
      entries.push({ key: "avg", name: "TB toàn viện", pts: meanSeries(withData, metric, axis), color: T.slate });
    }
    const ok = entries.filter((e) => e.pts.length);
    return {
      rows: buildRows(ok, { phase: axis === "aligned" }),
      series: ok.map((e) => ({ key: e.key, name: e.name, color: e.color })),
    };
  }, [picked, sel, axis, showAvg, all, metric]);

  const table = useMemo(
    () =>
      picked
        .map((d) => {
          const s = phaseStats(d.metrics[sel], parseDate(d.from), parseDate(d.to));
          return { d, s, eff: effect(metric, s.before, s.after) };
        })
        .sort((a, b) => (b.eff ?? -9) - (a.eff ?? -9)),
    [picked, sel, metric]
  );

  return (
    <div>
      <Card style={{ padding: mob ? 14 : 20, marginBottom: 16 }}>
        <SectionTitle sub="Chọn tiêu chí và tối đa 8 nhân viên để đặt cạnh nhau">Chọn nội dung so sánh</SectionTitle>
        <div style={{ marginBottom: 12 }}><MetricPills list={METRICS} active={sel} onChange={setSel} /></div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {all.map((d) => (
            <Chip key={d.id} active={picked.some((p) => p.id === d.id)} onClick={() => toggle(d.id)}>{shortName(d.name)}</Chip>
          ))}
        </div>
        <Toggle label="Thêm đường trung bình toàn viện" checked={showAvg} onChange={setShowAvg} />
      </Card>

      <MetricChart
        metric={metric}
        rows={rows}
        series={series}
        filename={`so-sanh-${metric.key}.png`}
        title={`So sánh: ${metric.full}`}
        subtitle={axis === "aligned" ? "Căn theo T0 — mọi người cùng mốc bắt đầu đào tạo" : "Theo lịch thực tế"}
      />

      <div style={{ height: 16 }} />
      <Card style={{ padding: mob ? 14 : 20 }}>
        <SectionTitle sub="Sắp xếp theo mức cải thiện (đã quy đổi theo chiều tốt/xấu của tiêu chí)">Bảng so sánh</SectionTitle>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 460 }}>
            <thead>
              <tr style={{ background: T.slateL }}>
                {["Nhân viên", "Trước", "Trong", "Sau", "∆ Sau/Trước"].map((h, i) => (
                  <th key={h} style={{ padding: "9px 10px", textAlign: i ? "right" : "left", fontSize: 11, color: T.muted, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.map(({ d, s }) => (
                <tr key={d.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: "9px 10px", fontWeight: 700 }}>{d.name}<div style={{ fontSize: 10, color: T.muted, fontWeight: 400 }}>{d.dept.replace("Khoa ", "")}</div></td>
                  <td style={{ padding: "9px 10px", textAlign: "right", color: PT.before, fontWeight: 700 }}>{withUnit(s.before, metric)}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", color: PT.during, fontWeight: 700 }}>{withUnit(s.during, metric)}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", color: PT.after, fontWeight: 700 }}>{withUnit(s.after, metric)}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right" }}><Delta val={pct(s.before, s.after)} dir={metric.dir} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
