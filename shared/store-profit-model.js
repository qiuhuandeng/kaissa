(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./monthly-profit-model.js'));
  else root.CaesarStoreProfit=factory(root.CaesarMonthlyProfit);
})(typeof window==='object'?window:globalThis,function(monthly){
  'use strict';
  const known=v=>typeof v==='number'&&Number.isFinite(v),round=v=>Math.round(v*100)/100;
  const sum=xs=>xs.every(known)?round(xs.reduce((n,v)=>n+v,0)):null;
  const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(Date.parse(v))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
  const month=v=>date(v+'-01');
  const group=(rows,keys)=>{const map=new Map();for(const r of rows){const k=JSON.stringify(keys.map(k=>r[k]));if(!map.has(k))map.set(k,[]);map.get(k).push(r);}return [...map.values()];};
  const dedup=rows=>group(rows,['company','currency','id']).map(xs=>({...xs[0],conflict:xs.some(x=>JSON.stringify(x)!==JSON.stringify(xs[0]))}));
  const views={summary:'分润汇总',execution:'结算执行',adjustments:'调整核对'};
  const defaults={view:'summary',start:'2026-09',end:'2026-09',cutoff:'2026-09-30',company:'',store:'',currency:'CNY',order:'',scope:'group'};
  const columns={summary:['company','store','period','currency','base','storeShare','retained','pendingAmount','pendingCount','status'],execution:['id','company','store','period','currency','order','payable','paid','offset','settled','remaining','overpaid','due','difference','status'],adjustments:['id','company','store','period','order','date','reason','rule','newRule','beforeStore','deltaStore','afterStore','deltaBase','deltaCompany','bearer','status']};
  function fixture(){
    const rules=[{id:'示例规则V1',company:'A公司（演示）',store:'软件园门店',start:'2026-09',end:'2026-12',rate:0.6,excludeUpgrade:true,allowNegative:false,approved:true,evidence:'独立算例规则确认，非正式制度'},
      {id:'示例规则V2',company:'A公司（演示）',store:'文灶门店',start:'2026-09',end:'2026-12',rate:0.7,excludeUpgrade:true,allowNegative:false,approved:true,evidence:'独立算例规则确认，非正式制度'},
      {id:'未批准规则',company:'B公司（演示）',store:'青岛门店',start:'2026-09',end:'2026-12',rate:0.65,excludeUpgrade:true,allowNegative:false,approved:false,evidence:''}];
    const charge=(type,amount,bearer='共同',included=false)=>({type,amount,bearer,included,evidence:'独立算例承担确认'});
    const record=(id,extra={})=>({id,company:'A公司（演示）',currency:'CNY',store:'软件园门店',period:'2026-09',order:'KS202609000001',rule:'示例规则V1',revenue:11000,cost:9900,upgradeRevenue:1000,upgradeCost:1000,
      charges:[charge('平台费',100),charge('优惠',0),charge('退款',0)],approved:true,evidence:'独立分润确认依据',confirmedAt:'2026-09-20',due:'2026-09-25',draftAmount:600,expenseId:'',...extra});
    const records=[record('FR202609001',{expenseId:'FEE1'}),record('FR202609002',{store:'文灶门店',rule:'示例规则V2',order:'KS202609000002',revenue:15000,cost:12800,charges:[charge('平台费',200),charge('优惠',0),charge('退款',0)],draftAmount:1400,due:'2026-10-05'}),
      record('FR202609003',{rule:'缺少规则',order:'KS202609000003',draftAmount:500,approved:false,evidence:''}),
      record('FR202609004',{company:'B公司（演示）',store:'青岛门店',rule:'未批准规则',order:'KS202609000004',approved:false,draftAmount:650}),
      record('FR202609005',{order:'KS202609000005',charges:[charge('平台费',100,'待确认'),charge('优惠',0),charge('退款',0)],draftAmount:null,approved:false}),
      record('FR202609006',{currency:'EUR',order:'KS202609000006',revenue:2000,cost:1000,charges:[charge('平台费',0),charge('优惠',0),charge('退款',0)],draftAmount:600})];
    const executions=[{id:'JF202609001',target:'FR202609001',company:'A公司（演示）',currency:'CNY',kind:'付款',amount:200,date:'2026-09-23',state:'成功',evidence:'付款回单示例'},
      {id:'JF202609002',target:'FR202609001',company:'A公司（演示）',currency:'CNY',kind:'抵扣',amount:100,date:'2026-09-24',state:'成功',evidence:'批准抵扣确认示例'},
      {id:'JF202609003',target:'FR202609001',company:'A公司（演示）',currency:'CNY',kind:'付款',amount:300,date:'2026-09-25',state:'失败',evidence:'失败回执示例'},
      {id:'JF202609004',target:'FR202609002',company:'A公司（演示）',currency:'CNY',kind:'付款',amount:1000,date:'2026-09-25',state:'成功',evidence:'付款回单示例'}];
    const adj=(id,extra={})=>({id,target:'FR202609002',company:'A公司（演示）',currency:'CNY',date:'2026-09-27',reason:'退款调整',rule:'示例规则V2',newRule:'示例规则V2',deltaBase:-200,deltaStore:-140,deltaCompany:-60,bearer:'门店/公司按原规则承担',approved:true,evidence:'分润调整确认示例',...extra});
    const adjustments=[adj('TZ202609001'),adj('TZ202609002',{date:'2026-09-28',reason:'优惠承担调整',deltaBase:-100,deltaStore:-70,deltaCompany:-30,approved:false,evidence:'待确认优惠承担'}),
      adj('TZ202609003',{date:'2026-10-02',reason:'重结算调整',deltaBase:100,deltaStore:70,deltaCompany:30})];
    for(const v of [...executions,...adjustments]){const r=records.find(r=>r.id===v.target&&r.company===v.company&&r.currency===v.currency);Object.assign(v,{store:r.store,period:r.period,order:r.order});}
    return {rules,records,executions,adjustments};
  }
  function calculate(r,data,q){
    const issues=[];
    const rules=data.rules.filter(v=>v.id===r.rule&&v.company===r.company&&v.store===r.store&&v.start<=r.period&&v.end>=r.period);
    const rule=rules[0];
    const ruleOK=rules.length===1&&rule.approved&&rule.evidence&&known(rule.rate)&&rule.rate>=0&&rule.rate<=1&&typeof rule.excludeUpgrade==='boolean'&&typeof rule.allowNegative==='boolean';
    if(!ruleOK)issues.push('规则未批准、缺失或范围不符');
    if(r.conflict)issues.push('分润资料冲突');
    const gross=known(r.revenue)&&known(r.cost)?round(r.revenue-r.cost):null;
    if(!known(gross))issues.push('业务收入或成本未提供');
    const charges=r.charges||[];
    const chargesOK=['平台费','优惠','退款'].every(type=>charges.filter(c=>c.type===type).length===1)&&charges.every(c=>['平台费','优惠','退款'].includes(c.type)&&known(c.amount)&&c.amount>=0&&['共同','门店','公司'].includes(c.bearer)&&typeof c.included==='boolean'&&c.evidence&&(!c.included||c.bearer==='共同'));
    if(!chargesOK)issues.push('费用承担或是否已计入待确认');
    const upgrade=known(r.upgradeRevenue)&&known(r.upgradeCost)?round(r.upgradeRevenue-r.upgradeCost):null;
    if(!known(upgrade))issues.push('升舱收入或成本未确认');
    let base=null,calculatedStore=null,calculatedCompany=null;
    if(ruleOK&&!r.conflict&&known(gross)&&chargesOK&&known(upgrade)){
      const fee=bearer=>sum(charges.filter(c=>c.bearer===bearer&&!c.included).map(c=>c.amount));
      base=round(gross-(rule.excludeUpgrade?upgrade:0)-fee('共同'));
      if(base<0&&!rule.allowNegative)issues.push('负基础分配规则待确认');
      else {const split=round(base*rule.rate);calculatedStore=round(split-fee('门店'));calculatedCompany=round(base-split-fee('公司'));}
    }
    const approved=issues.length===0&&r.approved&&r.evidence&&date(r.confirmedAt)&&r.confirmedAt<=q.cutoff;
    if(!approved&&issues.length===0)issues.push('分润结果待确认');
    const amount=known(r.draftAmount)&&r.draftAmount>=0?r.draftAmount:null;
    return {...r,currentRule:r.rule,calculatedBase:base,base,gross,upgrade,calculatedStore,calculatedCompany,originalStore:approved?calculatedStore:null,originalCompany:approved?calculatedCompany:null,storeShare:approved?calculatedStore:null,retained:approved?calculatedCompany:null,
      pendingAmount:approved?0:amount,pendingCount:approved?0:1,approved:!!approved,status:approved?'已确认':issues.join('；'),rate:ruleOK?(rule.rate*100).toFixed(2)+'%':'待确认',
      feeBasis:charges.map(c=>c.type+'：'+(known(c.amount)?c.amount:'未提供')+'／'+c.bearer+'／'+(c.included?'已计入':'未计入')).join('；')};
  }
  function query(input={},supplied){
    const q={...defaults,...input};
    if(!views[q.view]||![q.start,q.end].every(month)||q.start>q.end||!date(q.cutoff)||q.end>q.cutoff.slice(0,7)||q.cutoff>'2026-10-31')throw Error('请选择有效结算月份及资料截止日，示例资料最晚截至2026-10-31');
    if(!['group','company','channel'].includes(q.scope))throw Error('查看范围无效');
    const data=structuredClone(supplied||fixture());
    const allowed=r=>q.scope==='group'||q.scope==='company'&&r.company==='A公司（演示）'||q.scope==='channel'&&r.company==='A公司（演示）'&&r.store==='软件园门店';
    const selected=r=>allowed(r)&&(!q.company||r.company===q.company)&&(!q.store||String(r.store||'').includes(q.store))&&(!q.currency||r.currency===q.currency)&&(!q.order||String(r.order||'').includes(q.order));
    const all=dedup(data.records).filter(selected).map(r=>calculate(r,data,q));
    const adjustmentRows=[];
    for(const r of all){
      for(const v of dedup(data.adjustments).filter(v=>v.target===r.id&&v.company===r.company&&v.currency===r.currency&&date(v.date)&&v.date<=q.cutoff).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id))){
        const beforeStore=r.storeShare;
        const nextRules=data.rules.filter(rule=>rule.id===v.newRule&&rule.company===r.company&&rule.store===r.store&&rule.start<=r.period&&rule.end>=r.period&&rule.approved&&rule.evidence);
        const valid=!v.conflict&&v.approved&&v.evidence&&v.rule===(r.currentRule||r.rule)&&nextRules.length===1&&known(nextRules[0].rate)&&nextRules[0].rate>=0&&nextRules[0].rate<=1&&[v.deltaBase,v.deltaStore,v.deltaCompany].every(known)&&Math.abs(round(v.deltaStore+v.deltaCompany-v.deltaBase))<0.01&&known(beforeStore)&&known(r.retained);
        const row={...v,store:r.store,period:r.period,order:r.order,beforeStore,afterStore:valid?round(beforeStore+v.deltaStore):null,status:!v.approved?'调整待确认':valid?'已确认调整':'调整依据或金额待核对'};
        adjustmentRows.push(row);
        if(!v.approved)r.pendingAdjustment=true;
        if(valid){r.currentRule=v.newRule;r.storeShare=row.afterStore;r.retained=round(r.retained+v.deltaCompany);r.base=known(r.base)?round(r.base+v.deltaBase):null;}
        else if(v.approved){r.storeShare=null;r.retained=null;r.base=null;r.status='已确认调整资料待核对';}
      }
    }
    const orphan=v=>!data.records.some(r=>r.id===v.target&&r.company===v.company&&r.currency===v.currency)&&selected(v);
    adjustmentRows.push(...dedup(data.adjustments).filter(v=>orphan(v)&&date(v.date)&&v.date<=q.cutoff).map(v=>({...v,beforeStore:null,afterStore:null,status:'原分润确认记录缺失'})));
    const records=all.filter(r=>r.period>=q.start&&r.period<=q.end);
    const expenseRows=monthly.query({start:q.start,end:q.end,version:q.cutoff>='2026-10-01'?'corrected':'published',company:'',currency:''}).data.expenses;
    for(const r of records){const e=expenseRows.filter(e=>e.id===r.expenseId&&e.company===r.company&&e.currency===r.currency&&e.period===r.period&&e.profitShareId===r.id);
      r.costReference=e.length===1&&e[0].valid&&e[0].impact===r.storeShare?'已计直接费用，不再扣减':r.expenseId?'费用引用或金额待核对':'分润费用尚未承接';
    }
    let rows,sections=[];
    if(q.view==='summary'){
      rows=group(records,['company','store','period','currency']).map(xs=>({company:xs[0].company,store:xs[0].store,period:xs[0].period,currency:xs[0].currency,
        ...Object.fromEntries(['base','storeShare','retained','pendingAmount','pendingCount'].map(k=>[k,sum(xs.filter(r=>['base','storeShare','retained'].includes(k)?r.approved:true).map(r=>r[k]))])),status:xs.some(r=>!r.approved||!known(r.storeShare))?'包含待确认或缺资料；合计不补零':xs.some(r=>r.pendingAdjustment)?'分润已确认，另有调整待确认':'已确认范围'}));
      sections=[{key:'orders',title:'逐单计算',rows:records.map(r=>({...r,base:r.approved?r.base:null})),columns:['id','company','store','period','currency','order','rule','currentRule','rate','gross','upgrade','feeBasis','calculatedBase','base','originalStore','storeShare','retained','pendingAmount','costReference','status']}];
    }else if(q.view==='adjustments'){
      rows=adjustmentRows.filter(r=>r.date.slice(0,7)>=q.start&&r.date.slice(0,7)<=q.end);
    }else{
      const posts=[];
      rows=records.map(r=>{
        const movements=dedup(data.executions).filter(v=>v.target===r.id&&v.company===r.company&&v.currency===r.currency&&date(v.date)&&v.date<=q.cutoff).map(v=>{
          const success=v.state==='成功',valid=!v.conflict&&known(v.amount)&&v.amount>=0&&v.evidence&&['付款','抵扣','追回','抵扣撤销'].includes(v.kind);
          const applied=v.conflict||!['成功','失败','待执行'].includes(v.state)?null:success?(valid?(v.kind==='追回'||v.kind==='抵扣撤销'?-v.amount:v.amount):null):0;
          return {...v,store:r.store,period:r.period,order:r.order,applied,state:v.conflict?'记录冲突':success&&!valid?'结付依据待核对':v.state};
        });
        posts.push(...movements);
        const paid=sum(movements.filter(v=>['付款','追回'].includes(v.kind)).map(v=>v.applied)),offset=sum(movements.filter(v=>['抵扣','抵扣撤销'].includes(v.kind)).map(v=>v.applied));
        const settled=movements.every(v=>known(v.applied))&&known(paid)&&paid>=0&&known(offset)&&offset>=0?sum([paid,offset]):null;
        const payable=r.approved?r.storeShare:null,difference=known(payable)&&known(settled)?round(payable-settled):null;
        const remaining=known(difference)?Math.max(0,difference):null,overpaid=known(difference)?Math.max(0,-difference):null;
        return {...r,payable,paid,offset,settled,difference,remaining,overpaid,status:!known(difference)?'应付或结付资料待确认':overpaid>0?'超付待追回':remaining===0?'已结清':!date(r.due)?'到期日待提供':r.due<q.cutoff?'已到期待结算':'未到期待结算'};
      });
      const orphans=dedup(data.executions).filter(v=>orphan(v)&&date(v.date)&&v.date<=q.cutoff&&v.period>=q.start&&v.period<=q.end);
      posts.push(...orphans.map(v=>({...v,applied:null,state:'分润确认记录缺失'})));
      rows.push(...orphans.map(v=>({...v,id:v.target,payable:null,paid:null,offset:null,settled:null,remaining:null,overpaid:null,difference:null,status:'结付对应分润确认缺失'})));
      sections=[{key:'payments',title:'结付记录',rows:posts,columns:['id','target','company','store','period','currency','order','date','kind','amount','applied','state','evidence']}];
    }
    return {rows,columns:columns[q.view],sections,title:views[q.view],notice:'示例数据 · 原币元 · 截至 '+q.cutoff+' · 未接正式分润、付款及授权来源'};
  }
  return {query,fixture,defaults,views,columns,sum};
});
