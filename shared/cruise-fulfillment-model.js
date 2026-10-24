/* 同一航次的订单接收与本团履约读取；不改变销售、库存或财务单据。 */
(function(root){
'use strict';
const M=typeof module!=='undefined'?require('./cruise-room-model.js'):root.CaesarCruiseRooms;
const confirmed=['已确认','待出团','出团中','已出团','已完成'];
function storedOrders(){try{return Object.values(JSON.parse(root.localStorage.getItem('caesarOrderFinanceEvents')||'{}').orders||{});}catch(_){return [];}}
function sources(s,v,orders=storedOrders()){
 const map=new Map();
 s.groups.filter(g=>g.voyage===v).forEach(g=>{if(!map.has(g.order))map.set(g.order,{no:g.order,voyage:v,schedule:g.schedule,status:'已确认',rooms:[],origin:'已接收订单'});map.get(g.order).rooms.push({id:g.id,cabin:g.cabin,people:g.members.map(id=>M.clone(s.people.find(p=>p.id===id)))});});
 orders.filter(o=>o.cruiseBookingDetails?.supply?.voyage===v).forEach(o=>{const d=o.cruiseBookingDetails;map.set(o.orderNo,{no:o.orderNo,voyage:v,schedule:o.sourceNo||o.salesSnapshot?.scheduleNo||'',status:o.orderStatus,customer:o.customer||o.contactName||'',origin:'销售订单',rooms:(d.rooms||[]).flatMap((r,i)=>(r.rooms||[]).map((room,j)=>({id:o.orderNo+'-'+i+'-'+j,cabin:r.spec.split(/\s+/).at(-1),people:room.people||[]})))});});
 return [...map.values()].map(o=>({...o,accepted:s.groups.some(g=>g.voyage===v&&g.order===o.no),eligible:confirmed.includes(o.status),people:o.rooms.reduce((n,r)=>n+r.people.length,0)}));
}
function accept(s,source){
 if(!confirmed.includes(source.status))throw Error('订单尚未确认或已取消，暂不进入出团名单');
 if(s.groups.some(g=>g.order===source.no))throw Error('该订单已接收，请核对原名单，不重复接收');
 if(!source.voyage||!source.schedule||!source.rooms.length||source.rooms.some(r=>!r.people.length))throw Error('航次、团期或入住安排待核对');
 source.rooms.forEach((r,i)=>{const members=r.people.map((p,j)=>{const id='P-'+source.no+'-'+i+'-'+j;s.people.push({id,name:p.name||'',surname:p.surname||'',given:p.given||'',birth:p.birth||'',gender:p.gender||'M',nationality:p.nationality||'CHN',passport:p.passport||'',expiry:p.expiry||'',visa:p.visa||'待补',photo:p.photo||'待补',preferences:p.preferences||[],diet:p.diet||'无',allergy:p.allergy||'',emergency:p.emergency||'',kind:p.kind||'adult'});return id;});s.groups.push({id:'G-'+source.no+'-'+i,voyage:source.voyage,schedule:source.schedule,order:source.no,label:source.no+' 第'+(i+1)+'间',cabin:r.cabin,room:'',members,relation:members.length===1?'独住':'朋友',receivedAt:M.stamp()});});
 M.log(s,source.voyage,source.no,'接收已确认订单名单；'+source.rooms.length+'间 / '+source.people+'人');
}
function scope(input={},s=M.read(),voyages=root.CaesarCruiseInventory?.read().voyages||[]){
 const gs=s.groups.filter(g=>(!input.order||g.order===input.order)&&(!input.schedule||g.schedule===input.schedule));
 const explicit=input.voyage;const vid=explicit||gs.find(g=>input.order||input.schedule)?.voyage;
 if(!vid)return null;
 const voyage=voyages.find(v=>v.id===vid);if(voyages.length&&!voyage)return null;
 let schedule=input.schedule||'';if(!schedule&&!input.order&&input.product)schedule=root.CaesarCruiseInventory?.products.find(p=>p.id===input.product)?.schedule||'';
 return {voyage:vid,schedule,order:input.order||'',executionState:input.executionStatus||'',settlementState:input.settlementStatus||'',saleState:input.saleStatus||'',end: voyage?.back||voyage?.date||'',date:voyage?.date||'',state:voyage?.status||'',groups:s.groups.filter(g=>g.voyage===vid&&(!schedule||g.schedule===schedule)&&(!input.order||g.order===input.order))};
}
const guests=(s,c)=>M.guests(s,c.voyage).filter(p=>c.groups.some(g=>g.members.includes(p.id)));
function orderChanges(s,c,orders=storedOrders()){return sources(s,c.voyage,orders).filter(o=>o.accepted&&c.groups.some(g=>g.order===o.no)).flatMap(o=>{const gs=c.groups.filter(g=>g.order===o.no),n=gs.reduce((n,g)=>n+g.members.length,0);return !o.eligible?[{order:o.no,text:'订单'+o.status+'，名单变更待核'}]:o.people!==n||o.rooms.length!==gs.length?[{order:o.no,text:'订单人数／间数已变更，名单待核'}]:[];});}
function travel(s,id){return s.travel?.[id]||{ticket:'',checkin:'待办理',boarding:'待登船',note:''};}
function canEditTravel(c){return !!c && c.state!=='取消' && c.saleState!=='已取消' && !['已结束','已归档'].includes(c.executionState) && !(c.executionState==='已回团' && c.settlementState==='已结算');}
function saveTravel(s,c,id,data){if(!guests(s,c).some(p=>p.id===id))throw Error('客人不在当前团期');if(!canEditTravel(c))throw Error('航次已取消或本团已结束，仅保留查看');if(!['待办理','已办理','不适用'].includes(data.checkin)||!['待登船','已登船','未登船'].includes(data.boarding))throw Error('请选择有效办理结果');s.travel=s.travel||{};s.travel[id]={ticket:data.ticket||'',checkin:data.checkin,boarding:data.boarding,note:data.note||'',at:M.stamp()};M.log(s,c.voyage,s.people.find(p=>p.id===id).name||id,'船票／值机／登船结果：'+data.checkin+' / '+data.boarding+(data.note?'；'+data.note:''));}
function readiness(s,c){const ps=guests(s,c),ms=M.manifestStatus(s,c.voyage,ps.map(p=>p.id));return {people:ps.length,rooms:c.groups.length,assigned:c.groups.filter(g=>g.room).length,missing:ps.filter(p=>M.missing(p,c.end).length).length,tickets:ps.filter(p=>travel(s,p.id).ticket).length,checkin:ps.filter(p=>['已办理','不适用'].includes(travel(s,p.id).checkin)).length,boarded:ps.filter(p=>travel(s,p.id).boarding==='已登船').length,notBoarded:ps.filter(p=>travel(s,p.id).boarding==='未登船').length,manifest:ms,changes:orderChanges(s,c)};}
const api={storedOrders,sources,accept,scope,guests,orderChanges,travel,saveTravel,canEditTravel,readiness};if(typeof module!=='undefined')module.exports=api;root.CaesarCruiseFulfillment=api;
})(typeof window==='undefined'?globalThis:window);
