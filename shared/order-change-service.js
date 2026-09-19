(function () {
  'use strict';
  var travelerPanel = document.getElementById('tab-travelers');
  var receivablePanel = document.getElementById('tab-receivable');
  if (!travelerPanel || !receivablePanel) return;
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>'"]/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];}); }
  function openLayer(layer) { if (window.caesarUI && window.caesarUI.openLayer) window.caesarUI.openLayer(layer); else { layer.hidden=false; layer.classList.add('show'); } }
  function closeLayer(layer) { if (window.caesarUI && window.caesarUI.closeLayer) window.caesarUI.closeLayer(layer); else { layer.classList.remove('show'); layer.hidden=true; } }
  function statusClass(status) { return status === '已确认' ? 'tag tag-green' : status === '不可供' ? 'tag tag-red' : status === '待销售确认' ? 'tag tag-blue' : 'tag tag-orange'; }

  var visaSection = document.getElementById('orderVisaSection');
  var serviceSection = document.createElement('section');
  serviceSection.id = 'orderSpecialServiceSection';
  serviceSection.className = 'order-visa-section order-special-service-section';
  serviceSection.innerHTML = '<div class="order-tab-section-head"><div><div class="detail-section-title">独立服务项目</div><p class="order-visa-context">房型、联运、升舱和加床分别记录申请、价格及资源确认结果</p></div><button id="addOrderSpecialService" class="btn btn-outline btn-sm" type="button" data-drawer-title="服务项目处理">新增服务项</button></div><div class="table-wrap order-detail-table"><table><thead><tr><th>申请游客</th><th>服务项目</th><th>申请内容</th><th>对客价格</th><th>资源确认</th><th>确认结果</th><th>操作</th></tr></thead><tbody id="orderSpecialServiceRows"></tbody></table></div>';
  if (visaSection) visaSection.insertAdjacentElement('afterend', serviceSection); else travelerPanel.querySelector('.product-detail-tab-inner').appendChild(serviceSection);

  receivablePanel.querySelector('.product-detail-tab-inner').insertAdjacentHTML('beforeend', '<section class="order-tab-section" id="settledAdjustmentSection"><div class="order-section-action-head"><div><div class="detail-section-title">结算后追加调整</div><p class="order-visa-context">已结算错误只新增调整记录，原结算结果保持不变</p></div><button id="openSettledAdjustment" class="btn btn-outline btn-sm" type="button" data-drawer-title="结算后追加调整">追加调整</button></div><div class="table-wrap order-detail-table"><table><thead><tr><th>原结算结果</th><th>本次调整</th><th>原因</th><th>申请人/时间</th><th>审批状态</th></tr></thead><tbody id="settledAdjustmentRows"><tr><td colspan="5" class="table-empty-cell">暂无追加调整</td></tr></tbody></table></div></section>');

  document.body.insertAdjacentHTML('beforeend', [
    '<div id="orderSpecialServiceDrawer" class="modal-overlay drawer-overlay" aria-hidden="true" hidden><section class="modal drawer-modal drawer-md order-detail-drawer" role="dialog" aria-modal="true" aria-labelledby="orderSpecialServiceTitle"><div class="modal-header"><div id="orderSpecialServiceTitle" class="modal-title">服务项目处理</div><button class="modal-close" type="button" data-close-order-extension>×</button></div><div class="modal-body"><div class="form-grid">',
    '<label class="form-group"><span class="form-label">申请游客</span><input id="orderServiceTraveler" class="form-control" value="张建国"></label><label class="form-group"><span class="form-label">服务项目</span><select id="orderServiceName" class="form-control"><option>房型</option><option>联运</option><option>升舱</option><option>加床</option></select></label>',
    '<label class="form-group form-group-full"><span class="form-label">申请内容</span><input id="orderServiceRequest" class="form-control" value="全程单人间"></label><label class="form-group"><span class="form-label">对客价格</span><input id="orderServicePrice" class="form-control" value="¥1,200"></label><label class="form-group"><span class="form-label">资源确认</span><select id="orderServiceResource" class="form-control"><option>需要确认</option><option>无需确认</option></select></label>',
    '<label class="form-group"><span class="form-label">确认结果</span><select id="orderServiceResult" class="form-control"><option>待确认</option><option>已确认</option><option>不可供</option><option>待销售确认</option></select></label><label class="form-group"><span class="form-label">确认依据</span><input id="orderServiceBasis" class="form-control" placeholder="确认号/供应商回复"></label>',
    '</div><p id="orderServiceError" class="form-error" hidden></p></div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-close-order-extension>取消</button><button id="saveOrderSpecialService" class="btn btn-primary" type="button">保存</button></div></section></div>',
    '<div id="settledAdjustmentDrawer" class="modal-overlay drawer-overlay" aria-hidden="true" hidden><section class="modal drawer-modal drawer-md order-detail-drawer" role="dialog" aria-modal="true" aria-labelledby="settledAdjustmentTitle"><div class="modal-header"><div id="settledAdjustmentTitle" class="modal-title">结算后追加调整</div><button class="modal-close" type="button" data-close-order-extension>×</button></div><div class="modal-body">',
    '<section class="readonly-summary">原结算结果：订单应收¥25,600 / 实收¥25,600 / 已结算；原记录只读保留。</section><div class="form-grid"><label class="form-group"><span class="form-label">调整方向</span><select id="settledAdjustmentDirection" class="form-control"><option>追加应收</option><option>追加减免</option></select></label><label class="form-group"><span class="form-label">本次调整金额</span><input id="settledAdjustmentAmount" class="form-control" type="number" min="0"></label><label class="form-group form-group-full"><span class="form-label">调整原因</span><textarea id="settledAdjustmentReason" class="form-control" rows="3" placeholder="填写原结算错误、本次调整依据和影响范围"></textarea></label></div><p id="settledAdjustmentError" class="form-error" hidden></p>',
    '</div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-close-order-extension>取消</button><button id="saveSettledAdjustment" class="btn btn-primary" type="button">提交审批</button></div></section></div>'
  ].join(''));

  var services = [
    { traveler:'张建国', name:'房型', request:'全程单人间', price:'¥1,200', resource:'需要确认', result:'待确认', basis:'' },
    { traveler:'李梅', name:'联运', request:'天津—北京往返联运', price:'¥600', resource:'需要确认', result:'已确认', basis:'LY-20260704-008' },
    { traveler:'李梅', name:'加床', request:'巴黎酒店加床1晚', price:'待报价', resource:'需要确认', result:'待销售确认', basis:'酒店回复需补差' }
  ];
  var editIndex = -1;
  function renderServices() {
    document.getElementById('orderSpecialServiceRows').innerHTML = services.map(function(item,index){return '<tr><td>'+esc(item.traveler)+'</td><td><strong>'+esc(item.name)+'</strong></td><td>'+esc(item.request)+'</td><td>'+esc(item.price)+'</td><td>'+esc(item.resource)+'</td><td><span class="'+statusClass(item.result)+'">'+esc(item.result)+'</span><span class="table-cell-sub">'+esc(item.basis||'依据待补')+'</span></td><td><button class="table-action-primary" type="button" data-drawer-title="服务项目处理" data-edit-order-service="'+index+'">处理</button></td></tr>';}).join('');
  }
  renderServices();

  var serviceDrawer=document.getElementById('orderSpecialServiceDrawer');
  var adjustmentDrawer=document.getElementById('settledAdjustmentDrawer');
  function fillService(item){document.getElementById('orderServiceTraveler').value=item.traveler;document.getElementById('orderServiceName').value=item.name;document.getElementById('orderServiceRequest').value=item.request;document.getElementById('orderServicePrice').value=item.price;document.getElementById('orderServiceResource').value=item.resource;document.getElementById('orderServiceResult').value=item.result;document.getElementById('orderServiceBasis').value=item.basis||'';document.getElementById('orderServiceError').hidden=true;}
  document.addEventListener('click',function(event){
    var edit=event.target.closest('[data-edit-order-service]');
    if(edit){editIndex=Number(edit.dataset.editOrderService);fillService(services[editIndex]);openLayer(serviceDrawer);return;}
    if(event.target.closest('#addOrderSpecialService')){editIndex=-1;fillService({traveler:'',name:'房型',request:'',price:'',resource:'需要确认',result:'待确认',basis:''});openLayer(serviceDrawer);return;}
    if(event.target.closest('#openSettledAdjustment')){document.getElementById('settledAdjustmentAmount').value='';document.getElementById('settledAdjustmentReason').value='';document.getElementById('settledAdjustmentError').hidden=true;openLayer(adjustmentDrawer);return;}
    var close=event.target.closest('[data-close-order-extension]');if(close)closeLayer(close.closest('.modal-overlay'));
  });
  document.getElementById('saveOrderSpecialService').addEventListener('click',function(){var item={traveler:document.getElementById('orderServiceTraveler').value.trim(),name:document.getElementById('orderServiceName').value,request:document.getElementById('orderServiceRequest').value.trim(),price:document.getElementById('orderServicePrice').value.trim(),resource:document.getElementById('orderServiceResource').value,result:document.getElementById('orderServiceResult').value,basis:document.getElementById('orderServiceBasis').value.trim()};var error=document.getElementById('orderServiceError');if(!item.traveler||!item.request||!item.price||(item.result==='已确认'&&!item.basis)){error.textContent='请填写游客、申请内容、价格；确认成功时必须填写确认依据。';error.hidden=false;return;}if(editIndex<0)services.push(item);else services[editIndex]=item;renderServices();closeLayer(serviceDrawer);});
  var adjustments=[];
  document.getElementById('saveSettledAdjustment').addEventListener('click',function(){var amount=Number(document.getElementById('settledAdjustmentAmount').value||0);var reason=document.getElementById('settledAdjustmentReason').value.trim();var error=document.getElementById('settledAdjustmentError');if(amount<=0||!reason){error.textContent='本次调整金额必须大于0，并填写调整原因。';error.hidden=false;return;}adjustments.push({direction:document.getElementById('settledAdjustmentDirection').value,amount:amount,reason:reason});document.getElementById('settledAdjustmentRows').innerHTML=adjustments.map(function(item,index){return '<tr><td>原应收¥25,600 / 已结算</td><td>'+esc(item.direction)+' ¥'+item.amount.toLocaleString('zh-CN')+'</td><td>'+esc(item.reason)+'</td><td>王芳 / 2026-09-19</td><td><span class="tag tag-orange">待审批</span></td></tr>';}).join('');closeLayer(adjustmentDrawer);});
  [serviceDrawer,adjustmentDrawer].forEach(function(layer){layer.addEventListener('click',function(event){if(event.target===layer)closeLayer(layer);});});
})();
