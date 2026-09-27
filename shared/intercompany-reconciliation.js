(function () {
  'use strict';
  function init() {
    const M = window.IntercompanyReconciliation, state = M.seed(), $ = id => document.getElementById(id);
    const drawer = $('icRecDrawer'), content = $('icDrawerContent'), footer = $('icDrawerFooter');
    const esc = text => String(text == null ? '' : text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const money = value => '¥' + Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const actor = () => M.companyId((window.caesarCompanyContext?.() || {}).company);
    const name = id => M.companies[id] || '当前公司未明确';
    let focusedOrder = new URLSearchParams(location.search).get('orderNo') || '', active = null, dirty = false;
    let filters = { keyword: '', counterparty: '', kind: '', status: '' };
    const sourceOf = record => state.sources.find(s => s.id === record.sourceId);
    const section = (title, body) => '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">' + esc(title) + '</h3></div>' + body + '</section>';
    const fact = (label, value) => '<div class="ic-rec-fact"><span class="ic-rec-label">' + esc(label) + '</span><span class="ic-rec-value">' + esc(value) + '</span></div>';
    const button = (action, label, primary, disabled) => '<button type="button" class="btn ' + (primary ? 'btn-primary' : 'btn-secondary') + '" data-ic-action="' + action + '"' + (disabled ? ' disabled' : '') + '>' + label + '</button>';
    const confirmed = (r, key) => r.confirmations[key] === r.version ? '已确认' : '未确认';
    function message(text, error = true) {
      $('icError').hidden = true; $('icNotice').hidden = true;
      const host = $(error ? 'icError' : 'icNotice'); host.textContent = text; host.hidden = false;
      if (text) host.scrollIntoView({ block: 'nearest' });
    }
    function renderList() {
      const me = actor(), company = (window.caesarCompanyContext?.() || {}).company;
      $('icCompany').textContent = M.companies[me] || company || '未明确';
      $('icCreate').disabled = !me;
      const select = $('icCounterparty'), old = select.value;
      select.innerHTML = '<option value="">全部交易对方</option>' + Object.keys(M.companies).filter(k => k !== me).map(k => '<option value="' + k + '">' + esc(name(k)) + '</option>').join('');
      select.value = old;
      const list = state.records.filter(r => {
        const s = sourceOf(r);
        return M.party(s, me) && (!focusedOrder || s.order === focusedOrder) && (!filters.keyword || (r.id + ' ' + s.order).toLowerCase().includes(filters.keyword.toLowerCase())) && (!filters.counterparty || (s.payer === me ? s.payee : s.payer) === filters.counterparty) && (!filters.kind || s.kind === filters.kind) && (!filters.status || r.phase === filters.status);
      });
      $('icOrderScope').hidden = !focusedOrder;
      if (focusedOrder) {
        const s = state.sources.find(s => s.order === focusedOrder && M.party(s, me));
        $('icOrderScope').textContent = '关联订单：' + focusedOrder + '。' + (!s ? '当前公司没有可承接的集团内结算依据。' : M.eligibility(s) ? M.eligibility(s) + '，暂不能发起对账。' : !list.length ? '尚无对账单，可从已确认结算依据发起。' : '仅显示本单公司间对账。') + ' 重置可查看全部。';
      }
      $('icRows').innerHTML = list.length ? list.map(r => {
        const s = sourceOf(r), v = M.view(s, r, me), cashDiff = Math.round((s.payerPaid - s.payeeReceived) * 100) / 100;
        const editable = !['confirmed', 'void'].includes(r.phase) && (r.phase !== 'draft' || r.creator === me);
        const color = r.phase === 'confirmed' ? 'tag-green' : r.phase === 'disputed' ? 'tag-orange' : r.phase === 'pending' ? 'tag-blue' : 'tag-gray';
        return '<tr data-record="' + r.id + '"><td><strong>' + esc(r.id) + '</strong><span class="ic-rec-line">订单 ' + esc(s.order) + '</span></td><td>' + esc(name(v.other)) + '<span class="ic-rec-line">' + esc(v.relation) + '</span></td>' +
          '<td><span class="ic-rec-money">' + money(v.amount) + '</span><span class="ic-rec-line">人民币</span></td>' +
          '<td><span class="ic-rec-line ic-rec-money">已' + v.direction + ' ' + money(v.actual) + '</span><span class="ic-rec-line ic-rec-money">未' + v.direction + ' ' + money(v.remaining) + '</span></td>' +
          '<td><span class="ic-rec-money ' + (v.difference ? 'ic-rec-danger' : '') + '">' + money(v.difference) + '</span>' + (cashDiff ? '<span class="ic-rec-line ic-rec-danger">收付记录不一致</span>' : '') + '</td>' +
          '<td><span class="ic-rec-line">我方：' + confirmed(r, me) + '</span><span class="ic-rec-line">对方：' + confirmed(r, v.other) + '</span></td>' +
          '<td><span class="tag ' + color + '">' + M.statuses[r.phase] + '</span></td><td class="sticky-action"><div class="table-action"><button class="table-action-primary" type="button" data-ic-record="' + r.id + '">' + (editable ? '核对' : '详情') + '</button></div></td></tr>';
      }).join('') : '<tr><td colspan="8" class="ic-rec-empty">' + (!me ? '当前公司没有可查看的集团内对账记录' : focusedOrder ? '本订单暂无公司间对账记录' : '当前条件下暂无公司间对账记录') + '</td></tr>';
      $('icCount').textContent = '共 ' + list.length + ' 条对账单';
    }
    function open() { $('icError').hidden = true; $('icNotice').hidden = true; window.caesarUI.openLayer(drawer); }
    function close(force) {
      if (!force && dirty && !window.confirm('核对内容尚未保存，确定放弃修改并关闭？')) return;
      dirty = false; active = null; content.innerHTML = ''; footer.innerHTML = ''; window.caesarUI.closeLayer(drawer);
    }
    function createDrawer() {
      const me = actor(); if (!me) return;
      active = { mode: 'create', actor: me }; dirty = false;
      $('icDrawerTitle').textContent = '发起公司间对账';
      const sources = state.sources.filter(s => M.party(s, me) && (!focusedOrder || s.order === focusedOrder));
      const options = sources.map(s => {
        const exists = state.records.find(r => r.sourceId === s.id && r.phase !== 'void');
        const invalid = M.eligibility(s) || (exists ? '已有对账单 ' + exists.id : '');
        const other = s.payer === me ? s.payee : s.payer;
        return '<label class="ic-rec-choice"><input type="radio" name="icSource" value="' + s.id + '"' + (invalid ? ' disabled' : '') + '><span><strong>' + esc(s.order) + ' · ' + esc(M.kinds[s.kind]) + '</strong><span class="ic-rec-line">' + esc(s.product) + ' · ' + esc(name(other)) + '</span><span class="ic-rec-line">' + (invalid ? esc(invalid) : '结算金额 ' + money(M.total(s)) + '；' + esc(s.evidence)) + '</span></span></label>';
      }).join('');
      content.innerHTML = section('选择结算依据', '<p class="ic-rec-evidence">仅承接不同集团公司之间已确认的采购／供货、代收或佣金结算依据。</p>' + (options || '<p>没有可承接的集团内结算依据。</p>'));
      footer.innerHTML = button('close', '取消') + button('create', '生成草稿', true, true);
      open();
    }
    function detail(id) {
      const r = state.records.find(r => r.id === id), me = actor(), s = r && sourceOf(r);
      if (!s || !M.party(s, me)) return;
      const v = M.view(s, r, me), editable = !['confirmed', 'void'].includes(r.phase) && (r.phase !== 'draft' || r.creator === me);
      active = { mode: 'detail', id, version: r.version, actor: me }; dirty = false;
      $('icDrawerTitle').textContent = editable ? '核对公司间账单' : '查看公司间账单';
      const orderLink = ['KSIC260901', 'KSIC260902'].includes(s.order) ? '<p class="ic-rec-evidence"><a href="../sales/orders-detail.html?orderNo=' + encodeURIComponent(s.order) + '">查看关联销售订单</a></p>' : '';
      const base = section('对账信息', '<div class="ic-rec-facts">' + fact('对账单', r.id) + fact('对账状态', M.statuses[r.phase] + ' · 第' + r.version + '次核对') + fact('我方主体', name(me)) + fact('交易对方', name(v.other)) + fact('结算关系', v.relation) + fact('关联订单', s.order) + fact('产品／团期', s.product + ' / ' + s.schedule) + fact('结算方向', name(s.payer) + ' 付款给 ' + name(s.payee)) + '</div>' + orderLink);
      const amount = section('结算金额与增减项', '<div class="ic-rec-amounts">' + fact('原结算金额', money(s.base)) + fact('增加项', '+ ' + money(s.increase)) + fact('减少项', '－ ' + money(s.decrease)) + fact('结算金额（人民币）', money(v.amount)) + '</div><p class="ic-rec-evidence">依据：' + esc(s.evidence) + '</p>');
      const sides = [me, v.other].map(k => {
        const side = M.view(s, r, k);
        return '<div class="ic-rec-party"><h4>' + (k === me ? '我方 · ' : '对方 · ') + esc(name(k)) + '</h4><div class="ic-rec-facts">' + fact('核对金额', money(r.claims[k])) + fact('确认状态', confirmed(r, k)) + fact('已' + side.direction, money(side.actual)) + fact('未' + side.direction, money(side.remaining)) + '</div></div>';
      }).join('');
      const reasons = M.blockers(s, r);
      const compare = section('双方核对', '<div class="ic-rec-parties">' + sides + '</div><p class="ic-rec-evidence">金额差异（我方－对方）：<strong class="ic-rec-money' + (v.difference ? ' ic-rec-danger' : '') + '">' + money(v.difference) + '</strong>；收付记录差异（已付－已收）：' + money((Math.round(s.payerPaid * 100) - Math.round(s.payeeReceived * 100)) / 100) + '。</p>' + (reasons.length ? '<div class="ic-rec-alert">' + reasons.map(esc).join('；') + '。</div>' : '') + '<p class="ic-rec-evidence">已收／已付只计本结算关系的公司间款项。客户付款不等于公司间付款；双方确认也不代表未收／未付已经结清。</p>');
      const edit = editable ? section('本方核对', '<div class="ic-rec-edit"><label><span class="ic-rec-label">我方核对金额（元）</span><input id="icClaim" type="number" min="0" step="0.01" value="' + r.claims[me].toFixed(2) + '"></label><label><span class="ic-rec-label">调整原因／核对依据</span><textarea id="icReason" maxlength="500" placeholder="金额需要调整时填写原因和依据"></textarea></label></div><p class="ic-rec-evidence">仅更正我方核对金额。结算金额及增减项在原业务依据中处理；保存更改后双方需重新确认。</p>') : '';
      const history = section('处理记录', '<ol class="ic-rec-history">' + r.history.map(h => '<li><strong>' + esc(h.action) + '</strong> · ' + esc(name(h.actor)) + ' · 第' + h.version + '次核对<span class="ic-rec-line">' + esc(h.time) + '</span><div>' + esc(h.note) + '</div>' + (h.previous ? '<details><summary>查看修改前双方记录</summary><div>' + esc(Object.keys(h.previous.claims).map(k => name(k) + '：' + money(h.previous.claims[k]) + '，' + (h.previous.confirmations[k] === h.previous.version ? '已确认' : '未确认')).join('；')) + '</div></details>' : '') + '</li>').join('') + '</ol>');
      content.innerHTML = base + amount + compare + edit + history;
      footer.innerHTML = button('close', '关闭') + (editable ? button('save', '保存核对', false, true) + (r.phase === 'draft' ? button('void', '作废草稿') + button('submit', '提交对账', true) : button('confirm', confirmed(r, me) === '已确认' ? '我方已确认' : '确认我方', true, !!reasons.length || confirmed(r, me) === '已确认')) : '');
      open();
    }
    $('icCreate').addEventListener('click', createDrawer);
    $('icRows').addEventListener('click', event => { const trigger = event.target.closest('[data-ic-record]'); if (trigger) detail(trigger.dataset.icRecord); });
    $('icSearch').addEventListener('click', () => { filters = { keyword: $('icKeyword').value.trim(), counterparty: $('icCounterparty').value, kind: $('icKind').value, status: $('icStatus').value }; renderList();
    });
    $('icKeyword').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); $('icSearch').click(); } });
    $('icReset').addEventListener('click', () => {
      ['icKeyword', 'icCounterparty', 'icKind', 'icStatus'].forEach(id => { $(id).value = ''; }); focusedOrder = ''; filters = { keyword: '', counterparty: '', kind: '', status: '' };
      const url = new URL(location.href); url.searchParams.delete('orderNo'); url.searchParams.delete('from'); history.replaceState(null, '', url); renderList();
    });
    drawer.addEventListener('change', event => {
      if (event.target.name === 'icSource') footer.querySelector('[data-ic-action=create]').disabled = !content.querySelector('[name=icSource]:checked:not(:disabled)');
    });
    drawer.addEventListener('input', event => {
      if (event.target.matches('#icClaim,#icReason')) {
        dirty = true;
        const save = footer.querySelector('[data-ic-action=save]'); if (save) save.disabled = false;
      }
    });
    drawer.addEventListener('click', event => {
      const trigger = event.target.closest('[data-ic-action]'); if (!trigger || trigger.disabled) return;
      const action = trigger.dataset.icAction;
      if (action === 'close') { close(); return; }
      if (!active || active.actor !== actor()) { close(true); renderList(); return; }
      try {
        if (action === 'create') {
          const selected = content.querySelector('[name=icSource]:checked:not(:disabled)'); if (!selected) throw Error('请选择可承接的结算依据');
          const r = M.create(state, selected.value, actor()); renderList(); detail(r.id); message('已建立草稿，请核对金额后提交。', false); return;
        }
        if (active.mode !== 'detail') return;
        if (action !== 'save' && dirty) throw Error('请先保存核对修改，或关闭后重新打开');
        const { id, version } = active;
        if (action === 'save') M.update(state, id, actor(), version, $('icClaim').value, $('icReason').value);
        else if (action === 'submit') M.submit(state, id, actor(), version);
        else if (action === 'confirm') M.confirm(state, id, actor(), version);
        else if (action === 'void') { if (!window.confirm('确定作废本对账草稿？')) return; M.voidDraft(state, id, actor(), version); }
        else return;
        renderList(); detail(id);
        message(action === 'save' ? '本方核对金额已保存，双方需重新确认本次金额。' : action === 'confirm' ? '我方确认已记录；未收／未付继续由收付款业务办理。' : action === 'submit' ? '已提交，等待双方分别核对确认。' : '草稿已作废。', false);
      } catch (error) { message(error.message); }
    });
    // 先于共享抽屉关闭处理未保存内容；切换公司则立即清除旧公司的表单。
    drawer.addEventListener('click', event => {
      if (event.target === drawer || event.target.closest('[data-ic-close]')) { event.preventDefault(); event.stopImmediatePropagation(); close(); }
    }, true);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !drawer.hidden) { event.preventDefault(); event.stopImmediatePropagation(); close(); }
    }, true);
    window.addEventListener('caesar-company-change', () => { if (!drawer.hidden) close(true); filters.counterparty = ''; $('icCounterparty').value = ''; renderList(); });
    renderList();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
