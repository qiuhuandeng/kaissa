(function(){
  'use strict';const host=document.querySelector('[data-overview-finance]'),m=window.CaesarOverviewFinance;if(!host||!m)return;
  const labels={company:'公司',period:'统计期间',currency:'原币',income:'确认收入',cost:'结转成本',gross:'毛利',expense:'经营费用',operating:'经营结果',status:'核对情况',
    opening:'期初余额',incoming:'实际流入',outgoing:'实际流出',closing:'账户余额',restricted:'受限资金',available:'可用资金',coverage:'资料情况',
    source:'核对报表',conditions:'统计范围',scope:'责任组织',metric:'任务指标',actual:'实际完成额（元）',target:'任务金额（元）',gap:'未完成金额（元）',completion:'完成率',targetPeriod:'任务期间',
    risk:'风险类别',objects:'涉及批次数',quantity:'涉及数量',unit:'单位',department:'责任部门',deadline:'最早到期日'};
  const cols={profit:['company','period','currency','income','cost','gross','expense','operating','status'],
    funds:['company','currency','closing','restricted','available','coverage'],
    plan:['scope','metric','period','actual','target','gap','completion','coverage'],
    resources:['company','risk','objects','quantity','unit','department','deadline','coverage']};
  const notPlan=q=>q.view!=='plan',isPlan=q=>q.view==='plan';
  window.CaesarReadonlyReport.mount(host,{title:'经营总览',defaults:m.defaults,views:m.views,query:m.query,labels,explorer:true,clearOnError:true,
    money:['income','cost','gross','expense','operating','opening','incoming','outgoing','closing','restricted','available','actual','target','gap'],
    columns:q=>cols[q.view],extras:q=>q.view==='plan'?['targetPeriod','source','conditions']:['source','conditions'],
    filters:[
      {key:'company',label:'公司',visible:notPlan},
      {key:'currency',label:'原币（元）',options:[['CNY','人民币·元'],['EUR','欧元·元']],visible:notPlan},
      {key:'month',label:'会计/确认月份',type:'month',visible:q=>['profit','resources'].includes(q.view)},
      {key:'asOf',label:'余额/风险截止',type:'date',visible:q=>['funds','resources'].includes(q.view)},
      {key:'version',label:'损益版本',options:[['published','已发布算例V1'],['corrected','更正算例V2']],visible:q=>q.view==='profit'},
      {key:'metric',label:'经营任务指标',options:[['orders','订单净成交额'],['actual','回团成交额']],visible:isPlan},
      {key:'planCompany',label:'销售公司',options:[['','全部销售公司'],['A','A公司'],['B','B公司']],visible:isPlan},
      {key:'level',label:'责任层级',options:[['salesDepartment','销售部门'],['company','销售公司'],['group','集团']],visible:isPlan},
      {key:'planFrom',label:'实际统计开始',type:'date',visible:isPlan},{key:'planThrough',label:'实际统计结束',type:'date',visible:isPlan},
      {key:'taskVersion',label:'任务版本',options:[['none','正式任务未接入'],['sample','集团5月样例·非批准']],visible:isPlan}
    ],
    definition:'损益按会计月；资金按截止日实际余额，不混入预测。计划按所选经营指标和责任层级，金额为人民币元；缺批准任务不计算完成率。风险按公司、类别及数量单位汇总批次，同一批次可能涉及多类风险，不跨类加总；无完整期限、责任资料时显示未提供。明细及办理仍归对应专题。'
  });
})();
