// 业务边界验证：一单多种结算关系、差异阻断、双方同次确认、公司边界与收付独立。
const assert = require('node:assert/strict');
const M = require('../shared/intercompany-reconciliation-model.js');
let count = 0;
const check = (name, fn) => { fn(); console.log('PASS ' + name); count++; };
const fresh = () => M.seed();
check('普通自营、体系外外采及缺依据订单不能形成公司间对账', () => {
  for (const patch of [{ payer: 'fj', payee: 'fj' }, { payee: 'external' }, { kind: 'ordinary' }, { evidence: '' }, { ready: false }]) {
    const s = fresh(); Object.assign(s.sources[0], patch); assert.throws(() => M.create(s, 'purchase-901', 'fj')); assert.equal(s.records.length, 4);
  }
  assert.throws(() => M.create(fresh(), 'purchase-902', 'fj'), /资源待确认/);
  assert.throws(() => M.create(fresh(), 'UNKNOWN', 'fj'));
});
check('不得以网址公司名或无关公司身份建立对账', () => { assert.equal(M.companyId('北京'), ''); assert.equal(M.companyId('福建凯撒旅游有限公司'), 'fj'); assert.throws(() => M.create(fresh(), 'purchase-901', 'other'), /结算双方/); });
check('同一采购关系防止重复建立；代收和佣金是独立关系', () => {
  const s = fresh(), r = M.create(s, 'purchase-901', 'fj'); assert.equal(r.phase, 'draft'); assert.equal(r.claims.fj, 9600); assert.throws(() => M.create(s, 'purchase-901', 'bj'), /请勿重复/);
  assert.equal(s.records.filter(r => M.seed().sources.find(x => x.id === r.sourceId)?.order === 'KSIC260803').length, 2);
});
check('销售／供货方向按订单反转，已收已付和增减项金额正确', () => {
  const s = fresh(), r = s.records[1], source = s.sources.find(x => x.id === r.sourceId);
  assert.equal(M.total(source), 12200); assert.deepEqual([M.view(source, r, 'fj').relation, M.view(source, r, 'bj').relation], ['我方供货', '我方采购']);
  assert.equal(M.view(source, r, 'fj').remaining, 8200); assert.equal(M.view(source, r, 'bj').actual, 4000);
});
check('差异未清不能确认，不擅自修改另一方金额', () => {
  const s = fresh(), r = s.records[0]; assert.throws(() => M.confirm(s, r.id, 'fj', 1), /差异/); assert.equal(r.claims.bj, 8200); assert.equal(r.confirmations.fj, null);
});
check('更正核对金额需有效金额和原因；来源结算金额不改', () => {
  for (const amount of ['-1', '1.001', '', 'NaN', 'Infinity', '1e5']) { const s = fresh(); assert.throws(() => M.update(s, s.records[0].id, 'fj', 1, amount, '核对依据')); }
  const s = fresh(), r = s.records[0], before = JSON.stringify(s.sources); assert.throws(() => M.update(s, r.id, 'fj', 1, '8200', ''), /原因/);
  M.update(s, r.id, 'fj', 1, '8200', '补充核对已确认增项200元'); assert.equal(r.version, 2); assert.equal(r.phase, 'pending'); assert.equal(JSON.stringify(s.sources), before); assert.equal(r.history[0].previous.claims.fj, 8000);
});
check('调整后双方之前确认失效，旧次确认不接受', () => {
  const s = fresh(), r = s.records[1]; M.update(s, r.id, 'fj', 1, 12300, '发现核对差异'); assert.equal(r.confirmations.bj, null); assert.equal(r.confirmations.fj, null);
  assert.throws(() => M.confirm(s, r.id, 'bj', 1), /已更新/); assert.equal(r.history[0].previous.confirmations.bj, 1);
});
check('双方同次确认后已对账，但未收未付和现金记录不变', () => {
  const s = fresh(), r = s.records[1], before = JSON.stringify(s.sources); M.confirm(s, r.id, 'fj', 1); assert.equal(r.phase, 'confirmed'); assert.equal(JSON.stringify(s.sources), before);
  assert.equal(M.view(s.sources[3], r, 'fj').remaining, 8200); assert.throws(() => M.update(s, r.id, 'fj', 1, 0, '测试'), /只能查看/);
});
check('发起与提交不冒充另一公司确认', () => {
  const s = fresh(), r = M.create(s, 'purchase-901', 'fj'); assert.throws(() => M.submit(s, r.id, 'bj', 1), /发起方/); M.submit(s, r.id, 'fj', 1);
  assert.deepEqual(r.confirmations, { fj: null, bj: null }); M.confirm(s, r.id, 'fj', 1); assert.equal(r.phase, 'pending'); assert.equal(r.confirmations.bj, null); assert.throws(() => M.confirm(s, r.id, 'fj', 1), /已确认/);
  M.confirm(s, r.id, 'bj', 1); assert.equal(r.phase, 'confirmed');
});
check('双方金额相等但与来源不一致也不能通过', () => {
  const s = fresh(), r = s.records[1]; r.claims.fj = r.claims.bj = 10000; assert.throws(() => M.confirm(s, r.id, 'fj', 1), /结算依据/);
});
check('现金收付不一致与超额付款均阻断确认', () => {
  const s = fresh(), r = s.records[1], source = s.sources[3]; source.payerPaid = 5000; assert.throws(() => M.confirm(s, r.id, 'fj', 1), /收记录不一致/);
  source.payerPaid = source.payeeReceived = 13000; assert.throws(() => M.confirm(s, r.id, 'fj', 1), /超过/);
});
check('只能作废本人未提交草稿，不消除已确认记录', () => {
  const s = fresh(), r = M.create(s, 'purchase-901', 'fj'); assert.throws(() => M.voidDraft(s, r.id, 'bj', 1), /发起方/); M.voidDraft(s, r.id, 'fj', 1);
  assert.equal(r.phase, 'void'); assert.throws(() => M.submit(s, r.id, 'fj', 1), /只能查看/); assert.notEqual(M.create(s, 'purchase-901', 'fj').id, r.id);
  assert.throws(() => M.voidDraft(s, s.records.find(x => x.phase === 'confirmed').id, 'fj', 1), /只能查看/);
});
check('不相关公司不能保存、提交或确认已有对账', () => {
  const s = fresh(), r = s.records[0]; assert.throws(() => M.update(s, r.id, 'other', 1, 8200, '测试'), /结算双方/); assert.throws(() => M.confirm(s, r.id, 'other', 1), /结算双方/);
});
console.log('完成 ' + count + ' 项公司间对账业务边界检查');
