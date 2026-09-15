const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../shared/finance-cashflow-model.js');
const q = (c, type = 'receipt', extra = {}, data) => m.query({ ...m.defaults(type), dataset: 'demo', case: c, ...extra }, data);
const total = (r, k) => m.sum(r.totals.map(t => t[k]));
test('CF01 funds once, three independent allocations', () => {
  const r = q('CF01'); assert.equal(r.rows.length, 1); assert.equal(total(r, 'cashIn'), 100000);
  assert.equal(r.allocations.length, 3); assert.equal(total(r, 'allocation'), 100000);
});
test('CF02 incomplete allocation history never invents available balance', () => {
  const r = q('CF02'); assert.equal(r.rows[0].unallocated, 40000); assert.equal(r.rows[1].unallocated, null);
  assert.equal(r.totals[0].unallocated, null);
});
test('CF03 one order retains both original receipts', () => {
  const r = q('CF03', 'receipt', { order: 'KS2026090301', mode: 'allocations' });
  assert.equal(r.rows.length, 2); assert.equal(total(r, 'allocation'), 50000);
});
test('CF04 application screenshot is not cash, unmatched cash retained', () => {
  const r = q('CF04'); assert.equal(total(r, 'cashIn'), 12000); assert.equal(r.sources[0].unallocated, 12000);
  assert.ok(r.exceptions.some(r => r.id === 'RK26090401'));
  assert.equal(q('CF04', 'receipt', { dateBasis: 'appliedAt' }).sources.length, 2);
});
test('CF05 receipt, writeoffs and identical reimports do not multiply payment', () => {
  const r = q('CF05', 'payment'); assert.equal(total(r, 'cashOut'), 10000); assert.equal(r.sources[0].writeoff, 10000);
  assert.equal(r.exceptions.filter(e => e.issue.includes('重复')).length, 2);
  const d = m.fixture(), p = d.records.find(r => r.id === 'FK26090501');
  d.records.push({ ...p, company: '福建凯撒旅游', accountCompany: '福建凯撒旅游', account: '银行 ****2222' });
  assert.equal(total(q('CF05', 'payment', {}, d), 'cashOut'), 20000);
});
test('CF06 refund evidence independent of approval and writeoff', () => {
  const r = q('CF06', 'refund', { dateBasis: 'appliedAt' }); assert.equal(r.rows.length, 2);
  assert.equal(total(r, 'cashOut'), 9600); assert.equal(r.rows[0].cashOut, null);
});
test('CF07 predeposit refund has no cash outflow', () => {
  const r = q('CF07', 'refund', { dateBasis: 'confirmedAt' }); assert.equal(total(r, 'cashOut'), 0);
  assert.equal(total(r, 'noncash'), 3200); assert.equal(total(r, 'allocation'), 3200); assert.equal(r.rows[0].transaction, '');
});
test('CF08 continuous transfers retain root receipt and both intervening records', () => {
  const t = q('CF08', 'transfer'); assert.equal(total(t, 'noncash'), 10000); assert.equal(total(t, 'cashIn'), 0);
  const r = q('CF08', 'refund'); assert.equal(total(r, 'cashOut'), 3000);
  assert.match(r.rows[0].chain, /ZK26090801.*ZK26090802/);
  assert.ok(r.trace.some(r => r.id === 'SK26090801')); assert.equal(total(q('CF08'), 'cashIn'), 10000);
});
test('CF09 refund from two roots remains one source', () => {
  const r = q('CF09', 'refund'); assert.equal(r.rows.length, 1); assert.equal(r.allocations.length, 2);
  assert.equal(total(r, 'cashOut'), 6000); assert.equal(total(r, 'allocation'), 6000);
});
test('CF10 order filter does not attribute the whole merged payment', () => {
  const r = q('CF10', 'payment', { order: 'KS2026091001', mode: 'allocations' });
  assert.equal(r.rows.length, 1); assert.equal(total(r, 'allocation'), 7000); assert.equal(total(r, 'cashOut'), 12000);
});
test('CF11 prepayment offset is not new payment or guessed order distribution', () => {
  const r = q('CF11', 'payment'); assert.equal(total(r, 'cashOut'), 12000); assert.equal(r.allocations.length, 0);
  assert.equal(r.evidence[0].amount, 5000); assert.equal(q('CF11', 'payment', { order: 'KS' }).rows.length, 0);
});
test('CF12 bank submission versus verified manual cashier confirmation', () => {
  const r = q('CF12', 'payment', { dateBasis: 'appliedAt' }); assert.equal(total(r, 'cashOut'), 8000);
  assert.equal(r.rows[1].electronicReceipt, false); assert.match(r.rows[1].proof, /出纳确认/);
});
test('CF13 gross outflow, actual return, retry and fee not counted twice', () => {
  const r = q('CF13', 'payment'); assert.equal(r.rows.length, 3); assert.equal(total(r, 'cashOut'), 20000);
  assert.equal(total(r, 'cashIn'), 9900); assert.equal(total(r, 'netOut'), 10100);
});
test('CF14 cross-period reversal is appended, original amount preserved', () => {
  assert.equal(total(q('CF14', 'transfer', { end: '2026-09-30' }), 'noncash'), 6000);
  assert.equal(total(q('CF14', 'transfer', { start: '2026-10-01' }), 'noncash'), -6000);
  const r = q('CF14', 'transfer'); assert.equal(total(r, 'noncash'), 0); assert.equal(r.rows.length, 2);
});
test('CF15 late arrival respects entered-at cutoff and inclusive occurrence date', () => {
  assert.equal(q('CF15', 'receipt', { cutoff: '2026-10-01T23:59' }).rows.length, 0);
  const r = q('CF15', 'receipt', { start: '2026-09-30', end: '2026-09-30', cutoff: '2026-10-03T23:59' });
  assert.equal(total(r, 'cashIn'), 3000); assert.match(r.rows[0].actualAt, /^2026-09-30/);
  const d = m.fixture(); d.historical = false; assert.equal(q('CF15', 'receipt', {}, d).pending, true);
});
test('CF16 currencies remain separate; missing conversion and explicit zero distinct', () => {
  const r = q('CF16'); assert.equal(r.totals.length, 2);
  assert.equal(r.totals.find(t => t.currency === 'CNY').cashIn, 1000); assert.equal(r.totals.find(t => t.currency === 'USD').cashIn, 100);
  assert.equal(r.rows[2].cashIn, 0); assert.equal(r.rows[1].converted, null); assert.equal(m.fmt(0), '0.00');
});
test('CF17 contract company does not overwrite fund company; conflicting source quarantined', () => {
  const r = q('CF17'); assert.equal(total(r, 'cashIn'), 8000);
  assert.equal(r.rows[0].company, '北京凯撒旅游'); assert.equal(r.rows[0].contractCompany, '福建凯撒旅游');
  assert.equal(r.exceptions.filter(e => e.issue.includes('归属冲突')).length, 2);
  assert.equal(total(q('CF17', 'receipt', { contractCompany: '福建凯撒旅游' }), 'allocation'), 8000);
});
test('CF18 same closed status has different actual execution outcomes', () => {
  const r = q('CF18', 'payment', { dateBasis: 'appliedAt' }); assert.equal(r.rows.length, 2);
  assert.equal(total(r, 'cashOut'), 5000); assert.equal(r.rows[1].cashOut, null);
});
test('CF19 net platform settlement and cash deposit do not duplicate customer funds', () => {
  const r = q('CF19'); assert.equal(total(r, 'cashIn'), 10700); assert.equal(total(r, 'allocation'), 10700);
  assert.equal(r.evidence.length, 4); assert.equal(r.sources[0].gross, 10000);
});
test('CF20 independent source cash retained, invalid allocation excluded, gaps specific', () => {
  const r = q('CF20'); assert.equal(total(r, 'cashIn'), 10000); assert.equal(total(r, 'allocation'), 0);
  assert.equal(r.rows[0].unallocated, null); assert.ok(r.exceptions.some(e => e.issue.includes('日期缺失')));
  assert.ok(r.exceptions.some(e => e.issue.includes('金额未提供')));
  assert.equal(total(q('CF20', 'transfer'), 'noncash'), 0);
});
test('CF21 full 25-row results, CSV external text escaped, pure query and stable sorting', () => {
  const d = m.fixture(), before = JSON.stringify(d), r = q('CF21', 'receipt', {}, d);
  assert.equal(r.rows.length, 25); assert.equal(r.allocations.length, 25); assert.equal(r.totals.length, 2);
  const text = m.csv(r.rows.map(r => [r.party, r.amount])); assert.match(text, /'=外部文本,""测试""\n第二行/);
  assert.equal(m.csv([['  +SUM(A1)', '-cmd', '@x', 0, -6000]]), '\uFEFF"\'  +SUM(A1)","\'-cmd","\'@x","0","-6000"');
  assert.equal(m.sort(r.rows, 'amount', -1)[0].amount, 2500); assert.equal(JSON.stringify(d), before);
});
test('pending source and out-of-coverage are not presented as formal zero', () => {
  const r = m.query({ ...m.defaults('receipt'), dataset: 'pending' }); assert.equal(r.pending, true); assert.equal(r.totals.length, 0);
  assert.match(q('CF01', 'receipt', { start: '2025-01-01' }).notice, /资料不足/);
  assert.throws(() => q('CF01', 'receipt', { start: '2026-11-01', end: '2026-09-01' }), /开始日期/);
});
test('conflicting same identity amounts excluded without picking latest success', () => {
  const d = m.fixture(), r = d.records.find(r => r.case === 'CF01'); d.records.push({ ...r, amount: 50000 });
  const result = q('CF01', 'receipt', {}, d); assert.equal(result.sources.length, 0); assert.equal(result.exceptions.length, 2);
});
test('allocation confirmation date belongs to allocation, not source receipt confirmation', () => {
  const d = m.fixture(), a = d.allocations.find(a => a.order === 'KS2026090101');
  a.confirmedAt = '2026-10-04T10:00:00'; a.enteredAt = '2026-10-04T11:00:00';
  const october = q('CF01', 'receipt', { mode: 'allocations', dateBasis: 'confirmedAt', start: '2026-10-01' }, d);
  assert.equal(october.rows.length, 1); assert.equal(total(october, 'allocation'), 30000);
  assert.equal(total(q('CF01', 'receipt', { mode: 'allocations', dateBasis: 'confirmedAt', end: '2026-09-30' }, d), 'allocation'), 70000);
});
