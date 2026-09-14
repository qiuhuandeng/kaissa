const assert = require("node:assert/strict");
const test = require("node:test");
const report = require("../shared/report-pages.js");
const base = { start: "2026-05-01", end: "2026-05-07", status: "有效", view: "orders", planStart: "2026-05-08", planEnd: "2027-01-03" };
const query = (extra = {}) => report.query({ ...base, ...extra });

test("订单净值按销售内容计金额、按订单去重", () => {
  assert.equal(report.sum(query()), 54000);
  assert.equal(report.orderCount(query()), 5);
  assert.equal(query().length, 6);
  assert.equal(report.sum(query({ order: "O03" })), 5000);
});
test("生效增减不再次扣除退款支付", () => {
  const rows = query({ view: "changes" });
  assert.equal(report.sum(rows.filter(r => r.amount > 0)), 62000);
  assert.equal(report.sum(rows.filter(r => r.amount < 0)), -9000);
  assert.equal(report.sum(rows), 53000);
  assert.equal(rows.filter(r => r.order === "O04").length, 1);
});
test("实际完成含上年订单与部分完成，未来安排独立", () => {
  assert.equal(report.sum(query({ view: "actual" })), 56000);
  assert.equal(report.sum(query({ view: "future" })), 18000);
  assert.equal(report.sum(query({ start: "2025-01-01" })), 74000);
  assert.equal(report.sum(query({ view: "actual", order: "O09" })), 4000);
  assert.equal(report.sum(query({ view: "future", order: "O09" })), 6000);
  assert.equal(report.sum(query({ view: "actual", confirmYear: "2025" })), 15000);
  assert.equal(report.sum(query({ view: "future", finishYear: "2027" })), 9000);
});
test("销售责任、产品责任与主渠道互斥汇总", () => {
  assert.deepEqual(report.groups(query(), "company").map(r => r.amount), [35000, 19000]);
  assert.deepEqual(report.groups(query(), "productOrg").map(r => r.amount).sort((a, b) => a - b), [25000, 29000]);
  assert.deepEqual(report.groups(query(), "channel").map(r => r.amount), [15000, 29000, 10000]);
  assert.equal(report.sum(query({ company: "A", productOrg: "B" })), 10000);
});
test("取消可查但净值为零；预留不产生有效成交", () => {
  assert.equal(query({ status: "已取消" }).length, 1);
  assert.equal(report.sum(query({ status: "已取消" })), 0);
  assert.equal(query({ status: "未确认" })[0].amount, null);
  assert.equal(query({ view: "actual", order: "O05" }).length, 0);
});
test("缺失收入成本不是零，不生成毛利或完成后调整", () => {
  assert.ok(query({ view: "financial" }).every(r => r.businessRevenue == null && r.cost == null));
  assert.equal(query({ view: "actual", settlement: "已结算" }).length, 0);
  assert.equal(query({ view: "adjustments" }).length, 0);
});
test("管理月跨月跨年边界；任务分母必须有效", () => {
  assert.equal(report.managementMonth("2026-05-25"), "2026-05");
  assert.equal(report.managementMonth("2026-05-26"), "2026-06");
  assert.equal(report.managementMonth("2026-12-26"), "2027-01");
  assert.equal(report.sum(query({ view: "actual", calendar: "management", month: "2026-05" })), 56000);
  assert.equal(report.percent(54000, 70000).toFixed(2), "77.14");
  assert.equal(report.percent(56000, 70000), 80);
  assert.equal(report.percent(54000, 0), null);
  assert.equal(report.percent(54000, null), null);
});
test("导出转义公式及引号，负金额保持数字", () => {
  assert.equal(report.csvCell('=SUM(A1)'), '"\'=SUM(A1)"');
  assert.equal(report.csvCell('产品"一"'), '"产品""一"""');
  assert.equal(report.csvCell(-1000), '"-1000"');
});
