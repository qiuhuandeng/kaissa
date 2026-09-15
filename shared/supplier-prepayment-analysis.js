(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./finance-prepayments-model.js'));
 else root.CaesarSupplierPrepayment=factory(root.CaesarPrepayments);
})(typeof window==='object'?window:globalThis,function(base){
 const known=v=>typeof v==='number'&&Number.isFinite(v),sum=xs=>xs.every(known)?Math.round(xs.reduce((n,v)=>n+v,0)*100)/100:null;
 const identity=r=>JSON.stringify([r.company,r.ledger,r.currency,r.partyId||('未确认:'+r.id)]);
 const columns=['party','company','ledger','currency','accounts','closing','unperformed','overdueReturn','longHeld','frozen','available','risk'];
 function query(input,supplied){
  const q={...base.defaults,...input,view:'prepay',direction:'支付'};
  const source=base.query({...q,risk:'',keyword:'',party:''},supplied);
  if(source.pending)return {...source,title:'供应商预付汇总',columns,sections:[]};
  const groups=new Map();
  source.rows.forEach(r=>{const key=identity(r);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);});
  let rows=[...groups.entries()].map(([key,rs])=>{
   const unknown=rs.filter(r=>!known(r.closing)).length;
   const amount=k=>sum(rs.map(r=>r[k]));
   const closing=amount('closing'),longHeld=sum(rs.map(r=>known(r.closing)&&r.days!=null?(r.days>=+q.threshold?r.closing:0):r.closing===0?0:null));
   const overdueReturn=amount('overdueReturn');
   return {key,party:[...new Set(rs.map(r=>r.party))].join(' / '),partyId:rs[0].partyId,company:rs[0].company,ledger:rs[0].ledger,currency:rs[0].currency,accounts:rs.length,
    closing,knownClosing:Math.round(rs.filter(r=>known(r.closing)).reduce((n,r)=>n+r.closing,0)*100)/100,
    unperformed:sum(rs.map(r=>r.closing===0?0:r.unperformed)),overdueReturn,longHeld,frozen:amount('frozen'),available:amount('available'),refundDue:amount('refundDue'),
    missing:unknown,risk:unknown?'资料不足':overdueReturn>0?'应退未退':longHeld>0?'长期未结':closing===0?'已结清':'正常持有',
    coverage:unknown?unknown+'个账户余额缺资料，供应商总额未确定':'账户余额齐全；未履约/应退金额另按资料完整性列示'};
  });
  if(q.party){const term=q.party.toLowerCase();rows=rows.filter(r=>(r.party+' '+r.partyId).toLowerCase().includes(term));}
  if(q.risk)rows=rows.filter(r=>q.risk==='长期未结'?r.longHeld>0:r.risk===q.risk);
  const selected=new Set(rows.map(r=>r.key)),details=source.rows.filter(r=>selected.has(identity(r)));
  return {rows,title:'供应商预付汇总',columns,pending:false,sections:[{key:'accounts',title:'同范围预付账户',rows:details,columns:['id','party','company','ledger','currency','closing','unperformed','overdueReturn','frozen','available','risk']}],
   notice:source.notice+'；按供应商身份、公司、账簿与原币分别汇总。风险筛选保留所选供应商完整账户范围；冻结只影响可用，不再扣账面，团期分摊不扣余额。未履约与应退可能重合，不与余额相加。长期阈值仅分析条件，非批准政策；账面可用不代表可退回。'};
 }
 return {query,columns,identity};
});
