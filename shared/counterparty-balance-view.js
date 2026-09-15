(function(){
 const parent=document.querySelector('#finance-cashflow[data-report="balances"]'),base=window.CaesarBalances,m=window.CaesarCounterpartyBalance;
 if(!parent||!m)return;
 const sample=base.fixture(),choices=(key,title)=>[['',title],...[...new Set(sample.documents.filter(d=>d.scope!=='内部资金清算').map(d=>d[key]).filter(Boolean))].map(v=>[v,v])];
 for(const view of ['ar','ap']){
  const ap=view==='ap',host=document.createElement('section');host.id='finance-'+view+'-summary';host.className='counterparty-balance';parent.append(host);
  const labels={party:ap?'供应商':'客户/渠道',partyId:'往来单位编号',company:'核算公司',ledger:'账簿',currency:'原币',scope:'往来性质',count:ap?'应付单数':'应收单数',net:ap?'调整后应付':'调整后应收',settled:'累计已核销',outstanding:ap?'待付余额':'待收余额',reverse:'反向余额',overdue:ap?'逾期待付':'逾期待收',coverage:'资料情况',id:ap?'应付单号':'应收单号',order:'订单号',business:'业务/阶段',due:'有效到期日',status:'余额情况',cash:ap?'付款核销净额':'收款核销净额',offset:'预款冲抵净额',relief:'减免核销净额',balance:'账面净余额'};
  window.CaesarReadonlyReport.mount(host,{title:ap?'应付余额':'应收余额',defaults:{...base.defaults(),view},views:{[view]:ap?'应付余额':'应收余额'},query:m.query,explorer:true,clearOnError:true,humanDates:true,labels,
   money:['net','settled','outstanding','reverse','overdue','cash','offset','relief','balance'],columns:()=>m.columns,extras:['partyId','cash','offset','relief','balance','coverage'],
   filters:[{key:'asOf',label:'余额截止日',type:'date'},{key:'cutoff',label:'资料截止时间',type:'datetime-local'},{key:'company',label:'核算公司',options:choices('company','全部核算公司')},{key:'currency',label:'原币（元）',options:choices('currency','全部原币（分列）')},{key:'party',label:ap?'供应商名称/编号':'客户或渠道名称/编号'},
    {key:'order',label:'订单号',more:true},{key:'ledger',label:'账簿',options:choices('ledger','全部账簿'),more:true},{key:'scope',label:'往来性质',options:choices('scope','全部往来性质'),more:true},
    {key:'status',label:'含指定余额情况的往来单位',options:[['','全部余额情况'],...['资料不足','反向余额待核对','已结清','到期日待补','未到期','当日到期','已逾期'].map(v=>[v,v])],more:true},
    ...['customerType','channel','salesCompany','productCompany','department','store','center'].map(k=>({key:k,label:({customerType:'客户类型',channel:'渠道',salesCompany:'销售公司',productCompany:'产品公司',department:'部门/事业部',store:'门店',center:'呼叫中心'})[k],options:choices(k,'全部'+({customerType:'客户类型',channel:'渠道',salesCompany:'销售公司',productCompany:'产品公司',department:'部门/事业部',store:'门店',center:'呼叫中心'})[k]),more:true})),
    ...['dueStart','dueEnd','confirmedStart','confirmedEnd'].map(k=>({key:k,label:({dueStart:'到期日期自',dueEnd:'到期日期至',confirmedStart:'确认日期自',confirmedEnd:'确认日期至'})[k],type:'date',more:true}))],
   onRender:host=>{host.querySelector('[data-fr-export-all]').hidden=true;host.querySelector('[data-fr-content]').setAttribute('aria-label','统计层级');const label=host.querySelector('[data-fr-content]').parentElement;if(label.firstChild.nodeType===3)label.firstChild.textContent='统计层级 ';},
   definition:'按同一余额截止日、资料截止时间、往来单位、公司、账簿、原币及往来性质查看汇总与应收/应付单组成；订单、组织及日期筛选限定本次单据范围。名称与余额情况在汇总后筛选，显示匹配单位同范围完整金额。累计已核销包含收付核销、预款冲抵和减免，不代表实际现金。正向待收/待付与反向余额分列；无完整历史不展示假完整总额，缺到期日不当零逾期。原确认、期间调整及核销发生分别归核算核对、往来变动及收付核销专题。当前独立算例非正式账务。'});
 }
})();
