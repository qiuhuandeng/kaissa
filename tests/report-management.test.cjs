const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../shared/report-management.js');
const report = require('../shared/report-pages.js');
const defaults = { basis: 'orders', start: '2026-05-01', end: '2026-05-07' };
const records = () => structuredClone(m.initialRules);
const draft = () => ({ ...records().find(r => r.sourceId === 'budget'), target: '呼叫中心B区（拟）', basis: '预算负责人提供的演示依据' });

test('数据核对复用订单内容：16项缺口只涉及6条业务54,000元', () => {
  const r = m.inspect(defaults);
  assert.equal(r.rows.length, 6); assert.equal(r.details.length, 16);
  assert.equal(r.affected.length, 6); assert.equal(r.coverage.value, 54000);
  assert.ok(r.summary.reduce((n, s) => n + s.coverage.value, 0) > r.coverage.value);
});
test('实际回团独立核对：28项缺口涉及6次完成56,000元，不纳入未来安排', () => {
  const r = m.inspect({ ...defaults, basis: 'returns' });
  assert.equal(r.rows.length, 6); assert.equal(r.details.length, 28); assert.equal(r.coverage.value, 56000);
  assert.equal(new Set(r.details.map(d => d.rowId)).size, 6);
  assert.ok(r.details.every(d => d.date <= defaults.end));
});
test('财务缺口不能推算缺失金额，零条缺口和无确认记录区分', () => {
  const r = m.inspect({ ...defaults, basis: 'returns', issue: 'cost' });
  assert.equal(r.details.length, 6); assert.ok(r.rows.every(d => d.cost === null));
  assert.ok(r.details.every(d => d.value === '未提供确认记录'));
  const none = m.inspect({ ...defaults, basis: 'returns', issue: 'salesLeader' });
  assert.equal(none.details.length, 0); assert.equal(none.coverage.value, 0);
});
test('缺口字段与销售公司筛选，未知目的地仍保留19,000元', () => {
  assert.equal(m.inspect({ ...defaults, issue: 'destination' }).coverage.value, 19000);
  assert.equal(m.inspect({ ...defaults, company: 'A' }).coverage.value, 35000);
  assert.equal(m.inspect({ ...defaults, company: 'B' }).coverage.value, 19000);
  assert.ok(!m.inspect(defaults).summary.some(s => s.key === 'cost'));
});
test('有效日期、顺序、来源和候选对应校验', () => {
  assert.equal(m.dateValid('2026-02-30'), false); assert.equal(m.dateValid('2028-02-29'), true);
  assert.match(m.validateRule({ ...draft(), start: '2027-01-01' }, records()), /生效期间/);
  assert.match(m.validateRule({ ...draft(), sourceId: 'invented' }, records()), /来源资料/);
  assert.match(m.validateRule({ ...draft(), target: '猜测部门' }, records()), /不在/);
  assert.match(m.validateRule({ ...draft(), reason: ' ' }, records()), /维护原因/);
});
test('重叠期间包括共同边界，作废记录不占用期间', () => {
  const row = { ...draft(), id: 'NEW' };
  assert.match(m.validateRule(row, records()), /交叠/);
  assert.match(m.validateRule({ ...row, start: '2026-12-31', end: '2027-12-31' }, records()), /交叠/);
  assert.equal(m.validateRule({ ...row, start: '2027-01-01', end: '2027-12-31' }, records()), '');
  assert.equal(m.validateRule(row, records().map(r => ({ ...r, state: '已作废' }))), '');
});
test('草稿允许待补，但提交必须具备对应结果及依据', () => {
  const r = records().find(r => r.sourceId === 'budget');
  assert.equal(m.validateRule(r, records()), '');
  assert.throws(() => m.transition(r, 'submit', records(), '演示时间'), /不能提交/);
  assert.throws(() => m.transition({ ...draft(), basis: ' ' }, 'submit', records(), '演示时间'), /不能提交/);
});
test('草稿提交、撤回、作废只改变本记录，没有正式批准动作', () => {
  const r = draft(), before = JSON.stringify(r);
  const pending = m.transition(r, 'submit', records(), '时间1');
  assert.equal(pending.state, '待确认'); assert.equal(pending.history.length, 1); assert.equal(JSON.stringify(r), before);
  const withdrawn = m.transition(pending, 'withdraw', records(), '时间2');
  assert.equal(withdrawn.state, '草稿');
  assert.equal(m.transition(withdrawn, 'void', records(), '时间3').state, '已作废');
  assert.throws(() => m.transition(pending, 'approve', records(), ''), /不支持/);
  assert.throws(() => m.transition(pending, 'void', records(), ''), /不支持/);
});
test('新建变更保留原版，默认从下一日开始且必须补结束日期', () => {
  const all = records(), r = all[0], original = JSON.stringify(all), next = m.versionDraft(r, all);
  assert.equal(next.version, 2); assert.equal(next.start, '2027-01-01'); assert.equal(next.parent, r.id);
  assert.equal(next.state, '草稿'); assert.equal(next.basis, '');
  assert.match(m.validateRule(next, all), /生效期间/); assert.equal(JSON.stringify(all), original);
});
test('分类和组织分开筛选，按期间选版，不以当前对应覆盖历史', () => {
  const all = records();
  assert.equal(m.filterRules(all, {}, 'rules').length, 5);
  assert.equal(m.filterRules(all, { kind: '销售组织' }, 'organizations').length, 2);
  assert.equal(m.filterRules(all, { date: '2027-01-01' }, 'rules').length, 0);
  assert.equal(m.filterRules(all, { search: '朝阳' }, 'organizations').length, 1);
});
test('未提供核算部门不能从业务部门推填或提交', () => {
  const s = m.sources.find(s => s.id === 'accounting');
  assert.equal(s.financeDepartment, null); assert.deepEqual(s.targets, []);
  const r = records().find(r => r.sourceId === s.id);
  assert.match(m.validateRule({ ...r, target: '门店销售部' }, records(), true), /不在/);
});
test('维护演示记录不改变既有报表归属和金额', () => {
  const before = JSON.stringify(report.orderDetailQuery({ start: defaults.start, end: defaults.end }));
  m.transition(draft(), 'submit', records(), '时间');
  assert.equal(JSON.stringify(report.orderDetailQuery({ start: defaults.start, end: defaults.end })), before);
});
