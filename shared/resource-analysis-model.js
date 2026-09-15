(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./resource-cost-report-model.js'));
 else root.CaesarResourceAnalysis=factory(root.CaesarResourceCost);
})(typeof window==='object'?window:globalThis,function(base){
 const known=v=>typeof v==='number'&&Number.isFinite(v);
 const columns={costs:['batch','company','product','currency','purchase','allocated','unallocated','pendingAllocation','status'],
 resources:['batch','company','product','unit','unused','returnable','nonRefundableUnsold','currency','confirmedLoss','pendingLoss','quantityStatus']};
 function query(input,supplied){
  const q={...base.defaults,...input,tour:''};
  if(!['costs','resources'].includes(q.view))throw Error('请选择成本分配或资源风险');
  const r=base.query(q,supplied);
  const title=q.view==='costs'?'批次分配汇总':'资源风险';
  if(r.pending)return {...r,title,columns:columns[q.view],sections:[]};
  const data=supplied||base.fixture();
  const ambiguous=new Set(data.batches.filter(b=>new Set(data.batches.filter(other=>other.batch===b.batch).map(other=>other.company)).size>1).map(b=>b.batch));
  const details=r.sections.find(s=>s.key==='allocations').rows.filter(a=>!ambiguous.has(a.batch));
  const batches=r.sections.find(s=>s.key==='batches').rows.map(b=>{
    const rows=details.filter(a=>a.batch===b.batch);
    const pending=rows.filter(a=>!a.confirmed);
    return {...b,
      ...(b.conflict?{purchase:null,committed:null,sold:null,used:null,returnable:null,nonRefundableUnsold:null,confirmedLoss:null,pendingLoss:null,quantityStatus:'批次资料冲突'}:{}),
      pendingAllocation:!ambiguous.has(b.batch)&&!b.conflict&&pending.every(a=>known(a.pendingCost)&&a.pendingCost>=0&&!a.conflict)?pending.reduce((n,a)=>n+a.pendingCost,0):null,
      unused:!b.conflict&&b.quantityStatus==='数量范围齐全'?b.committed-b.used:null,
      unusedFunds:known(b.unusedFunds)?b.unusedFunds:null,
      releaseBy:b.releaseBy||null,
      riskCoverage:known(b.unusedFunds)&&b.releaseBy?'占用及期限资料已提供':'未使用资源占用资金或释放期限未提供'};
  });
  return {title,columns:columns[q.view],rows:batches,sections:q.view==='costs'?[{key:'allocations',title:'同批次分配记录',rows:details,columns:['id','batch','company','tour','type','unit','quantity','currency','confirmedCost','pendingCost','status']}]:[],
    notice:'独立算例状态截至2026-09-30；日期筛选仅指采购批次确认日期，不提供任意历史状态。确认采购额=已确认分配+尚未确认分配；待确认记录可能包含于尚未确认分配，不重复加总。确认损耗可能已含在分配成本中，不再次扣减。未使用数量不等于可售库存；不以整批已付金额或预估成本推算未使用资源占用资金、待确认损耗。'};
 }
 return {query,columns};
});
