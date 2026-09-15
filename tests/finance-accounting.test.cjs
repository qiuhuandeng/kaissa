const test = require('node:test'), assert = require('node:assert/strict');
const m = require('../shared/finance-accounting-model.js'), rf = require('../shared/return-finance-model.js'), rc = require('../shared/resource-cost-report-model.js');
const query = (q = {}, data) => m.query({ dataset: 'demo', ...q }, data);
test('待补资料不是零', () => assert.equal(m.query({ ...m.defaults, dataset: 'pending' }).pending, true));
test('会计发生完全复用回团算法', () => {
  const q = { ...m.defaults, dataset: 'demo', scenario: 'cross' };
  const a = m.query(q), b = rf.run({ ...q, mode: 'flows' }, null, m.fixture());
  assert.deepEqual(a.rows.map(r => r.amount), b.rows.map(r => r.amount));
  assert.equal(a.rows.find(r => r.id === 'SR02A').actual, '2026-04-28');
});
test('同完成范围两处收入成本同额', () => {
  const q = { ...m.defaults, dataset: 'demo', view: 'completion', scenario: 'cross' };
  assert.deepEqual(m.query(q).rows.map(r => [r.income,r.cost]), rf.run({ ...q, mode: 'completion' }, null, m.fixture()).rows.map(r => [r.income,r.cost]));
});
test('暂估冲回转实际累计6200', () => assert.equal(query({ scenario: 'estimate' }).sections[0].rows.find(r => r.kind === '成本结转').amount, 6200));
test('跨期后补不改变五月', () => assert.equal(query({ scenario: 'adjustment', periodEnd: '2026-05' }).sections[0].rows.find(r => r.kind === '成本结转').amount, 7000));
test('同源冲突不计金额', () => { const r=query({ scenario: 'conflict' }); assert.equal(r.rows.length,0); assert.match(r.sections[1].rows[0].status,/冲突/); });
test('内部核对不强平期间币种缺方', () => {
  const r=query({view:'internal'}).rows, by=id=>r.find(v=>v.id===id);
  assert.equal(by('INT02').difference,200); assert.match(by('INT03').status,/同法人/); assert.equal(by('INT03').difference,null);
  assert.match(by('INT04').status,/期间/); assert.equal(by('INT05').difference,null); assert.equal(by('INT06').difference,null); assert.equal(by('INT07').peerAmount,null);
});
test('筛选一方保留另一方核对', () => assert.equal(query({view:'internal',entity:'B公司（演示）'}).rows.find(r=>r.id==='INT01').peerAmount,8000));
test('NC旧不平衡示例不是通过', () => { const r=query({view:'nc',periodStart:'2025-06'}).rows; assert.equal(r.find(v=>v.id==='NC-PRJ-20250623').difference,-393400); assert.equal(r.find(v=>v.id==='NC-JS-20260624001').difference,-143800); });
test('正常未结事项不影响NC核对', () => { const r=query({view:'nc'}).rows.find(r=>r.id==='NC-DEMO01'); assert.equal(r.status,'来源与返回一致'); assert.match(r.open,/未收款/); });
test('NC返回差异和结果未知分开', () => { const r=query({view:'nc'}).rows; assert.equal(r.find(v=>v.id==='NC-DEMO02').returnDifference,200); assert.equal(r.find(v=>v.id==='NC-DEMO03').returnDifference,null); });
test('资源跨团分配不复制采购', () => { const r=rc.query({dataset:'demo',tour:'CRUISE-A'}); assert.equal(r.rows.reduce((s,r)=>s+(r.confirmedCost||0),0),100000); assert.equal(r.sections[0].rows[0].purchase,200000); assert.equal(r.sections[0].rows[0].allocated,140000); });
test('预估确认应付付款和待损分列', () => { const r=rc.query({dataset:'demo',view:'resources'}).rows[0]; assert.deepEqual([r.estimated,r.purchase,r.payable,r.paid,r.confirmedLoss,r.pendingLoss],[205000,200000,160000,70000,20000,20000]); });
test('分配重复不重计、超额不计算', () => { const d=rc.fixture(); d.allocations.push({...d.allocations[0]}); assert.equal(rc.query({dataset:'demo'},d).sections[0].rows[0].allocated,140000); d.allocations[0].amount=300000; assert.equal(rc.query({dataset:'demo'},d).sections[0].rows[0].allocated,null); });
test('数量单位及缺金额保持独立', () => { const r=rc.query({dataset:'demo',view:'resources'}).rows; assert.deepEqual(r.map(r=>r.unit),['舱','座','铺']); assert.equal(r[2].allocated,null); assert.equal(r[2].paid,0); });
test('产品风险仅按明确产品归属筛选，不改变分配金额', () => {
  const q = { dataset: 'demo', view: 'resources', product: '地中海邮轮' };
  const result = rc.query(q);
  assert.deepEqual(result.rows.map(r => r.batch), ['CABIN-01']);
  assert.equal(result.rows[0].allocated, 140000);
  const data = rc.fixture(); delete data.batches[0].product;
  assert.equal(rc.query(q, data).rows.length, 0);
  assert.equal(rc.query({ dataset: 'demo', view: 'resources' }, data).rows.length, 3);
});
