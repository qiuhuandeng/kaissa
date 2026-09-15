const test=require('node:test'),assert=require('node:assert/strict');
const a=require('../shared/product-contribution-analysis.js'),m=require('../shared/monthly-profit-model.js');
test('产品贡献只保留同范围组成记录，整公司依据不再混入',()=>{
 const r=a.query({company:'A公司（演示）'});assert.deepEqual(r.sections.map(s=>s.key),['contribution']);
 assert.equal(r.rows[0].contribution,4900);assert.equal(r.rows[0].fees,1100);
 assert.equal(r.sections[0].rows.reduce((n,r)=>n+r.contribution,0),4900);
});
test('产品、渠道、客户及核算公司筛选汇总明细一致',()=>{
 for(const q of [{company:'A公司（演示）',channel:'直营'},{company:'B公司（演示）'},{customer:'科技'},{product:'不存在'},{currency:'EUR'}]){
 const r=a.query(q),facts=r.sections[0].rows;
 for(const row of r.rows)for(const k of ['income','cost','gross','fees','contribution'])assert.equal(row[k],m.sum(facts.filter(f=>f.company===row.company&&f.currency===row.currency&&f.product===row.group).map(f=>f[k])));
 }assert.equal(a.query({company:'A公司（演示）',channel:'直营'}).rows[0].contribution,1900);
});
test('四种分析分类同源，不把内部供货加成集团外部业绩',()=>{
 for(const grouping of ['product','destination','type','supply']){const r=a.query({grouping});assert.equal(r.rows.length,2);assert.deepEqual(r.rows.map(r=>r.income),[30000,24000]);assert.equal(r.sections[0].rows.filter(r=>r.external==='内部供货').length,3);}
});
test('缺确认与费用时汇总仍为未知，公共费不强摊产品',()=>{
 const data=m.fixture();data.expenses.find(e=>e.id==='FEE0').approved=false;
 const r=a.query({company:'A公司（演示）'},data);assert.equal(r.rows[0].contribution,null);assert.match(r.notice,/缺逐产品分配/);
 assert.ok(r.sections[0].rows.every(r=>!('sharedExpense' in r)));
});
test('原版本与更正版分别引用来源，不改写原贡献',()=>{
 for(const version of ['published','corrected'])assert.deepEqual(a.query({version}).rows,m.contribution({view:'product',version}).rows);
});
test('错误期间、无效分类与未接来源不产生可用结果',()=>{
 assert.throws(()=>a.query({start:'2026-10',end:'2026-09'}));
 assert.throws(()=>a.query({grouping:'wrong'}),/分类/);
 assert.equal(a.query({dataset:'pending'}).pending,true);assert.deepEqual(a.query({dataset:'pending'}).sections,[]);
});
