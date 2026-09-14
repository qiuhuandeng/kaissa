const assert = require("node:assert/strict");
const test = require("node:test");
const report = require("../shared/report-pages.js");
const base = { view: "orders", start: "2026-05-01", end: "2026-05-07", productView: "organizations", productLevel: "productOrg", structureBy: "type" };
const result = (extra = {}) => report.productReport({ ...base, ...extra });

test("产品责任与订单净值、实际回团明细一致", () => {
  assert.deepEqual(result().rows.map(r => r.amount), [29000, 25000]);
  assert.equal(report.sum(result().rows), 54000);
  assert.equal(report.sum(result({ view: "actual" }).rows), 56000);
  assert.equal(report.orderCount(result().facts), 5);
  for (const productLevel of ["productOrg", "division", "productCompany"]) {
    assert.equal(report.sum(result({ productLevel }).rows), 54000);
  }
});
test("销售公司与产品公司可独立筛选，不重复内部共享成交", () => {
  assert.equal(report.sum(result({ company: "A", productCompany: "B" }).rows), 10000);
  assert.equal(report.sum(result({ productCompany: "A" }).rows), 25000);
  assert.equal(report.sum(result({ division: "B事业部（演示）" }).rows), 29000);
});
test("供应关系互斥，内部供应不同时计入外部采购", () => {
  const { rows } = result({ productView: "structure" });
  assert.equal(report.sum(rows, "selfAmount"), 19000);
  assert.equal(report.sum(rows, "internalAmount"), 10000);
  assert.equal(report.sum(rows, "externalAmount"), 25000);
  assert.equal(report.sum(rows, "unknownAmount"), 0);
  assert.ok(rows.every(r => r.selfAmount + r.internalAmount + r.externalAmount + r.unknownAmount === r.amount));
});
test("缺目的地保留，多目的地不按途经地扩增金额", () => {
  const { rows } = result({ productView: "structure", structureBy: "destination" });
  assert.equal(rows.find(r => r.name === "待补充").amount, 19000);
  assert.equal(report.sum(rows), 54000);
  const extra = [{ order: "TEST", amount: 10000, destination: "法国", destinations: ["法国", "意大利"], supply: null }];
  const grouped = report.summarizeProducts(extra, { productView: "structure", structureBy: "destination" });
  assert.equal(grouped.length, 1);
  assert.equal(grouped[0].unknownAmount, 10000);
});
test("渠道贡献与渠道内构成采用不同分母", () => {
  const { rows, allRows } = result({ productView: "channels", channel: "呼叫中心" });
  const tour = rows.find(r => r.name === "跟团游");
  assert.equal(tour.amount, 29000);
  assert.equal(tour.allAmount, 39000);
  assert.equal(tour.share, 100);
  assert.equal(tour.contribution.toFixed(2), "74.36");
  assert.equal(report.sum(allRows), 54000);
  assert.equal(report.sum(rows), 29000);
});
test("解除渠道条件仍保留公司、门店和产品条件", () => {
  assert.equal(report.sum(result({ productView: "channels", channel: "呼叫中心", company: "A" }).allRows), 35000);
  assert.equal(report.sum(result({ productView: "channels", channel: "呼叫中心", company: "A", team: "A电销一组" }).allRows), 20000);
  assert.equal(report.sum(result({ productView: "channels", channel: "呼叫中心", productOrg: "B" }).allRows), 29000);
});
test("跨年已售不受本期确认日期限制，部分完成守恒", () => {
  const all = result({ productView: "crossYear", crossBasis: "planned" });
  assert.equal(report.sum(all.rows), 74000);
  assert.equal(report.sum(all.rows, "completed"), 56000);
  assert.equal(report.sum(all.rows, "future"), 18000);
  assert.equal(report.orderCount(all.facts), 7);
  assert.equal(report.sum(result({ productView: "crossYear", crossBasis: "planned", targetYear: "2027" }).rows), 9000);
  const project = result({ productView: "crossYear", crossBasis: "planned", order: "O09" }).rows[0];
  assert.deepEqual([project.completed, project.future, project.amount], [4000, 6000, 10000]);
});
test("实际完成年份只纳入已完成，计划年份与实际年份不混用", () => {
  assert.equal(report.sum(result({ productView: "crossYear", crossBasis: "actual" }).rows), 56000);
  assert.equal(report.sum(result({ productView: "crossYear", crossBasis: "actual", orderYear: "2025" }).rows), 15000);
  assert.equal(result({ productView: "crossYear", crossBasis: "actual", targetYear: "2027" }).rows.length, 0);
  const shifted = [{ ...report.completions[0], planned: "2025-12-30", actual: "2026-05-05" }];
  assert.equal(report.crossYearRows({ crossBasis: "planned" }, shifted).rows[0].finishYear, "2025");
  assert.equal(report.crossYearRows({ crossBasis: "actual" }, shifted).rows[0].finishYear, "2026");
});
test("无匹配、无任务和非正分母不生成伪比例", () => {
  assert.equal(result({ order: "NOT-FOUND" }).rows.length, 0);
  assert.ok(result().rows.every(r => r.annualTarget === "未提供批准任务" && r.previous === "未提供完整资料"));
  for (const amount of [0, -100]) {
    const rows = report.summarizeProducts([{ order: "ZERO", type: "跟团游", amount }], { productView: "channels", structureBy: "type" });
    assert.equal(rows[0].share, "无有效分母");
    assert.equal(rows[0].contribution, "无有效分母");
  }
});

test('共同负责人和部门领导按发生时资料筛选，缺失不被已知值掩盖', () => {
  assert.equal(report.sum(result({ ownerState: 'known' }).facts), 30000);
  assert.equal(report.sum(result({ ownerState: 'missing' }).facts), 24000);
  assert.equal(report.sum(result({ owner: '产品负责人乙（演示）' }).facts), 10000);
  assert.equal(report.sum(result({ productLeader: '产品领导甲（演示）' }).facts), 25000);
  assert.match(result().rows[0].owner, /产品负责人乙.*待补充/);
});
test('销售与产品新增条件均与两套明细一致', () => {
  for (const view of ['orders', 'actual']) for (const filter of [{ salesDepartment: 'A呼叫中心（演示）' }, { owner: '__missing' }, { productCompany: 'B' }, { geographyZone: '华东' }, { managementZone: '__missing' }, { budgetRegion: '__missing' }, { dataQuality: 'ownership' }]) {
    const f = { ...base, view, ...filter };
    assert.deepEqual(report.productReport(f).facts, view === 'orders' ? report.orderDetailQuery(f) : report.returnDetailQuery(f));
  }
});
test('本期零但月年有业绩的产品组织仍保留', () => {
  const rows = result({ start: '2026-05-07' }).rows;
  const a = rows.find(r => r.productCompany === 'A公司（演示）');
  assert.deepEqual([a.amount, a.monthly, a.yearly], [0, 25000, 30000]);
  assert.match(a.owner, /产品负责人甲/);
});
test('同名事业部与经营组跨公司不误并，不用当前组织目录覆盖来源', () => {
  const rows = ['A', 'B'].map((productCompany, i) => ({ order: 'TEST' + i, productCompany, division: '同名事业部', productOrg: '同名经营组', amount: 100, owner: null }));
  for (const productLevel of ['division', 'productOrg']) assert.equal(report.summarizeProducts(rows, { productView: 'organizations', productLevel }).length, 2);
  const record = { ...report.completions[0], ownershipDetails: { productCompany: 'Z', division: '历史事业部' } };
  assert.equal(report.crossYearRows({ crossBasis: 'planned', productCompany: 'Z' }, [record]).facts[0].division, '历史事业部');
});
test('地理分区、管理分区与经营分类分别归类，未归类不漏金额', () => {
  for (const structureBy of ['geographyZone', 'managementZone', 'management']) {
    const r = result({ productView: 'structure', structureBy });
    assert.equal(report.sum(r.rows), 54000);
    assert.ok(r.rows.some(row => ['未归类', '待确认', '待补充'].includes(row.name)));
  }
  assert.equal(result({ geographyZone: '欧洲', managementZone: '海岛经营区（演示）' }).facts.length, 0);
});
test('渠道比较仅解除主渠道，负责人部门及分类条件保留', () => {
  const r = result({ productView: 'channels', channel: '呼叫中心', owner: '产品负责人乙（演示）' });
  assert.equal(r.facts.length, 0); assert.equal(report.sum(r.allRows), 10000);
  assert.equal(r.rows[0].contribution, 0);
  assert.equal(report.sum(result({ productView: 'channels', channel: '呼叫中心', salesDepartment: 'A呼叫中心（演示）' }).allRows), 20000);
});
test('部分未知金额与全未知不是零，不计算渠道或产品占比', () => {
  const records = [{ order: 'T1', type: '跟团游', amount: 100, supply: '外部采购' }, { order: 'T2', type: '跟团游', amount: null, amountState: '未分配', supply: '外部采购' }];
  const row = report.summarizeProducts(records, { productView: 'structure', structureBy: 'type' })[0];
  assert.equal(row.amount, 100); assert.equal(row.missingAmounts, 1); assert.equal(row.coverages.externalAmount.unallocated, 1);
  assert.equal(row.share, '金额缺数，未计算'); assert.equal(row.contribution, '金额缺数，未计算');
  assert.equal(report.summarizeProducts(records.slice(1), { productView: 'structure', structureBy: 'type' })[0].amount, null);
});
test('比较日期及快捷期间处理闰日、跨年、月末和所选结束日', () => {
  const p = report.productPeriods({ start: '2024-02-29', end: '2024-02-29' });
  assert.deepEqual(p.lastYear, { start: '2023-02-28', end: '2023-02-28' }); assert.equal(p.monthEnd, '2024-02-29');
  assert.equal(report.productPeriods({ start: '2026-01-01', end: '2026-01-07' }).previous.start, '2025-12-25');
  assert.equal(report.productPreset('month', '2026-04-20'), '2026-04-01');
  assert.equal(report.productPreset('quarter', '2026-04-20'), '2026-04-01');
  assert.equal(report.validProductDate('2025-02-29'), false);
});
test('无批准任务和完整同期不从算例或草稿生成完成率', () => {
  const row = result({ budget: 'sample' }).rows[0];
  for (const key of ['completion', 'monthlyCompletion', 'cumulativeCompletion']) assert.equal(row[key], '未计算');
  assert.equal(row.taskVersion, '未提供批准版本');
  assert.equal(row.annualGrowth, '无可比资料');
});
test('跨年使用相同归属条件，缺计划年份或金额不丢记录', () => {
  assert.equal(report.sum(result({ productView: 'crossYear', owner: '产品负责人乙（演示）' }).facts), 10000);
  assert.equal(report.sum(result({ productView: 'crossYear', ownerState: 'missing' }).facts), 44000);
  const unknown = { ...report.completions[0], planned: null, actual: null, amount: null };
  const row = report.crossYearRows({ crossBasis: 'planned' }, [unknown]).rows[0];
  assert.equal(row.finishYear, '待补充'); assert.equal(row.amount, null); assert.equal(row.future, null);
  assert.equal(row.coverages.amount.unknown, 1);
});
