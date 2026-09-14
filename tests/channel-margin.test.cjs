const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../shared/channel-margin-model.js');
const report = require('../shared/report-pages.js');
const channel = require('../shared/channel-reports.js');
const run = (rows, fees = [], f = {}) => m.run({ dataset: 'demo', ...f }, report, { rows, fees });
const one = (overrides = {}) => run([m.item('TEST', overrides)]).summaries[0];
const demo = order => m.run({ dataset: 'demo', start: '2026-04-01' }, report).summaries.find(r => r.order === order);

test('C01 explicit no-fee evidence differs from absent evidence', () => {
  assert.equal(one().restoredIncome, 10000); assert.equal(one().status, '规则待确认');
  assert.equal(one({ feeEvidence: null }).restoredIncome, null);
  assert.equal(one({ rule: null }).restoredIncome, null);
});
test('C02 upgrade amounts independently confirmed, restoration 10400/10000 to 10000/9000', () => {
  const r = demo('CM02'); assert.deepEqual([r.restoredIncome, r.restoredDeduction, r.profit, r.rate], [10000, 9000, 1000, 10]);
  assert.equal(r.status, '规则待确认'); assert.equal(demo('CM08').restoredDeduction, null);
  assert.equal(one({ effects: [m.effect('U', 'upgradeCharge', 1000)] }).rate, null);
});
test('C03 discount bearers reconcile and company share is not entire promotion', () => {
  assert.equal(demo('CM03').incomeImpact, 300); assert.equal(demo('CM03').discount, 600);
  const data = m.fixtures().rows.filter(r => r.order === 'CM03'); data[0].effects[0].amount = 400;
  assert.equal(run(data).summaries[0].status, '数据异常');
});
test('C04 already included compensation and rebate do not double count', () => {
  assert.equal(demo('CM04').incomeImpact, 0); assert.equal(demo('CM04').deductionImpact, 0);
  assert.equal(one({ effects: [m.effect('R', 'rebate', 100, null)] }).rate, null);
});
test('C05 source fee 300 distributes 100/200 once; remaining 50 blocks completion', () => {
  const d = m.fixtures(), r = run(d.rows.filter(r => ['CM05', 'CM06'].includes(r.order)), d.fees);
  assert.equal(r.evidence.reduce((s, r) => s + r.allocated, 0), 300);
  assert.equal(r.summaries.reduce((s, r) => s + r.restoredDeduction, 0), 18000);
  assert.equal(demo('CM07').evidence[0].unallocated, 50); assert.equal(demo('CM07').rate, null);
  d.fees[0].allocations[0].included = false;
  assert.equal(run(d.rows, d.fees).summaries.find(r => r.order === 'CM05').restoredDeduction, 9100);
});
test('C06 business applicability is explicit including external/internal/mixed', () => {
  assert.equal(demo('CM09').status, '不适用'); assert.equal(demo('CM10').status, '适用范围待确认');
  assert.equal(demo('CM18').status, '适用范围待确认'); assert.equal(demo('CM18').amount, 10000);
  assert.equal(demo('CM18').rate, null);
});
test('C07 all unapproved threshold comparison modes tested without formal UI results', () => {
  for (const [mode, expected] of [['eq', [false, true, false]], ['gte', [false, true, true]], ['gt', [false, false, true]]]) {
    assert.deepEqual([999, 1000, 1001].map(v => m.compare(v, 10000, mode)), expected);
  }
  assert.deepEqual(['CM11', 'CM01', 'CM12'].map(id => demo(id).rate), [9.99, 10, 10.01]);
  assert.equal(m.run({ dataset: 'demo' }, report).formal, 0);
});
test('C08 rounding cannot make 9.9999 percent meet a 10 percent threshold', () => {
  const r = demo('CM13'); assert.equal(r.rate, 9.9999); assert.equal(r.rate.toFixed(2), '10.00');
  assert.equal(m.compare(r.profit, r.restoredIncome, 'gte'), false);
});
test('C09 unknown differs from zero, negative profit retained and invalid bases have no rate', () => {
  assert.equal(one({ income: null }).profit, null); assert.equal(one({ deduction: 0 }).profit, 10000);
  assert.equal(demo('CM14').profit, -1000); assert.equal(demo('CM15').rate, null);
  assert.equal(one({ income: -100 }).rate, null); assert.equal(m.sum([100, null]), null);
});
test('C10 weighted compatible subset ratio uses sums and does not replace order results', () => {
  const r = run([m.item('A'), m.item('B', { income: 1000, deduction: 700 })]);
  assert.equal(r.totals[0].rate, 1300 / 11000 * 100); assert.notEqual(r.totals[0].rate, 20);
  assert.deepEqual(r.summaries.map(r => r.rate), [10, 30]);
});
test('C11 repeated records deduplicate, conflicting records and company/currency allocations block', () => {
  const a = m.item('A'); assert.equal(run([a, a]).total, 1); assert.equal(run([a, a]).amount, 10000);
  const bad = run([a, { ...a, income: 11000, amount: 11000 }]).summaries[0];
  assert.equal(bad.status, '数据异常'); assert.equal(bad.income, null); assert.equal(bad.amount, null);
  const d = m.fixtures(); d.fees[0].company = 'B'; d.fees[0].currency = '美元';
  assert.equal(run(d.rows, d.fees).summaries.find(r => r.order === 'CM05').status, '数据异常');
  const valid = m.fixtures(); const r = run(valid.rows, [...valid.fees, valid.fees[0]]);
  assert.equal(r.summaries.find(r => r.order === 'CM05').evidence.length, 1);
  const c = run(valid.rows, [...valid.fees, { ...valid.fees[0], amount: 400 }]);
  assert.equal(c.summaries.find(r => r.order === 'CM05').status, '数据异常');
});
test('C12 separate dates, effective adjustments, future evidence and payment not double counted', () => {
  assert.equal(m.run({ dataset: 'demo', order: 'CM17' }, report).total, 0);
  const r = m.run({ dataset: 'demo', order: 'CM17', dateBasis: 'actual' }, report);
  assert.equal(r.total, 1); assert.equal(r.summaries[0].restoredIncome, 9500); assert.equal(r.summaries[0].restoredDeduction, 9000);
  assert.equal(r.impacts.length, 3); assert.equal(r.impacts.filter(r => r.incomeImpact === -500).length, 1);
  const wrong = m.fixtures().rows.find(r => r.order === 'CM17'); wrong.adjustments[0].original = 'OTHER-ORDER';
  assert.equal(run([wrong], [], { dateBasis: 'actual' }).summaries[0].status, '数据异常');
  assert.equal(run([m.item('A', { settled: null })], [], { dateBasis: 'settled' }).total, 0);
  assert.equal(run([m.item('A')], [], { end: '2026-05-02', cutoff: '2026-05-02' }).summaries[0].income, null);
});
test('C13 historical organization and sales/product company are independent, names not identities', () => {
  const r = m.run({ company: 'A', productCompany: 'B' }, report); assert.equal(r.amount, 10000);
  assert.equal(m.run({ dataset: 'demo', company: 'B', store: '朝阳门店', salesperson: '李欣' }, report).summaries[0].staff, 'B-001');
  assert.equal(demo('CM20').ownership, '发生时任职·演示V1');
});
test('C14 multi-content order and partial completion do not repeat, incompatible bases block', () => {
  const a = m.item('A', { id: 'A1', income: 6000, deduction: 5000, amount: 6000, actual: ['2026-05-04', '2026-05-06'] });
  const b = m.item('A', { id: 'A2', income: 4000, deduction: 3500, amount: 4000 });
  assert.equal(run([a, b], [], { dateBasis: 'actual' }).summaries[0].restoredIncome, 10000);
  for (const variation of [{ rule: '另一规则' }, { currency: '美元' }, { tax: '不含税' }]) {
    const r = run([a, { ...b, ...variation }], [], { currency: '' }).summaries[0]; assert.equal(r.status, '数据异常'); assert.equal(r.rate, null);
  }
  const d = m.fixtures(); d.fees[0].allocations[0].confirmed = false;
  assert.equal(run(d.rows, d.fees).summaries.find(r => r.order === 'CM05').rate, null);
});
test('C15 validation and empty result do not create formal pass rate', () => {
  assert.equal(m.run({ order: 'DOES-NOT-EXIST' }, report).formal, 0);
  assert.equal(m.run({ order: 'DOES-NOT-EXIST' }, report).totals.length, 0);
  assert.ok(m.validate({ ...m.defaults, start: '2026-02-30' }));
  assert.ok(m.validate({ ...m.defaults, cutoff: '2026-05-06' }));
  assert.equal(m.validate(m.defaults), '');
});
test('C16 common scope and all four existing report baselines remain unchanged', () => {
  const r = m.run({}, report); assert.equal(r.total, 5); assert.equal(r.details.length, 6); assert.equal(r.amount, 54000);
  assert.equal(r.complete, 0); assert.equal(r.summaries.every(r => r.rate === null), true);
  assert.equal(channel.run({}).total.value, 54000); assert.equal(channel.run({ basis: 'actual' }).total.value, 56000);
  assert.equal(channel.run({ period: 'year' }).total.value, 59000);
  assert.deepEqual(Object.keys(channel.views), ['channels', 'stores', 'calls', 'structure']);
});
