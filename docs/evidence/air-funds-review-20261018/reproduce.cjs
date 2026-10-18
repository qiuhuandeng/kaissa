// 现状审查：仅使用内存副本，不写入业务会话；输出不代表修复验收。
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const F = require(path.join(root, 'shared/air-funds-model.js'));
const B = require(path.join(root, 'shared/air-business-model.js'));
const R = require(path.join(root, 'shared/air-reconciliation-model.js'));
const I = require(path.join(root, 'shared/air-inventory-model.js'));
const results = [];
const run = (name, fn) => {
  try { results.push({ name, ...fn() }); }
  catch (error) { results.push({ name, unexpectedError: error.message }); }
};
const reasonFrom = fn => { try { fn(); return ''; } catch (error) { return error.message; } };
const confirmClaim = (db, order, receipt) => {
  const claim = F.claim(db, receipt.id, { lines: [{ orderId: order.id, amount: 6000 }] }, 'superadmin');
  F.reviewClaim(db, claim.id, true, '审查确认到账', 'superadmin');
};

run('普通机位申请只保留编号', () => {
  const inventory = I.seed();
  const row = inventory.find(r => r.status === '执行中' && r.payments.some(p => !p.paid && !p.request));
  const funds = F.seed(), before = JSON.stringify(funds);
  const index = row.payments.findIndex(p => !p.paid && !p.request);
  const id = I.paymentRequest(row, index);
  return { requestCreated: !!id, node: row.payments[index].name,
    fundsUnchanged: before === JSON.stringify(funds), fundsHasRequest: funds.requests.some(p => p.id === id) };
});

run('非预置BSP付款来源无已审账户候选', () => {
  const db = R.seed(), sheet = R.get(db, 'HFDZ20261017001'), funds = F.seed();
  R.suggest(sheet, 'finance');
  for (const row of R.rows(sheet).filter(r => r.issue !== '金额一致')) {
    R.resolve(sheet, row.id, { result: R.resolutionOptions(row)[0], reason: '审查算例',
      ref: 'REVIEW-' + row.id, original: '9997000000001', settlement: 'HFJS-1017' }, 'finance');
  }
  R.submit(sheet, 'finance');
  R.review(sheet, true, '审查算例', 'supervisor');
  // 去掉预置来源，验证正常账单首次生成付款来源的分支。
  funds.sources = funds.sources.filter(x => x.id !== 'SF05');
  const source = R.connectPayment(db, sheet, funds, 'superadmin');
  const reason = reasonFrom(() => F.request(funds, { source: source.id, amount: source.total,
    date: source.date, basis: sheet.id }, 'superadmin'));
  return { sheetState: sheet.state, accountApproved: source.approved,
    availableAccounts: F.accountCandidates(funds, source.id, 'superadmin').length, reason };
});

run('收款申请逐单上限未核对', () => {
  const db = F.seed(), orders = db.orders.slice(0, 2);
  const request = F.createLink(db, orders.map(o => o.id), new Date(Date.now() + 3600000).toISOString(),
    'superadmin', { lines: orders.map(o => ({ orderId: o.id, amount: 1000 })) });
  F.payResult(db, request.id, { result: '成功', ref: 'REVIEW-ALLOCATION', amount: 2000,
    lines: [{ orderId: orders[0].id, amount: 2000 }] }, 'superadmin');
  return { requestedPerOrder: request.lines.map(l => l.amount),
    receivedPerOrder: orders.map(o => F.received(db, o)), state: request.state };
});

run('待查交易遇链接过期无法登记查询结果', () => {
  const db = F.seed(), order = db.orders[0];
  const request = F.createLink(db, [order.id], new Date(Date.now() + 3600000).toISOString(), 'superadmin');
  F.payResult(db, request.id, { result: '结果待查', ref: 'REVIEW-UNKNOWN' }, 'superadmin');
  request.until = new Date(Date.now() - 1000).toISOString();
  const reason = reasonFrom(() => F.payResult(db, request.id, { result: '成功', query: true,
    ref: 'REVIEW-UNKNOWN', amount: 1000, lines: [{ orderId: order.id, amount: 1000 }] }, 'superadmin'));
  return { state: request.state, reason };
});

run('平台充值总额达到预置额度后不能再次充值', () => {
  const db = F.seed(), source = db.sources.find(s => s.id === 'SF02');
  const request = F.request(db, { source: source.id, amount: 50000,
    date: F.today(), basis: '审查充值' }, 'superadmin');
  F.review(db, 'requests', request.id, true, '审查批准', 'superadmin');
  F.execute(db, 'requests', request.id, { result: '成功', ref: 'REVIEW-TOPUP' }, 'superadmin');
  const reason = reasonFrom(() => F.request(db, { source: source.id, amount: 10000,
    date: F.today(), basis: '第二次充值' }, 'superadmin'));
  return { platformBalance: F.platformBalance(db, db.platforms[0]),
    availableForRecharge: F.sourceBalance(db, source).available, reason };
});

run('同单资金实收与结算读取实收不一致', () => {
  const funds = F.seed(), order = { ...funds.orders[0], tickets: [], people: [], cost: 5500 };
  const business = { orders: [], changes: [], settlements: [] };
  B.ensureOrder(business, order);
  confirmClaim(funds, order, funds.receipts[0]);
  return { fundsReceived: F.received(funds, order),
    settlementReceived: B.lineFrom(business, B.order(business, order.id)).received };
});

run('退改已退款未扣除普通退款的可退金额', () => {
  const db = F.seed(), order = db.orders[0], receipt = db.receipts[0];
  confirmClaim(db, order, receipt);
  // 合法已完成退改的资金结果输入，检验普通退款对该结果的处理。
  F.syncAdjustments(db, { changes: [{ id: 'REVIEW-CHANGE', orderId: order.id,
    company: order.company, currency: order.currency, effective: true, saleDelta: -1000,
    customer: { state: '成功', amount: -1000 } }] });
  const before = F.received(db, order), available = F.refundAvailable(db, receipt, order.id);
  const refund = F.refund(db, { receipt: receipt.id, orderId: order.id, amount: 6000,
    payee: receipt.payer, account: '演示账户', basis: '退款依据' }, 'superadmin');
  F.review(db, 'refunds', refund.id, true, '审查复核', 'superadmin');
  F.execute(db, 'refunds', refund.id, { result: '成功', ref: 'REVIEW-SECOND-REFUND' }, 'superadmin');
  return { netReceivedBefore: before, ordinaryRefundAvailable: available,
    newRefund: refund.amount, state: refund.state, netReceivedAfter: F.received(db, order) };
});

console.log(JSON.stringify({ type: '现状缺口复现，非修复验收', results }, null, 2));
if (results.some(r => r.unexpectedError)) process.exitCode = 1;
