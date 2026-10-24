/* 采购履约核对记录；沿用采购会话，不生成应付、付款或会计记录。 */
(function(root){
  'use strict';
  const P=root.CaesarCruisePurchase, F=root.CruiseFinanceModel;
  const clone=x=>JSON.parse(JSON.stringify(x)), round=n=>Math.round((Number(n)+Number.EPSILON)*100)/100;
  const sum=(rows,key)=>round(rows.reduce((n,r)=>n+Number(r[key]||0),0));
  const key=(kind,id,date)=>[kind,id,date].join('|');
  const stamp=()=>new Date().toLocaleString('sv-SE',{timeZone:'Asia/Shanghai'});
  function contexts(s,kind,id){
    const c=kind==='contracts'?s.contracts.find(x=>x.id===id):P.contractFor(s,s.orders.find(x=>x.id===id),'orders');
    if(!c||c.status!=='已签订')return [];
    if(kind==='contracts'&&(c.scope===P.scopes[2]||c.type==='散位代理'))return s.orders.filter(o=>o.contractId===c.id&&!['草稿','待审批','已退回'].includes(o.status)).flatMap(o=>contexts(s,'orders',o.id));
    const o=kind==='orders'?s.orders.find(x=>x.id===id):null;
    if(o&&['草稿','待审批','已退回'].includes(o.status))return [];
    return (o?[o.voyage]:c.voyages).map(v=>{
      const receipts=s.receipts.filter(r=>r.sourceKind===kind&&r.sourceId===id&&r.voyage.date===v.date&&r.status==='已入库');
      const legacy=receipts.some(r=>r.legacyNo===F.sharedSeed().no), lines=o?o.lines:c.lines;
      return {key:key(kind,id,v.date),kind,id,contractId:c.id,title:c.title,type:c.type,ship:c.ship,supplier:c.supplier,currency:c.currency,date:v.date,back:v.back,voyage:'HC-'+c.ship.toUpperCase()+'-'+v.date.replaceAll('-',''),lines:clone(lines),quantity:sum(lines,'quantity'),received:receipts.reduce((n,r)=>n+sum(r.lines,'accepted'),0),estimate:P.total(lines),legacy,guarantee:c.guarantee,guaranteeRule:c.guaranteeRule,payments:clone(c.payments),scope:c.scope};
    });
  }
  function all(s=P.read()){return s.contracts.flatMap(c=>contexts(s,'contracts',c.id));}
  function context(k,s=P.read()){const c=all(s).find(c=>c.key===k);if(!c)throw Error('采购未生效或未找到对应航次');return c;}
  function defaults(c){
    const old=F.sharedSeed();
    return {key:c.key,version:0,status:'待核对',company:'上海凯撒',currency:c.currency,recognized:c.legacy?20:0,returned:0,
      ticket:sum(c.lines.map(l=>({amount:l.price*l.quantity})),'amount'),port:sum(c.lines.map(l=>({amount:l.tax*l.quantity})),'amount'),fuel:sum(c.lines.map(l=>({amount:l.fuel*l.quantity})),'amount'),other:sum(c.lines.map(l=>({amount:l.other*l.quantity})),'amount'),credit:0,
      loss:0,lossMode:'已含船费',guaranteeAmount:0,guaranteeMode:'已含船费',guaranteeScope:'待核合同范围',guaranteeCount:0,pending:0,pendingReason:'',reference:'船方最终费用核对单（示例）',reason:c.legacy?'采购约定与原共同船费相差240,000元，费用范围待核对':'按船方确认账单核对',
      shares:c.legacy?old.shares.map(x=>({id:x.id,label:x.city,amount:x.amount})):[],groupResults:{},history:[],confirmed:null};
  }
  function get(k,s=P.read()){const c=context(k,s),r=(s.closeouts||[]).find(r=>r.key===k);return clone(r||defaults(c));}
  function total(r){return round(r.ticket+r.port+r.fuel+r.other-r.credit+(r.lossMode==='另计费用'?r.loss:0)+(r.guaranteeMode==='另计费用'?r.guaranteeAmount:0));}
  function facts(c,r){const amount=total(r),allocated=sum(r.shares,'amount'),shortfall=c.type==='保底切舱'&&r.guaranteeScope==='本航次／间'?Math.max(0,r.guaranteeCount-r.recognized):null;
    return {amount,allocated,unassigned:round(amount-allocated),difference:round(amount-c.estimate),unsold:Math.max(0,c.quantity-r.returned-r.recognized),shortfall,receivedGap:c.quantity-c.received};}
  function validate(c,r,confirm){
    for(const k of ['recognized','returned','ticket','port','fuel','other','credit','loss','guaranteeAmount','guaranteeCount','pending'])if(!Number.isFinite(r[k])||r[k]<0)throw Error('数量或金额不正确，原记录未变更');
    if(!Number.isInteger(r.recognized)||!Number.isInteger(r.returned)||r.recognized+r.returned>c.quantity)throw Error('认可销售与已退舱合计超过采购量');
    if(total(r)<0||r.lossMode==='已含船费'&&r.loss>total(r)||r.guaranteeMode==='已含船费'&&r.guaranteeAmount>total(r))throw Error('已含费用或退费金额超过本次船方费用');
    if(!['已含船费','另计费用'].includes(r.lossMode)||!['已含船费','另计费用'].includes(r.guaranteeMode))throw Error('请核对费用是否已含');
    if(new Set(r.shares.map(x=>x.id)).size!==r.shares.length||r.shares.some(x=>!x.id||!Number.isFinite(+x.amount)||+x.amount<0))throw Error('团期承担重复或金额不正确');
    if(confirm&&c.type==='保底切舱'&&r.guaranteeScope==='待核合同范围')throw Error('先明确本航次或打包累计的保底核对范围');
    if(confirm&&c.type==='保底切舱'&&r.guaranteeScope==='打包累计／待结清')throw Error('打包保底尚未结清，请保留待核对，不按单航次确认补差');
    if(confirm&&r.pending>0)throw Error('仍有船方争议或售后费用待核，先保存核对记录');
    if(confirm&&!r.reference.trim())throw Error('请保留船方确认依据');
  }
  function save(k,values,confirm=false){
    const s=P.read(),c=context(k,s),old=get(k,s);
    if(old.status==='已核对')throw Error('核对记录已确认，后补费用从原二次结算办理');
    const r={...old,...clone(values),key:k};validate(c,r,confirm);r.version=old.version+1;r.status=confirm?'已核对':'待核对';
    r.history=[...old.history,{at:stamp(),text:confirm?'确认船方费用及采购差额':'保存采购履约核对',amount:total(r)}];
    if(confirm)r.confirmed={at:stamp(),amount:total(r),reference:r.reference,estimate:c.estimate,shares:clone(r.shares)};
    s.closeouts=s.closeouts||[];const i=s.closeouts.findIndex(x=>x.key===k);if(i<0)s.closeouts.push(r);else s.closeouts[i]=r;P.write(s);return clone(r);
  }
  function sourceForGroup(id,s=P.read()){return all(s).find(c=>get(c.key,s).shares.some(x=>x.id===id));}
  function groupResult(c,r,id){const row=r.groupResults[id];if(row)return clone(row);if(c.legacy){const old=F.sharedSeed().shares.find(x=>x.id===id);if(old)return {id,company:'上海凯撒',currency:'CNY',income:old.locked?450000:700000,cost:old.amount,estimate:old.estimate,costConfirmed:old.status==='已确认',settlement:old.locked?'已结算':'成本复核中',reference:old.evidence,pendingAdjustment:old.locked?20000:0,adjustmentNo:old.locked?'ADJ-CRU-20261121-020':''};}return {id,company:r.company,currency:r.currency,income:null,cost:null,estimate:null,costConfirmed:false,settlement:'待接收',pendingAdjustment:0};}
  function capture(schedule){const s=P.read(),c=sourceForGroup(schedule.id,s);if(!c)return;const record=(s.closeouts||[]).find(r=>r.key===c.key);if(!record)return;
    // Only record the outcome of the original cost action; no derived income or payment.
    record.groupResults[schedule.id]={...groupResult(c,record,schedule.id),cost:Number(schedule.actual),estimate:Number(schedule.estimated),costConfirmed:schedule.items.every(x=>x[5]==='已确认'),settlement:schedule.settlement.status,reference:schedule.items.map(x=>x.attachment||x[6]).join('；')};P.write(s);
  }
  function checkGroup(schedule,amount){const s=P.read(),c=sourceForGroup(schedule.id,s),r=c&&(s.closeouts||[]).find(r=>r.key===c.key);if(!r)return;const f=facts(c,r),a=r.shares.find(x=>x.id===schedule.id);
    if(r.status!=='已核对'||f.unassigned!==0)throw Error('采购费用或各团承担尚未核齐，请回采购履约核对');
    const g=groupResult(c,r,schedule.id),company=schedule.providingCompany||g.company,currency=schedule.items?.find(x=>x.cruiseShared)?.currency||g.currency;
    if(r.company!==company||r.currency!==currency)throw Error('采购核对与本团承担公司或币种不一致，请先核对费用归属');
    if(+amount!==+a.amount)throw Error('本团承担与采购核对不一致，请核对差额；已结算团另办二次结算');
  }
  function mountPayments(groups,requests){const s=P.read(),saved=s.cruisePaymentHandoffs||{groups:[],requests:[]};
    for(const c of s.contracts.filter(c=>c.status==='已签订'))c.payments.forEach((p,i)=>{
      const id='cruise-plan-'+c.id+'-'+i;if(groups.some(g=>g.id===id))return;
      const old=saved.groups.find(g=>g.id===id);
      groups.push(old||{id,cruiseContract:c.id,supplier:c.supplier,account:'船方收款账户（示例，待财务复核）',currency:c.currency,entity:'上海凯撒',contract:c.id,billNo:'合同付款节点 '+(i+1),node:p.name,expectedDate:p.due,status:'待申请',approvalPath:'采购负责人 → 财务复核',items:[{scheduleNo:'',route:c.title,plan:c.scope,fee:p.name,amount:Number(p.amount),applied:0,paid:0}]});
    });
    for(const r of saved.requests)if(!requests.some(x=>x.id===r.id))requests.push(clone(r));
  }
  function capturePayments(groups,requests){const s=P.read(),rows=groups.filter(g=>g.cruiseContract);if(!rows.length)return;const ids=new Set(rows.map(g=>g.id));s.cruisePaymentHandoffs={groups:clone(rows),requests:clone(requests.filter(r=>(r.groupIds||[r.groupId]).some(id=>ids.has(id))))};P.write(s);}
  function paymentRows(contractId,s=P.read()){const c=s.contracts.find(c=>c.id===contractId);if(!c)return [];const saved=s.cruisePaymentHandoffs||{groups:[],requests:[]};return c.payments.map((p,i)=>{const id='cruise-plan-'+c.id+'-'+i,req=saved.requests.find(r=>(r.groupIds||[r.groupId]).includes(id)),item=req?.items.filter(x=>x.groupId===id)||[];return {...p,requested:req?sum(item,'requestAmount'):0,requestNo:req?.id||'',status:req?.status||'待申请',paymentStatus:req?.paymentStatus||'尚无实际付款记录'};});}
  function report(s=P.read()){
    const contexts=all(s).filter(c=>c.legacy||(s.closeouts||[]).some(r=>r.key===c.key)),groups=new Map();
    contexts.forEach(c=>{const r=get(c.key,s),scope=[c.voyage,r.company,r.currency].join('|');if(!groups.has(scope))groups.set(scope,{voyage:c.voyage,date:c.date,back:c.back,company:r.company,currency:r.currency,sources:[],groups:[],gaps:[]});groups.get(scope).sources.push({c,r,f:facts(c,r)});});
    return [...groups.values()].map(v=>{
      const seen=new Set();for(const src of v.sources){if(src.r.status!=='已核对')v.gaps.push(src.c.id+'费用待核');if(src.f.unassigned!==0)v.gaps.push(src.c.id+'分配差额 '+src.f.unassigned);if(!src.r.shares.length)v.gaps.push(src.c.id+'尚未分配到团');if(src.r.pending)v.gaps.push('待核费用 '+src.r.pending);for(const a of src.r.shares){if(seen.has(a.id))continue;seen.add(a.id);v.groups.push({...groupResult(src.c,src.r,a.id),label:a.label});}}
      for(const g of v.groups){if(g.company!==v.company||g.currency!==v.currency)v.gaps.push(g.id+'公司或币种不一致');if(g.income==null)v.gaps.push(g.id+'收入未确认');if(!g.costConfirmed)v.gaps.push(g.id+'成本未确认');}
      const compatible=v.groups.every(g=>g.company===v.company&&g.currency===v.currency);
      const income=v.groups.length&&compatible&&v.groups.every(g=>g.income!=null)?sum(v.groups,'income'):null,cost=v.groups.length&&compatible&&v.groups.every(g=>g.cost!=null)?sum(v.groups,'cost'):null,sourceCost=sum(v.sources.map(x=>({amount:x.f.amount})),'amount');
      if(cost!=null&&cost!==sourceCost)v.gaps.push('各团成本与船方费用差额 '+round(cost-sourceCost));
      const ready=v.groups.length>0&&v.gaps.length===0;return {...v,income,cost,sourceCost,estimate:sum(v.sources.map(x=>({amount:x.c.estimate})),'amount'),pending:sum(v.sources.map(x=>({amount:x.r.pending})),'amount'),pendingAdjustment:sum(v.groups,'pendingAdjustment'),profit:ready?round(income-cost):null,status:ready?'已核齐':'待核齐'};
    });
  }
  root.CruiseCloseout={contexts,all,context,defaults,get,facts,total,save,sourceForGroup,groupResult,capture,checkGroup,report,round,mountPayments,capturePayments,paymentRows};
})(typeof window==='undefined'?globalThis:window);
