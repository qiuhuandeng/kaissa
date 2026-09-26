/* 同行对账款票承接：各页面独立会话，原币金额按分计算。 */
(function(root){
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x));
const money=x=>{if(!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(String(x)))throw Error('金额须为非负数，最多两位小数');const n=Math.round(Number(x)*100);if(!Number.isSafeInteger(n)||n>99999999999)throw Error('金额超出范围');return n;};
const mainId='DZ20260926003',pendingId='DZ20260926002';
function seed(id){
 const pending=id===pendingId;if(id!==mainId&&!pending)throw Error('本页没有该对账单的款票记录，请按单号核对原办理记录');
 return {id,revision:1,confirmed:!pending,company:pending?'北京凯撒':'福建凯撒',paymentCompany:pending?'北京凯撒':'福建凯撒',supplier:'北京国旅地接部',currency:'CNY',agreement:pending?'AGR-GL-BJ-012':'AGR-GL-FJ-013',order:pending?'KS20260902002':'KS20260908003',tour:pending?'JP20260905002':'JP20260908003',amount:pending?51000:101000,payableNo:pending?'AP-DZ-002':'AP-DZ-003',billNo:pending?'BN-DZ-002':'BN-DZ-003',prepayNo:'PP-DZ-003',applyNo:'FK-DZ-003',paymentNo:'PAY-DZ-003',invoiceNo:'INV-DZ-003',basisChecked:false,version:1,
 offsets:pending?[]:[{id:'HX03',amount:30000,prepay:'PP-DZ-003',company:'福建凯撒',supplier:'北京国旅地接部',currency:'CNY'}],
 payments:pending?[]:[{id:'FK03',amount:50000,state:'已付款',reference:'FJ-20260920-050000',date:'2026-09-20'},{id:'PAY-DZ-003',amount:10000,state:'待付款',reference:'',date:''}],
 application:{id:'FK-DZ-003-NEW',amount:pending?51000:11000,state:'待复核',reason:''},
 invoice:{task:'INV-DZ-003',no:'FJ20260925003',seller:'北京国旅地接部',buyer:pending?'北京凯撒':'福建凯撒',currency:'CNY',amount:pending?51000:101000,date:'2026-09-25',status:'待核验',basis:'',file:'国旅九月地接发票.pdf'},logs:[]};
}
function totals(r){const offset=r.offsets.reduce((n,x)=>n+money(x.amount),0),paid=r.payments.filter(p=>p.state==='已付款').reduce((n,p)=>n+money(p.amount),0)-(r.refund?.kind==='bank'?r.refund.receipts.reduce((n,x)=>n+money(x.amount),0):0),processing=r.payments.filter(p=>['待付款','付款中'].includes(p.state)).reduce((n,p)=>n+money(p.amount),0)+(r.application.state==='审批中'?money(r.application.amount):0),remaining=money(r.amount)-offset-paid;if(remaining<0||processing>remaining)throw Error('款项记录超过应付，请核对原记录');return {offset:offset/100,paid:paid/100,processing:processing/100,remaining:remaining/100,available:(remaining-processing)/100};}
function createSession(stage,id=mainId,returnKind='prepay'){
 if(!['bill','payable','prepay','apply','payment','invoice','return'].includes(stage))throw Error('无效的款票办理岗位');
 const r=seed(id),prepayments=[{id:'PP-DZ-003',company:'福建凯撒',supplier:r.supplier,currency:'CNY',amount:35000,used:30000},{id:'PP-BJ-009',company:'北京凯撒',supplier:r.supplier,currency:'CNY',amount:10000,used:0},{id:'PP-EUR-009',company:'福建凯撒',supplier:r.supplier,currency:'EUR',amount:5000,used:0},{id:'PP-OTHER-009',company:'福建凯撒',supplier:'欧洲联合地接社',currency:'CNY',amount:5000,used:0}];
 if(stage==='invoice'){
  r.invoice.version=2;r.invoice.file='国旅九月地接发票-补正.pdf';
  r.invoiceHistory=[{version:1,no:r.invoice.no,file:'国旅九月地接发票.pdf',action:'退回补正',basis:'购方名称缺字，请补充清晰完整的原票材料'},{version:2,no:r.invoice.no,file:r.invoice.file,action:'供应商补正重提',basis:'已补充完整清晰票面，待发票岗核验'}];
 }
 if(stage==='return'){
  if(!['prepay','bank'].includes(returnKind))throw Error('退回类型不存在');
  const bank=returnKind==='bank';r.returnNo=bank?'RET-DZ-004':'RET-DZ-003';
  r.refund={kind:returnKind,type:bank?'银行退回':'供应商退预付',amount:bank?10000:5000,status:'待到账',originalPayment:bank?'FK03':'PAY-PP-003',originalAmount:bank?50000:35000,originalState:'已付款',prepay:bank?'':r.prepayNo,payable:bank?r.payableNo:'',basis:bank?'银行退回通知 BR-0926-04；原应付仍需支付':'预付结余退回确认 TH-0926-03；双方同意退还未冲抵的5,000元',receipts:[]};
  const flow=(id,amount,company=r.company,supplier=r.supplier,currency='CNY')=>({id:bank?'BANK-'+id:id,amount,company,supplier,currency,date:'2026-09-26',account:'福建工行 · 0888',used:false,direction:'收入'});
  r.flows=[flow('FLOW-RET-2000',2000),flow('FLOW-RET-3000',3000),flow('FLOW-RET-5000',5000),flow('FLOW-RET-10000',10000),flow('FLOW-RET-BJ',5000,'北京凯撒'),flow('FLOW-RET-EUR',5000,r.company,r.supplier,'EUR'),flow('FLOW-RET-OTHER',5000,r.company,'其他供应商')];
 }
 function guard(version,allowed){if(!allowed.includes(stage))throw Error('当前岗位不能办理此操作');if(version!==r.version)throw Error('办理记录已更新，请重新打开');if(!r.confirmed)throw Error('双方尚未确认同一对账版本，请交计调处理');}
 function reason(v){v=String(v||'').trim();if(!v)throw Error('请填写本次办理依据');return v;}
 function log(action,basis){r.logs.push({action,basis,version:r.version,time:new Date().toLocaleString('sv-SE').slice(0,16),actor:{bill:'应付岗',payable:'应付岗',prepay:'应付岗',apply:'付款复核岗',payment:'资金岗',invoice:'发票岗',return:'资金岗'}[stage]});r.version++;}
 function check(version,basis){guard(version,['bill','payable']);if(r.basisChecked)throw Error('本版对账已核对，无需重复办理');basis=reason(basis);r.basisChecked=true;log('核对应付依据（沿用 '+r.payableNo+'）',basis);return get();}
 function offset(version,data){guard(version,['prepay']);const p=prepayments.find(p=>p.id===data.prepay);if(!p)throw Error('请选择原预付单');if(p.company!==r.company||p.supplier!==r.supplier||p.currency!==r.currency)throw Error('预付与应付的公司、供应商和币种须一致；跨公司另核批准依据');const amount=money(data.amount);if(!amount||amount>money(p.amount)-money(p.used)||amount>money(totals(r).available))throw Error('本次冲抵超过预付余额或未被付款占用的应付金额');const basis=reason(data.basis);if(!data.request||r.offsets.some(x=>x.id===data.request))throw Error('该冲抵记录已办理，请勿重复');p.used=(money(p.used)+amount)/100;r.offsets.push({id:data.request,amount:amount/100,prepay:p.id,company:p.company,supplier:p.supplier,currency:p.currency});log('确认预付冲抵',basis);return get();}
 function submit(version,data){guard(version,['apply']);if(r.application.state!=='待复核')throw Error('本申请已办理，不可重复提交');if(data.company!==r.company)throw Error('本单无跨公司代付批准依据，请核对付款公司');const amount=money(data.amount);if(!amount||amount!==money(r.application.amount)||amount>money(totals(r).available))throw Error('申请金额与原申请不符或超过可申请金额，请退回业务修改');const basis=reason(data.basis);r.application.state='审批中';log('复核通过 → 审批人',basis);return get();}
 function returnApply(version,basis){guard(version,['apply']);if(r.application.state!=='待复核')throw Error('本申请已办理');basis=reason(basis);r.application.state='已退回';r.application.reason=basis;log('退回付款申请 → 原申请人',basis);return get();}
 function payment(version,data){guard(version,['payment']);const p=r.payments.find(x=>x.id===r.paymentNo);if(!p)throw Error('尚无获批付款单');if(data.action==='submit'){
   if(!['待付款','付款失败'].includes(p.state))throw Error('本付款已提交或已完成，请勿重复');if(data.company!==r.company)throw Error('付款账户不属于本单付款公司，且无代付批准依据');if(data.account!=='FJ-ICBC-0888')throw Error('请选择本公司核准的付款账户');if(p.state==='付款失败'&&money(p.amount)>money(totals(r).available))throw Error('可用金额不足，不能重新付款');const basis=reason(data.basis);p.state='付款中';p.reference='';log('提交付款（本页演示，尚未实际扣款）',basis);
  }else {if(p.state!=='付款中')throw Error('当前付款不在处理中，不能重复登记结果');const basis=reason(data.basis);if(data.action==='success'){const ref=String(data.reference||'').trim();if(!ref||r.payments.some(x=>x.state==='已付款'&&x.reference===ref))throw Error('请填写有效且未使用的银行交易号');if(!/^2026-09-(0[1-9]|1\d|2[0-6])$/.test(data.date||''))throw Error('请填写本示例期间内已发生的付款日期');p.state='已付款';p.reference=ref;p.date=data.date;log('登记付款成功 → 回单核销',basis);}else if(data.action==='fail'){p.state='付款失败';log('登记付款失败（未计已付）',basis);}else throw Error('请选择成功或失败；结果未明时保持付款中');}
  return get();}
 function invoice(version,data){guard(version,['invoice']);if(r.invoice.status!=='待核验')throw Error('票据已办理，请勿重复核验');const basis=reason(data.basis);if(data.action==='return'){r.invoice.status='待补正';r.invoice.basis=basis;r.invoiceHistory.push({version:r.invoice.version,no:r.invoice.no,file:r.invoice.file,action:'退回补正',basis});log('退回票据补正 → 供应商票据人员',basis);return get();}if(data.action!=='verify')throw Error('请选择核验结果');if(data.buyer!==r.company||data.seller!==r.supplier||data.currency!==r.currency)throw Error('发票购销方或币种与本单不符，请退回补正');if(money(data.amount)!==money(r.invoice.amount)||money(data.amount)>money(r.amount))throw Error('发票金额与材料不符或超过可关联金额，不能用未付余额代替应结金额');r.invoice.status='已核验';r.invoice.basis=basis;r.invoiceHistory.push({version:r.invoice.version,no:r.invoice.no,file:r.invoice.file,action:'核验通过',basis});log('登记票据核验结果（不改变付款）',basis);return get();}
 function confirmReturn(version,data){
  guard(version,['return']);const f=r.refund;if(f.status==='已到账')throw Error('本退回已全部到账，请勿重复核对');
  if(f.originalState!=='已付款')throw Error('原款尚未付出，应在付款执行登记失败或重试');
  const basis=reason(data.basis),flow=r.flows.find(x=>x.id===data.flow);if(!flow)throw Error('请选择实际到账流水');
  if(flow.used||f.receipts.some(x=>x.flow===flow.id))throw Error('该到账流水已核对，请勿重复使用');
  if(flow.company!==r.paymentCompany||flow.supplier!==r.supplier||flow.currency!==r.currency||flow.direction!=='收入')throw Error('到账公司、付款方、币种或收支方向与本退回不符');
  const amount=money(data.amount),received=f.receipts.reduce((n,x)=>n+money(x.amount),0);
  if(!amount||amount!==money(flow.amount))throw Error('本次金额须等于所选实际到账流水金额');
  if(amount+received>money(f.amount)||amount+received>money(f.originalAmount))throw Error('累计到账超过本单应退或原付款金额');
  if(f.kind==='prepay'&&amount+received>money(prepayments[0].amount)-money(prepayments[0].used))throw Error('退回超过未冲抵的预付余额');
  flow.used=true;f.receipts.push({flow:flow.id,amount:amount/100,date:flow.date,basis});f.status=amount+received===money(f.amount)?'已到账':'部分到账';
  log('核对退回到账 → 应付岗核对余额',basis);return get();
 }
 function get(){const t=totals(r),f=r.refund;if(f){const received=f.receipts.reduce((n,x)=>n+money(x.amount),0)/100;f.received=received;f.remaining=(money(f.amount)-money(received))/100;f.prepayBalance=(money(prepayments[0].amount)-money(prepayments[0].used)-(f.kind==='prepay'?money(received):0))/100;}return {...copy(r),totals:t,prepayments:copy(prepayments)};}
 return {stage,get,check,offset,submit,returnApply,payment,invoice,confirmReturn};
}
const api={mainId,pendingId,seed,totals,money,createSession};if(typeof module==='object'&&module.exports)module.exports=api;root.SupplierFinanceModel=api;
})(typeof window==='object'?window:globalThis);
