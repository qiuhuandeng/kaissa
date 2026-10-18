/* 需求复核反例：只操作内存副本，不修改原型、浏览器记录或真实业务。
 * 运行：node docs/evidence/air-requirements-review-20261017/reproduce.cjs
 * issueObserved 表示当前缺陷仍可复现，不是业务验收通过。
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../../..');
const M=require(path.join(root,'shared/air-orders-model.js'));
const B=require(path.join(root,'shared/air-business-model.js'));
const Q=require(path.join(root,'shared/air-reports-model.js'));
const A=require(path.join(root,'shared/air-close-model.js'));
const C=require(path.join(root,'shared/air-charter-model.js'));
const F=require(path.join(root,'shared/air-funds-model.js'));
const results=[];
function observe(id,name,fn){try{results.push({id,name,...fn()});}catch(e){results.push({id,name,unexpectedError:e.stack});}}
observe('R01','一张票两航段日报重复建单',()=>{
 const db={orders:[],transactions:[],batches:[]};
 const row={type:'出票',issuedDate:'2026-10-17',ticket:'9991111222233',original:'',pnr:'AUD001',airlineNo:'AUD-CA01',name:'复核乘客',docNo:'DEMOAUD01',date:'2026-11-20',flight:'CA931',from:'PEK',to:'FRA',fare:1300,tax:200,cost:1500,customer:'复核企业',sale:1800,currency:'CNY',internal:'否',group:''};
 const batch=M.applyImport([row,{...row,date:'2026-11-27',flight:'CA932',from:'FRA',to:'PEK'}],db);
 return {issueObserved:db.orders.length===2,expected:'同一张联程票保留两个航段，票价及成本按票计一次；无法判断金额粒度时要求复核',actual:{orders:db.orders.length,tickets:db.orders.map(o=>o.tickets[0].ticket),costTotal:db.orders.reduce((s,o)=>s+o.cost,0),saleTotal:db.orders.reduce((s,o)=>s+o.sale,0),applied:batch.results.map(r=>r.state)}};
});
observe('R02','已出票名单版本直接覆盖身份',()=>{
 const o=M.seed().orders[6],old=M.copy(o.people[0]),ticket=o.tickets[0].ticket;
 M.receiveSource(o,[{...old,name:'另一测试乘客',docNo:'DEMOCHANGED'}]);M.claim(o,'ticket');M.accept(o,'ticket');
 return {issueObserved:o.people[0].name!==old.name&&o.tickets[0].ticket===ticket&&o.tickets[0].state==='已出票',expected:'已出票身份变更保留原乘机人，并转入变更核对',actual:{oldName:old.name,newName:o.people[0].name,ticket:o.tickets[0].ticket,state:o.tickets[0].state,latestLog:o.history[0]}};
});
observe('R03','仅国籍和证件类型变化未形成新名单',()=>{
 const db=M.seed(),o=db.orders[0];o.roster.pending=null;const version=o.roster.sourceVersion;
 const source={productType:'参团游',orderNo:o.sourceOrder,people:o.people.map(p=>({id:p.id,name:p.name,englishName:p.english,docType:'其他出入境证件',docNo:p.docNo,birthday:p.birth,expiresAt:p.expiry,nationality:'测试国籍'}))};
 let click,status;function element(tag){const e={append(){},querySelector(){return null;},addEventListener(event,fn){if(tag==='button')click=fn;}};if(tag==='span')status=e;return e;}
 const document={createElement:element,getElementById:()=>({closest:()=>({before(){}})})};
 const window={OrderTravelerSource:{get:()=>source},AirOrders:{...M,load:()=>db,save:()=>true}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'shared/air-roster-handoff.js'),'utf8'),{window,document,location:{pathname:'/sales/orders-detail.html'}});click();
 return {issueObserved:o.roster.sourceVersion===version&&!o.roster.pending,expected:'证件类型或国籍变更也须产生可核对的新版本',actual:{versionBefore:version,versionAfter:o.roster.sourceVersion,message:status.textContent,oldDocType:o.people[0].docType,submittedDocType:source.people[0].docType}};
});
observe('R04','作废结算后订单从未提结算遗漏',()=>{
 const b=B.seed(),s=b.settlements.find(s=>s.state==='草稿'),ids=s.lines.map(l=>l.orderId),ctx={B,b,c:{projects:[]}};
 const before=Q.build('unsettled',ctx).filter(x=>ids.includes(x.order)).map(x=>x.order);B.cancel(s,'ticket');
 const after=Q.build('unsettled',ctx).filter(x=>ids.includes(x.order)).map(x=>x.order);
 return {issueObserved:before.length===2&&after.length===0,expected:'作废结算不等于已提交有效结算，订单仍应列入待提范围',actual:{state:s.state,before,after}};
});
observe('R05','已作废结算仍计入毛利合计',()=>{
 const b=B.seed(),s=b.settlements.find(s=>s.state==='草稿');B.cancel(s,'ticket');
 const report=Q.query('profit',Q.build('profit',{B,b,c:{projects:[]}}),{}),row=report.rows.find(x=>x.id===s.id);
 return {issueObserved:!!row,expected:'作废金额不应混入有效经营毛利合计；如需查看历史则单独分组',actual:{row:row?.cells,totals:report.totals}};
});
observe('R06','未指定结算期间被放入固定十月查询',()=>{
 const b=B.seed(),s=b.settlements.find(s=>s.state==='草稿');s.period='';
 const row=Q.query('profit',Q.build('profit',{B,b,c:{projects:[]}}),{from:'2026-10-01',to:'2026-10-31'}).rows.find(x=>x.id===s.id);
 return {issueObserved:!!row,expected:'未定期间不能用固定月份代替，应单列待确认',actual:{displayedPeriod:row?.cells[0],filterDate:row?.date}};
});
observe('R07','订单开票入口缺少当前单据',()=>{
 const a=A.seed(),ids=M.seed().orders.map(o=>o.id),supported=ids.filter(id=>a.sources.some(s=>s.side==='销项'&&s.order===id)),missing=ids.filter(id=>!supported.includes(id));
 return {issueObserved:missing.includes('HF20261017007'),expected:'从当前订单进入应能办理本单，或明确展示本单不可申请的原因与处理入口',actual:{supported,missing,selectableOrders:A.visibleSources(a,'ticket').filter(s=>s.side==='销项').map(s=>s.order)}};
});
observe('R08','新包机节点付款被账户待审阻断且资金模块无审核动作',()=>{
 const c=C.seed(),p=c.projects.find(p=>p.id==='CH20261212001'),f=F.seed(),s=C.connectPayment(p,p.payments[1].id,f,'finance');let error='';
 try{F.request(f,{source:s.id,amount:128000,date:'2026-11-15',basis:'复核直签协议'},'ticket');}catch(e){error=e.message;}
 return {issueObserved:!s.approved&&!!error,expected:'保留账户审核拦截，同时给财务明确的审核／选择已审账户入口，再续原申请',actual:{account:s.account,approved:s.approved,error,fundsAccountApprovalFunction:Object.keys(F).filter(k=>/approv.*account|account.*approv/i.test(k))},note:'入口缺失另以 air-funds-ui.js 审阅核实；此例不主张自动核准账户'};
});
observe('R09','订单办理日志缺少办理人',()=>{
 const o=M.seed().orders[1];M.log(o,'复核资料更正');
 return {issueObserved:!o.history[0].who&&!o.history[0].actor,expected:'关键变更保存办理人、时间、前后值和审批／依据',actual:o.history[0]};
});
const result={date:'2026-10-17',scope:'内存反例验证；不替代完整浏览器验收',cases:results,observedIssues:results.filter(x=>x.issueObserved).length,unexpectedErrors:results.filter(x=>x.unexpectedError).length};
fs.writeFileSync(path.join(__dirname,'reproductions.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
if(result.unexpectedErrors)process.exitCode=1;
