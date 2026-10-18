const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../shared/air-orders-model.js'),T=require('../shared/air-ticket-entry-model.js');
const values={customer:'华远科技有限公司',sale:3600,fare:2400,tax:360,cost:2760,currency:'CNY'};
test('PNR标准文本保留多人、多航段、证件及订座舱位',()=>{
 const s=T.parse(T.sample);assert.equal(s.pnr,'QWERTY');assert.equal(s.people.length,2);assert.equal(s.legs.length,2);assert.equal(s.people[1].name,'李梅');assert.equal(s.people[1].docNo,'DEMO-PNR-02');assert.equal(s.legs[1].from,'SYX');assert.equal(s.legs[0].time,'08:00');assert.equal(s.legs[0].bookingClass,'Y');assert.deepEqual(s.notes,[]);
});
test('已有分隔文本仍可解析，异常文本保留待补说明',()=>{
 const s=T.parse('PNR|ABC123\nPAX|张三|ZHANG/SAN|D123\nPAX|李四|LI/SI|D456\nSEG|CA1333|2026-11-05|PEK|SYX\n其他内容');assert.equal(s.people.length,2);assert.equal(s.legs.length,1);assert.equal(s.notes.length,1);assert.equal(T.parse('').notes.length,3);
});
test('录入只建立订单草稿，人段齐全，金额不重复乘人数',()=>{
 const data=M.seed(),before=M.copy(data),s=T.parse(T.sample),r=T.draft(data,s,values,'pnr');assert.equal(data.orders.length,before.orders.length+1);assert.equal(r.order.state,'草稿');assert.equal(r.order.tickets.length,4);assert.ok(r.order.tickets.every(t=>!t.ticket&&t.state==='未出票'));assert.equal(r.order.sale,3600);assert.equal(r.order.cost,2760);assert.deepEqual(data.transactions,before.transactions);assert.deepEqual(s,T.parse(T.sample));
});
test('同一订座从不同入口再次录入不重复建单',()=>{
 const data=M.seed(),a=T.draft(data,T.parse(T.sample),values,'pnr'),n=data.orders.length,b=T.draft(data,T.parse(T.sample),values,'image');assert.equal(b.existing,true);assert.equal(b.order.id,a.order.id);assert.equal(data.orders.length,n);
});
test('PDF账单核对展示一致、差异和待匹配，不修改订单或交易',()=>{
 const data=M.seed();data.transactions=[{order:'A',row:{ticket:'9991234567801',cost:1000}},{order:'B',row:{ticket:'9991234567802',cost:2000}}];const before=M.copy(data),rows=[{ticket:'999-1234567801',amount:1000},{ticket:'9991234567802',amount:2050},{ticket:'9991234567803',amount:1000}],r=T.compare(data,rows);assert.deepEqual(r.map(x=>x.result),['金额一致','金额差异','待匹配']);assert.deepEqual(r.map(x=>x.delta),[0,50,null]);assert.deepEqual(data,before);assert.ok(!('systemCost' in rows[0]));
});
