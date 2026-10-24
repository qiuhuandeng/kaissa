/* Voyage supply prototype. Local session only; product/order/finance sources remain in their existing modules. */
(function(root){
'use strict';
const KEY='caissa.cruise.inventory.v1',clone=x=>JSON.parse(JSON.stringify(x));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const channels=['B2C','B2B','同业'],origins=['北京','上海','广州'],priceChannels=['B2C零售价','B2B同业价','分销商净价','内部员工价'];
const stateLabel = value => ({截止:'已停售',出团:'已开航',完成:'已返航',取消:'已取消'}[value] || value);
const states=['预售','在售','截止','出团','完成','取消'],active=['临时锁定','手动锁定','订单占用','已售','已分房'];
const matters={transfer:'邮轮库存调拨',price:'邮轮价格调整'},pages={voyages:'voyages.html',inventory:'inventory.html',pools:'inventory-pools.html',transfers:'inventory-transfers.html',locks:'inventory-locks.html'};
const products=[{id:'BJ',name:'理想号地中海西线8天·北京',origin:'北京',schedule:'CZ20261112001'},{id:'SH',name:'理想号地中海西线8天·上海',origin:'上海',schedule:'CZ20261112002'},{id:'GZ',name:'理想号地中海西线8天·广州',origin:'广州',schedule:'CZ20261112003'},{id:'JP',name:'日韩邮轮6天',origin:'上海',schedule:'CZ20261126001'}];
const money=n=>Number(n||0).toLocaleString('zh-CN',{maximumFractionDigits:2});
const stamp=()=>new Date().toLocaleString('sv-SE',{timeZone:'Asia/Shanghai'}),uid=(s,p)=>p+'-'+(++s.serial);
const voyageId=(ship,date)=>'HC-'+ship.toUpperCase()+'-'+date.replaceAll('-','');
const key=(v,c)=>v+'|'+c;
const find=(rows,id)=>{const r=rows.find(x=>x.id===id);if(!r)throw Error('未找到对应记录');return r;};
const whole=n=>Number.isInteger(Number(n))&&Number(n)>0;
const log=(s,type,object,text)=>s.logs.unshift({id:uid(s,'JL'),at:stamp(),user:'当前用户',type,object,text});
function price(base=28800){return {first:base,second:base,third:20800,fourth:18800,child:23800,childMin:2,childMax:11,single:8800,port:1800,service:600,fuel:0,feeMode:'另收',currency:'CNY'};}
function stockRow(v,code,total){const q=Math.floor(total/3);return {id:key(v,code),voyage:v,code,total,receipts:[],quotas:{channel:{B2C:total-2*q,B2B:q,同业:q},product:{BJ:total-q,SH:q,GZ:0,JP:0},origin:{北京:total-q,上海:q,广州:0}},prices:Object.fromEntries(priceChannels.map((c,i)=>[c,{...price((code==='BC'?26800:28800)-i*1000),...(code==='BC'?{third:0,fourth:0}:{})}]))};}
function seed(){
 const s={version:1,serial:200,voyages:[],stocks:[],positions:[],pools:[],transfers:[],priceRequests:[],approvals:[],logs:[],imported:[],rules:{minutes:30,autoRelease:true,tight:20,soldout:true,oversold:true,stopAtZero:true},promotions:[]};
 [['ideal','2026-11-12','west','在售'],['ideal','2026-11-26','west','预售'],['glory','2026-11-19','japan','在售'],['oasis','2026-11-05','oasis-west','截止'],['ideal','2026-10-22','west','出团'],['ideal','2026-10-08','west','完成'],['venice','2026-12-10','west','取消'],['ideal','2027-01-07','west','预售']].forEach(([ship,date,route,status],i)=>{
  const days=route==='japan'?6:8,back=new Date(date+'T12:00:00Z');back.setUTCDate(back.getUTCDate()+days-1);const id=voyageId(ship,date);
  s.voyages.push({id,ship,date,days,back:back.toISOString().slice(0,10),route,status,contractId:i===0?'HT-YL-003':'',source:i===0?'采购入库':'历史航次示例',reason:'船方排期确认（示例）',products:route==='japan'?['JP']:['BJ','SH'],history:[{at:'2026-10-24 09:00',text:'航次资料示例'}]});
  if(i!==0){['BA','BC'].forEach((code,j)=>{const st=stockRow(id,code,j?6:20);s.stocks.push(st);});}
 });
 const v=s.voyages[0].id,ba=stockRow(v,'BA',20),bc=stockRow(v,'BC',6);ba.receipts=['RK-YL-003'];bc.receipts=['RK-YL-003'];s.stocks.unshift(ba,bc);s.imported.push('RK-YL-003');
 function pos(stock,status,quantity,channel,product,origin,order=''){s.positions.push({id:uid(s,'ZY'),stock,status,quantity,channel,product,origin,customer:order?'张建国':'华东同业',order,demand:stock.split('|')[1],reason:'既有占用示例',created:Date.now(),expires:Date.now()+30*60000,history:[]});}
 pos(ba.id,'已售',2,'B2C','BJ','北京','KSCZ20260704002');pos(ba.id,'临时锁定',3,'B2B','SH','上海');pos(bc.id,'已分房',1,'B2C','BJ','北京','KSCZ20260704003');pos(bc.id,'手动锁定',1,'B2B','SH','上海');
 pos(s.stocks.find(x=>x.voyage===s.voyages[1].id).id,'订单占用',4,'B2C','BJ','北京','KSCZ20261024001');
 const tight=s.stocks.find(x=>x.voyage===s.voyages[2].id);pos(tight.id,'已售',17,'B2C','JP','上海','KSCZ20261024002');
 const soldout=s.stocks.find(x=>x.voyage===s.voyages[3].id);pos(soldout.id,'已分房',20,'B2C','BJ','北京','KSCZ20261024003');
 const oversold=s.stocks.find(x=>x.voyage===s.voyages[4].id);pos(oversold.id,'已售',21,'B2C','BJ','北京','KSCZ20261024004');
 pos(ba.id,'已释放',1,'B2C','BJ','北京');pos(ba.id,'已取消',1,'同业','SH','上海');
 s.pools.push({id:'GC-001',name:'理想号11月12日京沪共享',type:'多出发地共享',voyage:v,codes:['BA'],rule:'先到先得',status:'启用',members:[{key:'北京',quota:20,priority:1},{key:'上海',quota:20,priority:2}],history:[{at:'2026-10-23 10:00',text:'北京、上海共同使用20间阳台BA'}]});
 s.promotions=[{id:'CX-001',name:'第2人同行优惠',type:'第2人折扣',value:80,start:'2026-10-24',end:'2026-11-01',voyage:v,code:'BA',status:'启用',coupon:'',history:[]}];
 // Align each independent quota view with its existing occupancy.
 for(const st of s.stocks)for(const d of ['channel','product','origin']){const q=st.quotas[d],occupied=Object.keys(q).map(k=>[k,used(s,st.id,d,k)]);if(occupied.some(([k,n])=>n>q[k])){Object.keys(q).forEach(k=>q[k]=used(s,st.id,d,k));const rest=Math.max(0,st.total-Object.values(q).reduce((a,b)=>a+b,0));q[Object.keys(q)[0]]+=rest;}}
 s.positions.forEach(p=>{p.history.push({at:'2026-10-24 09:00',text:p.status+' '+p.quantity+'间（历史示例）'});if(['临时锁定','手动锁定','已释放'].includes(p.status))log(s,p.status==='已释放'?'库存释放':'库存锁定',p.stock,p.id+' '+p.status+' '+p.quantity+'间');});
 const transfer={id:'DB-001',type:'渠道间调拨',reason:'双十一同业预留调整',lines:[{stock:ba.id,from:'B2C',to:'同业',quantity:1}],history:[]};request(s,'transfer',transfer);s.transfers.push(transfer);
 const pr={id:'TJ-001',rule:'季节价',season:'旺季',reason:'冬季参考票价调整',rows:[{stock:ba.id,channel:priceChannels[0],before:clone(ba.prices[priceChannels[0]]),after:{...clone(ba.prices[priceChannels[0]]),first:29800}}],history:[]};request(s,'price',pr);s.priceRequests.push(pr);
 log(s,'初始化',v,'历史舱位、占用及预警示例');return s;
}
let memory;
function raw(){try{const s=JSON.parse(root.sessionStorage.getItem(KEY));if(s?.version===1)return s;}catch(e){}if(!memory)memory=seed();return clone(memory);}
function write(s){memory=clone(s);try{root.sessionStorage.setItem(KEY,JSON.stringify(s));}catch(e){}return s;}
function importReceipts(s,purchase){let changed=false;if(!purchase)return false;
 for(const r of purchase.receipts.filter(x=>x.status==='已入库'&&!s.imported.includes(x.id))){
  const c=purchase.contracts.find(x=>x.id===r.contractId);if(!c)continue;
  let v=s.voyages.find(x=>x.ship===c.ship&&x.date===r.voyage.date);if(!v){v={id:voyageId(c.ship,r.voyage.date),ship:c.ship,date:r.voyage.date,back:r.voyage.back,days:Math.round((new Date(r.voyage.back)-new Date(r.voyage.date))/864e5)+1,route:r.voyage.port==='shanghai'?'japan':'west',status:'预售',contractId:c.id,source:'采购入库',reason:r.supplierRef,products:[],history:[]};s.voyages.push(v);}v.history.push({at:stamp(),text:'采购入库 '+r.id});
  const dedicated=c.type==='散位代理';
  for(const l of r.lines.filter(l=>l.accepted>0)){let st=s.stocks.find(x=>x.id===key(v.id,l.code));if(!st){st=stockRow(v.id,l.code,0);st.priceReady={};s.stocks.push(st);}st.total+=Number(l.accepted);st.receipts.push(r.id);
   if(!dedicated){st.quotas.channel.B2C+=Number(l.accepted);st.quotas.product.BJ+=Number(l.accepted);st.quotas.origin.北京+=Number(l.accepted);}
  }
  s.imported.push(r.id);changed=true;log(s,'采购入库',v.id,r.id+' 已核准舱位入库');
 }
 // Protect both new and already imported order-specific receipts. Re-reading never creates another occupation.
 for(const r of purchase.receipts.filter(r=>r.status==='已入库'&&s.imported.includes(r.id))){const c=purchase.contracts.find(c=>c.id===r.contractId);if(c?.type!=='散位代理')continue;const order=purchase.orders?.find(o=>r.sourceKind==='orders'&&o.id===r.sourceId),no=r.salesOrder||order?.salesOrder||'';
  for(const l of r.lines.filter(l=>l.accepted>0)){const stock=key(voyageId(c.ship,r.voyage.date),l.code);if(s.positions.some(p=>p.receipt===r.id&&p.stock===stock))continue;
   s.positions.push({id:uid(s,'ZY'),stock,status:'订单占用',quantity:Number(l.accepted),order:no,product:'',channel:'',origin:'',receipt:r.id,procurementOrder:r.sourceId,dedicated:true,customer:'按单采购',demand:l.code,reason:no?'船方已确认指定订单舱位':'待关联原销售订单，暂停转售',history:[{at:stamp(),text:'采购入库 '+r.id+'；'+(no?'仅供订单 '+no:'销售订单待关联')}]});changed=true;
  }
 }return changed;
}
function expire(s,at=Date.now()){let changed=false;if(!s.rules.autoRelease)return changed;s.positions.filter(p=>p.status==='临时锁定'&&p.expires<=at).forEach(p=>{p.status='已释放';p.history.push({at:stamp(),text:'到期自动释放'});log(s,'到期释放',p.stock,p.id+' 到期释放 '+p.quantity+' 间');changed=true;});return changed;}
function read(){const s=raw();const a=importReceipts(s,root.CaesarCruisePurchase?.read()),b=expire(s);if(a||b)write(s);return s;}
function count(s,st){const out={total:st.total,hold:0,booked:0,sold:0,assigned:0,released:0,cancelled:0};s.positions.filter(p=>p.stock===st.id).forEach(p=>{const k={'临时锁定':'hold','手动锁定':'hold','订单占用':'booked','已售':'sold','已分房':'assigned','已释放':'released','已取消':'cancelled'}[p.status];if(k)out[k]+=p.quantity;});out.used=out.hold+out.booked+out.sold+out.assigned;out.available=Math.max(0,out.total-out.used);out.over=Math.max(0,out.used-out.total);return out;}
function warning(s,st){const n=count(s,st);return n.over&&s.rules.oversold?'超售 '+n.over+' 间':!n.available&&s.rules.soldout?'售罄':n.total&&n.available/n.total*100<s.rules.tight?'余量紧张':'';}
function used(s,stock,dimension,name){return s.positions.filter(p=>p.stock===stock&&active.includes(p.status)&&p[dimension]===name).reduce((n,p)=>n+p.quantity,0);}
function poolDimension(p){return {'多出发地共享':'origin','多产品共享':'product','多渠道共享':'channel'}[p.type];}
function availability(s,st,data){const physical=count(s,st).available,limits=[{label:'航次余量',quantity:physical}];
 for(const d of ['channel','product','origin'])limits.push({label:{channel:'渠道额度',product:'产品额度',origin:'出发地额度'}[d],quantity:Math.max(0,Number(st.quotas[d][data[d]]||0)-used(s,st.id,d,data[d]))});
 for(const p of s.pools.filter(p=>p.status==='启用'&&p.voyage===st.voyage&&p.codes.includes(st.code))){const d=poolDimension(p),m=p.members.find(m=>m.key===data[d]);if(!m){limits.push({label:'未加入共享池',quantity:0});continue;}
  const usedBy=k=>s.positions.filter(x=>x.stock.startsWith(p.voyage+'|')&&p.codes.includes(x.stock.split('|')[1])&&x[d]===k&&active.includes(x.status)).reduce((n,x)=>n+x.quantity,0);
  if(p.rule==='按配额')limits.push({label:'共享池参与方配额',quantity:Math.max(0,m.quota-usedBy(m.key))});
  if(p.rule==='按优先级'){const higher=p.members.filter(x=>x.priority<m.priority).reduce((n,x)=>n+Math.max(0,x.quota-usedBy(x.key)),0),free=s.stocks.filter(x=>x.voyage===p.voyage&&p.codes.includes(x.code)).reduce((n,x)=>n+count(s,x).available,0);limits.push({label:'共享池优先保留',quantity:Math.max(0,free-higher)});}
 }
 const available=Math.min(...limits.map(x=>x.quantity));return {physical,available,limits,reason:limits.filter(x=>x.quantity===available).map(x=>x.label).join('、')};
}
function nextStates(v){return {预售:['在售','取消'],在售:['截止','取消'],截止:['在售','出团','取消'],出团:['完成'],完成:[],取消:[]}[v.status]||[];}
function saveVoyage(data){const s=read(),existing=data.id?s.voyages.find(x=>x.id===data.id):null;
 if(existing&&['出团','完成','取消'].includes(existing.status))throw Error('当前航次已进入执行或结束，不能修改资料');
 const duplicate=s.voyages.find(x=>x.ship===data.ship&&x.date===data.date&&x.id!==data.id);if(duplicate)throw Error('该船只和出发日已有航次：'+duplicate.id);
 if(!whole(data.days))throw Error('航线天数需为正整数');
 if(existing&&(existing.ship!==data.ship||existing.date!==data.date)&&s.stocks.some(st=>st.voyage===existing.id))throw Error('已有舱位的船只及出发日期不能直接改动，请走原转团流程');
 const v=existing||{id:voyageId(data.ship,data.date),status:'预售',source:'手动新建',history:[]};const id=v.id,history=v.history;
 Object.assign(v,clone(data),{id,history});const b=new Date(v.date+'T12:00:00Z');b.setUTCDate(b.getUTCDate()+Number(v.days)-1);v.back=b.toISOString().slice(0,10);if(!existing)s.voyages.unshift(v);v.history.push({at:stamp(),text:existing?'修改航次资料':'手动建立航次'});log(s,'航次维护',v.id,'保存航次资料');write(s);return v;
}
function changeStatus(id,status,reason){const s=read(),v=find(s.voyages,id);if(!nextStates(v).includes(status))throw Error('航次状态已改变，请重新核对');if(status==='在售'&&!s.stocks.some(st=>st.voyage===id&&count(s,st).available>0))throw Error('尚无可售舱位，不能开始销售');if(status==='取消'&&s.positions.some(p=>s.stocks.some(st=>st.id===p.stock&&st.voyage===id)&&['订单占用','已售','已分房'].includes(p.status)))throw Error('存在订单占用，请先在原订单售后完成处理');v.status=status;v.history.push({at:stamp(),text:stateLabel(status)+'：'+reason});log(s,'航次状态',id,stateLabel(status)+'：'+reason);write(s);return v;}
function savePool(data){const s=read(),old=data.id?s.pools.find(x=>x.id===data.id):null,v=find(s.voyages,data.voyage);if(!data.codes.length)throw Error('请保留至少一个舱型');if(data.codes.some(code=>!s.stocks.some(st=>st.id===key(v.id,code))))throw Error('选中舱型尚未入库');if(s.pools.some(p=>p.id!==data.id&&p.status==='启用'&&p.voyage===data.voyage&&p.codes.some(c=>data.codes.includes(c)))&&data.status==='启用')throw Error('该航次舱型已有启用的共享池，请编辑原池');
 const total=s.stocks.filter(st=>st.voyage===v.id&&data.codes.includes(st.code)).reduce((n,st)=>n+st.total,0),dim=poolDimension(data);
 if(!data.members.length||new Set(data.members.map(m=>m.key)).size!==data.members.length)throw Error('参与方不能为空或重复');
 if(data.members.some(m=>!Number.isInteger(+m.quota)||m.quota<0||!whole(m.priority)))throw Error('请核对配额和优先级');
 if(data.rule==='按配额'&&data.members.reduce((n,m)=>n+Number(m.quota),0)>total)throw Error('各参与方配额合计超过共享舱位');
 const occupied=s.positions.filter(p=>s.stocks.some(st=>st.id===p.stock&&st.voyage===v.id&&data.codes.includes(st.code))&&active.includes(p.status));
 if(occupied.some(p=>!data.members.some(m=>m.key===p[dim])))throw Error('已有占用的参与方不能移除');
 if(data.rule==='按配额'&&data.members.some(m=>occupied.filter(p=>p[dim]===m.key).reduce((n,p)=>n+p.quantity,0)>m.quota))throw Error('配额不能低于该参与方已占用量');
 const row={...clone(data),id:old?.id||uid(s,'GC'),history:[...(old?.history||[]),{at:stamp(),text:old?'修改共享范围与规则':'建立共享池'}]};if(old)s.pools[s.pools.indexOf(old)]=row;else s.pools.unshift(row);log(s,'共享池',row.id,row.name+'：'+row.rule);write(s);return row;
}
function reserve(data){const s=read(),st=find(s.stocks,data.stock),v=find(s.voyages,st.voyage),n=Number(data.quantity);if(!['预售','在售'].includes(v.status))throw Error('该航次已停止接受新锁位');if(!whole(n)||n>count(s,st).available)throw Error('锁定间数超过可售舱位');
 for(const d of ['channel','product','origin'])if(used(s,st.id,d,data[d])+n>Number(st.quotas[d][data[d]]||0))throw Error('超过'+({channel:'渠道',product:'产品',origin:'出发地'}[d])+'可用额度，请先调拨');
 for(const p of s.pools.filter(p=>p.status==='启用'&&p.voyage===st.voyage&&p.codes.includes(st.code))){const d=poolDimension(p),m=p.members.find(x=>x.key===data[d]);if(!m)throw Error('当前使用方未加入该共享池');if(p.rule==='按配额'){const occupied=s.positions.filter(x=>p.codes.includes(x.stock.split('|')[1])&&x.stock.startsWith(p.voyage+'|')&&x[d]===m.key&&active.includes(x.status)).reduce((n,x)=>n+x.quantity,0);if(occupied+n>m.quota)throw Error('超过共享池参与方配额');}if(p.rule==='按优先级'){const higher=p.members.filter(x=>x.priority<m.priority).reduce((n,x)=>n+Math.max(0,x.quota-s.positions.filter(pos=>pos.stock.startsWith(p.voyage+'|')&&p.codes.includes(pos.stock.split('|')[1])&&pos[d]===x.key&&active.includes(pos.status)).reduce((sum,pos)=>sum+pos.quantity,0)),0);const free=s.stocks.filter(x=>x.voyage===p.voyage&&p.codes.includes(x.code)).reduce((n,x)=>n+count(s,x).available,0);if(n>free-higher)throw Error('剩余舱位需优先保留给高优先级参与方');}}
 const minutes=Number(data.minutes||s.rules.minutes);if(![15,30].includes(minutes)&&data.kind==='临时锁位')throw Error('临时锁位支持15或30分钟');const row={...clone(data),id:uid(s,'SD'),quantity:n,status:data.kind==='临时锁位'?'临时锁定':'手动锁定',created:Date.now(),expires:data.kind==='临时锁位'?Date.now()+minutes*60000:null,order:'',demand:st.code,history:[]};s.positions.unshift(row);log(s,'库存锁定',st.id,row.id+' '+row.status+' '+n+' 间 / '+data.customer);write(s);return row;}
function release(id,reason){const s=read(),p=find(s.positions,id);if(!['临时锁定','手动锁定'].includes(p.status))throw Error('只可释放未成交的锁位，订单占用请走原订单处理');p.status='已释放';p.history.push({at:stamp(),text:reason});log(s,'库存释放',p.stock,p.id+' 释放 '+p.quantity+' 间：'+reason);write(s);return p;}
function saveRules(data){const s=read();if(![15,30].includes(+data.minutes)||data.tight<0||data.tight>100)throw Error('请核对锁位时长和预警比例');s.rules={...s.rules,...clone(data)};log(s,'规则设置','库存规则','调整预警及锁位规则');write(s);return s.rules;}
function checkTransfer(s,t,apply=false){for(const l of t.lines){const st=find(s.stocks,l.stock);if(!['预售','在售','截止'].includes(find(s.voyages,st.voyage).status))throw Error('航次已执行或结束，不能继续调拨');if(!whole(l.quantity))throw Error('调拨数量须为正整数');if(t.type==='舱型替代'){
 const p=find(s.positions,l.position),target=find(s.stocks,l.targetStock);if(!['订单占用','已售'].includes(p.status)||p.stock!==st.id||l.quantity>p.quantity)throw Error('原订单占用已改变，需重新核对');if(st.voyage!==target.voyage||st.id===target.id)throw Error('替代舱型必须在同一航次且不同舱型');if(!t.guestConfirmed||!t.supplierConfirmed)throw Error('请确认客人及船方已同意舱型替代');if(Number(l.quantity)>count(s,target).available)throw Error('替代舱型可售不足');
 if(apply){if(Number(l.quantity)===p.quantity){p.stock=target.id;}else{p.quantity-=Number(l.quantity);s.positions.push({...clone(p),id:uid(s,'ZY'),stock:target.id,quantity:Number(l.quantity)});}log(s,'舱型替代',target.id,p.order+' 原订'+(p.demand||st.code)+'，实际交付'+target.code+' '+l.quantity+'间；补差约定 '+t.difference);}
 }else{const d={渠道间调拨:'channel',产品间调拨:'product',出发地间调拨:'origin'}[t.type],q=st.quotas[d];if(!q||l.from===l.to||!(l.from in q)||!(l.to in q))throw Error('请核对调出和调入方');if(Number(l.quantity)>Number(q[l.from])-used(s,st.id,d,l.from))throw Error('可调额度不足，不能移走已占用舱位');if(apply){q[l.from]-=Number(l.quantity);q[l.to]+=Number(l.quantity);log(s,'库存调拨',st.id,l.from+' → '+l.to+' '+l.quantity+'间');}}
 }}
function request(s,kind,row){row.status='待审批';row.approvalNo=uid(s,'APR-KC');s.approvals.push({id:row.approvalNo,kind,sourceId:row.id,status:'待审批',at:stamp(),review:clone(row)});}
function submitTransfer(data){const s=read(),t={...clone(data),id:uid(s,'DB'),status:'待审批',history:[]};if(!t.lines.length)throw Error('请保留调拨明细');checkTransfer(clone(s),t,true);request(s,'transfer',t);s.transfers.unshift(t);log(s,'调拨申请',t.id,t.type+'待审批');write(s);return t;}
function pricePreview(s,d){const rows=[];const factor=Number(d.value);if(!Number.isFinite(factor)||factor<0||(d.mode==='折扣'&&factor>100))throw Error('价格规则数值不正确');
 for(const st of s.stocks){const v=find(s.voyages,st.voyage);if((Array.isArray(d.voyages)&&!d.voyages.includes(v.id))||!['预售','在售','截止'].includes(v.status)||v.date<d.start||v.date>d.end||(d.ship&&d.ship!==v.ship)||(d.code&&d.code!==st.code))continue;
 const days=Math.round((new Date(v.date+'T12:00:00Z')-new Date(d.asOf+'T12:00:00Z'))/864e5);if(d.rule==='早鸟价'&&days<+d.days||d.rule==='尾单价'&&(days<0||days>+d.days))continue;
 if(st.code==='BC'&&['third','fourth'].includes(d.field))continue;
 for(const channel of (d.channel?[d.channel]:priceChannels)){const before=clone(st.prices[channel]),after=clone(before),k=d.field||'first';after[k]=Math.round((d.mode==='指定价格'?factor:d.mode==='加价'?before[k]+factor:before[k]*factor/100)*100)/100;rows.push({stock:st.id,channel,before,after});}}
 return rows;
}
function submitPrice(data,rows){const s=read(),current=pricePreview(s,data);if(!current.length)throw Error('当前条件没有可调整的航次舱型');if(rows&&JSON.stringify(rows)!==JSON.stringify(current))throw Error('价格已变化，请重新预览');const row={...clone(data),rows:current,id:uid(s,'TJ'),history:[],status:'待审批'};request(s,'price',row);s.priceRequests.unshift(row);log(s,'价格申请',row.id,data.rule+' '+current.length+'条价格待审批');write(s);return row;}
function submitPriceDetail(stock,channel,after,reason){const s=read(),st=find(s.stocks,stock);if(!['预售','在售','截止'].includes(find(s.voyages,st.voyage).status))throw Error('已出团或结束航次不能调价');for(const k of ['first','second','third','fourth','child','single','port','service','fuel'])if(!Number.isFinite(+after[k])||after[k]<0)throw Error('价格不能为负数');if(!Number.isInteger(+after.childMin)||!Number.isInteger(+after.childMax)||+after.childMin<0||+after.childMin>+after.childMax)throw Error('儿童年龄区间不正确');if(st.code==='BC'&&(after.third!==0||after.fourth!==0))throw Error('该舱型仅支持2人入住');const r={id:uid(s,'TJ'),rule:'单项舱价',reason,rows:[{stock,channel,before:clone(st.prices[channel]),after:clone(after)}],history:[]};request(s,'price',r);s.priceRequests.unshift(r);write(s);return r;}
function decide(no,decision,opinion){const s=read(),a=find(s.approvals,no),r=find(a.kind==='transfer'?s.transfers:s.priceRequests,a.sourceId);if(a.status!=='待审批'||r.status!=='待审批')throw Error('该审批已处理');if(decision==='通过'){
 if(a.kind==='transfer')checkTransfer(s,r,true);else for(const l of r.rows){const st=find(s.stocks,l.stock);if(!['预售','在售','截止'].includes(find(s.voyages,st.voyage).status))throw Error('航次已执行或结束，请退回原调价申请');if(JSON.stringify(st.prices[l.channel])!==JSON.stringify(l.before))throw Error('申请后原价已改变，请退回重新核对');}
 if(a.kind==='price')for(const l of r.rows){const st=find(s.stocks,l.stock);st.prices[l.channel]=clone(l.after);if(st.priceReady)st.priceReady[l.channel]=true;log(s,'价格生效',l.stock,r.id+' '+l.channel+' 首人票价 '+l.before.first+' → '+l.after.first);}
 r.status='已生效';a.status='已通过';}else{r.status='已退回';a.status='已退回';}a.opinion=opinion;r.history.push({at:stamp(),text:a.status+'：'+(opinion||'已核对')});write(s);return r;}
function savePromotion(data){const s=read();if(!s.stocks.some(st=>st.voyage===data.voyage&&st.code===data.code))throw Error('所选航次尚无对应舱型');if(data.end<data.start)throw Error('活动结束日期早于开始日期');if(!Number.isFinite(+data.value)||data.value<0||(['第2人折扣','限时折扣'].includes(data.type)&&data.value>100))throw Error('请核对促销优惠数值');const old=s.promotions.find(p=>p.id===data.id),row={...clone(data),id:old?.id||uid(s,'CX'),history:[...(old?.history||[]),{at:stamp(),text:'保存促销适用条件'}]};if(old)s.promotions[s.promotions.indexOf(old)]=row;else s.promotions.unshift(row);log(s,'促销设置',row.id,row.name);write(s);return row;}
function quote(p,promo){const base=p.first+p.second+(promo?.type==='两大一小优惠'?p.child:0);const discount=!promo?0:promo.type==='第2人折扣'?p.second*(1-promo.value/100):promo.type==='限时折扣'?base*(1-promo.value/100):Number(promo.value);const tax=p.feeMode==='另收'?(p.port+p.service+p.fuel)*(promo?.type==='两大一小优惠'?3:2):0;const round=n=>Math.round(n*100)/100;return {fare:round(base),discount:round(Math.min(base,discount)),tax:round(tax),total:round(Math.max(0,base-discount)+tax)};}
function approvalRecords(){const s=read();return s.approvals.map(a=>{const r=a.review;return {no:a.id,cruiseInventory:true,matter:matters[a.kind],source:'邮轮中心',scopes:['todo','mine','overview'],status:a.status,applicant:'邮轮团控王强',applicantRole:'邮轮团控',businessTitle:a.kind==='transfer'?r.type:r.rule,businessNo:r.id,context:a.kind==='transfer'?r.lines.length+'条调拨':r.rows.length+'条舱价',impact:a.kind==='transfer'?r.lines.reduce((n,l)=>n+Number(l.quantity),0)+' 间':'价格变更',risk:'',riskLevel:'normal',node:a.status==='待审批'?'邮轮业务负责人':'已处理',due:a.status==='待审批'?'待处理':'已完成',appliedAt:a.at.slice(0,10),sourceHref:'../cruise/'+(a.kind==='transfer'?pages.transfers:pages.voyages)+'?id='+encodeURIComponent(r.id),detail:[['申请单号',r.id],['申请事项',matters[a.kind]],['调整原因',r.reason||r.rule],['生效方式','审批通过后生效']],flow:[[a.at,'提交审批'],...(a.opinion?[[a.at,a.opinion]]:[])],opinion:a.opinion||'已核对（原型）'};});}
function approvalHtml(item){const s=read(),a=find(s.approvals,item.no),r=a.review;const headers=a.kind==='transfer'?['航次／舱型','调出／原占用','调入／替代舱型','间数']:['航次／舱型','渠道','原票价／税费','新票价／税费'];const rows=a.kind==='transfer'?r.lines.map(l=>[l.stock,l.from||l.position,l.to||l.targetStock,l.quantity]):r.rows.map(l=>[l.stock,l.channel,money(l.before.first)+' / '+money(l.before.port+l.before.service+l.before.fuel),money(l.after.first)+' / '+money(l.after.port+l.after.service+l.after.fuel)]);return '<div class="table-wrap"><table><thead><tr>'+headers.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'+(r.type==='舱型替代'?'<p>'+esc('客人确认：'+(r.guestConfirmed?'已确认':'未确认')+'；船方确认：'+(r.supplierConfirmed?'已确认':'未确认')+'；补差约定：'+r.difference)+'</p>':'');}
root.CaesarCruiseInventory={KEY,clone,esc,money,channels,origins,priceChannels,products,states,stateLabel,active,matters,pages,stamp,voyageId,key,seed,read,write,count,warning,used,availability,poolDimension,nextStates,saveVoyage,changeStatus,savePool,reserve,release,saveRules,submitTransfer,pricePreview,submitPrice,submitPriceDetail,decide,savePromotion,quote,approvalRecords,approvalHtml,importReceipts,expire,checkTransfer};
})(typeof window==='undefined'?globalThis:window);
