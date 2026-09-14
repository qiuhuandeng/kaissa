const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../shared/fund-account-model.js');
const G = require('../shared/store-governance-model.js');
const create = () => M.create('2026-09-14');
test('门店只选本公司、本店、核准用途和有效资料', () => {
 const s = create();
 assert.deepEqual(M.eligible(s,'companyReceive','福建凯撒','软件园门店').map(x=>x.id),['bank-fj-1','bank-fj-2']);
 assert.deepEqual(M.eligible(s,'payer','福建凯撒','软件园门店').map(x=>x.id),['store-bank-1']);
 assert.equal(M.eligible(s,'merchant','上海凯撒','软件园门店').length,0);
 const bank=s.rows[0]; bank.effectiveAt='2026-10-01'; assert.equal(M.eligible(s,'companyReceive','福建凯撒','软件园门店').length,1);
});
test('已停用或跨门店资料不能混入选用申请',()=>{
 const s=create(), store=G.create('2026-09-14').stores[0];
 M.validateSelection(s,store.finance,store.profile.company,store.profile.name);
 for(const patch of [{merchant:'pay-fj-old'},{payer:'store-bank-2'},{companyReceive:'bank-sh-1'},{beneficiary:''}]) assert.throws(()=>M.validateSelection(s,{...store.finance,...patch},store.profile.company,store.profile.name));
});
test('商户结算账户必须满足公司、用途、状态和门店范围',()=>{
 const s=create(), m=s.rows.find(x=>x.id==='pay-fj-1');
 M.validate(s,m);
 for(const settlement of ['store-bank-1','bank-sh-1','bank-fj-old','']) assert.throws(()=>M.validate(s,{...m,settlement}));
 s.rows[0].scope=['软件园门店']; assert.throws(()=>M.validate(s,m));
});
test('提交、撤回、重提均不改变有效商户或历史资料',()=>{
 const s=create(), row=s.rows.find(x=>x.id==='pay-fj-1'), old=M.copy(row);
 const r=M.submit(s,row.id,{...row,status:'停用'},'更换收款商户','2026-09-20','停用');
 assert.deepEqual(row,old); assert.equal(r.status,'审批中');
 assert.throws(()=>M.submit(s,row.id,row,'重复','2026-09-20','变更'));
 M.withdraw(s,r.id); assert.deepEqual(row,old);
 M.submit(s,row.id,{...row,status:'停用'},'重新核对','2026-09-21','停用',false,r.id); assert.equal(s.requests.filter(x=>x.id===r.id).length,1); assert.deepEqual(row,old);
});
test('指定日期与延迟批准均不提前启用或改写变更前记录',()=>{
 const s=create(), r=s.requests.find(x=>x.id==='SP-ZJ-003'), before=M.copy(r.before);
 assert.equal(s.rows[1].name,before.name); M.refresh(s,'2026-09-30'); assert.equal(r.status,'待生效');
 r.approvedAt='2026-10-03';M.refresh(s,'2026-10-02');assert.equal(r.status,'待生效');
 M.refresh(s,'2026-10-03');assert.equal(r.status,'已生效');assert.equal(r.effectiveAt,'2026-10-03');assert.deepEqual(r.before,before);assert.equal(s.rows[1].name,r.after.name);
});
test('账号归属变更及重复主资料不能覆盖历史记录',()=>{
 const s=create(), row=s.rows.find(x=>x.id==='pay-fj-1');
 assert.throws(()=>M.submit(s,row.id,{...row,number:'different'},'改号','2026-09-20','变更'));
 assert.throws(()=>M.validate(s,{...row,id:'new-copy'}));
});
test('新资料草稿和审批中均不进入门店选用清单',()=>{
 const s=create(), row={...M.copy(s.rows[1]),id:'new-bank',number:'123456789',name:'待审核银行账户'};
 const r=M.submit(s,row.id,row,'补账户','2026-09-20','新增',true);assert.equal(r.status,'草稿');
 M.submit(s,row.id,row,'补账户','2026-09-20','新增',false,r.id);assert.equal(r.status,'审批中'); assert.equal(M.eligible(s,'companyReceive','福建凯撒','软件园门店').some(x=>x.id===row.id),false);
});
test('公司账户不能删去仍被商户占用的用途或门店范围',()=>{
 const s=create(), bank=s.rows[0];
 assert.throws(()=>M.validate(s,{...bank,scope:['软件园门店']}),/关联商户/);
 assert.throws(()=>M.validate(s,{...bank,uses:['门店缴款至公司']}),/关联商户/);
 s.rows.find(x=>x.id==='pay-fj-1').scope=['软件园门店'];M.validate(s,{...bank,scope:['软件园门店']});
});
test('门店资料不允许跨店共用，商户结算账户停用后不能新选用',()=>{
 const s=create(), r=s.rows.find(x=>x.id==='store-bank-1');
 assert.throws(()=>M.validate(s,{...r,scope:['软件园门店','文灶门店']}),/一个门店/);
 assert.throws(()=>M.validate(s,{...r,scope:['上海营业部']}),/当前公司/);
 s.rows[0].status='停用';assert.equal(M.eligible(s,'merchant','福建凯撒','软件园门店').length,0);
 assert.match(M.label(s,'pay-fj-old'),/YB-FJ-2025018/);
});
