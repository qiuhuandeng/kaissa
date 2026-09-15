const assert = require("node:assert/strict");
const test = require("node:test");
const report = require("../shared/report-pages.js");
const base = { view: "actual", start: "2026-05-01", end: "2026-05-07", planStart: "2026-05-08", planEnd: "2027-01-03" };
const query = (extra = {}, records) => report.returnDetailQuery({ ...base, ...extra }, records);
const sample = extra => ({ ...report.completions[0], ...extra });

test("回团补充保持四页金额基线及分阶段分配，不修改订单归属", () => {
  assert.equal(report.sum(query()), 56000);
  assert.equal(query().length, 6);
  assert.equal(report.orderCount(query()), 6);
  assert.equal(report.sum(query({ view: "future" })), 18000);
  assert.equal(report.sum(query({ order: "O09" })), 4000);
  assert.equal(report.sum(query({ view: "future", order: "O09" })), 6000);
  assert.equal(report.sum(query({ confirmYear: "2025" })), 15000);
  assert.equal(report.sum(report.query({ ...base, view: "orders" })), 54000);
  assert.equal(report.sum(report.query({ ...base, view: "changes" })), 53000);
  assert.equal(report.items[0].owner, null);
});

test("A01/A02 回团引用订单发生时归属，销售产品签约责任分别核对", () => {
  const row = query({ company: "A", productCompany: "B" })[0];
  assert.equal(row.amount, 10000);
  assert.equal(row.contractCompany, "C公司（演示）");
  assert.equal(row.salesLeader, report.orderFacts(report.items[0]).salesLeader);
  const historical = sample({ ownershipDetails: { salesLeader: "甲" }, currentSalesLeader: "乙" });
  assert.equal(query({ salesLeader: "甲" }, [historical]).length, 1);
  assert.equal(query({ salesLeader: "乙" }, [historical]).length, 0);
  assert.equal(report.returnFieldValue(row, "financeCompany"), "未提供确认记录");
});

test("共同分区、缺失归属筛选在实际与未来独立可用", () => {
  assert.equal(query({ geographyZone: "欧洲", managementZone: "海岛经营区（演示）" }).length, 0);
  assert.equal(query({ geographyZone: "欧洲" })[0].destinations.length, 2);
  assert.equal(report.sum(query({ geographyZone: "__missing" })), 24000);
  assert.equal(report.sum(query({ view: "future", salesLeader: "__missing" })), 9000);
  assert.equal(report.sum(query({ dataQuality: "classification" })), 56000);
});

test("A07 计划到期未确认仍是未完成安排，不进入实际或财务资料", () => {
  const rows = [sample({ actual: "", planned: "2026-05-05", managementMonth: "2026-05" })];
  assert.equal(query({}, rows).length, 0);
  assert.equal(query({ view: "financial" }, rows).length, 0);
  const future = query({ view: "future", planStart: "2026-05-01", planEnd: "2026-05-07", settlement: "已结算" }, rows);
  assert.equal(future.length, 1);
  assert.equal(future[0].managementMonth, null);
  assert.ok(report.completions.filter(r => !r.actual).every(r => r.managementMonth === null));
});

test("A08 更正按当前实际日期查询，原日期与确认时间独立", () => {
  const rows = [sample({ planned: "2026-05-05", actual: "2026-05-06", originalActual: "2026-05-05", confirmedAt: "2026-05-07 10:00", correctionReason: "验收日期更正" })];
  assert.equal(query({ start: "2026-05-05", end: "2026-05-05" }, rows).length, 0);
  const row = query({ start: "2026-05-06", end: "2026-05-06" }, rows)[0];
  assert.equal(row.managementMonth, "2026-05");
  assert.equal(row.originalActual, "2026-05-05");
  assert.equal(row.confirmedAt, "2026-05-07 10:00");
  assert.equal(row.completionBasis, "演示回团确认记录");
});

test("管理月从实际日派生，不用旧管理月或计划日，实际数据不越截止", () => {
  const row = sample({ planned: "2026-04-25", actual: "2026-04-26", managementMonth: "2026-04" });
  assert.equal(query({ calendar: "management", month: "2026-05" }, [row]).length, 1);
  assert.equal(query({ calendar: "management", month: "2026-04" }, [row]).length, 0);
  assert.equal(query({ calendar: "management", month: "2026-06" }, [sample({ actual: "2026-05-26" })]).length, 0);
  assert.equal(report.managementMonth(null), null);
});

test("A09 已结算不等于确认收入，团期成本未分配不复制", () => {
  const records = [sample({ settlement: "已结算", settlementNo: "SET-DEMO", settlementDate: "2026-05-07", tourCost: 9000, cost: null, costState: "未分配到完成记录" })];
  const row = query({ view: "financial", settlement: "已结算", incomeStatus: "未提供确认记录" }, records)[0];
  assert.equal(row.financeRevenue, null);
  assert.equal(row.incomeStatus, "未提供确认记录");
  assert.equal(row.costStatus, "未提供确认记录");
  assert.equal(report.returnFieldValue(row, "cost"), "未分配到完成记录");
  assert.deepEqual(report.amountCoverage([row], "cost"), { value: null, unknown: 0, unallocated: 1 });
  assert.equal(query({ settlement: "已结算" }, records).length, 1);
  assert.equal(query({ settlement: "待结算" }, records).length, 0);
});

test("财务资料按实际完成而非确认期间或残留管理月筛选", () => {
  const records = [sample({ incomeDate: "2026-06-01", incomePeriod: "2026-06", costPeriod: "2026-07" })];
  assert.equal(query({ view: "financial", calendar: "management", month: "2026-04" }, records).length, 1);
  const row = query({ view: "financial" }, records)[0];
  assert.equal(report.returnFieldValue(row, "incomePeriod"), "2026-06");
  assert.equal(report.returnFieldValue(row, "costPeriod"), "2026-07");
  assert.equal(query({ view: "financial", start: "2026-06-01", end: "2026-06-07" }, records).length, 0);
});

test("A06/A10 金额缺数、未分配、零值与税务结论分开", () => {
  const records = [sample({ amount: 4000 }), sample({ amount: null, amountState: "未分配到完成记录" })];
  const rows = query({}, records);
  assert.deepEqual(report.amountCoverage(rows), { value: 4000, unknown: 0, unallocated: 1 });
  assert.equal(report.returnFieldValue(rows[1], "amount"), "未分配到完成记录");
  assert.equal(report.amountCoverage([rows[1]]).value, null);
  assert.equal(report.returnFieldValue(sample({ cost: 0 }), "cost"), 0);
  assert.equal(report.returnFieldValue(sample({ supply: "外部采购", taxAmount: 0 }), "taxTreatment"), "待确认");
  assert.equal(report.returnFieldValue(sample({ supply: "外部采购" }), "incomeMethod"), "待确认");
  assert.equal(report.quantitySummary([sample({ quantity: 2, unit: "张" }), sample({ quantity: 3, unit: "间夜" })]), "2 张、3 间夜");
});

test("缺确认结果不伪造收入毛利，完成后调整独立列示", () => {
  const rows = query({ view: "financial", incomeStatus: "未提供确认记录", costStatus: "未提供确认记录" });
  assert.equal(report.sum(rows), 56000);
  assert.equal(report.amountCoverage(rows, "financeRevenue").value, null);
  assert.equal(report.amountCoverage(rows, "cost").unknown, 6);
  const adjustments = query({ view: "adjustments" });
  assert.equal(adjustments.length, 1);
  assert.equal(adjustments[0].adjustmentStatus, "已确认");
  assert.equal(report.returnFieldValue(rows[0], "originalSettlement"), "未提供记录");
});
