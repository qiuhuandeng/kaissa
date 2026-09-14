const { test } = require('node:test');
const assert = require('node:assert/strict');
const m = require('../shared/settlement-reports.js');
test('共同明细保留56000与6个缺确认业务，不生成毛利', () => {
  const r = m.run({});
  assert.equal(r.total.amount, 56000); assert.equal(r.total.count, 6);
  assert.equal(r.total.missing, 6); assert.equal(r.total.profit, null); assert.equal(r.total.knownProfit, null);
  assert.equal(r.rows.find(x => x.id === 'P09-1').amount, 4000);
});
test('独立算例不污染共同明细，合计毛利率不是行率均值', () => {
  const r = m.run({ dataset: 'scenarios' });
  assert.equal(r.total.knownProfit, 29000); assert.equal(r.total.knownRevenue, 120000);
  assert.equal(r.total.knownCost, 91000); assert.equal(r.total.knownRate.toFixed(2), '24.17');
  assert.equal(r.total.profit, null); assert.equal(r.total.completion, 60);
  assert.equal(m.run({}).total.amount, 56000);
});
test('负毛利与已知零收入分别处理', () => {
  const rows = m.run({ dataset: 'scenarios' }).rows;
  assert.equal(rows.find(r => r.id === 'DEMO-T02').profit, -1000);
  const zero = rows.find(r => r.id === 'DEMO-T06');
  assert.equal(zero.profit, 0); assert.equal(zero.rate, null);
});
test('部分成本可核对但不能产生毛利，不用付款预付收票补成本', () => {
  const r = m.facts({ ...m.scenarios[2], paid: 30000, prepaid: 30000, invoice: 30000 });
  assert.equal(r.cost, 12000); assert.equal(r.profit, null);
  assert.match(r.gap, /成本未确认完整/);
});
test('同币种同口径才能计算或汇总，不凭税额推免税', () => {
  assert.equal(m.facts({ ...m.scenarios[0], costCurrency: '美元' }).profit, null);
  assert.equal(m.facts({ ...m.scenarios[0], costTax: '不含税' }).profit, null);
  const a = m.facts(m.scenarios[0]), b = m.facts({ ...m.scenarios[1], currency: '美元', revenueCurrency: '美元', costCurrency: '美元' });
  assert.equal(m.summary([a, b]).knownProfit, null);
  assert.equal(m.summary([a, b]).amount, null);
  assert.equal(a.financeRevenue, null); assert.equal(a.financeProfit, null);
});
test('原结算不覆盖，跨月后补成本只计一次', () => {
  const raw = structuredClone(m.scenarios[4]);
  const r = m.facts(raw, [...m.changes, m.changes[0]]);
  assert.equal(r.originalCost, 40000); assert.equal(r.cost, 42000); assert.equal(r.profit, 8000);
  assert.equal(raw.cost, 40000);
});
test('待确认调整不扣收入，纯退款支付也不重复扣减', () => {
  const r = m.facts({ ...m.scenarios[0], refunded: 1000 });
  assert.equal(r.revenue, 100000); assert.equal(r.revenueDelta, 0);
  const a = m.run({ dataset: 'scenarios', view: 'adjustments' }).adjustments.find(x => x.record === 'DEMO-ADJ02');
  assert.equal(a.incomeChange, -1000); assert.equal(a.profitChange, null);
});
test('调整发生早于原结算、未来生效、关联不符均不计入', () => {
  for (const patch of [{ effective: '2026-04-01' }, { effective: '2026-05-08' }, { settlementNo: 'OTHER' }]) {
    assert.equal(m.facts(m.scenarios[4], [{ ...m.changes[0], ...patch }]).cost, 40000);
  }
});
test('调整独立按生效日查，可命中上月原团并保留两个期间', () => {
  const r = m.run({ dataset: 'scenarios', view: 'adjustments', start: '2026-05-05', end: '2026-05-05' });
  assert.equal(r.adjustments.length, 2);
  const a = r.adjustments[0]; assert.equal(a.originalPeriod, '2026-04'); assert.equal(a.businessPeriod, '2026-05');
  assert.equal(a.accountingPeriod, null); assert.equal(a.profitChange, -2000);
  assert.deepEqual(r.adjustmentTotal, { count: 2, confirmed: 1, pending: 1, incomeChange: 0, costChange: 2000, profitChange: -2000 });
  assert.equal(m.run({ dataset: 'scenarios', start: '2026-05-05', end: '2026-05-05' }).rows.length, 0);
});
test('组织与供应、编号、负毛利筛选共同生效', () => {
  assert.equal(m.run({ dataset: 'scenarios', company: 'B公司（演示）' }).rows.length, 1);
  assert.equal(m.run({ dataset: 'scenarios', supply: '外部采购' }).rows[0].id, 'DEMO-T03');
  assert.equal(m.run({ dataset: 'scenarios', quality: 'negative' }).rows[0].id, 'DEMO-T02');
  assert.equal(m.run({ dataset: 'scenarios', keyword: 'demo-js02' }).rows[0].id, 'DEMO-T02');
});
test('按确认日查询不使用实际日兜底；异常视图保留未结算与负毛利', () => {
  assert.equal(m.run({ basis: 'settlement' }).rows.length, 0);
  assert.equal(m.run({ dataset: 'scenarios', basis: 'settlement' }).rows.length, 3);
  assert.equal(m.run({ dataset: 'scenarios', view: 'gaps' }).rows.length, 3);
});
test('同名组按公司与事业部分开，金额缺失不当零', () => {
  const a = m.scenarios[0], b = { ...a, id: 'X', company: 'B', amount: null };
  const r = m.run({ dataset: 'scenarios', view: 'groups' }, [a, b], []);
  assert.equal(r.groups.length, 2); assert.equal(r.total.amount, null);
});
test('日期错误被拦截，空范围比例未知，缺金额调整不算已知零', () => {
  assert.match(m.validate({ ...m.defaults, start: '2026-02-30' }), /核对/);
  assert.match(m.validate({ ...m.defaults, end: '2026-05-08' }), /截止/);
  assert.equal(m.summary([]).completion, null);
  assert.equal(m.facts(m.scenarios[4], [{ ...m.changes[0], costChange: null }]).profit, null);
});
