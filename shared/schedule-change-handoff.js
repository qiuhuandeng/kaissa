(function () {
  'use strict';

  var page = document.querySelector('.schedule-detail-page');
  if (!page) return;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char];
    });
  }

  function openLayer(layer) {
    if (window.caesarUI && window.caesarUI.openLayer) window.caesarUI.openLayer(layer);
    else { layer.hidden = false; layer.classList.add('show'); layer.setAttribute('aria-hidden', 'false'); }
  }

  function closeLayer(layer) {
    if (window.caesarUI && window.caesarUI.closeLayer) window.caesarUI.closeLayer(layer);
    else { layer.classList.remove('show'); layer.setAttribute('aria-hidden', 'true'); layer.hidden = true; }
  }

  function resultMessage(title, text) {
    var success = document.getElementById('successModal');
    if (!success) return;
    var titleNode = document.getElementById('successTitle');
    var textNode = document.getElementById('successText');
    if (titleNode) titleNode.textContent = title;
    if (textNode) textNode.textContent = text;
    openLayer(success);
  }

  function drawerMarkup() {
    return [
      '<div id="wholeGroupTransferDrawer" class="modal-overlay drawer-overlay" aria-hidden="true" hidden>',
      '<section class="modal drawer-modal drawer-xl schedule-business-drawer" role="dialog" aria-modal="true" aria-labelledby="wholeGroupTransferTitle">',
      '<div class="modal-header"><div id="wholeGroupTransferTitle" class="modal-title">整团转移</div><button class="modal-close" type="button" data-close-schedule-extension aria-label="关闭">×</button></div>',
      '<div class="modal-body">',
      '<div class="schedule-process-steps"><span class="active">1 选择订单</span><span>2 记录决定</span><span>3 确认目标资源</span><span>4 查看结果</span></div>',
      '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">目标团期与资源</h3></div>',
      '<div class="form-grid"><label class="form-group"><span class="form-label">目标团期</span><select id="wholeTransferTarget" class="form-control"><option value="EU20240728002" data-available="6">EU20240728002 / 2024-07-28 / 可用6人</option><option value="EU20240812003" data-available="2">EU20240812003 / 2024-08-12 / 可用2人</option></select></label>',
      '<div class="form-group"><span class="form-label">供应条件</span><div id="wholeTransferSupply" class="readonly-summary">同线路经济款；机位待确认6座；酒店房量已确认</div></div>',
      '<label class="form-group form-group-full checkbox-row"><input id="wholeTransferResourceConfirmed" type="checkbox"> 已核对目标名额及供应条件</label></div></section>',
      '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">受影响订单</h3><span class="schedule-muted">逐单选择并记录本次决定</span></div>',
      '<div class="table-wrap drawer-table-wrap"><table><thead><tr><th>选择</th><th>订单/客户</th><th>游客</th><th>原占用</th><th>合同/收款</th><th>本次决定</th><th>处理结果</th></tr></thead><tbody id="wholeTransferRows"></tbody></table></div>',
      '<p id="wholeTransferError" class="form-error" hidden></p></section>',
      '</div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-close-schedule-extension>取消</button><button id="confirmWholeTransfer" class="btn btn-primary" type="button">确认本次处理</button></div>',
      '</section></div>',

      '<div id="flightTimeChangeDrawer" class="modal-overlay drawer-overlay" aria-hidden="true" hidden>',
      '<section class="modal drawer-modal drawer-lg schedule-business-drawer" role="dialog" aria-modal="true" aria-labelledby="flightTimeChangeTitle">',
      '<div class="modal-header"><div id="flightTimeChangeTitle" class="modal-title">航班时刻变更申请</div><button class="modal-close" type="button" data-close-schedule-extension aria-label="关闭">×</button></div>',
      '<div class="modal-body"><section class="drawer-object-summary"><div class="drawer-summary-grid">',
      '<div class="drawer-summary-item"><span class="drawer-summary-label">团期</span><strong id="flightChangeSchedule">EU20240715001</strong></div>',
      '<div class="drawer-summary-item"><span class="drawer-summary-label">原航班</span><strong>CA933 / 2024-07-15 09:30</strong></div>',
      '<div class="drawer-summary-item"><span class="drawer-summary-label">原到达</span><strong>巴黎 / 2024-07-15 18:20</strong></div>',
      '<div class="drawer-summary-item"><span class="drawer-summary-label">已售订单</span><strong>6单 / 27人</strong></div>',
      '</div></section>',
      '<section class="drawer-section"><div class="form-grid"><label class="form-group"><span class="form-label">变更后起飞时间 <i class="req">*</i></span><input id="flightChangeDepart" class="form-control" type="datetime-local" value="2024-07-15T11:10"></label>',
      '<label class="form-group"><span class="form-label">变更后到达时间 <i class="req">*</i></span><input id="flightChangeArrival" class="form-control" type="datetime-local" value="2024-07-15T20:00"></label>',
      '<label class="form-group"><span class="form-label">资源影响</span><select id="flightChangeResourceImpact" class="form-control"><option>原机位继续有效</option><option>需重新确认机位</option></select></label>',
      '<label class="form-group"><span class="form-label">成本影响</span><select id="flightChangeCostImpact" class="form-control"><option>无金额变化</option><option>成本待复核</option><option>产生补差</option></select></label>',
      '<label class="form-group form-group-full"><span class="form-label">变更依据 <i class="req">*</i></span><textarea id="flightChangeBasis" class="form-control" rows="3" placeholder="填写航司通知编号、变更原因和客户通知要求"></textarea></label></div>',
      '<p id="flightChangeError" class="form-error" hidden></p></section>',
      '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">申请记录</h3></div><div class="table-wrap drawer-table-wrap"><table><thead><tr><th>申请号</th><th>原时刻</th><th>拟变时刻</th><th>资源影响</th><th>成本影响</th><th>审批结果</th></tr></thead><tbody id="flightChangeRecords"><tr><td colspan="6" class="table-empty-cell">尚未提交申请</td></tr></tbody></table></div></section>',
      '</div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-close-schedule-extension>取消</button><button id="submitFlightTimeChange" class="btn btn-primary" type="button">提交审批</button></div>',
      '</section></div>',

      '<div id="specialServiceConfirmDrawer" class="modal-overlay drawer-overlay" aria-hidden="true" hidden>',
      '<section class="modal drawer-modal drawer-md schedule-business-drawer" role="dialog" aria-modal="true" aria-labelledby="specialServiceConfirmTitle">',
      '<div class="modal-header"><div id="specialServiceConfirmTitle" class="modal-title">特殊服务确认</div><button class="modal-close" type="button" data-close-schedule-extension aria-label="关闭">×</button></div>',
      '<div class="modal-body"><section id="specialServiceSummary" class="readonly-summary"></section><div class="form-grid">',
      '<label class="form-group"><span class="form-label">供给结果 <i class="req">*</i></span><select id="specialServiceResult" class="form-control"><option value="">请选择</option><option>可供</option><option>不可供</option><option>需补差</option></select></label>',
      '<label class="form-group"><span class="form-label">补差金额</span><input id="specialServiceAmount" class="form-control" type="number" min="0" value="0"></label>',
      '<label class="form-group form-group-full"><span class="form-label">确认依据 <i class="req">*</i></span><textarea id="specialServiceBasis" class="form-control" rows="3" placeholder="填写供应商确认号、邮件或电话确认记录"></textarea></label>',
      '<label class="form-group form-group-full"><span class="form-label">处理说明</span><textarea id="specialServiceNote" class="form-control" rows="3" placeholder="不可供时填写替代建议；需补差时填写销售确认要求"></textarea></label>',
      '</div><p id="specialServiceError" class="form-error" hidden></p></div>',
      '<div class="modal-footer"><button class="btn btn-secondary" type="button" data-close-schedule-extension>取消</button><button id="saveSpecialService" class="btn btn-primary" type="button">保存确认结果</button></div>',
      '</section></div>'
    ].join('');
  }

  document.body.insertAdjacentHTML('beforeend', drawerMarkup());

  var transferOrders = [
    { no: 'KS202406180001', customer: '张建国', people: 2, occupation: '门店 / 2人', contract: '已签 / 已收齐', decision: '接受转团', status: '未处理', processed: false },
    { no: 'KS202406180002', customer: '李梅', people: 2, occupation: '代理 / 2人', contract: '已签 / 已收¥12,800', decision: '待客户确认', status: '待处理', processed: false },
    { no: 'KS202406180008', customer: '王磊', people: 3, occupation: '携程 / 3人', contract: '待签 / 未收款', decision: '接受转团', status: '未处理', processed: false }
  ];

  function renderTransferRows() {
    var rows = document.getElementById('wholeTransferRows');
    rows.innerHTML = transferOrders.map(function (order, index) {
      var tag = order.status === '成功' ? 'tag tag-green' : order.status === '失败' ? 'tag tag-red' : 'tag tag-orange';
      return '<tr data-transfer-index="' + index + '"><td><input type="checkbox" data-transfer-select' + (order.processed ? ' disabled' : ' checked') + '></td>' +
        '<td><strong>' + escapeHtml(order.no) + '</strong><span class="table-cell-sub">' + escapeHtml(order.customer) + '</span></td><td>' + order.people + '人</td><td>' + escapeHtml(order.occupation) + '</td><td>' + escapeHtml(order.contract) + '</td>' +
        '<td><select class="form-control table-input" data-transfer-decision' + (order.processed ? ' disabled' : '') + '><option' + (order.decision === '接受转团' ? ' selected' : '') + '>接受转团</option><option' + (order.decision === '待客户确认' ? ' selected' : '') + '>待客户确认</option><option' + (order.decision === '拒绝转团' ? ' selected' : '') + '>拒绝转团</option></select></td>' +
        '<td><span class="' + tag + '">' + escapeHtml(order.status) + '</span>' + (order.reason ? '<span class="table-cell-sub">' + escapeHtml(order.reason) + '</span>' : '') + '</td></tr>';
    }).join('');
  }

  var ordersHead = document.querySelector('#tab-orders .schedule-detail-block-head');
  if (ordersHead) {
    var link = document.getElementById('scheduleOrdersPageLink');
    var actions = document.createElement('div');
    actions.className = 'btn-group';
    actions.innerHTML = '<button id="openWholeGroupTransfer" class="btn btn-primary btn-sm" type="button" data-drawer-title="整团转移">整团转移</button>';
    if (link) actions.appendChild(link);
    ordersHead.appendChild(actions);
  }

  var resourceActions = document.querySelector('#tab-resource .schedule-detail-block-head .btn-group');
  if (resourceActions) resourceActions.insertAdjacentHTML('afterbegin', '<button id="openFlightTimeChange" class="btn btn-secondary" type="button" data-drawer-title="航班时刻变更申请">航班时刻变更</button>');

  var filesTab = document.getElementById('tab-files');
  var handoffBlocks = filesTab ? filesTab.querySelectorAll('.schedule-detail-block') : [];
  if (filesTab && handoffBlocks.length) {
    handoffBlocks[0].insertAdjacentHTML('afterend', [
      '<div class="schedule-detail-block" id="specialServiceBlock"><div class="schedule-detail-block-head"><div><h2 class="detail-section-title schedule-section-title">特殊服务确认</h2><span class="schedule-muted">按游客申请逐项确认供给结果</span></div></div>',
      '<div class="table-wrap"><table><thead><tr><th>游客/订单</th><th>服务项目</th><th>申请内容</th><th>对客价格</th><th>资源要求</th><th>确认结果</th><th>操作</th></tr></thead><tbody id="scheduleSpecialServiceRows"></tbody></table></div></div>'
    ].join(''));
  }

  var specialServices = [
    { person: '张建国 / KS202406180001', name: '联运', request: '天津—北京往返联运', price: '¥600/人', resource: '需交通确认', result: '待确认', basis: '', amount: 0 },
    { person: '李梅 / KS202406180002', name: '单房差', request: '全程单人间', price: '¥1,200/人', resource: '需酒店确认', result: '待确认', basis: '', amount: 0 },
    { person: '王磊 / KS202406180008', name: '升舱', request: '去程升级公务舱', price: '待报价', resource: '需航司确认', result: '待确认', basis: '', amount: 0 }
  ];
  var currentSpecialIndex = -1;

  function serviceStatusTag(result) {
    if (result === '可供') return 'tag tag-green';
    if (result === '不可供') return 'tag tag-red';
    if (result === '待销售确认') return 'tag tag-blue';
    return 'tag tag-orange';
  }

  function renderSpecialServices() {
    var body = document.getElementById('scheduleSpecialServiceRows');
    if (!body) return;
    body.innerHTML = specialServices.map(function (item, index) {
      return '<tr><td>' + escapeHtml(item.person) + '</td><td><strong>' + escapeHtml(item.name) + '</strong></td><td>' + escapeHtml(item.request) + '</td><td>' + escapeHtml(item.price) + '</td><td>' + escapeHtml(item.resource) + '</td><td><span class="' + serviceStatusTag(item.result) + '">' + escapeHtml(item.result) + '</span>' + (item.amount ? '<span class="table-cell-sub">补差¥' + item.amount + '</span>' : '') + '</td><td><button class="table-action-primary" type="button" data-drawer-title="特殊服务确认" data-confirm-special-service="' + index + '">' + (item.result === '待确认' ? '确认' : '查看/更新') + '</button></td></tr>';
    }).join('');
  }

  renderTransferRows();
  renderSpecialServices();

  var wholeDrawer = document.getElementById('wholeGroupTransferDrawer');
  var flightDrawer = document.getElementById('flightTimeChangeDrawer');
  var serviceDrawer = document.getElementById('specialServiceConfirmDrawer');

  document.addEventListener('click', function (event) {
    var openTransfer = event.target.closest('#openWholeGroupTransfer');
    var openFlight = event.target.closest('#openFlightTimeChange');
    var specialButton = event.target.closest('[data-confirm-special-service]');
    var closeButton = event.target.closest('[data-close-schedule-extension]');
    if (openTransfer) { renderTransferRows(); openLayer(wholeDrawer); return; }
    if (openFlight) {
      var code = document.getElementById('summaryCode');
      document.getElementById('flightChangeSchedule').textContent = code ? code.textContent.trim() : '-';
      openLayer(flightDrawer); return;
    }
    if (specialButton) {
      currentSpecialIndex = Number(specialButton.dataset.confirmSpecialService);
      var item = specialServices[currentSpecialIndex];
      document.getElementById('specialServiceSummary').textContent = item.person + ' / ' + item.name + ' / ' + item.request;
      document.getElementById('specialServiceResult').value = item.result === '待确认' || item.result === '待销售确认' ? '' : item.result;
      document.getElementById('specialServiceAmount').value = item.amount || 0;
      document.getElementById('specialServiceBasis').value = item.basis || '';
      document.getElementById('specialServiceNote').value = item.note || '';
      document.getElementById('specialServiceError').hidden = true;
      openLayer(serviceDrawer); return;
    }
    if (closeButton) { closeLayer(closeButton.closest('.modal-overlay')); }
  });

  document.getElementById('wholeTransferTarget').addEventListener('change', function () {
    var option = this.options[this.selectedIndex];
    document.getElementById('wholeTransferSupply').textContent = Number(option.dataset.available || 0) >= 6 ? '同线路经济款；机位待确认6座；酒店房量已确认' : '目标名额不足；仅可处理部分订单，其他订单保留待处理';
  });

  document.getElementById('confirmWholeTransfer').addEventListener('click', function () {
    var selected = Array.from(document.querySelectorAll('#wholeTransferRows [data-transfer-select]:checked'));
    var error = document.getElementById('wholeTransferError');
    var resourceConfirmed = document.getElementById('wholeTransferResourceConfirmed').checked;
    if (!selected.length) { error.textContent = '请至少选择一笔未处理订单。'; error.hidden = false; return; }
    if (!resourceConfirmed) { error.textContent = '请先核对目标名额及供应条件。'; error.hidden = false; return; }
    error.hidden = true;
    var target = document.getElementById('wholeTransferTarget');
    var available = Number(target.options[target.selectedIndex].dataset.available || 0);
    var used = 0;
    selected.forEach(function (checkbox) {
      var row = checkbox.closest('tr');
      var index = Number(row.dataset.transferIndex);
      var order = transferOrders[index];
      order.decision = row.querySelector('[data-transfer-decision]').value;
      if (order.decision === '待客户确认') { order.status = '待处理'; order.reason = '等待客户决定'; return; }
      if (order.decision === '拒绝转团') { order.status = '待处理'; order.reason = '保留原订单，后续另行处理'; return; }
      if (used + order.people > available) { order.status = '失败'; order.reason = '目标团期剩余名额不足'; return; }
      used += order.people;
      order.status = '成功'; order.reason = '目标占用已确认；原订单和原占用记录保留'; order.processed = true;
    });
    renderTransferRows();
    resultMessage('整团转移本次处理完成', '成功订单、待处理订单和失败原因已逐单保留，可继续处理未完成订单。');
  });

  var flightRequests = [];
  document.getElementById('submitFlightTimeChange').addEventListener('click', function () {
    var depart = document.getElementById('flightChangeDepart').value;
    var arrival = document.getElementById('flightChangeArrival').value;
    var basis = document.getElementById('flightChangeBasis').value.trim();
    var error = document.getElementById('flightChangeError');
    if (!depart || !arrival || !basis) { error.textContent = '请填写变更后起降时间及变更依据。'; error.hidden = false; return; }
    if (new Date(arrival) <= new Date(depart)) { error.textContent = '到达时间必须晚于起飞时间。'; error.hidden = false; return; }
    var duplicate = flightRequests.some(function (item) { return item.depart === depart && item.arrival === arrival; });
    if (duplicate) { error.textContent = '相同航班时刻变更申请已经存在，不能重复提交。'; error.hidden = false; return; }
    error.hidden = true;
    flightRequests.push({ no: 'HB-' + String(flightRequests.length + 1).padStart(3, '0'), depart: depart, arrival: arrival, resource: document.getElementById('flightChangeResourceImpact').value, cost: document.getElementById('flightChangeCostImpact').value, status: '待审批' });
    document.getElementById('flightChangeRecords').innerHTML = flightRequests.map(function (item) {
      return '<tr><td>' + item.no + '</td><td>2024-07-15 09:30</td><td>' + escapeHtml(item.depart.replace('T', ' ')) + '</td><td>' + escapeHtml(item.resource) + '</td><td>' + escapeHtml(item.cost) + '</td><td><span class="tag tag-orange">' + item.status + '</span></td></tr>';
    }).join('');
    resultMessage('航班时刻变更申请已提交', '原航班记录保持不变，待审批通过后再按配置生效。');
  });

  document.getElementById('specialServiceResult').addEventListener('change', function () {
    var amount = document.getElementById('specialServiceAmount');
    amount.disabled = this.value !== '需补差';
    if (this.value !== '需补差') amount.value = '0';
  });

  document.getElementById('saveSpecialService').addEventListener('click', function () {
    if (currentSpecialIndex < 0) return;
    var result = document.getElementById('specialServiceResult').value;
    var amount = Number(document.getElementById('specialServiceAmount').value || 0);
    var basis = document.getElementById('specialServiceBasis').value.trim();
    var error = document.getElementById('specialServiceError');
    if (!result || !basis) { error.textContent = '请选择供给结果并填写确认依据。'; error.hidden = false; return; }
    if (result === '需补差' && amount <= 0) { error.textContent = '需补差时必须填写大于0的补差金额。'; error.hidden = false; return; }
    var item = specialServices[currentSpecialIndex];
    item.result = result === '需补差' ? '待销售确认' : result;
    item.amount = result === '需补差' ? amount : 0;
    item.basis = basis;
    item.note = document.getElementById('specialServiceNote').value.trim();
    renderSpecialServices();
    closeLayer(serviceDrawer);
    resultMessage('特殊服务结果已保存', result === '需补差' ? '补差方案待销售确认，客户未确认前不视为完成。' : '本次供给结果及确认依据已记录。');
  });

  var cancelSubmit = document.getElementById('confirmCancelSchedule');
  if (cancelSubmit) {
    cancelSubmit.addEventListener('click', function (event) {
      var soldNode = document.getElementById('summarySold');
      var sold = Number(String(soldNode ? soldNode.textContent : '0').replace(/\D/g, '')) || 0;
      if (!sold && !document.querySelector('#costDetailRows tr')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      var modal = document.getElementById('cancelScheduleModal');
      var alert = modal && modal.querySelector('.alert');
      if (alert) {
        alert.className = 'alert alert-red';
        alert.textContent = '当前团期仍有' + sold + '人订单或成本责任，不能直接取消或删除；请先完成订单、合同、资源及成本责任处理。';
      }
    }, true);
  }

  [wholeDrawer, flightDrawer, serviceDrawer].forEach(function (drawer) {
    drawer.addEventListener('click', function (event) { if (event.target === drawer) closeLayer(drawer); });
  });
})();
