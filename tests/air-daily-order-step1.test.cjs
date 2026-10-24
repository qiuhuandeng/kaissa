const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../shared/air-orders-model.js'),F=require('../shared/air-import-flow-model.js'),B=require('../shared/air-business-model.js'),P=require('../shared/air-import-settlement-model.js'),T=require('../shared/air-ticket-entry-model.js');
const row=(v={})=>({sourceRow:2,type:'出票',issuedDate:'2026-10-23',ticket:'9998800000001',original:'',pnr:'ABCD01',airlineNo:'CA-001',name:'刘洋',docNo:'DEMO-DAY-01',docType:'护照',expiry:'2030-11-01',gender:'女',phone:'13800138000',date:'2026-11-05',flight:'CA1333',from:'PEK',to:'SYX',fare:'1200',tax:'180',cost:'1380',sale:'3000',customer:'华远科技有限公司',currency:'CNY',internal:'否',group:'',amountScope:'整票',bookingCode:'K',paymentMethod:'信用卡',issuingAgent:'BSP001',...v});
const existing=()=>{const data=M.seed(),o=data.orders[1],p=o.people[0],l=o.legs[0];return {data,o,r:row({name:p.name,docNo:p.docNo,date:l.date,flight:l.flight,from:l.from,to:l.to,cost:'1580',fare:'1400',sale:'1500',customer:o.customer})};};
const clean=()=>({orders:[],settlements:[],changes:[]});
test('日报客户订单明确合并多人、多票、多PNR；售价只计一次',()=>{
 const data=M.seed(),r=row({salesOrderRef:'WT001'}),b=M.applyImport([r,{...r,sourceRow:3,ticket:'9998800000002',name:'赵明',docNo:'DEMO-DAY-02',pnr:'ABCD02'}],data);
 assert.equal(new Set(b.results.map(x=>x.order)).size,1);assert.ok(b.results.every(x=>x.state==='已应用'));
 const o=data.orders.find(o=>o.id===b.results[0].order);assert.equal(o.people.length,2);assert.equal(o.tickets.length,2);assert.equal(o.sale,3000);assert.equal(o.cost,2760);assert.deepEqual(o.tickets.map(t=>t.pnr),['ABCD01','ABCD02']);assert.equal(o.people[0].gender,'女');assert.equal(o.people[0].phone,'13800138000');assert.equal(o.people[0].expiry,'2030-11-01');
});
test('同客户未明确订单号不擅自合单，显式订单号错误不另建单',()=>{
 const d=M.seed(),r=row(),b=M.applyImport([r,{...r,ticket:'9998800000002',name:'赵明',docNo:'DEMO-DAY-02'}],d);assert.equal(new Set(b.results.map(x=>x.order)).size,2);
 const before=d.orders.length,next=M.applyImport([row({ticket:'9998800000003',orderId:'MISSING'})],d);assert.equal(next.results[0].state,'未应用');assert.equal(d.orders.length,before);
});
test('多人不同航段合单不生成交叉乘坐人段',()=>{
 const d=M.seed(),r=row({salesOrderRef:'WT002'}),b=M.applyImport([r,{...r,ticket:'9998800000002',name:'赵明',docNo:'DEMO-DAY-02',flight:'CA1334',date:'2026-11-10',from:'SYX',to:'PEK'}],d),o=d.orders.find(o=>o.id===b.results[0].order);assert.equal(o.legs.length,2);assert.equal(o.tickets.length,2);assert.ok(o.tickets.every(t=>t.state==='已出票'));assert.equal(o.cost,2760);
});
test('同票往返只计一份整票金额，多张票仍相加',()=>{
 const d=M.seed(),r=row({salesOrderRef:'WT003'}),b=M.applyImport([r,{...r,sourceRow:3,date:'2026-11-10',flight:'CA1334',from:'SYX',to:'PEK'},{...r,sourceRow:4,ticket:'9998800000002',name:'赵明',docNo:'DEMO-DAY-02'}],d),o=d.orders.find(o=>o.id===b.results[0].order);assert.ok(b.results.every(x=>x.state!=='未应用'));assert.equal(o.tickets.length,3);assert.equal(o.cost,2760);assert.equal(M.dailyCosts(d,o).amount,2760);assert.equal(o.sale,3000);
});
test('客户订单整单售价冲突保留失败行，不破坏已导入单',()=>{
 const d=M.seed(),r=row({salesOrderRef:'WT004'}),b=M.applyImport([r,{...r,ticket:'9998800000002',name:'赵明',docNo:'DEMO-DAY-02',sale:'3200'}],d),o=d.orders.find(o=>o.id===b.results[0].order);assert.equal(b.results[1].state,'未应用');assert.equal(o.tickets.length,1);assert.equal(o.cost,1380);assert.equal(o.sale,3000);
});
test('批量回票在先，日报成本在后：不误判为交易更正或重复成本',()=>{
 const {data,o,r}=existing();F.apply([{...r,orderId:o.id}],data,'票号回填');assert.equal(data.transactions[0].mode,'票号回填');const b=M.applyImport([r],data);assert.equal(b.results[0].state,'已应用');assert.equal(o.tickets.length,1);assert.equal(M.dailyCosts(data,o).amount,1580);assert.equal(o.cost,1380);assert.equal(M.applyImport([r],data).results[0].state,'重复跳过');
});
test('即时登记后导入日报保留票号、不覆盖售价与服务费',()=>{
 const {data,o,r}=existing();o.received=1550;M.record(o,[{personId:o.people[0].id,legId:o.legs[0].id,state:'已出票',ticket:r.ticket,pnr:r.pnr,airlineNo:r.airlineNo,bookingCode:'K'}],'superadmin',data.orders);const b=M.applyImport([r],data);assert.equal(b.results[0].state,'已应用');assert.equal(o.sale,1500);assert.equal(o.service,50);assert.equal(o.cost,1380);assert.equal(o.tickets[0].bookingCode,'K');
});
test('日报客户或币种不符、取消订单不接票',()=>{
 for(const change of [{customer:'别的企业'},{currency:'USD'}]){const {data,o,r}=existing(),b=M.applyImport([{...r,...change}],data);assert.equal(b.results[0].state,'未应用');assert.equal(o.tickets[0].ticket,'');}
 const {data,o,r}=existing();o.state='已取消';const b=M.applyImport([{...r,orderId:o.id}],data);assert.equal(b.results[0].state,'未应用');assert.equal(o.tickets[0].ticket,'');
});
test('1380预计与1580日报差异200待核；明确确认后预填1580，原报价保留',()=>{
 const {data,o,r}=existing(),db=clean(),b=M.applyImport([r],data),v=P.review(data,db,b.id).candidates[0];assert.equal(v.state,'成本待核对');assert.equal(v.difference,200);assert.throws(()=>P.prepare(data,db,b.id,[o.id]),/不可核单/);
 const next=P.confirmCost(data,db,b.id,o.id,{cost:1580,basis:'出票日报已核',signature:v.daily.signature}),result=P.prepare(next,db,b.id,[o.id]);assert.equal(next.orders.find(x=>x.id===o.id).cost,1380);assert.equal(result.settlements[0].lines[0].cost,1580);assert.equal(result.settlements[0].lines[0].sale,1550);assert.equal(result.settlements[0].lines[0].confirmed,false);
});
test('日报只覆盖部分票时，不把部分成本当整单成本',()=>{
 const {data,o,r}=existing();o.people.push({...M.person('SECOND','李梅'),docNo:'DEMO-SECOND'});M.syncTickets(o);o.tickets[1].state='已出票';o.tickets[1].ticket='9998800000002';o.state='出票中';const b=M.applyImport([r],data),v=P.review(data,clean(),b.id).candidates[0];assert.equal(v.daily.complete,false);assert.equal(v.daily.missing,1);assert.equal(v.difference,null);assert.equal(v.eligible,false);
});
test('成本核对后日报更正使旧确认失效，旧报价与确认记录仍保留',()=>{
 const {data,o,r}=existing(),db=clean(),b=M.applyImport([r],data),v=P.review(data,db,b.id).candidates[0];const next=P.confirmCost(data,db,b.id,o.id,{cost:1580,basis:'初次核对',signature:v.daily.signature});M.applyImport([{...r,cost:'1680',correct:true,changeReason:'航司补发更正日报'}],next);const changed=P.review(next,db,b.id).candidates[0];assert.equal(changed.reviewed,false);assert.equal(changed.daily.amount,1680);assert.throws(()=>P.confirmCost(next,db,b.id,o.id,{cost:1580,basis:'旧确认',signature:v.daily.signature}),/已变化/);assert.equal(next.orders.find(x=>x.id===o.id).cost,1380);
});
test('直接结算可看到日报差异，未核对不能靠暂估绕过',()=>{
 const {data,o,r}=existing();M.applyImport([r],data);const db=clean();B.ensureOrder(db,M.withDailyCosts(data,o));const s=B.createSettlement(db,[o.id],'superadmin');s.lines[0].confirmed=true;s.policy='estimate';s.note='暂估';assert.ok(B.issues(db,s).some(x=>x.includes('日报成本')));s.lines[0].dailyReviewed=true;s.lines[0].cost=1580;assert.ok(!B.issues(db,s).some(x=>x.includes('日报成本')));
});
test('外部同团也不能合并业务结算，内部同团可以',()=>{
 const db=B.seed();db.settlements=[];const ids=db.orders.slice(0,2).map(o=>o.id);assert.equal(B.createSettlement(db,ids).lines.length,2);db.settlements=[];db.orders[0].customerType=db.orders[1].customerType='企业';assert.throws(()=>B.createSettlement(db,ids),/外部客户/);assert.throws(()=>B.createSettlement(db,ids,'superadmin',false),/外部客户/);
});
test('营业日按出票日期提示跨日及重复批次，不按出发日期判断',()=>{
 const r=row(),meta={dailyDate:r.issuedDate,account:'BSP',currency:'CNY'},data={batches:[{id:'B1',mode:'日报',...meta}]};const v=F.dailyRange(meta,[r,{...r,issuedDate:'2026-10-22'},{...r,issuedDate:''}],data);assert.equal(v.outside,1);assert.equal(v.missing,1);assert.deepEqual(v.prior,['B1']);assert.match(v.text,/00:00/);
});
test('首批日报不把自己算成重复批次，补导保留前批记录',()=>{
 const data=M.seed(),r=row(),meta={dailyDate:r.issuedDate,account:'BSP',currency:'CNY'};const first=F.apply([r],data,'日报',meta);assert.deepEqual(first.dailyRange.prior,[]);const next=F.apply([r],data,'日报',meta);assert.deepEqual(next.dailyRange.prior,[first.id]);assert.equal(next.results[0].state,'重复跳过');
});
test('同一客户订单内同证件不同姓名不能静默归到原乘客',()=>{
 const data=M.seed(),r=row({salesOrderRef:'WT-IDENTITY'}),b=M.applyImport([r,{...r,ticket:'9998800000002',name:'其他姓名'}],data);assert.equal(b.results[1].state,'未应用');const o=data.orders.find(o=>o.id===b.results[0].order);assert.equal(o.people.length,1);assert.equal(o.tickets.length,1);assert.equal(o.cost,1380);
});
test('PNR文本性别和手机可保留，未提供不虚构，订座代码不丢失',()=>{
 const src=T.parse(T.sample+'|13800138001'),d=M.seed(),r=T.draft(d,src,{customer:'客户',sale:3000,fare:2000,tax:400,cost:2400},'pnr');assert.equal(src.people[0].gender,'男');assert.equal(src.people[0].phone,'');assert.equal(src.people[1].phone,'13800138001');assert.equal(r.order.tickets[0].bookingCode,'Y');assert.equal(r.order.people[1].gender,'女');
});
