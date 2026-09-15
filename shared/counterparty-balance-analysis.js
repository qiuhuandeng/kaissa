(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./finance-balances-model.js'));
 else root.CaesarCounterpartyBalance=factory(root.CaesarBalances);
})(typeof globalThis==='object'?globalThis:this,function(base){
 'use strict';
 const known=v=>typeof v==='number'&&Number.isFinite(v);
 const sum=vs=>vs.every(known)?base.sum(vs):null;
 const identity=r=>JSON.stringify([r.company,r.ledger,r.currency,r.type,r.scope,r.partyId||r.docKey]);
 const columns=['party','company','currency','outstanding','overdue','reverse','net','settled','ledger','scope','count','coverage'];
 const detailColumns=['id','party','company','currency','outstanding','due','overdue','status','net','settled','reverse','order','business','ledger'];
 function query(input={},data){
  const q={...base.defaults(),...input};
  if(!['ar','ap'].includes(q.view))throw Error('请选择应收余额或应付余额');
  const source=base.query({...q,status:'',party:''},data);
  const title=q.view==='ap'?'供应商应付汇总':'客户/渠道应收汇总';
  if(source.pending)return {...source,title,columns,sections:[]};
  const groups=new Map();
  const details=source.details.map(r=>({...r,outstanding:known(r.balance)?Math.max(0,r.balance):null,reverse:known(r.balance)?Math.min(0,r.balance):null,
   coverage:r.issue||(r.overdue==null?'到期资料不足':'余额资料齐全')}));
  details.forEach(r=>{const key=identity(r);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);});
  let rows=[...groups].map(([key,rs])=>{
   const missing=rs.filter(r=>!known(r.balance)).length,missingDue=rs.filter(r=>known(r.balance)&&r.balance>0&&!known(r.overdue)).length;
   return {key,company:rs[0].company,ledger:rs[0].ledger,currency:rs[0].currency,scope:rs[0].scope,partyId:rs[0].partyId,
    party:[...new Set(rs.map(r=>r.party))].join(' / '),count:rs.length,
    ...Object.fromEntries(['net','settled','balance','outstanding','reverse','overdue','cash','offset','relief'].map(k=>[k,sum(rs.map(r=>r[k]))])),
    coverage:missing?`余额资料缺${missing}笔，汇总金额未确定`:missingDue?`余额齐全；到期日缺${missingDue}笔，逾期未确定`:'余额及到期资料齐全',
    statuses:new Set(rs.map(r=>r.status))};
  });
  if(q.party){const term=q.party.toLowerCase();rows=rows.filter(r=>(r.party+' '+(r.partyId||'')).toLowerCase().includes(term));}
  if(q.status)rows=rows.filter(r=>r.statuses.has(q.status));
  const keys=new Set(rows.map(r=>r.key));
  return {rows,title,columns,pending:false,sections:[{key:'documents',title:q.view==='ap'?'同范围应付单':'同范围应收单',columns:detailColumns,rows:details.filter(r=>keys.has(identity(r)))}],
   notice:source.notice+'；仅当前条件范围；原确认加有效调整，减已核销，得到账面余额。已核销含收付核销、预款冲抵及批准减免，不等于实收实付。待收/待付仅正向余额，反向余额单列。名称及余额情况筛选保留匹配往来单位的同范围全部单据；缺金额不补零。内部资金清算归内部清算，汇总不代表集团抵销。'};
 }
 return {query,columns,detailColumns,identity};
});
