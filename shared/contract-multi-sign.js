(function () {
  'use strict';

  var tableBody = document.getElementById('contractRows');
  var confirmDrawer = document.getElementById('contractConfirmDrawer');
  var detailDrawer = document.getElementById('contractDetailDrawer');
  var sendDrawer = document.getElementById('sendContractDrawer');
  if (!tableBody || !confirmDrawer || !detailDrawer || !sendDrawer) return;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char];
    });
  }
  function moneyNumber(value) { return Number(String(value || '').replace(/[^0-9.-]/g, '')) || 0; }
  function money(value) { return '¥' + Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 }); }
  function openLayer(layer) {
    if (window.caesarUI && window.caesarUI.openLayer) window.caesarUI.openLayer(layer);
    else { layer.hidden = false; layer.classList.add('show'); layer.setAttribute('aria-hidden', 'false'); }
  }
  function closeLayer(layer) {
    if (window.caesarUI && window.caesarUI.closeLayer) window.caesarUI.closeLayer(layer);
    else { layer.classList.remove('show'); layer.hidden = true; layer.setAttribute('aria-hidden', 'true'); }
  }
  function setText(id, value) { var node = document.getElementById(id); if (node) node.textContent = value == null ? '-' : value; }
  function readJson(value, fallback) { try { return JSON.parse(value || ''); } catch (error) { return fallback; } }
  function nowText() { return '2026-09-19 10:30'; }
  function statusTag(status) {
    var cls = /已签|已生效|已归档|通过/.test(status) ? 'tag tag-green' : /失败|拒绝|失效|缺失/.test(status) ? 'tag tag-red' : /待|签署中|审核中/.test(status) ? 'tag tag-orange' : 'tag tag-blue';
    return '<span class="' + cls + '">' + esc(status) + '</span>';
  }
  function showResult(message) {
    var modal = document.getElementById('contractResultModal');
    setText('contractResultText', message);
    if (modal) openLayer(modal);
  }

  var baseTravelers = [
    { id: 'T001', name: '张建国', identity: '游客本人', signer: '张建国', relation: '本人签署', minor: false },
    { id: 'T002', name: '李梅', identity: '未成年人', signer: '王芳', relation: '监护人代签', minor: true },
    { id: 'T003', name: '王磊', identity: '游客本人', signer: '王磊', relation: '本人签署', minor: false }
  ];

  function contractRowHtml(item) {
    var action = '<button class="table-action-primary" type="button" data-open-contract-detail data-drawer-title="合同详情">详情</button>';
    if (item.status === '待发送') action = '<button class="table-action-primary" type="button" data-open-contract-qr data-drawer-title="发起签署">签署</button>' + action;
    if (item.status === '签署中') action = '<button class="table-action-primary" type="button" data-open-contract-qr data-drawer-title="扫码签署">扫码</button>' + action;
    if (/已生效|已签署/.test(item.status)) action += '<button type="button" data-open-contract-version data-drawer-title="合同变更处理">补协议</button>';
    return '<tr data-contract-row data-contract-no="' + esc(item.contractNo) + '" data-order-no="' + esc(item.orderNo) + '" data-status="' + esc(item.status) + '" data-business-type="' + esc(item.businessType || '参团游') + '" data-doc-type="' + esc(item.docType || '个人合同') + '" data-platform-status="' + esc(item.platformStatus || '待取码') + '" data-order-status="已确认" data-historical-confirmed="true" data-template-valid="true" data-company-valid="true" data-contract-company="福建凯撒国际旅行社有限公司" data-payment-terms="先签后款" data-customer="' + esc(item.customer || item.traveler) + '" data-signers="' + esc(item.traveler + '（1人）') + '" data-product="法瑞意经典15日游" data-trip="EU-FRA-20260812-001" data-travel="08-12 至 08-26" data-doc-name="个人旅游合同" data-template="平台标准 V2026.3" data-amount="' + esc(money(item.amount)) + '" data-amount-source="订单金额拆分" data-sign-progress="' + esc(item.signStatus) + '" data-platform-text="' + esc(item.platformText || '12301：待取码') + '" data-owner="赵佳" data-org="文灶门店" data-gap="' + esc(item.gap || '合同资料已齐') + '" data-attachments="' + esc(item.attachments || '行程单、费用明细已带入') + '" data-current-effective="true" data-covered-travelers="' + esc(item.travelerId) + '" data-travelers="' + esc(JSON.stringify(item.travelers)) + '" data-signer-records="' + esc(JSON.stringify(item.signerRecords)) + '" data-contract-attachments="' + esc(JSON.stringify(item.contractAttachments || [])) + '" data-sign-records="' + esc(JSON.stringify(item.signRecords || [])) + '">' +
      '<td class="contracts-id-cell"><strong>' + esc(item.contractNo) + '</strong><a class="contract-cell-sub link-primary" href="orders-detail.html?type=group&amp;orderNo=' + encodeURIComponent(item.orderNo) + '">' + esc(item.orderNo) + '</a></td>' +
      '<td class="contracts-party-cell"><strong>' + esc(item.customer || item.traveler) + '</strong><span class="contract-cell-sub">覆盖：' + esc(item.traveler) + '</span></td>' +
      '<td class="contracts-product-cell"><strong>法瑞意经典15日游</strong><span class="contract-cell-sub">EU-FRA-20260812-001</span><span class="contract-cell-sub">08-12 至 08-26</span></td>' +
      '<td class="contracts-doc-cell"><strong>个人旅游合同</strong><span class="contract-cell-sub">个人合同 / 平台标准 V2026.3</span></td>' +
      '<td class="contracts-money-cell"><strong class="amount-strong">' + esc(money(item.amount)) + '</strong><span class="contract-cell-sub">订单金额拆分</span></td>' +
      '<td class="contracts-status-cell">' + statusTag(item.status) + '<span class="contract-cell-sub">' + esc(item.gap || item.signStatus) + '</span></td>' +
      '<td class="contracts-platform-cell"><strong class="contract-sign-state">' + esc(item.signStatus) + '</strong><span class="contract-cell-sub">12301：' + esc(item.platformStatus || '待取码') + '</span></td>' +
      '<td class="contracts-owner-cell"><strong>赵佳</strong><span class="contract-cell-sub">文灶门店</span></td>' +
      '<td class="contracts-action-cell"><div class="table-action">' + action + '</div></td></tr>';
  }

  function addDemoRows() {
    if (document.querySelector('[data-contract-demo="split-ready"]')) return;
    var first = tableBody.firstElementChild;
    var ready = first.cloneNode(true);
    Object.assign(ready.dataset, {
      contractDemo: 'split-ready', contractNo: 'HT-READY-30000', orderNo: 'ORD-CONTRACT-NEW-30000', status: '待生成', businessType: '参团游', docType: '主合同', platformStatus: '待取码', orderStatus: '已确认', historicalConfirmed: 'true', templateValid: 'true', companyValid: 'true', contractCompany: '福建凯撒国际旅行社有限公司', paymentTerms: '先签后款', customer: '张建国', signers: '张建国、李梅、王磊（3人）', product: '法瑞意经典15日游', trip: 'EU-FRA-20260812-001', travel: '08-12 至 08-26', docName: '团队出境旅游合同', template: '平台标准 V2026.3', amount: '¥30,000', amountSource: '订单确认金额', signProgress: '未发送', platformText: '待生成后取码', owner: '赵佳', org: '文灶门店', gap: '合同资料已齐', attachments: '行程单、费用明细、游客名单已齐', travelers: JSON.stringify(baseTravelers), coveredTravelers: ''
    });
    ready.querySelector('.contracts-id-cell strong').textContent = ready.dataset.contractNo;
    var link = ready.querySelector('.contracts-id-cell a'); link.textContent = ready.dataset.orderNo; link.href = 'orders-detail.html?type=group&orderNo=' + ready.dataset.orderNo;
    ready.querySelector('.contracts-party-cell strong').textContent = '张建国';
    ready.querySelector('.contracts-party-cell .contract-cell-sub').textContent = '张建国、李梅、王磊（3人）';
    ready.querySelector('.contracts-money-cell strong').textContent = '¥30,000';
    ready.querySelector('.contracts-money-cell .contract-cell-sub').textContent = '订单确认金额';
    ready.querySelector('.contracts-status-cell').innerHTML = statusTag('待生成') + '<span class="contract-cell-sub">合同资料已齐</span>';
    ready.querySelector('.contracts-platform-cell').innerHTML = '<strong class="contract-sign-state">未发送</strong><span class="contract-cell-sub">12301：待取码</span>';
    ready.querySelector('.contracts-action-cell').innerHTML = '<div class="table-action"><button class="table-action-primary" type="button" data-open-generate data-drawer-title="合同生成确认">生成</button><button type="button" data-open-contract-detail data-drawer-title="合同详情">详情</button></div>';
    tableBody.insertBefore(ready, first);

    var splitRows = baseTravelers.map(function (traveler, index) {
      var signed = index < 2;
      return contractRowHtml({
        contractNo: 'HT-P-20260919-00' + (index + 1), orderNo: 'ORD-CONTRACT-30000', travelerId: traveler.id, traveler: traveler.name, customer: '张建国', amount: 10000,
        status: signed ? '已生效' : '签署中', signStatus: signed ? '已签署' : '待签署', platformStatus: signed ? '已备案' : '已取码', platformText: signed ? '备案号 12301-DEMO-00' + (index + 1) : '12301-DEMO-003',
        gap: signed ? '签署及备案已完成' : '该游客待签署', travelers: [traveler], signerRecords: [{ traveler: traveler.name, identity: traveler.identity, signer: traveler.signer, relation: traveler.relation, status: signed ? '已签署' : '待签署', time: signed ? '2026-09-18 14:0' + (index + 1) : '-' }],
        contractAttachments: traveler.minor ? [{ type: '未成年人监护人同意书', person: traveler.name, condition: '未成年人由监护人代签', version: 'V1', status: '已上传', required: true }] : [{ type: '标准行程附件', person: traveler.name, condition: '随主合同', version: 'V1', status: '已上传', required: false }],
        signRecords: signed ? [{ no: 'SIGN-' + (index + 1), source: '12301平台返回', status: '已签署', createdAt: '2026-09-18 13:30', expiresAt: '2026-09-19 13:30' }] : [{ no: 'SIGN-3-A', source: '原型演示', status: '二维码已失效', createdAt: '2026-09-18 09:00', expiresAt: '2026-09-18 17:00' }]
      });
    }).join('');
    ready.insertAdjacentHTML('afterend', splitRows);
    tableBody.querySelectorAll('[data-order-no="ORD-CONTRACT-30000"]').forEach(function (row) { row.dataset.contractDemo = 'split-result'; });

    var option = document.querySelector('#docTypeFilter option[value="个人合同"]');
    if (!option) document.getElementById('docTypeFilter').insertAdjacentHTML('beforeend', '<option>个人合同</option>');
  }
  addDemoRows();

  var confirmCheckSection = document.getElementById('confirmBusinessChecks').closest('.drawer-section');
  confirmCheckSection.insertAdjacentHTML('beforebegin', [
    '<section id="contractCoverageSetup" class="drawer-section contract-coverage-setup">',
    '<div class="drawer-section-head"><h3 class="drawer-section-title">合同方式与覆盖范围</h3><span id="contractCoverageState" class="tag tag-blue">待配置</span></div>',
    '<div id="contractPrecheckGrid" class="contract-precheck-grid"></div>',
    '<div class="contract-mode-choice"><label><input type="radio" name="contractGenerationMode" value="multi" checked> 一单一份多人合同</label><label><input type="radio" name="contractGenerationMode" value="personal"> 一单多份个人合同</label></div>',
    '<div class="contract-allocation-summary"><div><span>订单金额</span><strong id="contractOrderAmount">¥0</strong></div><div><span>已分配</span><strong id="contractAssignedAmount">¥0</strong></div><div><span>本次分配</span><strong id="contractCurrentAmount">¥0</strong></div><div><span>剩余</span><strong id="contractRemainingAmount">¥0</strong></div></div>',
    '<div class="table-wrap drawer-table-wrap"><table><thead><tr><th>选择</th><th>游客</th><th>签署身份</th><th>实际签署人</th><th>授权关系</th><th>本份金额</th></tr></thead><tbody id="contractAllocationRows"></tbody></table></div>',
    '<p id="contractAllocationError" class="form-error" hidden></p></section>',
    '<section id="contractConditionalAttachments" class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">条件附件</h3><span class="schedule-muted">仅适用条件命中时必填</span></div>',
    '<div class="table-wrap drawer-table-wrap"><table><thead><tr><th>附件</th><th>适用条件</th><th>关联游客/签署人</th><th>版本</th><th>状态</th></tr></thead><tbody id="contractConditionalAttachmentRows"></tbody></table></div>',
    '<p id="contractAttachmentError" class="form-error" hidden></p></section>'
  ].join(''));

  var detailSignSection = document.getElementById('detailSignProgress').closest('.drawer-section');
  detailSignSection.insertAdjacentHTML('afterend', [
    '<section id="contractDetailCoverage" class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">合同覆盖与逐人签署</h3><span id="detailCoverageStatus" class="tag tag-orange">未完成</span></div>',
    '<div id="detailCoverageSummary" class="contract-allocation-summary"></div>',
    '<div class="table-wrap drawer-table-wrap"><table><thead><tr><th>游客</th><th>签署身份</th><th>实际签署人</th><th>授权关系</th><th>签署状态</th><th>签署时间</th></tr></thead><tbody id="detailSignerRows"></tbody></table></div>',
    '<div class="drawer-section-head contract-subsection-head"><h4>同订单合同</h4></div><div class="table-wrap drawer-table-wrap"><table><thead><tr><th>合同编号</th><th>覆盖游客</th><th>覆盖金额</th><th>版本</th><th>签署结果</th><th>当前有效</th></tr></thead><tbody id="detailSiblingContractRows"></tbody></table></div>',
    '<div class="drawer-section-head contract-subsection-head"><h4>条件附件</h4></div><div class="table-wrap drawer-table-wrap"><table><thead><tr><th>附件</th><th>关联游客</th><th>适用条件</th><th>版本</th><th>状态</th></tr></thead><tbody id="detailContractAttachmentRows"></tbody></table></div>',
    '<div class="contract-detail-actions"><button id="detailCreateSupplement" class="btn btn-secondary btn-sm" type="button">生成补充协议</button><button id="detailCreateVersion" class="btn btn-secondary btn-sm" type="button">生成新版本</button></div></section>'
  ].join(''));

  sendDrawer.querySelector('.modal-body').insertAdjacentHTML('beforeend', [
    '<section id="contractQrSection" class="drawer-section contract-qr-section"><div class="drawer-section-head"><h3 class="drawer-section-title">当前合同扫码签署</h3><span id="contractQrStatus" class="tag tag-orange">待生成</span></div>',
    '<div class="contract-qr-layout"><div class="contract-qr-preview" aria-label="12301签署二维码预览"><span></span><span></span><span></span><span></span><strong>12301</strong></div>',
    '<div class="contract-qr-meta"><div><span>平台名称</span><strong>12301</strong></div><div><span>平台合同编号</span><strong id="contractPlatformNo">-</strong></div><div><span>状态来源</span><strong id="contractPlatformSource">原型演示</strong></div><div><span>二维码有效期</span><strong id="contractQrExpiry">-</strong></div></div></div>',
    '<div class="table-wrap drawer-table-wrap"><table><thead><tr><th>发起记录</th><th>状态来源</th><th>生成时间</th><th>有效期</th><th>结果</th></tr></thead><tbody id="contractSignRecordRows"></tbody></table></div></section>'
  ].join(''));

  document.body.insertAdjacentHTML('beforeend', [
    '<div id="enterpriseContractDrawer" class="modal-overlay drawer-overlay" aria-hidden="true" hidden><section class="modal drawer-modal drawer-xl aftersales-drawer contract-operation-drawer contract-enterprise-drawer" role="dialog" aria-modal="true" aria-labelledby="enterpriseContractTitle">',
    '<div class="modal-header"><div id="enterpriseContractTitle" class="modal-title">企业线下合同归档</div><button class="modal-close" type="button" data-close-enterprise-contract>×</button></div>',
    '<div class="modal-body aftersales-drawer-body"><section class="drawer-object-summary"><div class="drawer-summary-grid"><div class="drawer-summary-item"><span class="drawer-summary-label">项目订单</span><strong id="enterpriseOrderNo">-</strong></div><div class="drawer-summary-item"><span class="drawer-summary-label">企业客户</span><strong id="enterpriseCustomer">-</strong></div><div class="drawer-summary-item"><span class="drawer-summary-label">合同金额</span><strong id="enterpriseAmount">-</strong></div><div class="drawer-summary-item"><span class="drawer-summary-label">电子模板</span><strong id="enterpriseTemplateState">未配置有效企业电子模板</strong></div></div></section>',
    '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">线下文件与盖章检查</h3><span id="enterpriseCurrentState" class="tag tag-orange">待提交</span></div><div class="form-grid">',
    '<label class="form-group form-group-full"><span class="form-label">线下合同文件 <i class="req">*</i></span><div class="contract-file-input-row"><input id="enterpriseFileName" class="form-control" type="text" placeholder="上传后显示文件名"><button id="loadEnterpriseSampleFile" class="btn btn-secondary" type="button">选择示例文件</button></div></label>',
    '<label class="form-group checkbox-row"><input id="enterpriseOurSeal" type="checkbox"> 我方盖章完整</label><label class="form-group checkbox-row"><input id="enterpriseClientSeal" type="checkbox"> 客户盖章完整</label>',
    '<label class="form-group checkbox-row"><input id="enterpriseAuthorization" type="checkbox"> 企业授权代表资料已核对</label><label class="form-group"><span class="form-label">当前版本</span><input id="enterpriseVersion" class="form-control" type="text" value="V1" readonly></label>',
    '<label class="form-group form-group-full"><span class="form-label">替换／审核说明</span><textarea id="enterpriseReason" class="form-control" rows="3" placeholder="替换版本时必须说明原因"></textarea></label></div><p id="enterpriseContractError" class="form-error" hidden></p></section>',
    '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">版本与归档记录</h3></div><div class="table-wrap drawer-table-wrap"><table><thead><tr><th>版本</th><th>文件</th><th>双方盖章</th><th>审核</th><th>归档</th><th>替换说明</th></tr></thead><tbody id="enterpriseVersionRows"></tbody></table></div></section></div>',
    '<div class="modal-footer"><button class="btn btn-secondary" type="button" data-close-enterprise-contract>取消</button><button id="replaceEnterpriseVersion" class="btn btn-secondary" type="button">替换版本</button><button id="submitEnterpriseReview" class="btn btn-secondary" type="button">提交审核</button><button id="archiveEnterpriseContract" class="btn btn-primary" type="button">审核通过并归档</button></div>',
    '</section></div>'
  ].join(''));

  var currentGenerateRow = null;
  var currentDetailRow = null;
  var currentSignRow = null;
  var currentEnterpriseRow = null;
  var generationState = null;
  var generatedKeys = {};
  var enterpriseStates = {};

  function travelersFor(row) {
    var stored = readJson(row.dataset.travelers, null);
    if (stored && stored.length) return stored;
    var countMatch = (row.dataset.signers || '').match(/(\d+)人|\/(\d+)/);
    var count = countMatch ? Number(countMatch[1] || countMatch[2]) : 1;
    var names = [row.dataset.customer || '游客1', '同行游客2', '同行游客3', '同行游客4'];
    return names.slice(0, Math.max(1, count)).map(function (name, index) { return { id: 'AUTO-' + (index + 1), name: name, identity: '游客本人', signer: name, relation: '本人签署', minor: false }; });
  }
  function attachmentItems(travelers) {
    var items = [{ type: '标准行程附件', person: '全部游客', condition: '随主合同', version: 'V1', status: '已上传', required: true }];
    travelers.forEach(function (traveler) {
      if (traveler.minor) {
        items.push({ type: '未成年人监护人同意书', person: traveler.name + ' / ' + traveler.signer, condition: '未成年人由监护人代签', version: 'V1', status: '已上传', required: true });
        items.push({ type: '监护关系证明', person: traveler.name + ' / ' + traveler.signer, condition: traveler.relation, version: 'V1', status: '已上传', required: true });
      }
    });
    items.push({ type: '特别风险免责确认', person: '不适用', condition: '本单未命中特别风险活动', version: '-', status: '无需附件', required: false });
    return items;
  }
  function precheck(row) {
    var payment = row.dataset.paymentTerms || '待确认';
    return [
      { label: '业务类型', ok: Boolean(row.dataset.businessType), text: row.dataset.businessType || '待确认' },
      { label: '订单确认', ok: row.dataset.orderStatus === '已确认', text: row.dataset.orderStatus || '待确认' },
      { label: '合同主体', ok: row.dataset.companyValid === 'true', text: row.dataset.companyValid === 'true' ? row.dataset.contractCompany : '签约主体待核对' },
      { label: '有效模板', ok: row.dataset.templateValid === 'true', text: row.dataset.templateValid === 'true' ? row.dataset.template : '模板待法务核对' },
      { label: '适用条款', ok: row.dataset.templateValid === 'true', text: row.dataset.templateValid === 'true' ? '随有效模板版本锁定' : '条款版本待确认' },
      { label: '付款条件', ok: payment !== '待确认', text: payment === '先签后款' ? '已配置先签后款；不要求先收齐全款' : payment }
    ];
  }
  function fillBaseConfirm(row) {
    setText('confirmContractNo', row.dataset.contractNo);
    setText('confirmContractMeta', (row.dataset.docName || '-') + ' / ' + (row.dataset.orderNo || '-'));
    setText('confirmOrderNo', row.dataset.orderNo);
    setText('confirmCustomer', (row.dataset.customer || '-') + ' / ' + (row.dataset.signers || '-'));
    setText('confirmProduct', row.dataset.product);
    setText('confirmTrip', row.dataset.trip);
    setText('confirmTravel', row.dataset.travel);
    setText('confirmAmount', row.dataset.amount);
    setText('confirmAmountSource', row.dataset.amountSource);
    setText('confirmDocName', row.dataset.docName);
    setText('confirmTemplate', row.dataset.template);
    setText('confirmPlatformState', row.dataset.platformText || '生成后取码');
    setText('confirmAttachments', row.dataset.attachments);
    var tag = document.getElementById('confirmStatusTag');
    if (tag) { tag.textContent = row.dataset.status || '待生成'; tag.className = 'tag tag-blue'; }
    var subject = document.getElementById('contractSubject');
    if (subject && row.dataset.contractCompany) subject.value = row.dataset.contractCompany;
    var deadline = document.getElementById('signDeadline');
    if (deadline && !deadline.value) deadline.value = '2026-09-30';
    var orderLink = document.getElementById('confirmOrderLink');
    if (orderLink) orderLink.href = 'orders-detail.html?type=group&orderNo=' + encodeURIComponent(row.dataset.orderNo || '');
  }
  function startGeneration(row) {
    currentGenerateRow = row;
    fillBaseConfirm(row);
    var travelers = travelersFor(row);
    generationState = { mode: row.dataset.contractDemo === 'split-ready' ? 'personal' : 'multi', travelers: travelers, attachments: attachmentItems(travelers), orderAmount: moneyNumber(row.dataset.amount), assigned: 0, givenAllocations: row.dataset.contractDemo === 'split-ready' ? travelers.map(function () { return 10000; }) : null };
    confirmDrawer.querySelectorAll('input[name="contractGenerationMode"]').forEach(function (input) { input.checked = input.value === generationState.mode; });
    renderGeneration();
    openLayer(confirmDrawer);
  }
  function renderGeneration() {
    if (!generationState || !currentGenerateRow) return;
    var checks = precheck(currentGenerateRow);
    document.getElementById('contractPrecheckGrid').innerHTML = checks.map(function (item) { return '<div class="contract-precheck-item ' + (item.ok ? 'ok' : 'warning') + '"><span>' + esc(item.label) + '</span><strong>' + esc(item.text) + '</strong></div>'; }).join('');
    document.getElementById('contractAllocationRows').innerHTML = generationState.travelers.map(function (traveler, index) {
      var allocation = generationState.givenAllocations ? generationState.givenAllocations[index] : '';
      return '<tr data-traveler-id="' + esc(traveler.id) + '"><td><input type="checkbox" data-contract-traveler checked></td><td><strong>' + esc(traveler.name) + '</strong></td><td>' + esc(traveler.identity) + '</td><td>' + esc(traveler.signer) + '</td><td>' + esc(traveler.relation) + '</td><td>' + (generationState.mode === 'personal' ? '<input class="form-control table-input" data-contract-allocation type="number" min="0" step="0.01" value="' + esc(allocation) + '" placeholder="待填分配金额">' : '<span class="contract-shared-amount">计入多人合同总额</span>') + '</td></tr>';
    }).join('');
    document.getElementById('contractConditionalAttachmentRows').innerHTML = generationState.attachments.map(function (item, index) {
      return '<tr data-attachment-index="' + index + '"><td><strong>' + esc(item.type) + '</strong>' + (item.required ? '<span class="tag tag-orange">必要</span>' : '') + '</td><td>' + esc(item.condition) + '</td><td>' + esc(item.person) + '</td><td>' + esc(item.version) + '</td><td><select class="form-control table-input" data-attachment-status' + (!item.required ? ' disabled' : '') + '><option' + (item.status === '已上传' ? ' selected' : '') + '>已上传</option><option' + (item.status === '待上传' ? ' selected' : '') + '>待上传</option>' + (!item.required ? '<option selected>无需附件</option>' : '') + '</select></td></tr>';
    }).join('');
    updateAllocationSummary();
  }
  function selectedAllocations() {
    return Array.from(document.querySelectorAll('#contractAllocationRows tr')).filter(function (row) { return row.querySelector('[data-contract-traveler]').checked; }).map(function (row) {
      var traveler = generationState.travelers.find(function (item) { return item.id === row.dataset.travelerId; });
      return { traveler: traveler, amount: generationState.mode === 'personal' ? Number(row.querySelector('[data-contract-allocation]').value || 0) : 0 };
    });
  }
  function updateAllocationSummary() {
    if (!generationState) return;
    var selected = selectedAllocations();
    var current = generationState.mode === 'personal' ? selected.reduce(function (sum, item) { return sum + item.amount; }, 0) : (selected.length ? generationState.orderAmount : 0);
    setText('contractOrderAmount', money(generationState.orderAmount));
    setText('contractAssignedAmount', money(generationState.assigned));
    setText('contractCurrentAmount', money(current));
    setText('contractRemainingAmount', money(Math.max(0, generationState.orderAmount - generationState.assigned - current)));
    var state = document.getElementById('contractCoverageState');
    state.textContent = selected.length === generationState.travelers.length && current === generationState.orderAmount ? '覆盖完整' : '覆盖未完成';
    state.className = selected.length === generationState.travelers.length && current === generationState.orderAmount ? 'tag tag-green' : 'tag tag-orange';
  }
  function validateGeneration() {
    var allocationError = document.getElementById('contractAllocationError');
    var attachmentError = document.getElementById('contractAttachmentError');
    allocationError.hidden = true; attachmentError.hidden = true;
    var checks = precheck(currentGenerateRow);
    var failed = checks.filter(function (item) { return !item.ok; });
    if (failed.length) { allocationError.textContent = failed.map(function (item) { return item.label + '：' + item.text; }).join('；'); allocationError.hidden = false; return null; }
    var selected = selectedAllocations();
    if (!selected.length) { allocationError.textContent = '请至少选择一名本次合同覆盖游客。'; allocationError.hidden = false; return null; }
    var unique = new Set(selected.map(function (item) { return item.traveler.id; }));
    if (unique.size !== selected.length) { allocationError.textContent = '同一有效版本内存在重复覆盖游客。'; allocationError.hidden = false; return null; }
    var existing = (currentGenerateRow.dataset.coveredTravelers || '').split(',').filter(Boolean);
    var duplicate = selected.find(function (item) { return existing.indexOf(item.traveler.id) >= 0; });
    if (duplicate) { allocationError.textContent = duplicate.traveler.name + '已被当前有效合同覆盖，不能重复生成。'; allocationError.hidden = false; return null; }
    var total = generationState.mode === 'personal' ? selected.reduce(function (sum, item) { return sum + item.amount; }, 0) : generationState.orderAmount;
    if (generationState.mode === 'personal' && selected.some(function (item) { return !(item.amount > 0); })) { allocationError.textContent = '每份个人合同必须填写明确且大于0的分配金额；金额未知时请保存草稿。'; allocationError.hidden = false; return null; }
    if (total !== generationState.orderAmount) { allocationError.textContent = '本次分配' + money(total) + '与订单剩余金额' + money(generationState.orderAmount) + '不一致，请核对后提交。'; allocationError.hidden = false; return null; }
    document.querySelectorAll('#contractConditionalAttachmentRows tr').forEach(function (row) { var index = Number(row.dataset.attachmentIndex); var select = row.querySelector('[data-attachment-status]'); if (select && !select.disabled) generationState.attachments[index].status = select.value; });
    var missing = generationState.attachments.filter(function (item) { return item.required && item.status !== '已上传'; });
    if (missing.length) { attachmentError.textContent = missing.map(function (item) { return item.person + '／' + item.type + '待上传'; }).join('；'); attachmentError.hidden = false; return null; }
    var key = currentGenerateRow.dataset.orderNo + '|' + generationState.mode + '|' + selected.map(function (item) { return item.traveler.id + ':' + item.amount; }).join(',');
    if (generatedKeys[key]) { allocationError.textContent = '相同游客和金额的合同已经生成，不能重复提交。'; allocationError.hidden = false; return null; }
    return { selected: selected, total: total, key: key };
  }
  function generatedContractNo(index) { return 'HT-P-20260919-' + String(100 + index).padStart(3, '0'); }
  function submitGeneration() {
    var result = validateGeneration();
    if (!result) return;
    generatedKeys[result.key] = true;
    var row = currentGenerateRow;
    if (generationState.mode === 'personal') {
      var html = result.selected.map(function (item, index) {
        var traveler = item.traveler;
        return contractRowHtml({ contractNo: generatedContractNo(index + 1), orderNo: row.dataset.orderNo, travelerId: traveler.id, traveler: traveler.name, customer: row.dataset.customer, amount: item.amount, status: '待审核', signStatus: '未发送', platformStatus: '待取码', gap: '个人合同待审核', travelers: [traveler], signerRecords: [{ traveler: traveler.name, identity: traveler.identity, signer: traveler.signer, relation: traveler.relation, status: '未发送', time: '-' }], contractAttachments: generationState.attachments.filter(function (attachment) { return attachment.person === '全部游客' || attachment.person.indexOf(traveler.name) >= 0; }), signRecords: [] });
      }).join('');
      row.insertAdjacentHTML('afterend', html);
      row.remove();
      showResult('已生成' + result.selected.length + '份个人合同，合计' + money(result.total) + '；订单仍为一笔，待分别审核和签署。');
    } else {
      row.dataset.status = '待审核'; row.dataset.coveredTravelers = result.selected.map(function (item) { return item.traveler.id; }).join(','); row.dataset.signerRecords = JSON.stringify(result.selected.map(function (item) { return { traveler: item.traveler.name, identity: item.traveler.identity, signer: item.traveler.signer, relation: item.traveler.relation, status: '未发送', time: '-' }; })); row.dataset.contractAttachments = JSON.stringify(generationState.attachments);
      row.querySelector('.contracts-status-cell').innerHTML = statusTag('待审核') + '<span class="contract-cell-sub">多人合同待审核</span>';
      row.querySelector('.contracts-action-cell').innerHTML = '<div class="table-action"><button class="table-action-primary" type="button" data-open-contract-detail>详情</button></div>';
      showResult('多人合同已生成并提交审核，覆盖' + result.selected.length + '名游客，合同金额' + money(result.total) + '。');
    }
    closeLayer(confirmDrawer);
  }

  function fillBaseDetail(row) {
    setText('detailContractNo', row.dataset.contractNo);
    setText('detailContractMeta', (row.dataset.docName || '-') + ' / ' + (row.dataset.orderNo || '-'));
    setText('detailOrderNo', row.dataset.orderNo);
    setText('detailCustomer', (row.dataset.customer || '-') + ' / ' + (row.dataset.signers || '-'));
    setText('detailProduct', [row.dataset.product, row.dataset.trip, row.dataset.travel].filter(Boolean).join(' / '));
    setText('detailDocName', row.dataset.docName);
    setText('detailTemplate', row.dataset.template);
    setText('detailAmount', row.dataset.amount);
    setText('detailAmountSource', row.dataset.amountSource);
    setText('detailSignProgress', row.dataset.signProgress);
    setText('detailPlatform', (row.dataset.platformStatus || '-') + ' / ' + (row.dataset.platformText || '-'));
    setText('detailOwner', (row.dataset.owner || '-') + ' / ' + (row.dataset.org || '-'));
    setText('detailGap', row.dataset.gap);
    setText('detailAttachments', row.dataset.attachments);
    var tag = document.getElementById('detailStatusTag'); tag.textContent = row.dataset.status; tag.className = /已/.test(row.dataset.status) ? 'tag tag-green' : 'tag tag-orange';
  }
  function siblingRows(row) { return Array.from(tableBody.querySelectorAll('[data-contract-row]')).filter(function (item) { return item.dataset.orderNo === row.dataset.orderNo && item.dataset.currentEffective !== 'false'; }); }
  function renderDetail(row) {
    currentDetailRow = row;
    fillBaseDetail(row);
    var travelers = travelersFor(row);
    var signers = readJson(row.dataset.signerRecords, travelers.map(function (traveler) { return { traveler: traveler.name, identity: traveler.identity, signer: traveler.signer, relation: traveler.relation, status: row.dataset.signProgress || '未发送', time: '-' }; }));
    var siblings = siblingRows(row);
    var orderAmount = row.dataset.orderNo === 'ORD-CONTRACT-30000' ? 30000 : siblings.reduce(function (sum, item) { return sum + moneyNumber(item.dataset.amount); }, 0) || moneyNumber(row.dataset.amount);
    var coveredAmount = siblings.reduce(function (sum, item) { return sum + moneyNumber(item.dataset.amount); }, 0);
    var coveredNames = new Set(); siblings.forEach(function (item) { travelersFor(item).forEach(function (traveler) { coveredNames.add(traveler.name); }); });
    var completed = siblings.length > 0 && siblings.every(function (item) { return /已签署|已生效/.test((item.dataset.signProgress || '') + (item.dataset.status || '')); });
    var status = document.getElementById('detailCoverageStatus'); status.textContent = completed ? '订单覆盖已完成' : '订单覆盖未完成'; status.className = completed ? 'tag tag-green' : 'tag tag-orange';
    document.getElementById('detailCoverageSummary').innerHTML = '<div><span>订单金额</span><strong>' + money(orderAmount) + '</strong></div><div><span>有效合同</span><strong>' + siblings.length + '份</strong></div><div><span>覆盖游客</span><strong>' + coveredNames.size + '人</strong></div><div><span>覆盖金额</span><strong>' + money(coveredAmount) + '</strong></div>';
    document.getElementById('detailSignerRows').innerHTML = signers.map(function (item) { return '<tr><td><strong>' + esc(item.traveler) + '</strong></td><td>' + esc(item.identity) + '</td><td>' + esc(item.signer) + '</td><td>' + esc(item.relation) + '</td><td>' + statusTag(item.status) + '</td><td>' + esc(item.time || '-') + '</td></tr>'; }).join('');
    document.getElementById('detailSiblingContractRows').innerHTML = siblings.map(function (item) { var names = travelersFor(item).map(function (traveler) { return traveler.name; }).join('、'); return '<tr><td><strong>' + esc(item.dataset.contractNo) + '</strong></td><td>' + esc(names) + '</td><td>' + esc(item.dataset.amount) + '</td><td>' + esc(item.dataset.docType === '个人合同' ? '个人合同 V1' : item.dataset.template || 'V1') + '</td><td>' + statusTag(item.dataset.signProgress || item.dataset.status) + '</td><td>' + statusTag(item.dataset.currentEffective === 'false' ? '历史版本' : '当前有效') + '</td></tr>'; }).join('');
    var attachments = readJson(row.dataset.contractAttachments, attachmentItems(travelers));
    document.getElementById('detailContractAttachmentRows').innerHTML = attachments.map(function (item) { return '<tr><td><strong>' + esc(item.type) + '</strong></td><td>' + esc(item.person) + '</td><td>' + esc(item.condition) + '</td><td>' + esc(item.version) + '</td><td>' + statusTag(item.status) + '</td></tr>'; }).join('');
    document.getElementById('detailCreateSupplement').hidden = !/已生效|已签署/.test(row.dataset.status + row.dataset.signProgress);
    document.getElementById('detailCreateVersion').hidden = document.getElementById('detailCreateSupplement').hidden;
    openLayer(detailDrawer);
  }

  function renderSign(row) {
    currentSignRow = row;
    var records = readJson(row.dataset.signRecords, []);
    var latest = records[records.length - 1] || { no: '待生成', source: '原型演示', status: '待生成', createdAt: '-', expiresAt: '-' };
    setText('contractPlatformNo', row.dataset.platformText || '-');
    setText('contractPlatformSource', latest.source || '原型演示');
    setText('contractQrExpiry', latest.expiresAt || '-');
    var status = document.getElementById('contractQrStatus'); status.textContent = latest.status; status.className = /失效|失败/.test(latest.status) ? 'tag tag-red' : /已签/.test(latest.status) ? 'tag tag-green' : 'tag tag-orange';
    document.getElementById('contractSignRecordRows').innerHTML = records.length ? records.map(function (record) { return '<tr><td><strong>' + esc(record.no) + '</strong></td><td>' + esc(record.source) + '</td><td>' + esc(record.createdAt) + '</td><td>' + esc(record.expiresAt) + '</td><td>' + statusTag(record.status) + '</td></tr>'; }).join('') : '<tr><td colspan="5" class="table-empty-cell">尚未发起签署</td></tr>';
    var submit = document.getElementById('sendContractSubmit'); submit.textContent = latest.status === '二维码已失效' ? '重新发起签署' : '确认发送';
    openLayer(sendDrawer);
  }
  function submitSign() {
    if (!currentSignRow) return;
    var deadline = document.getElementById('sendSignDeadline').value;
    if (!deadline) {
      document.getElementById('sendBusinessChecks').insertAdjacentHTML('beforeend', '<p class="store-order-error">请填写本次二维码及签署截止日期。</p>');
      return;
    }
    var records = readJson(currentSignRow.dataset.signRecords, []);
    records.push({ no: 'SIGN-' + String(records.length + 1).padStart(3, '0'), source: '原型演示，等待12301返回', status: '等待签署', createdAt: nowText(), expiresAt: deadline + ' 23:59' });
    currentSignRow.dataset.signRecords = JSON.stringify(records);
    currentSignRow.dataset.signProgress = '等待签署';
    currentSignRow.dataset.platformStatus = '已取码';
    currentSignRow.querySelector('.contract-sign-state').textContent = '等待签署';
    currentSignRow.querySelector('.contracts-platform-cell .contract-cell-sub').textContent = '12301：已重新取码';
    renderSign(currentSignRow);
    showResult('新的扫码签署记录已生成；原失效二维码和发送记录继续保留。');
  }

  function enterpriseState(row) {
    var key = row.dataset.orderNo;
    if (!enterpriseStates[key]) enterpriseStates[key] = { versions: [], current: { version: 'V1', file: '', ourSeal: false, clientSeal: false, authorization: false, audit: '待提交', archive: '未归档', reason: '' } };
    return enterpriseStates[key];
  }
  function openEnterprise(row) {
    currentEnterpriseRow = row;
    row.dataset.enterpriseElectronicTemplate = 'false';
    var state = enterpriseState(row), current = state.current;
    setText('enterpriseOrderNo', row.dataset.orderNo); setText('enterpriseCustomer', row.dataset.customer); setText('enterpriseAmount', row.dataset.amount); setText('enterpriseTemplateState', '未配置有效企业电子模板，使用线下归档');
    document.getElementById('enterpriseFileName').value = current.file;
    document.getElementById('enterpriseOurSeal').checked = current.ourSeal;
    document.getElementById('enterpriseClientSeal').checked = current.clientSeal;
    document.getElementById('enterpriseAuthorization').checked = current.authorization;
    document.getElementById('enterpriseVersion').value = current.version;
    document.getElementById('enterpriseReason').value = current.reason;
    renderEnterpriseVersions(state);
    openLayer(document.getElementById('enterpriseContractDrawer'));
  }
  function readEnterpriseForm() {
    var state = enterpriseState(currentEnterpriseRow), current = state.current;
    current.file = document.getElementById('enterpriseFileName').value.trim(); current.ourSeal = document.getElementById('enterpriseOurSeal').checked; current.clientSeal = document.getElementById('enterpriseClientSeal').checked; current.authorization = document.getElementById('enterpriseAuthorization').checked; current.reason = document.getElementById('enterpriseReason').value.trim();
    return state;
  }
  function enterpriseError(message) { var node = document.getElementById('enterpriseContractError'); node.textContent = message; node.hidden = !message; }
  function validateEnterprise(state) {
    var current = state.current, gaps = [];
    if (!current.file) gaps.push('请上传线下合同文件');
    if (!current.ourSeal) gaps.push('我方盖章未确认');
    if (!current.clientSeal) gaps.push('客户盖章未确认');
    if (!current.authorization) gaps.push('企业授权代表资料未核对');
    enterpriseError(gaps.join('；'));
    return !gaps.length;
  }
  function renderEnterpriseVersions(state) {
    var all = state.versions.concat([state.current]);
    document.getElementById('enterpriseVersionRows').innerHTML = all.map(function (item) { return '<tr><td><strong>' + esc(item.version) + '</strong></td><td>' + esc(item.file || '待上传') + '</td><td>' + statusTag(item.ourSeal && item.clientSeal ? '双方完整' : '待补盖章') + '</td><td>' + statusTag(item.audit) + '</td><td>' + statusTag(item.archive) + '</td><td>' + esc(item.reason || '-') + '</td></tr>'; }).join('');
    var currentTag = document.getElementById('enterpriseCurrentState'); currentTag.textContent = state.current.archive === '已归档' ? '已归档' : state.current.audit; currentTag.className = state.current.archive === '已归档' ? 'tag tag-green' : 'tag tag-orange';
  }
  function submitEnterpriseReview() {
    var state = readEnterpriseForm(); if (!validateEnterprise(state)) return;
    state.current.audit = '待审核'; state.current.archive = '未归档'; enterpriseError(''); renderEnterpriseVersions(state);
    showResult('企业线下合同已提交审核；双方盖章资料和当前文件版本已保留。');
  }
  function archiveEnterprise() {
    var state = readEnterpriseForm(); if (!validateEnterprise(state)) return;
    if (state.current.audit !== '待审核') { enterpriseError('请先提交审核，再执行归档。'); return; }
    state.current.audit = '审核通过'; state.current.archive = '已归档'; currentEnterpriseRow.dataset.status = '已生效'; currentEnterpriseRow.dataset.platformStatus = '不适用'; currentEnterpriseRow.dataset.platformText = '企业线下合同已归档'; currentEnterpriseRow.querySelector('.contracts-status-cell').innerHTML = statusTag('已生效') + '<span class="contract-cell-sub">企业线下合同已归档</span>'; currentEnterpriseRow.querySelector('.contracts-platform-cell').innerHTML = '<strong class="contract-sign-state">双方已盖章</strong><span class="contract-cell-sub">线下归档</span>';
    enterpriseError(''); renderEnterpriseVersions(state); showResult('双方盖章及审核已核对，企业线下合同已归档。');
  }
  function replaceEnterprise() {
    var state = readEnterpriseForm();
    if (state.current.archive !== '已归档') { enterpriseError('当前版本尚未归档，不能创建替换版本。'); return; }
    if (!state.current.reason) { enterpriseError('替换版本必须填写替换原因。'); return; }
    state.versions.push(Object.assign({}, state.current, { archive: '历史版本' }));
    var versionNo = state.versions.length + 1;
    state.current = { version: 'V' + versionNo, file: '', ourSeal: false, clientSeal: false, authorization: false, audit: '待提交', archive: '未归档', reason: state.versions[state.versions.length - 1].reason };
    openEnterprise(currentEnterpriseRow); enterpriseError('');
  }

  document.addEventListener('click', function (event) {
    var generate = event.target.closest('[data-open-generate]');
    if (generate) {
      var generateRow = generate.closest('[data-contract-row]');
      if (generateRow && generateRow.dataset.businessType === 'MICE') {
        event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); openEnterprise(generateRow); return;
      }
    }
    if (event.target.closest('#confirmSubmitBtn') && currentGenerateRow) {
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); submitGeneration(); return;
    }
    if (event.target.closest('#sendContractSubmit') && currentSignRow) {
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); submitSign(); return;
    }
  }, true);

  document.addEventListener('click', function (event) {
    var generate = event.target.closest('[data-open-generate]'); if (generate) { var row = generate.closest('[data-contract-row]'); if (row && row.dataset.businessType !== 'MICE') startGeneration(row); return; }
    var detail = event.target.closest('[data-open-contract-detail]'); if (detail) { renderDetail(detail.closest('[data-contract-row]')); return; }
    var qr = event.target.closest('[data-open-contract-qr]'); if (qr) { var qrRow = qr.closest('[data-contract-row]'); setText('sendContractNo', qrRow.dataset.contractNo); setText('sendContractMeta', qrRow.dataset.docName + ' / ' + qrRow.dataset.orderNo); setText('sendCustomer', qrRow.dataset.customer + ' / ' + qrRow.dataset.signers); document.getElementById('sendSignDeadline').value = '2026-09-30'; renderSign(qrRow); return; }
    if (event.target.closest('#detailCreateSupplement') || event.target.closest('#detailCreateVersion')) {
      if (!currentDetailRow) return; closeLayer(detailDrawer); var versionButton = currentDetailRow.querySelector('[data-open-contract-version]'); if (versionButton) { if (event.target.closest('#detailCreateVersion')) { versionButton.click(); setTimeout(function () { var select = document.getElementById('contractVersionMode'); if (select) select.value = '生成新版本合同'; }, 0); } else versionButton.click(); } return;
    }
    if (event.target.closest('#loadEnterpriseSampleFile')) { document.getElementById('enterpriseFileName').value = '某科技公司欧洲项目合同_双方盖章版.pdf'; return; }
    if (event.target.closest('#submitEnterpriseReview')) { submitEnterpriseReview(); return; }
    if (event.target.closest('#archiveEnterpriseContract')) { archiveEnterprise(); return; }
    if (event.target.closest('#replaceEnterpriseVersion')) { replaceEnterprise(); return; }
    if (event.target.closest('[data-close-enterprise-contract]')) { closeLayer(document.getElementById('enterpriseContractDrawer')); return; }
  });
  document.addEventListener('change', function (event) {
    if (event.target.matches('input[name="contractGenerationMode"]')) { generationState.mode = event.target.value; renderGeneration(); }
    if (event.target.matches('[data-contract-traveler], [data-contract-allocation]')) updateAllocationSummary();
  });
  document.addEventListener('input', function (event) { if (event.target.matches('[data-contract-allocation]')) updateAllocationSummary(); });

  tableBody.querySelectorAll('[data-business-type="MICE"] [data-open-generate]').forEach(function (button) { button.textContent = '线下归档'; button.setAttribute('data-drawer-title', '企业线下合同归档'); });

  window.Contract88Test = {
    generatedKeys: generatedKeys,
    enterpriseStates: enterpriseStates,
    getCoverage: function (orderNo) {
      var rows = Array.from(tableBody.querySelectorAll('[data-contract-row]')).filter(function (row) { return row.dataset.orderNo === orderNo && row.dataset.currentEffective !== 'false'; });
      return { count: rows.length, amount: rows.reduce(function (sum, row) { return sum + moneyNumber(row.dataset.amount); }, 0), complete: rows.length > 0 && rows.every(function (row) { return /已签署|已生效/.test((row.dataset.signProgress || '') + (row.dataset.status || '')); }) };
    }
  };
})();
