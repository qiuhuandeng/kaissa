(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./finance-funds-model.js'));else root.CaesarFundSummaryPlan=factory(root.CaesarFunds);})(typeof globalThis==='object'?globalThis:this,function(base){
 'use strict';
 const defaults={...base.defaults,view:'periods',frequency:'month',classification:'',status:''};
 const columns={periods:['company','currency','period','nature','category','incoming','outgoing','net','coverage'],plan:['company','currency','period','openingAvailable','plannedIn','plannedOut','restrictionChange','plannedClosing','shortfall','coverage'],unarranged:['id','company','currency','direction','party','due','planned','remaining','status','issue']};
 const detailColumns=['id','date','company','currency','name','nature','category','incoming','outgoing','peerStatus','proof'];
 const planColumns=['id','planned','company','currency','direction','party','remaining','order','purchase','proof'];
 const round=n=>Math.round(n*100)/100,valid=n=>typeof n==='number'&&Number.isFinite(n),sum=(rs,k)=>round(rs.reduce((v,r)=>v+r[k],0));
 const day=(d,n=1)=>{const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10);};
 const dateOK=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
 const key=r=>JSON.stringify([r.company,r.currency]);
 function query(input={},data=base.fixture()){
  const q={...defaults,...input};if(!columns[q.view])throw Error('请选择资金分析主题');
  const planning=q.view!=='periods';
  const source=base.query({...q,view:q.view==='plan'?'plan':'periods',dataset:q.dataset==='pending'?'pending':'gaps',nature:'',keyword:''},data);
  if(source.pending)return {rows:[],sections:[],pending:true,notice:source.notice};
  if(!planning){
   const conflictIds=new Set(),seen=new Map();for(const r of data.flows.filter(r=>r.recorded<=q.cutoff)){if(seen.has(r.id)&&JSON.stringify(seen.get(r.id))!==JSON.stringify(r))conflictIds.add(r.id);else seen.set(r.id,r);}
   const details=source.sections.find(s=>s.key==='flows').rows.map(r=>({...r,category:r.nature==='外部收支'?(r.managementCategory&&r.classificationProof?r.managementCategory:'待分类收支'):r.nature,coverage:conflictIds.has(r.id)?'同号流水冲突，金额待核对':r.nature==='外部收支'&&!(r.managementCategory&&r.classificationProof)?'资金分类待确认':r.peerStatus==='不适用'?'分类有依据':r.peerStatus,...(conflictIds.has(r.id)?{incoming:null,outgoing:null}:{})})).filter(r=>!q.classification||r.category===q.classification);
   const groups=new Map();for(const r of details){const k=JSON.stringify([r.company,r.currency,r.period,r.nature,r.category]);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);}
   const rows=[...groups.values()].map(rs=>{const known=rs.every(r=>valid(r.incoming)&&valid(r.outgoing));return {...rs[0],incoming:known?sum(rs,'incoming'):null,outgoing:known?sum(rs,'outgoing'):null,net:known?round(sum(rs,'incoming')-sum(rs,'outgoing')):null,coverage:[...new Set(rs.map(r=>r.coverage))].join('；')};});
   for(const t of source.totals.filter(t=>t.closing==null)){if(!q.classification||q.classification==='资料待核对')rows.push({company:t.company,currency:t.currency,period:q.start+'～'+q.end,nature:'资料待核对',category:'资料待核对',incoming:null,outgoing:null,net:null,coverage:'资金历史不完整或冲突，不能形成完整收支合计'});}
   return {rows,columns:columns.periods,title:'分类汇总',sections:[{key:'flows',title:'分类流水',rows:details,columns:detailColumns}],notice:'实际资金按公司与原币分列；内部转账、平台提现单列，不纳入集团对外收支。无批准分类依据列待分类，不推会计现金流分类。',pending:false};
  }
  // Deduplicate arrangements before the existing obligation/offset checks. A conflicting id is never scheduled.
  const unique=new Map(),conflicts=new Set();for(const n of data.plans){if(dateOK(n.recorded)&&n.recorded>q.end||dateOK(n.recorded)&&n.recorded>q.cutoff)continue;if(unique.has(n.id)&&JSON.stringify(unique.get(n.id))!==JSON.stringify(n))conflicts.add(n.id);else unique.set(n.id,n);}
  const obligations=new Map();for(const n of unique.values()){if(n.replacedBy||n.gross-n.paid-n.offsetApplied===0)continue;const k=JSON.stringify([n.company,n.currency,n.obligation]);if(!obligations.has(k))obligations.set(k,[]);obligations.get(k).push(n.id);}for(const ids of obligations.values())if(ids.length>1)ids.forEach(id=>conflicts.add(id));
  const clean={...data,plans:[...unique.values()].map(n=>conflicts.has(n.id)?{...n,proof:''}:n)};
  const all=base.query({...q,view:'plan',dataset:'gaps',nature:'',keyword:'',planStart:day(q.end),planEnd:data.planCoverageEnd},clean);
  const pending=[],scheduled=[];
  for(const n of all.planRows){
   const remaining=[n.gross,n.paid,n.offsetApplied].every(v=>valid(v)&&v>=0)?round(n.gross-n.paid-n.offsetApplied):null;
   if(n.inclusion==='已转应付/付款安排，不重计节点'||n.inclusion==='计划期间以外'||remaining===0)continue;
   if(n.inclusion==='纳入计划'){scheduled.push({...n,remaining:round(n.plannedIn+n.plannedOut)});continue;}
   const status=conflicts.has(n.id)?'资料待核对':!dateOK(n.planned)?(dateOK(n.due)&&n.due<q.end?'逾期未排期':'未排期'):n.planned<=q.end?'逾期未执行':'资料待核对';
   pending.push({...n,remaining:remaining!=null&&remaining>=0?remaining:null,status,issue:conflicts.has(n.id)?'同号安排或同一收付义务存在冲突':n.inclusion});
  }
  for(const n of unique.values()){if(data.accounts.some(a=>a.id===n.account&&a.kind==='实际账户')||q.company&&n.company!==q.company||q.currency&&n.currency!==q.currency)continue;pending.push({...n,remaining:null,status:'资料待核对',issue:'实际账户归属缺失，未纳入计划'});}
  if(q.view==='unarranged')return {rows:pending.filter(r=>!q.status||r.status===q.status),title:'待安排收付',columns:columns.unarranged,sections:[],pending:false,notice:'按基准日查未执行义务；无排期及逾期记录不受未来计划期间筛除。未执行金额尚未扣未落实的计划冲抵，资料不足不推零。'};
  const periods=new Map();for(let d=day(q.end);d<=q.planEnd;d=day(d)){const p=base.period(d,q.frequency);if(!periods.has(p))periods.set(p,{period:p,start:d,end:d});periods.get(p).end=d;}
  const rows=[];
  for(const t of all.totals){
   let balance=t.available;
   const ns=scheduled.filter(n=>key(n)===key(t)),waiting=pending.filter(n=>key(n)===key(t));
   for(const p of periods.values()){
    // Split a partially displayed period, carrying every earlier planned cash movement forward.
    const before=ns.filter(n=>n.planned>=p.start&&n.planned<q.planStart&&n.planned<=p.end);
    if(balance!=null)balance=round(balance+sum(before,'plannedIn')-sum(before,'plannedOut'));
    const begin=p.start<q.planStart?q.planStart:p.start;
    const groupChanges=(data.restrictionChanges||[]).filter(r=>r.company===t.company&&r.currency===t.currency);
    const changes=groupChanges.filter(r=>r.company===t.company&&r.currency===t.currency&&dateOK(r.date)&&r.date>=p.start&&r.date<=p.end);
    const changesOK=groupChanges.every(r=>dateOK(r.date))&&changes.every(r=>r.confirmed&&r.proof&&valid(r.amount));
    const priorChanges=changes.filter(r=>r.date<q.planStart);if(balance!=null&&changesOK)balance=round(balance-sum(priorChanges,'amount'));else if(!changesOK)balance=null;
    if(p.end<q.planStart)continue;
    const current=ns.filter(n=>n.planned>=begin&&n.planned<=p.end),plannedIn=sum(current,'plannedIn'),plannedOut=sum(current,'plannedOut'),restrictionChange=changesOK?sum(changes.filter(r=>r.date>=begin),'amount'):null;
    const openingAvailable=balance;balance=balance==null||restrictionChange==null?null:round(balance+plannedIn-plannedOut-restrictionChange);
    rows.push({...t,period:begin===p.end?begin:begin+'～'+p.end,openingAvailable,plannedIn,plannedOut,restrictionChange,plannedClosing:balance,shortfall:balance==null?null:Math.max(0,-balance),coverage:[t.available==null?'基准可用资金缺资料':'按已排期测算',waiting.length?waiting.length+'项待安排/核对，未计入':'',data.planComplete===true?'':'安排资料不完整',!changesOK?'受限变化资料不足':data.restrictionChanges?'已含已知受限变化':'受限沿基准日，未来变化待补'].filter(Boolean).join('；')});
   }
  }
  rows.sort((a,b)=>a.period.localeCompare(b.period)||a.company.localeCompare(b.company,'zh-CN')||a.currency.localeCompare(b.currency));
  return {rows,title:'期间预测',columns:columns.plan,sections:[{key:'arrangements',title:'收付安排明细',rows:scheduled.filter(n=>n.planned>=q.planStart&&n.planned<=q.planEnd),columns:planColumns}],pending:false,notice:'仅按已排期收付预测，不等同全部义务资金保障；待安排收付独立查询。基准日前已执行不重计，计划预付冲抵只减少未来付款。未提供未来受限变化时沿基准日金额，非完整资金承诺。'};
 }
 return {query,defaults,columns};
});
