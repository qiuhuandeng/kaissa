(function () {
 'use strict';
 const host=document.querySelector('[data-resource-cost]');if(!host||!window.CaesarResourceAnalysis)return;
 const base=window.CaesarResourceCost,m=window.CaesarResourceAnalysis,productOnly=Boolean(document.querySelector('[data-report-page="products"]'));
 window.CaesarReadonlyReport.mount(host,{
  title:productOnly?'产品资源风险':'资源成本与风险',views:productOnly?{resources:'产品风险'}:base.views,defaults:{...base.defaults,view:productOnly?'resources':'costs'},query:m.query,explorer:true,clearOnError:true,
  labels:{id:'分配确认号',batch:'采购批次号',company:'核算公司',supplier:'供应商',product:'产品',tour:'团期号',currency:'原币',unit:'数量单位',type:'成本项目',quantity:'分配数量',
   confirmedCost:'已确认分配成本',pendingCost:'待确认分配金额',pendingAllocation:'待确认记录金额',status:'资料情况',evidence:'确认依据',committed:'承诺数量',sold:'已售数量',used:'已用数量',unused:'未使用数量',
   returnable:'可退未退',nonRefundableUnsold:'不可退未售',purchase:'确认采购额',allocated:'已确认分配',unallocated:'尚未确认分配',payable:'批次已确认应付',paid:'批次实际已付（参考）',
   confirmedLoss:'已确认损耗',pendingLoss:'待确认损耗',destination:'目的地',supply:'供应方式',date:'批次确认日',quantityStatus:'数量核对情况',unusedFunds:'未使用资源占用资金',releaseBy:'释放截止日',riskCoverage:'占用及期限资料'},
  money:['confirmedCost','pendingCost','pendingAllocation','purchase','allocated','unallocated','payable','paid','confirmedLoss','pendingLoss','unusedFunds'],
  columns:q=>m.columns[q.view],extras:q=>q.view==='costs'?['supplier','evidence']:['supplier','committed','sold','used','unusedFunds','releaseBy','riskCoverage','paid'],
  filters:[{key:'start',label:'批次确认开始',type:'date'},{key:'end',label:'批次确认结束',type:'date'},{key:'company',label:'核算公司'},{key:'product',label:'产品'},{key:'batch',label:'采购批次号'},
   {key:'supplier',label:'供应商',more:true},{key:'unit',label:'数量单位',options:[['','全部数量单位'],['舱','舱'],['座','座'],['铺','铺']],more:true}],
  onRender:host=>{host.querySelector('[data-fr-export-all]').hidden=true;const label=host.querySelector('[data-fr-content]').parentElement;if(label.firstChild.nodeType===3)label.firstChild.textContent='统计层级 ';},
  definition:'金额按公司、原币分别核对，单位为元；舱、座、铺不跨单位合计。成本分配以批次为范围，组成记录包含该批全部团期及待确认分配，批次总额不按团期重复列示。资源风险为独立主题；占用资金和释放期限无可靠来源时显示未提供，不能按已付比例猜测。'
 });
})();
