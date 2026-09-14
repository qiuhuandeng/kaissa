const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../shared/store-governance-model.js');
const options = { reason: '更正合作信息', mode: '指定日期', requestedDate: '2026-09-20' };
test('提交及撤回不覆盖当前有效资料或其他审核结果', () => {
  const state = M.create('2026-09-14'), store = state.stores[3], before = M.copy(store);
  const r = M.save(state, store.id, 'finance', { ...store.finance, settlement: '月结' }, options);
  assert.deepEqual(store, before);
  M.withdraw(state, r.id);
  assert.equal(r.status, '已撤回'); assert.deepEqual(store, before);
});
test('未来批准版本到期才启用，旧内容仍保留', () => {
  const state = M.create('2026-09-14'), store = state.stores[0];
  assert.equal(store.profile.contact, '孙丽');
  M.refresh(state, '2026-09-20'); assert.equal(store.profile.contact, '孙丽');
  M.refresh(state, '2026-09-21'); assert.equal(store.profile.contact, '郑华');
  const r = state.records.find(x => x.id === 'BG-MS-003');
  assert.equal(r.before.contact, '孙丽'); assert.equal(r.effectiveAt, '2026-09-21');
  const length = r.events.length; M.refresh(state, '2026-09-22'); assert.equal(r.events.length, length);
});
test('审批延迟按批准日期生效，不追溯', () => {
  const state = M.create('2026-09-14'), r = state.records.find(x => x.id === 'BG-MS-004');
  assert.equal(r.requestedDate, '2026-09-11'); assert.equal(r.effectiveAt, '2026-09-13');
  assert.equal(r.status, '已生效'); assert.ok(!r.before.destinations.includes('日本'));
});
test('退回重提沿用申请，仍不改变有效配置', () => {
  const state = M.create('2026-09-14'), r = state.records.find(x => x.id === 'BG-MS-002');
  const next = M.save(state, r.storeId, 'finance', { ...r.after, paymentNode: '按补充协议' }, options, r.id);
  assert.equal(next.id, r.id); assert.equal(state.stores[0].finance.settlement, '单单结');
  assert.equal(state.records.filter(x => x.id === r.id).length, 1);
});
test('同类待批申请防止重复提交', () => {
  const state = M.create('2026-09-14');
  assert.throws(() => M.save(state, 'store-1', 'sales', {}, options), /已有同类申请/);
  assert.throws(() => M.withdraw(state, 'BG-MS-003'), /仅审批中/);
});
test('资质失效阻止恢复；账户冻结不由恢复营业解除', () => {
  const state = M.create('2026-09-14');
  assert.throws(() => M.save(state, 'store-6', 'restore', { status:'正常' }, options), /资质已到期/);
  const store = state.stores[2];
  const r = M.save(state, store.id, 'restore', { status:'正常' }, { ...options, mode:'批准后生效' });
  assert.equal(store.status, '暂停');
  r.approvedAt = '2026-09-14'; r.status = '待生效'; M.refresh(state,'2026-09-14');
  assert.equal(store.status, '正常'); assert.equal(store.accountState, '整户冻结');
});
test('新店开通不自动通过销售和财务配置', () => {
  const state = M.create('2026-09-14'), store = state.stores[1];
  store.reviews.profile = '已通过'; M.refresh(state, '2026-09-17');
  assert.equal(store.status, '正常'); assert.equal(store.reviews.sales, '未提交'); assert.equal(store.reviews.finance, '已退回');
});
