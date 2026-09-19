(function () {
  'use strict';
  var table = document.querySelector('.visa-processing-table');
  var rows = Array.from(document.querySelectorAll('#visaProcessRows tr'));
  var drawer = document.getElementById('visaProcessDrawer');
  if (!table || !rows.length || !drawer) return;

  var surface = document.querySelector('.visa-processing-surface');
  var tableWrap = document.querySelector('.visa-processing-table-wrap');
  tableWrap.insertAdjacentHTML('beforebegin', '<section class="visa-agency-scope"><div><span>当前任务范围</span><strong>仅随团代办游客</strong></div><div><span>示例订单</span><strong id="visaAgencyExampleOrder">KS202406180001</strong></div><div><span>订单游客</span><strong>3人</strong></div><div><span>代办任务</span><strong>2人</strong></div><div><span>游客自办</span><strong>1人，仅核验证件</strong></div></section>');

  var head = table.querySelector('thead tr');
  var handlingHead = document.createElement('th');
  handlingHead.textContent = '办理方式/委托来源';
  head.insertBefore(handlingHead, head.children[7]);
  var colgroup = table.querySelector('colgroup');
  if (colgroup) { var col=document.createElement('col'); col.className='visa-process-col-mode'; colgroup.insertBefore(col,colgroup.children[7]); }

  rows.forEach(function (row, index) {
    row.dataset.handlingMode = '随团代办';
    row.dataset.delegationSource = index < 2 ? '订单逐游客选择' : '订单委托记录';
    var cell = document.createElement('td');
    cell.innerHTML = '<div class="table-cell-main"><strong>随团代办</strong><span>' + row.dataset.delegationSource + '</span></div>';
    row.insertBefore(cell, row.children[7]);
  });

  var summaryGrid = drawer.querySelector('.visa-process-summary-grid');
  summaryGrid.insertAdjacentHTML('beforeend', '<div class="drawer-summary-item"><span class="drawer-summary-label">办理方式</span><span id="visaProcessHandlingMode" class="drawer-summary-value">随团代办</span></div><div class="drawer-summary-item"><span class="drawer-summary-label">委托来源</span><span id="visaProcessDelegationSource" class="drawer-summary-value">订单逐游客选择</span></div>');
  var materialSection = drawer.querySelector('.drawer-section');
  materialSection.insertAdjacentHTML('beforebegin', '<section class="drawer-section visa-agency-boundary"><div class="alert alert-blue">本工作台只处理委托代办游客。同行自办游客不计入材料缺项、待送签和临期任务，可从关联订单查看证件核验结果。</div></section>');

  var params = new URLSearchParams(location.search);
  var inboundOrder = params.get('orderNo');
  if (inboundOrder) {
    rows.forEach(function (row, index) {
      if (index < 2) {
        row.dataset.order = inboundOrder;
        var link = row.querySelector('td:first-child a');
        if (link) { link.textContent = inboundOrder; link.href = '../sales/orders-detail.html?type=group&orderNo=' + encodeURIComponent(inboundOrder); }
        row.hidden = false;
      } else row.hidden = true;
    });
    document.getElementById('visaAgencyExampleOrder').textContent = inboundOrder;
    document.getElementById('visaProcessKeyword').value = inboundOrder;
  } else {
    rows[0].dataset.order = 'KS202406180001';
    rows[1].dataset.order = 'KS202406180001';
    var firstLinks = [rows[0], rows[1]].map(function(row){return row.querySelector('td:first-child a');});
    firstLinks.forEach(function(link){if(link)link.textContent='KS202406180001';});
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-open-visa-process]');
    if (!button) return;
    var row = button.closest('tr');
    window.setTimeout(function () {
      document.getElementById('visaProcessHandlingMode').textContent = row.dataset.handlingMode;
      document.getElementById('visaProcessDelegationSource').textContent = row.dataset.delegationSource + ' / ' + row.dataset.order;
    }, 0);
  });

  var nextStatus = document.getElementById('visaProcessNextStatus');
  if (nextStatus && !Array.from(nextStatus.options).some(function(option){return option.value==='补件中';})) {
    nextStatus.insertAdjacentHTML('beforeend', '<option>补件中</option><option>结果待交付</option>');
  }

  function refreshScopeCount() {
    var visible = rows.filter(function(row){return !row.hidden;}).length;
    var pagination = document.getElementById('visaProcessPagination');
    if (pagination) pagination.textContent = '当前显示' + visible + '条代办任务；自办游客不进入任务列表';
  }
  document.querySelector('[data-filter-visa-process]').addEventListener('click', function(){window.setTimeout(refreshScopeCount,0);});
  document.querySelector('[data-reset-visa-process]').addEventListener('click', function(){window.setTimeout(refreshScopeCount,0);});
  refreshScopeCount();
})();
