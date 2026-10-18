/* 包机供票建单：只在本单引用来源及额度，不回写项目分配或财务。 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./air-orders-model.js'):root.AirOrders,typeof module==='object'&&module.exports?require('./air-charter-model.js'):root.AirCharter);if(typeof module==='object'&&module.exports)module.exports=api;else root.AirCharterOrder=api;})(typeof window!=='undefined'?window:globalThis,function(M,A){
'use strict';
const uses=['内部团队供票','外部客户分销','余位散卖'],copy=M.copy;
const groups=[
 {id:'MD20261219001',name:'马累双岛6日',customer:'北京凯撒国际旅行社',department:'海岛产品部',project:'CH20261219001',flight:'CH1219',kind:'内部'},
 {id:'MD20261212001',name:'马累冬季6日',customer:'北京凯撒国际旅行社',department:'海岛产品部',project:'CH20261212001',flight:'CH1212',kind:'内部'},
 {id:'HY20261219001',name:'环游同行马累团',customer:'环游同行旅行社',department:'',project:'CH20261219001',flight:'CH1219',kind:'外部'}
];
function samplePerson(i){const names=['张建国','李梅','王强','赵敏','陈红','周伟','刘洋','孙丽','黄静','吴杰','郑芳','何平'],english=['ZHANG/JIANGUO','LI/MEI','WANG/QIANG','ZHAO/MIN','CHEN/HONG','ZHOU/WEI','LIU/YANG','SUN/LI','HUANG/JING','WU/JIE','ZHENG/FANG','HE/PING'];return {...M.person('CHP'+i,names[i%12]),english:english[i%12],docNo:'E961219'+String(i+1).padStart(2,'0')};}
const sales=[
 {id:'KS20261219001',group:groups[0].id,customer:'张建国',people:[samplePerson(0),samplePerson(1)]},
 {id:'KS20261219002',group:groups[0].id,customer:'王强',people:[samplePerson(2),samplePerson(3)]},
 {id:'KS20261201001',group:groups[1].id,customer:'陈红',people:[samplePerson(4)]},
 {id:'HY-SO-1219',group:groups[2].id,customer:'环游同行旅行社',people:[samplePerson(5),samplePerson(6)]}
];
const today=()=>new Date().toLocaleDateString('sv-SE');
function projects(){return A.load().projects;}
function activeProjects(o,db=projects()){const g=groups.find(g=>g.id===o.group);return db.filter(p=>p.company===o.company&&p.state==='执行中'&&p.flights.some(f=>f.state==='可分销'&&f.date>=today())&&(!g||p.id===g.project));}
function project(o,db=projects()){return db.find(p=>p.id===o.charterProjectId);}
function flight(o,db=projects()){return project(o,db)?.flights.find(f=>f.id===o.charterFlightId);}
function manual(o){return o.charterUse!=='内部团队供票'&&o.charterRosterSource!=='已有团队名单';}
function clearQuote(o){Object.assign(o,{bookingPnr:'',bookingAirlineNo:'',fare:'',tax:'',cost:'',sale:'',service:0,other:0,priceBasis:'',installments:[],unitPrice:'',priceMode:'按席报价',taxScope:'含税',supplierConfirmed:false});}
function clearSupply(o){Object.assign(o,{charterProjectId:'',charterProject:'',charterFlightId:'',charterQuota:'',charterSupply:null,seat:'',agreement:'',supplier:'',carrier:'',account:'',legs:[],tickets:[]});clearQuote(o);}
function init(o,use='外部客户分销'){clearSupply(o);Object.assign(o,{charterVersion:1,charterUse:use,charterRosterSource:'客户提供名单',charterSourceMode:'按团期',customerType:use==='内部团队供票'?'内部':use==='余位散卖'?'散客':'同行',customer:'',department:'',group:'',sourceOrder:'',sourceOrders:[],contact:'',contactPhone:'',bookedSeats:'',people:[],source:'包机协议',terms:'预付',manualEntry:true,roster:{sourceVersion:1,claimed:0,accepted:0,pending:null}});return o;}
function quotaOptions(o,db=projects()){
 const p=project(o,db),f=flight(o,db);if(!p||!f||p.state!=='执行中'||f.state!=='可分销'||f.date<today())return [];
 const own=p.allocations.filter(a=>a.flight===f.id&&(o.charterUse==='内部团队供票'?a.channel==='内部打包'&&a.group===o.group:o.charterUse==='外部客户分销'?a.channel==='纯票分销'&&a.customer===o.customer:false));
 const rows=own.map(a=>({key:'allocation:'+p.allocations.indexOf(a),label:o.charterUse==='内部团队供票'?'本团已分配机位':'本客户分销份额',qty:a.qty,used:A.allocatedSold(p,a),available:Math.max(0,a.qty-A.allocatedSold(p,a)),validUntil:a.validUntil,condition:a.condition,scope:a.scope,price:a.price,customer:a.customer}));
 if(o.charterUse!=='内部团队供票'){const n=A.flightStats(p,f).public;rows.push({key:'public',label:'公共余位',qty:n,used:0,available:n,validUntil:f.date,condition:'以项目分销约定为准',scope:'本航次往返 '+f.cabin,customer:'公共余位'});}
 return rows;
}
function selectProject(o,id,db=projects()){const p=activeProjects(o,db).find(p=>p.id===id);if(id&&!p)throw Error('项目不在本次可用范围内');const extras=o.legs.filter(l=>l.additional);clearSupply(o);o.legs=extras;if(p)Object.assign(o,{charterProjectId:p.id,charterProject:p.name,agreement:p.agreement,supplier:p.airline,carrier:p.airline,currency:p.currency});}
function selectFlight(o,id,db=projects()){
 const p=project(o,db),g=groups.find(g=>g.id===o.group),f=p?.flights.find(f=>f.id===id&&f.state==='可分销'&&f.date>=today()&&(!g||f.id===g.flight));if(id&&!f)throw Error('请选择本次来源适用的可供票航次');
 const extras=o.legs.filter(l=>l.additional);clearQuote(o);Object.assign(o,{charterFlightId:id,charterQuota:'',charterSupply:null,seat:'',tickets:[],legs:extras});
 if(f){o.seat=p.id+'/'+f.id;o.legs=[{...M.leg('L1',f.from,f.to,f.date,f.out),charterMain:true,cabin:f.cabin},{...M.leg('L2',f.to,f.from,f.returnDate,f.back),charterMain:true,cabin:f.cabin},...extras];}
}
function selectQuota(o,key,db=projects()){const q=quotaOptions(o,db).find(q=>q.key===key),p=project(o,db),f=flight(o,db);if(key&&(!q||q.available<=0||q.validUntil<today()))throw Error('本份额暂无可用席位或已过可售截止日');o.charterQuota=key;o.charterSupply=q?{...copy(q),projectId:p.id,flightId:f.id,agreement:p.agreement,airline:p.airline,currency:p.currency,main:copy(o.legs.filter(l=>l.charterMain)),terms:copy(f.orderTerms||{})}:null;clearQuote(o);}
function selectOrders(o,ids){const rows=sales.filter(s=>s.group===o.group&&ids.includes(s.id));if(rows.length!==new Set(ids).size)throw Error('请选择本团的供票销售订单');const old=new Map(o.people.map(p=>[p.id,p]));o.sourceOrders=rows.map(s=>s.id);o.sourceOrder=rows.length===1?rows[0].id:'';o.people=rows.flatMap(s=>s.people.map(p=>({...copy(p),id:s.id+'-'+p.id,sourceOrder:s.id,...(old.has(s.id+'-'+p.id)?{origin:old.get(s.id+'-'+p.id).origin,meal:old.get(s.id+'-'+p.id).meal}:{})})));o.bookedSeats=o.people.length;o.tickets=[];o.legs.forEach(l=>{l.people=l.people.filter(id=>o.people.some(p=>p.id===id));});clearQuote(o);}
function selectGroup(o,id,orderId,db=projects()){
 const g=groups.find(g=>g.id===id&&(o.charterUse==='内部团队供票'?g.kind==='内部':g.kind==='外部'&&g.customer===o.customer));
 if(id&&!g)throw Error('请选择本客户对应的团队');clearSupply(o);Object.assign(o,{group:id,sourceOrder:'',sourceOrders:[],people:[],bookedSeats:'',department:g?.department||''});if(!g)return;
 Object.assign(o,{customer:g.customer,customerType:g.kind==='内部'?'内部':'同行',contact:g.kind==='内部'?'陈红':'环游票务联系人',contactPhone:'',charterRosterSource:'已有团队名单'});
 selectProject(o,g.project,db);selectFlight(o,g.flight,db);selectOrders(o,orderId?[orderId]:sales.filter(s=>s.group===id).map(s=>s.id));const q=quotaOptions(o,db).find(q=>q.key!=='public'&&q.available>0);if(q)selectQuota(o,q.key,db);
}
function quote(o){if(o.priceMode==='按席报价')o.sale=o.unitPrice===''||!Number(o.bookedSeats)?'':M.money(Number(o.unitPrice)*Number(o.bookedSeats));return M.totals(o).sale;}
function rosterStats(o){const qty=Number(o.bookedSeats)||0;return {qty,named:o.people.length,pending:Math.max(0,qty-o.people.length),excess:Math.max(0,o.people.length-qty)};}
function errors(o){
 const e=[],s=o.charterSupply,n=rosterStats(o),g=groups.find(g=>g.id===o.group);
 if(!o.customer)e.push('请选择结算客户');if(!o.operator)e.push('请选择经办人');if(!o.charterProjectId||!o.charterFlightId||!s)e.push('请选择包机航次及可用机位');
 if(!Number.isInteger(Number(o.bookedSeats))||n.qty<1)e.push('请填写本单订购席位');if(s&&n.qty>s.available)e.push('订购席位超过所选份额可用数量');if(n.excess)e.push('名单人数超过本单订购席位');
 if(o.charterUse==='内部团队供票'&&(!g||!o.sourceOrders?.length))e.push('请选择本次内部供票来源');
 if(!manual(o)){const expected=sales.filter(r=>o.sourceOrders?.includes(r.id)&&r.group===o.group).flatMap(r=>r.people.map(p=>r.id+'-'+p.id));if(expected.length!==o.people.length||o.people.some(p=>!expected.includes(p.id)))e.push('名单须与所选来源订单一致');}
 if(s&&(s.projectId!==o.charterProjectId||s.flightId!==o.charterFlightId||s.currency!==o.currency||s.airline!==o.supplier))e.push('项目、航次、币种与供票来源不一致');
 if(s&&(s.main.length!==o.legs.filter(l=>l.charterMain).length||s.main.some(a=>!o.legs.some(b=>b.charterMain&&['id','flight','date','from','to','cabin'].every(k=>a[k]===b[k])))))e.push('包机主航段须与所选航次一致');
 o.legs.filter(l=>l.additional).forEach(l=>{if(!l.date||!l.flight||!M.airports[l.from]||!M.airports[l.to]||l.from===l.to||!l.carrier||!l.supplier)e.push('请补齐额外航段及供票来源');if(!o.people.some(p=>M.legHasPerson(l,p.id)))e.push('请在乘客名单勾选额外航段人员');});
 if(o.sale===''||!Number.isFinite(Number(o.sale))||Number(o.sale)<0)e.push('请填写本单供票报价');if(!o.priceBasis)e.push('请填写价格依据');if(o.taxScope!=='含税')e.push('请先核定最终含税成交金额，再提交供票');if(!['现结','预付','账期'].includes(o.terms))e.push('请选择客户结算条件');
 if(o.installments.some(x=>!x.date||!Number.isFinite(Number(x.amount))||Number(x.amount)<=0))e.push('请补齐客户收款期次');if(o.installments.length&&M.money(o.installments.reduce((n,x)=>n+Number(x.amount),0))!==M.totals(o).sale)e.push('客户收款安排合计须等于本单应收');
 const docs=o.people.filter(p=>p.docNo).map(p=>p.docType+'|'+p.docNo.toUpperCase());if(new Set(docs).size!==docs.length)e.push('本单存在重复证件乘客');return [...new Set(e)];
}
function confirmIssues(o){const s=rosterStats(o),terms=o.charterSupply?.terms||{};return s.pending&&(!terms.partialRoster||!terms.rosterDeadline)?['名单尚未齐全，且项目未明确分批交名单约定，请先补齐名单或核对项目约定']:[];}
const importHeaders=['姓名','英文姓名','证件类型','证件号码','出生日期','证件有效期','国籍','联运出发地','餐食要求'];
const importFields=['name','english','docType','docNo','birth','expiry','nationality','origin','meal'];
function preview(o,rows){const seen=new Map(o.people.filter(p=>p.docNo).map(p=>[p.docType+'|'+p.docNo.toUpperCase(),p]));return rows.map((raw,i)=>{const p=Object.fromEntries(importFields.map(k=>[k,String(raw[k]||'').trim()]));p.docType||='护照';p.nationality||='中国';p.origin||=o.legs[0]?.from||'';p.meal||='普通餐';const key=p.docNo?p.docType+'|'+p.docNo.toUpperCase():'',old=seen.get(key);let status='新增',reason='';if(!p.name){status='不可导入';reason='缺少姓名';}else if(Object.values(p).some(v=>v.includes('[公式请转为值]'))){status='不可导入';reason='公式请先转为值';}else if(old){const diff=['name','english','birth','expiry','nationality'].filter(k=>p[k]&&old[k]&&p[k]!==old[k]);status=diff.length?'资料冲突':'重复';reason=diff.length?'同证件的'+diff.map(k=>M.identityFields[k]).join('、')+'不一致':'本单或本文件已有该证件';}else if(key)seen.set(key,p);const gaps=M.docGaps(p,o);return {row:raw.sourceRow||i+2,p,status,reason:reason||gaps.join('、'),selected:status==='新增'};});}
function applyImport(o,rows,name){if(!manual(o))throw Error('来源名单请在源头维护');const selected=rows.filter(r=>r.selected&&r.status==='新增');if(!selected.length)throw Error('请选择要新增的乘客');if(o.bookedSeats!==''&&o.people.length+selected.length>Number(o.bookedSeats))throw Error('导入后名单人数超过订购席位，请调整本次选择或核对订购数量');const check=preview(o,selected.map(r=>r.p));if(check.some(r=>r.status!=='新增'))throw Error('名单已变化，请重新预览');o.people.push(...selected.map((r,i)=>({...r.p,id:'CHI'+Date.now()+'-'+i,sourceName:name,cabin:o.legs[0]?.cabin||'经济舱'})));return selected.length;}
function sampleRows(count=12,offset=0){return Array.from({length:count},(_,i)=>({...samplePerson(i+offset),sourceRow:i+2}));}
function demo(use='外部客户分销'){const o=M.blank();o.type='包机票';init(o,use);if(use==='内部团队供票')selectGroup(o,'MD20261219001');else{Object.assign(o,{customer:use==='余位散卖'?'张建国':'环游同行旅行社',contact:'示例联系人'});selectProject(o,'CH20261219001');selectFlight(o,'CH1219');selectQuota(o,use==='余位散卖'?'public':quotaOptions(o).find(q=>q.key!=='public').key);o.bookedSeats=use==='余位散卖'?2:20;o.people=use==='余位散卖'?sampleRows(2):sampleRows(12);}
 Object.assign(o,{unitPrice:use==='内部团队供票'?5000:5500,priceBasis:'演示分销报价 CH-1219',quoteUntil:'2026-12-10',editReason:'包机供票演示'});quote(o);M.syncTickets(o);return o;}
function upgrade(o){if(o.charterVersion)return;const old=copy(o),s=M.seats.find(s=>s.id===o.seat);init(o,o.customerType==='内部'?'内部团队供票':o.customerType==='散客'?'余位散卖':'外部客户分销');Object.assign(o,{customer:old.customer,customerType:old.customerType,people:old.people,bookedSeats:old.people.length});if(s?.project){selectProject(o,s.project);const f=project(o)?.flights.find(f=>f.date===s.date);if(f){selectFlight(o,f.id);const q=quotaOptions(o).find(q=>q.available>0);if(q)selectQuota(o,q.key);}}Object.assign(o,{priceMode:'整单报价',sale:old.sale,service:old.service,priceBasis:old.priceBasis,installments:old.installments,terms:old.terms,bookingPnr:old.bookingPnr||'',bookingAirlineNo:old.bookingAirlineNo||'',tickets:old.tickets});}
return {uses,groups,sales,projects,activeProjects,project,flight,manual,init,clearQuote,clearSupply,quotaOptions,selectProject,selectFlight,selectQuota,selectGroup,selectOrders,quote,rosterStats,errors,confirmIssues,importHeaders,importFields,preview,applyImport,sampleRows,demo,upgrade};
});
