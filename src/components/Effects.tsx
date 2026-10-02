import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ReferenceLine, Tooltip, LabelList,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from "recharts";
import type { StaffSummary } from "../lib/stats";
import { T } from "../theme";
import { Card, SectionTitle, Empty } from "./ui";
import { useIsMobile } from "../hooks/useIsMobile";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Cột phân kỳ: mức thay đổi (%) theo từng tiêu chí, đã quy đổi theo chiều tốt/xấu (xanh = tốt lên)
export function EffectBars({ sum, title = "Mức thay đổi theo tiêu chí" }: { sum: StaffSummary; title?: string }) {
  const mob = useIsMobile();
  const data = sum.rows
    .filter((r) => r.eff != null)
    .map((r) => ({ name: r.m.short, v: Math.round(clamp(r.eff as number, -1, 1) * 100), raw: r }));
  return (
    <Card style={{ padding: mob ? 14 : 20 }}>
      <SectionTitle sub="Sau so với Trước đào tạo, đã quy đổi theo chiều tốt/xấu. Bên phải = tốt lên.">{title}</SectionTitle>
      {!data.length ? (
        <Empty text="Chưa đủ dữ liệu trước/sau đào tạo" />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(130, data.length * 36 + 40)}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="#EEF2F7" horizontal={false} />
            <XAxis type="number" domain={[-100, 100]} allowDataOverflow tick={{ fontSize: 11, fill: T.slate }} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" width={mob ? 84 : 104} tick={{ fontSize: 12, fill: T.text }} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(148,163,184,0.12)" }}
              formatter={(v: any) => [`${v > 0 ? "+" : ""}${v}%`, "Thay đổi (đã quy đổi)"]}
            />
            <ReferenceLine x={0} stroke={T.slate} />
            <Bar dataKey="v" radius={3} isAnimationActive={false} maxBarSize={22}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.v >= 0 ? T.teal : T.red} />
              ))}
              <LabelList dataKey="v" position="right" formatter={(v: any) => `${v > 0 ? "+" : ""}${v}%`} style={{ fontSize: 11, fill: T.slate }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

// Radar: Trước = 100, Sau = 100 + mức thay đổi (%). Càng ra ngoài càng tốt.
export function EffectRadar({ sum }: { sum: StaffSummary }) {
  const mob = useIsMobile();
  const data = sum.rows
    .filter((r) => r.eff != null)
    .map((r) => ({ axis: r.m.short, before: 100, after: Math.round(clamp(100 + (r.eff as number) * 100, 0, 200)) }));
  return (
    <Card style={{ padding: mob ? 14 : 20 }}>
      <SectionTitle sub="Trước đào tạo = 100. Càng ra ngoài càng tốt (đã quy đổi chiều của tiêu chí).">Radar Trước / Sau</SectionTitle>
      {data.length < 3 ? (
        <Empty text="Cần ít nhất 3 tiêu chí có đủ dữ liệu trước/sau để vẽ radar" />
      ) : (
        <ResponsiveContainer width="100%" height={mob ? 280 : 320}>
          <RadarChart data={data} outerRadius="68%">
            <PolarGrid stroke={T.border} />
            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: T.text }} />
            <PolarRadiusAxis domain={[0, 200]} tick={{ fontSize: 9, fill: T.muted }} angle={90} tickCount={5} />
            <Radar name="Trước (=100)" dataKey="before" stroke={T.blue} fill={T.blue} fillOpacity={0.08} strokeWidth={2} isAnimationActive={false} />
            <Radar name="Sau đào tạo" dataKey="after" stroke={T.teal} fill={T.teal} fillOpacity={0.28} strokeWidth={2.4} isAnimationActive={false} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
