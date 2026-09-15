(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./monthly-profit-model.js'));
  else{
    const api=factory(root.CaesarMonthlyProfit);root.CaesarProductContribution=api;
    const host=document.querySelector('[data-contribution]');if(!host)return;
    const m=root.CaesarMonthlyProfit,channel=host.dataset.contribution==='channel';
    const labels={company:'核算公司',group:channel?'成交渠道':'产品分析项',currency:'原币',income:'确认收入',cost:'结转成本',gross:'业务毛利',fees:'已归属直接费用',contribution:'直接经营贡献',status:'资料情况',commission:'渠道佣金',platform:'平台费',discount:'尚未扣除优惠',direct:'其他直接费用',id:'完成记录号',order:'订单号',product:'产品组合',destination:'目的地',type:'业务类型',supply:'供应方式',channel:'成交渠道',customer:'合同付款客户',external:'对外/内部'};
    root.CaesarReadonlyReport.mount(host,{
      onRender:host=>{host.querySelector('[data-fr-export-all]').hidden=true;const label=host.querySelector('[data-fr-content]').parentElement;if(label.firstChild.nodeType===3)label.firstChild.textContent='统计层级 ';},
      title:channel?'渠道经营贡献':'产品经营贡献',defaults:{...m.defaults,view:channel?'channel':'product'},views:{[channel?'channel':'product']:'经营贡献'},query:api.query,explorer:true,clearOnError:true,labels,
      money:['income','cost','gross','fees','contribution','commission','platform','discount','direct'],
      columns:()=>api.columns,extras:['commission','platform','discount','direct'],
      filters:[{key:'start',label:'会计月份开始',type:'month'},{key:'end',label:'会计月份结束',type:'month'},{key:'version',label:'资料版本',options:Object.entries(m.versions).map(([k,v])=>[k,v.name])},
        {key:'company',label:'核算公司',options:[['','全部核算公司'],['A公司（演示）','A公司'],['B公司（演示）','B公司']]},
        {key:'currency',label:'原币（元）',options:[['CNY','人民币·元'],['EUR','欧元']]},{key:'product',label:'产品组合'},
        {key:'grouping',label:'分析分类',visible:()=>!channel,options:[['product','产品组合'],['destination','目的地'],['type','业务类型'],['supply','供应方式']]},
        {key:'customer',label:'合同付款客户',more:true},...['destination','type','supply','channel'].map(key=>({key,label:labels[key],more:true}))],
      definition:'按核算公司、会计期间与原币分别核对。直接经营贡献=确认收入-结转成本-已归属且尚未扣除的直接费用；部门公共费用尚无逐产品或渠道分配资料，不推算完整利润。汇总与组成记录使用同一批完成记录和确认资料；全公司会计及费用依据归核算核对和月度损益。内部供货和对外销售不跨公司重复相加。'
    });
  }
})(typeof window==='object'?window:globalThis,function(m){
  const columns=['company','group','currency','income','cost','gross','fees','contribution','status'];
  function query(input,supplied){
    const q={...m.defaults,...input,view:input?.view==='channel'?'channel':'product'};
    const title=q.view==='channel'?'渠道贡献汇总':'产品贡献汇总';
    if(!['product','destination','type','supply'].includes(q.grouping))throw Error('请选择有效产品分析分类');
    const r=m.contribution(q,supplied);
    if(r.pending)return {...r,sections:[],title,columns};
    const detail=r.sections.find(s=>s.key==='contribution');
    return {...r,title,columns,sections:[{...detail,title:'同范围组成记录',columns:['id','order','company','product','currency','external','income','cost','gross','fees','contribution','status']}],
      notice:r.notice+(q.view==='channel'?'；仅直接经营贡献。公共费用缺逐渠道分配，不按销售额摊分，不称门店利润或奖金。':'；仅直接经营贡献。部门公共费用缺逐产品分配，不按销售额摊分、不称产品利润。')};
  }
  return {query,columns};
});
