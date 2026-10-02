import { useMemo, useState } from "react";
import type { Staff } from "../lib/parse";
import { METRIC_BY_KEY } from "../lib/metrics";
import { getStatus, meanSeries, staffPoints, buildRows, completeness, staffSummary } from "../lib/stats";
import type { Pt } from "../lib/stats";
import { shortName } from "../lib/format";
import { useSettings } from "../lib/settings";
import { useIsMobile } from "../hooks/useIsMobile";
import { T } from "../theme";
import { Chip, KpiCards, MetricPills, Seg, StatusBadge, Card, SectionTitle, Avatar, Badge } from "../components/ui";
import { MetricChart } from "../components/MetricChart";
import { Heatmap } from "../components/Heatmap";

export function DeptView({
  staff, selectedDept, onSelectDept, onOpen,
}: {
  staff: Record<string, Staff>; selectedDept: string | null; onSelectDept: (d: string) => void; onOpen: (id: string, key?: string) => void;
}) {
  const { settings } = useSettings();
  const th = settings.threshold / 100;
  const axis = settings.chart.axis;
  const mob = useIsMobile();
  const all = useMemo(() => Object.values(staff), [staff]);
  const depts = useMemo(() => [...new Set(all.map((d) => d.dept))], [all]);
  const dept = selectedDept && depts.includes(selectedDept) ? selectedDept : depts[0];
  const members = useMemo(() => all.filter((d) => d.dept === dept), [all, dept]);
  const [sel, setSel] = useState("exam");
  const [mode, setMode] = useState<"staff" | "avg">("staff");
  const metric = METRIC_BY_KEY[sel];

  const comp = completeness(members);
  const sums = useMemo(() => members.map((d) => ({ d, s: staffSummary(d, th) })), [members, th]);
  const scored = sums.filter((x) => x.s.score != null);
  const avgScore = scored.length ? scored.reduce((a, x) => a + (x.s.score as number), 0) / scored.length : null;

  const { rows, series } = useMemo(() => {
    const withData = members.filter((d) => Object.keys(d.metrics[sel] || {}).length);
    let entries: { name: string; pts: Pt[] }[];
    if (mode === "avg") entries = [{ name: `TB ${dept.replace("Khoa ", "")}`, pts: meanSeries(withData, metric, axis) }];
    else entries = withData.map((d) => ({ name: shortName(d.name), pts: staffPoints(d, sel, axis) }));
    entries = entries.filter((e) => e.pts.length);
    const keyed = entries.map((e, i) => ({ ...e, key: `s${i}` }));
    return {
      rows: buildRows(keyed, { phase: axis === "aligned" || keyed.length === 1 }),
      series: keyed.map((e) => ({ key: e.key, name: e.name })),
    };
  }, [members, sel, mode, axis, metric, dept]);

  return (
    <div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 12 }}>
        {depts.map((d) => (
          <Chip key={d} active={d === dept} onClick={() => onSelectDept(d)}>
            {d.replace("Khoa ", "")} · {all.filter((s) => s.dept === d).length}
          </Chip>
        ))}
      </div>

      <div style={{ fontSize: 18, fontWeight: 800, color: T.navy, marginBottom: 14 }}>{dept}</div>
      <KpiCards
        items={[
          { label: "Nhân viên", value: members.length, accent: T.blue },
          { label: "Đã hoàn thành", value: members.filter((d) => getStatus(d.from, d.to) === "completed").length, color: T.teal, accent: T.teal },
          { label: "Điểm TB khoa", value: avgScore == null ? "–" : `${avgScore > 0 ? "+" : ""}${Math.round(avgScore)}`, color: avgScore == null ? T.muted : avgScore >= 0 ? T.teal : T.red, sub: "Trung bình mức thay đổi", accent: T.amber },
          { label: "Đầy đủ dữ liệu", value: comp.ratio == null ? "–" : `${Math.round(comp.ratio * 100)}%`, sub: `${comp.filled}/${comp.slots} kỳ`, accent: T.slate },
        ]}
      />

      <Heatmap staff={members} th={th} onPick={onOpen} title={`Bảng nhiệt — ${dept}`} />

      <div style={{ height: 16 }} />
      <MetricChart
        metric={metric}
        rows={rows}
        series={series}
        filename={`${metric.key}-${dept}.png`}
        title={`So sánh trong khoa: ${metric.full}`}
        subtitle={mode === "staff" ? "Mỗi đường là một nhân viên" : "Trung bình các nhân viên của khoa"}
        actions={
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <MetricPills active={sel} onChange={setSel} />
            <div><Seg value={mode} onChange={setMode} options={[{ value: "staff", label: "Từng nhân viên" }, { value: "avg", label: "Trung bình khoa" }]} /></div>
          </div>
        }
      />

      <div style={{ height: 16 }} />
      <Card style={{ padding: mob ? 14 : 20 }}>
        <SectionTitle sub="Bấm để xem chi tiết">Danh sách nhân viên</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 8 }}>
          {sums.map(({ d, s }, i) => (
            <div
              key={d.id}
              onClick={() => onOpen(d.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.blue)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
            >
              <Avatar name={d.name} size={34} idx={i} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title} {d.name}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{d.from} → {d.to}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                <StatusBadge status={getStatus(d.from, d.to)} />
                {s.n ? (
                  <Badge text={`${s.up}/${s.n} cải thiện`} color={s.up > s.down ? T.teal : s.down > s.up ? T.red : T.blue} bg={s.up > s.down ? T.tealL : s.down > s.up ? T.redL : T.blueL} />
                ) : (
                  <Badge text="Chưa đủ dữ liệu" color={T.muted} bg={T.slateL} />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
