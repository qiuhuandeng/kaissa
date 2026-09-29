const assert = require('node:assert/strict');
const M = require('../shared/supplier-prepayment-return-model.js');
let count = 0;
const test = (name, fn) => { fn(); count += 1; console.log('PASS ' + name); };
const throws = (fn, part) => assert.throws(fn, error => error.message.includes(part));
const normalLines = [{ paymentId: 'PAY-PP-20260918001', amount: 5000 }, { paymentId: 'PAY-PP-20260922002', amount: 8000 }];
const apply = session => session.apply(session.get().version, { reason: '对账后多付，按原付款明细退回', lines: normalLines });

test('成功付款明细按已付减已冲抵已退已占用计算可退', () => {
  const r = M.createSession('workflow').get();
  assert.equal(r.payments[0].available, 30000);
  assert.equal(r.payments[1].available, 23000);
  assert.equal(r.payments[2].available, 0);
  assert.equal(r.payments[3].available, 0);
  assert.equal(r.payments[4].available, 0);
});
test('同一预付单可按两笔原付款分别申请5000和8000', () => {
  const s = M.createSession('workflow'); const r = apply(s);
  assert.equal(r.applications[0].amount, 13000);
  assert.equal(r.applications[0].lines.length, 2);
  assert.equal(r.totals.processing, 13000);
  assert.equal(r.totals.balance, 53000);
});
test('申请只占用可退余额不减少预付余额和净支付', () => {
  const s = M.createSession('workflow'), before = s.get(); apply(s); const after = s.get();
  assert.equal(after.totals.balance, before.totals.balance);
  assert.equal(after.totals.netPaid, before.totals.netPaid);
  assert.equal(after.totals.available, before.totals.available - 13000);
});
test('未付款成功的明细不能申请退回', () => {
  const s = M.createSession('workflow'); throws(() => s.apply(s.get().version, { reason: '付款未完成', lines: [{ paymentId: 'PAY-PP-20260926003', amount: 1000 }] }), '尚未付款成功');
});
test('已全额冲抵明细不能申请退回', () => {
  const s = M.createSession('workflow'); throws(() => s.apply(s.get().version, { reason: '重复退回', lines: [{ paymentId: 'PAY-PP-20260912004', amount: 1000 }] }), '已全额冲抵');
});
test('已全额退回明细不能再次申请退回', () => {
  const s = M.createSession('workflow'); throws(() => s.apply(s.get().version, { reason: '重复退回', lines: [{ paymentId: 'PAY-PP-20260910005', amount: 1000 }] }), '已全额冲抵、退回');
});
test('超过付款明细可退金额被拦截', () => {
  const s = M.createSession('workflow'); throws(() => s.apply(s.get().version, { reason: '超额', lines: [{ paymentId: 'PAY-PP-20260918001', amount: 30001 }] }), '超过可退金额');
});
test('在途退回占用防止同付款明细重复申请', () => {
  const s = M.createSession('workflow'); apply(s); throws(() => s.apply(s.get().version, { reason: '重复占用', lines: [{ paymentId: 'PAY-PP-20260918001', amount: 26000 }] }), '超过可退金额');
});
test('供应商凭据金额须等于退回申请金额', () => {
  const s = M.createSession('workflow'); apply(s); throws(() => s.submitProof(s.get().version, { reference: 'R1', date: '2026-09-29', file: 'r.pdf', amount: 12000 }), '须等于本次申请金额');
});
test('供应商上传凭据不减少余额和实际净支付', () => {
  const s = M.createSession('workflow'); apply(s); const before = s.get(); const r = s.submitProof(before.version, { reference: 'R1', date: '2026-09-29', file: 'r.pdf', amount: 13000 });
  assert.equal(r.applications[0].status, '退款凭据待核对');
  assert.equal(r.totals.balance, before.totals.balance);
  assert.equal(r.totals.netPaid, before.totals.netPaid);
});
test('缺供应商凭据仍可按真实流水登记到账并保留材料待补', () => {
  const s = M.createSession('workflow'); apply(s); const r=s.confirmReceipt(s.get().version, { flowId: 'CMB-IN-20260929001', basis: '到账', lines: [{ paymentId: 'PAY-PP-20260918001', amount: 5000 }, { paymentId: 'PAY-PP-20260922002', amount: 1000 }] }); assert.equal(r.applications[0].proof,null); assert.equal(r.applications[0].received,6000); assert.equal(r.totals.balance,47000); const completed=s.submitProof(r.version,{reference:'补材料-01',date:'2026-09-29',file:'退款凭据.pdf',amount:13000});assert.equal(completed.applications[0].status,'部分到账');assert.equal(completed.applications[0].received,6000);assert.equal(completed.totals.balance,47000);
});
test('首笔6000到账只按实际到账减少余额且状态部分到账', () => {
  const s = M.createSession('workflow'); apply(s); s.submitProof(s.get().version, { reference: 'R1', date: '2026-09-29', file: 'r.pdf', amount: 13000 });
  const r = s.confirmReceipt(s.get().version, { flowId: 'CMB-IN-20260929001', basis: '第一笔到账', lines: [{ paymentId: 'PAY-PP-20260918001', amount: 5000 }, { paymentId: 'PAY-PP-20260922002', amount: 1000 }] });
  assert.equal(r.applications[0].status, '部分到账'); assert.equal(r.applications[0].received, 6000); assert.equal(r.totals.balance, 47000); assert.equal(r.totals.netPaid, 84000);
});
test('第二笔7000到账后结清且原付款金额不改写', () => {
  const s = M.createSession('workflow'); apply(s); s.submitProof(s.get().version, { reference: 'R1', date: '2026-09-29', file: 'r.pdf', amount: 13000 });
  s.confirmReceipt(s.get().version, { flowId: 'CMB-IN-20260929001', basis: '第一笔到账', lines: [{ paymentId: 'PAY-PP-20260918001', amount: 5000 }, { paymentId: 'PAY-PP-20260922002', amount: 1000 }] });
  const r = s.confirmReceipt(s.get().version, { flowId: 'CMB-IN-20260930002', basis: '第二笔到账', lines: [{ paymentId: 'PAY-PP-20260922002', amount: 7000 }] });
  assert.equal(r.applications[0].status, '已到账'); assert.equal(r.totals.balance, 40000); assert.equal(r.totals.netPaid, 77000); assert.deepEqual(r.payments.slice(0, 2).map(p => p.amount), [50000, 30000]);
});
test('重复到账流水不能再次使用', () => {
  const s = M.createSession('workflow'); apply(s); s.submitProof(s.get().version, { reference: 'R1', date: '2026-09-29', file: 'r.pdf', amount: 13000 });
  s.confirmReceipt(s.get().version, { flowId: 'CMB-IN-20260929001', basis: '第一笔到账', lines: [{ paymentId: 'PAY-PP-20260918001', amount: 5000 }, { paymentId: 'PAY-PP-20260922002', amount: 1000 }] });
  throws(() => s.confirmReceipt(s.get().version, { flowId: 'CMB-IN-20260929001', basis: '重复', lines: [{ paymentId: 'PAY-PP-20260922002', amount: 6000 }] }), '重复使用');
});
test('到账公司不一致不能核对', () => {
  const s = M.createSession('workflow'); apply(s); s.submitProof(s.get().version, { reference: 'R1', date: '2026-09-29', file: 'r.pdf', amount: 13000 });
  throws(() => s.confirmReceipt(s.get().version, { flowId: 'CMB-IN-20260930003', basis: '错误公司', lines: [{ paymentId: 'PAY-PP-20260918001', amount: 5000 }] }), '到账公司');
});
test('已开票场景按待确认政策阻断快速退回', () => {
  const s = M.createSession('workflow', 'invoiced'); throws(() => apply(s), '已开发票');
});
test('外币退款按待确认政策阻断提交', () => {
  const s = M.createSession('workflow', 'foreign'); throws(() => apply(s), '外币退款汇率口径待财务确认');
});
test('预付款申请未通过不能要求供应商退回', () => {
  const s = M.createSession('workflow', 'unapproved'); throws(() => apply(s), '尚未通过');
});

test('同单分次申请各有唯一编号，历史全额退回记录仍保留', () => {
  const s=M.createSession('workflow'); const first=apply(s).applications[0];
  const r=s.apply(s.get().version,{reason:'追加退回',lines:[{paymentId:'PAY-PP-20260918001',amount:1000}]});
  assert.notEqual(r.applications[0].id,first.id); assert.equal(r.applications.length,4);
  assert.equal(r.totals.processing,14000); assert.equal(r.totals.balance,53000);
  assert.equal(r.applications.find(a=>a.id==='RET-PP-20260924001').received,2000);
});
test('可指定较早申请核对，新增申请不覆盖旧单', () => {
  const s=M.createSession('workflow'), first=apply(s).applications[0];
  const newest=s.apply(s.get().version,{reason:'追加',lines:[{paymentId:'PAY-PP-20260918001',amount:1000}]}).applications[0];
  s.submitProof(s.get().version,{applicationId:first.id,reference:'R',date:'2026-09-29',file:'r.pdf',amount:13000});
  const r=s.confirmReceipt(s.get().version,{applicationId:first.id,flowId:'CMB-IN-20260929001',basis:'原单到账',lines:[{paymentId:'PAY-PP-20260918001',amount:5000},{paymentId:'PAY-PP-20260922002',amount:1000}]});
  assert.equal(r.applications.find(a=>a.id===first.id).received,6000); assert.equal(r.applications.find(a=>a.id===newest.id).received,0);
});
test('未退款申请撤销释放占用但不改已付与余额',()=>{
  const s=M.createSession('workflow'),r=apply(s),a=r.applications[0];
  const after=s.cancel(r.version,{applicationId:a.id,reason:'采购继续履行'});
  assert.equal(after.totals.processing,0);assert.equal(after.totals.available,53000);assert.equal(after.totals.balance,53000);assert.equal(after.applications[0].status,'已撤销');
  throws(()=>s.submitProof(after.version,{applicationId:a.id}),'无需重复');
});
test('已提交退款凭据或已到账不能撤销释放占用',()=>{
  const s=M.createSession('workflow');apply(s);s.submitProof(s.get().version,{reference:'R',date:'2026-09-29',file:'r.pdf',amount:13000});
  const before=s.get();throws(()=>s.cancel(before.version,{applicationId:before.applications[0].id,reason:'取消'}),'仅未退款');assert.deepEqual(s.get(),before);
});
test('缺核对依据失败不占用银行流水',()=>{
  const s=M.createSession('finance'),before=s.get();throws(()=>s.confirmReceipt(before.version,{flowId:'CMB-IN-20260929001',basis:'',lines:[{paymentId:'PAY-PP-20260918001',amount:5000},{paymentId:'PAY-PP-20260922002',amount:1000}]}),'请填写到账');assert.deepEqual(s.get(),before);
});
test('重复原付款到账分配不能绕过累计限制',()=>{
  const s=M.createSession('finance'),before=s.get();throws(()=>s.confirmReceipt(before.version,{flowId:'CMB-IN-20260929001',basis:'核对',lines:[{paymentId:'PAY-PP-20260918001',amount:3000},{paymentId:'PAY-PP-20260918001',amount:3000}]}),'重复分配');assert.deepEqual(s.get(),before);
});
test('退回占用后不能把同一笔款全部冲抵',()=>{
  const s=M.createSession('workflow');apply(s);const before=s.get();throws(()=>s.syncUsage('PAY-PP-20260918001',50000),'已被退回申请占用');assert.deepEqual(s.get(),before);
});
test('分级权限与过期页面不允许提交',()=>{
  const s=M.createSession('supplier');throws(()=>s.apply(s.get().version,{reason:'越权',lines:normalLines}),'当前角色');
  const m=M.createSession('merchant'),v=m.get().version;apply(m);throws(()=>m.apply(v,{reason:'旧页',lines:normalLines}),'记录已更新');
});

console.log('供应商预付款退回规则验收通过：' + count + '项');
