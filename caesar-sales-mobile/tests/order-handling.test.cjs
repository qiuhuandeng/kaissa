const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../src/model.js');
const form={claimIndex:1,amount:20000,payer:'张伟',customerName:'张建国',reference:'RK0926002',proof:'代付凭证.png',relation:'家属代付',date:M.TODAY};
test('退回认款在原申请补充，保留退回依据且不增加实收',()=>{
 const o=M.seed().orders[0],record=o.claims[1];M.submitClaim(o,form);
 assert.equal(o.claims.length,2);assert.equal(o.claims[1],record);assert.equal(record.status,'待复核');assert.equal(o.paid,10000);assert.equal(o.total,48000);
 assert.ok(record.history.some(x=>x.includes('代付关系')));assert.equal(record.date,M.TODAY);
 assert.throws(()=>M.submitClaim(o,form),/不可补充/);assert.equal(o.claims.length,2);
});
test('补充申请可沿用原凭证，缺代付关系仍被拦截且保留原记录',()=>{
 const o=M.seed().orders[0];o.claims[1].proof='原凭证.png';const before=M.clone(o);
 assert.throws(()=>M.submitClaim(o,{...form,proof:'',relation:''}),/代付/);assert.deepEqual(o,before);
 M.submitClaim(o,{...form,proof:''});assert.equal(o.claims[1].proof,'原凭证.png');
});
test('补充认款仍校验其他待复核占用与重复流水',()=>{
 const o=M.seed().orders[0];o.claims.push({amount:30000,status:'待复核',reference:'OTHER'});
 assert.throws(()=>M.submitClaim(o,form),/金额/);
 assert.throws(()=>M.submitClaim(o,{...form,amount:1000,reference:'OTHER'}),/流水/);
 assert.equal(o.claims[1].status,'已退回');assert.equal(o.paid,10000);
});
