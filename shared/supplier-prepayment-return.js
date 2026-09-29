/* 预付款退回三端原型：预付管理发起、供应商提交凭据、资金核对到账。 */
(function (root) {
  'use strict';
  var M = root.SupplierPrepaymentReturnModel;
  if (!M) return;
  var file = location.pathname.split('/').pop();
  var esc = function (value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]; }); };
  var cash = function (value) { return '¥' + Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var tag = function (value) {
    var color = /已到账/.test(value) ? 'green' : /部分|待|处理中/.test(value) ? 'orange' : /不可|错误/.test(value) ? 'red' : 'blue';
    return '<span class="tag tag-' + color + '">' + esc(value) + '</span>';
  };
  var line = function (main, sub) { return '<div class="table-cell-main"><strong>' + esc(main) + '</strong>' + (sub ? '<span>' + esc(sub) + '</span>' : '') + '</div>'; };
  var notify = function (message) {
    var node = document.querySelector('.spr-toast');
    if (!node) { node = document.createElement('div'); node.className = 'spr-toast'; node.setAttribute('role', 'status'); document.body.appendChild(node); }
    node.textContent = message; node.hidden = false; clearTimeout(node._timer); node._timer = setTimeout(function () { node.hidden = true; }, 2600);
  };
  var openLayer = function (layer) {
    layer._sprFocus = document.activeElement; layer.hidden = false; layer.classList.add('show'); layer.setAttribute('aria-hidden', 'false');
    var focus = layer.querySelector('input:not([disabled]), select:not([disabled]), button'); if (focus) focus.focus();
  };
  var askDiscard = function (layer, next) {
    if (!layer._sprDirty) { next(); return; }
    var confirmation = document.createElement('div'); confirmation.className = 'modal-overlay show spr-discard';
    confirmation.innerHTML = '<div class="modal modal-sm modal-confirm" role="alertdialog" aria-modal="true" aria-label="放弃修改"><div class="modal-header"><div class="modal-title">放弃修改</div></div><div class="modal-body">本次内容尚未保存，确认放弃？</div><div class="modal-footer"><button class="btn btn-secondary" data-spr-keep>继续填写</button><button class="btn btn-primary" data-spr-discard>放弃修改</button></div></div>';
    document.body.appendChild(confirmation); confirmation.querySelector('button').focus();
    confirmation.addEventListener('click', function(e) { if(e.target.closest('[data-spr-keep]')) {confirmation.remove();layer.querySelector('button').focus();} if(e.target.closest('[data-spr-discard]')) {layer._sprDirty=false;confirmation.remove();next();} });
  };
  var closeLayer = function (layer) { askDiscard(layer, function() { layer.classList.remove('show'); layer.setAttribute('aria-hidden', 'true'); setTimeout(function(){layer.hidden=true;if(layer._sprFocus)layer._sprFocus.focus();},240); }); };
  var summary = function (items) {
    return '<div class="spr-summary">' + items.map(function (item) { return '<div><span>' + esc(item[0]) + '</span><strong>' + esc(item[1]) + '</strong></div>'; }).join('') + '</div>';
  };
  var drawer = function (title) {
    var layer = document.createElement('div');
    layer.className = 'modal-overlay drawer-overlay spr-overlay'; layer.hidden = true; layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = '<div class="modal drawer-modal spr-drawer" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="modal-header"><div class="modal-title spr-title">' + esc(title) + '</div><button class="modal-close" type="button" data-spr-close aria-label="关闭">×</button></div><div class="modal-body spr-body"></div><div class="modal-footer spr-footer"></div></div>';
    document.body.appendChild(layer);
    layer.addEventListener('click', function (event) { if (event.target === layer || event.target.closest('[data-spr-close]')) { event.stopImmediatePropagation(); closeLayer(layer); } }, true);
    layer.addEventListener('keydown', function(e) {
      if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeLayer(layer);}
      if(e.key==='Tab'){var nodes=Array.from(layer.querySelectorAll('button,a,input,select,textarea')).filter(function(n){return !n.disabled&&n.offsetParent!==null;});var first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    });
    return layer;
  };
  var paymentRows = function (record, options) {
    options = options || {};
    return record.payments.map(function (payment) {
      var input = '';
      if (options.apply) input = '<input class="form-control spr-money" type="number" min="0" step="0.01" max="' + payment.available + '" aria-label="' + esc(payment.id + ' 本次退回') + '" data-spr-apply="' + esc(payment.id) + '" value="' + esc(options.defaults && options.defaults[payment.id] || '') + '" ' + (payment.available > 0 ? '' : 'disabled') + '>';
      if (options.receipt) {
        var item = (options.application || record.applications[0]), requested = item.lines.find(function (lineItem) { return lineItem.paymentId === payment.id; });
        if (!requested) return '';
        var received = item.receipts.reduce(function (total, receipt) { var found = receipt.lines.find(function (value) { return value.paymentId === payment.id; }); return total + Number(found ? found.amount : 0); }, 0);
        var remaining = Number(requested.amount) - received;
        input = options.readonly ? '—' : '<input class="form-control spr-money" type="number" min="0" max="' + remaining + '" step="0.01" data-spr-receipt="' + esc(payment.id) + '" value="' + esc(options.defaults && options.defaults[payment.id] || '') + '">';
        return '<tr><td>' + line(payment.id, payment.date + ' / 原付 ' + cash(payment.amount)) + '</td><td>' + cash(requested.amount) + '</td><td>' + cash(received) + '</td><td>' + cash(remaining) + '</td><td>' + input + '</td></tr>';
      }
      return '<tr><td>' + line(payment.id, payment.date + ' / ' + payment.state) + (payment.reference ? '<div class="spr-payment-ref">' + esc(payment.reference) + '</div>' : '') + '</td><td>' + cash(payment.amount) + '</td><td>' + cash(payment.offset) + (payment.transferred ? '<div>转出 ' + cash(payment.transferred) + '</div>' : '') + '</td><td>' + cash(payment.returned) + '</td><td>' + cash(payment.processing) + '</td><td><strong>' + cash(payment.available) + '</strong></td>' + (options.apply ? '<td>' + input + '</td>' : '') + '</tr>';
    }).join('');
  };

  function merchantPage() {
    var tbody = document.getElementById('prepaymentRows'); if (!tbody) return;
    var sessions = new Map(), sourceRows = new Map(), active = null, selectedId = null, mode = 'apply';
    var sample = M.createSession('merchant'), initial = sample.get(), sampleRow = document.createElement('tr');
    Object.assign(sampleRow.dataset, { sprPrepay: initial.id, prepayNo: initial.id, supplier: initial.supplier, company: initial.company, business: initial.business, businessNo: 'JP20260908003', prepayType: '外采预付', currency: 'CNY', prepayDate: '2026-09-18', status: '余额待处理', offset: cash(initial.totals.offset), balance: cash(initial.totals.balance), nc: '未生成', voucher: '未生成' });
    tbody.prepend(sampleRow); sessions.set(initial.id, sample); sourceRows.set(initial.id, sampleRow);
    var amount = function (value) { return Number(String(value || 0).replace(/[^\d.-]/g, '')) || 0; };
    function makeSession(row) {
      var d = row.dataset;
      if (sessions.has(d.prepayNo)) return sessions.get(d.prepayNo);
      if (d.currency !== 'CNY') return null;
      var data = M.seed(), isPeer = d.prepayNo === 'PP-DZ-003';
      Object.assign(data, { id: d.prepayNo, applicationId: 'RET-' + d.prepayNo, company: d.company, supplier: d.supplier, business: d.business, currency: d.currency, source: d.source || '同行预付款', refundAccount: d.company + ' / 工商银行 · ' + (d.company === '福建凯撒' ? '0888' : d.company === '北京凯撒' ? '0999' : '0666') + '（已核准）', applications: [], flows: [], logs: [], invoiceStatus: d.invoiceStatus || '未开票' });
      data.payments = [{ id: isPeer ? 'PAY-PP-003' : d.paymentNo, date: d.prepayDate, reference: isPeer ? 'FJ-PP-20260901-035000' : d.remittanceNo, amount: isPeer ? 35000 : amount(d.localAmount), state: '已付款', offset: isPeer ? 30000 : amount(d.offset), returned: 0, account: d.account || '原付款账户' }];
      if (isPeer) data.applications.push({ id: 'RET-DZ-003', createdAt: '2026-09-26 10:00', reason: '预付结余退回确认 TH-0926-03；双方同意退还未冲抵的5,000元', status: '待供应商退款', lines: [{ paymentId: 'PAY-PP-003', amount: 5000 }], proof: null, receipts: [] });
      // 旧备用金退回单已在资金页登记，本页保留申请，实际到账另核。
      if (d.prepayNo === 'PP-LEADER-20260625001') data.applications.push({ id: d.returnNo, createdAt: '2026-07-13 10:00', reason: d.basis, status: '待供应商退款', lines: [{ paymentId: d.paymentNo, amount: 11400 }], proof: null, receipts: [] });
      var session = M.createSession('merchant', data); sessions.set(data.id, session); sourceRows.set(data.id, row); return session;
    }
    Array.from(tbody.querySelectorAll('tr')).forEach(makeSession);
    var surface = tbody.closest('.list-surface'), tabs = document.createElement('div'), panel = document.createElement('section');
    tabs.className = 'tab-bar spr-merchant-tabs'; tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', '预付管理');
    tabs.innerHTML = '<button class="tab-item active" id="sprPrepayTab" role="tab" aria-selected="true" aria-controls="sprPrepayPanel" data-spr-tab="prepay">预付款</button><button class="tab-item" id="sprReturnTab" role="tab" aria-selected="false" aria-controls="sprReturnPanel" data-spr-tab="returns" tabindex="-1">预付退回</button>';
    surface.id = 'sprPrepayPanel'; surface.setAttribute('role', 'tabpanel'); surface.setAttribute('aria-labelledby', 'sprPrepayTab');
    panel.id = 'sprReturnPanel'; panel.className = 'list-surface spr-return-panel'; panel.hidden = true; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', 'sprReturnTab');
    surface.before(tabs); surface.after(panel);
    panel.innerHTML = '<section class="filter-card filter-card-compact"><div class="filter-row"><div class="filter-item"><input type="search" id="sprReturnSearch" placeholder="退回单/预付单/付款单/付款对象" aria-label="搜索预付退回"></div><div class="filter-item-sm"><select id="sprReturnStatus" aria-label="退回状态"><option value="">全部状态</option><option>待供应商退款</option><option>退款凭据待核对</option><option>部分到账</option><option>已到账</option><option>已撤销</option></select></div><div class="filter-item-sm"><select id="sprReturnCompany" aria-label="付款公司"><option value="">全部公司</option>' + Array.from(new Set(Array.from(sessions.values()).map(function (s) { return s.get().company; }))).map(function (v) { return '<option>' + esc(v) + '</option>'; }).join('') + '</select></div><div class="filter-actions"><button type="button" class="btn btn-secondary" data-spr-search>搜索</button><button type="button" class="btn btn-secondary" data-spr-reset>重置</button></div></div></section><div class="table-wrap spr-return-table"><table><colgroup><col style="width:270px"><col style="width:220px"><col style="width:160px"><col style="width:150px"><col style="width:170px"><col style="width:130px"><col style="width:120px"></colgroup><thead><tr><th>退回单 / 付款对象</th><th>预付单 / 付款公司</th><th>申请金额</th><th>已到账</th><th>未到账</th><th>退回状态</th><th class="sticky-action">操作</th></tr></thead><tbody id="sprReturnRows"></tbody></table></div><div class="pagination spr-return-count" aria-live="polite"></div>';
    var query = { search: '', status: '', company: '' };
    function refreshPanel() {
      var result = [];
      sessions.forEach(function (session) { var r = session.get(); r.applications.forEach(function (a) {
        var haystack = [r.id, r.supplier, r.business, a.id, a.lines.map(function (l) { return l.paymentId; }).join(' ')].join(' ').toLowerCase();
        if (query.search && !haystack.includes(query.search.toLowerCase()) || query.status && a.status !== query.status || query.company && r.company !== query.company) return;
        result.push({ record: r, item: a });
      }); });
      result.sort(function (a,b) { return b.item.createdAt.localeCompare(a.item.createdAt); });
      panel.querySelector('#sprReturnRows').innerHTML = result.map(function (entry) { var r = entry.record, a = entry.item;
        return '<tr><td>' + line(a.id, r.supplier + ' / ' + a.createdAt.slice(0,10)) + '</td><td>' + line(r.id, r.company) + '</td><td>' + cash(a.amount) + '</td><td>' + cash(a.received) + '</td><td>' + (a.status === '已撤销' ? '—' : cash(a.remaining)) + '</td><td>' + tag(a.status) + '</td><td class="sticky-action"><div class="table-action"><button type="button" class="table-action-primary" data-spr-history="' + esc(a.id) + '" data-prepay="' + esc(r.id) + '">详情</button></div></td></tr>';
      }).join('') || '<tr><td colspan="7" class="spr-empty">暂无符合条件的退回记录</td></tr>';
      panel.querySelector('.spr-return-count').textContent = '共 ' + result.length + ' 条';
    }
    function switchTab(name) {
      surface.hidden = name === 'returns'; panel.hidden = name !== 'returns';
      tabs.querySelectorAll('[data-spr-tab]').forEach(function (b) { var on = b.dataset.sprTab === name; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
      refreshPanel();
    }
    tabs.addEventListener('click', function (e) { var b = e.target.closest('[data-spr-tab]'); if (b) switchTab(b.dataset.sprTab); });
    tabs.addEventListener('keydown', function (e) { if (!['ArrowRight','ArrowLeft','Home','End'].includes(e.key)) return; e.preventDefault(); var next = e.key === 'Home' ? 'prepay' : e.key === 'End' ? 'returns' : surface.hidden ? 'prepay' : 'returns'; switchTab(next); tabs.querySelector('[data-spr-tab="' + next + '"]').focus(); });
    panel.addEventListener('click', function (e) {
      var history = e.target.closest('[data-spr-history]'); if (history) { active = sessions.get(history.dataset.prepay); selectedId = history.dataset.sprHistory; mode = 'history'; renderDrawer(); openLayer(layer); }
      if (e.target.closest('[data-spr-search]')) { query = { search: panel.querySelector('#sprReturnSearch').value.trim(), status: panel.querySelector('#sprReturnStatus').value, company: panel.querySelector('#sprReturnCompany').value }; refreshPanel(); }
      if (e.target.closest('[data-spr-reset]')) { panel.querySelectorAll('input,select').forEach(function (n) { n.value = ''; }); query = { search:'', status:'', company:'' }; refreshPanel(); }
    });
    panel.querySelector('#sprReturnSearch').addEventListener('keydown', function (e) { if (e.key === 'Enter') panel.querySelector('[data-spr-search]').click(); });
    var layer = drawer('预付款退回'), body = layer.querySelector('.spr-body'), footer = layer.querySelector('.spr-footer');
    function historyMarkup(r) {
      return '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">退回记录</h3></div>' + (r.applications.length ? '<div class="table-wrap spr-history-table"><table><thead><tr><th>退回单</th><th>申请金额</th><th>已到账</th><th>状态</th><th>操作</th></tr></thead><tbody>' + r.applications.map(function (a) { return '<tr><td>' + line(a.id, a.createdAt.slice(0,10)) + '</td><td>' + cash(a.amount) + '</td><td>' + cash(a.received) + '</td><td>' + tag(a.status) + '</td><td><button type="button" data-spr-select="' + esc(a.id) + '">详情</button></td></tr>'; }).join('') + '</tbody></table></div>' : '<p>暂无退回记录</p>') + '</section>';
    }
    function renderDrawer() {
      var r = active.get(), a = r.applications.find(function (v) { return v.id === selectedId; }), editable = mode === 'apply';
      layer._sprDirty = false;
      var title = editable ? '申请预付退回' : mode === 'history' ? '预付退回详情' : '预付款详情';layer.querySelector('.spr-title').dataset.drawerTitleLocked=title;layer.querySelector('.spr-title').textContent=title;
      var error = '<div class="spr-error" role="alert" hidden></div>';
      body.innerHTML = error + '<section class="drawer-object-card"><div class="drawer-object-title">' + esc(r.id + ' / ' + r.supplier) + '</div><div class="drawer-object-subtitle">' + esc(r.company + ' / CNY / ' + r.business) + '</div>' + summary([['成功付款', cash(r.totals.paid)], ['预付余额', cash(r.totals.balance)], ['退回处理中', cash(r.totals.processing)], ['本次可退', cash(r.totals.available)]]) + '</section>';
      if (mode !== 'history') {
        body.innerHTML += '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">原付款明细</h3></div><div class="table-wrap spr-table"><table><thead><tr><th>付款明细</th><th>已付</th><th>已冲抵</th><th>已退到账</th><th>处理中</th><th>本次可退</th>' + (editable ? '<th>本次退回</th>' : '') + '</tr></thead><tbody>' + paymentRows(r, editable ? {apply:true} : {}) + '</tbody></table></div></section>';
        if (editable) body.innerHTML += '<section class="drawer-section"><div class="form-group"><label class="form-label" for="sprReason">退回原因及业务依据 <span class="req">*</span></label><textarea id="sprReason" class="form-control" rows="3" maxlength="1000"></textarea></div><div class="form-group"><label class="form-label" for="sprApplyFiles">退回依据附件</label><input id="sprApplyFiles" class="form-control" type="file" multiple accept=".pdf,.jpg,.jpeg,.png"></div><dl class="spr-facts"><div><dt>退款收款账户</dt><dd>' + esc(r.refundAccount) + '</dd></div><div><dt>发票状态</dt><dd>' + esc(r.invoiceStatus) + '</dd></div><div><dt>申请合计</dt><dd id="sprApplyTotal">¥0.00</dd></div></dl></section>';
        body.innerHTML += historyMarkup(r);
      } else if (a) {
        body.innerHTML += '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">退回申请</h3></div>' + summary([['退回单', a.id], ['申请金额', cash(a.amount)], ['实际到账', cash(a.received)], ['退回状态', a.status]]) + '<p>' + esc(a.reason) + '</p><p>退款收款账户：' + esc(a.refundAccount || r.refundAccount) + '</p>' + (a.attachments&&a.attachments.length?'<p>依据附件：'+a.attachments.map(esc).join('、')+'</p>':'') + (a.cancelReason ? '<p>撤销原因：' + esc(a.cancelReason) + '</p>' : '') + '<div class="table-wrap spr-history-table"><table><thead><tr><th>原付款单 / 付款日期</th><th>原付金额</th><th>申请退回</th><th>已到账</th><th>未到账</th></tr></thead><tbody>' + a.lines.map(function (l) { var p=r.payments.find(function (v) {return v.id===l.paymentId;}); var received=a.receipts.reduce(function(n,v){var match=v.lines.find(function(x){return x.paymentId===l.paymentId;});return n+Number(match?match.amount:0);},0); return '<tr><td>'+line(p.id,p.date)+'</td><td>'+cash(p.amount)+'</td><td>'+cash(l.amount)+'</td><td>'+cash(received)+'</td><td>'+(a.status==='已撤销'?'—':cash(l.amount-received))+'</td></tr>'; }).join('') + '</tbody></table></div></section>';
        if (a.proof) body.innerHTML += '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">退款凭据</h3></div><p>'+esc(a.proof.reference+' / '+a.proof.date+' / '+a.proof.file)+'</p></section>';
        body.innerHTML += '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">到账记录</h3></div>' + (a.receipts.length ? '<ol class="spr-history">'+a.receipts.map(function(v){return '<li><strong>'+esc(v.flowId)+' · '+cash(v.amount)+'</strong><div>'+esc(v.date+' / '+v.basis)+'</div><div>'+v.lines.map(function(l){return esc(l.paymentId)+'：'+cash(l.amount);}).join('；')+'</div></li>';}).join('')+'</ol>' : '<p>尚未核对到账</p>') + '</section>';
        if (a.status === '待供应商退款') body.innerHTML += '<section class="drawer-section"><label class="form-label" for="sprCancelReason">撤销原因</label><input id="sprCancelReason" class="form-control" maxlength="1000" placeholder="撤销申请时必填"></section>';
      }
      footer.innerHTML = '<button class="btn btn-secondary" type="button" data-spr-close>关闭</button>' + (editable ? '<button class="btn btn-primary" type="button" data-spr-submit>提交退回申请</button>' : mode === 'history' && a ? (a.status==='待供应商退款'?'<button class="btn btn-secondary" type="button" data-spr-cancel>撤销申请</button>':'') + (a.status!=='已撤销'?'<a class="btn btn-primary" href="finance-payment-return.html'+(['RET-DZ-003','RET-PRE-20260713002'].includes(a.id)?'?returnNo='+encodeURIComponent(a.id):'')+'">付款退回</a>':'') : '');
    }
    body.addEventListener('input', function(e) { layer._sprDirty = true;var error=body.querySelector('.spr-error');if(error)error.hidden=true; if(e.target.matches('[data-spr-apply]')) { var total=Array.from(body.querySelectorAll('[data-spr-apply]')).reduce(function(n,input){return n+(Number(input.value)||0);},0); body.querySelector('#sprApplyTotal').textContent=cash(total); } });
    body.addEventListener('click', function(e) { var b=e.target.closest('[data-spr-select]'); if(b) { askDiscard(layer,function(){selectedId=b.dataset.sprSelect;mode='history';renderDrawer();}); } });
    footer.addEventListener('click', function(e) {
      var link=e.target.closest('a');if(link&&layer._sprDirty){e.preventDefault();askDiscard(layer,function(){location.href=link.href;});return;}
      try {
        if(e.target.closest('[data-spr-submit]')) { var r=active.get(); var updated=active.apply(r.version,{reason:body.querySelector('#sprReason').value,attachments:Array.from(body.querySelector('#sprApplyFiles').files).map(function(f){return f.name;}),lines:Array.from(body.querySelectorAll('[data-spr-apply]')).map(function(n){return {paymentId:n.dataset.sprApply,amount:n.value||'0'};})}); selectedId=updated.applications[0].id;mode='history';renderDrawer();refreshRows();refreshPanel();notify('退回申请已生成，待退款到账'); }
        if(e.target.closest('[data-spr-cancel]')) { active.cancel(active.get().version,{applicationId:selectedId,reason:body.querySelector('#sprCancelReason').value});renderDrawer();refreshRows();refreshPanel();notify('申请已撤销，可退金额已释放'); }
      } catch(error) { var el=body.querySelector('.spr-error');el.textContent=error.message;el.hidden=false; }
    });
    function open(row, view) {
      var session=makeSession(row);
      if (!session) { notify('外币预付退回口径待财务确认，暂不提交'); return true; }
      if (row.dataset.status === '已关闭' && view === 'apply') {notify('预付单已关闭，不能申请退回');return true;}
      active=session;selectedId=null;mode=view||'apply';renderDrawer();openLayer(layer);return true;
    }
    function refreshRows() {
      var r=sample.get(); sampleRow.dataset.offset=cash(r.totals.offset);sampleRow.dataset.balance=cash(r.totals.balance);
      sampleRow.innerHTML='<td>'+line(r.id,r.supplier)+'</td><td>外采预付</td><td>'+line('日本关西深度游','JP20260908003')+'</td><td>'+line(cash(r.totals.paid),r.payments.filter(function(p){return p.state==='已付款';}).length+'笔成功付款')+'</td><td>'+line('已冲抵 '+cash(r.totals.offset),'余额 '+cash(r.totals.balance))+'</td><td>'+line('余额待处理','可退 '+cash(r.totals.available))+'</td><td>未生成</td><td class="sticky-action"><div class="table-action"><button class="table-action-primary" type="button" data-spr-merchant>申请退回</button><button type="button" data-spr-detail>详情</button></div></td>';
      sourceRows.forEach(function(row,id){ if(row===sampleRow)return; var r=sessions.get(id).get(); row.dataset.refundOccupied=String(r.totals.processing);var cell=row.children[5];if(cell&&!r.totals.processing){var stale=cell.querySelector('[data-spr-available]');if(stale)stale.remove();}if(cell&&r.totals.processing){var old=cell.querySelector('[data-spr-available]');if(!old){old=document.createElement('span');old.dataset.sprAvailable='';old.className='spr-available';cell.appendChild(old);}old.textContent='退回占用 '+cash(r.totals.processing);} });
    }
    root.SupplierPrepaymentReturnUI={ open:open, renderRow:function(row){if(row===sampleRow){refreshRows();return true;}return false;}, guardUse:function(row,value){var s=makeSession(row);if(s && amount(value)>s.get().totals.available)throw Error('本次使用超过可用余额，请核对退回申请占用');}, syncUsage:function(row){var s=makeSession(row);if(s&&row!==sampleRow&&row.dataset.prepayNo!=='PP-DZ-003'){s.syncUsage(s.get().payments[0].id,amount(row.dataset.offset),Math.max(0,amount(row.dataset.localAmount)-amount(row.dataset.balance)-amount(row.dataset.offset)));refreshRows();}}, syncPeer:function(p){var s=sessions.get(p.id);if(s){s.syncUsage('PAY-PP-003',p.used);refreshRows();}}, available:function(id){return sessions.has(id)?sessions.get(id).get().totals.available:null;} };
    tbody.addEventListener('click',function(e){var row=e.target.closest('tr');if(!row)return;if(e.target.closest('[data-spr-merchant]'))open(row,'apply');if(e.target.closest('[data-spr-detail]'))open(row,'detail');});
    refreshRows();refreshPanel();
    if(new URLSearchParams(location.search).get('view')==='prepayment-return')switchTab('returns');
  }

  function supplierPage() {
    var app = document.querySelector('[data-reconciliation-app="supplier"]'); if (!app) return;
    var surface = app.closest('.list-surface'), session = M.createSession('supplier'), record = session.get(), layer = drawer('提交退款凭据');
    var tabs = document.createElement('div'); tabs.className = 'spr-supplier-tabs'; tabs.innerHTML = '<button class="active" type="button" data-spr-view="reconciliation">对账确认</button><button type="button" data-spr-view="return">预付款退回 <span class="tag tag-orange">1</span></button>';
    surface.parentNode.insertBefore(tabs, surface);
    var panel = document.createElement('section'); panel.className = 'list-surface spr-supplier-panel'; panel.hidden = true; surface.parentNode.insertBefore(panel, surface.nextSibling);
    function renderPanel() {
      record = session.get(); var item = record.applications[0];
      panel.innerHTML = '<div class="spr-panel-head"><div><h2>预付款退回</h2><p>只提交退款凭据；实际到账由' + esc(record.company) + '资金人员核对。</p></div></div><div class="table-wrap spr-supplier-table"><table><thead><tr><th>退回单/采购公司</th><th>预付单/付款明细</th><th>关联业务</th><th>申请金额</th><th>已到账/未到账</th><th>主状态</th><th class="sticky-action">操作</th></tr></thead><tbody><tr><td>' + line(item.id, record.company) + '</td><td>' + line(record.id, item.lines.length + '笔成功付款') + '</td><td>' + line('日本关西深度游', 'JP20260908003') + '</td><td><strong>' + cash(item.amount) + '</strong></td><td>' + line(cash(item.received), '未到账 ' + cash(item.remaining)) + '</td><td>' + tag(item.status) + '</td><td class="sticky-action"><div class="table-action"><button class="table-action-primary" type="button" data-spr-supplier>' + (item.proof ? '查看凭据' : '提交凭据') + '</button></div></td></tr></tbody></table></div>';
    }
    function renderDrawer() {
      record = session.get(); var item = record.applications[0];
      layer.querySelector('.spr-body').innerHTML = '<div class="spr-error" role="alert" hidden></div><section class="drawer-object-card"><div class="drawer-object-main"><div><div class="drawer-object-title">' + esc(item.id + ' / ' + record.company) + '</div><div class="drawer-object-subtitle">' + esc(record.id + ' / ' + record.business) + '</div></div>' + tag(item.status) + '</div>' + summary([['申请退回', cash(item.amount)], ['财务已核对到账', cash(item.received)], ['尚未到账', cash(item.remaining)], ['原付款明细', item.lines.length + '笔']]) + '</section><div class="spr-note">退款凭据只是供应商已操作的证明，不会直接减少凯撒账面的预付余额。</div><section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">退回要求</h3></div><div class="table-wrap spr-table"><table><thead><tr><th>原付款单</th><th>付款日期</th><th>申请退回</th></tr></thead><tbody>' + item.lines.map(function (requestLine) { var payment = record.payments.find(function (value) { return value.id === requestLine.paymentId; }); return '<tr><td>' + esc(payment.id) + '</td><td>' + esc(payment.date) + '</td><td><strong>' + cash(requestLine.amount) + '</strong></td></tr>'; }).join('') + '</tbody></table></div></section>' +
        (item.proof ? '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">已提交凭据</h3></div><dl class="spr-facts"><div><dt>退款交易号</dt><dd>' + esc(item.proof.reference) + '</dd></div><div><dt>退款日期</dt><dd>' + esc(item.proof.date) + '</dd></div><div><dt>退款金额</dt><dd>' + cash(item.proof.amount) + '</dd></div><div><dt>退款凭据</dt><dd>' + esc(item.proof.file) + '</dd></div></dl></section>' : '<section class="drawer-section"><div class="form-row"><div class="form-group"><label class="form-label" for="sprProofAmount">本次退款金额</label><input id="sprProofAmount" class="form-control" type="number" value="' + item.amount + '" readonly></div><div class="form-group"><label class="form-label" for="sprProofRef">退款交易号 <span class="req">*</span></label><input id="sprProofRef" class="form-control" value="SUP-REF-20260929-001"></div></div><div class="form-row"><div class="form-group"><label class="form-label" for="sprProofDate">退款日期 <span class="req">*</span></label><input id="sprProofDate" class="form-control" type="date" value="2026-09-29"></div><div class="form-group"><label class="form-label" for="sprProofFile">退款凭据 <span class="req">*</span></label><input id="sprProofFile" class="form-control" type="file" accept=".pdf,.jpg,.jpeg,.png"></div></div><div class="form-group"><label class="form-label" for="sprProofBasis">退款说明</label><textarea id="sprProofBasis" class="form-control" rows="3">已按退回要求原路退款</textarea></div></section>');
      layer.querySelector('.spr-footer').innerHTML = '<button class="btn btn-secondary" type="button" data-spr-close>关闭</button>' + (item.proof ? '' : '<button class="btn btn-primary" type="button" data-spr-proof>提交退款凭据</button>');
    }
    tabs.addEventListener('click', function (event) { var button = event.target.closest('[data-spr-view]'); if (!button) return; tabs.querySelectorAll('button').forEach(function (value) { value.classList.toggle('active', value === button); }); var returns = button.dataset.sprView === 'return'; surface.hidden = returns; panel.hidden = !returns; });
    panel.addEventListener('click', function (event) { if (event.target.closest('[data-spr-supplier]')) { renderDrawer(); openLayer(layer); } });
    layer.querySelector('.spr-footer').addEventListener('click', function (event) {
      if (!event.target.closest('[data-spr-proof]')) return;
      var body = layer.querySelector('.spr-body'), fileInput = body.querySelector('#sprProofFile'), fileValue = fileInput.files[0];
      try {
        session.submitProof(record.version, { amount: body.querySelector('#sprProofAmount').value, reference: body.querySelector('#sprProofRef').value, date: body.querySelector('#sprProofDate').value, file: fileValue && fileValue.name, basis: body.querySelector('#sprProofBasis').value });
        renderPanel(); renderDrawer(); notify('退款凭据已提交，待采购公司资金人员核对实际到账');
      } catch (error) { var target = body.querySelector('.spr-error'); target.textContent = error.message; target.hidden = false; }
    });
    renderPanel();
    if (new URLSearchParams(location.search).get('view') === 'prepayment-return') tabs.querySelector('[data-spr-view="return"]').click();
  }

  function financePage() {
    var tbody = document.getElementById('paymentReturnRows'); if (!tbody) return;
    var session = M.createSession('finance'), record = session.get(), row = document.createElement('tr'), layer = drawer('核对预付款退回到账');
    row.dataset.sprReturn = record.applicationId;
    Object.assign(row.dataset, { returnNo: record.applicationId, returnType: '预付款退回', source: '预付管理申请', flowNo: '待核对', paymentNo: record.payments[0].id, applyNo: 'FK-PP-20260918001', payableNo: '-', prepayNo: record.id, remittanceNo: '待核对', settlementNo: '-', payee: record.supplier, payeeType: record.supplierType, company: record.company, business: record.business, businessNo: 'JP20260908003', businessType: '标准团期', originalAmount: cash(13000), currency: record.currency, rate: '1.0000', localAmount: cash(13000), flowAmount: '待核对', diff: '¥0', impact: '仅到账后减少预付余额', payableImpact: '无应付影响', prepayImpact: '到账前余额不变', settlementImpact: '不依赖团期结算', voucher: '未生成', nc: '未生成', handler: '资金会计周宁', returnDate: '2026-07-29', risk: '凭据已提交，实际到账待核对', status: '退款凭据待核对' });
    tbody.prepend(row);
    var body = layer.querySelector('.spr-body'), footer = layer.querySelector('.spr-footer');
    function renderRow() {
      record = session.get(); var item = record.applications[0], last = item.receipts[item.receipts.length - 1];
      row.dataset.status = item.status === '退款凭据待核对' || item.status === '待供应商退款' ? '待到账' : item.status; row.dataset.flowNo = last ? last.flowId : '待核对'; row.dataset.flowAmount = last ? cash(last.amount) : '待核对';
      row.innerHTML = '<td>' + line(item.id, '预付款退回') + '</td><td>' + line(record.supplier, record.company) + '</td><td>' + line(record.payments[0].id, item.lines.length + '笔原付款') + '</td><td><strong>' + cash(item.amount) + '</strong></td><td>' + line(cash(item.received), '未到账 ' + cash(item.remaining)) + '</td><td>' + tag(row.dataset.status) + '</td><td class="sticky-action"><div class="table-action"><button class="table-action-primary" type="button" data-spr-finance>' + (item.status === '已到账' ? '查看到账' : '核对到账') + '</button></div></td>';
      window.SupplierFinanceUI?.onChange?.();
    }
    function defaultAllocations(item, flow) {
      var left = Number(flow ? flow.amount : 0), result = {};
      item.lines.forEach(function (requestLine) {
        var received = item.receipts.reduce(function (total, receipt) { var found = receipt.lines.find(function (value) { return value.paymentId === requestLine.paymentId; }); return total + Number(found ? found.amount : 0); }, 0);
        var amount = Math.min(left, Number(requestLine.amount) - received); result[requestLine.paymentId] = amount || ''; left -= amount;
      }); return result;
    }
    function renderDrawer() {
      record = session.get(); var item = record.applications[0], flows = record.flows.filter(function (flow) { return !flow.used; }), flow = flows[0];
      body.innerHTML = '<div class="spr-error" role="alert" hidden></div><section class="drawer-object-card"><div class="drawer-object-main"><div><div class="drawer-object-title">' + esc(item.id + ' / ' + record.supplier) + '</div><div class="drawer-object-subtitle">' + esc(record.id + ' / ' + record.company) + '</div></div>' + tag(item.status) + '</div>' + summary([['申请退回', cash(item.amount)], ['已核对到账', cash(item.received)], ['未到账', cash(item.remaining)], ['预付余额', cash(record.totals.balance)]]) + '</section><div class="spr-proof"><strong>供应商退款凭据</strong><span>' + esc(item.proof ? item.proof.reference + ' / ' + item.proof.date + ' / ' + item.proof.file : '待补齐；可凭实际银行入账核对') + '</span><em>凭据不等于到账</em></div><section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">按原付款明细核对</h3></div><div class="table-wrap spr-table"><table><thead><tr><th>原付款单</th><th>申请退回</th><th>已到账</th><th>未到账</th><th>本次到账分配</th></tr></thead><tbody>' + paymentRows(record, { receipt: true, readonly: item.status === '已到账', defaults: defaultAllocations(item, flow) }) + '</tbody></table></div></section>' +
        (item.status === '已到账' ? '<section class="drawer-section"><div class="spr-note">全部退款已核对到账。原付款仍按 ' + cash(record.totals.paid) + ' 保留，实际净支付为 ' + cash(record.totals.netPaid) + '。</div></section>' : '<section class="drawer-section"><div class="form-row"><div class="form-group"><label class="form-label" for="sprFlow">实际到账流水 <span class="req">*</span></label><select id="sprFlow" class="form-control">' + flows.map(function (value) { return '<option value="' + esc(value.id) + '">' + esc(value.id + ' / ' + cash(value.amount) + ' / ' + value.date) + '</option>'; }).join('') + '</select></div><div class="form-group"><label class="form-label" for="sprReceiptBasis">到账核对依据 <span class="req">*</span></label><input id="sprReceiptBasis" class="form-control" value="银行流水已到账，与供应商退款凭据一致"></div></div><div class="spr-note">确认后才减少预付余额和实际净支付；允许分次到账，未到账部分继续保留。</div></section>') +
        (item.receipts.length ? '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">到账记录</h3></div><ol class="spr-history">' + item.receipts.map(function (receipt) { return '<li><strong>' + esc(receipt.flowId) + '</strong><span>' + cash(receipt.amount) + ' / ' + esc(receipt.date) + '</span></li>'; }).join('') + '</ol></section>' : '');
      footer.innerHTML = '<button class="btn btn-secondary" type="button" data-spr-close>关闭</button>' + (item.status === '已到账' ? '' : '<button class="btn btn-primary" type="button" data-spr-receive>确认本次到账</button>');
      var select = body.querySelector('#sprFlow'); if (select) select.addEventListener('change', function () { var selected = record.flows.find(function (value) { return value.id === select.value; }); var defaults = defaultAllocations(item, selected); body.querySelectorAll('[data-spr-receipt]').forEach(function (input) { input.value = defaults[input.dataset.sprReceipt] || ''; }); });
    }
    tbody.addEventListener('click', function (event) { if (event.target.closest('[data-spr-finance]')) { renderDrawer(); openLayer(layer); } });
    footer.addEventListener('click', function (event) {
      if (!event.target.closest('[data-spr-receive]')) return;
      try {
        var lines = Array.from(body.querySelectorAll('[data-spr-receipt]')).map(function (input) { return { paymentId: input.dataset.sprReceipt, amount: input.value || '0' }; });
        session.confirmReceipt(record.version, { flowId: body.querySelector('#sprFlow').value, lines: lines, basis: body.querySelector('#sprReceiptBasis').value }); renderRow(); renderDrawer(); notify('实际到账已核对，预付余额已按本次到账减少');
      } catch (error) { var target = body.querySelector('.spr-error'); target.textContent = error.message; target.hidden = false; }
    });
    renderRow();
    if (new URLSearchParams(location.search).get('returnNo') === record.applicationId) setTimeout(function () { renderDrawer(); openLayer(layer); }, 0);
  }

  if (file === 'finance-prepayment-offset.html') merchantPage();
  if (file === 'settlements.html') supplierPage();
  if (file === 'finance-payment-return.html') financePage();
})(window);
