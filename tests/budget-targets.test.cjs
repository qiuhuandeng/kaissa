const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../shared/budget-targets.js');
const records = () => structuredClone(m.initialTasks);
const ready = () => ({ ...m.emptyTask(), name: '年度测试任务', scope: 'a', annual: '120000', months: Array(12).fill('10000'), definition: m.definitions.orders[0], tax: '含税', owner: '测试负责人', basis: '测试依据', reason: '测试编制' });

test('预算独立指标与产品销售责任、同名顾问不混用', () => {
  assert.equal(Object.keys(m.metrics).length, 3);
  assert.notEqual(m.scopeFor('wang-a').name, m.scopeFor('wang-b').name);
  assert.notEqual(m.scopeFor('a').role, m.scopeFor('product-a').role);
  assert.equal(m.isDescendant('store', 'a'), true);
  assert.equal(m.isDescendant('product-group', 'a'), false);
});
test('以分校验金额，空白非零、不接受非法金额', () => {
  assert.equal(m.cents('0'), 0); assert.equal(m.cents('0.10'), 10);
  for (const v of ['', '-1', '1.001', 'Infinity', '1e4', '1,000', '100000000000']) assert.equal(m.cents(v), null);
  const r = ready(); r.annual = '0.3'; r.months = ['0.1', '0.2', ...Array(10).fill('0')];
  assert.equal(m.totals(r).difference, 0); assert.equal(m.validate(r, [], true), '');
});
test('不自动平分，未填月份与差额阻止提交但可存草稿', () => {
  const r = ready(); r.months[0] = '';
  assert.equal(m.totals(r).missing, 1); assert.equal(m.totals(r).difference, 1000000);
  assert.equal(m.validate(r, []), ''); assert.match(m.validate(r, [], true), /12个月/);
  r.months[0] = '9999'; assert.match(m.validate(r, [], true), /合计/);
});
test('依据、负责人和口径缺失不能提交', () => {
  for (const key of ['basis', 'owner', 'reason', 'tax', 'definition']) { const r = ready(); r[key] = ''; assert.match(m.validate(r, [], true), /齐全/); }
  const r = ready(); r.metric = 'margin'; assert.match(m.validate(r, []), /不匹配/);
});
test('日历及生效期间校验不接受跨年、倒序、假日期', () => {
  for (const start of ['2026-02-30', '2025-12-31', '2027-01-01']) assert.match(m.validate({ ...ready(), start }, []), /期间/);
  assert.match(m.validate({ ...ready(), end: '2026-01-01', start: '2026-02-01' }, []), /期间/);
  assert.match(m.validate({ ...ready(), calendar: '管理月' }, []), /批准资料/);
});
test('同范围同年同指标禁止重复，改税额或日期不能绕过', () => {
  const r = m.save(ready(), [], 'now');
  for (const patch of [{}, { tax: '不含税' }, { start: '2026-07-01' }]) assert.match(m.validate({ ...ready(), ...patch }, [r]), /已有任务/);
  assert.equal(m.validate({ ...ready(), metric: 'returns', definition: m.definitions.returns[0] }, [r]), '');
});
test('下级分配保留差额，禁止重复、跨公司及上下层重复分配', () => {
  const r = ready(); r.children = [{ scope: 'store', amount: '20000' }];
  assert.equal(m.validate(r, [], true), ''); assert.equal(m.totals(r).unallocated, 10000000);
  for (const scope of ['store', 'dept', 'li']) { r.children = [{ scope: 'store', amount: '20000' }, { scope, amount: '1' }]; assert.match(m.validate(r, []), /重复/); }
  r.children = [{ scope: 'wang-b', amount: '1' }]; assert.match(m.validate(r, []), /本任务/);
  r.children = [{ scope: 'store', amount: '120001' }]; assert.match(m.validate(r, []), /超出/);
});
test('保存提交撤回作废均不批准、原记录不被修改', () => {
  const r = m.save(ready(), [], 'a'), original = structuredClone(r);
  const submitted = m.transition(r, 'submit', [r], 'b'); assert.equal(submitted.state, '审批中'); assert.deepEqual(r, original);
  assert.match(m.validate(submitted, [submitted]), /只读/);
  const withdrawn = m.transition(submitted, 'withdraw', [submitted], 'c');
  const voided = m.transition(withdrawn, 'void', [withdrawn], 'd'); assert.equal(voided.state, '已作废');
  assert.throws(() => m.transition(voided, 'submit', [voided], 'e'), /状态/);
  assert.throws(() => m.transition(r, 'approve', [r], 'e'), /状态/);
});
test('已保存任务身份锁定，范围改动另建', () => {
  const r = m.save(ready(), [], 'a');
  assert.match(m.validate({ ...r, scope: 'b' }, [r]), /不能改换/);
  assert.match(m.validate({ ...r, version: 9 }, [r]), /不能改换/);
});
test('年度内调整保留原任务，新版未批准不得替代或并行调整', () => {
  const list = records(), original = structuredClone(list[0]), draft = m.adjustment(list[0], list);
  assert.equal(draft.version, 2); assert.equal(draft.start, ''); assert.equal(draft.basis, '');
  draft.start = '2026-07-01'; draft.annual = '850000'; draft.months[11] = '80000'; draft.basis = '调整依据'; draft.reason = '调整原因';
  assert.equal(m.validate(draft, list, true), '');
  const saved = m.save(draft, list, 'now'); list.push(saved);
  assert.deepEqual(list[0], original); assert.throws(() => m.adjustment(list[0], list), /已有/);
  assert.equal(m.query(list, { date: '2026-08-01', metric: 'orders', level: '集团' }).length, 2);
});
test('作废调整保留版本序号；调整不允许改变原任务口径', () => {
  const list = records(), d = m.adjustment(list[0], list); d.start = '2026-06-01';
  assert.match(m.validate({ ...d, tax: '不含税' }, list), /沿用/);
  const saved = m.save(d, list, 'a'); list.push(m.transition(saved, 'void', [saved], 'b'));
  assert.equal(m.adjustment(list[0], list).version, 3);
});
test('查询按已提供责任、年度、状态及日期，空结果无伪总任务', () => {
  assert.equal(m.query(records(), { metric: 'margin', role: '产品' }).length, 1);
  assert.equal(m.query(records(), { year: '2027' }).length, 0);
  assert.equal(m.query(records(), { state: '审批中' }).length, 1);
  assert.equal(m.query(records(), { search: '王宁' }).length, 1);
});
