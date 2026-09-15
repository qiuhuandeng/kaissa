(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./finance-invoice-report-model.js'));else root.CaesarInvoiceRegisters=factory(root.CaesarInvoiceReport);})(typeof globalThis==='object'?globalThis:this,function(base){
 'use strict';
 const defaults={...base.defaults,view:'documents',side:'',kind:'',status:''};
 const columns={documents:['id','sideLabel','company','currency','party','amount','allocated','unallocated','issuedAt','receivedAt','recorded','status'],allocations:['id','documentId','kindLabel','sideLabel','company','currency','party','scope','amount','date','status'],corrections:['id','sideLabel','company','currency','original','red','replacement','date','amount','reason','status']};
 const dateOK=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
 const effective=d=>d.kind==='cash'?d.cashAt:d.side==='sale'?d.issuedAt:d.receivedAt;
 const scopeKey=s=>JSON.stringify([s.company,s.currency,s.side,s.id]);
 function query(input={},data=base.fixture()){
  const q={...defaults,...input};if(!columns[q.view]||!['','sale','purchase'].includes(q.side)||!['','invoice','cash'].includes(q.kind))throw Error('请选择有效票款主题');
  const scopes=new Map(),badScopes=new Set();for(const s of data.scopes){const k=scopeKey(s);if(scopes.has(k)&&JSON.stringify(scopes.get(k))!==JSON.stringify(s))badScopes.add(k);else scopes.set(k,s);}
  const clean={...data,scopes:[...scopes.values()].map(s=>badScopes.has(scopeKey(s))?{...s,proof:''}:s)};
  const results=['received','paid'].map(view=>base.query({...q,view,dataset:q.dataset==='pending'?'pending':'gaps',company:'',currency:'',party:'',keyword:'',status:'',dateBasis:'all'},clean));
  if(results.some(r=>r.pending))return {rows:[],sections:[],pending:true,columns:columns[q.view],notice:results[0].notice};
  const docs=new Map(),validAllocations=new Map();
  for(const result of results){for(const section of result.sections){if(['documents','unallocated','issues'].includes(section.key))for(const d of section.rows){const key=base.docKey(d),old=docs.get(key)||{};docs.set(key,{...old,...d,...(section.key==='issues'?{coverage:'来源待核对',allocated:null,unallocated:null}:{})});}if(section.key==='allocations')for(const a of section.rows)validAllocations.set(a.id,a);}}
  // Preserve zero-value original records even when they have no assigned business document.
  for(const d of data.documents)if(d.amount===0&&d.confirmed&&dateOK(effective(d))&&effective(d)<=q.asOf&&dateOK(d.recorded)&&d.recorded<=q.cutoff&&!docs.has(base.docKey(d)))docs.set(base.docKey(d),{...d,allocated:0,unallocated:0,coverage:'已确认'});
  const rawByKey=new Map(data.documents.map(d=>[base.docKey(d),d]));
  const name=d=>{const matches=[...scopes.values()].filter(s=>s.company===d.company&&s.currency===d.currency&&s.side===d.side&&s.partyId===d.partyId);return [...new Set(matches.map(s=>s.party))].join('、')||d.party||d.partyId||'身份待核对';};
  const enrich=d=>({...d,party:name(d),sideLabel:d.side==='sale'?'销售':d.side==='purchase'?'采购':'待核对',kindLabel:d.kind==='invoice'?'发票':d.kind==='cash'?'实际收付':'待核对'});
  const match=r=>(!q.company||r.company===q.company)&&(!q.currency||r.currency===q.currency)&&(!q.side||r.side===q.side)&&(!q.party||[r.party,r.partyId].join(' ').includes(q.party))&&(!q.keyword||[r.id,r.documentId,r.scope,r.original,r.red,r.replacement].join(' ').includes(q.keyword))&&(!q.status||r.status===q.status);
  const selectedDate=r=>q.dateBasis==='all'||dateOK(r[q.dateBasis])&&r[q.dateBasis]>=q.start&&r[q.dateBasis]<=q.end;
  let rows=[];
  if(q.view==='documents')rows=[...docs.values()].filter(d=>d.kind==='invoice').map(d=>({...enrich(d),status:d.coverage==='来源待核对'||d.allocated==null?'资料待核对':d.unallocated!==0?'未分配完':'已分配完',sourceAmount:d.amount,amount:d.coverage==='来源待核对'?null:d.amount,certifiedAt:d.certifiedAt||'',original:rawByKey.get(d.original)?.id||d.original||'',replacementFor:rawByKey.get(d.replacementFor)?.id||d.replacementFor||''})).filter(selectedDate);
  if(q.view==='allocations'){
   const seen=new Map(),conflicts=new Set();for(const a of data.allocations){if(!a.confirmed||dateOK(a.date)&&a.date>q.asOf||dateOK(a.recorded)&&a.recorded>q.cutoff)continue;if(seen.has(a.id)&&JSON.stringify(seen.get(a.id))!==JSON.stringify(a))conflicts.add(a.id);else seen.set(a.id,a);}
   for(const a of seen.values()){
    const doc=docs.get(a.document),raw=rawByKey.get(a.document);
    if(!doc&&raw&&(raw.confirmed===false||dateOK(effective(raw))&&effective(raw)>q.asOf||dateOK(raw.recorded)&&raw.recorded>q.cutoff))continue;
    const d=doc||raw||{company:a.company||'',currency:a.currency||'',partyId:a.partyId||'',side:a.side||'',kind:a.kind||'',id:'原票/款缺失'};
    const valid=doc&&validAllocations.has(a.id)&&!conflicts.has(a.id)&&!badScopes.has(scopeKey({...d,id:a.scope}))&&Boolean(scopes.get(scopeKey({...d,id:a.scope}))?.proof);
    rows.push({...enrich(d),...a,documentId:d.id,amount:valid?a.amount:null,status:valid?'有效分配':'资料待核对',sourceAmount:a.amount,issue:valid?'':conflicts.has(a.id)?'同号分配冲突':!doc?'原票原款缺失':'原票、业务归属或分配依据待核对'});
   }
   for(const d of docs.values())if(d.unallocated!==0)rows.push({...enrich(d),id:'未分配余额',documentId:d.id,scope:'尚未分配',amount:d.unallocated,date:effective(d),sourceAmount:d.amount,status:d.unallocated==null?'资料待核对':'待分配余额',issue:d.unallocated==null?'原票原款未能确认可分配余额':'尚未对应订单/应付'});
   rows=rows.filter(r=>(!q.kind||r.kind===q.kind)&&selectedDate(r));
  }
  if(q.view==='corrections'){
   const invoices=[...docs.values()].filter(d=>d.kind==='invoice');
   for(const d of invoices.filter(d=>d.amount<0||d.replacementFor)){
    const raw=rawByKey.get(base.docKey(d))||d,original=rawByKey.get(raw.original||raw.replacementFor);
    const corrections=data.corrections.filter(c=>c.original===original?.id&&c.date<=q.asOf&&(!c.recorded||c.recorded<=q.cutoff)&&(!c.company||c.company===d.company)&&(!c.currency||c.currency===d.currency));
    const uniqueOriginal=invoices.filter(i=>i.id===original?.id).length===1;
    const c=corrections.length===1&&(corrections[0].company||uniqueOriginal)?corrections[0]:null;
    rows.push({...enrich(d),id:d.id,original:original?.id||'原票待核对',red:d.amount<0?d.id:'',replacement:raw.replacementFor?d.id:'',date:effective(d),reason:d.reason||c?.reason||'原因待补',treatment:c?.treatment||'会计影响待确认',status:d.coverage==='来源待核对'||!original?'资料待核对':d.amount<0?'红冲记录':'重开记录'});
   }
  }
  if(q.view==='corrections')for(const c of data.corrections){if(!dateOK(c.date)||c.date>q.asOf||c.recorded&&c.recorded>q.cutoff)continue;const linked=[...docs.values()].filter(d=>d.kind==='invoice'&&[c.original,c.replacement].includes(d.id)&&(!c.company||d.company===c.company)&&(!c.currency||d.currency===c.currency));if(rows.some(r=>r.replacement===c.replacement&&linked.some(d=>d.company===r.company&&d.currency===r.currency)))continue;const d=linked.length===1?linked[0]:{company:c.company||'',currency:c.currency||'',side:c.side||'',partyId:c.partyId||''};rows.push({...enrich(d),...c,amount:null,red:'',status:'资料待核对',treatment:'更正关联或会计影响待核对'});}
  rows=rows.filter(r=>match(r)&&(q.view!=='corrections'||selectedDate(r)));
  return {rows,columns:columns[q.view],sections:[],pending:false,notice:'原票一票一行；分配一笔一行，待分配余额明确标识，不作有效分配；红冲与重开分别按有效日期保留，不自动确认收入成本。全部为独立算例，正式来源与财务政策待确认。'};
 }
 return {query,defaults,columns};
});
