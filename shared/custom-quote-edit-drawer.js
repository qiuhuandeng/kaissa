(function () {
  var drawerId = 'customQuoteEditDrawer';
  var currentContext = {};
  var callbacks = {};
  var dirty = false;
  var workingQuoteId = '';

  function byId(id) { return document.getElementById(id); }
  function value(id) { var node = byId(id); return node ? String(node.value || '').trim() : ''; }
  function setValue(id, next) { var node = byId(id); if (node) node.value = next === undefined || next === null ? '' : next; }
  function setText(id, next) { var node = byId(id); if (node) node.textContent = next || '-'; }
  function escapeHtml(next) {
    return String(next || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function toast(message, type) {
    if (window.caesarUI && window.caesarUI.toast) window.caesarUI.toast(message, { type: type || 'success' });
  }
  function toNumber(next) {
    var amount = Number(String(next || '').replace(/[^\d.-]/g, ''));
    return isFinite(amount) ? amount : 0;
  }
  function money(next) {
    return '¥' + Math.round(toNumber(next)).toLocaleString('zh-CN');
  }
  function formatPercent(next) {
    return isFinite(next) ? (next * 100).toFixed(1) + '%' : '-';
  }
  function drawer() { return byId(drawerId); }
  function quote() { return currentContext.quote || {}; }
  function nextVersion(version) {
    var match = String(version || '').match(/V(\d+)/i);
    return 'V' + ((match ? Number(match[1]) : 0) + 1);
  }
  function resultVersion() {
    if (currentContext.action === 'edit') return quote().version || currentContext.quoteVersion || 'V1';
    return currentContext.nextVersion || nextVersion(currentContext.quoteVersion || quote().version || 'V0');
  }
  function title() {
    if (currentContext.action === 'copy') return '复制报价版本';
    if (currentContext.action === 'edit') return '编辑报价草稿';
    return '新建报价版本';
  }
  function quoteType() {
    if (currentContext.action === 'copy') return '客户反馈调整';
    return quote().quoteType || '首次报价';
  }
  function defaultItinerary() {
    return [{ day: 'D1', plan: '', hotel: '', transport: '', activity: '' }];
  }
  function defaultCostItems() {
    return [{ name: '', supplier: '', quantity: '', unit: '项', unitCost: '', validDate: '', note: '' }];
  }
  function defaultPriceItems() {
    return [{ name: '', basis: '', quantity: '', unit: '项', unitPrice: '' }];
  }
  function defaultPaymentNodes() {
    return [{ name: '项目首款', ratio: '', amount: '', condition: '', planDate: '' }];
  }
  function closeLayer(force) {
    var layer = drawer();
    if (!layer) return;
    if (!force && dirty && !window.confirm('当前报价尚未保存，确定关闭吗？')) return;
    if (window.caesarUI && window.caesarUI.closeLayer) window.caesarUI.closeLayer(layer);
    else { layer.hidden = true; layer.classList.remove('show'); layer.setAttribute('aria-hidden', 'true'); }
  }
  function openLayer(layer) {
    if (window.caesarUI && window.caesarUI.openLayer) window.caesarUI.openLayer(layer);
    else { layer.hidden = false; layer.classList.add('show'); layer.setAttribute('aria-hidden', 'false'); }
  }
  function costRow(item) {
    item = item || {};
    return '<tr data-cost-row>' +
      '<td><input class="form-control" data-field="name" value="' + escapeHtml(item.name) + '" placeholder="如：酒店住宿"></td>' +
      '<td><input class="form-control" data-field="supplier" value="' + escapeHtml(item.supplier) + '" placeholder="供应商或成本来源"></td>' +
      '<td><input class="form-control quote-number" data-field="quantity" inputmode="decimal" value="' + escapeHtml(item.quantity) + '" placeholder="数量"></td>' +
      '<td><input class="form-control quote-unit" data-field="unit" value="' + escapeHtml(item.unit || '项') + '" placeholder="单位"></td>' +
      '<td><input class="form-control quote-money-input" data-field="unitCost" inputmode="decimal" value="' + escapeHtml(item.unitCost) + '" placeholder="成本单价"></td>' +
      '<td class="quote-calculated" data-cost-total>¥0</td>' +
      '<td><input class="form-control" data-field="validDate" type="date" value="' + escapeHtml(item.validDate) + '"></td>' +
      '<td><input class="form-control" data-field="note" value="' + escapeHtml(item.note) + '" placeholder="备注"></td>' +
      '<td><button class="table-action-primary quote-row-remove" type="button" data-remove-row="cost">删除</button></td>' +
    '</tr>';
  }
  function priceRow(item) {
    item = item || {};
    return '<tr data-price-row>' +
      '<td><input class="form-control" data-field="name" value="' + escapeHtml(item.name) + '" placeholder="如：全程酒店"></td>' +
      '<td><input class="form-control" data-field="basis" value="' + escapeHtml(item.basis) + '" placeholder="对客费用口径"></td>' +
      '<td><input class="form-control quote-number" data-field="quantity" inputmode="decimal" value="' + escapeHtml(item.quantity) + '" placeholder="数量"></td>' +
      '<td><input class="form-control quote-unit" data-field="unit" value="' + escapeHtml(item.unit || '项') + '" placeholder="单位"></td>' +
      '<td><input class="form-control quote-money-input" data-field="unitPrice" inputmode="decimal" value="' + escapeHtml(item.unitPrice) + '" placeholder="客户单价"></td>' +
      '<td class="quote-calculated" data-price-total>¥0</td>' +
      '<td><button class="table-action-primary quote-row-remove" type="button" data-remove-row="price">删除</button></td>' +
    '</tr>';
  }
  function itineraryRow(item) {
    item = item || {};
    return '<tr data-itinerary-row>' +
      '<td><input class="form-control quote-day-input" data-field="day" value="' + escapeHtml(item.day) + '" placeholder="D1"></td>' +
      '<td><input class="form-control" data-field="plan" value="' + escapeHtml(item.plan) + '" placeholder="城市与行程安排"></td>' +
      '<td><input class="form-control" data-field="hotel" value="' + escapeHtml(item.hotel) + '" placeholder="住宿标准"></td>' +
      '<td><input class="form-control" data-field="transport" value="' + escapeHtml(item.transport) + '" placeholder="交通/用车"></td>' +
      '<td><input class="form-control" data-field="activity" value="' + escapeHtml(item.activity) + '" placeholder="餐饮/活动"></td>' +
      '<td><button class="table-action-primary quote-row-remove" type="button" data-remove-row="itinerary">删除</button></td>' +
    '</tr>';
  }
  function paymentRow(item) {
    item = item || {};
    return '<tr data-payment-row>' +
      '<td><input class="form-control" data-field="name" value="' + escapeHtml(item.name) + '" placeholder="如：项目首款"></td>' +
      '<td><input class="form-control quote-number" data-field="ratio" inputmode="decimal" value="' + escapeHtml(item.ratio) + '" placeholder="比例"></td>' +
      '<td><input class="form-control quote-money-input" data-field="amount" inputmode="decimal" value="' + escapeHtml(item.amount) + '" placeholder="金额"></td>' +
      '<td><input class="form-control" data-field="condition" value="' + escapeHtml(item.condition) + '" placeholder="触发条件"></td>' +
      '<td><input class="form-control" data-field="planDate" value="' + escapeHtml(item.planDate) + '" placeholder="计划时点"></td>' +
      '<td><button class="table-action-primary quote-row-remove" type="button" data-remove-row="payment">删除</button></td>' +
    '</tr>';
  }
  function fileNames(id) {
    var node = byId(id);
    return node && node.files ? Array.prototype.map.call(node.files, function (file) { return file.name; }) : [];
  }
  function mergeNames(existing, added) {
    return Array.from(new Set((existing || []).concat(added || [])));
  }
  function renderAttachmentNames(id, names) {
    var node = byId(id);
    if (!node) return;
    node.innerHTML = (names || []).map(function (name) { return '<span class="drawer-attachment-chip">' + escapeHtml(name) + '</span>'; }).join('');
    node.hidden = !(names || []).length;
  }
  function ensureDrawer() {
    var existing = drawer();
    if (existing) return existing;
    document.body.insertAdjacentHTML('beforeend',
      '<div id="' + drawerId + '" class="modal-overlay drawer-overlay" aria-hidden="true">' +
        '<div class="modal drawer-modal custom-quote-drawer" role="dialog" aria-modal="true" aria-labelledby="customQuoteEditTitle">' +
          '<div class="modal-header"><div id="customQuoteEditTitle" class="modal-title">新建报价版本</div><button class="modal-close" type="button" data-close-custom-quote aria-label="关闭">×</button></div>' +
          '<div class="modal-body">' +
            '<section class="drawer-object-strip" aria-label="报价项目"><div><span>项目</span><strong id="customQuoteProject">-</strong></div><div><span>客户</span><strong id="customQuoteCustomer">-</strong></div><div><span>出行</span><strong id="customQuoteTravel">-</strong></div><div><span>销售/计调</span><strong id="customQuoteOwners">-</strong></div><div><span>需求重点</span><strong id="customQuoteRequirement">-</strong></div></section>' +
            '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">报价基础</h3></div><div class="form-grid quote-form-grid">' +
              '<div class="form-group"><label class="form-label" for="customQuoteVersion">版本号</label><input id="customQuoteVersion" class="form-control" readonly></div>' +
              '<div class="form-group"><label class="form-label" for="customQuoteName">方案名称 <span class="req">*</span></label><input id="customQuoteName" class="form-control" placeholder="如：豪华五星版"></div>' +
              '<div class="form-group"><label class="form-label" for="customQuoteType">报价类型</label><select id="customQuoteType" class="form-control"><option>首次报价</option><option>客户反馈调整</option><option>资源变动调整</option></select></div>' +
              '<div class="form-group"><label class="form-label" for="customQuoteValidDate">报价有效期 <span class="req">*</span></label><input id="customQuoteValidDate" class="form-control" type="date"></div>' +
              '<div class="form-group"><label class="form-label" for="customQuoteBasis">报价依据</label><select id="customQuoteBasis" class="form-control"><option>引用产品线路</option><option>供应商方案</option><option>手工方案</option></select></div>' +
              '<div class="form-group"><label class="form-label" for="customQuoteCurrencyTax">币种/税费口径</label><input id="customQuoteCurrencyTax" class="form-control" value="人民币含税报价"></div>' +
              '<div class="form-group"><label class="form-label" for="customQuoteOwner">报价人</label><input id="customQuoteOwner" class="form-control" readonly></div>' +
              '<div class="form-group"><label class="form-label" for="customQuoteDate">报价日期</label><input id="customQuoteDate" class="form-control" type="date" readonly></div>' +
              '<div id="customQuoteSourceGroup" class="form-group" hidden><label class="form-label" for="customQuoteSourceVersion">复制来源版本</label><input id="customQuoteSourceVersion" class="form-control" readonly></div>' +
              '<div id="customQuoteReasonGroup" class="form-group form-group-full" hidden><label class="form-label" for="customQuoteAdjustmentReason">本次调整原因 <span class="req">*</span></label><textarea id="customQuoteAdjustmentReason" class="form-control" rows="3" placeholder="填写客户反馈或资源变动原因"></textarea></div>' +
            '</div></section>' +
            '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">服务方案</h3><button class="table-action-primary" type="button" data-add-row="itinerary">新增行程</button></div>' +
              '<div class="form-grid quote-form-grid quote-service-fields"><div class="form-group"><label class="form-label" for="customQuoteRoute">引用线路/方案</label><input id="customQuoteRoute" class="form-control" placeholder="未引用产品时填写本次方案"></div><div class="form-group"><label class="form-label" for="customQuoteServiceStandard">服务标准</label><input id="customQuoteServiceStandard" class="form-control" placeholder="酒店、用车、领队、活动等"></div><div class="form-group form-group-full"><label class="form-label" for="customQuoteDifference">客户差异要求</label><textarea id="customQuoteDifference" class="form-control" rows="3" placeholder="填写与引用线路或标准方案的差异"></textarea></div></div>' +
              '<section class="table-wrap quote-edit-table" aria-label="行程安排"><table><thead><tr><th>天次</th><th>城市/行程</th><th>住宿</th><th>交通/用车</th><th>餐饮/活动</th><th>操作</th></tr></thead><tbody id="customQuoteItineraryRows"></tbody></table></section>' +
            '</section>' +
            '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">资源与成本测算</h3><button class="table-action-primary" type="button" data-add-row="cost">新增成本项</button></div>' +
              '<section class="table-wrap quote-edit-table" aria-label="成本测算"><table><thead><tr><th>成本项</th><th>供应商/来源</th><th>数量</th><th>单位</th><th>成本单价</th><th>预算成本</th><th>有效期</th><th>备注</th><th>操作</th></tr></thead><tbody id="customQuoteCostRows"></tbody></table></section>' +
            '</section>' +
            '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">对客报价</h3><button class="table-action-primary" type="button" data-add-row="price">新增报价项</button></div>' +
              '<section class="table-wrap quote-edit-table" aria-label="对客报价明细"><table><thead><tr><th>费用项</th><th>对客口径</th><th>数量</th><th>单位</th><th>客户单价</th><th>对客小计</th><th>操作</th></tr></thead><tbody id="customQuotePriceRows"></tbody></table></section>' +
              '<div class="quote-calculation-summary"><div><span>客户报价合计</span><strong id="customQuoteCustomerTotal">¥0</strong></div><div><span>预算成本合计</span><strong id="customQuoteCostTotal">¥0</strong></div><div><span>预计毛利</span><strong id="customQuoteMarginTotal">¥0 / 0.0%</strong></div></div>' +
            '</section>' +
            '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">条款与附件</h3><button class="table-action-primary" type="button" data-add-row="payment">新增付款节点</button></div><div class="form-grid quote-form-grid">' +
              '<div class="form-group form-group-full"><label class="form-label" for="customQuoteIncluded">费用包含 <span class="req">*</span></label><textarea id="customQuoteIncluded" class="form-control" rows="3" placeholder="填写本报价包含的服务"></textarea></div>' +
              '<div class="form-group form-group-full"><label class="form-label" for="customQuoteExcluded">费用不含 <span class="req">*</span></label><textarea id="customQuoteExcluded" class="form-control" rows="3" placeholder="填写不包含的费用"></textarea></div>' +
              '<div class="form-group form-group-full"><label class="form-label" for="customQuoteCancellation">取消及变更规则</label><textarea id="customQuoteCancellation" class="form-control" rows="3" placeholder="填写取消、人数或日期变更规则"></textarea></div>' +
              '<div class="form-group form-group-full"><label class="form-label" for="customQuoteAttachment">报价附件</label><input id="customQuoteAttachment" class="form-control" type="file" multiple><div id="customQuoteAttachmentList" class="drawer-attachment-list" hidden></div></div>' +
              '<div class="form-group form-group-full"><label class="form-label" for="customQuoteSupplierAttachment">供应商报价附件</label><input id="customQuoteSupplierAttachment" class="form-control" type="file" multiple><div id="customQuoteSupplierAttachmentList" class="drawer-attachment-list" hidden></div></div>' +
            '</div><section class="table-wrap quote-edit-table" aria-label="付款节点"><table><thead><tr><th>节点名称</th><th>比例</th><th>金额</th><th>触发条件</th><th>计划时点</th><th>操作</th></tr></thead><tbody id="customQuotePaymentRows"></tbody></table></section></section>' +
          '</div>' +
          '<div class="modal-footer drawer-footer-actions"><button class="btn btn-secondary" type="button" data-close-custom-quote>取消</button><button class="btn btn-secondary" type="button" data-save-custom-quote>保存草稿</button><button class="btn btn-primary" type="button" data-submit-custom-quote>提交销售确认</button></div>' +
        '</div>' +
      '</div>'
    );
    existing = drawer();
    existing.querySelectorAll('[data-close-custom-quote]').forEach(function (button) { button.addEventListener('click', function () { closeLayer(false); }); });
    existing.addEventListener('click', function (event) {
      if (event.target === existing) closeLayer(false);
      var add = event.target.closest('[data-add-row]');
      if (add) { addRow(add.getAttribute('data-add-row')); return; }
      var remove = event.target.closest('[data-remove-row]');
      if (remove) { removeRow(remove); return; }
    });
    existing.querySelector('[data-save-custom-quote]').addEventListener('click', saveDraft);
    existing.querySelector('[data-submit-custom-quote]').addEventListener('click', submitQuote);
    existing.addEventListener('input', function () { dirty = true; refreshTotals(); });
    existing.addEventListener('change', function () { dirty = true; refreshTotals(); });
    return existing;
  }
  function addRow(type) {
    var body = byId(type === 'cost' ? 'customQuoteCostRows' : type === 'price' ? 'customQuotePriceRows' : type === 'payment' ? 'customQuotePaymentRows' : 'customQuoteItineraryRows');
    if (!body) return;
    body.insertAdjacentHTML('beforeend', type === 'cost' ? costRow() : type === 'price' ? priceRow() : type === 'payment' ? paymentRow() : itineraryRow());
    dirty = true;
    refreshTotals();
  }
  function removeRow(button) {
    var row = button.closest('tr');
    if (!row) return;
    var body = row.parentNode;
    if (body.children.length === 1) {
      toast('至少保留一行，可清空未使用内容。', 'warning');
      return;
    }
    row.remove();
    dirty = true;
    refreshTotals();
  }
  function rows(selector, fields) {
    return Array.prototype.map.call(drawer().querySelectorAll(selector), function (row) {
      var result = {};
      fields.forEach(function (name) {
        var node = row.querySelector('[data-field="' + name + '"]');
        result[name] = node ? String(node.value || '').trim() : '';
      });
      return result;
    }).filter(function (item) { return Object.keys(item).some(function (key) { return item[key]; }); });
  }
  function itemTotal(row, unitField) {
    return toNumber(row.querySelector('[data-field="quantity"]').value) * toNumber(row.querySelector('[data-field="' + unitField + '"]').value);
  }
  function refreshTotals() {
    var layer = drawer();
    if (!layer) return;
    var costTotal = 0;
    Array.prototype.forEach.call(layer.querySelectorAll('[data-cost-row]'), function (row) {
      var subtotal = itemTotal(row, 'unitCost');
      costTotal += subtotal;
      var target = row.querySelector('[data-cost-total]');
      if (target) target.textContent = money(subtotal);
    });
    var priceTotal = 0;
    Array.prototype.forEach.call(layer.querySelectorAll('[data-price-row]'), function (row) {
      var subtotal = itemTotal(row, 'unitPrice');
      priceTotal += subtotal;
      var target = row.querySelector('[data-price-total]');
      if (target) target.textContent = money(subtotal);
    });
    var profit = priceTotal - costTotal;
    setText('customQuoteCustomerTotal', money(priceTotal));
    setText('customQuoteCostTotal', money(costTotal));
    setText('customQuoteMarginTotal', money(profit) + ' / ' + formatPercent(priceTotal ? profit / priceTotal : 0));
  }
  function payload(mode) {
    var costItems = rows('[data-cost-row]', ['name', 'supplier', 'quantity', 'unit', 'unitCost', 'validDate', 'note']);
    var priceItems = rows('[data-price-row]', ['name', 'basis', 'quantity', 'unit', 'unitPrice']);
    var itinerary = rows('[data-itinerary-row]', ['day', 'plan', 'hotel', 'transport', 'activity']);
    var paymentNodes = rows('[data-payment-row]', ['name', 'ratio', 'amount', 'condition', 'planDate']);
    var costTotal = costItems.reduce(function (sum, item) { return sum + toNumber(item.quantity) * toNumber(item.unitCost); }, 0);
    var quoteTotal = priceItems.reduce(function (sum, item) { return sum + toNumber(item.quantity) * toNumber(item.unitPrice); }, 0);
    var profit = quoteTotal - costTotal;
    return {
      mode: mode,
      quoteId: workingQuoteId,
      sourceQuoteId: currentContext.action === 'copy' ? quote().id : '',
      sourceVersion: currentContext.action === 'copy' ? ((quote().version || '') + ' / ' + (quote().name || '报价版本')) : quote().sourceVersion || '',
      version: resultVersion(),
      name: value('customQuoteName'),
      quoteType: value('customQuoteType'),
      adjustmentReason: value('customQuoteAdjustmentReason'),
      validDate: value('customQuoteValidDate'),
      quoteBasis: value('customQuoteBasis'),
      currencyTax: value('customQuoteCurrencyTax'),
      quoteOwner: value('customQuoteOwner'),
      quotedAt: value('customQuoteDate'),
      route: value('customQuoteRoute'),
      serviceStandard: value('customQuoteServiceStandard'),
      differenceRequirement: value('customQuoteDifference'),
      itinerary: itinerary,
      costItems: costItems,
      priceItems: priceItems,
      quoteTotal: quoteTotal,
      costTotal: costTotal,
      profit: profit,
      margin: quoteTotal ? profit / quoteTotal : 0,
      included: value('customQuoteIncluded'),
      excluded: value('customQuoteExcluded'),
      cancellation: value('customQuoteCancellation'),
      paymentNodes: paymentNodes,
      attachments: mergeNames(quote().attachments, fileNames('customQuoteAttachment')),
      supplierAttachments: mergeNames(quote().supplierAttachments, fileNames('customQuoteSupplierAttachment'))
    };
  }
  function validate(mode) {
    if (!value('customQuoteName')) { toast('请填写方案名称。', 'warning'); byId('customQuoteName').focus(); return false; }
    if (mode === 'draft') return true;
    if (!value('customQuoteValidDate')) { toast('请填写报价有效期。', 'warning'); byId('customQuoteValidDate').focus(); return false; }
    if (currentContext.action === 'copy' && !value('customQuoteAdjustmentReason')) { toast('请填写本次调整原因。', 'warning'); byId('customQuoteAdjustmentReason').focus(); return false; }
    var result = payload(mode);
    if (!result.priceItems.some(function (item) { return item.name && toNumber(item.quantity) && toNumber(item.unitPrice); })) { toast('请至少填写一条完整的对客报价项。', 'warning'); return false; }
    if (!result.costItems.some(function (item) { return item.name && toNumber(item.quantity) && toNumber(item.unitCost); })) { toast('请至少填写一条完整的成本测算项。', 'warning'); return false; }
    if (!result.included || !result.excluded) { toast('请填写费用包含和费用不含。', 'warning'); return false; }
    if (!result.paymentNodes.some(function (item) { return item.name && (item.ratio || item.amount) && item.condition; })) { toast('请至少填写一个付款节点。', 'warning'); return false; }
    return true;
  }
  function saveDraft() {
    if (!validate('draft')) return;
    dirty = false;
    if (callbacks.onSave) callbacks.onSave(payload('draft'));
    toast('报价草稿已保存。');
  }
  function submitQuote() {
    if (!validate('submit')) return;
    dirty = false;
    if (callbacks.onSubmit) callbacks.onSubmit(payload('submit'));
    closeLayer(true);
  }
  function fillRows(id, data, renderer, fallback) {
    var body = byId(id);
    if (!body) return;
    body.innerHTML = (data && data.length ? data : fallback).map(renderer).join('');
  }
  function applyContext() {
    var sourceQuote = quote();
    var isCopy = currentContext.action === 'copy';
    var isEdit = currentContext.action === 'edit';
    setText('customQuoteEditTitle', title());
    setText('customQuoteProject', currentContext.projectName || currentContext.projectNo);
    setText('customQuoteCustomer', currentContext.customer);
    setText('customQuoteTravel', [currentContext.dateText, currentContext.people ? currentContext.people + '人' : ''].filter(Boolean).join(' / '));
    setText('customQuoteOwners', [currentContext.owner || '-', currentContext.planner || '-'].join(' / '));
    setText('customQuoteRequirement', currentContext.requirement || '—');
    setValue('customQuoteVersion', resultVersion());
    setValue('customQuoteName', isEdit || isCopy ? sourceQuote.name : '');
    setValue('customQuoteType', quoteType());
    setValue('customQuoteValidDate', (isEdit || isCopy) && sourceQuote.validDate ? sourceQuote.validDate : '');
    setValue('customQuoteBasis', sourceQuote.quoteBasis || currentContext.quoteBasis || '引用产品线路');
    setValue('customQuoteCurrencyTax', sourceQuote.currencyTax || '人民币含税报价');
    setValue('customQuoteOwner', sourceQuote.quoteOwner || currentContext.planner || '');
    setValue('customQuoteDate', sourceQuote.quotedAt || currentContext.quotedAt || '2026-07-11');
    setValue('customQuoteRoute', sourceQuote.route || currentContext.route || '');
    setValue('customQuoteServiceStandard', sourceQuote.serviceStandard || currentContext.serviceStandard || '');
    setValue('customQuoteDifference', sourceQuote.differenceRequirement || currentContext.requirement || '');
    setValue('customQuoteIncluded', sourceQuote.included || '');
    setValue('customQuoteExcluded', sourceQuote.excluded || '');
    setValue('customQuoteCancellation', sourceQuote.cancellation || '');
    setValue('customQuoteAdjustmentReason', isEdit ? sourceQuote.adjustmentReason || '' : '');
    byId('customQuoteSourceGroup').hidden = !isCopy;
    byId('customQuoteReasonGroup').hidden = !(isCopy || isEdit);
    if (isCopy) setValue('customQuoteSourceVersion', (sourceQuote.version || '') + ' / ' + (sourceQuote.name || '报价版本'));
    fillRows('customQuoteItineraryRows', (isEdit || isCopy) ? sourceQuote.itinerary : null, itineraryRow, defaultItinerary());
    fillRows('customQuoteCostRows', (isEdit || isCopy) ? sourceQuote.costItems : null, costRow, defaultCostItems());
    fillRows('customQuotePriceRows', (isEdit || isCopy) ? sourceQuote.priceItems : null, priceRow, defaultPriceItems());
    fillRows('customQuotePaymentRows', (isEdit || isCopy) ? sourceQuote.paymentNodes : null, paymentRow, defaultPaymentNodes());
    var attachment = byId('customQuoteAttachment');
    if (attachment) attachment.value = '';
    var supplierAttachment = byId('customQuoteSupplierAttachment');
    if (supplierAttachment) supplierAttachment.value = '';
    renderAttachmentNames('customQuoteAttachmentList', sourceQuote.attachments || []);
    renderAttachmentNames('customQuoteSupplierAttachmentList', sourceQuote.supplierAttachments || []);
    dirty = false;
    refreshTotals();
  }
  function open(context, nextCallbacks) {
    currentContext = Object.assign({}, context || {});
    callbacks = nextCallbacks || {};
    workingQuoteId = currentContext.action === 'edit' && quote().id ? quote().id : 'quote-' + resultVersion().toLowerCase() + '-' + Date.now();
    var layer = ensureDrawer();
    applyContext();
    openLayer(layer);
  }
  window.caesarQuoteDrawer = { open: open };
})();
