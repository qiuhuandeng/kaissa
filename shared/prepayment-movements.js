(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./finance-prepayments-model.js'));else root.CaesarPrepaymentMovements=factory(root.CaesarPrepayments);})(typeof globalThis==='object'?globalThis:this,function(base){
 const sign={increase:1,use:-1,offset:-1,refund:-1,transferIn:1,transferOut:-1,loss:-1},round=n=>Math.round(n*100)/100;
 const columns=['accountId','date','kindName','amount','balanceChange','frozenChange','balance','frozen','available','inclusion','party','company','currency','direction'];
 function query(input={},data){const q={...base.defaults,...input,view:input.category||'advance',risk:''};if(!Object.hasOwn(base.views,q.view))throw Error('请选择款项类别');
  const result=base.query(q,data);if(result.pending)return {...result,title:'款项变动明细',columns,sections:[]};
  const events=result.sections.find(s=>s.key==='events').rows,rows=[];
  for(const a of result.rows){const list=events.filter(e=>base.key({...e,id:e.accountId})===base.key(a));let balance=a.opening,frozen=a.openingFrozen;const valid=a.closing!==null;
   for(const e of list)if(e.inclusion==='纳入'&&e.date<q.start)frozen=round(frozen+(e.kind==='freeze'?e.amount:e.kind==='unfreeze'?-e.amount:0));
   const common={accountId:a.id,party:a.party,company:a.company,currency:a.currency,direction:a.direction,ledger:a.ledger};
   const snapshot=()=>({balance:valid?balance:null,frozen:valid?frozen:null,available:valid?round(balance-frozen):null});
   rows.push({...common,date:q.start,kindName:'期初余额',amount:null,balanceChange:0,frozenChange:0,...snapshot(),inclusion:valid?'期间开始前余额':'余额资料不足',id:'',reference:a.proof,proof:a.proof});
   for(const e of list){if(/^\d{4}-\d{2}-\d{2}$/.test(e.date)&&(e.date<q.start||e.date>q.end))continue;
    const included=e.inclusion==='纳入',invalid=!included&&!/不纳入|不重计/.test(e.inclusion),change=included?round((sign[e.kind]||0)*e.amount):invalid?null:0,freeze=included?(e.kind==='freeze'?e.amount:e.kind==='unfreeze'?-e.amount:0):invalid?null:0;
    if(included){balance=round(balance+change);frozen=round(frozen+freeze);}
    rows.push({...common,id:e.id,date:e.date,kindName:e.kindName,amount:e.amount,balanceChange:change,frozenChange:freeze,...snapshot(),inclusion:e.inclusion,reference:e.reference,proof:e.proof});
   }
   rows.push({...common,date:q.end,kindName:'期末余额',amount:null,balanceChange:0,frozenChange:0,balance:a.closing,frozen:a.frozen,available:a.available,inclusion:valid?'截至期末':'余额资料不足',id:'',reference:a.proof,proof:a.proof});
  }
  return {rows,title:'款项变动明细',columns,sections:[],pending:false,notice:result.notice+'；按账户列期初、期间记录及期末。记录金额不是现金发生；账面增减和冻结增减分别列示。分摊、应退确认不改变账面；申请、重复不纳入。存在历史缺口时过程余额不推算。期初/期末不作为期间发生合计，原币和方向不混加。'};
 }
 return {query,columns};
});
