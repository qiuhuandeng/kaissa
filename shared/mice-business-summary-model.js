/* 会奖日期计划和只读业务金额；金额仍由原订单、费用及结算单维护。 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./mice-prototype-model.js'):root.MiceModel);if(typeof module==='object'&&module.exports)module.exports=api;else root.MiceBusinessModel=api;})(typeof window!=='undefined'?window:globalThis,function(M){
'use strict';
const valid=n=>n!==''&&n!=null&&Number.isFinite(Number(n));
const live=o=>!['已取消','已作废'].includes(o.status);
function normalizePlan(rows=[]){return rows.filter(n=>n.due||n.date||n.expectedDue||n.trigger||valid(n.amount)||valid(n.ratio)).map(n=>{const expected=n.dateKind==='预计';return {...n,name:n.name||'一次收款',mode:n.mode||'比例',dateKind:expected?'预计':'约定',due:expected?'':n.due||n.date||'',expectedDue:expected?n.expectedDue||n.due||n.date||'':'',trigger:n.trigger||'',amount:M.num(n.amount),ratio:M.num(n.ratio)};});}
function orderPlan(a){const plan=normalizePlan(a?.collectionPlan);return plan.length?plan.map(n=>({...n,ratio:n.mode==='比例'&&n.ratio==null&&plan.length===1?100:n.ratio})):[];}
function dates(nodes){const ns=normalizePlan(nodes);return {agreed:ns.filter(n=>n.due).map(n=>n.name+'：'+n.due).join('；'),expected:ns.filter(n=>n.expectedDue).map(n=>n.name+'：'+n.expectedDue).join('；'),conditions:ns.filter(n=>n.trigger).map(n=>n.name+'：'+n.trigger).join('；')};}
function receipts(data,a){return data.orders.filter(o=>live(o)&&o.projectId===a.projectId&&o.activities?.includes(a.id)).map(o=>{const records=(data.claims||[]).flatMap(c=>(c.allocations||[]).filter(x=>x.orderId===o.id).map(x=>({id:c.id,status:c.status,amount:x.amount,node:x.node||'',flowId:c.flowId||'',basis:c.reason||c.basis||''})));const received=valid(o.received)?+o.received:M.sum(records.filter(c=>c.status==='已认款'));return {order:o,received,remaining:valid(o.amount)?M.round(o.amount-received):null,pending:M.sum(records.filter(c=>c.status==='待财务认款')),records};});}
function commercial(data,pid,ids,currency,amount){
 const scope=M.costScope(data.costs.filter(c=>live(c)&&c.currency===currency),pid,ids),lines=scope.lines;
 const known=xs=>xs.length&&xs.every(valid)?M.round(xs.reduce((n,v)=>n+ +v,0)):null;
 const recordedEstimate=known(lines.map(l=>{const c=data.costs.find(c=>c.id===l.costId);return l.incomplete?null:l.kind==='direct'?(valid(c.estimate)?c.estimate:l.amount):l.amount;}));
 const groups=ids.map(id=>data.activities.find(a=>a.id===id)),fullEstimate=currency==='CNY'&&groups.length&&groups.every(a=>a&&valid(a.latestEstimate)&&a.budgetHistory?.some(h=>h.basis));
 const estimated=fullEstimate?known(groups.map(a=>a.latestEstimate)):recordedEstimate;
 const confirmed=lines.length?M.sum(lines.filter(l=>l.status==='已确认'&&valid(l.amount))):null;
 const pending=scope.pending.length||lines.some(l=>l.incomplete||!valid(l.amount)||l.status!=='已确认');
 const covered=ids.length&&ids.every(id=>lines.some(l=>l.activities.includes(id)));
 const records=(data.settlements||[]).filter(r=>r.projectId===pid&&r.status==='已确认'&&r.confirmedRecord?.financial&&r.activities.some(id=>ids.includes(id)));
 // Only reuse an exact, confirmed settlement scope. A wider settlement is never silently prorated.
 const record=records.slice().reverse().find(r=>r.activities.length===ids.length&&r.activities.every(id=>ids.includes(id)));
 const settled=record?.confirmedRecord.financial.amounts?.find(v=>v.currency===currency);
 const complete=!!record?.budgetComplete&&!pending;
 const estimateUsable=(fullEstimate&&(!valid(confirmed)||estimated>=confirmed)||complete)&&!scope.pending.length;
 const profit=estimateUsable&&valid(amount)&&valid(estimated)?M.round(amount-estimated):null;
 return {estimated,fullEstimate,confirmed,profit,rate:profit!=null&&amount>0?M.round(profit/amount*100):null,settled,record,
  note:fullEstimate?(valid(confirmed)&&confirmed>estimated?'已确认费用超过最新预计，须重核预计成本':scope.pending.length?'费用分配尚未核齐，毛利待核对':'按原费用页登记的项目团最新预计测算，实际毛利以结算为准'):!ids.length?'尚未关联项目团':!covered&&!record?.noCost?'部分项目团尚未登记费用':pending?'费用金额或分配尚未核齐':!complete?'费用尚未确认完整，毛利待核对':'按已确认完整的费用测算；结算金额以原结算记录为准'};
}
return {normalizePlan,orderPlan,dates,receipts,commercial};
});
