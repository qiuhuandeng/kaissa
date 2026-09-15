(function(){
  'use strict';
  const host=document.querySelector('[data-store-profit]'),m=window.CaesarStoreProfit;if(!host||!m)return;
  window.CaesarReadonlyReport.mount(host,{
    title:'门店分润',views:m.views,defaults:m.defaults,query:m.query,explorer:true,clearOnError:true,blankTotalText:true,
    labels:{company:'结算公司',store:'门店',period:'原结算期间',currency:'原币',calculatedBase:'原计算基础',base:'可分配基础（已确认）',storeShare:'门店分润（已确认）',retained:'公司留存（已确认）',pendingAmount:'待确认额',pendingCount:'待确认笔数',status:'核对情况',id:'记录号',order:'订单号',currentRule:'当前规则版本',rule:'原规则版本',newRule:'调整规则版本',rate:'门店分配比例',gross:'业务毛利',upgrade:'升舱毛利',feeBasis:'费用承担依据',originalStore:'原确认门店分润',calculatedStore:'计算门店分润',costReference:'贡献费用核对',payable:'已确认应付分润',paid:'已支付净额',offset:'已抵扣净额',settled:'已结算合计',remaining:'待结算',overpaid:'待追回',due:'到期日',difference:'应付减已结算',target:'分润确认号',date:'发生日期',kind:'结付方式',amount:'记录金额',applied:'本次有效结付',state:'执行结果',evidence:'确认依据',reason:'调整原因',beforeStore:'调整前门店分润',deltaStore:'门店分润调整',afterStore:'调整后门店分润',deltaBase:'基础调整',deltaCompany:'公司留存调整',bearer:'调整承担方'},
    money:['calculatedBase','base','storeShare','retained','pendingAmount','gross','upgrade','originalStore','calculatedStore','payable','paid','offset','settled','remaining','overpaid','difference','amount','applied','beforeStore','deltaStore','afterStore','deltaBase','deltaCompany'],columns:q=>m.columns[q.view],extras:[],
    filters:[{key:'start',label:'统计月份开始',type:'month'},{key:'end',label:'统计月份结束',type:'month'},{key:'cutoff',label:'资料截止日',type:'date'},
      {key:'company',label:'结算公司',options:[['','全部公司'],['A公司（演示）','A公司（演示）'],['B公司（演示）','B公司（演示）']]},
      {key:'store',label:'门店'},{key:'currency',label:'原币',options:[['CNY','人民币'],['EUR','欧元']]},{key:'order',label:'订单号',more:true},
      {key:'scope',label:'查看范围示例',more:true,options:[['group','财务全部范围'],['company','A公司财务'],['channel','软件园渠道负责人']]}],
    onRender(h,q){
      h.querySelector('[data-fr-export-all]').hidden=true;const l=h.querySelector('[data-fr-content]').parentElement;if(l.firstChild.nodeType===3)l.firstChild.textContent='显示层级 ';
      let note=h.querySelector('[data-store-profit-note]');if(!note){note=document.createElement('p');note.dataset.storeProfitNote='';h.querySelector('.cf-pagination').after(note);}
      note.textContent='示例数据 · 原币元 · '+(q.view==='adjustments'?'按调整发生月筛选，保留原结算期间':'按原结算期间筛选，确认及结付截至所选日期')+' · 未接正式规则及授权';
    },
    definition:'分润不是渠道贡献、实际付款或预存余额。示例以业务毛利减规则排除的升舱毛利、尚未计入的共同扣项作为可分配基础，再按确认比例分配，门店或公司专属扣项各自承担；已计入基础的共同费用不重复扣除。规则、费用承担或金额缺失均待确认，不采用规则页百分比作为正式制度。汇总仅合计已确认基础与分润，待确认额为原送审金额，缺送审金额不补零；逐单记录保留缺项。已结算合计＝成功支付净额＋批准抵扣净额，失败不算支付，超付列待追回；应付减已结算为差额。调整保留原规则、原结果及确认增减，未确认调整不改原结果。渠道贡献只引用已确认费用，不将分润或付款再扣一遍。当前固定独立示例截至2026-10-31，不自动更新、审批或付款。'
  });
})();
