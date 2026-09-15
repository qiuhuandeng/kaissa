(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./monthly-profit-model.js'),require('./finance-funds-model.js'),require('./resource-cost-report-model.js'),require('./report-pages.js'),require('./overview-report-model.js'));
  else root.CaesarOverviewFinance=factory(root.CaesarMonthlyProfit,root.CaesarFunds,root.CaesarResourceCost,root.CaesarReports,root.CaesarOverviewModel);
})(typeof window==='object'?window:globalThis,function(profit,funds,resource,reports,createOverview){
  'use strict';
  const defaults={dataset:'demo',view:'profit',company:'',currency:'CNY',month:'2026-09',asOf:'2026-09-30',version:'published',
    planFrom:'2026-05-01',planThrough:'2026-05-07',metric:'orders',planCompany:'',level:'salesDepartment',taskVersion:'none'};
  const views={profit:'损益摘要',funds:'资金概况',plan:'计划概况',resources:'风险概况'};
  const known=v=>typeof v==='number'&&Number.isFinite(v);
  const date=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
  function risks(batches){
    const rules=[
      ['不可退未售',r=>r.nonRefundableUnsold>0,'nonRefundableUnsold'],
      ['可退未退',r=>r.returnable>0,'returnable'],
      ['损耗待确认',r=>r.pendingLoss>0,null],
      ['损耗资料缺失',r=>r.pendingLoss==null,null],
      ['成本资料缺失',r=>r.allocated==null,null],
      ['数量资料异常',r=>r.quantityStatus==='数量待核对',null]
    ], rows=[];
    for(const [risk,predicate,quantityKey] of rules){
      const groups=new Map();
      batches.filter(predicate).forEach(r=>{const key=JSON.stringify([r.company,r.unit,r.department||null]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);});
      for(const rs of groups.values()){
        const unique=[...new Map(rs.map(r=>[r.batch,r])).values()];
        rows.push({company:rs[0].company,risk,objects:unique.length,unit:rs[0].unit,
          quantity:quantityKey?unique.reduce((n,r)=>n+r[quantityKey],0):null,department:rs[0].department||null,deadline:unique.every(r=>date(r.deadline))?unique.map(r=>r.deadline).sort()[0]:null,
          coverage:!rs[0].department||!unique.every(r=>date(r.deadline))?'责任部门或到期资料不完整':'责任及期限资料齐全',source:'业务毛利 / 资源风险'});
      }
    }
    return rows;
  }
  function plan(q){
    if(!['orders','actual'].includes(q.metric)||!['group','company','salesDepartment'].includes(q.level))throw Error('请选择有效的经营任务指标及责任层级');
    const m=createOverview(reports),f={view:q.metric,start:q.planFrom,end:q.planThrough,grouping:q.level==='group'?'company':q.level,responsibility:'sales',comparison:'previous',budget:'none',company:q.planCompany};
    const error=m.validate(f);if(error)throw Error(error);
    const r=m.build(f);
    // The existing demonstration has only a group monthly order target; departmental drafts are never used.
    const sample=q.taskVersion==='sample'&&q.metric==='orders'&&q.level==='group'&&!q.planCompany&&q.planFrom==='2026-05-01'&&q.planThrough.slice(0,7)==='2026-05';
    const target=sample?m.build({...f,budget:'sample'}).total.target:null;
    return {rows:(q.level==='group'?[r.total]:r.rows).map(row=>{
      const valid=m.complete(row.coverage),t=known(target)?target:null;
      return {scope:q.level==='group'?(q.planCompany?q.planCompany+'公司':'集团'):row.name,
        metric:q.metric==='orders'?'订单净成交额':'实际完成分配成交额',period:q.planFrom+' 至 '+q.planThrough,
        actual:row.amount,target:t,gap:t!==null&&valid?Math.max(0,t-row.amount):null,
        completion:t>0&&valid?(row.amount/t*100).toFixed(2)+'%':null,
        targetPeriod:t===null?null:'2026-05-01 至 2026-05-31',
        coverage:!valid?'实际金额存在缺数':t===null?'无匹配批准任务，完成率未计算':'集团5月任务算例，非批准',
        source:'经营业绩 / 任务预算',conditions:'当期实绩与完整月任务对照；不按天摊分；任务样例仅集团订单'}
    }),notice:'经营任务与实际完成对照；订单按确认日期，回团按实际完成日期。任务样例非批准，草稿与审批中任务不参与计算。'};
  }
  function query(input){
    const q={...defaults,...input};
    if(!views[q.view])throw Error('请选择有效分析主题');
    const empty=notice=>({rows:[],sections:[],pending:true,title:views[q.view],notice});
    if(q.dataset==='pending')return empty('正式来源未接入，不能推算金额');
    if(q.view==='plan'){const r=plan(q);return {...r,title:views[q.view],sections:[],pending:false};}
    if(!['CNY','EUR'].includes(q.currency))throw Error('请选择有效原币');
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(q.month))throw Error('请选择有效月份');
    let r,rows,source,conditions;
    if(q.view==='profit'){
      if(!profit.versions[q.version])throw Error('请选择有效损益版本');
      r=profit.query({dataset:'demo',start:q.month,end:q.month,company:q.company,currency:q.currency,version:q.version});rows=r.rows;source='月度损益 / 公司损益';conditions=q.month+'；'+profit.versions[q.version].name;
    }else{
      if(!date(q.asOf)||(q.view==='resources'&&q.month+'-01'>q.asOf))throw Error('请检查确认月份与截止日期');
      if(q.view==='resources'){
        if(q.asOf!=='2026-09-30')return empty('当前资源资料仅提供2026-09-30状态，其他历史截止状态尚未提供');
        r=resource.query({dataset:'demo',view:'resources',company:q.company,start:q.month+'-01',end:q.asOf});
        rows=risks(r.rows.filter(row=>row.currency===q.currency));source='业务毛利 / 资源风险';conditions='采购确认'+q.month+'-01至'+q.asOf+'；风险状态截至2026-09-30；同一批次可能涉及多类风险，不跨类别加总';
      }else{
        if(q.asOf>funds.defaults.cutoff)return empty('资金截止超出已提供资料，余额不推算');
        r=funds.query({dataset:'demo',view:'accounts',company:q.company,currency:q.currency,start:q.asOf.slice(0,7)+'-01',end:q.asOf});
        rows=r.sections.find(s=>s.key==='totals')?.rows||[];source='资金分析 / 账户余额';conditions='资金截止'+q.asOf+'；近期预测缺口请按资金计划的预测期间查看';
      }
    }
    return {rows:rows.map(row=>({...row,source,conditions})),sections:[],pending:r.pending,title:views[q.view],notice:'独立算例 · '+conditions+'；金额以元表示，缺数不补零'};
  }
  return {defaults,views,query,risks};
});
