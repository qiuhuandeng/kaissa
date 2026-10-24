/* 原退改单直接承接资金办理；原款、分次回执与非现金冲减分别保存。 */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./air-funds-model.js'),require('./air-business-model.js'));else root.AirChangeFunds=factory(root.AirFunds,root.AirBusiness);})(typeof window==='object'?window:globalThis,function(F,B){
'use strict';
const copy=F.copy,sum=F.sum,round=F.round;
function change(b,id){const c=b.changes.find(c=>c.id===id);if(!c)throw Error('未找到原退改单');return c;}
function ready(c){if(!c.approved||!c.effective)throw Error('退改业务结果生效后办理款项');}
function originalReceipts(f,c){return f.receipts.filter(r=>r.company===c.company&&r.currency===c.currency&&f.claims.some(x=>x.receipt===r.id&&x.state==='已确认'&&x.lines.some(l=>l.orderId===c.orderId))).map(r=>({...r,available:F.refundAvailable(f,r,c.orderId)}));}
function originalPayments(f,c){return f.requests.filter(r=>r.company===c.company&&r.currency===c.currency&&F.executed(r)>0&&f.sources.some(s=>s.id===r.source&&s.orderId===c.orderId&&!s.platform)).map(r=>({...r,available:Math.max(0,round(F.executed(r)-sum((r.returns||[]).map(x=>x.amount))-F.changePending(f,'银行退回',r.id)))}));}
function entries(f,c,side){
 const out=(f.changeActions||[]).filter(x=>x.changeId===c.id&&x.side===side).map(copy);
 if(side==='customer'){
  for(const r of f.refunds.filter(r=>r.changeId===c.id))out.push({id:r.id,kind:'原款退款',original:r.receipt,amount:r.amount,done:F.executed(r),state:r.state,ref:r.ref||'',cash:-F.executed(r),held:!['退回补充','已撤回'].includes(r.state)?r.amount:0});
  for(const p of f.links.filter(p=>p.changeId===c.id)){const done=F.collectionReceived(f,p);out.push({id:p.id,kind:'客户补收',original:p.id,amount:sum(p.lines.map(l=>l.amount)),done,state:p.state,ref:p.id,cash:done,held:['已关闭','已失效','已过期'].includes(p.state)?done:sum(p.lines.map(l=>l.amount))});}
 }else for(const r of f.requests.filter(r=>r.changeId===c.id))out.push({id:r.id,kind:'供应商补付',original:r.source,amount:r.amount,done:F.executed(r),state:r.state,ref:r.ref||'',cash:F.executed(r),held:!['退回补充','已撤回'].includes(r.state)?r.amount:F.executed(r)});
 return out.map(x=>({...x,done:x.done??(x.state==='成功'?x.amount:0),held:x.held??(['成功','结果待查'].includes(x.state)?x.amount:0),cash:x.cash??(x.state==='成功'&&['银行退回','平台退回余额'].includes(x.kind)?-x.amount:0)}));
}
function view(f,b,id){
 const c=change(b,id),o=b.orders.find(o=>o.id===c.orderId)||f.orders.find(o=>o.id===c.orderId);if(!o)throw Error('原订单不存在');
 const receipts=originalReceipts(f,c),payments=originalPayments(f,c),debits=f.movements.filter(m=>m.kind==='扣款'&&m.orderId===o.id&&m.company===c.company&&m.currency===c.currency).map(m=>({...m,available:Math.max(0,round(m.amount-sum(f.movements.filter(x=>x.original===m.id).map(x=>x.amount))-F.changePending(f,'平台退回余额',m.id)))}));
 const sides={};for(const side of ['customer','supplier']){const delta=Number(c[side==='customer'?'saleDelta':'costDelta']),rows=entries(f,c,side),legacy=c[side].ledgerManaged?Math.abs(c[side].legacySettled||0):c[side].state==='成功'?Math.abs(c[side].amount??delta):0,done=sum(rows.map(x=>x.done)),held=sum(rows.map(x=>x.held));sides[side]={delta,rows,done:round(done+legacy),held:round(held+legacy),remaining:Math.max(0,round(Math.abs(delta)-held-legacy)),legacy};}
 return {change:c,order:o,receipts,payments,debits,...sides};
}
function checkAmount(f,b,id,side,value){const v=view(f,b,id),n=F.amount(value);ready(v.change);if(!v.change[side].ledgerManaged&&v.change[side].state==='结果待查')throw Error('历史结果待查，请先查询原请求');if(n>v[side].remaining)throw Error('本次金额超过退改剩余或已有在途占用');return {v,n};}
function refresh(f,b){
 for(const c of b.changes){if(!c.effective)continue;for(const side of ['customer','supplier']){const rows=entries(f,c,side);if(!rows.length)continue;const v=c[side];if(!v.ledgerManaged)v.legacySettled=v.state==='成功'?Number(v.amount??c[side==='customer'?'saleDelta':'costDelta']):0;const done=sum(rows.map(x=>x.done))+Math.abs(v.legacySettled||0),goal=Math.abs(Number(c[side==='customer'?'saleDelta':'costDelta']));v.ledgerManaged=true;v.settled=round(sum(rows.map(x=>x.cash))+Number(v.legacySettled||0));v.resolved=done;v.ref=rows.filter(x=>x.done>0).map(x=>x.ref||x.id).join('、');v.state=done>=goal?'成功':rows.some(x=>x.state==='结果待查')?'结果待查':done>0?'部分完成':rows.some(x=>['审批中','待执行','待支付','部分到账'].includes(x.state))?'办理中':rows.some(x=>['失败','执行失败','支付失败'].includes(x.state))?'失败':'未登记';}
  c.state=[c.customer,c.supplier].every(x=>['成功','不涉及'].includes(x.state))?'已完成':'处理中';
 }
 F.syncAdjustments(f,b);return b;
}
function queryLegacy(f,b,id,side,d){const c=change(b,id);ready(c);const x=c[side];if(x.ledgerManaged||x.state!=='结果待查')throw Error('仅查询历史待查记录');if(!['成功','失败','结果待查'].includes(d.state)||!d.ref?.trim())throw Error('请核对原请求结果');Object.assign(x,{state:d.state,ref:d.ref});refresh(f,b);return x;}
function refund(f,b,id,d,role='superadmin'){
 const {v,n}=checkAmount(f,b,id,'customer',d.amount);if(v.customer.delta>=0)throw Error('本退改不涉及客户退款');
 if(!v.receipts.some(r=>r.id===d.receipt))throw Error('原款没有分配至本订单');
 const r=F.refund(f,{...d,amount:n,changeId:id,orderId:v.order.id},role);refresh(f,b);return r;
}
function collect(f,b,id,request,role='superadmin'){
 const {v,n}=checkAmount(f,b,id,'customer',request.amount);if(v.customer.delta<=0)throw Error('本退改不涉及客户补收');
 const p=F.createLink(f,[v.order.id],new Date(Date.now()+86400000).toISOString(),role,{method:'公账转账',accountId:request.accountId,node:'退改补收',lines:[{orderId:v.order.id,amount:n}]});p.changeId=id;refresh(f,b);return p;
}
function supplement(f,b,id,role='superadmin'){
 const v=view(f,b,id);ready(v.change);if(v.supplier.delta<=0)throw Error('本退改不涉及供应商补付');
 let s=f.sources.find(s=>s.changeId===id);if(!s){s={id:'CHANGE-'+id,changeId:id,company:v.order.company,currency:v.order.currency,supplier:v.order.supplier,type:v.order.source||'第三方票代',terms:'随结',agreement:id,node:'退改补付',total:v.supplier.delta,paid:0,account:'待核收款账户',approved:false,checked:true,invoice:'成本凭证待补',invoiceRequired:false,date:F.today(),orderId:v.order.id,group:v.order.group||'',history:[]};f.sources.push(s);const a=F.accountCandidates(f,s.id,role).find(a=>a.state==='财务已审核');if(a)F.selectAccount(f,s.id,a.id,'退改补付核对原供应商账户（演示）',role);}
 return s;
}
function action(f,b,id,side,d,role='superadmin'){
 const draft=copy(f),next=copy(b),c=change(next,id);ready(c);F.access(c,role,['finance','cashier']);
 const old=d.id&&(draft.changeActions||[]).find(x=>x.id===d.id);let x;
 if(old){if(old.changeId!==id||old.side!==side||old.state==='成功')throw Error('原款项记录不能重复办理');if(old.state==='结果待查'&&!d.query)throw Error('结果未知须先查询原请求');if(old.amount>view(draft,next,id)[side].remaining+(old.state==='结果待查'?old.amount:0))throw Error('退改剩余已变化，请核对已有处理');x=old;}
 else{const {v,n}=checkAmount(draft,next,id,side,d.amount);if(v[side].delta>=0)throw Error('补收补付请从原收付款申请办理');x={id:F.id('HFTGJ'),changeId:id,orderId:c.orderId,group:v.order.group||'',company:c.company,currency:c.currency,side,kind:d.kind,original:d.original||'',amount:n,state:'未办理'};(draft.changeActions||=[]).push(x);}
 if(!['成功','失败','结果待查'].includes(d.state)||!d.ref?.trim())throw Error('请填写结果与回执依据');
 const v=view(draft,next,id),n=x.amount;
 if(side==='customer'&&x.kind!=='冲减未收')throw Error('客户退款须走原款退款申请');
 if(side==='supplier'&&!['冲减未付','银行退回','平台退回余额','BSP账期抵扣'].includes(x.kind))throw Error('请选择供应商处理方式');
 if(['冲减未收','冲减未付','BSP账期抵扣'].includes(x.kind)&&d.state!=='成功')throw Error('非现金处理请确认冲减依据');
 if(['冲减未收','冲减未付'].includes(x.kind)){
  const base=side==='customer'?Number(v.order.sale||0)+Number(v.order.service||0):Number(v.order.cost||0),paid=side==='customer'?Math.max(Number(v.order.received||0),sum(draft.claims.filter(c=>c.state==='已确认').flatMap(c=>c.lines.filter(l=>l.orderId===v.order.id).map(l=>l.amount)))):Math.max(Number(v.order.paid||0),sum(v.payments.map(F.executed))+sum(v.debits.map(m=>m.amount)));
  const previous=sum((draft.changeActions||[]).filter(a=>a.id!==x.id&&a.orderId===c.orderId&&a.kind===x.kind&&a.state==='成功').map(a=>a.amount));if(n>Math.max(0,round(base-paid-previous)))throw Error('冲减超过原订单尚未收付的金额');
 }
 if(x.kind==='BSP账期抵扣'){if(v.order.source!=='BSP'||!/^\d{4}-\d{2}/.test(d.period||old?.period||''))throw Error('BSP抵扣须核对原渠道及账期');x.period=d.period||old.period;}
 if(x.kind==='银行退回'){
  const p=v.payments.find(r=>r.id===x.original);if(!p)throw Error('原付款不属于本订单');if(n>round(p.available+(old?.state==='结果待查'?n:0)))throw Error('超过原付款未退余额');
  if(d.state==='成功')F.paymentReturn(draft,p.id,{amount:n,ref:d.ref,basis:d.basis||d.ref,date:d.date||F.today(),changeId:id,actionId:x.id},role);
 }
 if(x.kind==='平台退回余额'){
  const p=v.debits.find(m=>m.id===x.original);if(!p)throw Error('原扣款不属于本订单');if(n>round(p.available+(old?.state==='结果待查'?n:0)))throw Error('超过原扣款未退余额');
  if(d.state==='成功')F.movement(draft,p.account,{kind:'退款回余额',original:p.id,amount:n,ref:d.ref,basis:d.basis||d.ref,changeId:id,actionId:x.id},role);
 }
 Object.assign(x,{state:d.state,ref:d.ref,basis:d.basis||d.ref,date:d.date||F.today()});refresh(draft,next);Object.assign(f,draft);Object.assign(b,next);return x;
}
function topup(f,platformId,d,role='superadmin'){
 const a=F.get(f,'platforms',platformId);F.access(a,role,['ticket','finance']);if(!a.approved||a.state!=='正常')throw Error('平台账户尚未核准或已停用');
 if(f.requests.some(r=>['审批中','待执行','执行失败','结果待查'].includes(r.state)&&f.sources.some(s=>s.id===r.source&&s.platform===a.id)))throw Error('平台已有在途充值，请先核对原申请');
 const draft=copy(f),n=F.amount(d.amount),s={id:F.id('TOPUP'),company:a.company,currency:a.currency,type:'航司平台',supplier:a.supplier,terms:'预充值',agreement:a.name,node:'本次充值',total:n,paid:0,account:a.name,approved:true,checked:true,platform:a.id,invoice:'充值资金凭据',invoiceRequired:false,date:d.date||F.today(),history:[]};draft.sources.push(s);const r=F.request(draft,{source:s.id,amount:n,date:s.date,basis:d.basis||'平台本次充值（演示）'},role);Object.assign(f,draft);return r;
}
function examples(f,b){
 if(b.cancelFundsDemoVersion)return;b.cancelFundsDemoVersion=1;
 const oid='HFSTEP2-RETURN',cid='HFTGSTEP2-RETURN';if(b.orders.some(o=>o.id===oid)||f.orders.some(o=>o.id===oid))return;
 const o=copy(b.orders.find(o=>o.people?.length&&o.tickets?.length));if(!o)return;
 Object.assign(o,{id:oid,group:'DEMO-CANCEL-2026',customerType:'企业',customer:'启航企业客户（演示）',source:'航司平台',supplier:'中国国际航空',carrier:'中国国际航空',sale:6000,service:0,cost:5000,received:6000,paid:5000,state:'已出票'});
 o.people=[{id:'STEP2-P',name:'演示旅客',docNo:'DEMO-STEP2',docType:'其他证件'}];o.legs=o.legs.slice(0,1);o.tickets=[{personId:'STEP2-P',legId:o.legs[0].id,ticket:'9998800020001',pnr:'STEP02',airlineNo:'CA-DEMO-STEP2',state:'已出票'}];b.orders.push(o);f.orders.push({...copy(o),received:0,paid:0});
 for(let i=1;i<=2;i++){const r={id:'HFSKSTEP2-'+i,company:o.company,currency:o.currency,customer:o.customer,payer:o.customer,amount:3000,ref:'DEMO-STEP2-BANK-'+i,date:F.today(),proof:'演示原款回单',state:'已到账',history:[]};f.receipts.push(r);f.claims.push({id:'HFRKSTEP2-'+i,company:o.company,currency:o.currency,customer:o.customer,receipt:r.id,lines:[{orderId:oid,amount:3000}],state:'已确认',history:[]});}
 f.sources.push({id:'SFSTEP2',company:o.company,currency:o.currency,supplier:o.supplier,type:'第三方票代',terms:'随结',agreement:'DEMO-STEP2',node:'原出票款',total:4000,paid:0,account:'国航收款账户（演示）',approved:true,checked:true,invoiceRequired:false,invoice:'演示成本凭据',orderId:oid,history:[]});
 f.requests.push({id:'HFFKSTEP2',company:o.company,currency:o.currency,source:'SFSTEP2',amount:4000,executedAmount:4000,state:'已完成',account:'国航收款账户（演示）',agreement:'DEMO-STEP2',ref:'DEMO-STEP2-PAY',date:F.today(),executions:[{date:F.today(),amount:4000,ref:'DEMO-STEP2-PAY',account:'航服付款户（演示）'}],history:[]});
 const platform=f.platforms.find(a=>a.supplier===o.supplier&&a.currency===o.currency&&a.state==='正常');if(platform&&F.platformBalance(f,platform)>=1000)F.movement(f,platform.id,{kind:'扣款',amount:1000,ref:'DEMO-STEP2-DEBIT',basis:'原出票扣款演示',orderId:oid,airlineOrder:'CA-DEMO-STEP2'},'superadmin');
 const c=B.createChange(b,o,'superadmin');Object.assign(c,{id:cid,scope:[B.pair(o.tickets[0])],reason:'演示退票，部分费用保留',rule:'演示退改规则',evidence:'DEMO-STEP2-REFUND',saleDelta:-2000,costDelta:-1200});B.saveChange(b,c,'superadmin',true);B.review(b,'change',cid,'通过','演示业务确认','superadmin');B.review(b,'change',cid,'通过','演示财务确认','superadmin');B.recordBusiness(b,c,[{key:c.scope[0],state:'成功',ref:'DEMO-STEP2-TICKET-RETURN'}],'superadmin');
 F.syncAdjustments(f,b);
}
return {examples,view,entries,refresh,queryLegacy,refund,collect,supplement,action,topup};
});
