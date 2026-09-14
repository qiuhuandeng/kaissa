const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../shared/return-finance-model.js');
const report = require('../shared/report-pages.js');
const f = { dataset: 'demo', mode: 'flows', cutoff: '2026-06-30', start: '2026-05-01', end: '2026-06-30', periodStart: '2026-05', periodEnd: '2026-06' };
const run = (scenario, overrides = {}, data) => m.run({ ...f, scenario, ...overrides }, report, data);
const total = (r, kind) => m.sum(r.totals.filter(t => t.kind === kind));
const one = (r, id) => r.rows.find(v => v.record === id);

test('RF01 completed and settled is not accounting confirmation', () => {
  const r = run('missing', { mode: 'completion' });
  assert.equal(r.rows[0].businessRevenue, 10000);
  assert.equal(r.rows[0].income, null); assert.equal(r.rows[0].cost, null);
  assert.equal(r.rows[0].difference, null); assert.equal(run('missing').rows.length, 0);
});
test('RF02 completed cohort and period flows intentionally differ', () => {
  const r = run('cross', { periodEnd: '2026-05' });
  assert.equal(total(r, 'income'), 10000); assert.equal(total(r, 'cost'), 11000);
  const may = run('cross', { mode: 'completion', end: '2026-05-31', cutoff: '2026-05-31' });
  assert.equal(may.rows.length, 1); assert.equal(may.rows[0].income, null); assert.equal(may.rows[0].cost, 4000);
  assert.equal(run('cross', { mode: 'completion', end: '2026-05-31' }).rows[0].income, 6000);
});
test('RF03 immutable original and signed cross-period adjustments', () => {
  const may = run('adjustment', { periodEnd: '2026-05' });
  assert.equal(total(may, 'income'), 10000); assert.equal(total(may, 'cost'), 7000);
  const june = run('adjustment', { periodStart: '2026-06' });
  assert.equal(total(june, 'income'), -500); assert.equal(total(june, 'cost'), 200);
  const c = run('adjustment', { mode: 'completion' }).rows[0];
  assert.equal(c.income, 9500); assert.equal(c.cost, 7200); assert.equal(c.difference, 2300);
});
test('RF04 phased completion never multiplies order or source costs', () => {
  const r = run('phases', { mode: 'completion' });
  assert.equal(r.orders, 1); assert.equal(r.count, 2); assert.equal(total(r, 'income'), 10000); assert.equal(total(r, 'cost'), 6000);
  assert.equal(one(r, '04A').cost, 2400); assert.equal(one(r, '04B').cost, 3600);
  assert.equal(r.records.filter(s => s.id === 'CB04').length, 1);
});
test('RF05 residual remains in full financial total, not department performance', () => {
  const r = run('allocation'); assert.equal(total(r, 'income'), 12000); assert.equal(m.sum(r.unassigned), 3000);
  const company = run('allocation', { company: 'A' }); assert.equal(total(company, 'income'), 5000); assert.equal(m.sum(company.unassigned), 3000);
  assert.equal(run('allocation', { quality: 'unassigned' }).rows[0].amount, 3000);
});
test('RF06 over-allocation blocks result; late allocation remains residual', () => {
  const over = run('over'); assert.equal(over.rows.length, 0); assert.match(over.records[0].gaps.join(), /超过/); assert.equal(over.records[0].amount, 600);
  const late = run('lateAllocation', { cutoff: '2026-05-31', end: '2026-05-31' });
  assert.equal(total(late, 'cost'), 600); assert.equal(m.sum(late.unassigned), 200);
  assert.equal(run('lateAllocation').unassigned.length, 0);
});
test('RF07 agency payable is not deducted again from net income', () => {
  const r = run('net', { mode: 'completion' }); assert.equal(r.rows[0].income, 2000); assert.equal(r.rows[0].cost, 300); assert.equal(r.rows[0].difference, 1700);
  assert.equal(run('net').rows.some(r => r.kind === 'agency'), false);
  const data = m.fixtures(); data.records.find(r => r.id === 'CB07').basis = '';
  assert.equal(run('net', { mode: 'completion' }, data).rows[0].difference, null);
});
test('RF08 tax basis and original currencies remain separate', () => {
  const r = run('tax', { mode: 'completion' }); assert.equal(r.rows[0].difference, 3000);
  const flows = run('tax'); assert.equal(flows.totals.filter(g => g.kind === 'income').length, 2);
  assert.equal(flows.totals.find(g => g.currency === 'USD').amount, 100);
  assert.equal(flows.records.find(r => r.id === 'SR08USD').tax, null);
});
test('RF09 duplicates deduplicate, pending and rejected never post, conflicts excluded', () => {
  const r = run('duplicate'); assert.equal(total(r, 'income'), 1000); assert.equal(r.records.find(v => v.id === 'SR09').duplicates, 1);
  assert.equal(r.conflicts, 2); const c = run('conflict'); assert.equal(c.rows.length, 0); assert.equal(c.records[0].variants.length, 2);
});
test('RF10 estimate reversal does not erase past posting', () => {
  assert.equal(total(run('estimate', { periodEnd: '2026-05' }), 'cost'), 6000);
  assert.equal(total(run('estimate', { periodStart: '2026-06' }), 'cost'), 200);
  assert.equal(total(run('estimate'), 'cost'), 6200);
  const data = m.fixtures(); data.records = data.records.filter(r => r.id !== 'CB10-R');
  const r = run('estimate', {}, data); assert.match(r.records.find(r => r.id === 'CB10-A').gaps.join(), /冲回/);
  assert.equal(run('estimate', { mode: 'completion' }, data).rows[0].difference, null);
});
test('RF11 refund execution and invoice correction do not post income', () => {
  assert.equal(total(run('adjustment'), 'income'), 9500);
  assert.equal(total(run('estimate'), 'income'), 10000);
  assert.equal(run('estimate').records.some(r => r.kind === 'invoice'), true);
});
test('RF12 accounting period independent from date and late arrival cutoff', () => {
  assert.equal(run('dates', { cutoff: '2026-05-31', end: '2026-05-31' }).rows.length, 0);
  const june = run('dates', { cutoff: '2026-06-02', end: '2026-06-02', periodStart: '2026-06' });
  assert.equal(total(june, 'income'), 900);
  const byDate = run('dates', { dateBasis: 'date', end: '2026-05-31', cutoff: '2026-06-02' }); assert.equal(total(byDate, 'income'), 900);
  assert.equal(total(run('dates'), 'income'), 1000);
});
test('RF13 future completion excluded from cohort, explicit phase confirmation retained', () => {
  assert.equal(run('future', { mode: 'completion', end: '2026-05-31' }).rows.length, 0);
  const r = run('future', { periodEnd: '2026-05' }); assert.equal(total(r, 'income'), 2000); assert.equal(total(r, 'cost'), 400);
  assert.equal(r.rows.find(r => r.id === 'SR13').allocationState, '全程未完成');
});
test('RF14 unmatched valid financial record is not lost or guessed into a store', () => {
  const r = run('unmatched'); assert.equal(total(r, 'cost'), 800); assert.equal(r.rows[0].order, '');
  assert.equal(run('unmatched', { store: '朝阳门店' }).rows.length, 0);
  assert.equal(m.sum(run('unmatched', { store: '朝阳门店' }).unassigned), 800);
});
test('RF15 legal accounting entities distinct from sales/product/contract responsibility', () => {
  const r = run('entities'); assert.equal(r.totals.filter(g => g.kind === 'income').length, 2);
  const c = run('entities', { mode: 'completion' }); assert.equal(c.rows[0].income, null); assert.equal(c.rows[0].difference, null);
  const d = run('entities', { mode: 'completion', entity: 'D公司（演示）' }); assert.equal(d.rows[0].income, 10000); assert.equal(d.rows[0].contractCompany, 'C公司（演示）');
});
test('RF16 explicitly confirmed zero differs from missing accounting cost', () => {
  const r = run('zero', { mode: 'completion' }).rows[0]; assert.equal(r.cost, 0); assert.equal(r.difference, 1000);
  assert.equal(run('missing', { mode: 'completion' }).rows[0].cost, null);
});
test('RF17 filters do not mutate sources, invalid query rejected', () => {
  const data = m.fixtures(), before = JSON.stringify(data); run('phases', { mode: 'completion' }, data); assert.equal(JSON.stringify(data), before);
  assert.throws(() => run('', { dateBasis: 'date', end: '2026-02-30' }), /日期范围/);
  assert.throws(() => run('', { periodEnd: '2026-13' }), /会计期间/);
  assert.throws(() => m.run({ cutoff: '2026-05-08' }, report), /日终版本/);
});
test('RF18 common data and other report baselines remain unchanged', () => {
  const before = JSON.stringify(report.completions), r = m.run({}, report);
  assert.equal(r.count, 6); assert.equal(r.referenceAmount, 56000); assert.equal(r.totals.length, 0);
  assert.equal(r.rows.every(r => r.income === null && r.cost === null), true);
  assert.equal(JSON.stringify(report.completions), before);
  assert.equal(report.sum(report.query({ view: 'orders', start: '2026-05-01', end: '2026-05-07' })), 54000);
  assert.equal(report.sum(report.query({ view: 'changes', start: '2026-05-01', end: '2026-05-07' })), 53000);
});
test('allocation corrections replace only explicitly superseded approved versions at cutoff', () => {
  const data = { completions: [m.completion('X', 'allocation'), m.completion('Y', 'allocation')], records: [m.confirmation('S', 'income', 1000, [['X', 1000]])] };
  const a = data.records[0].allocations[0];
  data.records[0].allocations.push({ ...a, target: 'Y', effective: '2026-06-01', recorded: '2026-06-01', version: 2, supersedesVersion: 1 });
  assert.equal(m.ledger(data, '2026-05-31').flows[0].target, 'X');
  const r = m.ledger(data, '2026-06-30'); assert.equal(r.flows.length, 1); assert.equal(r.flows[0].target, 'Y'); assert.equal(r.flows[0].amount, 1000);
});
test('incompatible allocation company/currency, missing fields and original links block totals', () => {
  const data = { completions: [m.completion('X', 'over')], records: [m.confirmation('S', 'cost', 1000, [['X', 1000]])] };
  data.records[0].allocations[0].entity = 'Other'; assert.equal(m.ledger(data, f.cutoff).flows.length, 0);
  data.records[0].allocations[0].entity = ''; data.records[0].adjustment = true; data.records[0].original = 'NO'; assert.equal(m.ledger(data, f.cutoff).flows.length, 0);
});
test('missing confirmation dates and evidence remain auditable without posting', () => {
  for (const field of ['effective', 'recorded', 'evidence', 'owner']) {
    const record = m.confirmation('S', 'income', 1000, [['X', 1000]], { [field]: '' });
    const r = m.ledger({ completions: [m.completion('X', 'missing')], records: [record] }, f.cutoff);
    assert.equal(r.records.length, 1); assert.equal(r.flows.length, 0); assert.ok(r.records[0].gaps.length);
  }
});
test('business ownership and net-income filtering retain the separate applicable cost', () => {
  const r = run('net', { mode: 'completion', method: '净额', owner: '产品负责人乙（演示）' });
  assert.equal(r.rows[0].difference, 1700); assert.equal(total(r, 'cost'), 300);
  assert.equal(run('net', { owner: '产品负责人乙（演示）' }).rows.length, 2);
  assert.equal(run('missing', { mode: 'completion', quality: 'conflict' }).rows.length, 0);
});
