const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../shared/air-orders-model.js');
const B = require('../shared/air-business-model.js');
const F = require('../shared/air-funds-model.js');
const R = require('../shared/air-reconciliation-model.js');
const A = require('../shared/air-close-model.js');
const C = require('../shared/air-charter-model.js');
const D = require('../shared/air-source-demand-model.js');
const P = require('../shared/air-accounting-model.js');
const I = require('../shared/air-internal-cost-model.js');
const role = 'superadmin';

test('同一管理员完成来源需求提交、计调核对、票务接收，仍按节点先后办理', () => {
  const db = M.seed(), o = db.orders[0];
  o.roster = { sourceVersion: 1, claimed: 1, accepted: 1, pending: null };
  const source = { orderNo: o.sourceOrder, group: o.group, start: o.legs[0].date, end: o.legs[1].date, tourAmount: 25600, currency: 'CNY', people: M.copy(o.people) };
  const request = { orderId: o.id, group: o.group, legIds: o.legs.map(l => l.id), peopleIds: o.people.map(p => p.id), dates: Object.fromEntries(o.legs.map(l => [l.id, l.date])) };
  D.submit(db, source, [request], '原型全权限流程核对', role);
  const saved = db.orders.find(x => x.id === o.id);
  assert.throws(() => D.accept(saved, role, '不能跳过核对'), /计调/);
  D.review(saved, role, '需求范围一致');
  assert.equal(D.accept(saved, role, '接收本次需求').state, '已接收');
  assert.ok(M.canSee({ ...o, company: '另一演示公司' }, role));
  assert.ok(M.canEdit(o, role));
});

test('同一管理员发起退改并连续审批两节点，登记结果与双方款项', () => {
  const db = B.seed(), o = db.orders[0], c = B.createChange(db, o, role);
  Object.assign(c, { type: '补收调整', scope: [B.pair(o.tickets[0])], reason: '原型全权限核对', rule: '演示补差约定', evidence: '模拟确认单', bearer: '客户', saleDelta: 500, costDelta: 400 });
  B.saveChange(db, c, role, true);
  B.review(db, 'change', c.id, '通过', '主管节点核对', role);
  assert.equal(c.state, '审批中');
  assert.equal(c.review.at, 1);
  B.review(db, 'change', c.id, '通过', '财务节点核对', role);
  assert.equal(c.state, '处理中');
  B.recordBusiness(db, c, [{ key: c.scope[0], state: '成功', ref: 'DEMO-ADMIN-CHANGE' }], role);
  B.recordFunds(c, 'customer', '成功', 'DEMO-CUSTOMER', role);
  B.recordFunds(c, 'supplier', '成功', 'DEMO-SUPPLIER', role);
  assert.equal(c.state, '已完成');
  assert.throws(() => B.review(db, 'change', c.id, '通过', '重复审批', role));
});

test('同一管理员申请、审批、执行付款，未批准仍不能执行', () => {
  const db = F.seed(), s = db.sources[0];
  const r = F.request(db, { source: s.id, amount: 5000, date: '2026-10-20', basis: '模拟供应确认单' }, role);
  assert.throws(() => F.execute(db, 'requests', r.id, { result: '成功', ref: 'EARLY' }, role));
  F.review(db, 'requests', r.id, true, '已核对采购依据', role);
  F.execute(db, 'requests', r.id, { result: '成功', ref: 'DEMO-ADMIN-PAY' }, role);
  assert.equal(r.state, '已完成');
});

test('同一管理员核对和审批BSP账单，提交后仍保留复核步骤', () => {
  const db = R.seed(), s = R.create(db, { company: R.company, kind: 'BSP账单', partner: '国际航协结算组织', account: '演示BSP', currency: 'CNY', period: '2026-10', from: '2026-10-01', to: '2026-10-31', basis: '全权限核对依据' }, role);
  const row = { ref: '9998111999991', kind: '出票', date: '2026-10-17', amount: 1380 };
  R.addRows(s, 'external', [row], role, '模拟账单'); R.addRows(s, 'system', [row], role, '模拟日报');
  R.suggest(s, role); R.submit(s, role);
  assert.equal(s.state, '审批中');
  R.review(s, true, '票号与金额一致', role);
  assert.equal(s.state, '已确认');
});

test('同一管理员申请、批准、开票，也能办理采购收票及撤回其他演示人的在途申请', () => {
  const db = A.seed(), source = A.visibleSources(db, role).find(s => s.side === '销项' && s.policy === '演示约定可申请');
  const i = A.requestInvoice(db, { items: [{ source: source.id, amount: 100 }], title: source.partner, taxNo: '演示税号', item: '客票服务', basis: '模拟开票依据' }, role);
  A.reviewInvoice(db, i.id, '通过', '核对开票范围', role); A.beginInvoice(db, i.id, role);
  A.invoiceResult(db, i.id, { result: '成功', no: 'DEMO-ADMIN-INVOICE', date: '2026-10-17', basis: '模拟回执' }, role);
  assert.equal(i.state, '已完成');
  const receiptSource = A.visibleSources(db, role).find(s => s.side === '进项' && A.invoiceBalance(db, s.id).available >= 100);
  const received = A.receiveInvoice(db, { items: [{ source: receiptSource.id, amount: 100 }], invoiceType: '税务发票', no: 'DEMO-ADMIN-RECEIPT', date: '2026-10-17', basis: '模拟收票核对' }, role);
  assert.equal(received.state, '已完成');
  const pending = A.requestInvoice(db, { items: [{ source: source.id, amount: 100 }], title: source.partner, taxNo: '演示税号', item: '客票服务', basis: '模拟开票依据' }, 'ticket');
  A.withdrawInvoice(db, pending.id, role); assert.equal(pending.state, '已撤回');
});

test('同一管理员结算、内部费用接收及核算准备，可查看全部来源', () => {
  const b = B.seed(), s = b.settlements.find(s => s.id === 'HFJS20261017001');
  B.submitSettlement(b, s, role); B.review(b, 'settlement', s.id, '通过', '主管核对', role); B.review(b, 'settlement', s.id, '通过', '财务核对', role);
  const costs = I.seed(), src = I.source(b, s.id);
  assert.equal(I.decide(costs, b, s.id, src.stamp, '接收', '确认供票范围', role).amount, 81000);
  const rows = P.sources(b, C.seed()), source = rows.find(x => x.id === s.id), db = { records: [] }, periods = A.seed().periods;
  assert.equal(P.visible(rows, role).length, rows.length);
  const record = P.confirm(db, source, { sale: true, cost: true, period: '2026-10', basis: '模拟核算准备' }, periods, role);
  P.generate(db, record.id, source, periods, role);
  assert.equal(record.state, '待配置');
});

test('同一管理员发起并批准包机补充调整，已确认金额独立保留', () => {
  const db = C.seed(), p = db.projects.find(x => x.id === 'CH20260912001');
  C.adjustment(p, { saleDelta: 1500, costDelta: 200, ref: 'DEMO-ADMIN-ADJ', basis: '模拟补收确认' }, role);
  assert.ok(p.review);
  C.review(p, '通过', '核实本次差额', role);
  assert.equal(p.review, null);
  assert.ok(P.sources(B.seed(), db).some(s => s.type === '包机调整' && s.sale === 1500));
});

test('管理员维护模板后可导入出票日报，不需切换配置与票务身份', () => {
  const config = A.seed(), t = config.templates[0];
  A.saveTemplate(config, t.id, { required: t.required.join(','), state: t.state, basis: '模拟名单模板核对' }, role);
  assert.equal(t.history[0].who, '超级管理员');
  const db = M.seed(), row = { type: '出票', issuedDate: '2026-10-17', ticket: '9998111999901', pnr: 'ADMIN1', airlineNo: 'CA-ADMIN', name: '演示乘客', docNo: 'DEMO-P01', date: '2026-11-23', flight: 'CA1501', from: 'PEK', to: 'SHA', fare: '1200', tax: '180', cost: '1380', customer: '华远科技有限公司', sale: '1500', currency: 'CNY', internal: '否' };
  const result = M.applyImport([row], db, role, '日报');
  assert.equal(result.results[0].state, '已应用');
  assert.ok(db.orders.some(o => o.tickets.some(t => t.ticket === row.ticket)));
});
