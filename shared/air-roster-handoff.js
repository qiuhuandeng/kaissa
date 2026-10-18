/* 来源订单只提交需求；计调核对和票务接收在各供票单内办理。 */
(function(){
'use strict';
const M=window.AirOrders,D=window.AirSourceDemand,V=window.AirSourceDemandViews,table=document.getElementById('travelerTableRows');if(!M||!D||!V||!table)return;
const get=window.OrderTravelerSource?.get,role='superadmin',salesPage=location.pathname.includes('/sales/');
if(get&&!['参团游','自由行'].includes(get().productType))return;
const orderNo=get?get().orderNo:document.getElementById('orderNo')?.textContent.trim();if(!orderNo)return;
const box=document.createElement('div');box.className='ao-handoff-toolbar';table.closest('.table-wrap').before(box);
function render(){box.replaceChildren();const rows=D.orders(M.load(),{orderNo},role),status=document.createElement('span');status.className='text-muted';status.textContent=rows.length?'关联供票 '+rows.length+' 单':'尚无供票需求';box.append(status);
 if(get){const submit=document.createElement('button');submit.type='button';submit.className='btn btn-secondary';submit.textContent='提交供票需求';submit.onclick=()=>V.openSubmit(get,role,render);box.append(submit);}
 for(const o of rows){const a=document.createElement('a');a.className='btn btn-secondary';a.textContent=o.id+' · '+(D.active(o)?.state||o.state);a.href=(salesPage?'../tour/':'')+'air-order-detail.html?id='+encodeURIComponent(o.id)+'&role='+role;box.append(a);}
}
window.addEventListener('air-source-demand-updated',render);render();
})();
