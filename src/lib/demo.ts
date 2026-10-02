import { METRICS, GRAN_LEN, emptyMetrics } from "./metrics";
import type { Staff } from "./parse";

// Dữ liệu MẪU (hoàn toàn giả lập) để xem thử giao diện khi chưa có file thật.
const pad2 = (n: number) => String(n).padStart(2, "0");
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const addM = (y: number, m: number, k: number): [number, number] => {
  const t = y * 12 + m + k;
  return [Math.floor(t / 12), ((t % 12) + 12) % 12];
};
const lab = (y: number, m: number) => `${pad2(m + 1)}/${y}`;

const BASE: Record<string, { base: number; noise: number; dec: number; max?: number }> = {
  exam: { base: 300, noise: 0.18, dec: 0 },
  auto: { base: 25, noise: 0.25, dec: 0 },
  join: { base: 25, noise: 0.25, dec: 0 },
  hard: { base: 2.4, noise: 0.1, dec: 1 },
  comp: { base: 6, noise: 0.3, dec: 1, max: 100 },
  death: { base: 1.5, noise: 0.4, dec: 1, max: 100 },
  los: { base: 7, noise: 0.12, dec: 1 },
  sci: { base: 1, noise: 0.5, dec: 0 },
  safe: { base: 86, noise: 0.03, dec: 1, max: 100 },
};

export function makeDemo(): Record<string, Staff> {
  const now = new Date();
  const ny = now.getFullYear(), nm = now.getMonth();
  const [oy, om] = addM(ny, nm, -10);
  const people = [
    { name: "Nguyễn Văn An", title: "Ông", dept: "Khoa Ngoại tổng hợp", spec: "Chuyên khoa I, Ngoại chung", fy: 2021, fm: 8, imp: 0.3 },
    { name: "Trần Thị Bình", title: "Bà", dept: "Khoa Ngoại tổng hợp", spec: "Chuyên khoa I, Ngoại tiết niệu", fy: 2021, fm: 11, imp: 0.15 },
    { name: "Lê Minh Cường", title: "Ông", dept: "Khoa Ngoại tổng hợp", spec: "Chuyên khoa II, Ngoại thần kinh", fy: 2022, fm: 2, imp: -0.12 },
    { name: "Phạm Quốc Dũng", title: "Ông", dept: "Khoa Ngoại chấn thương", spec: "Chuyên khoa I, Chấn thương chỉnh hình", fy: 2021, fm: 11, imp: 0.25 },
    { name: "Võ Thanh Em", title: "Bà", dept: "Khoa Ngoại chấn thương", spec: "Chuyên khoa I, Chấn thương chỉnh hình", fy: 2022, fm: 5, imp: 0.05 },
    { name: "Hoàng Gia Phúc", title: "Ông", dept: "Khoa Ngoại chấn thương", spec: "Thạc sĩ, Ngoại khoa", fy: 2022, fm: 8, imp: 0.2 },
    { name: "Đặng Hải Giang", title: "Ông", dept: "Khoa Ngoại chấn thương", spec: "Chuyên khoa I, Chấn thương chỉnh hình", fy: oy, fm: om, imp: 0.2 },
  ];
  const out: Record<string, Staff> = {};
  people.forEach((p, pi) => {
    const rand = rng(1000 + pi * 77);
    const [ty, tm] = addM(p.fy, p.fm, 23);
    const st: Staff = {
      id: `MAU.${String(pi + 1).padStart(4, "0")}`,
      title: p.title, name: `${p.name} (mẫu)`, dept: p.dept, specialty: p.spec,
      from: lab(p.fy, p.fm), to: lab(ty, tm), metrics: emptyMetrics(), slots: {},
    };
    METRICS.forEach((m) => {
      const len = GRAN_LEN[m.gran];
      const cfg = BASE[m.key];
      let slots = 0;
      for (let off = -12; off <= 36; off += len) {
        const [sy, sm] = addM(p.fy, p.fm, off);
        slots++;
        if (sy * 12 + sm > ny * 12 + nm) continue; // chưa tới
        const [ey, em] = addM(sy, sm, len - 1);
        const label = m.gran === "M" ? lab(sy, sm) : `${lab(sy, sm)}-${lab(ey, em)}`;
        const ramp = off < 0 ? 0 : off < 24 ? off / 24 : 1;
        let f = 1 + m.dir * p.imp * ramp;
        if (m.key === "exam" && off >= 0 && off < 24) f *= 0.75;
        const noise = 1 + (rand() - 0.5) * 2 * cfg.noise;
        let v = cfg.base * f * noise;
        if (m.key === "sci") v = Math.max(0, cfg.base * (1 + ramp * p.imp * 4) + (rand() - 0.5) * 1.6);
        v = Math.max(0, Math.min(cfg.max ?? Infinity, v));
        st.metrics[m.key][label] = +v.toFixed(cfg.dec);
      }
      st.slots[m.key] = slots;
    });
    out[st.id] = st;
  });
  return out;
}
