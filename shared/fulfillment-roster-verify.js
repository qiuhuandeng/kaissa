(function () {
  'use strict';
  var editModal = document.getElementById('editGuestModal');
  var importModal = document.getElementById('importRosterModal');
  if (!editModal || !importModal) return;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char];
    });
  }
  function showNotice(text) {
    var modal = document.getElementById('noticeModal');
    var content = document.getElementById('noticeText');
    if (content) content.textContent = text;
    if (modal && window.caesarUI) window.caesarUI.openLayer(modal);
  }

  var editBody = editModal.querySelector('.modal-body');
  editBody.insertAdjacentHTML('afterbegin', [
    '<section class="roster-document-verify"><div class="drawer-section-head"><div><h3 class="drawer-section-title">证件识别与人工核对</h3><span class="text-muted">原图和识别字段逐项核对，未确认字段不视为资料完整</span></div><span id="rosterRecognitionStatus" class="tag tag-orange">待人工确认</span></div>',
    '<div class="roster-document-verify-grid"><div class="roster-document-preview" aria-label="证件原图预览"><span>证件原图</span><strong>护照资料页</strong><em>点击可查看原尺寸</em><div class="roster-document-mask">P&lt;CHN<br>ZHANG&lt;&lt;JIANGUO<br>E123••••5678</div></div>',
    '<div class="roster-recognition-fields">',
    '<label class="form-group"><span class="form-label">中文姓名</span><input id="recognizedChineseName" class="form-control" type="text"><em class="field-recognition-state ok">识别清晰</em></label>',
    '<label class="form-group"><span class="form-label">英文姓名</span><input id="recognizedEnglishName" class="form-control" type="text" placeholder="与MRZ一致"><em class="field-recognition-state warning">待人工确认</em></label>',
    '<label class="form-group"><span class="form-label">证件号码</span><input id="recognizedDocumentNo" class="form-control" type="text"><em class="field-recognition-state ok">识别清晰</em></label>',
    '<label class="form-group"><span class="form-label">证件有效期</span><input id="recognizedExpiry" class="form-control" type="date"><em class="field-recognition-state warning">边缘模糊</em></label>',
    '</div></div><label class="checkbox-row"><input id="confirmRecognizedDocument" type="checkbox"> 已对照原图确认姓名、英文名、证件号和有效期</label></section>',
    '<section class="drawer-section roster-business-link"><div class="drawer-section-head"><h3 class="drawer-section-title">订单与履约关联</h3></div><div class="description-grid">',
    '<div class="description-item"><div class="description-label">关联订单</div><div id="rosterLinkedOrder" class="description-value">-</div></div>',
    '<div class="description-item"><div class="description-label">签证方式</div><div id="rosterVisaMode" class="description-value">-</div></div>',
    '<div class="description-item"><div class="description-label">交通票号/舱铺</div><div id="rosterTransportBasis" class="description-value">-</div></div>',
    '<div class="description-item"><div class="description-label">房型</div><div id="rosterRoomBasis" class="description-value">-</div></div>',
    '<div class="description-item"><div class="description-label">特殊服务结果</div><div id="rosterServiceResult" class="description-value">-</div></div>',
    '<div class="description-item"><div class="description-label">具体缺项</div><div id="rosterConcreteGap" class="description-value">-</div></div>',
    '</div></section>'
  ].join(''));

  var stepThree = importModal.querySelector('[data-import-step="3"]');
  stepThree.innerHTML = [
    '<div class="roster-import-summary"><span class="tag tag-green">新增2行</span><span class="tag tag-orange">重复1行</span><span class="tag tag-red">格式错误1行</span><span class="tag tag-red">超订单人数1行</span></div>',
    '<p class="text-muted">逐行修改或跳过后再确认导入；已存在游客不会被静默覆盖。</p>',
    '<div class="table-wrap roster-import-review"><table><thead><tr><th>处理</th><th>行号</th><th>姓名</th><th>证件号</th><th>关联订单</th><th>校验结果</th></tr></thead><tbody id="rosterImportReviewRows">',
    '<tr data-import-state="new"><td><label><input type="checkbox" data-import-skip> 跳过</label></td><td>2</td><td><input class="form-control table-input" value="赵敏"></td><td><input class="form-control table-input" value="E88990011"></td><td>KS202406180001</td><td><span class="tag tag-green">新增</span></td></tr>',
    '<tr data-import-state="new"><td><label><input type="checkbox" data-import-skip> 跳过</label></td><td>3</td><td><input class="form-control table-input" value="周宁"></td><td><input class="form-control table-input" value="E88990012"></td><td>KS202406180002</td><td><span class="tag tag-green">新增</span></td></tr>',
    '<tr data-import-state="duplicate"><td><label><input type="checkbox" data-import-skip checked> 跳过</label></td><td>4</td><td><input class="form-control table-input" value="张建国"></td><td><input class="form-control table-input" value="11010119900101001X"></td><td>KS202406180001</td><td><span class="tag tag-orange">同订单同证件重复</span></td></tr>',
    '<tr data-import-state="format"><td><label><input type="checkbox" data-import-skip> 跳过</label></td><td>5</td><td><input class="form-control table-input" value="孙明"></td><td><input class="form-control table-input is-invalid" value="E12"></td><td>KS202406180008</td><td><span class="tag tag-red" data-import-result>证件格式错误</span></td></tr>',
    '<tr data-import-state="over"><td><label><input type="checkbox" data-import-skip checked> 跳过</label></td><td>6</td><td><input class="form-control table-input" value="陈可"></td><td><input class="form-control table-input" value="E88990015"></td><td>KS202406180008</td><td><span class="tag tag-red">超过订单剩余人数</span></td></tr>',
    '</tbody></table></div><p id="rosterImportReviewError" class="form-error" hidden></p>'
  ].join('');

  var activeRow = null;
  var associationExamples = {
    '张建国': ['KS202406180001', '随团代办', 'CA937 / 999-1234567890', '标准间 / 同住张晓红', '联运可供', '无'],
    '张晓红': ['KS202406180001', '游客自办', 'CA937 / 999-1234567891', '标准间 / 同住张建国', '素食已确认', '护照有效期待人工确认'],
    '李梅': ['KS202406180002', '随团代办', '去程票号待回填', '标准间', '单房差待销售确认', '护照首页、去程票号'],
    '李大明': ['KS202406180002', '随团代办', '待分配', '标准间', '无', '护照号码及有效期']
  };

  function populateVerification(row) {
    if (!row) return;
    activeRow = row;
    var cells = row.children;
    var name = cells[1] ? cells[1].textContent.trim() : '-';
    var idNo = cells[3] ? cells[3].textContent.trim() : '-';
    var data = associationExamples[name] || ['待关联订单', '未选择', '待确认', cells[5] ? cells[5].textContent.trim() : '待确认', cells[6] ? cells[6].textContent.trim() : '待确认', /缺|待/.test(row.textContent) ? '请按当前资料状态核对' : '无'];
    document.getElementById('recognizedChineseName').value = name;
    document.getElementById('recognizedEnglishName').value = name === '张建国' ? 'ZHANG/JIANGUO' : '';
    document.getElementById('recognizedDocumentNo').value = idNo === '-' ? '' : idNo;
    document.getElementById('recognizedExpiry').value = name === '张建国' ? '2031-05-20' : '';
    document.getElementById('confirmRecognizedDocument').checked = false;
    document.getElementById('rosterRecognitionStatus').className = 'tag tag-orange';
    document.getElementById('rosterRecognitionStatus').textContent = '待人工确认';
    ['rosterLinkedOrder','rosterVisaMode','rosterTransportBasis','rosterRoomBasis','rosterServiceResult','rosterConcreteGap'].forEach(function (id, index) { document.getElementById(id).textContent = data[index]; });
  }

  document.getElementById('rosterGroups').addEventListener('click', function (event) {
    var button = event.target.closest('[data-edit-guest]');
    if (button) window.setTimeout(function () { populateVerification(button.closest('tr')); }, 0);
  });

  document.getElementById('confirmRecognizedDocument').addEventListener('change', function () {
    var status = document.getElementById('rosterRecognitionStatus');
    status.className = this.checked ? 'tag tag-green' : 'tag tag-orange';
    status.textContent = this.checked ? '人工已确认' : '待人工确认';
  });

  document.getElementById('saveGuest').addEventListener('click', function () {
    if (!activeRow) return;
    activeRow.dataset.documentConfirmed = document.getElementById('confirmRecognizedDocument').checked ? 'true' : 'false';
    activeRow.dataset.englishName = document.getElementById('recognizedEnglishName').value.trim();
    activeRow.dataset.expiry = document.getElementById('recognizedExpiry').value;
  });

  document.getElementById('rosterImportReviewRows').addEventListener('input', function (event) {
    var row = event.target.closest('tr');
    if (!row || row.dataset.importState !== 'format') return;
    var idInput = row.querySelectorAll('input[type="text"]')[1];
    var valid = /^([A-Z]\d{7,8}|\d{17}[\dX])$/i.test(idInput.value.trim());
    idInput.classList.toggle('is-invalid', !valid);
    row.querySelector('[data-import-result]').className = valid ? 'tag tag-green' : 'tag tag-red';
    row.querySelector('[data-import-result]').textContent = valid ? '已修正，可新增' : '证件格式错误';
    row.dataset.importState = valid ? 'new' : 'format';
  });

  document.getElementById('confirmImportRoster').addEventListener('click', function (event) {
    var active = importModal.querySelector('[data-import-step="3"].active');
    if (!active) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    var error = document.getElementById('rosterImportReviewError');
    var unresolved = Array.from(document.querySelectorAll('#rosterImportReviewRows tr')).filter(function (row) {
      return !row.querySelector('[data-import-skip]').checked && row.dataset.importState !== 'new';
    });
    if (unresolved.length) { error.textContent = '仍有重复、格式错误或超订单人数的行，请修改或跳过后再导入。'; error.hidden = false; return; }
    var count = Array.from(document.querySelectorAll('#rosterImportReviewRows tr')).filter(function (row) { return !row.querySelector('[data-import-skip]').checked; }).length;
    error.hidden = true;
    if (window.caesarUI) window.caesarUI.closeLayer(importModal);
    showNotice('已导入' + count + '名新增游客；跳过行和原有游客保持不变。');
  }, true);

  document.getElementById('exportCurrentRoster').addEventListener('click', function () {
    var rows = Array.from(document.querySelectorAll('[data-roster-row]')).filter(function (row) { return !row.hidden && !row.closest('[data-group]').hidden; });
    var lines = [['姓名','证件类型','证件号（脱敏）','手机（脱敏）','房型/舱铺','资料状态'].join(',')];
    rows.forEach(function (row) {
      var cells = row.children;
      var values = [cells[1], cells[2], cells[3], cells[4], cells[5], cells[cells.length - 2]].map(function (cell) { return '"' + String(cell ? cell.textContent.trim() : '-').replace(/"/g, '""') + '"'; });
      lines.push(values.join(','));
    });
    var blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = '当前筛选游客名单.csv';
    link.click();
    URL.revokeObjectURL(url);
    showNotice('已按当前筛选范围导出' + rows.length + '名游客，证件号和手机号保持脱敏。');
  });
})();
