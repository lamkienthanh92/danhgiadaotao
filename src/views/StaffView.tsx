import { useMemo, useState } from "react";
import type { Staff } from "../lib/parse";
import { METRIC_BY_KEY } from "../lib/metrics";
import { getStatus, staffSummary, staffPoints, meanSeries, buildRows } from "../lib/stats";
import { staffInsights } from "../lib/insights";
import { downloadCsv } from "../lib/export";
import { fmt, signPct } from "../lib/format";
import { useSettings } from "../lib/settings";
import { useIsMobile } from "../hooks/useIsMobile";
import { T, PHASES, PL, PT, PHASE_SHORT } from "../theme";
import { Avatar, Bullets, Card, MetricPills, SectionTitle, StatusBadge, Toggle } from "../components/ui";
import { MetricChart } from "../components/MetricChart";
import { MetricTable } from "../components/MetricTable";
import { EffectBars, EffectRadar } from "../components/Effects";

export function StaffView({
  staff, selectedId, selectedMetric, onSelect, onMetric,
}: {
  staff: Record<string, Staff>; selectedId: string | null; selectedMetric: string; onSelect: (id: string) => void; onMetric: (k: string) => void;
}) {
  const { settings } = useSettings();
  const th = settings.threshold / 100;
  const axis = settings.chart.axis;
  const mob = useIsMobile();
  const all = useMemo(() => Object.values(staff), [staff]);
  const depts = useMemo(() => [...new Set(all.map((d) => d.dept))], [all]);
  const [deptF, setDeptF] = useState("all");
  const [vsDept, setVsDept] = useState(false);
  const filtered = all.filter((d) => deptF === "all" || d.dept === deptF);
  const doc = (selectedId && staff[selectedId]) || filtered[0] || all[0];
  const metric = METRIC_BY_KEY[selectedMetric] || METRIC_BY_KEY.exam;

  const sum = useMemo(() => (doc ? staffSummary(doc, th) : null), [doc, th]);
  const insights = useMemo(() => (sum ? staffInsights(sum, settings.targets, th) : []), [sum, settings.targets, th]);

  const { rows, series } = useMemo(() => {
    if (!doc) return { rows: [], series: [] };
    const entries = [{ key: "s0", name: doc.name, pts: staffPoints(doc, metric.key, axis) }];
    if (vsDept) {
      const mates = all.filter((d) => d.dept === doc.dept && d.id !== doc.id && Object.keys(d.metrics[metric.key] || {}).length);
      const pts = meanSeries(mates, metric, axis);
      if (pts.length) entries.push({ key: "s1", name: `TB ${doc.dept.replace("Khoa ", "")} (không gồm NV này)`, pts });
    }
    return { rows: buildRows(entries.filter((e) => e.pts.length), { phase: true }), series: entries.filter((e) => e.pts.length).map((e) => ({ key: e.key, name: e.name })) };
  }, [doc, metric, axis, vsDept, all]);

  if (!doc || !sum) return null;
  const status = getStatus(doc.from, doc.to);

  const exportCsv = () =>
    downloadCsv(`danh-gia-${doc.id}.csv`, [
      ["Mã NV", "Họ tên", "Khoa", "Từ", "Đến"],
      [doc.id, doc.name, doc.dept, doc.from, doc.to],
      [],
      ["Tiêu chí", "Trước", "Trong", "Sau", "% Sau/Trước", "Nhận xét"],
      ...sum.rows.map((r) => [r.m.full, r.s.before, r.s.during, r.s.after, r.pctAfter, r.status.text]),
    ]);

  const picker = (
    <div style={mob ? { minWidth: 0 } : { width: 230, flexShrink: 0 }}>
      <select
        value={deptF}
        onChange={(e) => setDeptF(e.target.value)}
        style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: mob ? 16 : 12, marginBottom: 10, background: T.white, color: T.text }}
      >
        <option value="all">Tất cả khoa phòng</option>
        {depts.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      <div style={{ display: "flex", flexDirection: mob ? "row" : "column", gap: 6, maxHeight: mob ? undefined : "calc(100vh - 220px)", overflowY: mob ? "hidden" : "auto", overflowX: mob ? "auto" : "hidden", paddingBottom: mob ? 6 : 0 }}>
        {filtered.map((d, i) => {
          const on = doc.id === d.id;
          return (
            <div
              key={d.id}
              onClick={() => onSelect(d.id)}
              style={{ padding: "10px 12px", flexShrink: 0, minWidth: mob ? 150 : undefined, borderRadius: 8, cursor: "pointer", background: on ? T.navy : T.white, border: `1px solid ${on ? T.navy : T.border}`, borderLeft: on ? `3px solid ${T.blue}` : `1px solid ${T.border}` }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar name={d.name} size={30} idx={i} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: on ? T.white : T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name.split(" ").slice(-2).join(" ")}</div>
                  <div style={{ fontSize: 10, color: on ? "rgba(255,255,255,0.6)" : T.muted, marginTop: 1 }}>{d.dept.replace("Khoa ", "")}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 16, flexDirection: mob ? "column" : "row" }}>
      {picker}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Card style={{ padding: mob ? 14 : 20, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: mob ? 12 : 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Avatar name={doc.name} size={56} idx={all.indexOf(doc)} />
            <div style={{ flex: 1, minWidth: mob ? 0 : 200 }}>
              <div style={{ fontSize: mob ? 17 : 20, fontWeight: 800, color: T.navy }}>{doc.title} {doc.name}</div>
              <div style={{ fontSize: 13, color: T.muted, marginTop: 3 }}>{doc.dept} · {doc.specialty}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
                <StatusBadge status={status} />
                <span style={{ fontSize: 12, color: T.muted }}>{doc.from} → {doc.to}</span>
                {PHASES.map((ph) => (
                  <span key={ph} style={{ fontSize: 11, background: PL[ph], color: PT[ph], padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>{PHASE_SHORT[ph]}</span>
                ))}
              </div>
            </div>
            <div style={mob ? { textAlign: "left", width: "100%", borderTop: `1px solid ${T.border}`, paddingTop: 10 } : { textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>Tổng hợp</div>
              {sum.n ? (
                <>
                  <div style={{ fontSize: 24, fontWeight: 800, color: sum.up > sum.down ? T.teal : sum.down > sum.up ? T.red : T.blue }}>{sum.up}/{sum.n}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>
                    tiêu chí cải thiện{sum.down ? ` · ${sum.down} giảm` : ""}
                    {sum.score != null && ` · điểm ${sum.score > 0 ? "+" : ""}${Math.round(sum.score)}`}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>Chưa đủ dữ liệu<br />trước/sau để so sánh</div>
              )}
            </div>
          </div>
        </Card>

        <Card style={{ padding: mob ? 14 : 20, marginBottom: 16 }}>
          <SectionTitle sub="Tự động rút ra từ số liệu" right={<button onClick={exportCsv} style={{ border: `1px solid ${T.border}`, background: T.white, borderRadius: 8, padding: "6px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>⤓ CSV</button>}>
            Nhận xét tự động
          </SectionTitle>
          <Bullets items={insights} />
        </Card>

        <Card style={{ padding: mob ? 14 : 20, marginBottom: 16 }}>
          <SectionTitle sub="Trung bình theo kỳ của từng giai đoạn. Bấm một dòng để xem biểu đồ bên dưới.">Tổng quan 9 tiêu chí</SectionTitle>
          <MetricTable sum={sum} active={metric.key} onPick={onMetric} />
        </Card>

        <MetricChart
          metric={metric}
          rows={rows}
          series={series}
          filename={`${doc.id}-${metric.key}.png`}
          title={`Biểu đồ: ${metric.label}`}
          subtitle={metric.full}
          actions={
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <MetricPills active={metric.key} onChange={onMetric} />
              <Toggle label="So với trung bình khoa" checked={vsDept} onChange={setVsDept} />
            </div>
          }
        />

        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 16, marginTop: 16 }}>
          <EffectBars sum={sum} />
          <EffectRadar sum={sum} />
        </div>
      </div>
    </div>
  );
}
