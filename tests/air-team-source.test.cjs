const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../shared/air-orders-model.js');
const fresh=mode=>{const o=M.blank();o.type='团队票';M.teamSource.mode(o,mode||'按团期');return o;};
test('整团汇总多笔订单，名单保留各自销售来源',()=>{
  const o=fresh();M.teamSource.selectGroup(o,'EU20261120001');
  assert.equal(o.sourceOrder,'');assert.deepEqual(o.sourceOrders,['KS20261102001','KS20261102002']);assert.equal(o.people.length,4);
  assert.deepEqual(new Set(o.people.map(p=>p.sourceOrder)),new Set(o.sourceOrders));assert.equal(M.hasSource(o),true);
  assert.deepEqual(M.teamSource.errors(o),[]);
  M.teamSource.selectOrders(o,['KS20261102002']);assert.deepEqual(o.people.map(p=>p.name),['王强','赵敏']);assert.equal(o.sourceOrder,'KS20261102002');
});
test('按销售订单自动确定团期、客户、部门、名单和航期',()=>{
  const o=fresh('按销售订单');M.teamSource.selectOrder(o,'KS20261102001');
  assert.equal(o.group,'EU20261120001');assert.equal(o.customer,'北京凯撒国际旅行社');assert.equal(o.department,'欧洲部');assert.equal(o.people.length,2);assert.equal(o.legs[0].date,'2026-11-20');
  assert.throws(()=>M.teamSource.selectOrders(o,['KS20261101001']),/本团/);
  assert.throws(()=>M.teamSource.selectOrders(o,['KS20261102001','KS20261102002']),/本团/);
});
test('机位按本团分配范围显示，不将部门余位或历史航期作为候选',()=>{
  const o=fresh();M.teamSource.selectGroup(o,'EU20261120001');
  assert.deepEqual(M.teamSource.seatOptions(o,'2026-10-18').map(s=>s.id),['AIR-EU-20261120']);
  M.teamSource.selectGroup(o,'JP-20261120-001');assert.equal(M.teamSource.seatOptions(o,'2026-10-18').length,0);assert.match(o.seatRequest,/2026-11-20.*1人/);
  assert.equal(M.teamSource.seatOptions({...o,group:'EU20261120001'},'2026-12-20').length,0);
});
test('切换来源清除旧名单、机位、订座、报价，外部委托不强制内部来源',()=>{
  const o=fresh();M.teamSource.selectGroup(o,'EU20261120001');Object.assign(o,{seat:'AIR-EU-20261120',bookingPnr:'OLD123',sale:32800,installments:[{date:'2026-11-01',amount:32800}]});
  M.teamSource.mode(o,'外部委托');assert.equal(o.customerType,'同行');assert.equal(o.group,'');assert.equal(o.sourceOrder,'');assert.equal(o.sourceOrders.length,0);assert.equal(o.people.length,0);assert.equal(o.seat,'');assert.equal(o.bookingPnr,'');assert.equal(o.sale,'');assert.equal(o.installments.length,0);assert.deepEqual(M.teamSource.errors(o),[]);
});
test('整团多来源可提交，仍需确认和接收名单，不能被当成手工名单自动确认',()=>{
  const o=fresh();M.teamSource.selectGroup(o,'EU20261120001');
  Object.assign(o,{supplier:'中国国际航空',carrier:'中国国际航空',account:'国航平台 P01',fare:28000,tax:4000,cost:32000,sale:32800,priceBasis:'演示团队报价'});
  assert.deepEqual(M.validate(o),[]);M.submit(o,'superadmin');assert.equal(o.state,'待确认');assert.equal(o.roster.claimed,0);assert.equal(o.roster.accepted,0);
  M.claim(o,'superadmin');M.accept(o,'superadmin');assert.equal(o.roster.accepted,1);
});
