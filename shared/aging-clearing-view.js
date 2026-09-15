(function(){
 const parent=document.querySelector('#finance-cashflow[data-report="balances"]'),base=window.CaesarBalances,m=window.CaesarAgingClearing;if(!parent||!m)return;
 const choices=(key,title)=>[['',title],...[...new Set(base.fixture().documents.map(d=>d[key]).filter(Boolean))].map(v=>[v,v])];
 const labels={party:'往来单位',company:'核算公司',currency:'原币',outstanding:'正向余额',balance:'账面余额',b0:'0–30天',b1:'31–60天',b2:'61–90天',b3:'91–180天',b4:'181天及以上',reverse:'反向余额',coverage:'资料情况',ledger:'账簿',scope:'往来性质',id:'单据号',confirmedAt:'确认日期',ageDays:'账龄天数',issue:'资料缺口',partyId:'往来单位编号',count:'单据数',relation:'内部清算号',clearingType:'清算类型',arCompany:'应收方公司',apCompany:'应付方公司',arBalance:'应收方余额',apBalance:'应付方余额',difference:'双方差额',pairStatus:'双方核对',arLedger:'应收方账簿',apLedger:'应付方账簿',directionLabel:'往来方向',peerCompany:'对方公司'};
 for(const view of ['aging','clearing']){
  const aging=view==='aging',host=document.createElement('section');host.id=aging?'finance-balances':'finance-clearing-summary';host.className='counterparty-balance';parent.append(host);
  window.CaesarReadonlyReport.mount(host,{title:aging?'账龄分析':'内部清算',defaults:{...base.defaults(),view},views:{[view]:aging?'账龄分析':'内部清算'},query:m[view],explorer:true,clearOnError:true,labels,
   money:['outstanding','balance','b0','b1','b2','b3','b4','reverse','arBalance','apBalance','difference'],columns:()=>aging?m.agingColumns:m.clearingColumns,extras:aging?['scope','partyId']:[],
   filters:[{key:'asOf',label:'余额截止日',type:'date'},{key:'cutoff',label:'资料截止时间',type:'datetime-local'},{key:'company',label:'核算公司',options:choices('company','全部核算公司')},{key:'currency',label:'原币',options:choices('currency','全部原币（分列）')},
    ...(aging?[{key:'direction',label:'往来方向',options:[['ar','应收账龄'],['ap','应付账龄']]}]:[]),
    {key:'party',label:'往来单位名称/编号',more:true},{key:'order',label:'订单号',more:true},{key:'ledger',label:'账簿',options:choices('ledger','全部账簿'),more:true},
    ...Object.entries({customerType:'客户类型',channel:'渠道',salesCompany:'销售公司',productCompany:'产品公司',department:'部门/事业部',store:'门店',center:'呼叫中心',scope:'往来性质'}).map(([key,label])=>({key,label,options:choices(key,'全部'+label),more:true,visible:()=>aging})),
    ...Object.entries({dueStart:'到期日期自',dueEnd:'到期日期至',confirmedStart:'确认日期自',confirmedEnd:'确认日期至'}).map(([key,label])=>({key,label,type:'date',more:true}))],
   onRender:host=>{host.querySelector('[data-fr-export-all]').hidden=true;const select=host.querySelector('[data-fr-content]');select.setAttribute('aria-label','统计层级');if(select.parentElement.firstChild.nodeType===3)select.parentElement.firstChild.textContent='统计层级 ';},
   definition:aging?'同截止、公司、账簿、原币及往来方向查看账龄分布和来源单据；按应收应付确认日计龄，不按到期日计逾期。正向余额分段，反向单列，缺资料不补零。分段为原型约定，正式政策待确认。':'按同一余额和资料截止核对内部应收方与应付方余额；同一双方关系仅显示一次，不把双方余额相加。筛选选中任意一方后保留已对应双方。缺对方不填零；代收代付不等于内部购销或银行调拨，也不代表集团抵销。正式完整清算来源仍待接入。'});
 }
})();
