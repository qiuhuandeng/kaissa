(function(root){
'use strict';
const copy=v=>JSON.parse(JSON.stringify(v));
const cents=v=>{if(!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(String(v)))throw Error('金额须为非负数，最多两位小数');const n=Math.round(Number(v)*100);if(!Number.isSafeInteger(n))throw Error('金额超出范围');return n;};
const basis=v=>{v=String(v||'').trim();if(!v)throw Error('请填写办理依据');return v;};
function createSession(seed={}){
 const records=copy(seed.records||[]),payments=copy(seed.payments||[]),flows=copy(seed.flows||[]);let serial=1;
 const payment=id=>{const p=payments.find(p=>p.id===id);if(!p)throw Error('未找到原付款');return p;};
 const record=id=>{const r=records.find(r=>r.id===id);if(!r)throw Error('未找到退回记录');return r;};
 const received=r=>r.receipts.reduce((n,x)=>n+cents(x.amount),0);
 const reserved=(id,except)=>records.filter(r=>r.paymentId===id&&r.id!==except).reduce((n,r)=>n+cents(r.amount),0);
 const view=r=>({...copy(r),received:received(r)/100,remaining:r.matched?Math.max(0,cents(r.amount)-received(r))/100:0,status:!r.matched?'已到账待匹配':received(r)===cents(r.amount)?'已到账':received(r)>0?'部分到账':'待到账'});
 function usable(p){if(!['已付款','待回单'].includes(p.state)||!p.reference||p.reference==='-'||/待|未知/.test(p.reference))throw Error('原款未成功付出或结果不明，不能办理资金退回');}
 function request(paymentId,data){
  const p=payment(paymentId);usable(p);const reason=basis(data.basis),amount=cents(data.amount);
  if(!['重复付款退回','银行退回','业务减费退回'].includes(data.kind))throw Error('请选择退回性质');
  if(data.kind!=='银行退回'&&p.prepay)throw Error('未用预付款请在预付管理按原付款明细申请');
  if(!amount||amount>cents(p.amount)-cents(p.returned||0)-reserved(p.id))throw Error('申请超过原付款尚可退回金额');
  if(data.kind==='重复付款退回'&&!String(data.duplicateReference||'').trim())throw Error('请填写另一笔重复实付的付款号及核对依据');
  if(data.kind==='银行退回'&&!String(data.bankNotice||'').trim())throw Error('请填写银行退汇通知号');
  if(data.kind==='业务减费退回'){
   const source=data.source;
   if(!source||!source.confirmed||!source.id||source.company!==p.company||source.supplier!==p.supplier||source.currency!==p.currency)throw Error('须有同公司、供应商和币种的业务确认依据');
   const sourceReserved=records.filter(r=>r.sourceId===source.id).reduce((n,r)=>n+cents(r.amount),0);
   if(amount+sourceReserved>Math.max(0,cents(source.paid)-cents(source.final)))throw Error('退回超过最终确认的应退差额');
  }
  const r={id:'RET-20260929-'+String(serial++).padStart(4,'0'),paymentId:p.id,company:p.company,supplier:p.supplier,currency:p.currency,business:p.business||'',amount:amount/100,kind:data.kind,sourceId:data.source?.id||'',basis:reason,duplicateReference:data.duplicateReference||'',bankNotice:data.bankNotice||'',matched:true,receipts:[],proof:'',voucher:'未生成',date:'2026-09-29'};records.unshift(r);return view(r);
 }
 function receive(id,flowId,reason){
  const r=record(id);if(!r.matched)throw Error('请先匹配原付款');const p=payment(r.paymentId);usable(p);
  reason=basis(reason);const f=flows.find(f=>f.id===flowId);if(!f)throw Error('请选择实际到账流水');if(f.used)throw Error('该到账流水已使用，请勿重复核对');
  if(f.company!==r.company||f.supplier!==r.supplier||f.currency!==r.currency||f.direction!=='收入')throw Error('到账公司、付款方、币种或方向不符');
  if(cents(f.amount)+received(r)>cents(r.amount))throw Error('累计到账超过本次应退金额');
  f.used=true;r.receipts.push({flowId:f.id,amount:f.amount,date:f.date,basis:reason});return view(r);
 }
 function register(flowId,reason){
  reason=basis(reason);const f=flows.find(f=>f.id===flowId);if(!f||f.direction!=='收入')throw Error('请选择已入账的收入流水');if(f.used)throw Error('该流水已登记或已匹配');
  const r={id:'RET-UNM-20260929-'+String(serial++).padStart(3,'0'),paymentId:'',company:f.company,supplier:f.supplier,currency:f.currency,business:'待核对',amount:f.amount,kind:'待确认',basis:reason,matched:false,receipts:[{flowId:f.id,amount:f.amount,date:f.date,basis:reason}],proof:'',voucher:'未生成',date:f.date};f.used=true;records.unshift(r);return view(r);
 }
 function match(id,paymentId,kind,reason){
  const r=record(id);if(r.matched)throw Error('本条已匹配，请勿重复办理');const p=payment(paymentId);usable(p);reason=basis(reason);
  if(p.company!==r.company||p.supplier!==r.supplier||p.currency!==r.currency)throw Error('原付款公司、付款对象及币种须与到账一致');
  if(!['银行退回','重复付款退回','供应商退回','预付退回'].includes(kind))throw Error('请选择有效退回性质');
  if(cents(r.amount)>cents(p.amount)-cents(p.returned||0)-reserved(p.id,r.id))throw Error('到账超过原付款尚可匹配金额');
  if(kind==='预付退回'&&(!p.prepay||cents(r.amount)>cents(p.prepayAvailable||0)))throw Error('到账超过未用预付余额，须核对原款性质');
  Object.assign(r,{paymentId:p.id,kind,matched:true,basis:reason,business:p.business||r.business});return view(r);
 }
 function importRequest(r,p){if(records.some(x=>x.id===r.id))return view(record(r.id));if(!p||p.id!==r.paymentId)throw Error('缺少原付款依据');usable(p);const amount=cents(r.amount);if(amount<=0||amount>cents(p.amount)-cents(p.returned||0)-reserved(p.id))throw Error('退回申请金额无效');if(r.company!==p.company||r.supplier!==p.supplier||r.currency!==p.currency)throw Error('退回申请与原付款不一致');if(!payments.some(x=>x.id===p.id))payments.push(copy(p));const item={...copy(r),matched:true,receipts:[],voucher:'未生成'};records.unshift(item);return view(item);}
 return {list:()=>records.map(view),get:id=>view(record(id)),payments:()=>copy(payments),flows:()=>copy(flows),request,receive,register,match,importRequest,available:id=>{const p=payment(id);return (cents(p.amount)-cents(p.returned||0)-reserved(id))/100;}};
}
const api={cents,createSession};if(typeof module==='object'&&module.exports)module.exports=api;root.PaymentReturnWorkbenchModel=api;
})(typeof window==='object'?window:globalThis);
