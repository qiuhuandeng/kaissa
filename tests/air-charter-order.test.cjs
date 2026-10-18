const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../shared/air-charter-order-model.js'),A=require('../shared/air-charter-model.js'),M=require('../shared/air-orders-model.js');
test('三类供票共用项目但额度分别限定，引用不改变原项目',()=>{
 const db=A.seed().projects,before=JSON.stringify(db);
 const external=C.demo();assert.equal(external.bookedSeats,20);assert.equal(external.people.length,12);assert.equal(external.charterSupply.available,20);
 const internal=C.demo('内部团队供票');assert.equal(internal.charterSupply.available,40);assert.equal(internal.people.length,4);assert.equal(M.hasSource(internal),true);
 const retail=C.demo('余位散卖');assert.equal(retail.charterSupply.available,30);assert.deepEqual(C.quotaOptions(retail).map(q=>q.key),['public']);
 assert.equal(JSON.stringify(db),before);for(const o of [external,internal,retail])assert.deepEqual(M.validate(o),[]);
});
test('冬季项目15公共席与客户10份额席分开，内部满额不可引用',()=>{
 const o=C.demo();C.selectProject(o,'CH20261212001');C.selectFlight(o,'CH1212');
 assert.deepEqual(C.quotaOptions(o).map(q=>q.available),[10,15]);
 C.init(o,'内部团队供票');C.selectGroup(o,'MD20261212001');assert.equal(o.people.length,1);assert.equal(o.charterSupply,null);
 assert.throws(()=>C.selectQuota(o,'allocation:0'),/暂无可用/);
});
test('按团队选择名单与销售订单一致，不允许引用其他客户团队',()=>{
 const o=C.demo('内部团队供票');C.selectOrders(o,['KS20261219002']);assert.equal(o.people.length,2);assert.equal(o.bookedSeats,2);assert.equal(o.sale,'');assert.ok(o.people.every(p=>p.sourceOrder==='KS20261219002'));
 C.init(o);o.customer='远行同业旅行社';o.charterRosterSource='已有团队名单';assert.throws(()=>C.selectGroup(o,'HY20261219001'),/本客户/);
});
test('分批名单只追加人员，不改订购数量、供票价、项目份额',()=>{
 const o=C.demo(),supply=JSON.stringify(o.charterSupply),sale=o.sale;
 const rows=C.preview(o,C.sampleRows(8,12));assert.ok(rows.every(r=>r.status==='新增'));assert.equal(C.applyImport(o,rows,'补充名单.csv'),8);
 assert.equal(o.bookedSeats,20);assert.equal(o.sale,sale);assert.equal(JSON.stringify(o.charterSupply),supply);assert.equal(C.rosterStats(o).pending,0);
});
test('同名不同证件可以加入；同证件重复与资料冲突均不覆盖',()=>{
 const o=C.demo(),p=C.sampleRows(1)[0],other={...p,docNo:'E99881234'};
 const rows=C.preview(o,[p,{...p,name:'冲突姓名'},other]);assert.deepEqual(rows.map(r=>r.status),['重复','资料冲突','新增']);C.applyImport(o,rows,'混合名单.csv');assert.equal(o.people.length,13);assert.equal(o.people[0].name,p.name);
});
test('主航段不可改写；额外联运按名单勾选，不套用主要订座',()=>{
 const o=C.demo();o.bookingPnr='HU1219';const l=M.additionalLeg('LX');Object.assign(l,{flight:'CA1511',from:'SHA',to:'PEK',date:'2026-12-18',supplier:'中国国际航空',carrier:'中国国际航空',people:[o.people[0].id]});o.legs.push(l);M.syncTickets(o);assert.equal(o.tickets.filter(t=>t.legId==='LX').length,1);assert.equal(o.tickets.find(t=>t.legId==='LX').pnr,'');assert.deepEqual(M.validate(o),[]);o.legs[0].date='2026-12-20';assert.match(M.validate(o).join(),/主航段/);
});
test('名单未齐按演示约定可确认供票，不能提前变为整单已出票',()=>{
 const o=C.demo();M.submit(o,'superadmin');M.confirmOrder(o,'superadmin');assert.equal(o.state,'待出票');o.received=M.totals(o).sale;M.claim(o,'superadmin');M.accept(o,'superadmin');M.record(o,o.tickets.map((t,i)=>({...t,state:'已出票',ticket:String(8800000000000+i),pnr:'HU1219',airlineNo:'HU-1219'})),'superadmin');assert.equal(o.state,'出票中');
 const unknown=C.demo();delete unknown.charterSupply.terms.partialRoster;M.submit(unknown,'superadmin');assert.throws(()=>M.confirmOrder(unknown,'superadmin'),/分批交名单/);
});
