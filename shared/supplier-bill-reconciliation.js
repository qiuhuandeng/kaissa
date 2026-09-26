/* 账单核对：原账单、原成本与处理结果分开保存。金额按分核验。 */
(function (root) {
  'use strict';
  function parse(value) {
    const text=String(value==null?'':value).trim().replace(/^(?:¥|￥|CNY\s*|EUR\s*|USD\s*|MYR\s*|JPY\s*)/,'').replace(/,/g,'');
    if(!/^-?\d+(\.\d{1,2})?$/.test(text))return null;
    const n=Math.round(Number(text)*100);return Number.isSafeInteger(n)?n:null;
  }
  function format(cents) { return '¥'+(cents/100).toLocaleString('zh-CN',{maximumFractionDigits:2}); }
  function compare(row) {
    const original=parse(row.originalAmount),systemOriginal=parse(row.systemOriginal),local=parse(row.localAmount),system=parse(row.systemCost);
    const complete=[original,systemOriginal,local,system].every(x=>x!==null);
    return {complete, originalDiff:original!==null&&systemOriginal!==null?original-systemOriginal:null, localDiff:local!==null&&system!==null?local-system:null, equal:complete&&original===systemOriginal&&local===system};
  }
  function decide(row,result,form) {
    const diff=compare(row);
    const allowed=['核对一致','供应商承担','我方认可补差','按系统成本确认','部分认可','按双方确认金额'];
    if(!allowed.includes(result))return null;
    if(!diff.complete)throw Error('系统成本依据未补齐，不能确认一致或形成应付确认金额');
    if(result==='核对一致'&&!diff.equal)throw Error('账单与系统成本仍有差异，请转差异处理');
    const bill=parse(row.localAmount),system=parse(row.systemCost),discount=parse(row.supplierDiscount||'¥0');
    if(discount===null||discount<0)throw Error('供应商优惠金额无效，请核对原依据');
    const accepted=result==='核对一致'?bill:parse(form.accepted);
    const rejected=result==='核对一致'?0:parse(form.rejected);
    if(accepted===null||rejected===null||accepted<0||rejected<0||accepted+rejected>bill)throw Error('认可与不认可金额须为非负数，合计不能超过供应商账单');
    if(result!=='核对一致'&&!String(form.basis||'').trim())throw Error('请填写双方确认或费用调整的差异依据');
    if(result==='我方认可补差'&&accepted!==bill)throw Error('认可全部补差时，认可金额应等于供应商账单金额');
    if(['供应商承担','按系统成本确认'].includes(result)&&accepted!==system)throw Error('按系统成本处理时，认可金额应等于原系统成本');
    const unresolved=bill-accepted-rejected;
    const partial=result==='部分认可'||unresolved>0;
    if(!partial&&discount>accepted)throw Error('优惠扣减不能超过认可金额');
    return {status:partial?'差异中':'已确认',check:partial?'部分认可':result==='核对一致'?'无差异':result,payable:partial?'未生成':'待生成',payableAmount:partial?'待差异处理完成':format(accepted-discount),acceptedAmount:format(accepted),rejectedAmount:format(rejected),unresolvedAmount:format(unresolved),resolutionBasis:result==='核对一致'?'账单与原系统成本一致':String(form.basis).trim()};
  }
  const api={parse,format,compare,decide};root.SupplierBillReconciliation=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
