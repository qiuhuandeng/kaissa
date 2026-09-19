(function () {
  'use strict';
  var tableBody = document.getElementById('contractRows');
  if (!tableBody) return;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char];
    });
  }
  function openLayer(layer) { if (window.caesarUI && window.caesarUI.openLayer) window.caesarUI.openLayer(layer); else { layer.hidden = false; layer.classList.add('show'); } }
  function closeLayer(layer) { if (window.caesarUI && window.caesarUI.closeLayer) window.caesarUI.closeLayer(layer); else { layer.classList.remove('show'); layer.hidden = true; } }

  document.body.insertAdjacentHTML('beforeend', [
    '<div id="contractVersionDrawer" class="modal-overlay drawer-overlay" aria-hidden="true" hidden><section class="modal drawer-modal drawer-lg contracts-view-modal" role="dialog" aria-modal="true" aria-labelledby="contractVersionTitle">',
    '<div class="modal-header"><div id="contractVersionTitle" class="modal-title">合同变更处理</div><button class="modal-close" type="button" data-close-contract-version aria-label="关闭">×</button></div>',
    '<div class="modal-body"><section class="drawer-object-summary"><div class="drawer-summary-grid">',
    '<div class="drawer-summary-item"><span class="drawer-summary-label">原合同</span><strong id="contractVersionOriginal">-</strong></div>',
    '<div class="drawer-summary-item"><span class="drawer-summary-label">原合同状态</span><strong>已生效 / 已备案</strong></div>',
    '<div class="drawer-summary-item"><span class="drawer-summary-label">原团期</span><strong id="contractVersionTrip">-</strong></div>',
    '<div class="drawer-summary-item"><span class="drawer-summary-label">原合同金额</span><strong id="contractVersionAmount">-</strong></div>',
    '</div></section>',
    '<section class="drawer-section"><div class="form-grid">',
    '<label class="form-group"><span class="form-label">处理方式</span><select id="contractVersionMode" class="form-control"><option>生成补充协议</option><option>生成新版本合同</option></select></label>',
    '<label class="form-group"><span class="form-label">变更来源</span><select id="contractVersionSource" class="form-control"><option>团期/航次变化</option><option>合同金额变化</option><option>游客范围变化</option></select></label>',
    '<label class="form-group"><span class="form-label">变更后团期</span><input id="contractVersionNewTrip" class="form-control" type="text" value="CR-AEG-20260818-002"></label>',
    '<label class="form-group"><span class="form-label">变更后金额</span><input id="contractVersionNewAmount" class="form-control" type="text" value="¥76,000"></label>',
    '<label class="form-group form-group-full"><span class="form-label">变更内容 <i class="req">*</i></span><textarea id="contractVersionReason" class="form-control" rows="3" placeholder="说明团期、金额或游客的变化及客户确认依据"></textarea></label>',
    '</div><div class="alert alert-blue">原合同文件保持只读，新文件将关联原合同和本次变更依据。</div><p id="contractVersionError" class="form-error" hidden></p></section>',
    '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">版本关系</h3></div><div id="contractVersionRelation" class="contract-version-relation"><span>原合同</span><strong>待生成新文件</strong><em>原文件不改写</em></div></section>',
    '</div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-close-contract-version>取消</button><button id="saveContractVersion" class="btn btn-primary" type="button">生成变更文件</button></div>',
    '</section></div>'
  ].join(''));

  var drawer = document.getElementById('contractVersionDrawer');
  var currentRow = null;
  var serial = 1;
  tableBody.querySelectorAll('[data-open-contract-version]').forEach(function (button) {
    button.setAttribute('data-drawer-title', '合同变更处理');
  });

  function rowValue(row, name) { return row && row.dataset ? row.dataset[name] || '-' : '-'; }
  function attachDetailRelationField() {
    var grid = document.querySelector('#contractDetailDrawer .contract-drawer-grid');
    if (grid && !document.getElementById('detailVersionRelation')) grid.insertAdjacentHTML('beforeend', '<div class="contract-drawer-field full"><span>原合同/变更文件</span><strong id="detailVersionRelation">当前文件无关联变更</strong></div>');
  }
  attachDetailRelationField();

  tableBody.addEventListener('click', function (event) {
    var button = event.target.closest('[data-open-contract-version]');
    if (!button) return;
    currentRow = button.closest('[data-contract-row]');
    document.getElementById('contractVersionOriginal').textContent = rowValue(currentRow, 'contractNo');
    document.getElementById('contractVersionTrip').textContent = rowValue(currentRow, 'trip');
    document.getElementById('contractVersionAmount').textContent = rowValue(currentRow, 'amount');
    document.getElementById('contractVersionReason').value = '';
    document.getElementById('contractVersionError').hidden = true;
    document.getElementById('contractVersionRelation').innerHTML = '<span>' + esc(rowValue(currentRow, 'contractNo')) + '</span><strong>待生成新文件</strong><em>原文件保持已签/已备案</em>';
    openLayer(drawer);
  });

  document.getElementById('saveContractVersion').addEventListener('click', function () {
    if (!currentRow) return;
    var reason = document.getElementById('contractVersionReason').value.trim();
    var error = document.getElementById('contractVersionError');
    if (!reason) { error.textContent = '请填写本次合同变更内容和依据。'; error.hidden = false; return; }
    var mode = document.getElementById('contractVersionMode').value;
    var source = document.getElementById('contractVersionSource').value;
    var newTrip = document.getElementById('contractVersionNewTrip').value.trim();
    var newAmount = document.getElementById('contractVersionNewAmount').value.trim();
    var originalNo = rowValue(currentRow, 'contractNo');
    var newNo = 'HT-SUP-20260918-' + String(serial++).padStart(3, '0');
    var clone = currentRow.cloneNode(true);
    clone.dataset.contractNo = newNo;
    clone.dataset.docType = mode === '生成补充协议' ? '补充协议' : '新版本';
    clone.dataset.status = '待审核';
    clone.dataset.trip = newTrip || rowValue(currentRow, 'trip');
    clone.dataset.amount = newAmount || rowValue(currentRow, 'amount');
    clone.dataset.amountSource = source + ' / 关联' + originalNo;
    clone.dataset.signProgress = '未发送';
    clone.dataset.platformStatus = '待取码';
    clone.dataset.platformText = '审核后取码';
    clone.dataset.gap = '变更文件待审核';
    clone.dataset.originalContract = originalNo;
    clone.dataset.changeReason = reason;
    clone.querySelector('.contracts-id-cell strong').textContent = newNo;
    clone.querySelector('.contracts-doc-cell').innerHTML = '<strong>' + esc(mode === '生成补充协议' ? '合同变更补充协议' : '旅游合同新版本') + '</strong><span class="contract-cell-sub">关联原合同 ' + esc(originalNo) + '</span>';
    clone.querySelector('.contracts-money-cell').innerHTML = '<strong class="amount-strong">' + esc(clone.dataset.amount) + '</strong><span class="contract-cell-sub">' + esc(clone.dataset.amountSource) + '</span>';
    clone.querySelector('.contracts-status-cell').innerHTML = '<span class="tag tag-orange">待审核</span><span class="contract-cell-sub">变更文件待审核</span>';
    clone.querySelector('.contracts-platform-cell').innerHTML = '<strong class="contract-sign-state">未发送</strong><span class="contract-cell-sub">12301：审核后取码</span>';
    clone.querySelector('.contracts-action-cell').innerHTML = '<div class="table-action"><button class="table-action-primary" type="button" data-open-contract-version-detail>详情</button></div>';
    tableBody.insertBefore(clone, currentRow.nextSibling);
    currentRow.dataset.relatedChangeContract = newNo;
    var sub = currentRow.querySelector('.contracts-doc-cell .contract-cell-sub');
    if (sub) sub.textContent += ' / 已关联' + newNo;
    document.getElementById('contractVersionRelation').innerHTML = '<span>' + esc(originalNo) + '（只读保留）</span><strong>' + esc(newNo) + '（待审核）</strong><em>' + esc(source) + '</em>';
    error.hidden = true;
  });

  tableBody.addEventListener('click', function (event) {
    var detail = event.target.closest('[data-open-contract-version-detail]');
    if (!detail) return;
    var row = detail.closest('[data-contract-row]');
    document.getElementById('contractVersionOriginal').textContent = row.dataset.originalContract || '-';
    document.getElementById('contractVersionTrip').textContent = row.dataset.trip || '-';
    document.getElementById('contractVersionAmount').textContent = row.dataset.amount || '-';
    document.getElementById('contractVersionReason').value = row.dataset.changeReason || '';
    document.getElementById('contractVersionRelation').innerHTML = '<span>' + esc(row.dataset.originalContract || '-') + '（已签，只读）</span><strong>' + esc(row.dataset.contractNo || '-') + '（' + esc(row.dataset.status || '-') + '）</strong><em>' + esc(row.dataset.amountSource || '-') + '</em>';
    openLayer(drawer);
  });

  document.addEventListener('click', function (event) {
    var detailButton = event.target.closest('[data-open-contract-detail]');
    if (detailButton) {
      var row = detailButton.closest('[data-contract-row]');
      window.setTimeout(function () {
        var field = document.getElementById('detailVersionRelation');
        if (!field) return;
        if (row.dataset.originalContract) field.textContent = '原合同 ' + row.dataset.originalContract + ' → 当前变更文件 ' + row.dataset.contractNo;
        else if (row.dataset.relatedChangeContract) field.textContent = '当前已签文件保持不变；关联变更文件 ' + row.dataset.relatedChangeContract;
        else field.textContent = '当前文件无关联变更';
      }, 0);
    }
    if (event.target.closest('[data-close-contract-version]')) closeLayer(drawer);
  });
  drawer.addEventListener('click', function (event) { if (event.target === drawer) closeLayer(drawer); });
})();
