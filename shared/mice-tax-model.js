/* 税费业务测算；适用方式由财务确认，不将发票种类当计税方式。 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./mice-prototype-model.js'):root.MiceModel);if(typeof module==='object'&&module.exports)module.exports=api;else root.MiceTaxModel=api;})(typeof window!=='undefined'?window:globalThis,function(M){
'use strict';const rates=[0,1,3,6,9,13],defaultServices=['会务服务','旅游服务','会议会展服务','场地及设备服务'];
const valid=n=>n!=null&&n!==''&&Number.isFinite(Number(n));
function split(gross,rate){if(!valid(gross)||!valid(rate)||+rate<0||+rate>100)return {net:null,tax:null};const net=M.round(+gross/(1+ +rate/100));return{net,tax:M.round(+gross-net)};}
function settings(data,company){return data.catalog.invoiceSettings?.find(s=>s.company===company)||{company,rates:rates.map(rate=>({rate,enabled:true})),services:defaultServices.map((name,i)=>({id:'SERVICE-'+i,name,rate:null,enabled:true}))};}
const activeRates=(data,company)=>settings(data,company).rates.filter(r=>r.enabled).map(r=>Number(r.rate));
function sales(tax,gross){if(!tax||tax.method==='pending')return{tax:null,net:null};if(tax.method==='standard')return split(gross,tax.rate);const taxAmount=M.num(tax.manualTax);return{tax:taxAmount,net:valid(gross)&&taxAmount!=null?M.round(gross-taxAmount):null};}
function salesErrors(tax,gross,data,company){const e={};if(!tax||tax.method==='pending')return e;if(!['standard','manual'].includes(tax.method))e.salesTaxMethod='请选择测算方式';if(!tax.basis?.trim())e.salesTaxBasis='请登记适用方式与税率的测算依据';if(tax.method==='standard'&&!activeRates(data,company).includes(Number(tax.rate))||tax.method==='standard'&&!valid(tax.rate))e.salesTaxRate='请选择财务维护的有效税率';if(tax.method==='manual'&&(!valid(tax.manualTax)||+tax.manualTax<0||valid(gross)&&+tax.manualTax>+gross))e.salesManualTax='请填写含税金额范围内的预计销项税额';return e;}
function costEstimate(c){const s=split(c.amount,c.expectedTaxRate);let deduction=null;if(c.deductionMode==='none')deduction=0;else if(c.deductionMode==='full')deduction=s.tax;else if(c.deductionMode==='partial')deduction=M.num(c.estimatedTax);return{...s,deduction,adjustedCost:valid(c.amount)&&deduction!=null?M.round(c.amount-deduction):null};}
function costErrors(c,data,company){const e={};if(c.expectedTaxRate!==''&&c.expectedTaxRate!=null&&!activeRates(data,company).includes(+c.expectedTaxRate))e.expectedTaxRate='请选择有效税率；历史停用税率须由财务核对';if(c.deductionMode&&c.deductionMode!=='pending'&&!c.deductionBasis?.trim())e.deductionBasis='请填写预计可扣处理依据，最终仍由财务核定';const v=costEstimate(c);if(c.deductionMode==='full'&&v.tax==null)e.expectedTaxRate='请填写金额与预计税率后测算';if(c.deductionMode==='partial'&&(!valid(c.estimatedTax)||+c.estimatedTax<0||v.tax==null||+c.estimatedTax>v.tax))e.estimatedTax='预计可扣税额应在预计票面税额内';return e;}
function invoiceOccupied(invoices,orderId,except='',knownInvoiced=0){const rows=invoices.filter(i=>i.id!==except&&!['已退回','开具失败','已撤回'].includes(i.status));const amount=xs=>M.sum(xs.flatMap(i=>i.allocations||[]).filter(a=>a.orderId===orderId));return M.round(Math.max(Number(knownInvoiced)||0,amount(rows.filter(i=>i.status==='已开具')))+amount(rows.filter(i=>i.status!=='已开具')));}
function invoiceErrors(data,r){const errors=[];if(['title','taxNo','company','invoiceKind','service','recipient'].some(k=>!r[k]))errors.push('申请资料不完整，请退回补充');if(!valid(r.amount)||r.amount<=0||M.sum(r.allocations||[])!==r.amount)errors.push('申请金额与订单分配不一致');const ids=new Set();for(const a of r.allocations||[]){const o=data.orders.find(o=>o.id===a.orderId);if(ids.has(a.orderId))errors.push('同一订单不能重复分配');ids.add(a.orderId);if(!o||o.customer!==r.customer||o.company!==r.company||o.currency!==r.currency||!valid(o.amount)||['已取消','已作废'].includes(o.status))errors.push('订单或签约方资料已变化，请重新核对');else if(!(a.amount>0)||a.amount>o.amount-invoiceOccupied(data.invoices,o.id,r.id,o.invoiced))errors.push('订单可开票金额不足，请退回重核');}return [...new Set(errors)];}
function values(data,projectId,currency='CNY',activityId=''){
 const orders=data.orders.filter(o=>o.projectId===projectId&&o.currency===currency&&!['已取消','已作废'].includes(o.status)&&(!activityId||o.activities.includes(activityId))),sc=M.costScope(data.costs,projectId,activityId?[activityId]:null),lines=sc.lines.filter(c=>c.currency===currency),issues=[];
 const grossIncome=!orders.length||orders.some(o=>!valid(o.amount)||activityId&&o.activities.length!==1)?null:M.sum(orders);
 if(orders.some(o=>activityId&&o.activities.length!==1))issues.push('整体包价未分团，不计算本团毛利');
 const grossCost=!lines.length||lines.some(c=>!valid(c.amount)||c.incomplete||c.status!=='已确认')?null:M.sum(lines);
 const sumKnown=xs=>xs.length&&xs.every(valid)?M.round(xs.reduce((n,v)=>n+ +v,0)):null;
 const outputTax=sumKnown(orders.map(o=>o.salesTaxAmount));
 const estimatedOutputTax=sumKnown(orders.map(o=>sales(o.taxEstimate,o.amount).tax));
 function taxFor(line,approved){const c=data.costs.find(c=>c.id===line.costId),tax=approved?c.approvedTax:costEstimate(c).deduction;if(!activityId||line.kind==='direct')return tax;if(approved){const a=c.allocations?.find(a=>a.activityId===activityId);return a?.approvedTax??null;}return valid(tax)&&valid(line.amount)&&c.amount>0?M.round(tax*line.amount/c.amount):null;}
 const inputTax=sumKnown(lines.map(c=>taxFor(c,true))),estimatedInputTax=sumKnown(lines.map(c=>taxFor(c,false)));
 if(activityId&&lines.some(c=>c.kind!=='direct'))issues.push('公共费用预计税额按本团承担比例测算；分团核定税额未确认时不出核定毛利');
 const profit=(income,cost)=>income==null||cost==null?null:M.round(income-cost),rate=(v,base)=>v==null||!(base>0)?null:M.round(v/base*100);
 const netIncome=profit(grossIncome,outputTax),netCost=profit(grossCost,inputTax),estimatedNetIncome=profit(grossIncome,estimatedOutputTax),estimatedNetCost=profit(grossCost,estimatedInputTax),grossProfit=profit(grossIncome,grossCost),netProfit=profit(netIncome,netCost),estimatedNetProfit=profit(estimatedNetIncome,estimatedNetCost);
 return{grossIncome,grossCost,grossProfit,grossRate:rate(grossProfit,grossIncome),outputTax,inputTax,netIncome,netCost,netProfit,netRate:rate(netProfit,netIncome),estimatedOutputTax,estimatedInputTax,estimatedNetIncome,estimatedNetCost,estimatedNetProfit,estimatedNetRate:rate(estimatedNetProfit,estimatedNetIncome),issues};
}
// 结算金额只使用本次范围；完整覆盖的订单计一次，整包未分团不分摊收入。
function settlementEvidence(data,record){
 const evidence=M.settlementEvidence(data,record),selected=new Set(record.activities),project=data.projects?.find(p=>p.id===record.projectId);
 const known=xs=>xs.length&&xs.every(valid)?M.round(xs.reduce((n,v)=>n+Number(v),0)):null;
 const orders=(data.orders||[]).filter(o=>o.projectId===record.projectId&&!['已取消','已作废'].includes(o.status)&&(o.activities||[]).some(id=>selected.has(id)));
 const incomeLines=orders.map(o=>{const covered=(o.activities||[]).every(id=>selected.has(id)),estimate=sales(o.taxEstimate,o.amount);return{
  id:o.id,version:o.version||1,status:o.status,currency:o.currency||'CNY',activities:[...o.activities],
  originalAmount:M.num(o.amount),amount:covered?M.num(o.amount):null,covered,
  estimatedTax:covered?estimate.tax:null,approvedTax:covered?M.num(o.salesTaxAmount):null,
  method:o.taxEstimate?.method||'pending',rate:o.taxEstimate?.rate??null,estimateBasis:o.taxEstimate?.basis||'',approvedBasis:o.salesTaxBasis||''
 };});
 const costLines=evidence.costs.map(line=>{
  const c=data.costs.find(c=>c.id===line.costId),estimate=costEstimate(c),allocations=c.allocations||[];
  const share=amount=>valid(estimate.deduction)&&valid(amount)&&valid(c.amount)&&Number(c.amount)!==0?M.round(estimate.deduction*amount/c.amount):Number(c.amount)===0&&Number(amount)===0&&estimate.deduction===0?0:null;
  let estimatedTax=null,approvedTax=null;
  if(!line.incomplete&&valid(line.amount)){
   if(line.kind==='direct'){estimatedTax=estimate.deduction;approvedTax=M.num(c.approvedTax);}
   else if(line.kind==='project'){
    // 项目承担额取已完整分配后的余数；不把分团待核税额猜成零。
    const distribution=M.costDistribution(c),estimatedShares=allocations.length?known(allocations.map(a=>share(a.amount))):0,approvedShares=allocations.length?known(allocations.map(a=>a.approvedTax)):0;
    if(distribution.remaining===0){
     if(valid(estimate.deduction)&&estimatedShares!=null)estimatedTax=M.round(estimate.deduction-estimatedShares);
     if(valid(c.approvedTax)&&approvedShares!=null)approvedTax=M.round(c.approvedTax-approvedShares);
    }
   }else{
    estimatedTax=known(line.allocationAmounts.map(a=>share(a.amount)));
    approvedTax=known(line.allocationAmounts.map(a=>a.approvedTax));
    if(!valid(c.approvedTax)||allocations.some(a=>valid(a.approvedTax)&&Number(a.approvedTax)<0)||M.sum(allocations,'approvedTax')>Number(c.approvedTax))approvedTax=null;
   }
  }
  const bounded=value=>valid(value)&&valid(line.amount)&&Number(value)>=Math.min(0,line.amount)&&Number(value)<=Math.max(0,line.amount)?Number(value):null;
  return {...line,estimatedTax:bounded(estimatedTax),approvedTax:bounded(approvedTax),rate:c.expectedTaxRate??null,deductionMode:c.deductionMode||'pending',estimateBasis:c.deductionBasis||'',approvedBasis:c.financeBasis||'',ticketNumber:c.ticketNumber||'',ticketTax:M.num(c.ticketTax)};
 });
 const currencies=[...new Set([...incomeLines,...costLines].map(l=>l.currency))];
 const amounts=currencies.map(currency=>{
  const ins=incomeLines.filter(l=>l.currency===currency),costs=costLines.filter(l=>l.currency===currency),issues=[];
  const grossIncome=known(ins.map(l=>l.amount)),noCosts=!costs.length&&!!record.noCost&&!M.costScope(data.costs,record.projectId,record.activities,!!record.includeProjectCosts).pending.length;
  const grossCost=noCosts?0:costs.every(c=>c.status==='已确认'&&!c.incomplete)?known(costs.map(c=>c.amount)):null;
  const estimatedOutputTax=known(ins.map(l=>l.estimatedTax)),outputTax=known(ins.map(l=>l.approvedTax));
  const estimatedInputTax=noCosts?0:known(costs.map(l=>l.estimatedTax)),inputTax=noCosts?0:known(costs.map(l=>l.approvedTax));
  const diff=(a,b)=>valid(a)&&valid(b)?M.round(a-b):null,pct=(profit,base)=>valid(profit)&&base>0?M.round(profit/base*100):null;
  const estimatedNetIncome=diff(grossIncome,estimatedOutputTax),netIncome=diff(grossIncome,outputTax),estimatedNetCost=diff(grossCost,estimatedInputTax),netCost=diff(grossCost,inputTax);
  const grossProfit=diff(grossIncome,grossCost),estimatedNetProfit=diff(estimatedNetIncome,estimatedNetCost),netProfit=diff(netIncome,netCost);
  if(ins.some(l=>!l.covered))issues.push('整包收入未分团：'+ins.filter(l=>!l.covered).map(l=>l.id).join('、'));
  if(selected.size&&!ins.length)issues.push('本币种收入未明确');
  if(ins.some(l=>l.covered&&!valid(l.amount)))issues.push('客户金额待确认');
  if(ins.some(l=>l.covered&&!valid(l.approvedTax)))issues.push('销项税额待核定');
  if(costs.some(l=>!valid(l.approvedTax)))issues.push('可扣税额待核定');
  if(grossCost==null)issues.push('本次成本待确认');
  return{currency,incomeApplicable:selected.size>0,grossIncome,grossCost,grossProfit,grossRate:pct(grossProfit,grossIncome),estimatedOutputTax,outputTax,estimatedInputTax,inputTax,estimatedNetIncome,netIncome,estimatedNetCost,netCost,estimatedNetProfit,netProfit,estimatedNetRate:pct(estimatedNetProfit,estimatedNetIncome),netRate:pct(netProfit,netIncome),issues};
 });
 return {...evidence,financial:{version:1,project:{id:record.projectId,name:project?.name||record.projectId,customer:project?.customer||'',company:project?.company||''},activities:record.activities.map(id=>{const a=data.activities.find(a=>a.id===id);return{id,name:a?.name||id,start:a?.start||'',end:a?.end||''};}),noCost:record.noCost||'',incomeLines,costLines,amounts}};
}
return{rates,settings,activeRates,split,sales,salesErrors,costEstimate,costErrors,invoiceOccupied,invoiceErrors,values,settlementEvidence};});
