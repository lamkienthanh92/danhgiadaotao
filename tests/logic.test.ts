import { test } from "node:test";
import assert from "node:assert/strict";
import { parseWorkbook, periodLabel } from "../src/lib/parse";
import { METRICS, METRIC_BY_KEY } from "../src/lib/metrics";
import {
  phaseStats, effect, statusOf, staffPoints, buildRows, meanSeries, staffSummary,
  movingAvg, trendLine, parseDate, pct, completeness, trendLabel, metricAggregate,
} from "../src/lib/stats";
import { staffInsights, hospitalInsights } from "../src/lib/insights";
import { makeDemo } from "../src/lib/demo";

const serial = (y: number, m: number) => Date.UTC(y, m - 1, 1) / 86400000 + 25569;

// Sheet theo tháng: 09/2019 → 12/2020 (16 tháng), NV vào lớp 09/2020 - ra lớp 08/2022
const monthsRow: any[] = [null, null, null, null, null, null, null];
const vals: any[] = ["A1", "Ông", "Nguyễn A", "Khoa Ngoại tổng hợp", "CKI", serial(2020, 9), serial(2022, 8)];
for (let i = 0; i < 16; i++) {
  const y = 2019 + Math.floor((8 + i) / 12), m = ((8 + i) % 12) + 1;
  monthsRow.push(serial(y, m));
  vals.push(i < 12 ? 100 : 50); // trước: 100, sau khi vào lớp: 50
}
const examRows = [["Năng suất khám bệnh ngoại trú"], ["Mã nhân viên", "Xưng hô"], monthsRow, vals];

// Sheet biến chứng theo 6 tháng (nhãn text) — thấp hơn là tốt
const compPeriods = ["09/2019-02/2020", "03/2020-08/2020", "09/2020-02/2021", "03/2021-08/2021", "09/2021-02/2022", "03/2022-08/2022", "09/2022-02/2023"];
const compRows = [
  ["Tỷ lệ biến chứng phẫu thuật"],
  [null, null, null, null, null, null, null, ...compPeriods],
  ["A1", "Ông", "Nguyễn A", "Khoa Ngoại tổng hợp", "CKI", serial(2020, 9), serial(2022, 8), 8, 8, 6, 5, 4, 4, 4],
  ["A2", "Bà", "Trần B", "Khoa Ngoại tổng hợp", "CKI", serial(2020, 9), serial(2022, 8)], // chưa có số liệu
];

const wb = parseWorkbook({ "Số lượt khám bệnh": examRows, "Tỷ lệ biến chứng phẫu thuật": compRows, "Sheet lạ": [[1]] });

test("nhận diện sheet & đọc nhân viên", () => {
  assert.equal(wb.found, 2);
  assert.equal(wb.sheetMap.exam, "Số lượt khám bệnh");
  assert.equal(wb.sheetMap.comp, "Tỷ lệ biến chứng phẫu thuật");
  assert.equal(wb.missing.length, 7);
  assert.equal(Object.keys(wb.staff).length, 2);
  const a = wb.staff["A1"];
  assert.equal(a.from, "09/2020");
  assert.equal(a.to, "08/2022");
  assert.equal(Object.keys(a.metrics.exam).length, 16);
  assert.equal(a.slots.exam, 16);
  assert.equal(a.slots.comp, 7);
  assert.equal(Object.keys(a.metrics.comp).length, 7);
  assert.equal(Object.keys(wb.staff["A2"].metrics.comp).length, 0);
  assert.equal(wb.staff["A2"].slots.comp, 7);
});

test("nhãn kỳ", () => {
  assert.equal(periodLabel(serial(2019, 9)), "09/2019");
  assert.equal(periodLabel("9/2019 - 2/2020"), "09/2019-02/2020");
  assert.equal(periodLabel("abc"), null);
});

test("chia giai đoạn trước/trong/sau", () => {
  const a = wb.staff["A1"];
  const s = phaseStats(a.metrics.exam, parseDate(a.from), parseDate(a.to));
  assert.equal(s.before, 100);
  assert.equal(s.nBefore, 12);
  assert.equal(s.during, 50);
  assert.equal(s.after, null); // dữ liệu chỉ tới 12/2020
  const c = phaseStats(a.metrics.comp, parseDate(a.from), parseDate(a.to));
  assert.equal(c.before, 8);        // 2 kỳ đầu kết thúc trước 09/2020
  assert.equal(c.nBefore, 2);
  assert.equal(c.after, 4);         // kỳ 09/2022-02/2023
  assert.equal(c.nAfter, 1);
});

test("chiều tốt/xấu: biến chứng giảm = cải thiện", () => {
  const comp = METRIC_BY_KEY.comp, exam = METRIC_BY_KEY.exam;
  assert.equal(effect(comp, 8, 4), 0.5);
  assert.equal(effect(exam, 100, 50), -0.5);
  assert.equal(effect(comp, 0, 0), 0);
  assert.equal(effect(comp, 0, 3), -1);
  assert.equal(effect(exam, null, 5), null);
  const a = wb.staff["A1"];
  const s = phaseStats(a.metrics.comp, parseDate(a.from), parseDate(a.to));
  assert.equal(statusOf(comp, s, 0.1).key, "good");
  assert.equal(statusOf(exam, { before: 100, during: 50, after: null, nBefore: 1, nDuring: 1, nAfter: 0 }, 0.1).key, "training");
  assert.equal(pct(100, 50), -50);
  assert.equal(pct(0, 5), null);
});

test("điểm theo trục căn T0 và theo lịch", () => {
  const a = wb.staff["A1"];
  const al = staffPoints(a, "exam", "aligned");
  assert.equal(al[0].x, "T-12");
  assert.equal(al[0].phase, "before");
  assert.equal(al.find((p) => p.sort === 0)!.x, "T0");
  assert.equal(al.find((p) => p.sort === 0)!.phase, "during");
  const cal = staffPoints(a, "exam", "calendar");
  assert.equal(cal[0].x, "09/2019");
  const h = staffPoints(a, "comp", "aligned");
  assert.deepEqual(h.map((p) => p.x), ["T-12", "T-6", "T0", "T+6", "T+12", "T+18", "T+24"]);
});

test("gộp dòng & trung bình nhiều NV", () => {
  const a = wb.staff["A1"];
  const rows = buildRows([{ key: "s0", pts: staffPoints(a, "exam", "aligned") }]);
  assert.equal(rows.length, 16);
  assert.equal(rows[0].__phase, "before");
  assert.equal(rows[rows.length - 1].__phase, "during");
  const noPhase = buildRows([{ key: "s0", pts: staffPoints(a, "exam", "aligned") }], { phase: false });
  assert.equal(noPhase[0].__phase, undefined);
  const copy = { ...a, id: "A9", metrics: { ...a.metrics, exam: Object.fromEntries(Object.entries(a.metrics.exam).map(([k, v]) => [k, v + 20])) } };
  const m = meanSeries([a, copy], METRIC_BY_KEY.exam, "aligned");
  assert.equal(m[0].v, 110);
  assert.equal(meanSeries([], METRIC_BY_KEY.exam, "aligned").length, 0);
});

test("tổng hợp nhân viên & nhận xét", () => {
  const sum = staffSummary(wb.staff["A1"], 0.1);
  assert.equal(sum.rows.length, METRICS.length);
  assert.equal(sum.n, 1);   // chỉ biến chứng có đủ trước/sau
  assert.equal(sum.up, 1);
  assert.equal(sum.down, 0);
  assert.equal(Math.round(sum.score!), 50);
  const txt = staffInsights(sum, {}, 0.1).join(" | ");
  assert.match(txt, /1\/1 tiêu chí cải thiện/);
  assert.match(txt, /Chưa có số liệu/);
  const empty = staffSummary(wb.staff["A2"], 0.1);
  assert.equal(empty.n, 0);
  assert.equal(empty.score, null);
  assert.ok(hospitalInsights(Object.values(wb.staff), 0.1).length >= 2);
  const c = completeness(Object.values(wb.staff));
  assert.equal(c.slots, 16 + 7 + 7);
  assert.equal(c.filled, 16 + 7);
  assert.equal(metricAggregate(Object.values(wb.staff), METRIC_BY_KEY.comp).n, 1);
});

test("trung bình trượt, đường xu hướng, nhãn xu hướng", () => {
  assert.deepEqual(movingAvg([1, 2, 3, null, 5], 2), [1, 1.5, 2.5, null, 5]);
  assert.deepEqual(trendLine([1, 2, 3, 4]), [1, 2, 3, 4]);
  assert.deepEqual(trendLine([1]), [null]);
  const up = trendLabel(METRIC_BY_KEY.exam, [10, 12, 14, 16]);
  assert.equal(up!.good, true);
  const bad = trendLabel(METRIC_BY_KEY.comp, [2, 4, 6, 8]);
  assert.equal(bad!.good, false);
  assert.equal(trendLabel(METRIC_BY_KEY.exam, [5, 5, 5])!.arrow, "→");
  assert.equal(trendLabel(METRIC_BY_KEY.exam, [5, 6]), null);
});

test("dữ liệu mẫu đủ 9 tiêu chí", () => {
  const demo = makeDemo();
  const list = Object.values(demo);
  assert.equal(list.length, 7);
  list.forEach((d) => METRICS.forEach((m) => assert.ok(Object.keys(d.metrics[m.key]).length > 0, `${d.id} ${m.key}`)));
  const s = staffSummary(list[0], 0.1);
  assert.ok(s.n >= 5);
  list.forEach((d) => d.slots && METRICS.forEach((m) => assert.ok(d.slots[m.key] >= Object.keys(d.metrics[m.key]).length)));
});
