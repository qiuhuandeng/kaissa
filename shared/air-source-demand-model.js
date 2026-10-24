/* 航服供票需求：显式选择供票单与航段，来源事实和供票确认分开。 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./air-orders-model.js'):root.AirOrders);if(typeof module==='object'&&module.exports)module.exports=api;else root.AirSourceDemand=api;})(typeof window!=='undefined'?window:globalThis,function(M){
'use strict';
const copy=M.copy, activeStates=['待计调核对','待票务接收','待退改办理','待取消办理'];
const dateOK=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
const value=(s,k)=>(s.snapshot||[]).find(x=>x[0]===k)?.[1]||'';
function source(s){
 const range=value(s,'出发/回团').split(' / '),raw=s.amount,amount=raw===undefined||raw===''?null:Number(String(raw).replace(/[¥￥,\s]/g,''));
 return {productType:s.productType||'参团游',groupState:s.groupState||value(s,'团期状态')||value(s,'销售状态'),orderState:s.orderState||value(s,'订单状态'),orderNo:s.orderNo,productName:s.productName||'',group:s.group??value(s,'团期编号'),start:s.start||range[0]||'',end:s.end||range[1]||'',tourAmount:Number.isFinite(amount)?amount:null,currency:s.currency||'CNY',people:(s.people||[]).map(p=>({id:p.id,name:p.name,english:p.englishName??p.english??'',docType:p.docType||'护照',docNo:p.docNo||'',birth:p.birthday??p.birth??'',expiry:p.expiresAt??p.expiry??'',nationality:p.nationality||''}))};
}
function orders(data,s,role){return data.orders.filter(o=>o.sourceOrder===s.orderNo&&M.canSee(o,role));}
function latest(o){return o.sourceDemands?.at(-1)||null;}
function active(o){return (o.sourceDemands||[]).find(d=>activeStates.includes(d.state))||null;}
function base(o){return JSON.stringify({group:o.group,people:o.people,legs:o.legs,tickets:o.tickets,roster:o.roster,state:o.state,sale:o.sale,cost:o.cost,service:o.service,currency:o.currency,seat:o.seat,supplierConfirmed:o.supplierConfirmed,supplier:o.supplier,carrier:o.carrier,account:o.account,terms:o.terms,quoteUntil:o.quoteUntil,priceBasis:o.priceBasis,department:o.department,source:o.source});}
function canReview(o,d,role){return role==='superadmin'||role==='operator'&&o.company===M.roles.operator.company&&d.ownerGroup===M.roles.operator.group;}
function assertSame(o,d){if(base(o)!==d.base)throw Error('供票单已发生变化，请退回后按最新资料重新提交需求');}
function proposal(o,req,s){
 const ids=[...new Set(req.legIds||[])];if(!ids.length||ids.some(id=>!o.legs.some(l=>l.id===id)))throw Error('请选择本单受影响的航段');
 if(req.group!==o.group&&ids.length!==o.legs.length)throw Error('本单只有一个团号，转团须选择全部航段；部分转团请另行拆单');
 const peopleIds=[...new Set(req.peopleIds||[])];if(peopleIds.some(id=>!s.people.some(p=>p.id===id)))throw Error('所选乘客不在本次来源名单中');
 const next=copy(o);next.group=String(req.group??o.group).trim();
 for(const l of next.legs){if(ids.includes(l.id)){const date=req.dates?.[l.id];if(!dateOK(date))throw Error('请逐段填写有效的供票日期');l.date=date;l.people=peopleIds.slice();}else if(!l.people.length)l.people=o.people.map(p=>p.id);}
 // 空名单表示取消所选人段，不能用原订单“空数组代表全员”的规则扩回全部乘客。
 next.legs=next.legs.filter(l=>!ids.includes(l.id)||peopleIds.length);
 if(next.legs.some((l,i)=>i>0&&l.date<next.legs[i-1].date))throw Error('后续航段日期不能早于前序航段');
 const used=new Set(next.legs.flatMap(l=>l.people));
 next.people=[...used].map(id=>{const old=o.people.find(p=>p.id===id),p=peopleIds.includes(id)?s.people.find(p=>p.id===id):null;return p?{...(old||{origin:next.legs[0]?.from||'',cabin:'经济舱',meal:'普通餐'}),...copy(p)}:copy(old);});
 M.syncTickets(next);
 const changes=[...M.changes(o,next,{group:'供票团号'}),...ids.flatMap(id=>M.changes(o.legs.find(l=>l.id===id),next.legs.find(l=>l.id===id),{date:'供票日期'},(o.legs.find(l=>l.id===id).flight||id)+' / ')),...M.rosterDiff(o.people,next.people).flatMap(p=>p.changes.map(c=>({...c,label:p.name+' / '+p.kind+' / '+c.label})))];
 for(const id of ids){const a=o.legs.find(l=>l.id===id),b=next.legs.find(l=>l.id===id),before=a.people.length?a.people:o.people.map(p=>p.id),after=b?.people||[];if(JSON.stringify([...before].sort())!==JSON.stringify([...after].sort()))changes.push({label:(a.flight||id)+' / 参加乘客',before:before.map(id=>o.people.find(p=>p.id===id)?.name||id).join('、'),after:after.map(id=>next.people.find(p=>p.id===id)?.name||id).join('、')});}
 let protection='';try{M.protectIssued(o,next);}catch(e){protection=e.message;}
 // 已出票的团号变更也须核对原票归属，不能仅改团号绕过原票办理。
 if(next.group!==o.group&&o.tickets.some(t=>['已出票','结果待查'].includes(t.state)))protection='已有出票或待查记录，转团须核对原票及原团归属';
 const route=protection?'原票办理':!next.legs.length||!next.people.length?'取消办理':'更新未出票供票';
 return {next,changes,route,protection,legIds:ids,peopleIds};
}
function submit(data,s,requests,reason,role='sales'){
 if(role!=='superadmin'&&!['sales','operator'].includes(role))throw Error('仅销售或本团计调可提交来源供票需求');
 if(!s.orderNo||new Set(s.people.map(p=>p.id)).size!==s.people.length||s.people.some(p=>!p.id||!p.name))throw Error('来源订单或人员编号不完整、重复');
 if(!requests.length)throw Error('请选择受影响的供票单或另建供票单');
 if(new Set(requests.map(r=>r.orderId||'NEW')).size!==requests.length)throw Error('同一供票单不能重复选择');
 if(!reason?.trim())throw Error('请填写本次需求依据');
 const work=copy(data),results=[];
 for(let req of requests){
  let o=work.orders.find(o=>o.id===req.orderId),created=false;
  if(!req.orderId){
   if(s.productType!=='自由行'&&(!String(s.group||'').trim()||/^\d{4}-\d{2}-\d{2}$/.test(s.group)))throw Error('团队供票须关联已有团号，请先核对来源团期');
   if(req.group&&req.group!==s.group)throw Error('新供票单须归属来源订单所在团期');
   if(/停售|关闭|取消|终止|未开放|筹备/.test((s.groupState||'')+' '+(s.orderState||'')))throw Error('来源团期或订单已停止，不能新增供票');
   if(role==='sales'&&s.orderNo!==M.roles.sales.source)throw Error('当前销售无权提交此来源订单');
   if(role==='operator'&&s.group!==M.roles.operator.group)throw Error('当前计调无权提交此来源团期');
   if(!req.peopleIds?.length)throw Error('另建供票单至少选择一位乘客');const l=req.newLeg;if(!l||!dateOK(l.date)||!M.airports[l.from]||!M.airports[l.to]||l.from===l.to)throw Error('另建供票单须填写有效日期及出发、到达机场');
   if(work.orders.some(x=>x.sourceOrder===s.orderNo&&x.company===M.company&&x.state!=='已取消'&&x.legs.some(a=>a.date===l.date&&a.from===l.from&&a.to===l.to)&&(x.people.some(p=>req.peopleIds.includes(p.id))||(active(x)?.request.peopleIds||[]).some(id=>req.peopleIds.includes(id)))))throw Error('相同乘客及行程已有供票单，请选择原单核对');
   o=M.blank();Object.assign(o,{id:'HFSRC'+Date.now()+Math.random().toString(36).slice(2,6),customerType:'内部',customer:'北京凯撒国际旅行社',department:'待确认',type:'团队票',sourceOrder:s.orderNo,group:s.group,people:[],legs:[M.leg('L1',l.from,l.to,l.date,l.flight||'')],seatRequest:reason.trim(),priceBasis:'待票务确认供票报价'});work.orders.push(o);req={...req,legIds:['L1'],dates:{L1:l.date}};created=true;
  }
  if(!o||o.sourceOrder!==s.orderNo||!M.canSee(o,role))throw Error('所选供票单不属于当前来源订单或岗位范围');
  if(o.state==='已取消')throw Error('已取消供票单不能提交新需求');
  if(o.sourceConditionsPending)throw Error('本单上次变更的供票条件尚未复核');
  const pending=active(o);if(pending)throw Error(o.id+'已有'+pending.state+'的需求，请先处理或撤回');
  const p=proposal(o,req,s);
  if(/停售|关闭|取消|终止|未开放|筹备/.test((s.groupState||'')+' '+(s.orderState||''))&&p.next.tickets.some(t=>!o.tickets.some(old=>old.personId===t.personId&&old.legId===t.legId)))throw Error('来源团期或订单已停止，不能新增供票人段；退减沿原单办理');
  const prev=latest(o),signature=JSON.stringify({source:s,group:req.group,legIds:p.legIds,peopleIds:p.peopleIds,dates:req.dates});
  if(prev?.state==='已接收'&&prev.signature===signature){results.push({id:o.id,unchanged:true});continue;}
  const sourceChanges=prev?M.changes(prev.source,s,{group:'旅游团号',start:'旅游出发日期',end:'旅游回团日期',tourAmount:'旅游订单成交金额',currency:'旅游订单币种'}):[];
  const d={id:'GX'+Date.now()+Math.random().toString(36).slice(2,6),version:(prev?.version||0)+1,state:'待计调核对',source:copy(s),previousSource:copy(prev?.source||null),sourceChanges,request:copy(req),reason:reason.trim(),signature,base:base(o),ownerGroup:o.group||s.group,changes:p.changes,route:p.route,protection:p.protection,created,history:[]};
  o.sourceDemands||=[];o.sourceDemands.push(d);record(o,d,'提交供票需求',role,reason);results.push({id:o.id,version:d.version,unchanged:false});
 }
 data.orders=work.orders;return results;
}
function record(o,d,text,role,basis){const item={text,who:M.roles[role]?.name||role,time:new Date().toLocaleString('zh-CN'),basis};d.history.push(item);M.log(o,text+'第'+d.version+'版',role,{basis,changes:[...d.sourceChanges,...d.changes]});}
function review(o,role,note){const d=active(o);if(!d||d.state!=='待计调核对')throw Error('没有待计调核对的需求');if(!canReview(o,d,role))throw Error('仅原团负责计调可核对本次需求');assertSame(o,d);if(!note?.trim())throw Error('请填写核对意见');d.state='待票务接收';record(o,d,'计调确认供票需求',role,note.trim());return d;}
function accept(o,role,note){const d=active(o);if(!M.canEdit(o,role))throw Error('仅票务可接收供票需求');if(!d||d.state!=='待票务接收')throw Error('请先完成计调核对');assertSame(o,d);if(!note?.trim())throw Error('请填写票务接收意见');const p=proposal(o,d.request,d.source);
 if(p.route==='原票办理')d.state='待退改办理';
 else if(p.route==='取消办理')d.state='待取消办理';
 else{
  const rosterChanged=M.rosterDiff(o.people,p.next.people).length||o.roster.pending;
  const changed=p.changes.length>0;
  o.group=p.next.group;o.people=p.next.people;o.legs=p.next.legs;o.tickets=p.next.tickets;
  if(rosterChanged){o.roster.sourceVersion=Math.max(o.roster.sourceVersion,o.roster.latestVersion||0)+1;o.roster.latestVersion=o.roster.sourceVersion;o.roster.currentVersion=o.roster.sourceVersion;o.roster.claimed=o.roster.sourceVersion;o.roster.accepted=o.roster.sourceVersion;o.roster.pending=null;}
  if(changed){d.previousSeat=o.seat;o.seat='';o.seatRequest='供票需求 '+d.id+'；'+d.reason;o.supplierConfirmed=false;o.sourceConditionsPending=true;if(!o.tickets.some(t=>['已出票','结果待查'].includes(t.state)))o.state=d.created?'草稿':'待确认';}
  d.state='已接收';o.sourceFacts=copy(d.source);
 }
 d.acceptedBase=base(o);record(o,d,d.state==='已接收'?'票务接收供票需求':'票务接收，转'+(d.state==='待退改办理'?'原票处理':'取消核对'),role,note.trim());return d;
}
function reject(o,role,reason){const d=active(o);if(!d||!['待计调核对','待票务接收'].includes(d.state))throw Error('当前需求不能退回');if(!canReview(o,d,role)&&!M.canEdit(o,role))throw Error('当前岗位不能退回');if(!reason?.trim())throw Error('请填写退回原因');d.state='已退回';record(o,d,'退回供票需求',role,reason.trim());}
function withdraw(o,role){const d=active(o);if(!d||d.state!=='待计调核对')throw Error('计调确认后不能撤回，请由当前接收岗位退回');if((role!=='superadmin'&&!['sales','operator'].includes(role))||!M.canSee(o,role))throw Error('当前岗位不能撤回');d.state='已撤回';record(o,d,'撤回供票需求',role,d.reason);}
function confirmConditions(o,role,note){if(!M.canEdit(o,role)||!o.sourceConditionsPending)throw Error('当前没有可复核的供票条件');if(active(o))throw Error('请先完成来源需求处理');const errors=M.validate(o);if(errors.length)throw Error(errors.join('；'));if(!note?.trim())throw Error('请填写供应及原报价复核依据');o.sourceConditionsPending=false;o.supplierConfirmed=true;if(o.state==='待确认')o.state='待出票';record(o,latest(o),'复核供应并沿用原供票报价',role,note.trim());}
function originalTickets(o,d){const next=proposal(o,d.request,d.source).next;return o.tickets.filter(t=>{if(!['已出票','结果待查'].includes(t.state))return false;if(o.group!==next.group)return true;try{M.protectIssued({...o,tickets:[t]},next);return false;}catch{return true;}});}
function cancelOrder(o,role,note){const d=active(o);if(!M.canEdit(o,role)||d?.state!=='待取消办理'||o.tickets.some(t=>['已出票','结果待查'].includes(t.state)))throw Error('当前供票单不能直接取消');if(!note?.trim())throw Error('请填写取消依据');if(base(o)!==d.acceptedBase)throw Error('供票单已发生变化，请重新核对后取消');o.state='已取消';d.state='已取消';record(o,d,'确认取消未出票供票单',role,note.trim());}
return {source,orders,latest,active,base,proposal,submit,review,accept,reject,withdraw,confirmConditions,originalTickets,cancelOrder,canReview,dateOK};
});
