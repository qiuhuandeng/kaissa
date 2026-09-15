const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../shared/finance-balances-model.js');
const query = (scenario, options = {}, data) => m.query({ dataset: 'demo', case: scenario, ...options }, data);
const one = (scenario, options = {}, data) => query(scenario, options, data).details[0];
const eventFor = (d, patch = {}) => ({ docKey: m.key(d), id: 'TEST-HX', kind: 'cash', amount: 100, effectiveAt: '2026-09-01', recordedAt: '2026-09-01T12:00:00', actualAt: '2026-09-01', fundsCompany: d.company, confirmed: true, currency: d.currency, source: '测试资料', proof: '确认记录', reference: '收款单', ...patch });

test('执02 formal source is empty, never a fake zero balance', () => {
  const r = m.query(m.defaults()); assert.equal(r.pending, true); assert.deepEqual(r.rows, []); assert.deepEqual(r.totals, []);
});
test('执02 BA01 subsequent collection does not rewrite September', () => {
  const d = one('BA01'); assert.equal(d.balance, 6000); assert.equal(d.settled, 4000);
  assert.equal(d.ageDays, 60); assert.equal(d.overdueDays, 20); assert.equal(d.overdue, 6000);
  assert.equal(one('BA01', { asOf: '2026-10-05' }).balance, 0);
  assert.ok(query('BA01').evidence.some(r => r.id === 'HX-100501' && r.inclusion.includes('截止后')));
});
test('执04 BA02 stage receivables are not the entire project repeated', () => {
  const before = query('BA02'); assert.equal(before.rows.length, 1); assert.equal(before.rows[0].balance, 20000);
  const after = query('BA02', { asOf: '2026-10-01' }); assert.equal(after.rows.length, 2); assert.equal(after.totals[0].net, 100000); assert.equal(after.totals[0].balance, 90000);
});
test('执02 BA03 approved decrease and partial reversal preserve originals', () => {
  const r = one('BA03'); assert.equal(r.originalAmount, 10000); assert.equal(r.adjustments, -2000); assert.equal(r.net, 8000); assert.equal(r.cash, 7000); assert.equal(r.balance, 1000);
  assert.equal(one('BA03', { asOf: '2026-09-15' }).balance, 0);
  assert.ok(query('BA03').evidence.some(e => e.id === 'TZ-PENDING' && e.inclusion.includes('尚未确认')));
});
test('执02 BA04 prepayment offset is not another cash payment', () => {
  const d = one('BA04', { view: 'ap' }); assert.equal(d.cash, 3000); assert.equal(d.offset, 6000); assert.equal(d.settled, 9000); assert.equal(d.balance, 11000); assert.equal(d.overdue, 0);
});
test('执02/03 BA05 missing histories, amount, dates and confirmation are explicit', () => {
  const r = query('BA05'), find = id => r.details.find(d => d.id === id);
  assert.equal(find('YS-NODUE').balance, 5000); assert.equal(find('YS-NODUE').overdue, null);
  for (const id of ['YS-NOHISTORY', 'YS-NOAMOUNT', 'YS-NODATE', 'YS-PENDING']) assert.equal(find(id).balance, null);
  assert.equal(r.totals[0].unknown, 4); assert.equal(r.totals[0].overdueUnknown, 1); assert.equal(r.totals[0].balance, 5000);
});
test('执02 all unknown values remain unknown in summaries', () => {
  const r = query('BA05', { order: 'YS-NOHISTORY' }); assert.equal(r.totals[0].balance, null); assert.equal(r.totals[0].net, null);
});
test('执04 BA06 company, ledger, currency and party identity never merge by name', () => {
  const r = query('BA06', { view: 'aging', party: '阳光旅行社' }); assert.equal(r.rows.length, 3);
  assert.equal(query('BA06', { party: 'C002' }).rows.length, 2);
  assert.equal(query('BA06', { party: 'C002', currency: 'USD' }).rows[0].balance, 1000);
  assert.equal(query('BA06', { channel: '加盟门店', store: '朝阳门店' }).rows[0].balance, 6000);
  assert.equal(query('BA06', { center: '厦门呼叫中心' }).rows[0].company, '福建凯撒旅游');
});
test('执04 zero, empty result and unrelated customer filters are different', () => {
  const r = one('BA06', { order: 'YS-ZERO' }); assert.equal(r.balance, 0); assert.equal(r.status, '已结清');
  assert.equal(query('BA06', { party: '游客不是往来客户' }).rows.length, 0);
  assert.equal(query('BA02', { salesCompany: '北京凯撒旅游', productCompany: '福建凯撒旅游', customerType: '企业客户' }).rows.length, 1);
});
test('执05 BA07 collection company does not replace customer AR ownership', () => {
  const r = query('BA07'); assert.equal(r.rows.length, 1); assert.equal(r.rows[0].company, '北京凯撒旅游'); assert.equal(r.rows[0].balance, 0);
  assert.equal(r.evidence.find(e => e.id === 'HX-AGENT-01').fundsCompany, '福建凯撒旅游');
});
test('执05 BA07 internal sides retain balances and missing counterpart remains unknown', () => {
  const r = query('BA07', { view: 'clearing' });
  for (const suffix of ['AR', 'AP']) {
    const d = r.rows.find(d => d.id === 'QS-AGENT-01-' + suffix); assert.equal(d.balance, 5000); assert.equal(d.peerBalance, 5000); assert.equal(d.difference, 0);
    assert.equal(r.rows.find(d => d.id === 'QS-PAY-01-' + suffix).balance, 4000);
  }
  const missing = r.rows.find(d => d.id === 'QS-MISSING'); assert.equal(missing.balance, 2000); assert.equal(missing.peerBalance, null); assert.match(missing.pairStatus, /未对应/);
  assert.equal(r.rows.find(d => d.id === 'QS-SAME-LEGAL').balance, null);
  assert.equal(query('BA07', { view: 'clearing', company: '北京凯撒旅游' }).rows.find(d => d.id === 'QS-AGENT-01-AR').peerBalance, 5000);
});
test('执05 conflicting counterpart is shown as difference, never forced to zero', () => {
  const data = m.fixture(); data.events.find(e => e.id === 'QS-AGENT-01-HX-AP').amount = 2000;
  const d = query('BA07', { view: 'clearing' }, data).rows.find(d => d.id === 'QS-AGENT-01-AR');
  assert.equal(d.peerBalance, 6000); assert.equal(d.difference, -1000); assert.match(d.pairStatus, /有差异/);
});
test('执02 BA08 as-of and knowledge cutoff are independent', () => {
  assert.equal(one('BA08', { cutoff: '2026-10-05T23:59' }).balance, 10000);
  assert.equal(one('BA08', { cutoff: '2026-10-08T10:00' }).balance, 9000);
  assert.equal(query('BA08', { cutoff: '2026-10-05T23:59' }).evidence.length, 1);
});
test('执03 BA09 due-date amendments only affect valid historical dates', () => {
  assert.equal(one('BA09', { asOf: '2026-09-19' }).overdueDays, 18);
  const r = one('BA09'); assert.equal(r.due, '2026-10-15'); assert.equal(r.status, '未到期');
  assert.equal(query('BA09', { dueEnd: '2026-09-30' }).rows.length, 0);
  assert.equal(query('BA09', { dueStart: '2026-10-01', confirmedEnd: '2026-08-01' }).rows.length, 1);
});
test('执02 BA10 duplicates, conflicting records, excess and missing original', () => {
  const r = query('BA10'), get = id => r.rows.find(d => d.id === id);
  assert.equal(get('YS-DUPLICATE').balance, 9000); assert.equal(get('YS-CONFLICT').balance, null);
  assert.equal(get('YS-REVERSE').balance, -200); assert.equal(get('YS-REVERSE').overdue, 0); assert.equal(get('YS-NOORIGINAL').balance, null);
  assert.equal(r.totals[0].reverse, -200); assert.ok(r.exceptions.some(e => /重复/.test(e.issue)));
});
test('执03 BA11 aging and overdue buckets reconcile but have distinct definitions', () => {
  const r = query('BA11', { view: 'aging', ageBasis: 'overdue' }), t = r.rows[0];
  assert.deepEqual([t.b0, t.b1, t.b2, t.b3, t.b4, t.notDue, t.dueToday], [200, 200, 200, 200, 100, 100, 100]);
  assert.equal(m.sum(m.bucketKeys.map(k => t[k])), t.balance); assert.equal(t.balance, 1100);
  const age = query('BA11', { view: 'aging', ageBasis: 'age' }); assert.equal(age.rows[0].b4, 1100);
});
test('执03 missing due amounts are not placed in the overdue or current bucket', () => {
  const r = query('BA05', { view: 'aging', ageBasis: 'overdue' }); assert.equal(r.rows[0].missingDate, 5000); assert.equal(r.rows[0].notDue, 0); assert.equal(r.rows[0].overdueUnknown, 1);
});
test('执04 group and source totals agree for channel and department filters', () => {
  for (const group of ['party', 'channel', 'department']) {
    const r = query('BA06', { view: 'aging', group, currency: 'CNY' }); assert.equal(m.sum(r.rows.map(x => x.balance)), m.sum(r.details.map(x => x.balance)));
  }
});
test('执02 invalid query cannot silently return a misleading period', () => {
  for (const options of [{ asOf: '2026-02-30' }, { cutoff: '2026-09-01T23:59' }, { cutoff: '2026-10-31T25:00' }, { dueStart: '2026-10-01', dueEnd: '2026-09-01' }, { confirmedStart: 'invalid' }, { view: 'bad' }]) assert.throws(() => query('BA01', options));
  for (const options of [{ asOf: '2026-02-28' }, { asOf: '2026-11-01', cutoff: '2026-11-01T23:59' }]) assert.equal(query('BA01', options).pending, true);
});
test('执02 latest mutable source status is never used to reconstruct balance', () => {
  const data = m.fixture(); data.documents.find(d => d.case === 'BA01').status = '已关闭';
  assert.equal(one('BA01', {}, data).balance, 6000);
});
test('执02 confirmed malformed, wrong-currency and missing-cash evidence invalidate balance', () => {
  for (const patch of [{ effectiveAt: '' }, { currency: 'USD' }, { amount: null }, { recordedAt: null }, { proof: '' }, { actualAt: '' }, { fundsCompany: '' }]) {
    const data = m.fixture(), d = data.documents.find(d => d.case === 'BA01'); data.events.push(eventFor(d, patch));
    assert.equal(one('BA01', {}, data).balance, null);
  }
});
test('执02 excessive and cross-kind reversal are invalid', () => {
  for (const patch of [{ amount: -5000, original: 'HX-090501' }, { amount: -500, kind: 'offset', original: 'HX-090501' }]) {
    const data = m.fixture(), d = data.documents.find(d => d.case === 'BA01'); data.events.push(eventFor(d, { ...patch, effectiveAt: '2026-09-20' }));
    assert.equal(one('BA01', {}, data).balance, null);
  }
});
test('执02 remission is a separate noncash balance reduction', () => {
  const data = m.fixture(), d = data.documents.find(d => d.case === 'BA01'); data.events.push(eventFor(d, { kind: 'relief', amount: 500 }));
  const r = one('BA01', {}, data); assert.equal(r.cash, 4000); assert.equal(r.relief, 500); assert.equal(r.balance, 5500);
});
test('执02 duplicate and conflicting base documents do not double the debt', () => {
  const data = m.fixture(), d = data.documents.find(d => d.case === 'BA01'); data.documents.push({ ...d });
  assert.equal(query('BA01', {}, data).rows.length, 1); assert.equal(one('BA01', {}, data).balance, 6000);
  data.documents.at(-1).amount = 12000; assert.equal(one('BA01', {}, data).balance, null);
});
test('执02/04 BA12 exact cents and full export data remain available', () => {
  const r = query('BA12'); assert.equal(r.rows.length, 25); assert.equal(r.totals[0].balance, 32500);
  assert.equal(m.sum([0.1, 0.2]), 0.3); assert.match(m.csv([[r.rows.at(-1).party, -200]]), /'=客户/);
  const sorted = m.sort(r.rows, 'balance', -1); assert.equal(sorted[0].balance, 2500); assert.equal(r.rows[0].balance, 100);
});
