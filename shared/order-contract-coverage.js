(function () {
  'use strict';

  var panel = document.getElementById('tab-contract');
  var rows = document.getElementById('contractRows');
  if (!panel || !rows || panel.dataset.coverageReady === 'true') return;
  panel.dataset.coverageReady = 'true';

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char];
    });
  }
  function number(value) { return Number(String(value || '').replace(/[^0-9.-]/g, '')) || 0; }
  function money(value) { return '¥' + Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 }); }
  function orderNo() { return new URLSearchParams(location.search).get('orderNo') || document.getElementById('orderNo').textContent.trim(); }
  function orderAmount() { return orderNo() === 'ORD-CONTRACT-30000' ? 30000 : number(document.getElementById('orderHeroTotal').textContent); }

  var example = [
    { no: 'HT-P-20260919-001', traveler: '张建国', amount: 10000, version: 'V1', status: '已签署', time: '2026-09-18 14:01' },
    { no: 'HT-P-20260919-002', traveler: '李梅', amount: 10000, version: 'V1', status: '已签署', time: '2026-09-18 14:02' },
    { no: 'HT-P-20260919-003', traveler: '王磊', amount: 10000, version: 'V1', status: '待签署', time: '-' }
  ];

  panel.querySelector('.product-detail-tab-inner').insertAdjacentHTML('afterbegin', [
    '<section class="detail-section order-contract-coverage-section">',
    '<div class="detail-section-header"><div><div class="detail-section-title">合同覆盖情况</div><div class="detail-section-desc">按游客和金额核对当前有效合同；必要签署人未全部完成时，整单不显示签约完成。</div></div><span id="orderContractCoverageStatus" class="tag tag-orange">覆盖未完成</span></div>',
    '<div id="orderContractCoverageSummary" class="contract-allocation-summary"></div>',
    '<div class="table-wrap"><table><thead><tr><th>合同编号</th><th>覆盖游客</th><th>分配金额</th><th>版本</th><th>必要签署</th><th>签署时间</th></tr></thead><tbody id="orderContractCoverageRows"></tbody></table></div>',
    '<div class="order-contract-change-entry"><div><strong>订单变更后的合同承接</strong><span>金额、游客或行程变化时，保留原签署文件和原覆盖范围，从合同管理生成补充协议或新版本。</span></div><div class="table-action"><button type="button" data-contract-change="supplement">补充协议</button><button type="button" data-contract-change="version">新版本</button></div></div>',
    '</section>'
  ].join(''));

  function currentContracts() {
    if (orderNo() === 'ORD-CONTRACT-30000') return example;
    var source = Array.from(rows.querySelectorAll('tr'));
    if (!source.length) return [];
    return source.map(function (row, index) {
      var cells = row.querySelectorAll('td');
      return { no: 'HT-' + orderNo() + '-' + (index + 1), traveler: '当前订单游客', amount: index === 0 ? orderAmount() : 0, version: 'V1', status: /\u5df2\u7b7e|\u5df2\u751f效/.test(row.textContent) ? '已签署' : '待签署', time: '-' };
    });
  }

  function render() {
    var contracts = currentContracts();
    var total = contracts.reduce(function (sum, item) { return sum + item.amount; }, 0);
    var signed = contracts.filter(function (item) { return item.status === '已签署'; }).length;
    var complete = contracts.length > 0 && total === orderAmount() && signed === contracts.length;
    var status = document.getElementById('orderContractCoverageStatus');
    status.textContent = complete ? '整单签约完成' : '覆盖未完成';
    status.className = complete ? 'tag tag-green' : 'tag tag-orange';
    document.getElementById('orderContractCoverageSummary').innerHTML = '<div><span>订单金额</span><strong>' + money(orderAmount()) + '</strong></div><div><span>有效合同</span><strong>' + contracts.length + '份</strong></div><div><span>覆盖游客</span><strong>' + contracts.length + '人</strong></div><div><span>已分配／剩余</span><strong>' + money(total) + ' / ' + money(Math.max(0, orderAmount() - total)) + '</strong></div><div><span>必要签署</span><strong>' + signed + '/' + contracts.length + '人</strong></div>';
    document.getElementById('orderContractCoverageRows').innerHTML = contracts.length ? contracts.map(function (item) {
      return '<tr><td><strong>' + esc(item.no) + '</strong></td><td>' + esc(item.traveler) + '</td><td>' + money(item.amount) + '</td><td>' + esc(item.version) + '</td><td><span class="tag ' + (item.status === '已签署' ? 'tag-green' : 'tag-orange') + '">' + esc(item.status) + '</span></td><td>' + esc(item.time) + '</td></tr>';
    }).join('') : '<tr><td colspan="6" class="table-empty-cell">尚未生成合同，请进入合同管理选择覆盖方式。</td></tr>';
    return { orderNo: orderNo(), orderAmount: orderAmount(), count: contracts.length, allocated: total, signed: signed, complete: complete };
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-contract-change]');
    if (!button) return;
    var query = new URLSearchParams({ orderNo: orderNo(), action: button.dataset.contractChange, changeType: '订单金额、游客或行程变更' });
    location.href = 'contracts.html?' + query.toString();
  });

  var result = render();
  window.OrderContractCoverageTest = { inspect: render, initial: result };
})();
