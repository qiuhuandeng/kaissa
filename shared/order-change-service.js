(function(){
  'use strict';
  var travelers=document.querySelector('#tab-travelers .product-detail-tab-inner'),receivable=document.querySelector('#tab-receivable .product-detail-tab-inner'),ctx=window.OrderAmendmentContext;
  if(!travelers||!receivable||!ctx)return;
  function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  var section=document.createElement('section');section.className='order-visa-section order-special-service-section amend-records';section.id='orderSpecialServiceSection';
  section.innerHTML='<div class="order-tab-section-head"><h3 class="detail-section-title">独立服务项目</h3><button id="addOrderSpecialService" class="btn btn-secondary btn-sm" type="button">新增服务项</button></div><div class="table-wrap"><table><thead><tr><th>服务申请</th><th>涉及游客</th><th>服务安排</th><th>应收差额</th><th>负责计调</th><th>状态</th><th class="amend-action">操作</th></tr></thead><tbody id="orderSpecialServiceRows"></tbody></table></div>';
  travelers.appendChild(section);
  var records=document.createElement('section');receivable.appendChild(records);window.OrderAmendmentUI.watch(records,ctx);
  document.body.insertAdjacentHTML('beforeend','<div id="orderSpecialServiceDrawer" class="modal-overlay drawer-overlay" aria-hidden="true"><section class="modal drawer-modal drawer-md" role="dialog" aria-modal="true" aria-labelledby="orderSpecialServiceTitle"><div class="modal-header"><h2 id="orderSpecialServiceTitle" class="modal-title">服务变更申请</h2><button type="button" class="modal-close" data-close-service-application aria-label="关闭">×</button></div><div class="modal-body"><div id="orderSpecialServiceForm"></div></div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-close-service-application>取消</button><button id="saveOrderSpecialService" class="btn btn-primary" type="button">提交申请</button></div></section></div>');
  var drawer=document.getElementById('orderSpecialServiceDrawer');
  function render(){
    var rows=window.OrderAmendmentUI.list(ctx.orderNo).filter(function(r){return r.resource;});
    document.getElementById('orderSpecialServiceRows').innerHTML=rows.length?rows.map(function(r){return '<tr><td>'+esc(r.item)+'<span class="table-cell-sub">'+esc(r.no)+'</span></td><td>'+esc(r.traveler)+'</td><td>'+esc(r.request)+'</td><td>'+esc(r.delta===null?'待报价':window.OrderAmendmentModel.money(r.delta))+'</td><td>'+esc(r.operator)+'</td><td>'+esc(r.status)+'</td><td class="amend-action"><button type="button" class="table-link" data-amend-view="'+r.no+'">查看</button></td></tr>';}).join(''):'<tr><td colspan="7" class="table-empty-cell">暂无服务变更申请</td></tr>';
  }
  document.getElementById('addOrderSpecialService').onclick=function(){ctx=window.OrderAmendmentContext;var item=window.OrderAmendmentModel.items(ctx.type).find(window.OrderAmendmentModel.needsResource)||window.OrderAmendmentModel.items(ctx.type)[0];window.OrderAmendmentUI.mount(document.getElementById('orderSpecialServiceForm'),ctx,document.getElementById('saveOrderSpecialService'),{item:item});window.caesarUI.openLayer(drawer);};
  document.addEventListener('click',function(e){if(e.target.closest('[data-close-service-application]'))window.caesarUI.closeLayer(drawer);});
  document.addEventListener('order-amendments-changed',render);render();
})();
