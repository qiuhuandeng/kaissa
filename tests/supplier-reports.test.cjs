const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../shared/supplier-report-model.js');
const run = f => m.run(f);

test('采购额由确认明细形成，前十加其他完整，不取付款或订单金额', () => {
  const r = run();
  assert.equal(r.rows.length, 13); assert.equal(r.ranking.length, 12);
  assert.equal(r.total.amount, 530000); assert.equal(r.top.amount, 517000); assert.equal(r.other.amount, 13000);
  assert.equal(r.top.amount + r.other.amount, r.total.amount);
  assert.equal(r.ranking[0].amount, 130000);
});
test('供应商身份与公司部门分开，同名不误合并', () => {
  const r = run(); assert.equal(r.groups.filter(g => g.name === '海湾酒店（演示）').length, 2);
  assert.equal(run({ grouping: 'department' }).groups.length, 2);
  assert.equal(run({ company: 'B采购公司（演示）', supplier: 'S1' }).total.amount, 10000);
});
test('集团内外显式筛选，外部关联方不误抵销', () => {
  assert.equal(run({ relation: '内部' }).total.amount, 80000);
  assert.equal(run({ relation: '待确认' }).total.amount, 7000);
  assert.equal(run({ relation: '' }).total.amount, 617000);
  assert.equal(run({ type: '外采产品' }).total.amount, 45000);
});
test('原币分别统计，未提供汇率不猜折算', () => {
  const r = run({ currency: 'EUR' }); assert.equal(r.total.amount, 5000);
  assert.equal(r.rows[0].rate, null); assert.equal(r.rows.length, 1);
});
test('采购确认和账单确认分时点，未确认与无确认日不兜底', () => {
  const r = run({ basis: 'bill' }); assert.equal(r.total.amount, 404000);
  assert.ok(!r.rows.some(r => ['BUY-01', 'BUY-12', 'BUY-17'].includes(r.id)));
  assert.equal(run({ start: '2026-04-30', end: '2026-04-30', basis: 'bill' }).total.amount, 120000);
});
test('采购数量分单位，缺数和已知零分开', () => {
  const r = run({ dataset: 'gaps' });
  assert.match(r.quantity, /张/); assert.match(r.quantity, /间夜/); assert.match(r.quantity, /1 条数量待补/);
  assert.equal(r.rows.find(r => r.id === 'BUY-G2').amount, 0);
  assert.equal(r.total.amount, 530000); assert.equal(r.total.missing, 1);
  assert.equal(r.rankReady, false); assert.ok(r.ranking.every(g => g.rank === null && g.share === null));
});
test('全未知不是零，空范围才有零采购', () => {
  const r = run({ dataset: 'gaps', quality: 'amount' });
  assert.equal(r.total.amount, null); assert.equal(r.total.missing, 1);
  assert.equal(run({ keyword: '不存在' }).total.amount, 0);
});
test('月份分类与明细守恒，待确认采购不计，重复来源只计一次', () => {
  assert.equal(run({ grouping: 'month' }).groups[0].amount, 530000);
  assert.equal(m.purchaseRows(m.defaults, [...m.purchases, m.purchases[0]]).length, 13);
  assert.equal(run({ supplier: 'S1' }).rows.length, 2);
});
test('预计与确认分开，返点确认0保留，缺数非0', () => {
  const r = run({ view: 'rebates', basis: 'expected' });
  assert.equal(r.total.expected.amount, 16000); assert.equal(r.total.confirmed.amount, 10000);
  assert.equal(r.total.confirmed.missing, 1); assert.equal(r.rows.find(r => r.id === 'REB-04').confirmed, 0);
  assert.equal(r.rows.find(r => r.id === 'REB-02').remaining, null);
});
test('上月协议本月确认可查，协议期间不改写，差额不作成本', () => {
  const r = run({ view: 'rebates', basis: 'confirmed' });
  assert.equal(r.total.confirmed.amount, 14000); assert.equal(r.total.expected.amount, 18000);
  const old = r.rows.find(r => r.id === 'REB-03'); assert.equal(old.period, '2026年4月'); assert.equal(old.variance, -1000);
});
test('实现不等于分配，不纳入截止日后记录', () => {
  const r = m.rebateFacts(m.rebates[0]);
  assert.equal(r.offset, 6000); assert.equal(r.cash, 2000); assert.equal(r.remaining, 2000);
  assert.equal(r.allocated, 9000); assert.equal(r.unallocated, 1000);
});
test('重复冲抵、错主体币种及未确认记录不产生实现额', () => {
  const receipts = [...m.receipts, m.receipts[0], { ...m.receipts[0], id: 'X', company: '其他公司' }, { ...m.receipts[0], id: 'Y', currency: 'EUR' }, { ...m.receipts[0], id: 'Z', status: '待确认' }];
  assert.equal(m.rebateFacts(m.rebates[0], receipts).realized, 8000);
});
test('超额冲抵与超分配不得报健康余额', () => {
  const r = m.rebateFacts(m.rebates[0], [...m.receipts, { ...m.receipts[0], id: 'EXTRA', amount: 5000 }]);
  assert.equal(r.status, '金额异常'); assert.equal(r.remaining, null);
  const a = m.rebateFacts(m.rebates[0], [], [...m.allocations, { ...m.allocations[0], id: 'EXTRA', amount: 5000 }]);
  assert.equal(a.unallocated, null); assert.match(a.issue, /分配额/);
});
test('分配确认不替代成本确认，不影响共同团期毛利', () => {
  const r = run({ view: 'allocations' });
  assert.equal(r.total.amount, 9000); assert.equal(r.cost.amount, -6000); assert.equal(r.cost.missing, 1);
  assert.equal(run({ view: 'allocations', start: '2026-05-07' }).total.amount, 3000);
  assert.equal(run({ view: 'allocations', start: '2026-05-07' }).cost.amount, null);
});
test('日期非法、倒序和超过截止被拦截', () => {
  for (const f of [{ start: '2026-02-30' }, { start: '2026-05-07', end: '2026-05-01' }, { end: '2026-05-08' }]) assert.throws(() => run(f));
});
