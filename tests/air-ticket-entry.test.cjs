const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../shared/air-orders-model.js'),T=require('../shared/air-ticket-entry-model.js');
const values={customer:'华远科技有限公司',sale:3600,fare:2400,tax:360,cost:2760,currency:'CNY'};
test('PNR标准文本保留多人、多航段、证件及订座舱位',()=>{
 const s=T.parse(T.sample);assert.equal(s.pnr,'QWERTY');assert.equal(s.people.length,2);assert.equal(s.legs.length,2);assert.equal(s.people[1].name,'李梅');assert.equal(s.people[1].docNo,'DEMOPNR02');assert.equal(s.legs[1].from,'SYX');assert.equal(s.legs[0].time,'08:00');assert.equal(s.legs[0].bookingClass,'Y');assert.deepEqual(s.notes,[]);
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
 const data=M.seed();data.transactions=[{order:'A',row:{ticket:'9991234567801',cost:1000,currency:'CNY'}},{order:'B',row:{ticket:'9991234567802',cost:2000,currency:'CNY'}}];const before=M.copy(data),rows=[{ticket:'999-1234567801',amount:1000},{ticket:'9991234567802',amount:2050},{ticket:'9991234567803',amount:1000}],r=T.compare(data,rows);assert.deepEqual(r.map(x=>x.result),['金额一致','金额差异','待匹配']);assert.deepEqual(r.map(x=>x.delta),[0,50,null]);assert.deepEqual(data,before);assert.ok(!('systemCost' in rows[0]));
});
test('PDF跨币种及缺币种不能用相同数值判一致，也不计算差额',()=>{
 const data={orders:[],transactions:[{order:'A',row:{ticket:'9991234567801',cost:1380,currency:'CNY'}}]},rows=[{ticket:'9991234567801',amount:1380}];
 const before=M.copy(data),usd=T.compare(data,rows,{currency:'USD'})[0];assert.equal(usd.systemCurrency,'CNY');assert.equal(usd.currency,'USD');assert.equal(usd.result,'币种不一致');assert.equal(usd.delta,null);assert.equal(T.statementCounts([usd]).pending,1);assert.deepEqual(data,before);
 assert.equal(T.compare(data,rows,{currency:'CNY'})[0].result,'金额一致');delete data.transactions[0].row.currency;assert.equal(T.compare(data,rows,{currency:'CNY'})[0].result,'币种待核');assert.equal(T.compare(data,rows)[0].delta,null);
});
test('PDF保存值不随来源交易变化；旧核对记录补核币种且不改写存档',()=>{
 const data={orders:[],transactions:[{order:'A',row:{ticket:'9991234567801',cost:1380,currency:'CNY'}}]},meta={currency:'CNY'},rows=[{ticket:'9991234567801',amount:1380}],saved={version:2,meta,rows:T.compare(data,rows,meta)};
 data.transactions[0].row.cost=2000;assert.equal(T.statementRecord(data,saved).rows[0].systemCost,1380);const legacy={meta:{currency:'USD'},rows:[{...rows[0],result:'金额一致',systemCost:1380,delta:0}]},before=M.copy(legacy);assert.equal(T.statementRecord(data,legacy).rows[0].result,'币种不一致');assert.deepEqual(legacy,before);
});
test('重复导入按原订单状态进入编辑或详情，保留原单及金额',()=>{
 const data=M.seed(),source=T.parse(T.sample),first=T.draft(data,source,values,'pnr');for(const state of ['草稿','待确认','待出票','出票中','已出票','已取消']){first.order.state=state;const duplicate=T.draft(data,source,{...values,sale:9999},'image'),entry=T.orderEntry(duplicate.order);assert.equal(duplicate.order.id,first.order.id);assert.equal(duplicate.order.sale,3600);assert.equal(entry.href.startsWith('air-order-edit'),['草稿','待确认'].includes(state));assert.equal(entry.title,state==='草稿'?'已找到原草稿':'已找到原订单');}
});
test('三种默认订座资料均可导出多人多段航司名单',()=>{
 const C=require('../shared/air-close-model.js');for(const kind of ['pnr','image','screen']){const data=M.seed(),r=T.draft(data,T.parse(T.sample),values,kind);assert.deepEqual(r.order.people.flatMap(p=>M.docGaps(p,r.order)),[]);const groups=M.templateGroups(r.order,'中国国际航空','2026.2',C.seed());assert.equal(groups.flatMap(g=>g.rows).length,4);assert.ok(r.order.people.every(p=>p.docNo.startsWith('DEMO')));}
});
