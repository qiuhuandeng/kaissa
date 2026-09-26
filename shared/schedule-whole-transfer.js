(function () {
  'use strict';
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

  function showFeedback(message, failed) {
    var feedback = document.getElementById('wholeTransferFeedback');
    feedback.textContent = message;
    feedback.className = failed ? 'alert alert-red' : 'alert alert-blue';
    feedback.hidden = false;
    feedback.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  document.body.insertAdjacentHTML('beforeend', [
      '<div id="wholeGroupTransferDrawer" class="modal-overlay drawer-overlay" aria-hidden="true" hidden>',
      '<section class="modal drawer-modal drawer-xl schedule-business-drawer" role="dialog" aria-modal="true" aria-labelledby="wholeGroupTransferTitle">',
      '<div class="modal-header"><div id="wholeGroupTransferTitle" class="modal-title">整团转移</div><button class="modal-close" type="button" data-close-schedule-extension aria-label="关闭">×</button></div>',
      '<div class="modal-body">',
      '<div id="wholeTransferFeedback" role="status" aria-live="polite" hidden></div>',
      '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">目标团期与资源</h3></div>',
      '<div class="form-grid"><label class="form-group"><span class="form-label">目标团期</span><select id="wholeTransferTarget" class="form-control"><option value="EU20240728002" data-available="6">EU20240728002 / 2024-07-28 / 可用6人</option><option value="EU20240812003" data-available="2">EU20240812003 / 2024-08-12 / 可用2人</option></select></label>',
      '<div class="form-group"><span class="form-label">供应条件</span><div id="wholeTransferSupply" class="readonly-summary">同线路经济款；机位待确认6座；酒店房量已确认</div></div>',
      '</div></section>',
      '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">受影响订单</h3><span class="schedule-muted">逐单选择并记录本次决定</span></div>',
      '<div class="table-wrap drawer-table-wrap"><table><thead><tr><th>选择</th><th>订单/客户</th><th>游客</th><th>原占用</th><th>合同/收款</th><th>本次决定</th><th>处理结果</th></tr></thead><tbody id="wholeTransferRows"></tbody></table></div>',
      '</section>',
      '</div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-close-schedule-extension>取消</button><button id="confirmWholeTransfer" data-drawer-title="整团转移" class="btn btn-primary" type="button">确认本次处理</button></div>',
      '</section></div>'
  ].join(''));

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
        '<td><strong>' + escapeHtml(order.no) + '</strong><span class="table-cell-sub">' + escapeHtml(order.customer) + '</span></td><td>' + escapeHtml(order.quantity || (order.people + '人')) + '</td><td>' + escapeHtml(order.occupation) + '</td><td>' + escapeHtml(order.contract) + '</td>' +
        '<td><select class="form-control table-input" data-transfer-decision' + (order.processed ? ' disabled' : '') + '><option' + (order.decision === '接受转团' ? ' selected' : '') + '>接受转团</option><option' + (order.decision === '待客户确认' ? ' selected' : '') + '>待客户确认</option><option' + (order.decision === '拒绝转团' ? ' selected' : '') + '>拒绝转团</option></select></td>' +
        '<td><span class="' + tag + '">' + escapeHtml(order.status) + '</span>' + (order.reason ? '<span class="table-cell-sub">' + escapeHtml(order.reason) + '</span>' : '') + '</td></tr>';
    }).join('') || '<tr><td colspan="7" class="table-empty-cell">当前团期暂无关联订单</td></tr>';
    var complete = transferOrders.length > 0 && transferOrders.every(function (order) { return order.processed; });
    var confirm = document.getElementById('confirmWholeTransfer');
    confirm.disabled = !transferOrders.length || complete;
    confirm.textContent = complete ? '已全部转移' : '确认本次处理';
  }

  var wholeDrawer = document.getElementById('wholeGroupTransferDrawer');
  var sessions = Object.create(null);
  var currentSession = null;

  document.getElementById('wholeTransferTarget').addEventListener('change', function () {
    var option = this.options[this.selectedIndex];
    if (option.dataset.supply || !option.value) { document.getElementById('wholeTransferSupply').textContent = option.dataset.supply || '暂无可转入团期'; return; }
    document.getElementById('wholeTransferSupply').textContent = Number(option.dataset.available || 0) >= 6 ? '同线路经济款；机位待确认6座；酒店房量已确认' : '目标名额不足；仅可处理部分订单，其他订单保留待处理';
  });

  document.getElementById('confirmWholeTransfer').addEventListener('click', function () {
    var selected = Array.from(document.querySelectorAll('#wholeTransferRows [data-transfer-select]:checked'));
    if (!selected.length) { showFeedback('请至少选择一笔未处理订单。', true); return; }
    var target = document.getElementById('wholeTransferTarget');
    var accepting = selected.some(function (checkbox) { return checkbox.closest('tr').querySelector('[data-transfer-decision]').value === '接受转团'; });
    if (accepting && !target.value) { showFeedback('暂无可转入团期，请先准备目标团期后再确认转移。', true); return; }
    var available = Number(target.options[target.selectedIndex].dataset.available || 0) - (currentSession.used[target.value] || 0);
    var used = 0;
    selected.forEach(function (checkbox) {
      var row = checkbox.closest('tr');
      var index = Number(row.dataset.transferIndex);
      var order = transferOrders[index];
      order.decision = row.querySelector('[data-transfer-decision]').value;
      if (order.decision === '待客户确认') { order.status = '待处理'; order.reason = '已记录待客户确认，本次未转移'; return; }
      if (order.decision === '拒绝转团') { order.status = '待处理'; order.reason = '已记录拒绝转团，保留原订单'; return; }
      if (used + order.people > available) { order.status = '失败'; order.reason = '目标团期剩余名额不足，保留原订单'; return; }
      used += order.people;
      order.status = '成功'; order.reason = '已转入 ' + target.value + '；原记录保留'; order.processed = true;
    });
    currentSession.used[target.value] = (currentSession.used[target.value] || 0) + used;
    renderTransferRows();
    document.getElementById('wholeTransferFeedback').hidden = true;
    closeLayer(wholeDrawer);
  });


  window.caesarWholeGroupTransfer = {
    open: function (context) {
      context = context || {};
      var key = context.code || 'detail';
      if (!sessions[key]) sessions[key] = { orders: context.orders || transferOrders.map(function (order) { return Object.assign({}, order); }), used: {} };
      currentSession = sessions[key];
      transferOrders = currentSession.orders;
      var target = document.getElementById('wholeTransferTarget');
      if (context.targets) {
        target.innerHTML = context.targets.length ? context.targets.map(function (item) {
          return '<option value="' + escapeHtml(item.code) + '" data-available="' + item.available + '" data-supply="' + escapeHtml(item.supply) + '">' + escapeHtml(item.label) + '</option>';
        }).join('') : '<option value="">暂无可转入团期</option>';
      }
      var summary = document.getElementById('wholeTransferSource');
      if (!summary) {
        summary = document.createElement('div');
        summary.id = 'wholeTransferSource';
        summary.className = 'readonly-summary';
        wholeDrawer.querySelector('.modal-body').prepend(summary);
      }
      summary.hidden = !context.code;
      summary.textContent = context.code ? '原团期：' + context.code + ' / ' + (context.product || '') + ' / ' + (context.depart || '') : '';
      document.getElementById('wholeTransferFeedback').hidden = true;
      target.dispatchEvent(new Event('change'));
      renderTransferRows();
      openLayer(wholeDrawer);
    }
  };
  document.addEventListener('click', function (event) {
    if (event.target.closest('#openWholeGroupTransfer')) window.caesarWholeGroupTransfer.open();
    if (event.target.closest('#wholeGroupTransferDrawer [data-close-schedule-extension]') || event.target === wholeDrawer) closeLayer(wholeDrawer);
  });
})();
