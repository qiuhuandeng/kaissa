(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./finance-accounting-model.js'),require('./return-finance-model.js'));else root.CaesarAccountingConfirmation=factory(root.CaesarAccountingReport,root.CaesarReturnFinance);})(typeof globalThis==='object'?globalThis:this,function(base,rf){
 const columns={flows:['id','kindLabel','entity','book','currency','basis','period','date','amount','assigned','unassigned','status'],completion:['order','record','product','actual','entity','book','currency','basis','businessRevenue','income','cost','status']};
 function query(input={},data=base.fixture()){
  const q={...base.defaults,...input};if(!columns[q.view])throw Error('请选择确认明细或结算对照');
  const error=rf.validate({...rf.defaults,...q,dataset:'demo',mode:q.view});if(error)throw Error(error);
  if(q.dataset==='pending')return {rows:[],sections:[],pending:true,notice:'确认来源未提供'};
  const result=rf.run({...q,dataset:'demo',mode:q.view},null,data),completions=new Map(data.completions.map(c=>[c.record,c]));
  let records=result.records.filter(r=>q.view==='flows'?['income','cost'].includes(r.kind):['income','cost','settlement'].includes(r.kind));
  if(q.view==='flows'&&q.order)records=records.filter(r=>r.allocations.some(a=>String(completions.get(a.target)?.order||'').toLowerCase().includes(q.order.toLowerCase())));
  let rows=q.view==='flows'?records.map(r=>({...r,kindLabel:rf.kinds[r.kind],amount:r.valid?r.amount:null,assigned:r.valid?rf.sum(r.allocations):null,unassigned:r.valid?Math.round((r.amount-rf.sum(r.allocations))*100)/100:null,status:r.valid?(r.unallocatedAmount?'含未分配金额':'确认依据有效'):r.gaps.join('；'),original:r.original||r.settlesEstimate||'',estimate:r.estimate?'暂估':r.reversal?'暂估冲回':'非暂估',orders:[...new Set(r.allocations.map(a=>completions.get(a.target)?.order).filter(Boolean))].join('、')})):result.rows.map(r=>({...r,status:r.gap||[r.incomeStatus&&'收入：'+r.incomeStatus,r.costStatus&&'成本：'+r.costStatus].filter(Boolean).join('；')}));
  if(q.status)rows=rows.filter(r=>r.status.includes(q.status));
  const identity=r=>JSON.stringify([r.source,r.entity,r.id]);
  const selected=q.view==='flows'?new Set(rows.map(identity)):new Set(rows.map(r=>r.record));
  if(q.view==='flows')records=records.filter(r=>selected.has(identity(r)));
  const parts=[];
  for(const r of records){for(const a of r.allocations){if(q.view==='completion'&&!selected.has(a.target))continue;const c=completions.get(a.target);parts.push({...a,confirmation:r.id,source:r.source,kindLabel:rf.kinds[r.kind],entity:r.entity,book:r.book,currency:r.currency,basis:r.basis,period:r.period,order:c?.order||'',target:a.target,actual:c?.actual||'',amount:r.valid?a.amount:null,status:r.valid?(c?'有效分配':'完成记录未匹配'):r.gaps.join('；')});}
   if(q.view==='flows'&&r.valid){const remaining=Math.round((r.amount-rf.sum(r.allocations))*100)/100;if(remaining||!r.allocations.length)parts.push({confirmation:r.id,source:r.source,kindLabel:rf.kinds[r.kind],entity:r.entity,book:r.book,currency:r.currency,basis:r.basis,period:r.period,order:'尚未分配',target:'',amount:remaining,status:'未分配余额'});}
  }
  return {rows,columns:columns[q.view],title:q.view==='flows'?'确认记录':'完成业务对照',pending:false,sections:[{key:'composition',title:q.view==='flows'?'确认金额组成':'业务与确认组成',rows:parts,columns:['confirmation','kindLabel','entity','book','currency','basis','period','order','target','amount','status']}],notice:q.view==='flows'?'一笔收入或成本确认一行，关联订单仅选确认记录，主表及组成保留该确认完整金额；无效确认金额未知，未分配单列。':'按实际完成范围累计核对截至资料日的业务结算与会计确认，不受隐藏会计期间截断。业务结算不等同财务收入，不将收入减成本当结算差额；部分确认明确标识，口径不同不强行比较。'};
 }
 return {query,columns};
});
