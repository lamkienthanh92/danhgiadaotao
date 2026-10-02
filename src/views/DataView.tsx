import { useMemo } from "react";
import type { Staff } from "../lib/parse";
import { METRICS, GRAN_LABEL } from "../lib/metrics";
import { completeness, staffSummary } from "../lib/stats";
import { downloadCsv } from "../lib/export";
import { useSettings } from "../lib/settings";
import { useIsMobile } from "../hooks/useIsMobile";
import { T } from "../theme";
import { Card, SectionTitle } from "../components/ui";

const cellColor = (r: number | null) =>
  r == null ? { bg: T.slateL, fg: T.muted } : r === 0 ? { bg: T.redL, fg: T.red } : r < 0.8 ? { bg: T.amberL, fg: T.amber } : { bg: T.tealL, fg: T.teal };

export function DataView({ staff, fileName }: { staff: Record<string, Staff> | null; fileName?: string }) {
  const { settings, setThreshold, setTarget, resetAll } = useSettings();
  const mob = useIsMobile();
  const all = useMemo(() => (staff ? Object.values(staff) : []), [staff]);
  const th = settings.threshold / 100;

  const exportSummary = () => {
    const head = ["Mã NV", "Họ tên", "Khoa", "Từ", "Đến"];
    METRICS.forEach((m) => head.push(`${m.full} — Trước`, "Trong", "Sau", "% Sau/Trước", "Nhận xét"));
    const rows = all.map((d) => {
      const s = staffSummary(d, th);
      const r: any[] = [d.id, d.name, d.dept, d.from, d.to];
      s.rows.forEach((x) => r.push(x.s.before, x.s.during, x.s.after, x.pctAfter, x.status.text));
      return r;
    });
    downloadCsv("tong-hop-danh-gia.csv", [head, ...rows]);
  };

  const inp: any = { width: 90, padding: "6px 8px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: mob ? 16 : 13 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {all.length > 0 && (
        <Card style={{ padding: mob ? 14 : 20 }}>
          <SectionTitle
            sub={`${fileName || "File hiện tại"} — số kỳ có số liệu / số kỳ file dành cho từng người. Đỏ = chưa có gì, vàng = thiếu một phần, xanh = đủ.`}
            right={<button onClick={exportSummary} style={{ border: `1px solid ${T.border}`, background: T.white, borderRadius: 8, padding: "6px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>⤓ Xuất CSV tổng hợp</button>}
          >
            Theo dõi mức đầy đủ dữ liệu
          </SectionTitle>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "separate", borderSpacing: 3, minWidth: 760, width: "100%", fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "6px 8px", position: "sticky", left: 0, background: T.white, minWidth: 130 }}>Nhân viên</th>
                  {METRICS.map((m) => (
                    <th key={m.key} title={`${m.full} (theo ${GRAN_LABEL[m.gran]})`} style={{ padding: "6px 4px", fontSize: 11, color: T.slate, whiteSpace: "nowrap" }}>
                      <span style={{ color: m.color }}>{m.icon}</span> {m.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {all.map((d) => (
                  <tr key={d.id}>
                    <td style={{ padding: "6px 8px", fontWeight: 700, position: "sticky", left: 0, background: T.white, whiteSpace: "nowrap" }}>{d.name}</td>
                    {METRICS.map((m) => {
                      const c = completeness([d], m.key);
                      const col = cellColor(c.ratio);
                      return (
                        <td key={m.key} style={{ background: col.bg, color: col.fg, textAlign: "center", fontWeight: 700, borderRadius: 6, padding: "7px 4px", fontVariantNumeric: "tabular-nums" }}>
                          {c.slots ? `${c.filled}/${c.slots}` : "–"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: "8px", fontWeight: 800, position: "sticky", left: 0, background: T.white }}>Tổng</td>
                  {METRICS.map((m) => {
                    const c = completeness(all, m.key);
                    const col = cellColor(c.ratio);
                    return (
                      <td key={m.key} style={{ background: col.bg, color: col.fg, textAlign: "center", fontWeight: 800, borderRadius: 6, padding: "7px 4px" }}>
                        {c.ratio == null ? "–" : `${Math.round(c.ratio * 100)}%`}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card style={{ padding: mob ? 14 : 20 }}>
        <SectionTitle sub="Các thiết lập được lưu trên trình duyệt này.">Thiết lập đánh giá</SectionTitle>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>Ngưỡng "cải thiện / giảm sút": ±{settings.threshold}%</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>
            Sau so với Trước đào tạo lệch quá ngưỡng này mới tính là cải thiện hoặc giảm sút; trong ngưỡng là "Ổn định".
          </div>
          <input type="range" min={1} max={40} step={1} value={settings.threshold} onChange={(e) => setThreshold(+e.target.value)} style={{ width: "min(360px,100%)", accentColor: T.blue }} />
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>Mục tiêu theo từng tiêu chí (tuỳ chọn)</div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>
          Nhập giá trị cần đạt sau đào tạo: tiêu chí "càng cao càng tốt" cần ≥ mục tiêu, tiêu chí "càng thấp càng tốt" cần ≤ mục tiêu. Mục tiêu sẽ hiện thành đường đỏ trên biểu đồ và dấu ✓/✗ ở bảng.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: "8px 24px" }}>
          {METRICS.map((m) => (
            <div key={m.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "6px 0", borderBottom: `1px solid ${T.slateL}` }}>
              <div style={{ fontSize: 13, color: T.text, minWidth: 0 }}>
                <span style={{ color: m.color }}>{m.icon}</span> {m.label}
                <div style={{ fontSize: 10.5, color: T.muted }}>{m.dir < 0 ? "≤ (thấp hơn là tốt)" : "≥ (cao hơn là tốt)"}{m.unit ? ` · ${m.unit}` : ""}</div>
              </div>
              <input
                type="number"
                inputMode="decimal"
                placeholder="–"
                style={inp}
                value={settings.targets[m.key] ?? ""}
                onChange={(e) => setTarget(m.key, e.target.value === "" ? null : Number(e.target.value))}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <button onClick={resetAll} style={{ border: `1px solid ${T.border}`, background: T.white, borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: T.red }}>
            ↺ Đặt lại toàn bộ thiết lập
          </button>
        </div>
      </Card>

      <Card style={{ padding: mob ? 14 : 20 }}>
        <SectionTitle>Cách tính</SectionTitle>
        <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>
          <b>Giai đoạn:</b> kỳ kết thúc trước tháng vào lớp = Trước; kỳ bắt đầu sau tháng ra lớp = Sau; còn lại = Trong. Giá trị mỗi giai đoạn là trung bình các kỳ trong giai đoạn đó.
          <br /><b>Mức thay đổi:</b> (Sau − Trước) ÷ |Trước|, đã đảo dấu với tiêu chí "thấp hơn là tốt" để dương luôn là tốt lên.
          <br /><b>Điểm tổng hợp:</b> trung bình mức thay đổi của các tiêu chí đủ dữ liệu, mỗi tiêu chí giới hạn trong ±100%.
          <br /><b>T0:</b> tháng bắt đầu đào tạo. Trục "Căn theo T0" cho phép so sánh các nhân viên vào lớp ở những thời điểm khác nhau.
          <br /><b>Xu hướng sau đào tạo:</b> độ dốc đường hồi quy trên các kỳ thuộc giai đoạn Sau (cần ít nhất 3 kỳ).
        </div>
      </Card>
    </div>
  );
}
