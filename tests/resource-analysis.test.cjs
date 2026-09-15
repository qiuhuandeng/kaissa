const test=require('node:test'),assert=require('node:assert/strict'),m=require('../shared/resource-analysis-model'),base=require('../shared/resource-cost-report-model');
test('批次主表与组成分配核对，待确认不重复累计',()=>{
 const r=m.query({batch:'CABIN-01'}),b=r.rows[0],d=r.sections[0].rows;
 assert.deepEqual([b.purchase,b.allocated,b.unallocated,b.pendingAllocation],[200000,140000,60000,20000]);
 assert.equal(d.filter(r=>r.confirmed).reduce((n,r)=>n+r.confirmedCost,0),b.allocated);assert.equal(d.length,4);
 assert.equal(m.query({batch:'CABIN-01',tour:'CRUISE-A'}).sections[0].rows.length,4);
});
test('风险不带分配表，数量分单位，占用与期限不猜测',()=>{
 const r=m.query({view:'resources'});assert.equal(r.sections.length,0);assert.deepEqual(r.rows.map(b=>[b.unit,b.unused]),[['舱',8],['座',6],['铺',10]]);
 assert.ok(r.rows.every(b=>b.unusedFunds===null&&b.releaseBy===null));assert.equal(r.rows[2].pendingLoss,null);
});
test('批次、供应商、公司和单位限制汇总与组成的同一范围',()=>{
 for(const q of [{unit:'舱'},{supplier:'航司'},{company:'不存在'},{batch:'AIR-01'}]){
 const r=m.query(q);assert.ok(r.sections[0].rows.every(a=>r.rows.some(b=>b.batch===a.batch)));}assert.equal(m.query({company:'不存在'}).rows.length,0);
});
test('重复、冲突、超额和缺资料不产生假剩余或跨公司归属',()=>{
 let data=base.fixture();data.allocations.push({...data.allocations[0]});assert.equal(m.query({batch:'CABIN-01'},data).rows[0].allocated,140000);
 data.allocations.push({...data.allocations[0],amount:999999});assert.equal(m.query({batch:'CABIN-01'},data).rows[0].allocated,null);
 data=base.fixture();data.batches.push({...data.batches[0],company:'另一公司'});
 const r=m.query({batch:'CABIN-01'},data);assert.ok(r.rows.every(b=>b.allocated===null&&b.pendingAllocation===null));assert.equal(r.sections[0].rows.length,0);
 assert.equal(m.query({batch:'RAIL-01'}).rows[0].unallocated,null);
});
test('有效提供的资金和期限保留，数量异常不计算未使用数量',()=>{
 const data=base.fixture();Object.assign(data.batches[0],{unusedFunds:12000,releaseBy:'2026-10-01',used:99});
 const b=m.query({view:'resources',batch:'CABIN-01'},data).rows[0];assert.equal(b.unused,null);assert.equal(b.unusedFunds,12000);assert.equal(b.releaseBy,'2026-10-01');
});
test('非法日期与未接来源不产生结果',()=>{
 assert.throws(()=>m.query({start:'2026-10-01',end:'2026-09-01'}),/日期/);assert.throws(()=>m.query({view:'bad'}));
 assert.equal(m.query({dataset:'pending'}).pending,true);
});
