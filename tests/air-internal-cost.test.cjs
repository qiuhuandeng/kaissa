const { test } = require('node:test');
const assert = require('node:assert/strict');
const B = require('../shared/air-business-model.js');
const M = require('../shared/air-internal-cost-model.js');
const id = 'HFJS20261017001';
function setup(approved = true) {
  const business = B.seed(), db = M.seed(), s = business.settlements.find(s => s.id === id);
  if (approved) { B.submitSettlement(business, s, 'ticket'); B.review(business, 'settlement', id, '通过', '金额核对一致', 'supervisor'); B.review(business, 'settlement', id, '通过', '确认供票', 'finance'); }
  return { business, db, s };
}
function decide(x, choice = '接收', note = '团号与确认单核对一致', role = 'product', stamp) { const src = M.source(x.business, id); return M.decide(x.db, x.business, id, stamp ?? src.stamp, choice, note, role); }
function revise(x, sale = 42000) {
  B.requestUnlock(x.s, ['sale'], '供票金额更正', 'ticket'); B.review(x.business, 'unlock', id, '通过', '批准核实更正', 'finance'); B.startRevision(x.s, 'ticket');
  const updates = B.copy(x.s); updates.lines[0].sale = sale; B.saveSettlement(x.business, x.s, updates, 'ticket');
}
function approve(x) { B.submitSettlement(x.business, x.s, 'ticket'); B.review(x.business, 'settlement', id, '通过', '通过', 'supervisor'); B.review(x.business, 'settlement', id, '通过', '通过', 'finance'); }
function adjustment(x, sale = -1000, cost = -800) {
  const a = B.copy(x.s); Object.assign(a, { id: 'HFJT-TEST', kind: '调整', parent: id, state: '已结算', versions: [] });
  a.lines = [{ ...a.lines[0], sale, cost, changeIds: ['CHANGE-TEST'] }];
  a.versions = [{ version: 1, lines: B.copy(a.lines), totals: B.total(a.lines), period: '2026-10', by: '财务演示', at: '2026-10-17' }];
  x.business.settlements.push(a); return a;
}
test('未确认原结算不可接收，不能把81000草稿当作已确认费用', () => { const x = setup(false); assert.equal(M.view(x.db, M.source(x.business, id)).state, '航服待确认'); assert.throws(() => decide(x), /尚未审批确认/); assert.equal(x.db.receipts.length, 0); });
test('经主管与财务通过后接收81000，产品成本不叠加采购80000', () => { const x = setup(); const sourceBefore = JSON.stringify(x.business); const v = decide(x); assert.equal(v.amount, 81000); assert.equal(M.source(x.business, id).externalCost, 80000); assert.deepEqual(M.costs(x.db).map(c => [c.amount, c.readonly]), [[81000, true]]); assert.equal(JSON.stringify(x.business), sourceBefore); });
test('同一版本重复接收阻断，刷新后仍只保留一笔成本', () => { const x = setup(); decide(x); x.db = JSON.parse(JSON.stringify(x.db)); assert.throws(() => decide(x), /已接收/); assert.equal(M.costs(x.db).length, 1); assert.equal(M.receipt(x.db, id).history.length, 1); });
test('首次拒绝保留原因且不产生团期成本', () => { const x = setup(); const v = decide(x, '拒绝', '本团人数与供票确认不一致'); assert.equal(v.state, '已拒绝'); assert.equal(v.amount, 0); assert.equal(M.costs(x.db).length, 0); assert.match(v.rejected.note, /人数/); });
test('拒绝原因及接收依据均必填', () => { const x = setup(); for (const c of ['接收', '拒绝']) assert.throws(() => decide(x, c, '  '), /填写/); assert.equal(x.db.receipts.length, 0); });
test('拒绝后可带新核对依据重新接收，拒绝记录不丢失', () => { const x = setup(); decide(x, '拒绝', '名单待核实'); decide(x, '接收', '名单已核实，确认书HF-01'); assert.equal(M.view(x.db, M.source(x.business, id)).state, '已接收'); assert.deepEqual(M.receipt(x.db, id).history.map(h => h.decision), ['接收', '拒绝']); });
test('原单修订草稿和审核中均保留原已确认金额及接收版本', () => { const x = setup(); decide(x); revise(x); assert.equal(M.source(x.business, id).amount, 81000); assert.equal(M.view(x.db, M.source(x.business, id)).state, '已接收'); B.submitSettlement(x.business, x.s, 'ticket'); assert.equal(M.source(x.business, id).amount, 81000); });
test('修订批准后提示1500差额，未复核不自动改产品成本', () => { const x = setup(); decide(x); revise(x); approve(x); const v = M.view(x.db, M.source(x.business, id)); assert.equal(v.state, '待复核'); assert.equal(v.amount, 81000); assert.equal(v.delta, 1500); });
test('复核新版本后替换原成本为82500，不新增第二笔81000', () => { const x = setup(); decide(x); revise(x); approve(x); const v = decide(x); assert.equal(v.amount, 82500); assert.equal(M.costs(x.db).length, 1); assert.equal(v.history[0].before, 81000); assert.equal(v.history[0].delta, 1500); });
test('拒绝调整保留原81000；新供票额与1500差异仍可核对', () => { const x = setup(); decide(x); revise(x); approve(x); const v = decide(x, '拒绝', '1500补差无依据'); assert.equal(v.state, '已拒绝'); assert.equal(v.amount, 81000); assert.equal(v.delta, 1500); });
test('已确认补充调减按差额累计，退款后产品成本80000', () => { const x = setup(); decide(x); adjustment(x); assert.equal(M.source(x.business, id).amount, 80000); assert.equal(M.view(x.db, M.source(x.business, id)).delta, -1000); decide(x); assert.equal(M.costs(x.db)[0].amount, 80000); });
test('未确认补充调整不进入供票接收范围', () => { const x = setup(); const a = adjustment(x); a.state = '审核中'; a.versions = []; assert.equal(M.source(x.business, id).amount, 81000); });
test('关闭前来源已换版，旧抽屉提交阻断且保留原成本', () => { const x = setup(); decide(x); const stamp = M.source(x.business, id).stamp; revise(x); approve(x); assert.throws(() => decide(x, '接收', '依据', 'product', stamp), /版本已变化/); assert.equal(M.costs(x.db)[0].amount, 81000); });
test('航服财务只读，其他公司无法接收', () => { for (const role of ['finance', 'other']) { const x = setup(); assert.throws(() => decide(x, '接收', '依据', role), /范围|岗位/); assert.equal(x.db.receipts.length, 0); } });
test('无团散票、外部客户、其他供票公司不进入内部费用', () => { const x = setup(); for (const fields of [{ group: '' }, { customer: '外部客户' }, { company: '其他公司' }]) { const s = { ...x.s, ...fields }; assert.equal(M.eligible(s), false); } assert.equal(M.eligible(x.business.settlements.find(s => s.id === 'HFJS20261017002')), false); });
test('已接收后变更团号或币种不可改挂费用', () => { for (const k of ['group', 'currency']) { const x = setup(); decide(x); x.s[k] = k === 'group' ? 'OTHER' : 'USD'; assert.throws(() => decide(x), /不可改挂费用/); assert.equal(M.costs(x.db)[0].amount, 81000); } });
test('原已确认版合计与明细不符必须回原单核对', () => { const x = setup(); x.s.versions[0].totals.sale = 80000; assert.throws(() => M.source(x.business, id), /合计与明细不符/); });
test('补充调整公司、团号及币种混用均阻断', () => { for (const k of ['company', 'group', 'currency']) { const x = setup(); adjustment(x)[k] = 'OTHER'; assert.throws(() => M.source(x.business, id), /不一致/); } });
test('同订单从另一原结算再次接收被阻断', () => { const x = setup(); decide(x); const second = B.copy(x.s); second.id = 'HFJS-SECOND'; x.business.settlements.push(second); const src = M.source(x.business, second.id); assert.throws(() => M.decide(x.db, x.business, second.id, src.stamp, '接收', '依据', 'product'), /另一张结算单/); });
test('关联原结算及其调整单不得手录，草稿也须走原单审批接收', () => { const x = setup(); const a = adjustment(x); for (const ref of [id, a.id]) assert.throws(() => M.manualCheck(x.business, ref), /不能手工重复录入/); assert.throws(() => M.manualCheck(setup(false).business, id), /不能手工重复录入/); });
test('其他交通成本及普通采购可独立维护，不按交通类别全量禁止', () => { const x = setup(); for (const ref of ['', 'CA-OTHER-TICKET', 'HFJS20261017002']) assert.equal(M.manualCheck(x.business, ref), true); });
test('同额新版本仍须复核确认，不凭金额一致省略确认', () => { const x = setup(); decide(x); revise(x, 40500); approve(x); const v = M.view(x.db, M.source(x.business, id)); assert.equal(v.state, '待复核'); assert.equal(v.delta, 0); decide(x); assert.equal(M.receipt(x.db, id).history.length, 2); });
test('调减至零可接收，累计负额不可强行冲平', () => { const x = setup(); decide(x); adjustment(x, -81000, -80000); assert.equal(decide(x).amount, 0); const y = setup(); adjustment(y, -82000, -80000); assert.throws(() => M.source(y.business, id), /不能小于零/); });
test('原结算已作废不可接收，重复拒绝不生成新记录', () => { const x = setup(); decide(x, '拒绝', '缺依据'); assert.throws(() => decide(x, '拒绝', '仍缺依据'), /已拒绝/); x.s.state = '已作废'; assert.throws(() => decide(x), /未找到/); });
