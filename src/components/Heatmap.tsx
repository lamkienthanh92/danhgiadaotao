import { useMemo, useState } from "react";
import { METRICS } from "../lib/metrics";
import type { Staff } from "../lib/parse";
import { staffSummary } from "../lib/stats";
import { signPct } from "../lib/format";
import { T } from "../theme";
import { Card, SectionTitle, Empty } from "./ui";
import { useIsMobile } from "../hooks/useIsMobile";

export function heatColor(eff: number | null): { bg: string; color: string } {
  if (eff == null) return { bg: T.slateL, color: T.muted };
  const a = Math.min(1, Math.abs(eff) / 0.5);
  return eff >= 0
    ? { bg: `rgba(16,185,129,${0.12 + 0.5 * a})`, color: "#064E3B" }
    : { bg: `rgba(239,68,68,${0.12 + 0.5 * a})`, color: "#7F1D1D" };
}

// Bảng nhiệt: nhân viên × 9 tiêu chí — màu thể hiện mức tốt lên / xấu đi (đã quy đổi theo chiều của tiêu chí)
export function Heatmap({
  staff, th, onPick, title = "Bảng nhiệt theo dõi 9 tiêu chí", sub,
}: {
  staff: Staff[]; th: number; onPick: (id: string, key?: string) => void; title?: string; sub?: string;
}) {
  const mob = useIsMobile();
  const [sort, setSort] = useState<{ key: string; desc: boolean }>({ key: "name", desc: false });
  const rows = useMemo(() => staff.map((d) => ({ d, sum: staffSummary(d, th) })), [staff, th]);
  const sorted = useMemo(() => {
    const val = (x: any) => (sort.key === "name" ? x.d.name : sort.key === "score" ? x.sum.score : x.sum.rows.find((r: any) => r.m.key === sort.key)?.eff);
    return [...rows].sort((a, b) => {
      const va = val(a), vb = val(b);
      if (sort.key === "name") return sort.desc ? vb.localeCompare(va) : va.localeCompare(vb);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return sort.desc ? vb - va : va - vb;
    });
  }, [rows, sort]);

  const toggle = (key: string) =>
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key !== "name" }));
  const arrow = (key: string) => (sort.key === key ? (sort.desc ? " ▼" : " ▲") : "");
  const th_: any = { padding: "8px 6px", fontSize: 11, color: T.slate, fontWeight: 700, cursor: "pointer", textAlign: "center", userSelect: "none", whiteSpace: "nowrap", borderBottom: `1px solid ${T.border}`, background: T.white };

  return (
    <Card style={{ padding: mob ? 14 : 20 }}>
      <SectionTitle sub={sub || "Số % là mức thay đổi Sau so với Trước đào tạo. Xanh = tốt lên, đỏ = xấu đi (đã tính chiều tốt/xấu của từng tiêu chí). Bấm tiêu đề để sắp xếp, bấm ô để mở chi tiết."}>
        {title}
      </SectionTitle>
      {!staff.length ? (
        <Empty text="Chưa có nhân viên" />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 3, minWidth: 760, width: "100%", fontSize: 12 }}>
            <thead>
              <tr>
                <th onClick={() => toggle("name")} style={{ ...th_, textAlign: "left", position: "sticky", left: 0, zIndex: 2, minWidth: 130 }}>
                  Nhân viên{arrow("name")}
                </th>
                {METRICS.map((m) => (
                  <th key={m.key} onClick={() => toggle(m.key)} title={m.full} style={th_}>
                    <span style={{ color: m.color }}>{m.icon}</span> {m.short}
                    {m.dir < 0 && <span style={{ color: T.muted, fontWeight: 400 }}> ↓</span>}
                    {arrow(m.key)}
                  </th>
                ))}
                <th onClick={() => toggle("score")} style={th_} title="Điểm tổng hợp = trung bình mức thay đổi đã quy đổi theo chiều tốt/xấu">
                  Điểm{arrow("score")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ d, sum }) => (
                <tr key={d.id}>
                  <td
                    onClick={() => onPick(d.id)}
                    style={{ position: "sticky", left: 0, zIndex: 1, background: T.white, padding: "6px 8px", fontWeight: 700, color: T.text, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    {d.name}
                    <div style={{ fontSize: 10, color: T.muted, fontWeight: 400 }}>{d.dept.replace("Khoa ", "")}</div>
                  </td>
                  {sum.rows.map((r) => {
                    const hc = heatColor(r.eff);
                    const txt = r.eff == null ? "–" : r.pctAfter == null ? (r.eff > 0 ? "▲" : r.eff < 0 ? "▼" : "0") : signPct(r.pctAfter);
                    return (
                      <td
                        key={r.m.key}
                        onClick={() => onPick(d.id, r.m.key)}
                        title={r.eff == null ? `${r.m.full}: chưa đủ dữ liệu` : `${r.m.full}: ${r.s.before} → ${r.s.after}`}
                        style={{ background: hc.bg, color: hc.color, textAlign: "center", fontWeight: 700, borderRadius: 6, padding: "8px 4px", cursor: "pointer", fontVariantNumeric: "tabular-nums" }}
                      >
                        {txt}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: "center", fontWeight: 800, borderRadius: 6, padding: "8px 4px", background: heatColor(sum.score == null ? null : sum.score / 100).bg, color: heatColor(sum.score == null ? null : sum.score / 100).color }}>
                    {sum.score == null ? "–" : `${sum.score > 0 ? "+" : ""}${Math.round(sum.score)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 11, color: T.muted, flexWrap: "wrap" }}>
        <span>Kém đi</span>
        {[-0.5, -0.25, -0.1, 0, 0.1, 0.25, 0.5].map((e) => (
          <span key={e} style={{ width: 22, height: 12, borderRadius: 3, background: heatColor(e).bg }} />
        ))}
        <span>Tốt lên</span>
        <span style={{ marginLeft: 8 }}>· "–" = chưa đủ dữ liệu trước/sau · ↓ = tiêu chí thấp hơn là tốt</span>
      </div>
    </Card>
  );
}
