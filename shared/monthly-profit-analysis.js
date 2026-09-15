(function(root){
  'use strict';
  const m=typeof module==='object'&&module.exports?require('./monthly-profit-model.js'):root.CaesarMonthlyProfit;
  const group=(rows,keys)=>{const out=new Map();for(const r of rows){const k=JSON.stringify(keys.map(k=>r[k]));if(!out.has(k))out.set(k,[]);out.get(k).push(r);}return [...out.values()];};
  const companyCols=['company','period','currency','income','cost','gross','expense','operating','unassigned','status'];
  function query(input,supplied){
    const q={...m.defaults,expenseGrouping:'category',...input};
    const relevant=['departments','expenses','management'].includes(q.view);
    const r=m.query({...q,department:relevant?q.department:''},supplied),b=r.data;
    if(!b)return r;
    const sec=(key,title,rows,columns)=>({key,title,rows,columns});
    const belongs=d=>!q.department||String(d||'').includes(q.department);
    const original=b.expenses.map(e=>({...e,unassigned:m.sum(e.parts.filter(a=>a.department==='未分配费用').map(a=>a.amount))}));
    const allocations=b.expenses.flatMap(e=>e.parts.map(a=>({...e,department:a.department,allocated:a.amount,originalAmount:e.amount}))).filter(e=>belongs(e.department));
    const feeRecords=sec('fees','费用记录',original,['id','company','period','currency','category','amount','impact','unassigned','status','evidence']);
    let main,sections=[];
    if(q.view==='companies'){
      main=sec('main','公司损益汇总（未抵销）',b.companies,companyCols);sections=[];
    }else if(q.view==='departments'){
      const rows=b.departments.filter(d=>belongs(d.department)).map(d=>{
        const fees=b.expenses.filter(e=>e.company===d.company&&e.period===d.period&&e.currency===d.currency);
        return {...d,directExpense:m.sum(fees.filter(e=>e.department===d.department).map(e=>e.impact)),sharedExpense:m.sum(fees.filter(e=>!e.department).flatMap(e=>e.parts.filter(a=>a.department===d.department).map(a=>a.amount)))};
      });
      main=sec('main',q.department?'所选部门损益':'部门损益汇总（含未归属及未分配）',rows,['company','department','period','currency','income','cost','gross','directExpense','sharedExpense','transfer','operating','status']);
      sections=[];
    }else if(q.view==='expenses'){
      const byDept=q.expenseGrouping==='department';
      const facts=allocations.map(e=>({...e,expense:e.allocated}));
      const rows=group(facts,['company','period','currency',byDept?'department':'category']).map(xs=>{
        const total=m.sum(facts.filter(e=>e.company===xs[0].company&&e.period===xs[0].period&&e.currency===xs[0].currency).map(e=>e.expense));
        const expense=m.sum(xs.map(e=>e.expense));
        return {...xs[0],expense,share:total>0&&expense!==null?(expense/total*100).toFixed(2)+'%':'不适用',previous:'无完整可比资料',difference:'不可比',growth:'不可比',unassigned:m.sum(xs.filter(e=>e.department==='未分配费用').map(e=>e.expense))};
      });
      main=sec('main',byDept?'部门费用构成':'费用类别构成',rows,['company','period','currency',byDept?'department':'category','expense','share','previous','difference','growth','unassigned']);
      // With a department filter, show its allocated impact rather than full company expense.
      const selected=byDept?allocations.map(e=>({...e,impact:e.allocated})):original.filter(e=>e.parts.some(a=>belongs(a.department))).map(e=>({...e,impact:m.sum(e.parts.filter(a=>belongs(a.department)).map(a=>a.amount))}));
      sections=[{...feeRecords,title:byDept?'部门费用明细':'费用项目明细',rows:selected,columns:byDept?['id','company','period','currency','department','category','originalAmount','impact','status','evidence']:feeRecords.columns}];
    }else if(q.view==='budgets'){
      const rows=r.rows.filter(v=>!q.budgetMetric||v.metric===q.budgetMetric).map(v=>({...v,varianceRate:v.budget>0&&v.variance!==null?(v.variance/v.budget*100).toFixed(2)+'%':'不适用',direction:v.variance===null?'资料不足':v.variance===0?'持平':(v.metric==='经营费用'?v.variance<0:v.variance>0)?'有利':'不利'}));
      main=sec('main','公司预算差异',rows,['company','period','currency','metric','budget','actual','variance','varianceRate','direction','reason']);
      sections=[];
    }else if(q.view==='approvedBudget'){
      const data=supplied||m.fixture();
      const rows=data.budgets.filter(v=>v.approved&&v.evidence&&v.version===q.budgetVersion&&v.period>=q.start&&v.period<=q.end&&(!q.company||v.company===q.company)&&(!q.currency||v.currency===q.currency)).map(v=>({...v,metric:v.metric==='expense'?'经营费用':'经营结果',budget:v.amount,budgetVersion:v.version}));
      main=sec('main','批准预算记录',rows,['company','period','currency','metric','budget','budgetVersion','evidence']);
    }else if(q.view==='management'){
      const adjustments=r.sections.find(s=>s.key==='management').rows;
      const details=adjustments.flatMap(t=>[{...t,department:t.from,transfer:-t.amount},{...t,department:t.to,transfer:t.amount}]).filter(t=>belongs(t.department)).map(t=>({...t,transfer:t.approved&&t.evidence?t.transfer:null,status:t.approved&&t.evidence?'已确认':'待确认'}));
      const rows=group(details,['company','period','currency','department']).map(xs=>({...xs[0],transfer:m.sum(xs.map(x=>x.transfer)),status:xs.every(x=>x.transfer!==null)?'已确认':'资料待核对'}));
      main=sec('main','部门内部调整汇总',rows,['company','period','currency','department','transfer','status']);
      sections=[sec('details','部门内部调整明细',details,['id','company','period','currency','department','from','to','transfer','status','evidence'])];
    }else{
      const names={income:'收入',cost:'成本',gross:'毛利',expense:'经营费用',operating:'经营结果'};
      const rows=group(r.rows,['period','currency']).flatMap(xs=>Object.entries(names).map(([key,metric])=>({period:xs[0].period,currency:xs[0].currency,metric,before:xs[0][key],adjustment:xs[1][key],after:xs[2][key],status:xs[1][key]===null?'调整范围或依据未确认':'已确认范围'})));
      main=sec('main','集团调整前后对照',rows,['period','currency','metric','before','adjustment','after','status']);
      const records=q.groupScope==='demoApproved'?r.sections.find(s=>s.key==='elimination').rows.filter(e=>e.approved&&e.evidence&&e.companies.every(c=>b.companies.some(x=>x.company===c))):[];
      const details=records.flatMap(e=>Object.entries(names).map(([key,metric])=>({...e,metric,adjustment:key==='gross'?m.sum([e.income,-e.cost]):key==='operating'?m.sum([e.income,-e.cost,-e.expense]):e[key]})));
      sections=[sec('details','集团调整明细',details,['id','period','currency','metric','adjustment','evidence'])];
    }
    let totals=[];
    if(['companies','departments','expenses'].includes(q.view)) {
      const keys=q.view==='companies'?['period','currency']:['company','period','currency'];
      totals=group(main.rows,keys).filter(xs=>xs.length>1).map(xs=>{
        const out=Object.fromEntries(keys.map(k=>[k,xs[0][k]]));
        Object.assign(out,q.view==='companies'?{company:'所选公司合计'}:q.view==='departments'?{department:q.department?'所选部门合计':'公司核对合计'}:{category:'合计',department:'合计'});
        for(const k of ['income','cost','gross','expense','operating','unassigned','directExpense','sharedExpense','transfer'])if(main.columns.includes(k))out[k]=m.sum(xs.map(x=>x[k]));
        out.status='全部查询结果合计';return out;
      });
    }
    return {...r,rows:main.rows,columns:main.columns,title:main.title,totals,sections};
  }
  const api={query};if(typeof module==='object'&&module.exports)module.exports=api;root.CaesarMonthlyProfitAnalysis=api;
})(typeof window==='object'?window:globalThis);
