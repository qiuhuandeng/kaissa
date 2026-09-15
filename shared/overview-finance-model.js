(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./monthly-profit-model.js'),require('./finance-funds-model.js'),require('./resource-cost-report-model.js'));
  else root.CaesarOverviewFinance=factory(root.CaesarMonthlyProfit,root.CaesarFunds,root.CaesarResourceCost);
})(typeof window==='object'?window:globalThis,function(profit,funds,resource){
  'use strict';
  const defaults={dataset:'demo',view:'profit',company:'',currency:'CNY',month:'2026-09',asOf:'2026-09-30',planEnd:'2026-12-31',version:'published'};
  const views={profit:'损益摘要',funds:'资金概况',plan:'计划概况',resources:'风险概况'};
  function query(input){
    const q={...defaults,...input};
    if(q.dataset==='pending')return {rows:[],sections:[],pending:true,notice:'共同经营资料尚无正式财务确认、资金或资源风险来源；不以成交额推算'};
    let r,rows,source,conditions,evidence;
    if(q.view==='profit'){
      r=profit.query({dataset:'demo',start:q.month,end:q.month,company:q.company,currency:q.currency,version:q.version});rows=r.rows;source='月度经营损益';conditions=q.month+'；'+profit.versions[q.version].name;
      evidence=r.sections.find(s=>s.key==='source');
    }else if(q.view==='resources'){
      r=resource.query({dataset:'demo',view:'resources',company:q.company,start:q.month+'-01',end:q.asOf});rows=r.rows.filter(r=>r.currency===q.currency);source='产品经营 / 业务毛利：资源风险';conditions='批次确认'+q.month+'-01至'+q.asOf;
      evidence={key:'allocations',title:'相关资源分配依据',rows:r.sections.find(s=>s.key==='allocations').rows.filter(a=>rows.some(b=>b.batch===a.batch)),columns:['id','batch','tour','type','quantity','unit','confirmedCost','pendingCost','status','evidence']};
    }else{
      r=funds.query({dataset:'demo',view:q.view==='plan'?'plan':'accounts',company:q.company,currency:q.currency,start:q.month+'-01',end:q.asOf,planEnd:q.planEnd});rows=r.sections.find(s=>s.key===(q.view==='plan'?'forecast':'totals'))?.rows||[];source='财务报表：资金收支与安排';conditions='实际余额'+q.asOf+(q.view==='plan'?'；计划2026-10-01至'+q.planEnd:'');
      evidence={key:'funds',title:q.view==='plan'?'有效与未纳入资金安排依据':'实际账户依据',rows:r.rows,columns:q.view==='plan'?['id','company','currency','planned','plannedIn','plannedOut','inclusion','proof']:['account','company','currency','opening','incoming','outgoing','closing','restricted','available','proof']};
    }
    return {rows:rows.map(r=>({...r,source,conditions})),sections:evidence?[evidence]:[],pending:r.pending,notice:'独立'+source+'算例 · '+conditions+' · 与上方共同经营规模不合并，各自查询及导出核对'};
  }
  return {defaults,views,query};
});
