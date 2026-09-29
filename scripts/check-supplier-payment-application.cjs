const assert = require('node:assert/strict');
const model = require('../shared/supplier-payment-application-model.js');

let count = 0;
function test(name, fn) {
  fn();
  count += 1;
  console.log('PASS ' + name);
}
function data(session, ids, amounts, extra={}) {
  const first=session.get(ids[0]);
  return {company:first.company,supplier:first.supplier,currency:first.currency,account:first.account,kind:'预付款',date:'2026-09-30',basis:'采购协议付款节点已核对',lines:ids.map((id,index)=>({id,amount:amounts[index]})),...extra};
}

test('未结算未对账成本仍有付款资格',()=>{
  const s=model.createSession(),row=s.get('COST-PAY-001');
  assert.equal(row.settlement,'未结算');assert.equal(row.reconciliation,'未对账');assert.equal(row.available,100000);assert.equal(row.state,'可申请');
});
test('未结算未对账可提交30000预付款且形成占用',()=>{
  const s=model.createSession(),request=s.save(data(s,['COST-PAY-001'],[30000]),true);
  assert.equal(request.state,'待财务复核');assert.equal(request.amount,30000);assert.equal(s.get('COST-PAY-001').occupied,30000);assert.equal(s.get('COST-PAY-001').available,70000);
});
test('最终101000扣净已付80000及占用10000后可申请11000',()=>{
  const row=model.createSession().get('COST-PAY-002');assert.equal(row.basis,101000);assert.equal(row.netPaid,80000);assert.equal(row.available,11000);
});
test('最终90000已付120000形成应退30000并禁止付款',()=>{
  const s=model.createSession(),row=s.get('COST-PAY-003');assert.equal(row.refundDue,30000);assert.equal(row.available,0);assert.equal(row.state,'供应商应退');assert.throws(()=>s.group([row.id]),/应退/);
});
test('最终90000已付60000可再付30000',()=>{
  const row=model.createSession().get('COST-PAY-007');assert.equal(row.basis,90000);assert.equal(row.netPaid,60000);assert.equal(row.available,30000);
});
test('申请中和付款中金额占用可付余额',()=>{
  const row=model.createSession().get('COST-PAY-004');assert.equal(row.basis,20000);assert.equal(row.netPaid,5000);assert.equal(row.occupied,7000);assert.equal(row.available,8000);
});
test('缺财务审核账户不能申请',()=>{
  const s=model.createSession();assert.equal(s.get('COST-PAY-005').state,'账户待审核');assert.throws(()=>s.group(['COST-PAY-005']),/账户/);
});
test('同公司供应商币种账户可批量申请',()=>{
  const s=model.createSession(),request=s.save(data(s,['COST-PAY-001','COST-PAY-006'],[30000,6000]),true);assert.equal(request.amount,36000);assert.equal(request.lines.length,2);
});
test('跨公司供应商币种账户禁止批量',()=>{
  const s=model.createSession();assert.throws(()=>s.group(['COST-PAY-001','COST-PAY-004']),/同一采购公司/);
});
test('逐项超额和零金额均禁止',()=>{
  const s=model.createSession();assert.throws(()=>s.save(data(s,['COST-PAY-001'],[100001]),true),/不超过/);assert.throws(()=>s.save(data(s,['COST-PAY-001'],[0]),true),/大于零/);
});
test('提交须有有效日期和付款依据',()=>{
  const s=model.createSession();assert.throws(()=>s.save(data(s,['COST-PAY-001'],[30000],{date:'2026-09-20'}),true),/不得早于/);assert.throws(()=>s.save(data(s,['COST-PAY-001'],[30000],{basis:''}),true),/付款依据/);
});
test('保存草稿不占用成本余额',()=>{
  const s=model.createSession(),request=s.save(data(s,['COST-PAY-001'],[30000],{basis:'',date:''}),false);assert.equal(request.state,'草稿');assert.equal(s.get('COST-PAY-001').occupied,0);assert.equal(s.get('COST-PAY-001').available,100000);
});

console.log('完成 ' + count + ' 组独立付款申请规则检查');
