(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./finance-balances-model.js'));else root.CaesarBalanceMovementOverdue=factory(root.CaesarBalances);})(typeof globalThis==='object'?globalThis:this,function(base){
 const known=v=>typeof v==='number'&&Number.isFinite(v),sum=vs=>vs.every(known)?base.sum(vs):null;
 const identity=r=>JSON.stringify([r.company,r.ledger,r.currency,r.type,r.scope,r.partyId||r.docKey]);
 const movementColumns=['party','company','currency','opening','increase','adjustments','cash','offset','relief','closing','coverage','ledger'];
 const overdueColumns=['party','company','currency','outstanding','overdue','notDue','dueToday','missingDue','reverse','coverage','ledger'];
 function group(details,fields){const groups=new Map();details.forEach(d=>{const key=identity(d);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(d);});return [...groups.values()].map(ds=>({party:[...new Set(ds.map(d=>d.party))].join(' / '),company:ds[0].company,currency:ds[0].currency,ledger:ds[0].ledger,scope:ds[0].scope,partyId:ds[0].partyId,...Object.fromEntries(fields.map(k=>[k,sum(ds.map(d=>d[k]))])),coverage:ds.some(d=>d.coverage!=='资料齐全')?'存在资料缺口，未知金额不补零':'资料齐全'}));}
 function movement(input={},data){
  const q={...base.defaults(),start:'2026-09-01',...input,view:input.direction||'ar',status:'',dueStart:'',dueEnd:'',confirmedStart:'',confirmedEnd:''};
  if(!base.dateOK(q.start)||q.start>q.asOf)throw Error('请核对变动开始日与结束日');
  const previous=new Date(Date.parse(q.start)-86400000).toISOString().slice(0,10),end=base.query(q,data),begin=base.query({...q,asOf:previous},data);
  if(end.pending||begin.pending)return {rows:[],sections:[],columns:movementColumns,title:'往来期间变动',pending:true,notice:'期初或期末超出资料覆盖，无法核对期间变动'};
  const starts=new Map(begin.details.map(d=>[d.docKey,d])),ends=new Map(end.details.map(d=>[d.docKey,d])),fields=['opening','increase','adjustments','cash','offset','relief','closing'];
  const details=[...new Set([...starts.keys(),...ends.keys()])].map(key=>{const a=starts.get(key),b=ends.get(key),r=b||a,newDoc=!a&&b&&base.dateOK(b.confirmedAt)&&b.confirmedAt>=q.start;
   const valid=b&&known(b.balance)&&(a?known(a.balance):newDoc),values=valid?{opening:a?a.balance:0,increase:newDoc?b.originalAmount:0,adjustments:base.sum([b.adjustments,-(a?.adjustments||0)]),cash:base.sum([b.cash,-(a?.cash||0)]),offset:base.sum([b.offset,-(a?.offset||0)]),relief:base.sum([b.relief,-(a?.relief||0)]),closing:b.balance}:Object.fromEntries(fields.map(k=>[k,null]));
   return {...r,...values,coverage:valid?'资料齐全':'期初或期末资料不足'};
  });
  return {rows:group(details,fields),columns:movementColumns,title:'往来期间变动',pending:false,sections:[{key:'documents',title:'同期间单据变动',columns:['id',...movementColumns],rows:details}],notice:end.notice+'；期间 '+q.start+' 至 '+q.asOf+'，期初为'+previous+'；期初和期末使用同一资料截止。期末=期初+新增确认+有效调整-收付核销-预款冲抵-减免核销；负核销为冲回。核销发生不是现金发生；内部资金清算另查。'};
 }
 function overdue(input={},data){
  const q={...base.defaults(),...input,view:'aging',ageBasis:'overdue',group:'party',status:''},source=base.query(q,data);
  if(source.pending)return {...source,columns:overdueColumns,title:'往来逾期分析',sections:[]};
  const details=source.details.map(d=>{const valid=known(d.balance),positive=valid?Math.max(0,d.balance):null,dated=base.dateOK(d.due);return {...d,outstanding:positive,notDue:valid?(positive>0&&dated&&d.due>q.asOf?positive:0):null,dueToday:valid?(positive>0&&dated&&d.due===q.asOf?positive:0):null,missingDue:valid?(positive>0&&!dated?positive:0):null,reverse:valid?Math.min(0,d.balance):null,coverage:!valid?'余额资料不足':positive>0&&!dated?'到期日未提供':'资料齐全'};});
  return {rows:group(details,['outstanding','overdue','notDue','dueToday','missingDue','reverse']),columns:overdueColumns,title:'往来逾期分析',pending:false,sections:[{key:'documents',title:'同截止逾期单据',columns:['id','party','company','currency','balance','due','overdueDays','overdue','status','ledger'],rows:details}],notice:source.notice+'；按有效到期日次日起计算逾期，到期当日及未到期分别显示；缺到期日的余额单列，逾期总额未确定，不认定正常。反向余额不抵正向；展期按批准生效日还原，账龄另查。'};
 }
 return {movement,overdue,movementColumns,overdueColumns};
});
