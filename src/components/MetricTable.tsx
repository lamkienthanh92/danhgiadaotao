import { PHASES, PL, PT, PHASE_SHORT, T } from "../theme";
import { GRAN_LABEL } from "../lib/metrics";
import type { MetricDef } from "../lib/metrics";
import type { StaffSummary, SummaryRow } from "../lib/stats";
import { meetsTarget, pct } from "../lib/stats";
import { withUnit, fmt } from "../lib/format";
import { useSettings } from "../lib/settings";
import { useIsMobile } from "../hooks/useIsMobile";
import { Badge, Delta, Sparkline } from "./ui";

const meta = (m: MetricDef) => `${m.unit ? m.unit + " · " : ""}theo ${GRAN_LABEL[m.gran]}${m.dir < 0 ? " · thấp hơn là tốt" : ""}`;

function TargetCell({ r, target }: { r: SummaryRow; target: number | null | undefined }) {
  if (target == null) return <span style={{ color: T.muted, fontSize: 12 }}>–</span>;
  const ok = meetsTarget(r.m, r.s.after, target);
  return (
    <span style={{ fontSize: 12, color: ok == null ? T.muted : ok ? T.teal : T.red, fontWeight: 700, whiteSpace: "nowrap" }}>
      {ok == null ? "" : ok ? "✓ " : "✗ "}
      {r.m.dir < 0 ? "≤" : "≥"} {fmt(target)}
    </span>
  );
}

function TrendCell({ r }: { r: SummaryRow }) {
  if (!r.trend) return <span style={{ color: T.muted, fontSize: 12 }}>–</span>;
  const col = r.trend.good == null ? T.slate : r.trend.good ? T.teal : T.red;
  return <span style={{ color: col, fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>{r.trend.arrow} {r.trend.text}</span>;
}

// Bảng 9 tiêu chí: trên điện thoại hiển thị dạng thẻ
export function MetricTable({ sum, active, onPick }: { sum: StaffSummary; active: string; onPick: (k: string) => void }) {
  const mob = useIsMobile();
  const { settings } = useSettings();
  const targets = settings.targets;

  if (mob)
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sum.rows.map((r) => (
          <div
            key={r.m.key}
            onClick={() => onPick(r.m.key)}
            style={{ border: `1px solid ${active === r.m.key ? T.blue : T.border}`, background: active === r.m.key ? T.blueL : T.white, borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>
                  <span style={{ color: r.m.color, marginRight: 6 }}>{r.m.icon}</span>{r.m.label}
                </div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>{meta(r.m)}</div>
              </div>
              <Badge text={r.status.text} color={r.status.color} bg={r.status.bg} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
              {PHASES.map((ph) => (
                <div key={ph} style={{ background: PL[ph], borderRadius: 8, padding: "6px 4px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: PT[ph], fontWeight: 600 }}>{PHASE_SHORT[ph]}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: PT[ph], fontVariantNumeric: "tabular-nums" }}>{withUnit(r.s[ph], r.m)}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11, color: T.muted, alignItems: "center", flexWrap: "wrap" }}>
              <span>Trong/Trước <Delta val={pct(r.s.before, r.s.during)} dir={r.m.dir} /></span>
              <span>Sau/Trước <Delta val={r.pctAfter} dir={r.m.dir} /></span>
              <TrendCell r={r} />
              <TargetCell r={r} target={targets[r.m.key]} />
              <span style={{ marginLeft: "auto" }}><Sparkline values={r.spark} color={r.m.color} w={70} /></span>
            </div>
          </div>
        ))}
      </div>
    );

  const th: any = { padding: "10px 12px", color: T.muted, fontWeight: 600, fontSize: 11, textAlign: "right", whiteSpace: "nowrap" };
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: T.slateL }}>
            <th style={{ ...th, textAlign: "left" }}>Tiêu chí</th>
            {PHASES.map((ph) => <th key={ph} style={{ ...th, color: PT[ph], fontSize: 12, fontWeight: 700 }}>{PHASE_SHORT[ph]}</th>)}
            <th style={th}>∆ Trong/Trước</th>
            <th style={th}>∆ Sau/Trước</th>
            <th style={th}>Xu hướng sau</th>
            <th style={th}>Diễn biến</th>
            <th style={th}>Mục tiêu</th>
            <th style={{ ...th, textAlign: "center" }}>Nhận xét</th>
          </tr>
        </thead>
        <tbody>
          {sum.rows.map((r, i) => {
            const bg = active === r.m.key ? T.blueL : i % 2 === 0 ? T.white : "#F8FAFC";
            return (
              <tr
                key={r.m.key}
                onClick={() => onPick(r.m.key)}
                style={{ background: bg, borderBottom: `1px solid ${T.border}`, cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.blueL)}
                onMouseLeave={(e) => (e.currentTarget.style.background = bg)}
              >
                <td style={{ padding: "11px 12px", fontWeight: 700, color: T.text }}>
                  <span style={{ color: r.m.color, marginRight: 6 }}>{r.m.icon}</span>{r.m.label}
                  <div style={{ fontSize: 10, color: T.muted, fontWeight: 400, marginLeft: 20 }}>{meta(r.m)}</div>
                </td>
                {PHASES.map((ph) => (
                  <td key={ph} style={{ padding: "11px 12px", textAlign: "right", color: PT[ph], fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                    {withUnit(r.s[ph], r.m)}
                  </td>
                ))}
                <td style={{ padding: "11px 12px", textAlign: "right" }}><Delta val={pct(r.s.before, r.s.during)} dir={r.m.dir} /></td>
                <td style={{ padding: "11px 12px", textAlign: "right" }}><Delta val={r.pctAfter} dir={r.m.dir} /></td>
                <td style={{ padding: "11px 12px", textAlign: "right" }}><TrendCell r={r} /></td>
                <td style={{ padding: "11px 12px", display: "flex", justifyContent: "flex-end" }}><Sparkline values={r.spark} color={r.m.color} /></td>
                <td style={{ padding: "11px 12px", textAlign: "right" }}><TargetCell r={r} target={targets[r.m.key]} /></td>
                <td style={{ padding: "11px 12px", textAlign: "center" }}><Badge text={r.status.text} color={r.status.color} bg={r.status.bg} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
