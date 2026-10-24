(function (root) {
  'use strict';
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function quantities(value) {return {people:Number((String(value).match(/(\d+)人/)||[])[1]||0),rooms:Number((String(value).match(/(\d+)间/)||[])[1]||0)};}
  function transferError(order, target, used) {
    if(!Number.isInteger(order.people)||order.people<1)return '游客人数未核对';
    if(!target)return '未选择目标航次';
    const cabin=target.cabins.find(c=>c.code===order.targetCabin);
    if(!cabin)return '目标航次没有所选舱型';
    if(!Number.isFinite(target.available)||!Number.isFinite(cabin.available)||target.available<0||cabin.available<0)return '目标舱房余量待确认';
    if(!Number.isFinite(cabin.capacity)||cabin.capacity<1)return '目标舱房容量待确认';
    if(!Number.isInteger(order.rooms)||order.rooms<1)return '舱房间数未核对';
    if(order.people>order.rooms*cabin.capacity)return '人数超过目标舱房容量';
    if(order.rooms+(used[order.targetCabin]||0)>cabin.available)return '目标舱型可用间数不足';
    if(order.rooms+(used.total||0)>target.available)return '目标航次总可用间数不足';
    if(!Number.isFinite(order.delta))return '方案差额待核对';
    return '';
  }
  if(typeof module!=='undefined')module.exports={quantities,transferError};
  if(!root.document)return;
  let context,session;
  const $=id=>document.getElementById(id),money=n=>'¥'+Number(n||0).toLocaleString('zh-CN');
  function prepare(ctx,s) {
    context=ctx;session=s;
    session.cabinUsed=session.cabinUsed||{};
    ctx.targets.forEach(t=>{if(!t.cabins)t.supply+='（舱型余量为当前页演示分配）';t.cabins=t.cabins||[{code:'BA',capacity:4,available:Math.min(6,t.available)},{code:'OV',capacity:3,available:Math.min(4,Math.max(0,t.available-6))},{code:'SU',capacity:3,available:Math.min(2,Math.max(0,t.available-10))}];});
    session.orders.forEach(o=>{if(o.cruiseReady)return;const q=quantities(o.quantity);Object.assign(o,{people:q.people,rooms:q.rooms,sourceRooms:q.rooms,sourceCabin:(o.occupation.match(/BA|BC|OV|IC|SU/)||['BA'])[0],plan:'A 经典岸上',delta:0,cruiseReady:true});o.targetCabin=o.sourceCabin;});
  }
  function target(){return context.targets.find(t=>t.code===$('wholeTransferTarget').value);}
  function draw() {
    const t=target();
    $('wholeTransferRows').innerHTML=session.orders.map((o,i)=>{
      const disabled=o.processed?' disabled':'';
      const cabins=t?t.cabins:[];
      return '<tr data-transfer-index="'+i+'"><td><input type="checkbox" data-transfer-select'+(o.processed?' disabled':' checked')+'></td><td><strong>'+esc(o.no)+'</strong><span class="table-cell-sub">'+esc(o.customer)+'</span></td><td>'+o.people+'人 / '+o.sourceRooms+'间</td><td>'+esc(o.sourceCabin+' / '+o.occupation)+'<span class="table-cell-sub">原方案 A 经典岸上</span><label class="table-cell-sub">目标舱型<select class="form-control" data-cr-transfer="targetCabin"'+disabled+'><option value="">请选择</option>'+cabins.map(c=>'<option value="'+esc(c.code)+'"'+(c.code===o.targetCabin?' selected':'')+'>'+esc(c.code)+' / 可用'+Math.max(0,c.available-((session.cabinUsed[t.code]||{})[c.code]||0))+'间</option>').join('')+'</select></label><label class="table-cell-sub">目标间数<input class="form-control" type="number" min="1" step="1" data-cr-transfer="rooms" value="'+o.rooms+'"'+disabled+'></label></td><td>'+esc(o.contract)+'<span class="table-cell-sub">客户款：原单保留</span><span class="table-cell-sub">船方成本：另行核对</span></td><td><select class="form-control" data-transfer-decision'+disabled+'>'+['接受转团','退款','待决定'].map(x=>'<option'+((o.decision==='待客户确认'?'待决定':o.decision)===x?' selected':'')+'>'+x+'</option>').join('')+'</select><label class="table-cell-sub">目标方案<select class="form-control" data-cr-transfer="plan"'+disabled+'>'+['A 经典岸上','B 岸上自由'].map(x=>'<option'+(o.plan===x?' selected':'')+'>'+x+'</option>').join('')+'</select></label><label class="table-cell-sub">方案补退差额（元）<input class="form-control" type="number" data-cr-transfer="delta" value="'+o.delta+'"'+disabled+'></label></td><td><span class="tag '+(o.processed?'tag-blue':o.status==='未通过'?'tag-red':'tag-orange')+'">'+esc(o.status)+'</span><span class="table-cell-sub">'+esc(o.reason||'确认后逐单提交售后，原合同与款项保留')+'</span>'+(o.processed?'<a class="table-cell-sub" href="'+esc(handoff(o))+'">查看售后申请</a>':'')+'</td></tr>';
    }).join('')||'<tr><td colspan="7">当前航次暂无关联订单</td></tr>';
    $('confirmWholeTransfer').disabled=!session.orders.length||session.orders.every(o=>o.processed);
    $('confirmWholeTransfer').textContent=session.orders.every(o=>o.processed)?'已全部提交':'确认本次处理';
    if(t)$('wholeTransferSupply').textContent=t.supply+'；'+t.cabins.map(c=>c.code+'可用'+Math.max(0,c.available-((session.cabinUsed[t.code]||{})[c.code]||0))+'间').join(' / ')+'。仅预留目标舱房，原占用待售后确认后处理。';
  }
  function capture(){document.querySelectorAll('#wholeTransferRows tr[data-transfer-index]').forEach(row=>{const o=session.orders[Number(row.dataset.transferIndex)];if(o.processed)return;o.decision=row.querySelector('[data-transfer-decision]').value;row.querySelectorAll('[data-cr-transfer]').forEach(input=>{const k=input.dataset.crTransfer;o[k]=['rooms','delta'].includes(k)?Number(input.value):input.value;});});}
  function confirm() {
    capture();const t=target(),used=t?(session.cabinUsed[t.code]||{}):{};let submitted=0;
    document.querySelectorAll('#wholeTransferRows [data-transfer-select]:checked').forEach(input=>{const o=session.orders[Number(input.closest('tr').dataset.transferIndex)];
      if(o.processed)return;
      if(o.decision==='待决定'){o.status='待决定';o.reason='保留原航次、舱房、合同和客户款';return;}
      if(o.decision==='接受转团') { const error=transferError(o,t,used);if(error){o.status='未通过';o.reason=error+'；原订单保留';return;}used[o.targetCabin]=(used[o.targetCabin]||0)+o.rooms;used.total=(used.total||0)+o.rooms;o.targetCode=t.code;o.targetLabel=t.label;o.status='转团申请已提交';o.reason=t.code+' / 目标'+o.targetCabin+'预留'+o.rooms+'间；'+o.plan+'，补退差额'+money(o.delta)+'；待审批及合同办理'; }
      else {o.status='退款申请已提交';o.reason='退款及对客扣费待售后核对；原舱房未释放，船方扣损另核';}
      o.processed=true;o.serviceNo='CR-CHG-'+o.no;o.source=context.code;o.product=context.product;submitted++;
    });
    if(t)session.cabinUsed[t.code]=used;draw();$('wholeTransferFeedback').hidden=false;$('wholeTransferFeedback').className='alert alert-blue';$('wholeTransferFeedback').textContent='本次提交'+submitted+'笔，未通过或待决定订单继续保留。客户实收未转用，供应商预付及成本未调整。';
  }
  function handoff(o){const params=new URLSearchParams({fromCruiseTransfer:'1',orderNo:o.no,serviceNo:o.serviceNo,type:o.decision==='退款'?'退款':'转团/改期',customer:o.customer,product:o.product,sourceSchedule:o.source,targetSchedule:o.targetCode||'',targetLabel:o.targetLabel||'',cabin:o.targetCabin,rooms:String(o.rooms),people:String(o.people),plan:o.plan,delta:String(o.delta),contract:o.contract,sourceCabin:o.sourceCabin});return '../sales/orders-after-sales.html?'+params;}
  root.CaesarCruiseTransfer={prepare,draw,capture,confirm};
})(typeof window==='undefined'?globalThis:window);
