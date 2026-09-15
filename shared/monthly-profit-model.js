(function (root) {
  'use strict';
  const rf = typeof module !== 'undefined' && module.exports ? require('./return-finance-model.js') : root.CaesarReturnFinance;
  const known = rf.known, sum = xs => xs.every(known) ? xs.reduce((a,v)=>a+Math.round(v*100),0)/100 : null;
  const defaults = { dataset: 'demo', view: 'companies', start: '2026-09', end: '2026-09', version: 'published', company: '', department: '', currency: 'CNY', product: '', destination: '', type: '', supply: '', channel: '', customer: '', grouping: 'product', budgetVersion: '预算V1', groupScope: 'unapproved' };
  const views = { companies: '公司损益', departments: '部门损益', expenses: '费用构成', budgets: '预算差异', group: '集团调整' };
  const versions = { published: { name: '已发布算例V1', cutoff: '2026-09-30' }, corrected: { name: '更正算例V2', cutoff: '2026-10-31' } };
  function fixture() {
    const completions=[], records=[], expenses=[];
    const channels=['直营门店','加盟门店','呼叫中心'], departments=['直营销售部','加盟渠道部','呼叫中心'], amounts=[100,600,400];
    for(let i=0;i<3;i++) {
      for(const entity of ['A公司（演示）','B公司（演示）']) {
        const a=entity[0]==='A', id=(a?'SA':'PB')+(i+1), department=a?departments[i]:'欧洲产品部';
        completions.push(rf.completion(id,'profit',{order:'ORDER-'+(i+1),product:'欧洲经典组合',actual:'2026-09-20',planned:'2026-09-20',confirmedAt:'2026-09-20',company:entity,productCompany:'B公司（演示）',department,channel:channels[i],customer:!a?'A公司（内部采购付款方）':i===2?'某科技公司（合同付款方）':'个人客户（合同付款方）',customerType:!a?'内部单位':i===2?'企业客户':'个人客户',destination:'欧洲',type:'跟团',supply:a?'集团内部供应':'自营组织',external:a,amount:10000}));
        const rec=(suffix,kind,amount,extra={})=>{
          const r=rf.confirmation(id+suffix,kind,amount,[[id,amount]],{entity,book:entity+'主账簿',date:'2026-09-21',period:'2026-09',effective:'2026-09-21',recorded:'2026-09-21',source:'独立经营贡献确认',evidence:'经营贡献确认'+id,internal:!a,...extra});
          r.allocations.forEach(v=>{v.effective=r.effective;v.recorded=r.recorded;}); records.push(r);return r;
        };
        rec('-SR','income',a?10000:8000);rec('-CB','cost',a?8000:6000);
        if(a) expenses.push({id:'FEE'+i,company:entity,currency:'CNY',period:'2026-09',date:'2026-09-22',recorded:'2026-09-22',category:i===1?'渠道佣金':i===0?'平台服务费':'直接销售费用',amount:amounts[i],department,item:id,approved:true,included:false,evidence:'费用确认FEE'+i,allocations:[]});
      }
    }
    const fee=(id,amount,extra={})=>({id,company:'A公司（演示）',currency:'CNY',period:'2026-09',date:'2026-09-22',recorded:'2026-09-22',category:'管理费用',amount,department:'',item:'',approved:true,included:false,evidence:'费用确认'+id,allocations:[],...extra});
    expenses.push(fee('ADMIN',900,{allocations:departments.map(department=>({department,amount:300,approved:true,evidence:'批准分摊表ALLOC-01'}))}),fee('UNASSIGNED',600),fee('PRODUCT',600,{company:'B公司（演示）',department:'欧洲产品部'}),fee('INCLUDED',200,{category:'公司承担优惠',department:departments[0],item:'SA1',included:true,includedIn:'SA1-SR',evidence:'优惠已包含确认收入，不再扣减'}));
    const late=rf.confirmation('PB1-LATE','cost',500,[['PB1',500]],{entity:'B公司（演示）',book:'B公司（演示）主账簿',source:'独立经营贡献确认',date:'2026-10-05',period:'2026-09',effective:'2026-10-05',recorded:'2026-10-05',adjustment:true,original:'PB1-CB',reason:'9月成本后补确认（更正示例）'});
    const rebate=rf.confirmation('PB1-REBATE','cost',-300,[['PB1',-300]],{entity:'B公司（演示）',book:'B公司（演示）主账簿',source:'独立经营贡献确认',date:'2026-10-10',period:'2026-10',effective:'2026-10-10',recorded:'2026-10-10',adjustment:true,original:'PB1-CB',reason:'次月返点已确认冲减成本，只计本记录'});
    for(const r of [late,rebate]) {r.allocations.forEach(a=>{a.effective=r.effective;a.recorded=r.recorded;});records.push(r);}
    return {completions,records,expenses,coverage:['A公司（演示）','B公司（演示）'].flatMap(company=>['2026-09','2026-10'].map(period=>({company,period,currency:'CNY',income:true,cost:true,expenses:true,evidence:'该月确认范围完整（独立算例）'}))),budgets:['A公司（演示）','B公司（演示）'].flatMap((company,i)=>[{company,currency:'CNY',period:'2026-09',metric:'operating',amount:i?-100:0,version:'预算V1',approved:true,evidence:'预算批准依据（演示）',reason:i?'未提供有依据的差异原因':'费用比预算少600，依据费用差异表F-01'},{company,currency:'CNY',period:'2026-09',metric:'expense',amount:i?600:3200,version:'预算V1',approved:true,evidence:'费用预算批准依据（演示）'}]),transfers:[{id:'MG01',company:'A公司（演示）',currency:'CNY',period:'2026-09',from:'直营销售部',to:'呼叫中心',amount:200,approved:true,evidence:'同法人管理结转批准（演示）'}],eliminations:[{id:'EL01',period:'2026-09',currency:'CNY',companies:['A公司（演示）','B公司（演示）'],income:-24000,cost:-24000,expense:0,approved:true,evidence:'内部采购双方与抵销确认（演示）'}]};
  }
  const identity=r=>JSON.stringify([r.company,r.currency,r.id]);
  function dedup(rows,key=identity){const map=new Map();rows.forEach(r=>{const k=key(r);if(!map.has(k))map.set(k,[]);map.get(k).push(r);});return [...map.values()].map(xs=>({...xs[0],conflict:xs.some(x=>JSON.stringify(x)!==JSON.stringify(xs[0]))}));}
  function build(q,data){
    const cutoff=versions[q.version].cutoff;
    const period=r=>r.period>=q.start&&r.period<=q.end;
    const legal=r=>(!q.company||(r.entity||r.company)===q.company)&&(!q.currency||r.currency===q.currency);
    const ledger=rf.ledger(data,cutoff), flows=ledger.flows.filter(r=>period(r)&&legal(r)), sourceRecords=ledger.records.filter(r=>period(r)&&legal(r));
    const costs=dedup(data.expenses.filter(r=>period(r)&&legal(r)&&r.date<=cutoff&&r.recorded<=cutoff)).map(r=>{
      let valid=!r.conflict&&r.approved&&known(r.amount)&&r.amount>=0&&typeof r.included==='boolean'&&!!r.evidence;
      if(r.included&&!sourceRecords.some(s=>s.id===r.includedIn&&s.entity===r.company&&s.currency===r.currency&&s.valid))valid=false;
      const allocations=r.allocations||[];
      if(allocations.some(a=>!a.approved||!a.evidence||!a.department||!known(a.amount)||a.amount<0)||sum(allocations.map(a=>a.amount))>r.amount||r.department&&allocations.length)valid=false;
      const impact=valid?(r.included?0:r.amount):null;
      const parts=r.department?[{department:r.department,amount:impact,item:r.item}]:allocations.map(a=>({...a,amount:valid?(r.included?0:a.amount):null}));
      const assigned=sum(parts.map(a=>a.amount));
      if(!parts.length||known(impact)&&impact!==assigned)parts.push({department:'未分配费用',amount:known(impact)?sum([impact,-assigned]):null});
      return {...r,impact,parts,valid,status:!valid?'费用或分配资料待核对':r.included?'已含收入/成本，不重复扣减':r.department?'直接归属':allocations.length?'按批准依据分摊':'未分配费用'};
    });
    const coverage=data.coverage.filter(r=>period(r)&&legal(r));
    const groups=dedup([...coverage,...flows.map(r=>({company:r.entity,currency:r.currency,period:r.period})),...costs.map(r=>({company:r.company,currency:r.currency,period:r.period}))],r=>JSON.stringify([r.company,r.currency,r.period]));
    const companies=groups.map(g=>{
      const match=r=>(r.entity||r.company)===g.company&&r.currency===g.currency&&r.period===g.period;
      const cov=coverage.find(match), rs=flows.filter(match), cs=costs.filter(match);
      const bad=sourceRecords.some(r=>match(r)&&!r.valid&&['income','cost'].includes(r.kind))||new Set(rs.map(r=>JSON.stringify([r.book,r.basis]))).size>1;
      const income=cov?.income&&cov.evidence&&!bad?sum(rs.filter(r=>r.kind==='income').map(r=>r.amount)):null;
      const cost=cov?.cost&&cov.evidence&&!bad?sum(rs.filter(r=>r.kind==='cost').map(r=>r.amount)):null;
      const expense=cov?.expenses&&cov.evidence&&cs.every(r=>r.valid)?sum(cs.map(r=>r.impact)):null;
      const gross=known(income)&&known(cost)?sum([income,-cost]):null;
      const operating=known(gross)&&known(expense)?sum([gross,-expense]):null;
      return {company:g.company,currency:g.currency,period:g.period,income,cost,gross,expense,operating,unassigned:sum(cs.flatMap(c=>c.parts.filter(a=>a.department==='未分配费用').map(a=>a.amount))),status:known(operating)?'经营费用范围已提供（非净利润）':'确认或费用范围待补',version:versions[q.version].name};
    });
    const departments=[];
    for(const c of companies){
      const match=r=>(r.entity||r.company)===c.company&&r.currency===c.currency&&r.period===c.period, rs=flows.filter(match), cs=costs.filter(match);
      const names=[...new Set([...rs.map(r=>r.department||'未归属经营责任'),...cs.flatMap(r=>r.parts.map(a=>a.department))])];
      for(const department of names){const values=rs.filter(r=>(r.department||'未归属经营责任')===department), fees=cs.flatMap(r=>r.parts).filter(a=>a.department===department);
        const income=sum(values.filter(r=>r.kind==='income').map(r=>r.amount)),cost=sum(values.filter(r=>r.kind==='cost').map(r=>r.amount)),expense=sum(fees.map(r=>r.amount));
        const transfer=sum(data.transfers.filter(t=>t.company===c.company&&t.currency===c.currency&&t.period===c.period&&t.approved&&t.evidence).map(t=>t.to===department?t.amount:t.from===department?-t.amount:0));
        departments.push({...c,department,income:known(c.income)?income:null,cost:known(c.cost)?cost:null,gross:known(c.gross)?sum([income,-cost]):null,expense:known(c.expense)?expense:null,transfer,operating:known(c.operating)&&known(expense)?sum([income,-cost,-expense,transfer]):null});
      }
    }
    return {companies,departments,expenses:costs,flows,sourceRecords,cutoff};
  }
  function budgetRows(companies,data,q){return companies.flatMap(c=>['operating','expense'].map(metric=>{
    const bs=data.budgets.filter(b=>b.company===c.company&&b.currency===c.currency&&b.period===c.period&&b.metric===metric&&b.version===q.budgetVersion&&b.approved&&b.evidence);
    const budget=bs.length===1&&known(bs[0].amount)?bs[0].amount:null,actual=c[metric];
    return {...c,metric:metric==='operating'?'经营结果':'经营费用',actual,budget,variance:known(actual)&&known(budget)?sum([actual,-budget]):null,budgetVersion:q.budgetVersion,rate:'不适用，按金额差额核对',reason:bs[0]?.reason||'未提供有依据的差异原因',evidence:bs[0]?.evidence};
  }));}
  function query(input,supplied){
    const q={...defaults,...input};
    if(!versions[q.version]||![q.start,q.end].every(v=>rf.validDate(v+'-01'))||q.start>q.end||q.end>versions[q.version].cutoff.slice(0,7))throw new Error('请选择版本资料截止以内的有效会计月份');
    if(q.dataset==='pending')return {rows:[],sections:[],pending:true,notice:'收入成本、费用及批准预算来源待接入'};
    const data=structuredClone(supplied||fixture());if(q.dataset==='gaps')data.coverage=data.coverage.map(r=>({...r,expenses:false}));
    const b=build(q,data), companyCols=['company','period','currency','income','cost','gross','expense','operating','unassigned','status'];
    let rows=q.view==='departments'?b.departments.filter(r=>!q.department||r.department.includes(q.department)):q.view==='expenses'?b.expenses.filter(r=>!q.department||r.department.includes(q.department)||r.parts.some(a=>a.department.includes(q.department))):q.view==='budgets'?budgetRows(b.companies,data,q):b.companies;
    const sections=[{key:'companies',title:'公司核对（未抵销）',rows:b.companies,columns:companyCols},{key:'source',title:'会计确认及调整依据',rows:b.sourceRecords.map(r=>({...r,company:r.entity,kind:rf.kinds[r.kind],status:r.valid?'有效确认':r.gaps.join('；')})),columns:['id','company','period','currency','kind','amount','original','reason','status','evidence']},{key:'expenses',title:'费用确认及分配依据',rows:b.expenses.flatMap(r=>r.parts.map(a=>({...r,department:a.department,allocated:a.amount}))),columns:['id','company','period','currency','category','amount','department','allocated','status','evidence']},{key:'management',title:'内部管理结转依据（公司总额不变）',rows:data.transfers.filter(r=>(!q.company||r.company===q.company)&&r.period>=q.start&&r.period<=q.end&&(!q.currency||r.currency===q.currency)),columns:['id','company','period','currency','from','to','amount','evidence']}];
    if(q.view==='group'){
      const groups=new Map();for(const c of b.companies){const k=c.period+'|'+c.currency;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(c);}
      rows=[...groups.values()].flatMap(cs=>{
        const common={period:cs[0].period,currency:cs[0].currency};
        const raw={...common,scope:'公司未抵销汇总',...Object.fromEntries(['income','cost','expense','operating'].map(k=>[k,sum(cs.map(c=>c[k]))]))};raw.gross=known(raw.income)&&known(raw.cost)?sum([raw.income,-raw.cost]):null;
        const es=data.eliminations.filter(e=>e.period===common.period&&e.currency===common.currency&&e.approved&&e.evidence&&e.companies.every(company=>cs.some(c=>c.company===company)));
        const ready=q.groupScope==='demoApproved'&&es.length>0, adj={...common,scope:ready?'已确认抵销调整（演示）':'抵销范围或依据未确认'};
        for(const k of ['income','cost','expense'])adj[k]=ready?sum(es.map(e=>e[k])):null;
        adj.gross=known(adj.income)&&known(adj.cost)?sum([adj.income,-adj.cost]):null;adj.operating=known(adj.gross)&&known(adj.expense)?sum([adj.gross,-adj.expense]):null;
        const adjusted={...common,scope:'批准范围调整后管理结果（非法定合并报表）'};for(const k of ['income','cost','gross','expense','operating'])adjusted[k]=known(raw[k])&&known(adj[k])?sum([raw[k],adj[k]]):null;
        return [raw,adj,adjusted];
      });
      sections.push({key:'elimination',title:'抵销确认依据（仅演示批准范围启用）',rows:data.eliminations.filter(r=>r.period>=q.start&&r.period<=q.end&&(!q.currency||r.currency===q.currency)&&(!q.company||r.companies.includes(q.company))),columns:['id','period','currency','income','cost','expense','evidence']});
    }
    return {rows,sections,notice:versions[q.version].name+' · 资料截止'+b.cutoff+' · 独立经营算例，非共同业绩或法定净利润',data:b};
  }
  function contribution(input,supplied){
    const q={...defaults,...input};const result=query({...q,view:'companies'},supplied);if(result.pending)return result;
    const b=result.data,data=supplied||fixture();
    const items=data.completions.filter(c=>(!q.company||c.company===q.company)&&['product','destination','type','supply','channel','customer'].every(k=>!q[k]||String(c[k]||'').includes(q[k])));
    const facts=items.map(c=>{
      const fs=b.flows.filter(r=>r.target===c.record&&r.entity===c.company), expenses=b.expenses.filter(e=>e.item===c.record&&e.company===c.company), valid=fs.some(r=>r.kind==='income')&&fs.some(r=>r.kind==='cost')&&expenses.every(e=>e.valid)&&b.companies.filter(r=>r.company===c.company).every(r=>known(r.operating));
      const income=valid?sum(fs.filter(r=>r.kind==='income').map(r=>r.amount)):null,cost=valid?sum(fs.filter(r=>r.kind==='cost').map(r=>r.amount)):null,fees=valid?sum(expenses.map(e=>e.impact)):null;
      return {...c,id:c.record,company:c.company,income,cost,gross:valid?sum([income,-cost]):null,fees,contribution:valid?sum([income,-cost,-fees]):null,commission:sum(expenses.filter(e=>e.category==='渠道佣金').map(e=>e.impact)),platform:sum(expenses.filter(e=>e.category==='平台服务费').map(e=>e.impact)),discount:sum(expenses.filter(e=>e.category==='公司承担优惠').map(e=>e.impact)),direct:sum(expenses.filter(e=>e.category==='直接销售费用').map(e=>e.impact)),external:c.external?'对外销售':'内部供货',status:valid?'扣除已归属直接费用，未扣部门公共费用':'确认或费用范围待补'};
    }).filter(r=>b.flows.some(f=>f.target===r.id));
    const group=q.view==='channel'?'channel':q.grouping;
    const groups=new Map();facts.forEach(r=>{const k=JSON.stringify([r.company,r.currency,r[group]]);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);});
    const rows=[...groups.values()].map(rs=>({company:rs[0].company,currency:rs[0].currency,group:rs[0][group],...Object.fromEntries(['income','cost','gross','fees','contribution','commission','platform','discount','direct'].map(k=>[k,sum(rs.map(r=>r[k]))])),status:rs.some(r=>r.contribution===null)?'确认或费用范围待补':'直接经营贡献（非部门利润）'}));
    return {rows,notice:result.notice,sections:[{key:'contribution',title:'逐销售内容与责任公司依据',rows:facts,columns:['id','order','company','product','destination','type','supply','channel','customer','external','income','cost','commission','platform','discount','direct','contribution','status']},...result.sections.filter(s=>['source','expenses'].includes(s.key))]};
  }
  const api={defaults,views,versions,fixture,build,query,contribution,budgetRows,sum};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.CaesarMonthlyProfit=api;
})(typeof window!=='undefined'?window:globalThis);
