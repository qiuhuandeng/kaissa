(function(){
 const supplier=document.querySelector('[data-supplier-report]'),m=window.CaesarSupplierPrepayment,base=window.CaesarPrepayments;
 if(!supplier||!m)return;
 const host=document.createElement('section');host.id='finance-prepayments';supplier.after(host);host.hidden=true;
 const labels={party:'供应商',partyId:'供应商身份',company:'核算公司',ledger:'账簿',currency:'原币',accounts:'预付账户数',closing:'预付账面余额',unperformed:'未履约占用',overdueReturn:'应退未退',longHeld:'长期占用余额',frozen:'冻结余额',available:'账面可用余额',risk:'占用情况',knownClosing:'已知余额（参考）',missing:'余额缺数账户',coverage:'资料情况',id:'预付账户号',refundDue:'待退余额',days:'持有天数',returnDue:'约定退回日',proof:'确认凭据'};
 window.CaesarReadonlyReport.mount(host,{title:'供应商预付占用',defaults:{...base.defaults,view:'prepay',direction:'支付'},views:{prepay:'预付占用'},query:m.query,explorer:true,clearOnError:true,labels,
 money:['closing','unperformed','overdueReturn','longHeld','frozen','available','knownClosing','refundDue'],columns:()=>m.columns,extras:['partyId','coverage','refundDue'],
 filters:[{key:'end',label:'余额截止日',type:'date'},{key:'cutoff',label:'资料截止日',type:'date'},{key:'company',label:'核算公司',options:[['','全部核算公司'],['北京凯撒','北京凯撒'],['福建凯撒','福建凯撒']]},
 {key:'currency',label:'原币（元）',options:[['','全部原币（分列）'],['CNY','人民币·元'],['EUR','欧元']]},{key:'party',label:'供应商名称/编号'},
 {key:'risk',label:'供应商占用情况',options:[['','全部占用情况'],...['正常持有','长期未结','应退未退','资料不足','已结清'].map(v=>[v,v])]},
 {key:'threshold',label:'长期占用分析天数',type:'number',more:true},{key:'start',label:'核对期间开始',type:'date',more:true}],
 onRender:host=>{host.querySelector('[data-fr-export-all]').hidden=true;const label=host.querySelector('[data-fr-content]').parentElement;if(label.firstChild.nodeType===3)label.firstChild.textContent='统计层级 ';},
 definition:'仅供应商预付款支付方向；同供应商、公司、账簿、原币和截止范围查看汇总与账户组成。存在余额缺数时不展示假完整总额；未履约或应退资料缺失不补零。风险筛选不截取单个风险账户冒充供应商余额；长期、未履约、应退和冻结可能重叠，不合计成总风险金额。可回收性及未完成采购关系需有业务依据，账面可用不代表可回收。'});
})();
