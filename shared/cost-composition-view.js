(function(){
  'use strict';
  const host=document.querySelector('[data-cost-composition]'),m=window.CaesarCostComposition;if(!host||!m)return;
  window.CaesarReadonlyReport.mount(host,{
    title:'成本构成',views:{composition:'成本构成'},defaults:m.defaults,query:m.query,explorer:true,clearOnError:true,blankTotalText:true,exportTotals:true,
    labels:{id:'成本明细号',company:'成本承担公司',currency:'原币',business:'团期／服务',completed:'业务完成日期',category:'成本项目',item:'费用内容',supplier:'供应商',unit:'计价单位',estimated:'预计成本',settled:'结算成本',difference:'成本差额',variance:'差异率',estimateQty:'预计数量',actualQty:'结算数量',estimatedUnit:'预计单位成本',settledUnit:'结算单位成本',leader:'领队姓名',status:'核对情况',estimateVersion:'预计版本',estimateDate:'预计确认日',estimateEvidence:'预计依据',settledDate:'结算确认日',settlementEvidence:'结算依据',count:'成本项数'},
    money:['estimated','settled','difference','estimatedUnit','settledUnit'],columns:()=>m.columns,
    extras:[],
    filters:[{key:'start',label:'业务完成开始',type:'date'},{key:'end',label:'业务完成结束',type:'date'},{key:'cutoff',label:'资料截止日',type:'date'},
      {key:'company',label:'成本承担公司',options:[['','全部公司'],['A公司（演示）','A公司（演示）'],['B公司（演示）','B公司（演示）']]},
      {key:'currency',label:'原币',options:[['CNY','人民币'],['EUR','欧元']]},{key:'category',label:'成本项目',options:[['','全部成本项目'],...m.categories.map(v=>[v,v])]},{key:'business',label:'团期／服务'},
      {key:'supplier',label:'供应商',more:true},{key:'unit',label:'计价单位',more:true,options:[['','全部单位'],...['座','车天','间夜','人','人天','场','次','单位未提供'].map(v=>[v,v])]}],
    onRender(h,q,result){h.querySelector('[data-fr-export-all]').hidden=true;const l=h.querySelector('[data-fr-content]').parentElement;if(l.firstChild.nodeType===3)l.firstChild.textContent='显示层级 ';let note=h.querySelector('[data-cost-note]');if(!note){note=document.createElement('p');note.dataset.costNote='';h.querySelector('.cf-pagination').after(note);}note.textContent='示例数据 · 原币元 · 资料截至 '+q.cutoff+' · 未接正式成本来源';},
    definition:'按业务完成日期选取团期或服务成本，按资料截止日核对预计及结算确认。预计和结算为同一成本项的两个金额，不相加；差额＝结算成本－预计成本，正数表示超出预计。单位成本＝同公司、同币种、同成本项目、同计价单位的成本合计÷对应数量合计；数量是成本计价数量，不是去重出游人数。缺确认、缺金额或数量时不补零，零数量不计算单位成本。采购分配只取本业务承担额，不重复采购全额；预付和付款不计作结算成本。当前为截至2026-09-30的独立固定算例，刷新不改变来源，正式分类和预计版本待财务确认。'
  });
})();
