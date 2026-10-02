import type { CSSProperties, ReactNode } from "react";
import { T, PC } from "../theme";
import type { Phase } from "../theme";
import { METRICS } from "../lib/metrics";
import type { MetricDef } from "../lib/metrics";
import { useIsMobile } from "../hooks/useIsMobile";

export function Card({ children, style = {} }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: T.white, borderRadius: 12, border: `1px solid ${T.border}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)", ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, sub, right }: { children: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{children}</div>
        {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export function KpiCards({ items }: { items: { label: string; value: ReactNode; sub?: ReactNode; color?: string; accent?: string }[] }) {
  const mob = useIsMobile();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: mob ? "repeat(2,1fr)" : `repeat(${items.length},1fr)`,
        gap: mob ? 8 : 12,
        marginBottom: mob ? 14 : 20,
      }}
    >
      {items.map(({ label, value, sub, color = T.text, accent }) => (
        <div key={label} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: mob ? "12px 14px" : "16px 18px", position: "relative", overflow: "hidden" }}>
          {accent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent }} />}
          <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600, marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: mob ? 22 : 26, fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{sub}</div>}
        </div>
      ))}
    </div>
  );
}

export function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{ fontSize: 11, background: bg, color, padding: "2px 10px", borderRadius: 20, fontWeight: 700, whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const cfg: any = {
    completed: { label: "Đã hoàn thành", bg: T.tealL, color: T.teal },
    ongoing: { label: "Đang học", bg: T.amberL, color: T.amber },
    upcoming: { label: "Chưa bắt đầu", bg: T.blueL, color: T.blue },
    unknown: { label: "–", bg: T.slateL, color: T.slate },
  }[status];
  return <Badge text={cfg.label} color={cfg.color} bg={cfg.bg} />;
}

export function PhaseDot({ phase }: { phase: Phase }) {
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: PC[phase], marginRight: 5 }} />;
}

// Mũi tên theo dấu của số, màu theo chiều "tốt/xấu" của tiêu chí
export function Delta({ val, dir = 1 }: { val: number | null | undefined; dir?: number }) {
  if (val === null || val === undefined) return <span style={{ color: T.muted, fontSize: 12 }}>–</span>;
  const good = val * dir >= 0;
  return (
    <span style={{ color: good ? T.teal : T.red, fontWeight: 700, fontSize: 12, background: good ? T.tealL : T.redL, padding: "2px 8px", borderRadius: 12, whiteSpace: "nowrap" }}>
      {val >= 0 ? "▲" : "▼"} {Math.abs(val)}%
    </span>
  );
}

const AVATAR_BG = ["#EBF3FD", "#E3F5F2", "#FEF3E2", "#F3EDFD", "#FDE8E8", "#E8F5E9"];
const AVATAR_FG = ["#1A6BC4", "#0D8E7A", "#D97706", "#7C3AED", "#DC2626", "#2E7D32"];
export function Avatar({ name, size = 40, idx = 0 }: { name: string; size?: number; idx?: number }) {
  const initials = (name || "??").replace(/\(.*?\)/g, "").trim().split(" ").slice(-2).map((w) => w[0] || "").join("").toUpperCase().slice(0, 2);
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: AVATAR_BG[idx % 6], color: AVATAR_FG[idx % 6], display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700 }}>
      {initials}
    </div>
  );
}

// Nút chọn kiểu phân đoạn
export function Seg({ options, value, onChange }: { options: { value: any; label: string }[]; value: any; onChange: (v: any) => void }) {
  return (
    <div style={{ display: "inline-flex", background: T.slateL, borderRadius: 8, padding: 2, gap: 2, maxWidth: "100%" }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            style={{
              border: "none", cursor: "pointer", borderRadius: 6, padding: "5px 11px", fontSize: 12, whiteSpace: "nowrap",
              fontWeight: on ? 700 : 500, background: on ? T.white : "transparent", color: on ? T.navy : T.slate,
              boxShadow: on ? "0 1px 2px rgba(0,0,0,0.12)" : "none",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: disabled ? T.muted : T.text, cursor: disabled ? "not-allowed" : "pointer", userSelect: "none" }}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: T.blue, width: 15, height: 15, margin: 0 }} />
      {label}
    </label>
  );
}

export function Chip({ children, active, onClick, color }: { children: ReactNode; active?: boolean; onClick?: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
        fontWeight: active ? 700 : 500, background: active ? (color || T.navy) : T.white, color: active ? T.white : T.text,
        border: `1px solid ${active ? (color || T.navy) : T.border}`,
      }}
    >
      {children}
    </button>
  );
}

// Dãy nút chọn tiêu chí (cuộn ngang trên điện thoại)
export function MetricPills({ list = METRICS, active, onChange }: { list?: MetricDef[]; active: string; onChange: (k: string) => void }) {
  const mob = useIsMobile();
  return (
    <div style={mob ? { display: "flex", gap: 6, overflowX: "auto", width: "100%", paddingBottom: 6 } : { display: "flex", gap: 6, flexWrap: "wrap" }}>
      {list.map((m) => (
        <Chip key={m.key} active={active === m.key} onClick={() => onChange(m.key)}>
          {m.icon} {m.label}
        </Chip>
      ))}
    </div>
  );
}

export function Sparkline({ values, color = T.blue, w = 84, h = 26 }: { values: number[]; color?: string; w?: number; h?: number }) {
  if (!values || values.length < 2) return <span style={{ color: T.muted, fontSize: 12 }}>–</span>;
  const min = Math.min(...values), max = Math.max(...values);
  const rng = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 4) + 2, h - 3 - ((v - min) / rng) * (h - 6)]);
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={2.6} fill={color} />
    </svg>
  );
}

export function Empty({ text }: { text: string }) {
  return <div style={{ padding: "40px 12px", textAlign: "center", color: T.muted, fontSize: 13 }}>{text}</div>;
}

export function Bullets({ items, color = T.blue }: { items: string[]; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((t, i) => (
        <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, lineHeight: 1.5, color: T.text }}>
          <span style={{ color, flexShrink: 0 }}>●</span>
          <span>{t}</span>
        </div>
      ))}
    </div>
  );
}
