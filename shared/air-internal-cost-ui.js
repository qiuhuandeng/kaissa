(function () {
  'use strict';
  const root = document.getElementById('air-internal-cost-app'), M = window.AirInternalCost, B = window.AirBusiness;
  if (!root || !M || !B) return;
  const q = new URLSearchParams(location.search);
  let db = M.load(), business = B.load(), role = 'superadmin', keyword = q.get('group') || '', status = '', selected = null, dirty = false, opener, confirmation;
  const E = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n, c) => n === null ? '尚未确认' : (c === 'CNY' ? '¥' : c + ' ') + Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const line = (x, weak = false) => '<span class="aic-line' + (weak ? ' aic-muted' : '') + '">' + E(x) + '</span>';
  const button = (label, action, primary = false, id = '') => '<button type="button" class="btn ' + (primary ? 'btn-primary' : 'btn-secondary') + '" data-aic="' + action + '" data-id="' + E(id) + '">' + label + '</button>';
  const sourceLink = (id, label = '查看航服原单') => '<a class="link-primary" href="../finance/air-settlement.html?id=' + encodeURIComponent(id) + '">' + label + '</a>';
  const section = (title, content) => '<section class="aic-section"><h3>' + title + '</h3>' + content + '</section>';
  const facts = rows => '<dl class="aic-facts">' + rows.map(([k, v]) => '<div><dt>' + k + '</dt><dd>' + E(v) + '</dd></div>').join('') + '</dl>';
  const layer = document.createElement('div');
  layer.className = 'aic-layers';
  layer.innerHTML = '<div id="aic-drawer" class="modal-overlay drawer-overlay" data-static="true" data-drawer-title-ready="true" aria-hidden="true"><div class="modal drawer-modal aic-drawer" role="dialog" aria-modal="true" aria-labelledby="aic-title"><div class="modal-header"><h2 id="aic-title" class="modal-title">内部供票费用</h2><button type="button" class="modal-close" data-layer-close-ready="true" data-aic="close" aria-label="关闭费用抽屉">×</button></div><div class="modal-body"><div id="aic-error" role="alert" class="aic-error" hidden></div><div id="aic-body"></div></div><div class="modal-footer" id="aic-footer"></div></div></div><div id="aic-confirm" class="modal-overlay" data-static="true" aria-hidden="true"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="aic-confirm-title"><div class="modal-header"><h2 id="aic-confirm-title" class="modal-title">放弃未保存内容</h2></div><div class="modal-body">当前核对内容尚未保存，确认离开吗？</div><div class="modal-footer">' + button('继续填写', 'stay') + button('放弃并离开', 'leave', true) + '</div></div></div>';
  document.body.append(layer);
  const $ = s => layer.querySelector(s);
  function rows() {
    business = B.load();
    return business.settlements.filter(M.eligible).filter(s => role === 'superadmin' || s.customer === M.roles[role].company || s.company === M.roles[role].company).map(s => {
      try { const src = M.source(business, s.id); return { src, v: M.view(db, src) }; }
      catch (e) { return { src: s, v: { state: '来源待核对', amount: M.receipt(db, s.id)?.accepted?.amount || 0, delta: null }, error: e.message }; }
    });
  }
  function render() {
    const all = rows(), filtered = all.filter(({ src, v }) => [src.id, src.group, src.customer].join(' ').includes(keyword) && (!status || v.state === status));
    root.innerHTML = '<div class="aic-toolbar"><div class="aic-search"><input id="aic-keyword" type="search" aria-label="供票结算单或团号" placeholder="供票结算单 / 团号" value="' + E(keyword) + '"><select id="aic-status" aria-label="费用接收状态"><option value="">全部状态</option>' + ['航服待确认', '待接收', '待复核', '已拒绝', '已接收', '来源待核对'].map(s => '<option' + (s === status ? ' selected' : '') + '>' + s + '</option>').join('') + '</select>' + button('查询', 'search') + button('重置', 'reset') + '</div></div>' +
      '<div id="aic-notice" role="status" class="aic-notice" hidden></div><div class="table-wrap aic-table-wrap" tabindex="0" aria-label="内部供票费用列表"><table class="aic-table"><colgroup><col><col style="width:180px"><col style="width:150px"><col style="width:150px"><col style="width:145px"><col style="width:110px"><col class="aic-action-col"></colgroup><thead><tr><th>团号 / 航服结算单</th><th>费用接收公司</th><th>已确认供票额</th><th>已接收成本</th><th>待核对增减</th><th>接收状态</th><th class="aic-actions">操作</th></tr></thead><tbody>' + filtered.map(({ src, v, error }) => '<tr><td>' + line(src.group) + line(src.id, true) + '</td><td>' + E(src.customer) + '</td><td>' + money(error ? null : src.amount, src.currency) + '</td><td>' + money(v.amount, src.currency) + '</td><td class="' + (v.delta ? 'aic-difference' : '') + '">' + money(v.delta, src.currency) + '</td><td><span class="tag ' + (v.state === '已接收' ? 'tag-green' : v.state === '已拒绝' || error ? 'tag-red' : 'tag-orange') + '">' + v.state + '</span></td><td class="aic-actions">' + button(M.roles[role].write && ['待接收', '待复核', '已拒绝'].includes(v.state) ? '办理' : '详情', 'open', false, src.id) + '</td></tr>').join('') + '</tbody></table>' + (filtered.length ? '' : '<p class="aic-empty">当前公司或筛选范围暂无内部供票费用</p>') + '</div><p class="aic-caption">共 ' + filtered.length + ' 笔。接收金额来自航服已确认结算；同笔费用在这里接收、调整及反查。</p>';
  }
  function fail(message) { $('#aic-error').textContent = message; $('#aic-error').hidden = false; $('#aic-error').scrollIntoView({ block: 'nearest' }); }
  function open(id) {
    const item = rows().find(r => r.src.id === id); if (!item) throw Error('该费用不在当前公司范围');
    const { src, v, error } = item; M.access(src, role);
    selected = item; opener = document.activeElement; dirty = false;
    $('#aic-title').textContent = '内部供票费用 · ' + v.state;
    const accepted = v.accepted;
    let content = facts([['团号', src.group], ['费用接收公司', src.customer], ['航服结算单', src.id], ['币种', src.currency]]);
    if (error) content += '<p class="aic-error">' + E(error) + '</p>';
    else if (!src.ready) content += section('待确认供票报价', facts([['预计供票金额', money(src.quote?.amount ?? null, src.currency)], ['确认情况', '航服结算尚未审批确认']]) + '<div class="table-wrap"><table><thead><tr><th>航服订单</th><th>预计供票金额</th><th>报价依据</th></tr></thead><tbody>' + (src.quote?.lines||[]).map(l=>'<tr><td><a class="link-primary" href="air-order-detail.html?id='+encodeURIComponent(l.orderId)+'">'+E(l.orderId)+'</a></td><td>'+money(l.amount,src.currency)+'</td><td>'+E(l.basis)+'</td></tr>').join('') + '</tbody></table></div><p class="aic-muted">预计金额供本团核对，尚未计入已接收成本；确认结算后再办理接收。</p>');
    else content += section('本笔成本核对', '<div class="aic-amounts"><div><span>已确认供票额</span><strong>' + money(src.amount, src.currency) + '</strong></div><div><span>团期已接收</span><strong>' + money(v.amount, src.currency) + '</strong></div><div><span>本次增减</span><strong class="' + (v.delta ? 'aic-difference' : '') + '">' + money(v.delta, src.currency) + '</strong></div></div><p class="aic-muted">接收后本笔成本为 ' + money(src.amount, src.currency) + '。航服外部采购 ' + money(src.externalCost, src.currency) + ' 仅供核对，不再叠加为本团成本。</p>' + (src.note ? '<p class="aic-notice">' + E(src.note) + '</p>' : '') + (v.rejected ? '<p class="aic-error">拒绝原因：' + E(v.rejected.note) + '。原已接收金额保留。</p>' : '')) +
      section('已确认来源', '<div class="aic-source-records">' + src.parts.map(p => '<div>' + sourceLink(p.id, p.id) + line(p.kind + ' · 第' + p.version + '版 · ' + p.period) + line(money(p.amount, src.currency) + ' · ' + p.by + ' · ' + p.at, true) + '</div>').join('') + '</div>') +
      section('结算明细', '<div class="table-wrap"><table><thead><tr><th>订单 / 结算依据</th><th>产品端费用</th><th>航服外部采购</th></tr></thead><tbody>' + src.lines.map(l => '<tr><td>' + line(l.orderId) + line(l.basis, true) + '</td><td>' + money(l.sale, src.currency) + '</td><td>' + money(l.cost, src.currency) + '</td></tr>').join('') + '</tbody></table></div>');
    if (accepted) content += section('已接收成本记录', facts([['成本来源', '航服供票 · 原单接收'], ['当前成本', money(accepted.amount, accepted.currency)], ['接收版本', accepted.parts.map(p => p.id + ' 第' + p.version + '版').join('；')]]) + '<p class="aic-muted">本笔金额只通过原结算确认及接收调整，不能手工编辑或另录一笔。</p>');
    content += section('差异与财务承接', '<div class="aic-related">' + sourceLink(src.id, '返回航服原单核对') + '<a class="link-primary" href="../finance/air-reconciliation.html?kind=' + encodeURIComponent('内部供票') + '">内部供票对账</a></div><p class="aic-muted">金额或归属不符时拒绝接收，说明差异并回原单处理。法人关系和核算归属待确认；接收费用不代表财务已确认双方应收应付。</p>');
    const can = !error && src.ready && M.roles[role].write && v.state !== '已接收';
    if (can) content += section('本次办理', '<label class="aic-field">核对依据 / 拒绝原因<textarea id="aic-note" rows="3" placeholder="填写核对依据；拒绝时说明金额、团号或资料差异">已核对本团供票结算及金额（演示）</textarea></label><label class="aic-check"><input id="aic-checked" type="checkbox">已核对本团、供票金额及确认版本；接收后本笔成本为 ' + money(src.amount, src.currency) + '</label>');
    content += section('接收与拒绝记录', v.history?.length ? '<ol class="aic-history">' + v.history.map(h => '<li>' + line(h.decision + ' · ' + h.by + ' · ' + h.at) + line('原成本 ' + money(h.before, h.currency) + ' / 供票额 ' + money(h.sourceAmount, h.currency) + ' / ' + (h.decision === '接收' ? '确认增减 ' : '未应用增减 ') + money(h.delta, h.currency), true) + line(h.note) + '</li>').join('') + '</ol>' : '<p class="aic-muted">暂无办理记录</p>');
    $('#aic-body').innerHTML = content; $('#aic-error').hidden = true;
    $('#aic-footer').innerHTML = button('关闭', 'close') + (can ? (v.state !== '已拒绝' ? button('拒绝接收', 'reject') : '') + button(v.accepted ? '确认调整' : '确认接收', 'accept', true) : '');
    $('#aic-drawer').classList.add('show'); $('#aic-drawer').setAttribute('aria-hidden', 'false');
    $('#aic-drawer .modal-close').focus();
  }
  function leave(fn) { if (!dirty) return fn(); confirmation = fn; $('#aic-confirm').classList.add('show'); $('#aic-confirm').setAttribute('aria-hidden', 'false'); $('#aic-confirm button').focus(); }
  function close() { $('#aic-drawer').classList.remove('show'); $('#aic-drawer').setAttribute('aria-hidden', 'true'); dirty = false; selected = null; opener?.focus(); }
  function decide(decision) {
    if (decision === '接收' && !$('#aic-checked').checked) throw Error('请先勾选确认本团、供票金额及版本');
    const next = M.copy(db), id = selected.src.id;
    M.decide(next, B.load(), id, selected.src.stamp, decision, $('#aic-note').value, role);
    if (!M.save(next)) throw Error('接收记录未能保存，请保留当前内容后重试');
    db = next; dirty = false; close(); render(); open(id);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-aic]'); if (!b) return;
    e.preventDefault();
    try {
      switch (b.dataset.aic) {
        case 'search': keyword = root.querySelector('#aic-keyword').value.trim(); status = root.querySelector('#aic-status').value; render(); break;
        case 'reset': keyword = ''; status = ''; render(); break;
        case 'open': open(b.dataset.id); break;
        case 'close': leave(close); break;
        case 'accept': decide('接收'); break;
        case 'reject': decide('拒绝'); break;
        case 'stay': $('#aic-confirm').classList.remove('show'); $('#aic-confirm').setAttribute('aria-hidden', 'true'); $('#aic-note')?.focus(); break;
        case 'leave': $('#aic-confirm').classList.remove('show'); $('#aic-confirm').setAttribute('aria-hidden', 'true'); dirty = false; confirmation?.(); break;
      }
    } catch (e) { if (selected) fail(e.message); else { const n = root.querySelector('#aic-notice'); n.textContent = e.message; n.hidden = false; } }
  });
  layer.addEventListener('input', () => dirty = true);
  layer.addEventListener('change', () => dirty = true);
  document.addEventListener('click', e => { const a = e.target.closest('a[href]'); if (!a || !dirty) return; e.preventDefault(); e.stopImmediatePropagation(); leave(() => { dirty = false; location.href = a.href; }); }, true);
  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  layer.addEventListener('click', e => { if (e.target === $('#aic-drawer')) leave(close); });
  document.addEventListener('keydown', e => {
    const d = $('#aic-confirm').classList.contains('show') ? $('#aic-confirm') : $('#aic-drawer').classList.contains('show') ? $('#aic-drawer') : null;
    if (!d) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); if (d.id === 'aic-confirm') { d.classList.remove('show'); d.setAttribute('aria-hidden', 'true'); } else leave(close); }
    if (e.key === 'Tab') { const a = [...d.querySelectorAll('button,input,textarea,a[href]')].filter(x => !x.disabled && x.offsetParent !== null); if (e.shiftKey && document.activeElement === a[0]) { e.preventDefault(); a.at(-1)?.focus(); } else if (!e.shiftKey && document.activeElement === a.at(-1)) { e.preventDefault(); a[0]?.focus(); } }
  }, true);
  render();
  if (q.get('tab') === 'internal-air' && q.get('supply')) { try { open(q.get('supply')); } catch (e) { const n = root.querySelector('#aic-notice'); n.textContent = e.message; n.hidden = false; } }
})();
