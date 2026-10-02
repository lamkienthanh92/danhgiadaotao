import { useCallback, useRef, useState } from "react";
import { METRICS } from "../lib/metrics";
import { readExcel } from "../lib/readExcel";
import { makeDemo } from "../lib/demo";
import type { ParseResult } from "../lib/parse";
import { T } from "../theme";

export function UploadModal({
  onClose, onLoad,
}: {
  onClose: () => void;
  onLoad: (info: { staff: any; name: string; res: Partial<ParseResult> }) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const process = useCallback(
    async (file?: File) => {
      if (!file) return;
      if (!file.name.match(/\.xlsx?$/i)) { setError("Chỉ chấp nhận file .xlsx"); return; }
      setLoading(true);
      setError(null);
      try {
        const buf = await file.arrayBuffer();
        const res = readExcel(new Uint8Array(buf));
        onLoad({ staff: res.staff, name: file.name, res });
      } catch (e: any) {
        setError(e.message || "Không đọc được file");
      } finally {
        setLoading(false);
      }
    },
    [onLoad]
  );

  const useDemo = () => {
    const staff = makeDemo();
    onLoad({ staff, name: "Dữ liệu mẫu", res: { found: METRICS.length, missing: [], empty: [] } });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div
        style={{ background: T.white, borderRadius: 16, padding: "min(32px, 5vw)", width: "min(560px, 94vw)", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", position: "relative" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: T.muted }}>✕</button>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.navy, marginBottom: 4 }}>Tải lên file dữ liệu đánh giá</div>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 18 }}>
          File Excel theo bộ <b>9 tiêu chí</b> đánh giá bác sĩ khối ngoại sau đào tạo chuyên môn. File được đọc ngay trên trình duyệt, không gửi đi đâu.
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); process(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current?.click()}
          style={{ border: `2px dashed ${drag ? T.blue : T.border}`, borderRadius: 12, padding: "28px 20px", textAlign: "center", cursor: "pointer", background: drag ? T.blueL : T.bg, marginBottom: 12 }}
        >
          <div style={{ fontSize: 34, marginBottom: 6 }}>📊</div>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 4 }}>Kéo thả file Excel vào đây</div>
          <div style={{ fontSize: 13, color: T.muted }}>hoặc bấm để chọn file .xlsx</div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={(e) => process(e.target.files?.[0])} />
        </div>

        <button
          onClick={useDemo}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.white, color: T.navy, fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 14 }}
        >
          ▶ Xem thử với dữ liệu mẫu (giả lập)
        </button>

        {loading && <div style={{ textAlign: "center", color: T.blue, fontWeight: 600, marginBottom: 12 }}>⏳ Đang đọc file...</div>}
        {error && <div style={{ background: T.redL, color: T.red, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>❌ {error}</div>}

        <div style={{ background: T.slateL, borderRadius: 10, padding: "12px 16px", fontSize: 12 }}>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 6 }}>📋 Các sheet được nhận diện:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "3px 14px", color: T.slate, lineHeight: 1.6 }}>
            {METRICS.map((m, i) => <div key={m.key}>{i + 1}. {m.full}</div>)}
          </div>
          <div style={{ color: T.slate, marginTop: 8, lineHeight: 1.7 }}>
            · Cột: Mã NV, Xưng hô, Họ tên, Khoa phòng, Tên lớp, Từ ngày, Đến ngày + các mốc thời gian (tháng / 6 tháng / năm)
            <br />· Sheet nào chưa có số liệu sẽ hiển thị "–"
          </div>
        </div>
      </div>
    </div>
  );
}
