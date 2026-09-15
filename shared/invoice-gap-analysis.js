(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./finance-invoice-report-model.js'));else root.CaesarInvoiceGapAnalysis=factory(root.CaesarInvoiceReport);})(typeof globalThis==='object'?globalThis:this,function(base){
 'use strict';
 const columns=['id','party','company','currency','cash','invoiced','gap','due','status'];
 const identity=s=>JSON.stringify([s.company,s.currency,s.side,s.id]);
 function query(input={},data=base.fixture()){
  const q={...base.defaults,...input},seen=new Map(),conflicts=new Set();
  for(const s of data.scopes){const k=identity(s);if(seen.has(k)&&JSON.stringify(seen.get(k))!==JSON.stringify(s))conflicts.add(k);else seen.set(k,s);}
  const clean={...data,scopes:[...seen.values()].map(s=>conflicts.has(identity(s))?{...s,proof:''}:s)};
  const source=base.query({...q,dataset:q.dataset==='pending'?'pending':'gaps'},clean);
  if(source.pending)return {...source,title:base.views[q.view],columns,sections:[]};
  const rows=source.rows.filter(r=>r.gap==null||r.gap>0).map(r=>({...r,coverage:r.gap==null?'票款或分配资料待核对':'按同订单/应付有效分配核对'}));
  const selected=new Set(rows.map(identity));
  const allocations=source.sections.find(s=>s.key==='allocations').rows.filter(a=>selected.has(identity({...a,id:a.scope}))).map(a=>({...a,scope:a.scope,original:data.documents.find(d=>base.docKey(d)===a.original)?.id||'',coverage:'对应本页差额对象的有效分配'}));
  return {rows,title:['received','issued'].includes(q.view)?'订单票款差额':'应付票款差额',columns,sections:[{key:'composition',title:'票款组成',rows:allocations,columns:['scope','documentId','kindLabel','company','currency','amount','date','original','proof']}],pending:false,
   notice:'同公司、原币和客户/供应商按订单或应付核对；仅列本方向正差额及资料待核对。票款组成只列同批对象的有效分配，原票总额不重复复制。未分配原款/票及独立红冲更正另属专题，本页不能证明全部原款票已匹配。'};
 }
 return {query,columns};
});
