import { useCallback, useEffect, useState } from "react";
import type { Staff } from "./lib/parse";
import { useIsMobile } from "./hooks/useIsMobile";
import { T } from "./theme";
import { UploadModal } from "./components/UploadModal";
import { OverviewView } from "./views/OverviewView";
import { DeptView } from "./views/DeptView";
import { StaffView } from "./views/StaffView";
import { CompareView } from "./views/CompareView";
import { DataView } from "./views/DataView";
import { METRICS } from "./lib/metrics";

const NAV = [
  { key: "overview", label: "Tổng quan", icon: "◈" },
  { key: "dept", label: "Theo khoa", icon: "▦" },
  { key: "staff", label: "Nhân viên", icon: "◉" },
  { key: "compare", label: "So sánh", icon: "⇄" },
  { key: "data", label: "Dữ liệu", icon: "▤" },
];

export default function App() {
  const mob = useIsMobile();
  const [staff, setStaff] = useState<Record<string, Staff> | null>(null);
  const [view, setView] = useState("overview");
  const [selDept, setSelDept] = useState<string | null>(null);
  const [selStaff, setSelStaff] = useState<string | null>(null);
  const [selMetric, setSelMetric] = useState("exam");
  const [showUpload, setShowUpload] = useState(false);
  const [fileInfo, setFileInfo] = useState<any>(null);

  const handleLoad = useCallback(({ staff, name, res }: any) => {
    setStaff(staff);
    setFileInfo({ name, count: Object.keys(staff).length, found: res?.found ?? 0, missing: res?.missing ?? [], empty: res?.empty ?? [] });
    setView("overview");
    setSelDept(null);
    setSelStaff(null);
    setShowUpload(false);
  }, []);

  const openStaff = (id: string, key?: string) => {
    setSelStaff(id);
    if (key) setSelMetric(key);
    setView("staff");
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  const notices: string[] = fileInfo
    ? [
        fileInfo.missing.length ? `Không thấy sheet: ${fileInfo.missing.join("; ")}` : "",
        fileInfo.empty.length ? `Sheet chưa có số liệu: ${fileInfo.empty.join("; ")}` : "",
      ].filter(Boolean)
    : [];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", color: T.text, overflowX: "clip" }}>
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onLoad={handleLoad} />}

      <div style={{ background: T.navy, height: mob ? 52 : 56, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: mob ? "0 12px" : "0 24px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 16px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: mob ? 10 : 14, minWidth: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: "linear-gradient(135deg,#3B82F6,#10B981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff" }}>✦</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: T.white, fontWeight: 800, fontSize: mob ? 13 : 14, letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Bệnh viện Đa khoa Lãnh Binh Thăng</div>
            <div style={{ color: "#64A5FF", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {mob ? "Đánh giá BS khối ngoại sau đào tạo" : "Đánh giá bác sĩ khối ngoại sau đào tạo chuyên môn"}
            </div>
          </div>
        </div>

        <div
          style={
            mob
              ? { position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, background: T.navy, display: "flex", gap: 2, padding: "6px 6px calc(6px + env(safe-area-inset-bottom))", boxShadow: "0 -2px 16px rgba(0,0,0,0.25)" }
              : { display: "flex", gap: 4 }
          }
        >
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => setView(n.key)}
              style={{
                padding: mob ? "6px 2px" : "6px 16px", flex: mob ? 1 : undefined, borderRadius: 8, border: "none", cursor: "pointer",
                display: "flex", flexDirection: mob ? "column" : "row", alignItems: "center", gap: mob ? 1 : 6,
                fontSize: mob ? 11 : 13, fontWeight: view === n.key ? 700 : 400,
                background: view === n.key ? "rgba(255,255,255,0.15)" : "transparent",
                color: view === n.key ? T.white : "rgba(255,255,255,0.55)",
              }}
            >
              <span style={{ fontSize: mob ? 15 : 13 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {fileInfo && !mob && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              📄 {fileInfo.name} ({fileInfo.count} NV · {fileInfo.found}/{METRICS.length} chỉ số)
            </div>
          )}
          <button
            onClick={() => setShowUpload(true)}
            style={{
              background: fileInfo ? "rgba(16,185,129,0.2)" : "rgba(59,130,246,0.25)", color: fileInfo ? "#6EE7B7" : "#93C5FD",
              border: `1px solid ${fileInfo ? "rgba(16,185,129,0.4)" : "rgba(59,130,246,0.4)"}`,
              padding: mob ? "7px 12px" : "6px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
            }}
          >
            {fileInfo ? "↻ Đổi file" : mob ? "↑ Tải file" : "↑ Tải file dữ liệu"}
          </button>
        </div>
      </div>

      <div style={{ padding: mob ? "14px 12px 88px" : 24, maxWidth: 1320, margin: "0 auto" }}>
        {notices.length > 0 && (
          <div style={{ background: T.amberL, border: `1px solid ${T.amber}40`, color: "#92400E", borderRadius: 10, padding: "10px 14px", fontSize: 12, lineHeight: 1.6, marginBottom: 16 }}>
            {notices.map((n) => <div key={n}>⚠ {n}</div>)}
          </div>
        )}

        {!staff && view !== "data" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 18, textAlign: "center" }}>
            <div style={{ fontSize: 64 }}>📊</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.navy }}>Chưa có dữ liệu</div>
            <div style={{ fontSize: 15, color: T.muted, maxWidth: 480 }}>
              Tải lên file Excel theo bộ 9 tiêu chí để bắt đầu đánh giá hiệu quả đào tạo chuyên môn của bác sĩ khối ngoại.
            </div>
            <button onClick={() => setShowUpload(true)} style={{ background: T.navy, color: T.white, border: "none", padding: "12px 28px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 12px rgba(11,30,53,0.3)" }}>
              ↑ Tải file Excel / xem dữ liệu mẫu
            </button>
            <div style={{ fontSize: 12, color: T.muted, maxWidth: 560, lineHeight: 1.6 }}>Hỗ trợ 9 tiêu chí: {METRICS.map((m) => m.label).join(" · ")}</div>
          </div>
        ) : (
          <>
            {view === "overview" && staff && <OverviewView staff={staff} onOpen={openStaff} />}
            {view === "dept" && staff && <DeptView staff={staff} selectedDept={selDept} onSelectDept={setSelDept} onOpen={openStaff} />}
            {view === "staff" && staff && <StaffView staff={staff} selectedId={selStaff} selectedMetric={selMetric} onSelect={setSelStaff} onMetric={setSelMetric} />}
            {view === "compare" && staff && <CompareView staff={staff} />}
            {view === "data" && <DataView staff={staff} fileName={fileInfo?.name} />}
          </>
        )}
      </div>
    </div>
  );
}
