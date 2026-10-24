/* Carry the reviewed batch decision into the existing after-sales detail. No financial posting or storage writes. */
(function () {
  'use strict';
  const p=new URLSearchParams(location.search);
  if(p.get('fromCruiseTransfer')!=='1'||!p.get('orderNo'))return;
  const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const type=p.get('type')==='退款'?'退款':'转团/改期',refund=type==='退款',delta=Number(p.get('delta')||0);
  const d={productType:'邮轮',type,status:'审批中',node:'售后审批',date:'2026-10-23',serviceNo:p.get('serviceNo'),orderNo:p.get('orderNo'),customer:p.get('customer'),passengers:p.get('people')+'人 / 原'+(p.get('sourceRooms')||p.get('rooms'))+'间',product:p.get('product'),schedule:p.get('sourceSchedule'),reason:refund?'航次变更，客户选择退款':'航次变更，客户选择转团',amount:refund?'退款金额待核对':(delta<0?'退差 ¥':'补差 ¥')+Math.abs(delta).toLocaleString('zh-CN'),deduction:'船方实际扣损与对客扣费分别核对',resource:refund?'原舱房保留，释放待售后确认':p.get('targetSchedule')+' / '+p.get('cabin')+' / 预留'+p.get('rooms')+'间；原占用保留',finance:'客户实收保留原订单，未退款或转款；供应商预付及成本另行办理',owner:'邮轮计调',cruiseTarget:p.get('targetLabel')||'不转团',cruisePlan:p.get('plan'),cruiseOriginal:p.get('sourceCabin'),cruiseContract:p.get('contract'),cruiseTargetSchedule:p.get('targetSchedule'),cruiseCabin:p.get('cabin'),cruiseRooms:p.get('rooms'),cruiseSourceRooms:p.get('sourceRooms')||p.get('rooms'),cruiseDelta:p.get('delta')};
  const row=document.createElement('tr');Object.assign(row.dataset,d);row.innerHTML='<td><strong>'+esc(d.serviceNo)+'</strong><span class="text-muted">'+esc(d.orderNo)+'</span></td><td><strong>'+esc(d.customer)+'</strong><span class="text-muted">'+esc(d.passengers)+'</span></td><td><strong>'+esc(d.product)+'</strong><span class="text-muted">'+esc(d.schedule)+'</span></td><td>'+esc(d.amount)+'</td><td><span class="tag tag-orange">审批中</span></td><td><div class="table-action"><button class="table-action-primary" data-open-after-detail type="button">详情</button></div></td>';
  document.getElementById('afterSalesRows').prepend(row);
})();
