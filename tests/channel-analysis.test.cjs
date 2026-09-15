const test=require('node:test'),assert=require('node:assert/strict');
const c=require('../shared/channel-reports.js'),a=require('../shared/product-contribution-analysis.js'),m=require('../shared/monthly-profit-model.js');
test('渠道与新增组织层级订单/完成合计守恒，顾问按员工编号区分',()=>{
 for(const basis of ['orders','actual'])for(const level of ['channel','region','company','department','store','person']){
 const r=c.run({...c.defaults,basis,level});assert.equal(r.summaries.reduce((n,r)=>n+r.amount,0),basis==='orders'?54000:56000);
 assert.equal(r.details.reduce((n,r)=>n+r.amount,0),r.total.value);
 }assert.ok(c.groupKeys({...c.defaults,level:'person'}).includes('salesId'));assert.ok(c.groupKeys({...c.defaults,level:'store'}).includes('channel'));
});
test('门店呼叫中心完成资料使用其渠道，结构仅解除主渠道保持其他筛选',()=>{
 for(const view of ['stores','calls']){const r=c.run({...c.defaults,view,basis:'actual'});assert.ok(r.rows.every(row=>row.channel===(view==='stores'?'门店':'呼叫中心')));}
 const r=c.run({...c.defaults,view:'structure',basis:'actual',company:'A',channel:'门店'});
 assert.ok(r.rows.every(r=>r.company==='A'&&r.channel==='门店'));assert.ok(r.allTotal.value>=r.total.value);
});
test('渠道贡献汇总组成与原确认资料一致，不能混产品汇总',()=>{
 const r=a.query({view:'channel',company:'A公司（演示）'});assert.equal(r.title,'渠道贡献汇总');
 assert.deepEqual(r.rows.map(r=>[r.group,r.contribution]),[['直营门店',1900],['加盟门店',1400],['呼叫中心',1600]]);
 assert.deepEqual(r.sections.map(s=>s.key),['contribution']);
 for(const row of r.rows)assert.equal(row.contribution,m.sum(r.sections[0].rows.filter(f=>f.channel===row.group).map(f=>f.contribution)));
});
test('筛当前渠道与付款客户，公共费用不归产品或渠道，缺数不补零',()=>{
 const r=a.query({view:'channel',company:'A公司（演示）',channel:'直营'});assert.equal(r.sections[0].rows.length,1);assert.equal(r.sections[0].rows[0].id,'SA1');
 assert.match(r.notice,/公共费用缺逐渠道分配/);
 assert.equal(a.query({view:'channel',customer:'科技'}).rows[0].contribution,1600);
 const data=m.fixture();data.expenses.find(r=>r.id==='FEE0').approved=false;assert.equal(a.query({view:'channel',company:'A公司（演示）',channel:'直营'},data).rows[0].contribution,null);
});
