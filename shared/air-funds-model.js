(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AirFunds=api;})(typeof window==='undefined'?globalThis:window,function(){
'use strict';
const key='caesar-air-funds-v1',company='北京凯撒航空服务有限公司';
const roles={superadmin:{name:'超级管理员',id:'superadmin',kind:'superadmin',company,cost:true,write:true},ticket:{name:'孙丽 · 票务经办',id:'sun',company},finance:{name:'李梅 · 收付会计',id:'li',company},cashier:{name:'刘洋 · 资金出纳',id:'liu',company},supervisor:{name:'王强 · 财务审批',id:'wang',company},other:{name:'其他公司',id:'other',company:'上海凯撒旅游'}};
const copy=x=>JSON.parse(JSON.stringify(x)),round=n=>Math.round((Number(n)+Number.EPSILON)*100)/100,sum=a=>round(a.reduce((n,x)=>n+Number(x),0));
const today=()=>new Date().toISOString().slice(0,10),id=p=>p+Date.now()+Math.random().toString(36).slice(2,7);
function amount(n,positive=true){if(n===''||n==null||!Number.isFinite(Number(n))||Math.abs(Number(n)*100-Math.round(Number(n)*100))>0.00001||Number(n)<0||(positive&&Number(n)===0))throw Error('金额须为'+(positive?'大于零':'非负')+'且最多两位小数');return round(n);}
function date(s){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;}
function get(db,type,n){const x=db[type].find(x=>x.id===n);if(!x)throw Error('记录不存在，请重新选择');return x;}
function access(o,role,allowed){if(role==='superadmin')return;if(!roles[role]||o.company!==roles[role].company||allowed&&!allowed.includes(role))throw Error('当前岗位无权办理本公司此项业务');}
function log(o,text,role){(o.history||(o.history=[])).unshift({text,who:roles[role]?.name||'期初记录',time:new Date().toLocaleString('zh-CN')});}
function scope(rows){if(!rows.length||new Set(rows.map(x=>x.id)).size!==rows.length)throw Error('请选择不重复的业务记录');if(new Set(rows.map(x=>[x.company,x.customer,x.currency].join('|'))).size!==1)throw Error('须为同一收款公司、结算客户及币种');}
function seed(){const orders=[6000,4000,81000,10000].map((sale,i)=>({id:'HF20261017F0'+(i+1),company,currency:'CNY',customer:i===2?'北京凯撒国际旅行社':'华远科技有限公司',carrier:'中国国际航空',supplier:'中国国际航空',source:'航司平台',platformAccount:'P01',group:i===2?'EU20261120001':'',sale,service:0,received:0,terms:i===2?'账期':'现结',state:'待出票',installments:i===2?[{date:'2026-10-18',amount:20000},{date:'2026-10-25',amount:30000},{date:'2026-11-18',amount:31000}]:[],credit:{valid:true,limit:100000,used:10000,until:'2026-12-31'}}));
const receipts=[{id:'HFSK20261017001',company,currency:'CNY',customer:'华远科技有限公司',payer:'华远科技有限公司',amount:10000,ref:'BANK-1017-001',date:'2026-10-17',proof:'银行回单示例001',state:'已到账',history:[]},{id:'HFSK20261017002',company,currency:'CNY',customer:'华远科技有限公司',payer:'王强',amount:8000,ref:'BANK-1017-002',date:'2026-10-17',proof:'第三方转款回单示例002',state:'已到账',history:[]}];
const sources=[['SF01','第三方票代','北京环球票务','随结','AG-20261017-01','尾款',20000,5000,'工商银行 6688',true],['SF02','航司平台','中国国际航空','预充值','CA-B2B-2026','充值',50000,0,'国航平台 P01',true],['SF03','包机协议','海南航空','协议节点','HU-CH-2026','一押',100000,20000,'中国银行 9012',true],['SF04','包机协议','海南航空','协议节点','HU-CH-2026','二押',150000,0,'中国银行 9012',true],['SF05','BSP','国际航协结算组织','账期','BSP-2026-10-03','账期款',92500,0,'BSP结算账户',true],['SF06','第三方票代','北京环球票务','随结','AG-20261017-02','尾款',6000,0,'待审核账户',false]].map(([id,type,supplier,terms,agreement,node,total,paid,account,approved])=>({id,company,currency:'CNY',type,supplier,terms,agreement,node,total,paid,account,approved,date:'2026-10-25',invoice:'成本凭证待补',invoiceRequired:false,checked:type!=='BSP',platform:terms==='预充值'?'P01':'',orderId:id==='SF01'?orders[0].id:'',group:type==='包机协议'?'CH20261212001':'',history:[]}));
const requests=[{id:'HFFK20261017001',company,currency:'CNY',kind:'付款',source:'SF01',amount:5000,state:'审批中',applicant:'sun',basis:'票代确认单 Q-1017',account:'工商银行 6688',agreement:'AG-20261017-01',date:'2026-10-20',history:[]}];
return {version:1,orders,receipts,claims:[],links:[],sources,requests,refunds:[],platforms:[{id:'P01',company,currency:'CNY',supplier:'中国国际航空',name:'国航企业平台 · 北京航服',opening:10000,frozen:0,state:'正常',approved:true,history:[]}],movements:[],credits:[],exceptions:[],creditUses:[]};}
function demoWorkspace(db){
 if(db.workspaceDemoVersion)return db;
 db.workspaceDemoVersion=1;
 // Older trial activity is preserved. Only the pristine example ledger is enriched.
 if(db.claims.length||db.refunds.length||db.movements.length||db.links.length)return db;
 const r=db.receipts.find(x=>x.id==='HFSK20261017001'),third=db.receipts.find(x=>x.id==='HFSK20261017002'),o=db.orders.find(x=>x.id==='HF20261017F01'),p=db.platforms.find(x=>x.id==='P01');
 if(!r||!third||!o||!p||r.amount!==10000||third.amount!==8000||o.sale!==6000||p.opening!==10000||p.frozen||!p.approved||p.state!=='正常'||r.state!=='已到账'||third.state!=='已到账')return db;
 const original=db;db=copy(db);
 try{const c=claim(db,r.id,{lines:[{orderId:o.id,amount:6000}]},'ticket');c.id='HFRK20261017DEMO01';
 const f=refund(db,{receipt:third.id,amount:1000,basis:'演示预收退回：取消未使用票款，按原付款方退回',payee:third.payer,account:'建设银行 5566'},'ticket');f.id='HFTK20261017DEMO01';
 const approved=refund(db,{receipt:r.id,amount:2000,basis:'演示预收退回：多收票款，退回原公司账户',payee:r.payer,account:'工商银行 3322'},'ticket');approved.id='HFTK20261017DEMO02';review(db,'refunds',approved.id,true,'演示审批：原款及退回金额已核对','supervisor');
 const deduction=movement(db,p.id,{kind:'扣款',amount:1200,ref:'CA-DEMO-PAY-001',basis:'演示国航订单扣款回执',orderId:o.id,airlineOrder:'CA-DEMO-1017'},'finance');deduction.id='HFPT20261017DEMO01';
 movement(db,p.id,{kind:'退款回余额',amount:200,ref:'CA-DEMO-REF-001',basis:'演示原扣款部分退回平台余额',original:deduction.id},'finance').id='HFPT20261017DEMO02';
 Object.assign(original,db);
 }catch(_){/* Trial records keep their original values if examples no longer fit. */}
 return original;
}
function load(){try{const x=JSON.parse(sessionStorage.getItem(key));if(x?.version===1){for(const p of x.links||[])for(const l of p.lines||[]){try{const old=JSON.parse(l.signature);if(old.length===6){old.splice(5,0,0);l.signature=JSON.stringify(old);}}catch(_){}}const seedRequest=x.requests.find(r=>r.id==='HFFK20261017001');if(seedRequest&&!seedRequest.account){seedRequest.account='工商银行 6688';seedRequest.agreement='AG-20261017-01';}demoWorkspace(x);collectionExamples(x);save(x);return x;}}catch(_){}const db=demoWorkspace(seed());collectionExamples(db);save(db);return db;}
function save(db){try{sessionStorage.setItem(key,JSON.stringify(db));return true;}catch(_){return false;}}
function syncOrders(db,orders,business){for(const o of orders){if(o.company!==company)continue;const i=db.orders.findIndex(x=>x.id===o.id);if(i<0)db.orders.push(copy(o));else db.orders[i]=copy(o);}if(business)syncAdjustments(db,business);invalidateLinks(db);}
function syncAdjustments(db,business){for(const o of db.orders){const cs=(business.changes||[]).filter(c=>c.orderId===o.id&&c.company===o.company&&c.currency===o.currency&&c.effective);o.adjustmentSale=sum(cs.map(c=>c.saleDelta));o.adjustmentReceived=sum(cs.filter(c=>c.customer.state==='成功').map(c=>c.customer.amount??c.saleDelta));}invalidateLinks(db);}
function sale(o){return o.sale===''?null:sum([o.sale,o.service||0,o.adjustmentSale||0]);}
function received(db,o){return sum([Number(o.received||0),Number(o.adjustmentReceived||0),...db.claims.filter(c=>c.state==='已确认').flatMap(c=>c.lines.filter(l=>l.orderId===o.id).map(l=>l.amount)),-sum(db.refunds.filter(r=>r.orderId===o.id&&r.state==='已完成').map(r=>r.amount))]);}
function due(db,o,exclude=''){const total=sale(o);if(total===null)return null;const pending=sum(db.claims.filter(c=>c.state==='待复核'&&c.id!==exclude).flatMap(c=>c.lines.filter(l=>l.orderId===o.id).map(l=>l.amount)));return Math.max(0,round(total-received(db,o)-pending));}
function receiptAvailable(db,r,exclude=''){return round(r.amount-sum(db.claims.filter(c=>['待复核','已确认'].includes(c.state)&&c.id!==exclude&&c.receipt===r.id).flatMap(c=>c.lines.map(l=>l.amount)))-sum(db.refunds.filter(x=>x.receipt===r.id&&x.fromAdvance&&!['退回补充','已撤回'].includes(x.state)).map(x=>x.amount)));}
function register(db,d,role){
 access({company:d.company},role,['finance','cashier']);const n=amount(d.amount);
 if(!d.payer?.trim()||!d.ref?.trim()||!d.proof?.trim()||!date(d.date)||d.date>today()||!['CNY','USD','EUR'].includes(d.currency))throw Error('请补齐付款方、币种、到账日期、流水号和到账依据');
 if(db.receipts.some(r=>r.company===d.company&&r.ref===d.ref.trim()))throw Error('银行流水号已登记，不可重复到账');
 const account=d.accountId?collectionAccounts().find(a=>a.id===d.accountId&&a.company===d.company&&a.currency===d.currency):null;
 if(d.accountId&&!account)throw Error('收款账户须属于本公司及本币种');
 const r={...copy(d),id:id('HFSK'),amount:n,ref:d.ref.trim(),customer:d.customer?.trim()||'',payer:d.payer.trim(),collectionAccount:account?copy(account):null,state:'已到账',history:[]};
 if(d.collectionId){const p=get(db,'links',d.collectionId);if(p.company!==r.company||p.currency!==r.currency||p.customer!==r.customer||p.method!=='公账转账'||p.collectionAccount?.id!==r.accountId)throw Error('到账资料与原公账收款申请不符');}
 log(r,r.customer?'登记到账，待核对订单或保留客户预收':'登记到账，客户待确认',role);db.receipts.unshift(r);return r;
}
function receiptStatus(db,r){
 const used=db.claims.filter(c=>c.receipt===r.id),refunds=db.refunds.filter(f=>f.receipt===r.id&&f.fromAdvance&&!['退回补充','已撤回'].includes(f.state));
 if(sum(refunds.filter(f=>f.state==='已完成').map(f=>f.amount))===r.amount)return '已退回';
 if(refunds.some(f=>f.state!=='已完成'))return '退款处理中';
 if(refunds.length&&!used.some(c=>c.state==='已确认'))return '部分退回';
 if(!r.customer)return '待确认客户';
 if(used.some(c=>c.state==='待复核'))return '待复核';
 const available=receiptAvailable(db,r);
 if(!available&&refunds.some(f=>f.state!=='已完成'))return '退款处理中';
 if(!available)return '已分配';
 if(available<r.amount)return '部分认领';
 return r.purpose==='客户预收'?'预收待用':'未认领';
}
function collectionReceipts(db,p){return db.receipts.filter(r=>r.collectionId===p.id||r.proof==='演示支付返回 '+p.id);}
function claimCollection(db,c){return Object.hasOwn(c,'collectionId')?c.collectionId:get(db,'receipts',c.receipt).collectionId;}
function collectionReceived(db,p,orderId){
 const ids=new Set(collectionReceipts(db,p).map(r=>r.id));
 return sum(db.claims.filter(c=>(Object.hasOwn(c,'collectionId')?c.collectionId===p.id:ids.has(c.receipt))&&c.state==='已确认').flatMap(c=>c.lines.filter(l=>!orderId||l.orderId===orderId).map(l=>l.amount)));
}
function collectionRemaining(db,p,orderId){const l=p.lines.find(l=>l.orderId===orderId);return l?Math.max(0,round(l.amount-collectionReceived(db,p,orderId))):0;}
// 客户预收只汇总原款；核销与退款占用不生成第二笔到账。
function advanceKey(x){return JSON.stringify([x.company,x.customer,x.currency]);}
function advanceAccounts(db){
 const groups=new Map(),names=['incoming','applied','claimPending','refunded','refundPending','available'];
 for(const r of db.receipts.filter(r=>r.state==='已到账'&&r.customer)){
  const claims=db.claims.filter(c=>c.receipt===r.id),refunds=db.refunds.filter(f=>f.receipt===r.id&&f.fromAdvance&&!['退回补充','已撤回'].includes(f.state));
  const t={receipt:r,incoming:r.amount,applied:sum(claims.filter(c=>c.state==='已确认').flatMap(c=>c.lines.map(l=>l.amount))),claimPending:sum(claims.filter(c=>c.state==='待复核').flatMap(c=>c.lines.map(l=>l.amount))),refunded:sum(refunds.filter(f=>f.state==='已完成').map(f=>f.amount)),refundPending:sum(refunds.filter(f=>f.state!=='已完成').map(f=>f.amount)),available:receiptAvailable(db,r)};
  const key=advanceKey(r),a=groups.get(key)||{id:key,company:r.company,customer:r.customer,currency:r.currency,receipts:[],date:'',...Object.fromEntries(names.map(n=>[n,0]))};
  a.receipts.push(t);a.date=r.date>a.date?r.date:a.date;for(const n of names)a[n]=sum([a[n],t[n]]);groups.set(key,a);
 }
 return [...groups.values()].sort((a,b)=>b.date.localeCompare(a.date)||a.customer.localeCompare(b.customer));
}
function advanceAccount(db,key){const a=advanceAccounts(db).find(a=>a.id===key);if(!a)throw Error('未找到已确认客户的预收记录');return a;}
function advancePlan(db,key,receiptIds,lines){
 const a=advanceAccount(db,key);if(!receiptIds.length||new Set(receiptIds).size!==receiptIds.length)throw Error('请选择不重复的原到账款');
 const sources=receiptIds.map(id=>{const t=a.receipts.find(t=>t.receipt.id===id);if(!t)throw Error('原款须为同一收款公司、客户及币种');return {id,remaining:t.available};});
 const selected=lines.filter(l=>Number(l.amount)!==0);scope(selected.map(l=>get(db,'orders',l.orderId)));
 const plan=[];for(const l of selected){const o=get(db,'orders',l.orderId);let remaining=amount(l.amount);if(advanceKey(o)!==key||['草稿','已取消'].includes(o.state)||due(db,o)===null||remaining>due(db,o))throw Error('订单须属于本客户及币种，且核销不超过可收金额');
  for(const source of sources){const n=Math.min(source.remaining,remaining);if(n>0){plan.push({receipt:source.id,orderId:o.id,amount:n});source.remaining=round(source.remaining-n);remaining=round(remaining-n);}if(!remaining)break;}
  if(remaining>0)throw Error('本次核销超过所选原款可用余额');
 }
 return plan;
}
function advanceUse(db,key,plan,basis,thirdProof,role){
 const draft=copy(db),account=advanceAccount(draft,key);access(account,role,['finance']);if(!plan.length)throw Error('请选择本次核销的订单和金额');
 const pairs=new Set(),batch=id('HFYS'),claims=[];
 for(const line of plan){const pair=JSON.stringify([line.receipt,line.orderId]);if(pairs.has(pair))throw Error('同笔原款与订单的核销明细不能重复');pairs.add(pair);if(advanceKey(get(draft,'receipts',line.receipt))!==key||advanceKey(get(draft,'orders',line.orderId))!==key)throw Error('核销须为同一收款公司、客户及币种');amount(line.amount);}
 for(const receiptId of new Set(plan.map(l=>l.receipt))){
  const c=claim(draft,receiptId,{collectionId:'',lines:plan.filter(l=>l.receipt===receiptId).map(l=>({orderId:l.orderId,amount:l.amount})),thirdProof},role);c.advanceBatch=batch;c.kind='预收核销';reviewClaim(draft,c.id,true,basis||'客户预收核销确认（演示）',role);claims.push(c);log(get(draft,'receipts',receiptId),'客户预收核销 '+sum(c.lines.map(l=>l.amount))+'；核销批次 '+batch,role);
 }
 Object.assign(db,draft);return {id:batch,claims};
}
function identifyReceipt(db,n,customer,basis,role){
 const r=get(db,'receipts',n);access(r,role,['finance']);customer=customer?.trim();
 if(!customer)throw Error('请选择本笔来款的结算客户');
 if(r.customer===customer)return r;
 if(db.claims.some(c=>c.receipt===n&&['待复核','已确认'].includes(c.state))||db.refunds.some(f=>f.receipt===n&&!['退回补充','已撤回'].includes(f.state)))throw Error('本笔已有认款或退款记录，不能直接更换客户');
 if(r.collectionId&&get(db,'links',r.collectionId).customer!==customer)throw Error('客户与原收款申请不符');
 r.customer=customer;log(r,'确认结算客户：'+customer+'；'+(basis||'来款资料核对（演示）'),role);return r;
}
// 原型在一个抽屉确认归属和认款结果，不增加真实审核配置。
function handleReceipt(db,n,d,role){
 const draft=copy(db),r=identifyReceipt(draft,n,d.customer,d.basis,role);
 if(receiptAvailable(draft,r)<=0)throw Error('本笔来款没有可处理余额');
 if(d.collectionId){
  const p=get(draft,'links',d.collectionId);
  if(r.collectionId&&r.collectionId!==p.id)throw Error('原到账已关联其他收款申请');
  if(p.method!=='公账转账'||p.company!==r.company||p.customer!==r.customer||p.currency!==r.currency||p.collectionAccount?.id!==r.accountId)throw Error('收款申请与本笔客户、币种或银行账户不符');
  r.collectionId=p.id;
 }
 if(d.mode==='保留客户预收'){r.purpose='客户预收';log(r,'未分配余额保留客户预收 '+receiptAvailable(draft,r),role);}
 else if(d.mode==='认领订单'){const c=claim(draft,n,{lines:d.lines,thirdProof:d.thirdProof},role);reviewClaim(draft,c.id,true,d.basis||'原型认款确认',role);}
 else throw Error('请选择本次处理方式');
 Object.assign(db,draft);return get(db,'receipts',n);
}
function claimCheck(db,r,d,exclude=''){if(r.state!=='已到账')throw Error('原款尚未确认到账');if(!r.customer)throw Error('请先确认来款客户');const ls=(d.lines||[]).filter(l=>Number(l.amount)!==0);scope(ls.map(l=>get(db,'orders',l.orderId)));if(ls.some(l=>{const o=get(db,'orders',l.orderId);return o.company!==r.company||o.currency!==r.currency||o.customer!==r.customer;}))throw Error('订单公司、客户、币种与原款不符');const total=sum(ls.map(l=>amount(l.amount)));if(total>receiptAvailable(db,r,exclude))throw Error('本次认领超过原款可用余额');const collectionId=Object.hasOwn(d,'collectionId')?d.collectionId:r.collectionId;if(collectionId){const p=get(db,'links',collectionId);if(p.company!==r.company||p.currency!==r.currency||p.customer!==r.customer)throw Error('原款与收款申请不符');if(!['待支付','部分到账','支付失败','结果待查'].includes(p.state))throw Error('原收款申请已关闭、失效或收齐');for(const l of ls){const pending=sum(db.claims.filter(c=>c.state==='待复核'&&c.id!==exclude&&claimCollection(db,c)===p.id).flatMap(c=>c.lines.filter(x=>x.orderId===l.orderId).map(x=>x.amount)));if(Number(l.amount)>round(collectionRemaining(db,p,l.orderId)-pending))throw Error('认领金额超过本申请该订单剩余金额');}}for(const l of ls){const o=get(db,'orders',l.orderId),v=due(db,o,exclude);if(['草稿','已取消'].includes(o.state))throw Error('草稿或已取消订单不可认领');if(v===null||l.amount>v)throw Error('认领金额超过订单待收或订单金额尚未确认');}if(r.payer!==r.customer&&!d.thirdProof?.trim())throw Error('第三方付款须补付款关系核验依据，候选不等于认款');return ls.map(l=>({orderId:l.orderId,amount:amount(l.amount),group:get(db,'orders',l.orderId).group||''}));}
function claim(db,receipt,d,role){const r=get(db,'receipts',receipt);access(r,role,['ticket','finance']);const lines=claimCheck(db,r,d);const c={id:id('HFRK'),company:r.company,currency:r.currency,customer:r.customer,receipt,lines,...(Object.hasOwn(d,'collectionId')?{collectionId:d.collectionId}:{}),thirdProof:d.thirdProof||'',state:'待复核',applicant:roles[role].id,history:[]};log(c,'提交认领，合计 '+sum(lines.map(l=>l.amount)),role);db.claims.unshift(c);return c;}
function reviewClaim(db,n,approve,reason,role){const c=get(db,'claims',n);access(c,role,['finance']);if(c.state!=='待复核')throw Error('仅待复核认款可以审核');if(!reason?.trim())throw Error('请填写复核意见');if(approve)claimCheck(db,get(db,'receipts',c.receipt),c,c.id);c.state=approve?'已确认':'退回补充';log(c,(approve?'确认认款：':'退回认款：')+reason,role);const receipt=get(db,'receipts',c.receipt);const collectionId=claimCollection(db,c);if(approve&&collectionId){const p=get(db,'links',collectionId);p.received=collectionReceived(db,p);p.state=p.received>=sum(p.lines.map(l=>l.amount))?'已收齐':'部分到账';log(p,'到账认款 '+sum(c.lines.map(l=>l.amount))+'；原流水 '+receipt.ref,role);}invalidateLinks(db);return c;}
function signature(o){return JSON.stringify([o.company,o.customer,o.currency,o.sale,o.service,o.adjustmentSale||0,o.state==='已取消']);}
function invalidateLinks(db,now=Date.now()){for(const p of db.links){if(['已收齐','已关闭','已失效','已过期','结果待查'].includes(p.state))continue;if(p.lines.some(l=>{const o=db.orders.find(o=>o.id===l.orderId);return !o||signature(o)!==l.signature;}))p.state='已失效';else if(Date.parse(p.until)<now)p.state='已过期';}}
function collectionExamples(db){
 if(db.collectionDemoVersion)return db;
 db.collectionDemoVersion=1;
 const account=collectionAccounts()[0];
 for(const r of db.receipts.filter(r=>['HFSK20261017001','HFSK20261017002'].includes(r.id))){
  if(!r.collectionAccount){r.accountId=account.id;r.collectionAccount=copy(account);r.summary=r.customer===r.payer?'票款预付（演示）':'客户委托代付票款（演示）';}
 }
 if(!db.receipts.some(r=>r.id==='HFSKDEMO-UNKNOWN'))db.receipts.push({id:'HFSKDEMO-UNKNOWN',company,currency:'CNY',customer:'',payer:'周女士（演示付款方）',amount:3200,ref:'DEMO-BANK-UNCLAIMED',date:today(),proof:'待核来款回单（演示）',summary:'机票款，客户归属待确认',accountId:account.id,collectionAccount:copy(account),state:'已到账',history:[]});
 for(const [orderId,method,n] of [['HF20261017F02','支付链接',2000],['HF20261017F03','公账转账',20000],['HF20261017F04','二维码',2500]]){
  const o=db.orders.find(o=>o.id===orderId);
  if(!o||o.company!==company||o.currency!=='CNY'||['草稿','已取消'].includes(o.state)||due(db,o)<n||db.links.some(p=>p.lines.some(l=>l.orderId===o.id)))continue;
  const p=createLink(db,[o.id],new Date(Date.now()+86400000).toISOString(),'superadmin',{method,accountId:account.id,node:method==='公账转账'?'一押':'票款',remark:'默认演示资料',lines:[{orderId:o.id,amount:n}]});
  p.id='HFZFDEMO-'+orderId.slice(-3);
  if(method==='支付链接'&&!db.receipts.some(r=>r.ref==='DEMO-PARTIAL-1000'))payResult(db,p.id,{result:'成功',amount:1000,ref:'DEMO-PARTIAL-1000',lines:[{orderId:o.id,amount:1000}]},'superadmin');
 }
 return db;
}
function collectionAccounts(){return [
 {id:'AF-CNY-01',company,currency:'CNY',name:'航服人民币收款户（演示）',bank:'中国建设银行',number:'演示尾号 6601'},
 {id:'AF-CNY-02',company,currency:'CNY',name:'航服票款收款户（演示）',bank:'中国银行',number:'演示尾号 9018'},
 {id:'AF-USD-01',company,currency:'USD',name:'航服美元收款户（演示）',bank:'中国银行',number:'演示尾号 8802'},
 {id:'AF-EUR-01',company,currency:'EUR',name:'航服欧元收款户（演示）',bank:'中国银行',number:'演示尾号 8803'}];}
function createLink(db,ids,until,role,request={}){const os=ids.map(n=>get(db,'orders',n));scope(os);os.forEach(o=>access(o,role,['ticket','finance']));const method=request.method||'支付链接',online=method!=='公账转账';if(!['支付链接','二维码','公账转账'].includes(method))throw Error('请选择收款方式');if(online&&(!until||!Number.isFinite(Date.parse(until))||Date.parse(until)<=Date.now()))throw Error('有效期须晚于当前时间');if(os.some(o=>['草稿','已取消'].includes(o.state)||due(db,o)===null||due(db,o)<=0))throw Error('存在草稿、已取消、未定价或无待收订单');invalidateLinks(db);if(db.links.some(p=>['待支付','部分到账','结果待查','支付失败'].includes(p.state)&&p.lines.some(l=>ids.includes(l.orderId))))throw Error('所选订单已有有效收款申请，请先查看原申请');const account=request.accountId?collectionAccounts().find(a=>a.id===request.accountId&&a.company===os[0].company&&a.currency===os[0].currency):null;if(request.method&&!account)throw Error('请选择本公司同币种收款账户');const lines=os.map(o=>{const raw=request.lines?.find(l=>l.orderId===o.id)?.amount;const n=raw===undefined?due(db,o):amount(raw);if(n>due(db,o))throw Error('申请金额超过订单可申请余额');return {orderId:o.id,amount:n,signature:signature(o)};});const p={id:id('HFZF'),company:os[0].company,customer:os[0].customer,currency:os[0].currency,until:online?until:'',state:'待支付',method,collectionAccount:account?copy(account):null,node:request.node||'票款',remark:request.remark||'',createdAt:new Date().toLocaleString('zh-CN'),createdDate:today(),lines,received:0,history:[]};log(p,'提交'+method+'收款申请；未增加实际收款',role);db.links.unshift(p);return p;}
function closeLink(db,n,role){const p=get(db,'links',n);access(p,role,['ticket','finance']);if(p.state==='结果待查')throw Error('请先查明在途支付结果');if(!['待支付','部分到账','支付失败'].includes(p.state))throw Error('当前支付请求不可关闭');p.state='已关闭';log(p,'关闭未收余款请求，已有收款保留',role);}
function payResult(db,n,d,role){const p=get(db,'links',n);access(p,role,['finance']);invalidateLinks(db);if(!['待支付','部分到账','支付失败','结果待查'].includes(p.state))throw Error('请求已失效、过期、关闭或收齐，不能继续支付');if(p.state==='结果待查'&&!d.query)throw Error('结果未知须先查询，不能重新发起');if(!['成功','失败','结果待查'].includes(d.result)||!d.ref?.trim())throw Error('请选择结果并填写查证回执');if(d.result!=='成功'){p.state=d.result==='失败'?'支付失败':'结果待查';log(p,'演示支付返回 '+d.result+'：'+d.ref,role);return;}
const total=amount(d.amount),ls=(d.lines||[]).filter(l=>Number(l.amount)>0);if(sum(ls.map(l=>amount(l.amount)))!==total)throw Error('逐单分配合计须等于本次到账');if(total>round(sum(p.lines.map(l=>l.amount))-p.received))throw Error('到账超过本请求剩余金额');for(const l of ls){if(!p.lines.some(x=>x.orderId===l.orderId))throw Error('分配订单不属于本收款请求');if(Number(l.amount)>collectionRemaining(db,p,l.orderId))throw Error('到账分配超过本申请该订单剩余金额');}const r={id:id('HFSK'),company:p.company,customer:p.customer,payer:p.customer,currency:p.currency,amount:total,date:today(),ref:d.ref,proof:'演示支付返回 '+p.id,collectionId:p.id,accountId:p.collectionAccount?.id||'',collectionAccount:p.collectionAccount?copy(p.collectionAccount):null,summary:p.node+' · '+p.id,state:'已到账',history:[]};if(db.receipts.some(x=>x.company===r.company&&x.ref===r.ref))throw Error('到账回执已存在');const verified=claimCheck(db,r,{lines:ls});db.receipts.unshift(r);db.claims.unshift({id:id('HFRK'),company:r.company,currency:r.currency,customer:r.customer,receipt:r.id,lines:verified,state:'已确认',applicant:roles[role].id,history:[{text:'按本次明确分配确认演示支付款',who:roles[role].name,time:new Date().toLocaleString('zh-CN')}]});p.received=round(p.received+total);p.state=p.received===sum(p.lines.map(l=>l.amount))?'已收齐':'部分到账';log(p,'到账 '+total+'；分配 '+ls.map(l=>l.orderId+' '+l.amount).join('、'),role);return r;}
function sourceBalance(db,s,exclude=''){const requests=db.requests.filter(r=>r.source===s.id&&r.id!==exclude);const paid=sum([s.paid,...requests.filter(r=>r.state==='已完成').map(r=>r.amount),-sum(requests.flatMap(r=>(r.returns||[]).map(x=>x.amount)))]);const occupied=sum(requests.filter(r=>['审批中','待执行','执行失败','结果待查'].includes(r.state)).map(r=>r.amount));return {paid,occupied,available:Math.max(0,round(s.total-paid-occupied))};}
function recommend(s){return s.terms==='预充值'?'平台充值':s.terms==='账期'?'账期付款':s.terms==='协议节点'?'协议预付':'即时付款';}
function syncInvoiceConditions(db,invoices){if(!invoices)return;for(const s of db.sources){const cost=invoices.sources.find(x=>x.side==='进项'&&x.procurement===s.id);if(!cost)continue;const same=cost.company===s.company&&cost.partner===s.supplier&&cost.currency===s.currency&&cost.amount===s.total;const total=same?sum(invoices.invoices.filter(i=>i.company===s.company&&i.partner===s.supplier&&i.currency===s.currency&&i.side==='进项'&&i.state==='已完成').flatMap(i=>i.items.filter(x=>x.source===cost.id).map(x=>i.kind==='红字'?-x.amount:x.amount))):0;s.invoice=total===s.total?'已核验':total>0?'部分收票 '+total+' / '+s.total:'成本凭证待补';}}
function accountRecords(db){if(!db.supplierAccounts)db.supplierAccounts=[
 {id:'AIR-ACC-HU-CNY',company,supplier:'海南航空',currency:'CNY',name:'海南航空',bank:'中国银行',account:'中国银行 9012',state:'财务已审核',version:1,basis:'脱敏演示财务账户档案 HU-2026-01'},
 {id:'AIR-ACC-AG-CNY',company,supplier:'北京环球票务',currency:'CNY',name:'北京环球票务',bank:'工商银行',account:'工商银行 6688',state:'财务已审核',version:1,basis:'脱敏演示财务账户档案 AG-2026-01'},
 {id:'AIR-ACC-HU-PENDING',company,supplier:'海南航空',currency:'CNY',name:'海南航空',bank:'待核银行',account:'变更账户 7788',state:'待财务审核',version:1,basis:'供应商新账户资料，尚未核准'}
 ];return db.supplierAccounts;}
function accountSignature(a){return JSON.stringify([a.company,a.supplier,a.currency,a.name,a.bank,a.account,a.state,a.version]);}
function accountCandidates(db,sid,r){const s=get(db,'sources',sid);access(s,r,['ticket','finance']);return accountRecords(db).filter(a=>a.company===s.company&&a.supplier===s.supplier&&a.currency===s.currency);}
function accountReady(db,s){if(!s.approved)return false;if(!s.accountId)return true;const a=accountRecords(db).find(a=>a.id===s.accountId);return !!a&&a.state==='财务已审核'&&a.company===s.company&&a.supplier===s.supplier&&a.currency===s.currency&&a.account===s.account&&accountSignature(a)===s.accountBasis;}
function selectAccount(db,sid,aid,basis,r){const s=get(db,'sources',sid);access(s,r,['finance']);const a=accountCandidates(db,sid,r).find(x=>x.id===aid);if(!a||a.state!=='财务已审核')throw Error('须选择本公司、同供应商、同币种的财务已审核账户');if(!basis?.trim())throw Error('请填写本次收款账户核对依据');if(db.requests.some(x=>x.source===sid&&['待执行','执行失败','结果待查'].includes(x.state)))throw Error('本依据已有批准或待查款项，请先核对原执行结果；不能直接更换账户');const old=s.account;Object.assign(s,{accountId:a.id,account:a.account,approved:true,accountBasis:accountSignature(a)});log(s,'引用已审账户 '+old+' → '+a.account+'；'+basis+'；财务档案：'+a.basis,r);return s;}
function request(db,d,role,resubmit=''){const s=get(db,'sources',d.source);access(s,role,['ticket','finance']);const n=amount(d.amount);if(!accountReady(db,s))throw Error('供应商收款账户尚未通过财务审核或资料已变更，请由财务核对已审账户');if(!s.checked)throw Error('本账期账单尚未核验，不能申请付款');if(s.invoiceRequired&&s.invoice!=='已核验')throw Error('按本协议需先核验成本凭证');if(n>sourceBalance(db,s,resubmit).available)throw Error('申请超过扣除已付及在途后的可申请金额');if(!date(d.date)||!d.basis?.trim())throw Error('请填写付款日期和协议／成本依据');let r=resubmit?get(db,'requests',resubmit):null;if(r&&(!['退回补充','已撤回'].includes(r.state)||(role!=='superadmin'&&r.applicant!==roles[role].id)||r.source!==s.id))throw Error('仅申请人可重提原退回申请');r=r||{id:id('HFFK'),company:s.company,currency:s.currency,kind:'付款',applicant:roles[role].id,history:[]};Object.assign(r,{source:s.id,amount:n,date:d.date,basis:d.basis,state:'审批中',account:s.account,accountBasis:s.accountBasis||'',agreement:s.agreement});if(!resubmit)db.requests.unshift(r);log(r,(resubmit?'重提':'提交')+recommend(s)+'申请；未增加实付',role);return r;}
function refundAvailable(db,r,orderId,exclude=''){const allocated=sum(db.claims.filter(c=>c.receipt===r.id&&c.state==='已确认').flatMap(c=>c.lines.filter(l=>l.orderId===orderId).map(l=>l.amount)));const used=sum(db.refunds.filter(x=>x.receipt===r.id&&x.orderId===orderId&&x.id!==exclude&&!['退回补充','已撤回'].includes(x.state)).map(x=>x.amount));return Math.max(0,round(allocated-used));}
function refund(db,d,role,resubmit=''){const r=get(db,'receipts',d.receipt);access(r,role,['ticket','finance']);const n=amount(d.amount);const available=d.orderId?refundAvailable(db,r,d.orderId,resubmit):receiptAvailable(db,r,resubmit);if(n>available)throw Error('退款超过原款可退余额或已有退款占用');if(!d.basis?.trim()||!d.account?.trim()||!d.payee?.trim())throw Error('退款须填写批准退改／预收退回依据及收款人账户');if(d.payee!==r.payer)throw Error('本演示按原付款方退回，其他收款人须另行批准');let x=resubmit?get(db,'refunds',resubmit):null;if(x&&(!['退回补充','已撤回'].includes(x.state)||(role!=='superadmin'&&x.applicant!==roles[role].id)||x.receipt!==r.id))throw Error('仅申请人可重提原退回退款');x=x||{id:id('HFTK'),company:r.company,currency:r.currency,customer:r.customer,kind:'退款',applicant:roles[role].id,history:[]};Object.assign(x,{receipt:r.id,orderId:d.orderId||'',fromAdvance:!d.orderId,amount:n,basis:d.basis,payee:d.payee,account:d.account,state:'审批中'});if(!resubmit)db.refunds.unshift(x);log(x,(resubmit?'重提':'提交')+'原款退款申请',role);return x;}
function review(db,type,n,yes,reason,role){const r=get(db,type,n);access(r,role,['supervisor']);if(!['requests','refunds','exceptions'].includes(type)||r.state!=='审批中')throw Error('当前记录不在审批中');if(role!=='superadmin'&&roles[role].id===r.applicant)throw Error('申请人不能自审');if(!reason?.trim())throw Error('请填写审批意见');if(yes&&type==='requests'){const s=get(db,'sources',r.source);if(!accountReady(db,s)||!s.checked||s.invoiceRequired&&s.invoice!=='已核验'||r.amount>sourceBalance(db,s,r.id).available||r.account!==s.account||r.accountBasis&&r.accountBasis!==s.accountBasis||r.agreement!==s.agreement)throw Error('金额、已核账户或协议发生变化，请退回重提');}r.state=yes?(type==='exceptions'?'已批准':'待执行'):'退回补充';log(r,(yes?'批准：':'退回：')+reason,role);return r;}
function withdraw(db,type,n,role){const r=get(db,type,n);access(r,role,['ticket','finance']);if((role!=='superadmin'&&r.applicant!==roles[role].id)||r.state!=='审批中')throw Error('仅申请人可撤回尚未批准申请');r.state='已撤回';log(r,'撤回，释放本次占用',role);}
function execute(db,type,n,d,role){const r=get(db,type,n);access(r,role,['cashier']);if(!['requests','refunds'].includes(type)||!['待执行','执行失败','结果待查'].includes(r.state))throw Error('仅已批准未完成的款项可以执行');if(r.state==='结果待查'&&!d.query)throw Error('结果未知先查询，禁止重复付款');if(!['成功','失败','结果待查'].includes(d.result)||!d.ref?.trim())throw Error('请选择执行结果并填写回执或失败原因');if(d.result==='成功'&&[...db.requests,...db.refunds].some(x=>x.id!==r.id&&x.ref===d.ref&&x.state==='已完成'))throw Error('成功回执已存在');if(type==='requests'){const s=get(db,'sources',r.source);if(!accountReady(db,s)||!s.checked||s.invoiceRequired&&s.invoice!=='已核验'||r.account!==s.account||r.accountBasis&&r.accountBasis!==s.accountBasis||r.agreement!==s.agreement||r.amount>sourceBalance(db,s,r.id).available)throw Error('执行前账户、协议或可付金额复核不通过');}
if(type==='requests'&&d.result==='成功'){const s=get(db,'sources',r.source);if(s.platform)movement(db,s.platform,{kind:'充值',amount:r.amount,ref:'付款 '+r.id,basis:d.ref},role,true);}
r.state=d.result==='成功'?'已完成':d.result==='失败'?'执行失败':'结果待查';r.ref=d.ref;log(r,(d.query?'查询结果':'执行结果')+'：'+d.result+' · '+d.ref,role);return r;}
function paymentReturn(db,n,d,role){const r=get(db,'requests',n);access(r,role,['finance','cashier']);if(r.state!=='已完成')throw Error('仅已完成付款可登记实际退回');if(get(db,'sources',r.source).platform)throw Error('平台充值退款请在平台账户办理退回银行');const nAmount=amount(d.amount);if(nAmount>round(r.amount-sum((r.returns||[]).map(x=>x.amount))))throw Error('退回超过原付款未退余额');if(!d.ref?.trim()||!d.basis?.trim()||!date(d.date))throw Error('请填写退回到账流水、日期和原因');if(db.requests.some(x=>(x.returns||[]).some(t=>t.ref===d.ref)))throw Error('该退回流水已登记');(r.returns||(r.returns=[])).push({...copy(d),amount:nAmount});log(r,'原付款退回到账 '+nAmount+'；原付款保留',role);}
function platformBalance(db,a){return sum([a.opening,...db.movements.filter(m=>m.account===a.id).map(m=>['充值','退款回余额'].includes(m.kind)?m.amount:-m.amount)]);}
function movement(db,n,d,role,internal=false){const a=get(db,'platforms',n);access(a,role,internal?['finance','cashier']:['finance']);if(!a.approved||a.state!=='正常')throw Error('平台账户尚未审核或已停用');const v=amount(d.amount);if(!['充值','扣款','退款回余额','退回银行'].includes(d.kind)||!d.ref?.trim()||!d.basis?.trim())throw Error('请填写变动类型、平台交易号及依据');if(d.kind==='充值'&&!internal)throw Error('充值须从付款申请经批准执行后入账');if(db.movements.some(m=>m.account===n&&m.ref===d.ref))throw Error('平台交易号重复');if(['扣款','退回银行'].includes(d.kind)&&v>round(platformBalance(db,a)-a.frozen))throw Error('平台可用余额不足');if(d.kind==='扣款'){const o=get(db,'orders',d.orderId);if(o.company!==a.company||o.currency!==a.currency)throw Error('订单公司或币种与平台账户不符');if(o.source&&o.source!=='航司平台'||o.carrier&&o.carrier!==a.supplier||o.platformAccount&&o.platformAccount!==n)throw Error('订单采购来源、承运航司或平台账户不符');if(!d.airlineOrder?.trim())throw Error('扣款须关联航司订单号');}if(d.kind==='退款回余额'){const p=get(db,'movements',d.original);if(p.account!==n||p.kind!=='扣款'||v>round(p.amount-sum(db.movements.filter(m=>m.original===p.id).map(m=>m.amount))))throw Error('退款须对应本账户原扣款且不超过未退金额');}const m={...copy(d),original:d.kind==='退款回余额'?d.original:'',orderId:d.kind==='扣款'?d.orderId:d.kind==='退款回余额'?get(db,'movements',d.original).orderId:'',airlineOrder:d.kind==='扣款'?d.airlineOrder:'',id:id('HFPT'),account:n,company:a.company,currency:a.currency,amount:v,date:today()};db.movements.push(m);log(a,d.kind+' '+v+' · '+d.ref,role);return m;}
function reconcile(db,n,balance,proof,role){const a=get(db,'platforms',n);access(a,role,['finance']);amount(balance,false);if(!proof?.trim())throw Error('请填写平台余额核对依据');a.reconciliation={balance:Number(balance),book:platformBalance(db,a),difference:round(Number(balance)-platformBalance(db,a)),proof,date:today()};log(a,'核对平台余额，差额 '+a.reconciliation.difference+'；不强行调整账面余额',role);}
function credit(db,o){return db.credits.find(c=>c.company===o.company&&c.customer===o.customer&&c.currency===o.currency)||{company:o.company,customer:o.customer,currency:o.currency,terms:o.terms==='账期'?'月结':o.terms,valid:!!o.credit?.valid,from:'2026-01-01',until:o.credit?.until||'',limit:o.credit?.limit||0,used:o.credit?.used||0,overdue:0,blockOverdue:true};}
function saveCredit(db,d,role){access(d,role,['finance']);if(!['现结','预付','月结'].includes(d.terms)||!date(d.from)||!date(d.until)||d.from>d.until||!d.basis?.trim())throw Error('请填写结算方式、有效期和授权依据');['limit','used','overdue'].forEach(k=>amount(d[k],false));const old=db.credits.find(c=>c.company===d.company&&c.customer===d.customer&&c.currency===d.currency),c={...copy(d),valid:true,history:old?.history||[]};log(c,'维护演示客户条款；正式制度待确认',role);if(old)db.credits[db.credits.indexOf(old)]=c;else db.credits.push(c);return c;}
function creditCheck(db,o,day=today()){o=db.orders.find(x=>x.id===o.id)||o;const c=copy(credit(db,o)),remaining=sale(o)===null?null:Math.max(0,round(sale(o)-received(db,o))),reasons=[];c.used=sum([c.used,...(db.creditUses||[]).filter(x=>x.company===o.company&&x.customer===o.customer&&x.currency===o.currency&&x.orderId!==o.id).map(x=>{const order=get(db,'orders',x.orderId);return Math.max(0,round(x.amount-Math.max(0,received(db,order)-x.received)));})]);if(remaining===null)reasons.push('订单金额待确认');else if(c.terms==='月结'){if(!c.valid||day<c.from||day>c.until)reasons.push('信用授权不在有效期');if(round(c.limit-c.used)<remaining)reasons.push('可用信用额度不足');if(c.blockOverdue&&c.overdue>0)reasons.push('存在逾期欠款');}else if(remaining>0)reasons.push(c.terms==='预付'?'客户预收尚未认领到本订单':'现结收款尚未满足');const exception=db.exceptions.find(x=>x.orderId===o.id&&x.state==='已批准'&&x.until>=day&&x.signature===signature(o)&&x.amount>=remaining);return {terms:c.terms,remaining,credit:c,available:Math.max(0,round(c.limit-c.used)),reasons,exception:exception||null,allowed:!reasons.length||!!exception};}
function exception(db,o,d,role){access(o,role,['ticket']);const check=creditCheck(db,o);if(check.allowed)throw Error('本单无需资金例外');if(!d.basis?.trim()||!date(d.until)||d.until<today())throw Error('请填写例外理由和有效期');if(db.exceptions.some(x=>x.orderId===o.id&&x.state==='审批中'))throw Error('本单已有例外待审批');const x={id:id('HFXY'),company:o.company,currency:o.currency,customer:o.customer,kind:'资金例外',orderId:o.id,amount:check.remaining,signature:signature(o),basis:d.basis,until:d.until,applicant:roles[role].id,state:'审批中',history:[]};log(x,'提交本单资金例外',role);db.exceptions.push(x);return x;}
function reserveCredit(db,o){const c=creditCheck(db,o);if(c.terms!=='月结')return;if(!(db.creditUses||=[]).some(x=>x.orderId===o.id))db.creditUses.push({orderId:o.id,company:o.company,customer:o.customer,currency:o.currency,amount:c.remaining,received:received(db,o)});}
return {advanceKey,advanceAccounts,advanceAccount,advancePlan,advanceUse,collectionExamples,receiptStatus,collectionReceipts,collectionReceived,collectionRemaining,identifyReceipt,handleReceipt,syncInvoiceConditions,accountRecords,accountCandidates,accountReady,selectAccount,syncAdjustments,sale,reserveCredit,key,company,roles,copy,round,sum,today,amount,date,id,get,access,scope,seed,load,save,syncOrders,received,due,receiptAvailable,register,claim,reviewClaim,signature,invalidateLinks,collectionAccounts,createLink,closeLink,payResult,sourceBalance,recommend,request,refundAvailable,refund,review,withdraw,execute,paymentReturn,platformBalance,movement,reconcile,credit,saveCredit,creditCheck,exception};
});
