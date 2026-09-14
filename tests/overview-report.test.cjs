const test = require('node:test');
const assert = require('node:assert/strict');
const report = require('../shared/report-pages.js');
const create = require('../shared/overview-report-model.js');
const m = create(report);
const f = { start: '2026-05-01', end: '2026-05-07', view: 'orders', grouping: 'company', responsibility: 'sales', comparison: 'previous', budget: 'none' };

test('总览与订单、变化、实际完成明细金额一致', () => {
  assert.equal(m.build(f).total.amount, 54000);
  assert.equal(m.build({ ...f, view: 'changes' }).total.amount, 53000);
  assert.equal(m.build({ ...f, view: 'actual' }).total.amount, 56000);
  assert.equal(m.build(f).total.orders, 5);
  assert.equal(m.build(f).total.yearly, 59000);
});
test('本期为零但月年有业务的组织不丢失', () => {
  const r = m.build({ ...f, start: '2026-05-07' });
  assert.equal(r.rows.length, 2);
  const a = r.rows.find(r => r.name.startsWith('A'));
  assert.equal(a.amount, 0); assert.equal(a.monthly, 35000); assert.equal(a.yearly, 40000);
  assert.equal(report.sum(r.rows), r.total.amount);
});
test('产品、销售责任及部门独立分组，内部供应不加倍', () => {
  for (const [grouping, [, responsibility]] of Object.entries(m.levels)) assert.equal(report.sum(m.build({ ...f, grouping, responsibility }).rows), 54000);
  const r = m.build({ ...f, company: 'A', productCompany: 'B', responsibility: 'product', grouping: 'division' });
  assert.equal(r.total.amount, 10000); assert.match(r.rows[0].name, /B公司.*B事业部/);
  assert.equal(m.build({ ...f, salesDepartment: 'A呼叫中心（演示）' }).total.amount, 20000);
});
test('发生时同名部门按公司分开，缺归属不丢金额', () => {
  const a = { company: 'A', salesDivision: '同名事业部', salesDepartment: '同名部门' };
  assert.notEqual(m.groupInfo(a, 'salesDepartment').key, m.groupInfo({ ...a, company: 'B' }, 'salesDepartment').key);
  const r = m.build({ ...f, grouping: 'budgetRegion' });
  assert.equal(r.total.unknownAmount, 9000); assert.equal(r.rows.find(r => r.name === '待补充').amount, 9000);
});
test('新增归属、分类、缺数筛选与明细使用相同条件', () => {
  const filtered = { ...f, productCompany: 'B', managementZone: '欧洲经营区（演示）' };
  assert.deepEqual(m.facts(filtered), report.orderDetailQuery(filtered));
  assert.equal(m.build(filtered).total.amount, 10000);
  assert.equal(m.build({ ...f, geographyZone: '__missing' }).total.amount, 19000);
});
test('比较日期可跨年、处理闰日，并显示真正结束日', () => {
  assert.deepEqual(m.periods(f).previous, { start: '2026-04-24', end: '2026-04-30' });
  assert.deepEqual(m.periods({ ...f, start: '2024-02-29', end: '2024-02-29', comparison: 'year' }).previous, { start: '2023-02-28', end: '2023-02-28' });
  assert.deepEqual(m.periods({ ...f, start: '2026-01-01', end: '2026-01-07' }).previous, { start: '2025-12-25', end: '2025-12-31' });
  assert.equal(m.periods({ ...f, end: '2024-02-29' }).monthTarget.end, '2024-02-29');
});
test('期间快捷项以所选结束日为准，非法日期被拒绝', () => {
  assert.equal(m.preset('month', '2026-04-20'), '2026-04-01');
  assert.equal(m.preset('quarter', '2026-02-20'), '2026-01-01');
  assert.equal(m.preset('demo', '2026-04-20'), '2026-04-14');
  assert.match(m.validate({ ...f, start: '2026-02-30' }), /有效日期/);
  assert.match(m.validate({ ...f, end: '2026-05-08' }), /截止日/);
  assert.match(m.validate({ ...f, responsibility: 'product' }), /不匹配/);
});
test('比较资料不完整不拿空数组或零散样例计算同比', () => {
  const coverage = value => ({ value, unknown: 0, unallocated: 0 });
  assert.equal(m.comparison(coverage(100), coverage(0), false).growth, null);
  assert.equal(m.comparison(coverage(100), coverage(80), true).growth, 25);
  assert.equal(m.comparison(coverage(100), coverage(0), true).difference, 100);
  assert.equal(m.comparison(coverage(100), coverage(0), true).growth, null);
  assert.equal(m.comparison(coverage(100), { ...coverage(80), unknown: 1 }, true).difference, null);
  assert.equal(m.build(f).total.previous, '未提供完整资料');
});
test('月度、年度、累计进度用三个分母，缺分解不按天摊', () => {
  const c = value => ({ value, unknown: 0, unallocated: 0 });
  assert.deepEqual(m.taskRates({ month: c(54000), year: c(59000) }, { month: 70000, annual: 840000, cumulative: 350000 }),
    { completion: 54000 / 70000 * 100, annualCompletion: 59000 / 840000 * 100, cumulativeCompletion: 59000 / 350000 * 100 });
  assert.deepEqual(m.taskRates({ month: c(54000), year: c(59000) }, {}), { completion: null, annualCompletion: null, cumulativeCompletion: null });
  assert.equal(m.taskRates({ month: { ...c(10), unknown: 1 }, year: c(10) }, { month: 20 }).completion, null);
});
test('集团5月样例严格匹配全部筛选，不读取预算草稿', () => {
  assert.equal(m.build({ ...f, budget: 'sample' }).total.completion, 54000 / 70000 * 100);
  assert.equal(m.build({ ...f, budget: 'sample', view: 'actual' }).total.completion, 80);
  for (const key of m.filterKeys) assert.equal(m.build({ ...f, budget: 'sample', [key]: '__missing' }).sample, false, key);
  assert.equal(m.build({ ...f, budget: 'sample', view: 'changes' }).total.target, '不适用');
  assert.equal(m.build({ ...f, budget: 'sample' }).total.annualCompletion, '未计算');
});
test('全未知金额不归零，部分缺数抑制任务完成率', () => {
  const unknown = { order: 'X', company: 'A', confirmed: f.end, amount: null };
  const fake = create({ ...report, orderDetailQuery: () => [unknown], returnDetailQuery: () => [] });
  assert.equal(fake.build({ ...f, budget: 'sample' }).total.amount, null);
  assert.equal(fake.build({ ...f, budget: 'sample' }).total.completion, '未计算');
  assert.equal(fake.build(f).total.missingAmounts, 1);
});
test('趋势也引用归属筛选，未完成安排明确按数据截止而非查询日', () => {
  const r = m.build({ ...f, salesDepartment: 'A呼叫中心（演示）' });
  assert.equal(r.trend.at(-1).amount, 20000); assert.equal(r.trend[0].amount, null);
  assert.equal(report.sum(m.build(f).future), 18000);
  assert.equal(report.sum(m.build({ ...f, end: '2026-05-03' }).future), 18000);
  assert.equal(report.sum(m.build({ ...f, productCompany: 'B' }).future), 15000);
});
