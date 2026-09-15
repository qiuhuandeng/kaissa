(function(){
  'use strict';
  const host=document.querySelector('[data-department-expenses]'),m=window.CaesarMonthlyProfit;if(!host||!m)return;
  window.CaesarReadonlyReport.mount(host,{
    title:'部门费用',views:{departmentExpenses:'部门费用'},defaults:{...m.defaults,view:'departmentExpenses'},query:window.CaesarMonthlyProfitAnalysis.query,
    explorer:true,clearOnError:true,exportTotals:true,blankTotalText:true,
    labels:{company:'核算公司',department:'费用承担部门',period:'会计月份',currency:'原币',directExpense:'直接费用',allocatedExpense:'分配费用',burden:'承担合计',unassignedExpense:'未分配费用',status:'核对情况',id:'费用单号',category:'费用项目',attribution:'归属方式',allocationEvidence:'分配依据',evidence:'费用确认依据'},
    money:['directExpense','allocatedExpense','burden','unassignedExpense'],columns:()=>[],extras:[],
    filters:[{key:'start',label:'会计月份开始',type:'month'},{key:'end',label:'会计月份结束',type:'month'},
      {key:'company',label:'核算公司',options:[['','全部公司'],['A公司（演示）','A公司（演示）'],['B公司（演示）','B公司（演示）']]},
      {key:'department',label:'费用承担部门'},
      {key:'currency',label:'原币',options:[['CNY','人民币'],['EUR','欧元']]},
      {key:'version',label:'资料版本',options:Object.entries(m.versions).map(([k,v])=>[k,v.name])}],
    onRender(h,q){
      h.querySelector('[data-fr-export-all]').hidden=true;
      const l=h.querySelector('[data-fr-content]').parentElement;if(l.firstChild.nodeType===3)l.firstChild.textContent='显示层级 ';
      let note=h.querySelector('[data-department-fee-note]');if(!note){note=document.createElement('p');note.dataset.departmentFeeNote='';h.querySelector('.cf-pagination').after(note);}
      note.textContent='示例数据 · 原币元 · 承担合计＋未分配费用＝当前范围费用；未接正式费用来源';
    },
    definition:'按会计月份、公司及资料版本统计。直接费用为明确归属部门且尚未扣除的费用；分配费用仅取有批准依据的本部门份额。承担合计＝直接费用＋分配费用。尚无部门归属的费用单列未分配，不计入任何部门承担；公司全部部门承担与未分配之和等于公司经营费用。已含收入或成本的优惠等不重复扣减；费用明细列本部门份额，不重复累计原费用全额。内部管理结转仍归内部调整，部门损益仍归部门损益。本页为固定独立算例，正式来源及费用分配政策待确认，查询不改变来源。'
  });
})();
