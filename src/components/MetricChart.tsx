import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ResponsiveContainer, ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceArea, ReferenceLine, Brush,
} from "recharts";
import { T, PC, PT, PHASE_LONG, PHASE_SHORT, BAND, PALETTES, SIZES } from "../theme";
import type { Phase } from "../theme";
import type { MetricDef } from "../lib/metrics";
import { useSettings } from "../lib/settings";
import { useIsMobile } from "../hooks/useIsMobile";
import { movingAvg, trendLine } from "../lib/stats";
import { fmt } from "../lib/format";
import { downloadPng } from "../lib/export";
import { Card, SectionTitle, Seg, Toggle, Empty } from "./ui";

export interface SeriesDef { key: string; name: string; color?: string }

function ChartTooltip({ active, payload, label, metric }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload || {};
  const items = payload.filter((p: any) => p.value != null && !String(p.dataKey).startsWith("__") && !String(p.dataKey).endsWith("__tr"));
  if (!items.length) return null;
  const ph: Phase | undefined = row.__phase;
  return (
    <div style={{ background: T.navy, borderRadius: 8, padding: "10px 14px", boxShadow: "0 8px 24px rgba(0,0,0,0.25)", minWidth: 150, maxWidth: 260 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
        <span style={{ color: "#CBD5E1", fontSize: 12, fontWeight: 700 }}>{label}</span>
        {ph && <span style={{ fontSize: 10, fontWeight: 700, color: PC[ph] }}>{PHASE_LONG[ph]}</span>}
      </div>
      {items.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: 14, fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>
          <span style={{ color: "#CBD5E1", display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color || p.stroke || p.fill, flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
          </span>
          <span style={{ color: "#fff", fontVariantNumeric: "tabular-nums" }}>
            {fmt(p.value)}
            {metric?.unit === "%" ? "%" : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

interface Props {
  metric: MetricDef;
  rows: any[]; // { x, sort, [series.key]: number, __phase? }
  series: SeriesDef[];
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode; // vùng điều khiển riêng của màn hình (vd. chọn nhóm)
  filename?: string;
}

export function MetricChart({ metric, rows, series, title, subtitle, actions, filename }: Props) {
  const { settings, setChart, resetChart } = useSettings();
  const c = settings.chart;
  const mob = useIsMobile();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const uid = useRef(Math.random().toString(36).slice(2, 7)).current;

  const colors = (PALETTES[c.palette] || PALETTES.default).colors;
  const colorFor = (se: SeriesDef, i: number) =>
    se.color || (series.length === 1 && c.palette === "default" ? metric.color : colors[i % colors.length]);
  const target = settings.targets[metric.key];

  // Dải giai đoạn (Trước / Trong / Sau) lấy từ __phase của từng dòng
  const bands = useMemo(() => {
    const out: { phase: Phase; i1: number; i2: number }[] = [];
    let cur: any = null;
    rows.forEach((r, i) => {
      if (!r.__phase) return;
      if (!cur || cur.phase !== r.__phase) { cur = { phase: r.__phase, i1: i, i2: i }; out.push(cur); }
      else cur.i2 = i;
    });
    // kéo dài mỗi dải tới điểm đầu của dải kế tiếp để không bị hở
    return out.map((b, k) => ({ ...b, x1: rows[b.i1].x, x2: rows[out[k + 1] ? out[k + 1].i1 : b.i2].x }));
  }, [rows]);

  const data = useMemo(() => {
    const out = rows.map((r) => ({ ...r }));
    series.forEach((se) => {
      const vals = rows.map((r) => (r[se.key] == null ? null : r[se.key]));
      if (c.ma > 0) movingAvg(vals, c.ma).forEach((v, i) => (out[i][se.key + "__ma"] = v));
      if (c.trend) trendLine(vals).forEach((v, i) => (out[i][se.key + "__tr"] = v));
    });
    if (c.phaseAvg && series.length === 1) {
      bands.forEach((b) => {
        const vs: number[] = [];
        for (let i = b.i1; i <= b.i2; i++) if (rows[i][series[0].key] != null) vs.push(rows[i][series[0].key]);
        if (!vs.length) return;
        const a = +(vs.reduce((x, y) => x + y, 0) / vs.length).toFixed(2);
        for (let i = b.i1; i <= b.i2; i++) out[i]["__pa_" + b.phase] = a;
      });
    }
    return out;
  }, [rows, series, c.ma, c.trend, c.phaseAvg, bands]);

  if (!rows.length || !series.length)
    return (
      <Card style={{ padding: mob ? 14 : 20 }}>
        <SectionTitle sub={subtitle}>{title}</SectionTitle>
        <Empty text={`Chưa có dữ liệu "${metric.full}"`} />
      </Card>
    );

  const curve: any = c.smooth ? "monotone" : "linear";
  const showDots = c.dots && rows.length <= 40;
  const rot = rows.length > 10;
  const h = SIZES[c.size] - (mob ? 30 : 0);
  const labelProp: any = c.labels
    ? { position: "top", fontSize: 10, fill: T.slate, formatter: (v: any) => fmt(v) }
    : false;
  const dotProp: any = showDots ? { r: 3, strokeWidth: 2, fill: "#fff" } : false;

  return (
    <Card style={{ padding: mob ? 14 : 20 }}>
      <SectionTitle
        sub={subtitle}
        right={
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <Seg
              value={c.type}
              onChange={(v) => setChart({ type: v })}
              options={[{ value: "line", label: "Đường" }, { value: "area", label: "Vùng" }, { value: "bar", label: "Cột" }]}
            />
            <button onClick={() => setOpen(!open)} style={btn(open)}>⚙ Tùy chỉnh</button>
            <button onClick={() => downloadPng(boxRef.current, filename || `${metric.key}.png`)} style={btn(false)}>⤓ PNG</button>
          </div>
        }
      >
        {title}
      </SectionTitle>

      {actions && <div style={{ marginBottom: 12 }}>{actions}</div>}

      {open && (
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, marginBottom: 12, display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(3,1fr)", gap: 14 }}>
          <Group label="Trục thời gian (X)">
            <Seg value={c.axis} onChange={(v) => setChart({ axis: v })} options={[{ value: "aligned", label: "Căn theo T0" }, { value: "calendar", label: "Theo lịch" }]} />
          </Group>
          <Group label="Chiều cao">
            <Seg value={c.size} onChange={(v) => setChart({ size: v })} options={[{ value: "S", label: "Nhỏ" }, { value: "M", label: "Vừa" }, { value: "L", label: "Lớn" }]} />
          </Group>
          <Group label="Trung bình trượt">
            <Seg value={c.ma} onChange={(v) => setChart({ ma: v })} options={[{ value: 0, label: "Tắt" }, { value: 3, label: "3 kỳ" }, { value: 6, label: "6 kỳ" }]} />
          </Group>
          <Group label="Bảng màu">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.entries(PALETTES).map(([k, p]) => (
                <button
                  key={k}
                  onClick={() => setChart({ palette: k })}
                  title={p.name}
                  style={{ border: `2px solid ${c.palette === k ? T.navy : T.border}`, background: T.white, borderRadius: 8, padding: "4px 6px", cursor: "pointer", display: "flex", gap: 2 }}
                >
                  {p.colors.slice(0, 4).map((col) => (
                    <span key={col} style={{ width: 10, height: 14, background: col, borderRadius: 2 }} />
                  ))}
                </button>
              ))}
            </div>
          </Group>
          <div style={{ gridColumn: mob ? undefined : "span 2" }}>
            <Group label="Hiển thị">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
                <Toggle label="Làm mượt đường" checked={c.smooth} onChange={(v) => setChart({ smooth: v })} />
                <Toggle label="Điểm dữ liệu" checked={c.dots} onChange={(v) => setChart({ dots: v })} />
                <Toggle label="Nhãn số" checked={c.labels} onChange={(v) => setChart({ labels: v })} />
                <Toggle label="Vùng giai đoạn" checked={c.bands} onChange={(v) => setChart({ bands: v })} />
                <Toggle label="TB từng giai đoạn" checked={c.phaseAvg} disabled={series.length !== 1} onChange={(v) => setChart({ phaseAvg: v })} />
                <Toggle label="Đường xu hướng" checked={c.trend} onChange={(v) => setChart({ trend: v })} />
                <Toggle label="Đường mục tiêu" checked={c.target} onChange={(v) => setChart({ target: v })} />
                <Toggle label="Thanh thu phóng" checked={c.brush} onChange={(v) => setChart({ brush: v })} />
              </div>
            </Group>
          </div>
          <div>
            <button onClick={resetChart} style={btn(false)}>↺ Mặc định</button>
          </div>
        </div>
      )}

      <div ref={boxRef}>
        <ResponsiveContainer width="100%" height={h}>
          <ComposedChart data={data} margin={{ top: 14, right: mob ? 10 : 18, left: 0, bottom: 4 }}>
            <defs>
              {series.map((se, i) => (
                <linearGradient key={se.key} id={`g-${uid}-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colorFor(se, i)} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={colorFor(se, i)} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="#EEF2F7" vertical={false} />
            {c.bands &&
              bands.map((b) => (
                <ReferenceArea
                  key={b.phase + b.i1}
                  x1={b.x1}
                  x2={b.x2}
                  fill={BAND[b.phase]}
                  fillOpacity={1}
                  stroke="none"
                  label={{ value: PHASE_SHORT[b.phase], position: "insideTopLeft", fontSize: 10, fill: PT[b.phase], fontWeight: 700 }}
                />
              ))}
            <XAxis
              dataKey="x"
              tick={{ fontSize: 11, fill: T.slate }}
              tickLine={false}
              axisLine={{ stroke: T.border }}
              interval="preserveStartEnd"
              minTickGap={14}
              angle={rot ? -30 : 0}
              textAnchor={rot ? "end" : "middle"}
              height={rot ? 50 : 28}
            />
            <YAxis
              width={mob ? 38 : 50}
              tick={{ fontSize: 11, fill: T.slate }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => fmt(v)}
              domain={c.type === "line" ? ["auto", "auto"] : [0, "auto"]}
            />
            <Tooltip
              content={<ChartTooltip metric={metric} />}
              cursor={c.type === "bar" ? { fill: "rgba(148,163,184,0.15)" } : { stroke: T.muted, strokeDasharray: "3 3" }}
            />
            {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />}

            {series.map((se, i) => {
              const col = colorFor(se, i);
              if (c.type === "bar")
                return <Bar key={se.key} dataKey={se.key} name={se.name} fill={col} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} label={labelProp} />;
              if (c.type === "area")
                return (
                  <Area key={se.key} dataKey={se.key} name={se.name} type={curve} stroke={col} strokeWidth={2.4} fill={`url(#g-${uid}-${i})`} connectNulls dot={dotProp} activeDot={{ r: 5 }} isAnimationActive={false} label={labelProp} />
                );
              return (
                <Line key={se.key} dataKey={se.key} name={se.name} type={curve} stroke={col} strokeWidth={2.6} connectNulls dot={dotProp} activeDot={{ r: 6 }} isAnimationActive={false} label={labelProp} />
              );
            })}

            {c.phaseAvg && series.length === 1 &&
              bands.map((b) => (
                <Line key={"pa" + b.phase + b.i1} dataKey={"__pa_" + b.phase} name={`TB ${PHASE_SHORT[b.phase]}`} stroke={PC[b.phase]} strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={false} legendType="none" isAnimationActive={false} />
              ))}
            {c.ma > 0 &&
              series.map((se, i) => (
                <Line key={se.key + "ma"} dataKey={se.key + "__ma"} name={`${series.length > 1 ? se.name + " · " : ""}TB trượt ${c.ma}`} stroke={colorFor(se, i)} strokeWidth={2} strokeDasharray="2 4" dot={false} activeDot={false} connectNulls legendType="none" isAnimationActive={false} />
              ))}
            {c.trend &&
              series.map((se, i) => (
                <Line key={se.key + "tr"} dataKey={se.key + "__tr"} name="Xu hướng" stroke={colorFor(se, i)} strokeWidth={1.6} strokeOpacity={0.7} strokeDasharray="8 4" dot={false} activeDot={false} connectNulls legendType="none" isAnimationActive={false} />
              ))}
            {c.target && target != null && (
              <ReferenceLine y={target} stroke={T.red} strokeDasharray="6 4" label={{ value: `Mục tiêu ${fmt(target)}${metric.unit === "%" ? "%" : ""}`, position: "insideTopRight", fill: T.red, fontSize: 11 }} />
            )}
            {c.brush && <Brush dataKey="x" height={22} stroke={T.blue} fill="#fff" travellerWidth={8} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>
        {c.axis === "aligned"
          ? "Trục X: số tháng so với T0 (tháng bắt đầu đào tạo). Ví dụ T+6 = 6 tháng sau khi vào lớp."
          : "Trục X: kỳ theo lịch."}
        {metric.dir < 0 && " Tiêu chí này thấp hơn là tốt."}
        {c.ma > 0 && ` Đường chấm = trung bình trượt ${c.ma} kỳ.`}
      </div>
    </Card>
  );
}

const btn = (on: boolean): any => ({
  border: `1px solid ${on ? T.navy : T.border}`,
  background: on ? T.navy : T.white,
  color: on ? T.white : T.text,
  borderRadius: 8,
  padding: "6px 11px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
});

