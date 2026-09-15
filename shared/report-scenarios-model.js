(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./monthly-profit-model.js'),require('./return-finance-model.js'),require('./finance-balances-model.js'),require('./finance-prepayments-model.js'),require('./finance-funds-model.js'),require('./resource-cost-report-model.js'),require('./finance-accounting-model.js'));
  else root.CaesarReportScenarios=factory(root.CaesarMonthlyProfit,root.CaesarReturnFinance,root.CaesarBalances,root.CaesarPrepayments,root.CaesarFunds,root.CaesarResourceCost,root.CaesarAccountingReport);
})(typeof window==='object'?window:globalThis,function(profit,rf,balances,prepay,funds,resource,accounting){
  'use strict';
  const views={s1:'销售与内部供货',s2:'跨年分次完成',s3:'包舱跨团及未售',s4:'同产品多渠道',s5:'企业分期与逾期',s6:'后补成本与代收'};
  function phased(project=false){
    const first=project?30000:4000,second=project?70000:6000,actual=project?'2026-09-01':'2026-01-20',date=project?'2026-09-05':'2026-02-05',period=date.slice(0,7);
    const completions=[rf.completion('STAGE1','stages',{order:project?'KSMICE-260901':'CROSS-YEAR-01',confirmed:project?'2026-08-20':'2025-12-20',product:'企业合同第一阶段',actual,planned:actual,confirmedAt:actual,amount:first}),rf.completion('STAGE2','stages',{order:project?'KSMICE-260901':'CROSS-YEAR-01',confirmed:project?'2026-08-20':'2025-12-20',product:'企业合同第二阶段',actual:'',planned:project?'2026-10-15':'2026-03-20',confirmedAt:'',amount:second})];
    const records=[rf.confirmation('STAGE1-SR','income',first,[['STAGE1',first]],{date,period,effective:date,recorded:date}),rf.confirmation('STAGE1-CB','cost',first*0.6,[['STAGE1',first*0.6]],{date,period,effective:date,recorded:date})];records.forEach(r=>r.allocations.forEach(a=>{a.effective=date;a.recorded=date;}));
    return {completions,records};
  }
  function query(input={}){
    const q={view:'s1',...input},rows=[],sources=[];
    const add=(metric,amount,period,reference,unit='元',company='独立场景范围')=>rows.push({metric,amount,period,reference,unit,company});
    const source=(id,type,amount,period,company,evidence)=>sources.push({id,type,amount,period,company,evidence});
    if(q.view==='s1'){
      const p=profit.query({dataset:'demo',view:'group',groupScope:'demoApproved'});add('集团对外确认收入',p.rows[2].income,'2026-09','EL01批准演示范围');
      for(const r of profit.query({dataset:'demo'}).rows){add('公司经营结果',r.operating,r.period,'原公司结果未覆盖','元',r.company);source(r.company,'原公司确认收入',r.income,r.period,r.company,'月度经营损益原确认记录');}
      const pair=accounting.query({dataset:'demo',view:'internal'}).rows;source('INT01','跨法人双方金额差',pair[0].difference,'2026-05',pair[0].entity,pair[0].status);source('INT03','同法人协作',null,'2026-05',pair[2].entity,pair[2].status);
    }else if(q.view==='s2'||q.view==='s5'){
      const project=q.view==='s5',d=phased(project),cutoff=project?'2026-09-30':'2026-02-28';
      const l=rf.ledger(d,cutoff),income=rf.sum(l.flows.filter(r=>r.kind==='income'));
      add('整份合同金额',d.completions.reduce((s,r)=>s+r.amount,0),d.completions[0].confirmed,'合同分阶段约定');add('已完成阶段金额',d.completions[0].amount,d.completions[0].actual,'STAGE1');add('本期确认收入',income,project?'2026-09':'2026-02','STAGE1-SR');add('尚未完成阶段',d.completions[1].amount,d.completions[1].planned,'STAGE2');
      l.records.forEach(r=>source(r.id,rf.kinds[r.kind],r.amount,r.period,r.entity,r.evidence));
      if(project){const r=balances.query({dataset:'demo',case:'BA02'}).rows[0];add('第一阶段待收',r.balance,'2026-09-30',r.id);add('第一阶段逾期天数',r.overdueDays,'2026-09-30','约定到期2026-09-15','天');source(r.id,'阶段应收',r.net,'2026-09',r.company,r.proof);}
      else{
        const f=funds.fixture(),a={...f.accounts[0],opening:1000,restricted:0,start:'2026-02-01'};
        const plans=[{...f.plans[0],id:'STAGE2-RECEIPT',obligation:'STAGE2-R',gross:6000,recorded:'2026-02-20',planned:'2026-03-25',due:'2026-03-25',commitment:'合同第二阶段付款约定',order:'CROSS-YEAR-01'},{...f.plans[0],id:'STAGE2-PAY',obligation:'STAGE2-P',direction:'付款',gross:3000,recorded:'2026-02-20',planned:'2026-03-10',due:'2026-03-10',proof:'第二阶段资源付款节点',order:'CROSS-YEAR-01'}];
        const result=funds.query({dataset:'demo',view:'plan',start:'2026-02-01',end:cutoff,cutoff,planStart:'2026-03-01',planEnd:'2026-03-31'},{...f,accounts:[a],flows:[],plans});
        add('有效计划收款',result.forecast[0].plannedIn,'2026-03','STAGE2-RECEIPT');add('有效计划付款',result.forecast[0].plannedOut,'2026-03','STAGE2-PAY');add('计划期末可用资金',result.forecast[0].plannedClosing,'2026-03','期初1000及有效收付节点');
        result.rows.forEach(r=>source(r.id,r.direction,r.gross,r.planned,r.company,r.proof));
      }
    }else if(q.view==='s3'){
      const r=resource.query({dataset:'demo',view:'resources',batch:'CABIN-01'}).rows[0];
      for(const [k,name]of Object.entries({committed:'承诺舱数',sold:'已售舱数',used:'已用舱数',returnable:'可退未退舱数',nonRefundableUnsold:'不可退未售舱数'}))add(name,r[k],'2026-09-30',r.batch,'舱');
      for(const [k,name]of Object.entries({purchase:'批次采购总额',allocated:'已确认分配成本',confirmedLoss:'其中已确认舱损',pendingLoss:'待确认舱损'}))add(name,r[k],'2026-09',r.batch);
      const d=prepay.fixture(),a={...d.accounts.find(a=>a.id==='YF-001'),id:'CABIN-PP',opening:70000,returnDue:'',openingReturn:0};
      const events=[['ALLOC-A','allocate',40000],['ALLOC-B','allocate',30000],['OFFSET-A','offset',30000]].map(([id,kind,amount])=>({account:prepay.key(a),id,kind,amount,date:'2026-09-20',recorded:'2026-09-20',confirmed:true,proof:'包舱预付确认'+id,reference:r.batch}));
      const p=prepay.query({dataset:'demo',view:'prepay'},{...d,accounts:[a],events,positions:[]}).rows[0];add('预付已分摊（不扣余额）',p.allocated,'2026-09','CABIN-PP');add('预付已冲抵',p.used,'2026-09','OFFSET-A');add('预付余额',p.closing,'2026-09-30','CABIN-PP');
      resource.query({dataset:'demo',batch:'CABIN-01'}).rows.forEach(a=>source(a.id,a.type,a.confirmedCost,'2026-09',a.tour,a.evidence));
    }else if(q.view==='s4'){
      const r=profit.contribution({dataset:'demo',view:'channel',company:'A公司（演示）'});
      r.rows.forEach(v=>{add(v.group+'收入',v.income,'2026-09','同产品确认依据');add(v.group+'直接贡献',v.contribution,'2026-09','尚未包含公共部门费用');});
      r.sections.find(s=>s.key==='expenses').rows.forEach(v=>source(v.id,v.category,v.allocated,v.period,v.company,v.status));
      const deposit=prepay.query({dataset:'demo',view:'deposit',keyword:'YC-001'}).rows[0];source(deposit.id,'加盟预存余额（独立款项核对，不计贡献）',deposit.closing,'2026-09-30',deposit.company,deposit.proof);
    }else if(q.view==='s6'){
      for(const [version,label]of [['published','原发布9月成本'],['corrected','更正9月成本']])add(label,profit.query({dataset:'demo',version}).rows[1].cost,'2026-09','PB1-CB / PB1-LATE');
      add('次月返点成本影响',profit.query({dataset:'demo',version:'corrected',start:'2026-10',end:'2026-10'}).rows[1].cost,'2026-10','PB1-REBATE');
      const b=balances.query({dataset:'demo',case:'BA07',view:'clearing'}).rows.find(r=>r.id==='QS-AGENT-01-AR');add('代收公司待清算',b.balance,'2026-09-30',b.id);source(b.id,'业务公司内部应收',b.balance,'2026-09',b.businessCompany,'实际收款公司：'+b.fundsCompany);source(b.peerId,'实际收款公司内部应付',b.peerBalance,'2026-09',b.fundsCompany,b.pairStatus);
      profit.query({dataset:'demo',version:'corrected',start:'2026-09',end:'2026-10'}).sections.find(s=>s.key==='source').rows.filter(r=>r.original).forEach(r=>source(r.id,r.kind,r.amount,r.period,r.company,r.reason));
    }else throw new Error('请选择已有业务场景');
    return {rows,sections:[{key:'evidence',title:'业务与确认依据',rows:sources,columns:['id','type','amount','period','company','evidence']}],notice:'独立业务场景核对 · '+views[q.view]+' · 复用已验收计算规则；各原币、期间和责任不混计，非正式实账'};
  }
  return {views,query,phased};
});
