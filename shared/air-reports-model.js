/* 只读报表：从当前演示业务记录计算。相同业务编号去重，不回写办理页面。 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AirReports=api;})(typeof window==='undefined'?globalThis:window,function(){
'use strict';
const company='北京凯撒航空服务有限公司',round=n=>Math.round(n*100)/100,num=x=>x!==''&&x!=null&&Number.isFinite(Number(x));
const definitions={
 daily:{name:'BSP日报',basis:'出票／退改交易日期',headers:['交易日期','票号 / 原票号','交易类型','日报 / 来源依据','采购结算额','账期','核对范围'],numeric:[4],cost:true},
 bsp:{name:'日报对账',basis:'交易日期',headers:['交易日期','账期 / 对账单','票号 / 交易号','交易类型','对方金额','系统金额','差额','核对结果'],numeric:[4,5,6],cost:true},
 profit:{name:'团组毛利',basis:'业务结算期间',headers:['结算期间','结算单','团号 / 客户','销售净额','采购净额','测算毛利','确认毛利','结算状态','结算类别 / 原单'],numeric:[3,4,5,6],cost:true},
 balances:{name:'往来明细',basis:'业务出行日期',headers:['业务日期','单据 / 团号','往来方','方向','业务净额','已收付净额','未收付','状态'],numeric:[4,5,6]},
 overdue:{name:'逾期明细',basis:'约定收付日期；截止日计算逾期',headers:['应收付日期','业务单据','往来方 / 团号','计划收付','已确认收付','未收付余额','逾期天数','依据'],numeric:[3,4,5]},
 unsettled:{name:'未提结算',basis:'出行日期',headers:['出行日期','订单号','客户 / 团号','票号','销售净额','采购净额','未提原因'],numeric:[4,5],cost:true},
 invoices:{name:'开收票',basis:'开收票日期（未开收按业务日期）',headers:['业务单据','往来方','开收票方向','业务金额','已开收净额','申请占用','未开收','最后开收日期','已收付净额','款票差异'],numeric:[3,4,5,6,8]},
 seats:{name:'机位使用',basis:'出发日期',headers:['出发日期','采购 / 项目','航班 / 航线','有效座位','已占 / 已售','已出票','实际承运','实际空置','使用率','空置率'],numeric:[3,4,5,6,7]}
};
const unique=(xs,key)=>[...new Map(xs.map(x=>[key(x),x])).values()];
const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
const validPeriod=v=>/^\d{4}-(0[1-9]|1[0-2])$/.test(v||'');
const dailyHeaders=['交易日期','票号 / 原票号','交易类型','导入批次 / 依据','采购结算额','账期 / 对账单','处理结果','订单号 / 团号','金额口径','原金额 / 更正依据'];
const dailyKey=x=>[x.company,x.account,x.currency,x.kind,x.ref,x.date,x.original||''].join('|');
function dailyRows(ctx){
 const data=ctx.m||{orders:[],transactions:[],batches:[]}, sheets=(ctx.r?.sheets||[]).filter(s=>s.kind==='BSP账单'), result=[], groups=new Map();
 const batches=data.batches||[], transactions=data.transactions||[];
 const txKey=r=>[r.type,r.ticket,r.date,r.flight].join('|');
 const attempts=(key,owner)=>batches.filter(b=>!b.company||!owner||b.company===owner).flatMap(b=>b.results.filter(x=>txKey(x.row)===key).map(x=>({batch:b,result:x})));
 function meta(t,r){const o=data.orders.find(o=>o.id===t.order);return {company:t.company||o?.company||'',currency:t.currency||r.currency||o?.currency||'',account:t.account||o?.account||'',partner:o?.supplier||'',group:r.group||o?.group||'',order:t.order||'',source:t.source||o?.source||'',mode:t.mode||''};}
 for(const t of unique(transactions,t=>{const m=meta(t,t.row);return [m.company,m.account,m.currency,t.key].join('|');})){
  const x=t.row, m=meta(t,x), aa=attempts(t.key,m.company), initial=aa.find(a=>a.batch.id===t.batch)||[...aa].reverse().find(a=>!['未应用','重复跳过','跳过','更正已记录'].includes(a.result.state));
  if((m.mode||initial?.batch.mode||'日报')!=='日报'||m.source!=='BSP')continue;
  const date=validDate(x.issuedDate)?x.issuedDate:'', entry={...m,kind:x.type,ref:x.ticket,original:x.original||'',date,t,initial};
  const key=dailyKey({...entry,date:''});if(!groups.has(key))groups.set(key,[]);groups.get(key).push(entry);
 }
 const used=new Set();
 for(const [key,entries] of groups){
  const first={...entries[0],date:entries.every(e=>e.date&&e.date===entries[0].date)?entries[0].date:''}, rr=entries.map(x=>x.t.row), scopes=new Set(rr.map(x=>x.amountScope||'')), values=rr.map(x=>num(x.cost)?Number(x.cost):null);
  let amount=null, scope=entries.length===1?(rr[0].amountScope||'单航段'):'金额口径待核';
  if(entries.length===1)amount=values[0];
  else if(scopes.size===1&&scopes.has('整票')&&values.every(v=>v!==null&&v===values[0])){amount=values[0];scope='整票计一次 · '+entries.length+'段';}
  else if(scopes.size===1&&scopes.has('分段')&&values.every(v=>v!==null)){amount=round(values.reduce((a,v)=>a+v,0));scope='分段相加 · '+entries.length+'段';}
  if(first.kind==='退票'&&amount!==null)amount=-Math.abs(amount);
  if(first.kind==='改签'){amount=null;scope='改签采购增减待核';}
  const matches=[],currentKeys=new Set(entries.map(dailyKey)),oldKeys=new Set(entries.flatMap(e=>(e.t.versions||[]).map(v=>dailyKey({...e,date:validDate(v.row.issuedDate)?v.row.issuedDate:'',ref:v.row.ticket,original:v.row.original,kind:v.row.type}))));
  for(const s of sheets)for(const x of s.system){const sk=dailyKey({company:s.company,currency:s.currency,account:x.account||s.account,kind:x.kind,ref:x.ref,date:x.date,original:x.original});if(currentKeys.has(sk)||oldKeys.has(sk)){used.add(s.id+'|'+x.id);matches.push({...s,matchedAmount:x.amount,matchedDate:x.date});}}
  const refs=[...new Set(matches.map(s=>s.period+' / '+s.id))].join('；')||'未进入对账';
  const changes=entries.flatMap(e=>(e.t.versions||[]).map((v,i)=>'原采购 '+v.row.cost+' → '+(e.t.versions[i+1]?.row.cost??e.t.row.cost)+'；'+(v.basis||e.t.row.changeReason||'依据待补')));
  if(matches.some(s=>s.matchedAmount!==amount||s.matchedDate!==first.date))changes.push('对账仍为 '+[...new Set(matches.map(s=>s.matchedDate+' / '+s.matchedAmount))].join('；'));
  const batchRefs=[...new Set(entries.map(e=>e.t.lastBatch||e.t.batch||attempts(e.t.key,e.company).find(a=>a.result.state==='更正已记录')?.batch.id||e.initial?.batch.id||'历史批次待补'))].join('；');
  const status=[entries.some(e=>e.t.versions?.length)?'更正已记录':entries.some(e=>e.initial?.result.state==='草稿待补')?'草稿待补':'已应用',...(!first.date?['交易日期待核']:[]),...(amount===null?['金额待核']:[]),...(matches.some(s=>s.matchedAmount!==amount||s.matchedDate!==first.date)?['对账引用与当前日报不同']:[])].join('；');
  result.push({...first,id:'IMPORT|'+key,view:'有效交易',cells:[first.date||'待核',first.ref+(first.original?' / '+first.original:''),first.kind,batchRefs,amount,refs,status,[...new Set(entries.map(e=>e.order+(e.group?' / '+e.group:'')))].join('；'),scope,changes.join('；')||'—']});
 }
 // 既有对账样例保留独立来源；只有公司、账户、币种、交易、票号、原票、日期一致才与日报合并。
 const legacy=new Map();
 for(const s of sheets)for(const x of s.system){if(used.has(s.id+'|'+x.id))continue;const date=validDate(x.date)?x.date:'',entry={company:s.company,account:x.account||s.account,currency:s.currency,partner:s.partner,group:x.group||'',kind:x.kind,ref:x.ref,date,original:x.original||''},key=dailyKey(entry);if(!legacy.has(key))legacy.set(key,[]);legacy.get(key).push({s,x,entry});}
 for(const [key,entries]of legacy){const {x,entry}=entries[0],same=entries.every(e=>num(e.x.amount)&&Number(e.x.amount)===Number(x.amount));result.push({...entry,id:'RECON|'+key,view:'有效交易',cells:[entry.date||'待核',x.ref+(x.original?' / '+x.original:''),x.kind,[...new Set(entries.map(e=>e.x.basis||e.s.basis))].join('；'),same?Number(x.amount):null,entries.map(e=>e.s.period+' / '+e.s.id).join('；'),same?'对账来源记录':'同交易金额不一致，待核',x.orderId||x.group||'—','已登记交易金额','—']});}
 for(const batch of batches.filter(b=>b.mode==='日报'))for(const [n,item]of batch.results.entries()){
  const r=item.row,t=transactions.find(t=>{const m=meta(t,t.row);return t.key===txKey(r)&&(!batch.company||m.company===batch.company)&&(!r.currency||m.currency===r.currency)&&(!item.order||t.order===item.order);}),m=meta(t||{order:item.order},r);if(m.source&&m.source!=='BSP')continue;
  const original=item.previous?.cost;
  result.push({...m,company:m.company||batch.company||company,currency:m.currency||r.currency||'待核',id:batch.id+'|'+n,view:'导入记录',date:validDate(r.issuedDate)?r.issuedDate:'',cells:[validDate(r.issuedDate)?r.issuedDate:'待核',r.ticket+(r.original?' / '+r.original:''),r.type,batch.id+' / '+batch.name+' / 第'+(r.sourceRow||n+2)+'行',num(r.cost)?Number(r.cost):null,'不计有效交易汇总',item.state+(item.error?'：'+item.error:''),item.order||t?.order||'未关联订单',r.amountScope||'待确认',r.changeReason?('原采购 '+(original??'见原记录')+'；'+r.changeReason):'—']});
 }
 return result;
}
function profitRows(ctx){
 const {B,C,b,c}=ctx,rows=[];
 for(const s of b.settlements){
  const version=s.versions?.at(-1),confirmed=version&&s.state!=='已作废'?B.total(version.lines):null;
  const actual=s.state==='已结算'&&version?version:null,t=B.total(actual?.lines||s.lines),period=actual?actual.period:s.period;
  const parent=s.parent?b.settlements.find(p=>p.id===s.parent&&p.company===s.company&&p.currency===s.currency):null;
  const scope=s.state==='已作废'?'已作废':s.parent&&(!parent||parent.state==='已作废'||!parent.versions?.length)?'来源待核':s.state==='已结算'?'已确认':'待确认';
  rows.push({id:s.id,date:validPeriod(period)?period+'-01':'',company:s.company,currency:s.currency,partner:s.customer,group:s.group||'',scope,cells:[validPeriod(period)?period:'期间待核',s.id,s.group||s.customer,t.sale,t.cost,t.profit,confirmed?.confirmedProfit??null,s.state,s.parent?'补充调整 / '+s.parent:s.revision?'修订中，确认金额取原版本':'原结算']});
 }
 for(const p of c.projects.filter(p=>p.state!=='筹备中')){
  const v=p.settlement.versions?.at(-1),t=p.settlement.state==='已确认'&&v?v.totals:C.totals(p),period=p.settlement.state==='已确认'&&v?v.period:p.settlement.period;
  rows.push({id:'PROJECT|'+p.id,date:validPeriod(period)?period+'-01':'',company:p.company,currency:p.currency,partner:p.airline,group:'',scope:p.state==='已取消'?'已作废':p.settlement.state==='已确认'?'已确认':'待确认',cells:[validPeriod(period)?period:'期间待核',p.id,p.name,t.sale,t.cost,t.profit,p.settlement.state==='已确认'&&v?t.profit:null,p.state==='已取消'?'已取消':p.settlement.state,'包机项目原结算']});
  // 包机已确认调整按自己的期间列增减，不能反灌原结算月份。
  if(p.state!=='已取消')for(const x of p.adjustments.filter(x=>x.state==='已确认'))rows.push({id:'PROJECT-ADJ|'+x.id,date:validPeriod(x.period)?x.period+'-01':'',company:p.company,currency:p.currency,partner:p.airline,group:'',scope:'已确认',cells:[validPeriod(x.period)?x.period:'期间待核',x.id,p.name,x.saleDelta,x.costDelta,round(x.saleDelta-x.costDelta),round(x.saleDelta-x.costDelta),x.state,'包机补充调整 / '+p.id]});
 }
 return rows;
}
function reportDefinition(kind,filter={}){const d=definitions[kind];return kind==='daily'?{...d,headers:dailyHeaders,numeric:filter.dailyView==='导入记录'?[]:[4]}:d;}

function build(kind,ctx){const {B,F,R,C,I,A,b,f,r,c,a}=ctx;const rows=[];const add=(id,date,currency,partner,group,cells,extra={})=>rows.push({id,date,company,currency,partner,group,cells,...extra});
 if(kind==='daily')rows.push(...dailyRows(ctx));
 if(kind==='bsp')for(const s of r.sheets.filter(x=>x.kind==='BSP账单'))for(const l of R.rows(s)){const x=l.external||l.systems[0];add(s.id+'|'+l.id,x.date,s.currency,s.partner,x.group,[x.date,s.period+' / '+s.id,x.ref,x.kind,l.externalAmount,l.systemAmount,l.delta,l.issue],{company:s.company});}
 if(kind==='profit')rows.push(...profitRows(ctx));
 if(kind==='balances')for(const o of unique(b.orders,x=>x.company+'|'+x.id)){const l=B.lineFrom(b,o),date=o.legs[0]?.date||'';add('AR|'+o.id,date,o.currency,o.customer,o.group,[date,o.id+(o.group?' / '+o.group:''),o.customer,'应收',l.sale,l.received,num(l.sale)&&num(l.received)?round(l.sale-l.received):null,o.state],{order:o.id,company:o.company,direction:'应收'});add('AP|'+o.id,date,o.currency,o.supplier,o.group,[date,o.id+(o.group?' / '+o.group:''),o.supplier,'应付',l.cost,l.paid,num(l.cost)&&num(l.paid)?round(l.cost-l.paid):null,o.state],{cost:true,order:o.id,company:o.company,direction:'应付'});}
 if(kind==='overdue'){const plans=[{order:'HF20261017F01',date:'2026-10-10',amount:6000},{order:'HF20261017F02',date:'2026-10-12',amount:4000}];for(const o of f.orders){let schedule=o.installments?.length?o.installments:plans.filter(p=>p.order===o.id);if(!schedule.length)schedule=[{date:'',amount:F.sale(o)}];let received=F.received(f,o);for(const [n,p]of [...schedule].sort((x,y)=>x.date.localeCompare(y.date)).entries()){const allocated=Math.min(p.amount,received);received-=allocated;add(o.id+'|'+n,p.date,o.currency,o.customer,o.group,[p.date||'待核',o.id,o.customer+(o.group?' / '+o.group:''),p.amount,allocated,round(p.amount-allocated),0,o.installments?.length?'订单分次收款计划':p.date?'演示应收计划，正式账期待确认':'到期约定待补'],{company:o.company,order:o.id,direction:'应收'});}}for(const src of f.sources.filter(x=>x.type!=='航司平台')){const balance=F.sourceBalance(f,src);add('AP|'+src.id,src.date||'',src.currency,src.supplier,src.group,[src.date||'待核',src.id,src.supplier+(src.group?' / '+src.group:''),src.total,balance.paid,round(src.total-balance.paid),0,'供应商付款计划 · '+src.agreement],{company:src.company,direction:'应付',cost:true});}}
 if(kind==='unsettled')for(const o of unique([...b.orders.map(o=>ctx.m?.orders.find(x=>x.id===o.id&&x.state==='已取消')||o),...(ctx.m?.orders||[]).filter(o=>o.state==='已取消')],x=>x.company+'|'+x.id)){const related=b.settlements.filter(s=>s.company===o.company&&s.currency===o.currency&&s.lines.some(l=>l.orderId===o.id)&&!s.parent&&s.kind!=='调整');if(o.state!=='已取消'&&!o.tickets.some(t=>t.state==='已出票')||related.some(s=>s.state!=='已作废'&&(['审核中','已结算'].includes(s.state)||s.versions?.length)))continue;const l=B.lineFrom(b,o),date=o.legs[0]?.date||'';add(o.id,date,o.currency,o.customer,o.group,[date,o.id,o.customer+(o.group?' / '+o.group:''),o.tickets.map(t=>t.ticket).filter(Boolean).join('、'),l.sale,l.cost,o.state==='已取消'&&o.cancellation?.state!=='已确认'?'取消待定损':related.some(s=>s.state==='退回补充')?'结算退回待重提':related.some(s=>s.state==='草稿')?'结算草稿未提交':related.some(s=>s.state==='已作废')?'原结算已作废，待重新提交':'尚未建立结算'],{company:o.company,order:o.id});}
 if(kind==='invoices')for(const s of unique(a.sources,x=>x.company+'|'+x.id)){const balance=A.invoiceBalance(a,s.id),matched=a.invoices.filter(i=>i.state==='已完成'&&i.items.some(x=>x.source===s.id)),last=matched.map(i=>i.issuedDate).sort().at(-1)||s.date;add(s.id,last,s.currency,s.partner,s.group,[s.order,s.partner,s.side==='销项'?'开票':'收票',s.amount-balance.businessRed,balance.issued,balance.pending,balance.available,matched.length?last:'未开收',s.side==='销项'?s.received:s.paid,s.side==='销项'?(balance.issued>s.received?'已开未收款':s.received>balance.issued?'已收款未开票':'款票一致'):(s.paid>balance.issued?'已付款未收票':balance.issued>s.paid?'已收票未付款':'款票一致')],{company:s.company,order:s.order,cost:s.side==='进项'});}
 if(kind==='seats'){for(const p of c.projects)for(const fl of p.flights){const t=C.flightStats(p,fl),actual=fl.state==='已完成'?fl.actual:null;add(p.id+'|'+fl.id,fl.date,p.currency,p.airline,'',[fl.date,p.id+' '+p.name,fl.out+' / '+fl.back,t.qty,t.sold,null,actual,t.empty,actual===null?'待承运':t.qty?round(actual/t.qty*100)+'%':'—',actual===null?'待承运':t.qty?round(t.empty/t.qty*100)+'%':'—'],{company:p.company});}for(const item of ctx.inventory||I.seed()){if(item.type==='包机位')continue;const t=I.stats(item);add(item.id,item.date,item.currency,item.supplier,'',[item.date,item.contractNo||item.id,item.out+' / '+item.back,t.effective,t.occupied,t.issued,null,null,t.effective?round(t.occupied/t.effective*100)+'%':'—','未核承运'],{company:item.company||company});}}
 return unique(rows,x=>x.company+'|'+x.id);
}
function query(kind,rows,filter,role='manager'){const d=reportDefinition(kind,filter);if(!d)throw Error('报表类型不存在');const roleCompany=role==='other'?'上海凯撒旅游':company;if(filter.from&&filter.to&&filter.from>filter.to)throw Error('起始日期不能晚于结束日期');for(const [key,label]of [['from','起始日期'],['to','结束日期'],['asOf','截止日期']])if(filter[key]&&(!/^\d{4}-\d{2}-\d{2}$/.test(filter[key])||!Number.isFinite(Date.parse(filter[key]))||new Date(filter[key]).toISOString().slice(0,10)!==filter[key]))throw Error(label+'无效');const scoped=rows.filter(x=>(role==='superadmin'||x.company===roleCompany)&&(!filter.company||x.company===filter.company)&&(!filter.currency||x.currency===filter.currency)&&(!filter.q||[x.id,x.partner,x.group,...x.cells].join(' ').includes(filter.q))&&(!filter.group||(x.group||'').includes(filter.group))&&(!filter.direction||x.direction===filter.direction)&&(!filter.margin||kind!=='profit'||num(x.cells[5])&&x.cells[5]<0)&&(role!=='sales'||!d.cost&&!x.cost&&x.order==='HF20261017001')&&role!=='admin'&&(kind!=='daily'||x.view===(filter.dailyView||'有效交易'))&&(kind!=='profit'||(filter.profitScope&&filter.profitScope!=='全部有效'?x.scope===filter.profitScope:!['已作废','来源待核'].includes(x.scope))));
 const missingDates=scoped.filter(x=>!validDate(x.date)).length;
 const rs=scoped.filter(x=>(!filter.dateState||filter.dateState==='全部日期'||(filter.dateState==='日期待核'?!validDate(x.date):validDate(x.date)))&&(!(filter.from||filter.to)||validDate(x.date))&&(!filter.from||x.date>=filter.from)&&(!filter.to||x.date<=filter.to)).map(x=>({...x,cells:x.cells.slice()}));
 let result=kind==='overdue'?rs.map(x=>{x.days=x.date?Math.floor((Date.parse(filter.asOf||'2026-10-17')-Date.parse(x.date))/86400000):null;x.cells[6]=x.days===null?null:Math.max(0,x.days);return x;}).filter(x=>x.cells[5]>0&&((filter.aging||'已逾期')==='全部计划'||filter.aging==='到期日待核'?filter.aging==='到期日待核'?x.days===null:true:filter.aging==='未到期'?x.days!==null&&x.days<0:filter.aging==='当日到期'?x.days===0:x.days>0)):rs;
 if(kind==='balances'&&filter.summary&&filter.summary!=='明细'){const groups=new Map();for(const row of result){const label=filter.summary==='按团号'?(row.group||'无团号'):row.partner,key=[row.company,row.currency,row.direction,label].join('|');let item=groups.get(key);if(!item){item={...row,id:key,partner:label,cells:['查询范围','',label,row.direction,0,0,0,'汇总'],count:0};groups.set(key,item);}item.count++;for(const n of [4,5,6])item.cells[n]=num(item.cells[n])&&num(row.cells[n])?round(item.cells[n]+Number(row.cells[n])):null;item.cells[1]=item.count+' 笔单据';}result=[...groups.values()];}
 const totals={};for(const x of result.filter(x=>!['已作废','来源待核'].includes(x.scope)&&x.view!=='导入记录')){const t=totals[x.currency]||=Object.fromEntries(d.numeric.map(n=>[n,{value:0,missing:0}]));for(const n of d.numeric){if(num(x.cells[n]))t[n].value=round(t[n].value+Number(x.cells[n]));else t[n].missing++;}}
 return {kind,headers:['公司','币种',...d.headers],rows:result,totals,filter:{...filter},role,basis:d.basis,missingDates};
}
function csv(result){const cell=x=>{let s=String(x??'待核');if(/^[=+@\t\r-]/.test(s)&&!/^-[\d.]+$/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};const rows=[['航服只读查询',definitions[result.kind].name,'日期口径',result.basis],['查询条件',JSON.stringify(result.filter),'岗位',result.role],result.headers,...result.rows.map(x=>[x.company,x.currency,...x.cells])];return '\ufeff'+rows.map(r=>r.map(cell).join(',')).join('\r\n');}
return {company,definitions,num,round,unique,validDate,validPeriod,reportDefinition,dailyRows,profitRows,build,query,csv};
});
