(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./finance-funds-model.js'));else root.CaesarFundAccountAnalysis=factory(root.CaesarFunds);})(typeof globalThis==='object'?globalThis:this,function(base){
 const columns={accounts:['name','number','company','currency','closing','restricted','available','coverage'],movements:['id','date','name','company','currency','nature','incoming','outgoing','balance','party','peerStatus']};
 function query(input={},data){const q={...base.defaults,...input};if(!['accounts','movements'].includes(q.view))throw Error('请选择账户余额或账户收支');
 const source=base.query({...q,dataset:q.dataset==='pending'?'pending':'gaps',...(q.view==='accounts'?{nature:'',keyword:''}:{})},data);
 if(source.pending)return {...source,title:base.views[q.view],columns:columns[q.view],sections:[]};
 let rows;
 if(q.view==='accounts')rows=source.accounts.map(a=>({...a,restricted:a.closing==null?null:a.restricted,bankBalance:null,bankDifference:null}));
 else {const balances=new Map(),accounts=new Map(source.accounts.map(a=>[a.account,a]));
  const flows=source.sections.find(s=>s.key==='flows').rows;for(const a of source.accounts){let balance=a.opening;for(const r of flows.filter(r=>r.account===a.account).sort((a,b)=>a.date.localeCompare(b.date))){balance=a.closing==null?null:Math.round((balance+r.incoming-r.outgoing)*100)/100;balances.set(r.id,balance);}}
  rows=source.rows.map(r=>({...r,balance:balances.get(r.id)??null,coverage:accounts.get(r.account)?.coverage||'余额资料不足'}));
 }
 return {rows,title:base.views[q.view],columns:columns[q.view],sections:[],pending:false,notice:source.notice+'；仅实际资金账户，预收责任台账不作银行资金。'+(q.view==='accounts'?'同截止看余额、受限及可用；银行对账单余额未提供，不推银行差额。':'每笔已确认实际流水一行，内部调拨和平台提现保留两端性质，不当对外新增资金。变动后余额按同账户完整期间记录计算，不因流水搜索重算；同日沿来源顺序，非银行精确日内序列。')};
 }
 return {query,columns};
});
