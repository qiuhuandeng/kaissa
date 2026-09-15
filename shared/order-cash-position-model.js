(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./finance-balances-model.js'):root.CaesarBalances);if(typeof module==='object'&&module.exports)module.exports=api;else root.CaesarOrderCashPosition=api;})(typeof globalThis==='object'?globalThis:this,function(balances){
  'use strict';
  const {sum,money}=balances;
  const defaults={dataset:'demo',view:'orders',asOf:'2026-09-30',cutoff:'2026-10-31T23:59',company:'',currency:'',order:'',party:'',status:''};
  const labels={order:'订单号',service:'服务/阶段',company:'核算公司',currency:'币种',party:'付款客户',product:'产品名称',departure:'出团/服务日期',returned:'回团/完成日期',receivable:'应收金额',received:'实收分配净额',arOffset:'预款及减免抵收',transfer:'转款转入净额',unreceived:'未收差额',payable:'应付金额',paid:'实付分配净额',apOffset:'预付及减免抵付',unpaid:'未付差额',arBalance:'账面应收余额',apBalance:'账面应付余额',arCash:'收款已核销',apCash:'付款已核销',receiptUnwritten:'收款分配未核销',paymentUnwritten:'付款分配未核销',status:'核对情况',fundsCompanies:'实际收付款公司',salesCompany:'销售公司',productCompany:'产品公司'};
  const columns=['order','service','company','currency','party','departure','returned','receivable','received','unreceived','payable','paid','unpaid','status'];
  const amountKeys=['receivable','received','arOffset','transfer','unreceived','payable','paid','apOffset','unpaid','arBalance','apBalance','arCash','apCash','receiptUnwritten','paymentUnwritten'];
  const orderKey=o=>JSON.stringify([o.company,o.currency,o.order,o.service]);
  function fixture(){
    const data={start:'2026-09-01',end:'2026-10-31',orders:[],documents:[],events:[],allocations:[]};
    function add(order,ar,ap,more={}){
      const o={order,service:'全单服务',company:'北京凯撒旅游',currency:'CNY',party:'华光科技有限公司',product:'欧洲经典游',departure:'2026-09-20',returned:'2026-09-30',createdAt:'2026-09-01',recordedAt:'2026-09-01T10:00:00',salesCompany:'北京凯撒旅游',productCompany:'福建凯撒旅游',arComplete:true,apComplete:true,fundsComplete:true,...more};data.orders.push(o);
      for(const [type,amount] of [['ar',ar],['ap',ap]]){
        const d={id:type.toUpperCase()+'-'+order+'-'+o.service,order,service:o.service,company:o.company,currency:o.currency,ledger:o.company+'业务账',source:'订单收付独立核对资料',type,amount,scope:'外部往来',party:o.party,partyId:'PARTY-'+order,confirmed:true,confirmedAt:o.createdAt,recordedAt:o.recordedAt,due:'2026-10-15',historyComplete:true,proof:'业务确认-'+order,salesCompany:o.salesCompany,productCompany:o.productCompany};data.documents.push(d);
      }return o;
    }
    function doc(o,type){return data.documents.find(d=>d.type===type&&orderKey(d)===orderKey(o));}
    function event(o,type,kind,amount,date='2026-09-15',more={}){const d=doc(o,type),id='HX-'+(data.events.length+1);data.events.push({id,docKey:balances.key(d),source:d.source,currency:o.currency,kind,amount,effectiveAt:date,recordedAt:date+'T12:00:00',confirmed:true,proof:'确认-'+id,reference:'凭据-'+id,actualAt:date,fundsCompany:o.company,...more});}
    function alloc(o,kind,amount,date='2026-09-14',more={}){const id='FP-'+(data.allocations.length+1),r={id,key:orderKey(o),source:'订单收付独立核对资料',kind,amount,actualAt:date,confirmedAt:date,recordedAt:date+'T12:00:00',company:o.company,currency:o.currency,fundsCompany:o.company,verified:true,proof:'资金分配确认-'+id,...more};data.allocations.push(r);return r;}
    let o=add('KS-ORDER-001',100000,70000);alloc(o,'receipt',60000);alloc(o,'payment',30000);event(o,'ar','cash',50000);event(o,'ap','cash',20000);
    o=add('KS-ORDER-002',80000,50000);alloc(o,'receipt',30000);alloc(o,'receipt',50000,'2026-10-05');alloc(o,'payment',10000);event(o,'ar','cash',30000);event(o,'ar','cash',50000,'2026-10-05');event(o,'ap','cash',10000);event(o,'ap','offset',15000);
    o=add('KS-PROJECT-003',30000,18000,{service:'第一阶段',product:'企业年会',departure:'2026-09-10',returned:'2026-09-20'});alloc(o,'receipt',10000);alloc(o,'payment',5000);event(o,'ar','cash',10000);event(o,'ap','cash',5000);
    add('KS-PROJECT-003',70000,40000,{service:'第二阶段',product:'企业年会',createdAt:'2026-10-01',recordedAt:'2026-10-01T10:00:00',departure:'2026-10-10',returned:'2026-10-20'});
    o=add('KS-ORDER-004',20000,null,{apComplete:false});alloc(o,'receipt',5000);event(o,'ar','cash',5000);
    o=add('KS-ORDER-005',10000,6000,{company:'福建凯撒旅游',currency:'USD',salesCompany:'福建凯撒旅游'});alloc(o,'receipt',8000,'2026-09-14',{fundsCompany:'北京凯撒旅游'});event(o,'ar','cash',8000,'2026-09-15',{fundsCompany:'北京凯撒旅游'});
    o=add('KS-ORDER-006',0,0,{product:'已取消酒店预订',returned:'',departure:'2026-09-20'});const original=alloc(o,'receipt',10000);alloc(o,'receipt',-9000,'2026-09-18',{original:original.id});event(o,'ar','cash',1000);
    o=add('KS-ORDER-007',10000,4000,{fundsComplete:false});
    o=add('KS-ORDER-008',10000,5000);alloc(o,'transfer',3000,'2026-09-14',{actualAt:null});event(o,'ar','offset',3000); // Transfer is already represented by this clearing event: avoid subtracting it twice.
    doc(o,'ar').transferInOffset=3000;
    for(let i=9;i<=20;i++){o=add('KS-ORDER-'+String(i).padStart(3,'0'),i*1000,i*600,{party:'渠道客户'+i,product:'国内线路'});alloc(o,'receipt',i*300);event(o,'ar','cash',i*300);}
    return data;
  }
  function query(input,data=fixture()){
    const q={...defaults,...input};
    // Reuse the established historical balance rules instead of reimplementing accounting balances.
    const rq={...balances.defaults(),...q,view:'ar',order:'',party:'',status:''};
    const ar=balances.query(rq,data),ap=balances.query({...rq,view:'ap'},data);
    if(ar.pending||ap.pending)return {rows:[],totals:[],sections:[],pending:true,title:'订单收付',notice:ar.notice};
    const visible=r=>r.recordedAt&&r.recordedAt<=q.cutoff+':59';
    const allocations=data.allocations.filter(visible),groups=new Map(),accepted=[],badKeys=new Set();
    for(const r of allocations){const id=JSON.stringify([r.source,r.company,r.currency,r.id]);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(r);}
    groups.forEach(rs=>{if(new Set(rs.map(r=>JSON.stringify(r))).size>1)rs.forEach(r=>badKeys.add(r.key));else accepted.push(rs[0]);});
    const valid=new Map(),reversed=new Map();
    const identity=(r,id=r.id)=>JSON.stringify([r.source,r.company,r.currency,id]);
    for(const r of accepted.sort((a,b)=>a.confirmedAt.localeCompare(b.confirmedAt))){
      if(r.confirmedAt>q.asOf||r.actualAt>q.asOf)continue;
      if(!r.verified)continue;
      const original=valid.get(identity(r,r.original)),used=reversed.get(identity(r,r.original))||0;
      if(!money(r.amount)||!r.proof||!balances.dateOK(r.confirmedAt)||r.kind!=='transfer'&&(!balances.dateOK(r.actualAt)||r.actualAt>r.confirmedAt)||!r.fundsCompany||!['receipt','payment','transfer'].includes(r.kind)||r.amount<0&&(!original||original.key!==r.key||original.kind!==r.kind||original.original||r.amount*original.amount>=0||Math.abs(r.amount)+used>original.amount)){badKeys.add(r.key);continue;}
      valid.set(identity(r),r);if(r.original)reversed.set(identity(r,r.original),used+Math.abs(r.amount));
    }
    const aggregate=(docs,key)=>docs.length&&docs.every(d=>money(d[key]))?sum(docs.map(d=>d[key])):null;
    let rows=data.orders.filter(o=>visible(o)&&o.createdAt<=q.asOf&&(!q.company||o.company===q.company)&&(!q.currency||o.currency===q.currency)&&(!q.order||o.order.includes(q.order))&&(!q.party||o.party.includes(q.party))).map(o=>{
      const k=orderKey(o),ars=ar.details.filter(d=>orderKey(d)===k),aps=ap.details.filter(d=>orderKey(d)===k),funds=[...valid.values()].filter(r=>r.key===k);
      const r={...o,receivable:o.arComplete?aggregate(ars,'net'):null,payable:o.apComplete?aggregate(aps,'net'):null,arBalance:aggregate(ars,'balance'),apBalance:aggregate(aps,'balance'),arCash:aggregate(ars,'cash'),apCash:aggregate(aps,'cash')};
      for(const [kind,f] of [['receipt','received'],['payment','paid'],['transfer','transfer']])r[f]=o.fundsComplete&&!badKeys.has(k)?sum(funds.filter(x=>x.kind===kind).map(x=>x.amount)):null;
      // A transfer clearing entry is part of offset; show it separately, not as another reduction.
      r.arOffset=ars.length&&ars.every(d=>money(d.offset)&&money(d.relief))?sum(ars.flatMap(d=>[d.offset,d.relief,-(d.transferInOffset||0)])):null;
      r.apOffset=aps.length&&aps.every(d=>money(d.offset)&&money(d.relief))?sum(aps.flatMap(d=>[d.offset,d.relief])):null;
      r.unreceived=[r.receivable,r.received,r.arOffset,r.transfer].every(money)?sum([r.receivable,-r.received,-r.arOffset,-r.transfer]):null;
      r.unpaid=[r.payable,r.paid,r.apOffset].every(money)?sum([r.payable,-r.paid,-r.apOffset]):null;
      r.receiptUnwritten=[r.received,r.arCash].every(money)?sum([r.received,-r.arCash]):null;r.paymentUnwritten=[r.paid,r.apCash].every(money)?sum([r.paid,-r.apCash]):null;
      r.fundsCompanies=[...new Set(funds.filter(x=>x.kind!=='transfer').map(x=>x.fundsCompany))].join('、')||'未发生';
      r.status=!money(r.unreceived)||!money(r.unpaid)?'资料不全，差额待核对':r.unreceived<0||r.unpaid<0?'超收/超付待核对':r.receiptUnwritten||r.paymentUnwritten?'分配与核销待核对':r.unreceived||r.unpaid?'尚有未收未付':'已收付结清';return r;
    });
    if(q.status==='issues')rows=rows.filter(r=>r.status.includes('核对'));
    if(q.status==='open')rows=rows.filter(r=>r.unreceived>0||r.unpaid>0);
    const totals=new Map();rows.forEach(r=>{const k=JSON.stringify([r.company,r.currency]);if(!totals.has(k))totals.set(k,{order:'合计',company:r.company,currency:r.currency,items:[]});totals.get(k).items.push(r);});
    return {rows,sections:[],totals:[...totals.values()].map(g=>Object.fromEntries([...Object.entries(g).filter(([k])=>k!=='items'),...amountKeys.map(k=>[k,g.items.every(r=>money(r[k]))?sum(g.items.map(r=>r[k])):null])])),pending:false,title:'订单收付',notice:'独立核对算例；截至 '+q.asOf+'；实收实付采用已确认逐单分配净额，核销另列，非利润。'};
  }
  return {defaults,labels,columns,amountKeys,fixture,query,orderKey};
});
