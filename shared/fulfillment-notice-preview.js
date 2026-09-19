(function () {
  'use strict';
  var rows = document.getElementById('noticeRows');
  if (!rows) return;
  function openLayer(layer) { if (window.caesarUI && window.caesarUI.openLayer) window.caesarUI.openLayer(layer); else { layer.hidden = false; layer.classList.add('show'); } }
  function closeLayer(layer) { if (window.caesarUI && window.caesarUI.closeLayer) window.caesarUI.closeLayer(layer); else { layer.classList.remove('show'); layer.hidden = true; } }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]; }); }

  document.body.insertAdjacentHTML('beforeend', [
    '<div id="noticePreviewDrawer" class="modal-overlay drawer-overlay" aria-hidden="true" hidden><section class="modal drawer-modal drawer-lg fulfillment-drawer notice-preview-drawer" role="dialog" aria-modal="true" aria-labelledby="noticePreviewTitle">',
    '<div class="modal-header"><div id="noticePreviewTitle" class="modal-title">出团通知预览</div><button class="modal-close" type="button" data-close-notice-preview aria-label="关闭">×</button></div>',
    '<div class="modal-body"><section class="drawer-object-summary"><div class="drawer-object-summary-main"><div><h2 id="noticePreviewSchedule" class="drawer-object-title">-</h2><div id="noticePreviewProduct" class="drawer-object-subtitle">-</div></div><span class="tag tag-blue">预览版本</span></div>',
    '<div class="drawer-summary-grid"><div class="drawer-summary-item"><span class="drawer-summary-label">通知版本</span><strong id="noticePreviewVersion">V1.3</strong></div><div class="drawer-summary-item"><span class="drawer-summary-label">行程版本</span><strong>线路行程 V6</strong></div><div class="drawer-summary-item"><span class="drawer-summary-label">最后更新时间</span><strong id="noticePreviewUpdated">2026-09-19 10:30</strong></div><div class="drawer-summary-item"><span class="drawer-summary-label">生成依据</span><strong>当前团期出团资料</strong></div></div></section>',
    '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">交接资料汇总</h3></div><div class="description-grid">',
    '<div class="description-item"><div class="description-label">游客名单</div><div class="description-value">27人 / 2人证件待补</div></div>',
    '<div class="description-item"><div class="description-label">代办签证</div><div class="description-value">18人已出签 / 2人待补材料</div></div>',
    '<div class="description-item"><div class="description-label">自办游客</div><div class="description-value">7人，仅核验出行证件，不计入送签缺口</div></div>',
    '<div class="description-item"><div class="description-label">交通资源</div><div class="description-value">25人票号已齐 / 2人待回填</div></div>',
    '<div class="description-item"><div class="description-label">领队</div><div class="description-value">李导 138****8800</div></div>',
    '<div class="description-item"><div class="description-label">集合事项</div><div id="noticePreviewMeeting" class="description-value">首都机场T3 07:30</div></div>',
    '</div></section>',
    '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">通知正文</h3></div><div id="noticePreviewText" class="notice-preview-content"></div></section>',
    '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">发送前缺口</h3><span class="tag tag-orange">3项</span></div><div class="schedule-gap-list"><div><strong>李梅</strong><span>代办签证</span><em>银行流水待补</em></div><div><strong>王磊</strong><span>交通资料</span><em>去程票号待回填</em></div><div><strong>张建国</strong><span>特殊服务</span><em>联运确认结果待写入通知</em></div></div></section>',
    '</div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-close-notice-preview>关闭</button><button id="useNoticePreview" class="btn btn-primary" type="button">返回编辑</button></div>',
    '</section></div>'
  ].join(''));

  var drawer = document.getElementById('noticePreviewDrawer');
  var sendModal = document.getElementById('noticeSendModal');

  function prepareRows() {
    Array.from(rows.querySelectorAll('tr')).forEach(function (row) {
      var buttons = row.querySelectorAll('.table-action button');
      Array.from(buttons).forEach(function (button) {
        if (/预览|详情|回执/.test(button.textContent.trim()) && !button.hasAttribute('data-open-notice-send')) {
          button.setAttribute('data-open-notice-preview', '');
          button.setAttribute('data-drawer-title', '出团通知预览');
        }
      });
      row.dataset.noticeVersion = row.dataset.noticeVersion || 'V1.3';
      row.dataset.noticeUpdated = row.dataset.noticeUpdated || (row.cells[9] ? row.cells[9].textContent.trim() : '-');
    });
  }
  prepareRows();

  rows.addEventListener('click', function (event) {
    var button = event.target.closest('[data-open-notice-preview]');
    if (!button) return;
    var row = button.closest('tr');
    document.getElementById('noticePreviewSchedule').textContent = row.cells[1].textContent.trim();
    document.getElementById('noticePreviewProduct').textContent = row.cells[2].textContent.trim() + ' / ' + row.cells[3].textContent.trim();
    document.getElementById('noticePreviewVersion').textContent = row.dataset.noticeVersion;
    document.getElementById('noticePreviewUpdated').textContent = row.dataset.noticeUpdated === '-' ? '尚未发送 / 当前预览 2026-09-19 10:30' : row.dataset.noticeUpdated;
    document.getElementById('noticePreviewMeeting').textContent = row.cells[4].textContent.trim();
    var text = document.getElementById('noticeText');
    document.getElementById('noticePreviewText').textContent = text ? text.value : '请按当前团期资料生成通知内容。';
    openLayer(drawer);
  });

  document.getElementById('useNoticePreview').addEventListener('click', function () { closeLayer(drawer); if (sendModal) openLayer(sendModal); });
  document.querySelectorAll('[data-close-notice-preview]').forEach(function (button) { button.addEventListener('click', function () { closeLayer(drawer); }); });
  drawer.addEventListener('click', function (event) { if (event.target === drawer) closeLayer(drawer); });

  var generate = document.getElementById('generateNoticeText');
  if (generate) generate.addEventListener('click', function () {
    var now = new Date();
    var value = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    document.getElementById('noticePreviewUpdated').textContent = value;
  });
})();
