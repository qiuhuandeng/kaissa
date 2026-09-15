const test=require('node:test'),assert=require('node:assert/strict');
const m=require('../shared/overview-finance-model.js'),profit=require('../shared/monthly-profit-model.js'),funds=require('../shared/finance-funds-model.js');
test('四摘要无关联明细，损益直接复用月度结果与更正版本',()=>{
 for(const view of Object.keys(m.views))assert.deepEqual(m.query({view}).sections,[]);
 for(const version of ['published','corrected'])assert.equal(m.query({view:'profit',version}).rows[0].operating,profit.query({version,start:'2026-09',end:'2026-09',dataset:'demo',currency:'CNY'}).rows[0].operating);
});
test('资金余额同源，独立截止月不受隐藏会计月影响，缺余额不归零',()=>{
 for(const asOf of ['2026-09-30','2026-10-15']){
 const actual=m.query({view:'funds',asOf}).rows;
 const source=funds.query({dataset:'demo',view:'accounts',start:asOf.slice(0,7)+'-01',end:asOf,currency:'CNY'}).totals;
 assert.deepEqual(actual.map(r=>r.closing),source.map(r=>r.closing));assert.ok(actual.every(r=>!('plannedClosing' in r)));
 }assert.equal(m.query({view:'funds',asOf:'2026-12-31'}).pending,true);
});
test('部门经营任务实绩按指标分开，未批准任务不代入草稿',()=>{
 const orders=m.query({view:'plan'}).rows,returns=m.query({view:'plan',metric:'actual'}).rows;
 assert.equal(orders.reduce((n,r)=>n+r.actual,0),54000);assert.equal(returns.reduce((n,r)=>n+r.actual,0),56000);
 assert.ok(orders.every(r=>r.target===null&&r.completion===null&&r.gap===null));
 assert.equal(m.query({view:'plan',planCompany:'A',level:'group'}).rows[0].actual,35000);
});
test('集团月任务样例有明确期间，不借给部门或回团，不按天摊分',()=>{
 const q={view:'plan',taskVersion:'sample',level:'group'},r=m.query(q).rows[0];
 assert.equal(r.target,70000);assert.equal(r.gap,16000);assert.equal(r.completion,'77.14%');assert.match(r.coverage,/非批准/);
 for(const change of [{level:'salesDepartment'},{metric:'actual'},{planFrom:'2026-05-02'},{planCompany:'A'}])assert.ok(m.query({...q,...change}).rows.every(r=>r.target===null));
});
test('风险数量按单位分开，同公司同批次去重，缺金额不推断已发生损耗',()=>{
 const rows=m.query({view:'resources'}).rows;
 assert.deepEqual(rows.filter(r=>r.risk==='不可退未售').map(r=>[r.unit,r.quantity]),[['舱',4],['座',2],['铺',5]]);
 assert.ok(rows.some(r=>r.risk==='损耗资料缺失'&&r.unit==='铺'));assert.ok(!rows.some(r=>r.risk==='损耗待确认'&&r.unit==='铺'));
 assert.ok(rows.every(r=>r.department===null&&r.deadline===null&&!('amount' in r)));
 const b={batch:'01',company:'A',unit:'座',nonRefundableUnsold:2,returnable:0,pendingLoss:0,allocated:10,quantityStatus:'数量范围齐全'};
 assert.equal(m.risks([b,b,{...b,company:'B'}]).length,2);assert.equal(m.risks([b,b])[0].quantity,2);
 const dates=m.risks([{...b,department:'资源部',deadline:'2026-10-03'},{...b,batch:'02',department:'资源部',deadline:'2026-10-01'}])[0];assert.equal(dates.department,'资源部');assert.equal(dates.deadline,'2026-10-01');
});
test('筛选空结果、非法日期与超资料截止不伪造历史',()=>{
 assert.equal(m.query({view:'resources',company:'不存在'}).rows.length,0);
 assert.equal(m.query({view:'resources',asOf:'2026-09-29'}).pending,true);
 assert.throws(()=>m.query({view:'funds',asOf:'2026-02-30'}),/截止/);
 assert.throws(()=>m.query({view:'profit',version:'bad'}),/版本/);
 assert.throws(()=>m.query({view:'plan',planThrough:'2026-06-01'}),/截止/);
 assert.throws(()=>m.query({view:'plan',planFrom:'2026-05-08'}),/开始日期/);
});
