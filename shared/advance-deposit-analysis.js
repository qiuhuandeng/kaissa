(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./finance-prepayments-model.js'));else root.CaesarAdvanceDeposit=factory(root.CaesarPrepayments);})(typeof globalThis==='object'?globalThis:this,function(base){
 const known=v=>typeof v==='number'&&Number.isFinite(v),sum=vs=>vs.every(known)?Math.round(vs.reduce((a,b)=>a+b,0)*100)/100:null;
 const columns={advance:['party','company','currency','closing','frozen','available','refundDue','count','coverage','ledger'],deposit:['id','party','company','currency','closing','frozen','available','refundDue','coverage','ledger']};
 function query(input={},data){
  const q={...base.defaults,...input,direction:'收取'};if(!['advance','deposit'].includes(q.view))throw Error('请选择预收款或预存款');
  const result=base.query({...q,risk:'',party:''},data),title=q.view==='advance'?'客户预收汇总':'预存账户余额';
  if(result.pending)return {...result,title,columns:columns[q.view],sections:[]};
  let details=result.rows.map(r=>({...r,coverage:r.closing==null?'余额资料不足':r.frozen>0?'部分金额冻结':'余额资料齐全'}));
  const identity=r=>JSON.stringify([r.company,r.ledger,r.currency,r.partyId||r.id]);
  if(q.party){const term=q.party.toLowerCase(),keys=new Set(details.filter(r=>(r.party+' '+r.partyId).toLowerCase().includes(term)).map(identity));details=details.filter(r=>keys.has(identity(r)));}
  if(q.view==='deposit')return {rows:details,title,columns:columns.deposit,sections:[],pending:false,notice:result.notice+'；预存账户独立列示，冻结不扣账面，只减少账面可用。可用不代表已批准退款；流水归款项变动。'};
  const groups=new Map();details.forEach(d=>{const key=identity(d);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(d);});
  const rows=[...groups.values()].map(rs=>({...rs[0],party:[...new Set(rs.map(r=>r.party))].join(' / '),count:rs.length,proof:[...new Set(rs.map(r=>r.proof))].join('；'),...Object.fromEntries(['closing','frozen','available','refundDue'].map(k=>[k,sum(rs.map(r=>r[k]))])),coverage:rs.some(r=>r.closing==null)?'含余额缺数，汇总未确定':'余额资料齐全'}));
  return {rows,title,columns:columns.advance,sections:[{key:'items',title:'同截止预收款项',columns:['id',...columns.advance.filter(k=>k!=='count')],rows:details}],pending:false,notice:result.notice+'；预收余额不是收入，同客户、公司、账簿及原币汇总；仅同截止款项组成切换，缺数不补零。冻结只影响可用；可用不代表可退，待退仅已确认应退余额。'};
 }
 return {query,columns};
});
