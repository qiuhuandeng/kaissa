(function () {
  'use strict';
  const root = document.querySelector('[data-fund-accounts]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  const M = window.CaesarFundAccounts, state = M.create();
  const titles = { company: '公司账户', merchant: '支付商户', store: '门店收付款资料', requests: '变更申请' };
  const labels = { name: '名称', company: '所属公司', holder: '账户／商户户名', number: '账号／商户号', bank: '开户行', currency: '币种', provider: '支付机构', channels: '支付渠道', settlement: '商户结算账户', uses: '用途', scope: '可使用门店', proof: '核验资料', status: '使用状态' };
  let tab = 'company', keyword = '', status = '', company = '', dirty = false, timer, focusBefore, editing;
  const e = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const show = (key, value) => key === 'settlement' ? M.label(state, value) : Array.isArray(value) ? value.join('、') : value || '—';
  const btn = (title, action, id, primary) => '<button type="button" class="' + (primary ? 'btn btn-primary' : 'table-link') + '" data-fa-action="' + action + '" data-id="' + e(id || '') + '">' + title + '</button>';
  const link = (title, href) => '<a class="table-link" href="' + e(href) + '">' + title + '</a>';
  const badge = text => '<span class="tag ' + (text === '正常' || text === '已生效' ? 'tag-green' : text === '停用' || text === '已撤回' ? 'tag-gray' : 'tag-orange') + '">' + e(text) + '</span>';
  const table = (heads, rows, cls) => '<div class="fa-table"><table class="' + (cls || '') + '"><thead><tr>' + heads.map(x => '<th>' + x + '</th>').join('') + '</tr></thead><tbody>' + (rows.join('') || '<tr><td colspan="' + heads.length + '" class="fa-empty">暂无符合条件的记录</td></tr>') + '</tbody></table></div>';
  const grid = entries => '<dl class="fa-grid">' + entries.map(([k, v]) => '<div><dt>' + e(k) + '</dt><dd>' + e(v || '—') + '</dd></div>').join('') + '</dl>';
  function input(label, name, value, options, type) {
    return '<label class="fa-field"><span>' + label + '</span>' + (options ? '<select name="' + name + '">' + options.map(x => { const [v, t] = Array.isArray(x) ? x : [x, x]; return '<option value="' + e(v) + '"' + (v === value ? ' selected' : '') + '>' + e(t) + '</option>'; }).join('') + '</select>' : type === 'textarea' ? '<textarea name="' + name + '" rows="3">' + e(value) + '</textarea>' : '<input name="' + name + '" type="' + (type || 'text') + '" value="' + e(value) + '">') + '</label>';
  }
  const checks = (label, name, values, options) => '<fieldset class="fa-checks"><legend>' + label + '</legend>' + options.map(x => '<label><input type="checkbox" name="' + name + '" value="' + e(x) + '"' + (values.includes(x) ? ' checked' : '') + '> ' + e(x) + '</label>').join('') + '</fieldset>';
  document.getElementById('fundAccountDrawer')?.remove();
  const layer = document.createElement('div'); layer.id = 'fundAccountDrawer'; layer.className = 'modal-overlay drawer-overlay fa-layer'; layer.dataset.static = 'true'; layer.hidden = true; document.body.appendChild(layer);
  function open(title, body, footer, form) {
    clearTimeout(timer); layer.classList.remove('closing'); focusBefore = document.activeElement;
    layer.innerHTML = '<div class="modal drawer-modal" role="dialog" aria-modal="true" aria-labelledby="faTitle"><div class="modal-header"><h2 class="modal-title" id="faTitle">' + e(title) + '</h2>' + btn('×', 'close') + '</div><' + (form ? 'form' : 'div') + ' class="modal-body">' + body + '</' + (form ? 'form' : 'div') + '><p class="fa-error" role="alert" hidden></p><div class="modal-footer">' + btn('关闭', 'close') + (footer || '') + '</div></div>';
    dirty = false; window.caesarUI.openLayer(layer); setTimeout(() => layer.querySelector('input,select,button')?.focus(), 0);
  }
  function close(force) { if (dirty && !force && !confirm('当前内容未保存，确认离开吗？')) return; layer.classList.remove('show'); layer.classList.add('closing'); layer.setAttribute('aria-hidden', 'true'); timer = setTimeout(() => { layer.hidden = true; layer.classList.remove('closing'); }, 360); dirty = false; focusBefore?.focus(); }
  const error = text => { const el = layer.querySelector('.fa-error'); if (el) { el.textContent = text; el.hidden = false; } else window.caesarUI.toast(text); };
  function pending(id) { return state.requests.find(r => r.rowId === id && ['草稿', '审批中', '待生效'].includes(r.status)); }
  function render() {
    const rows = state.rows.filter(r => r.kind === tab && (!company || r.company === company) && (!status || r.status === status) && (r.name + r.number + r.holder).includes(keyword));
    root.innerHTML = '<div class="fa-head"><h1>收付款配置</h1><div class="fa-actions">' + link('资金池', 'finance-fund-pool.html') + (tab !== 'requests' ? btn('新增' + titles[tab], 'new', '', true) : '') + '</div></div><nav class="tab-bar fa-tabs">' + Object.entries(titles).map(([k, v]) => '<button class="tab-item ' + (k === tab ? 'active' : '') + '" data-fa-action="tab" data-id="' + k + '">' + v + '</button>').join('') + '</nav>' + (tab === 'requests' ? requestTable(state.requests) : '<form class="fa-filter">' + input('名称／账号／户名', 'keyword', keyword, null, 'search') + input('所属公司', 'company', company, [['', '全部公司'], '福建凯撒', '上海凯撒']) + input('使用状态', 'status', status, [['', '全部状态'], '正常', '停用']) + '<button class="btn btn-secondary" type="submit">搜索</button>' + btn('重置', 'reset') + '</form>' + table(['账户／商户', '所属公司', '用途', '可使用门店', '使用状态', '操作'], rows.map(r => '<tr data-account-id="' + r.id + '"><td><strong>' + e(r.name) + '</strong><span>' + e(r.number + ' / ' + r.currency) + '</span></td><td>' + e(r.company) + '</td><td>' + e(r.uses.join('、')) + '</td><td>' + e(r.kind === 'store' ? r.scope[0] : r.scope.length + '家门店') + '</td><td>' + badge(r.status) + '</td><td><div class="fa-actions">' + btn('详情', 'detail', r.id) + (r.status === '正常' ? btn('变更', 'edit', r.id) + btn('停用', 'stop', r.id) : '') + '</div></td></tr>'), 'fa-master') + '<div class="pagination">共 ' + rows.length + ' 条</div>');
  }
  function requestTable(records) {
    return table(['申请单／事项', '账户／商户', '申请生效日', '申请状态', '操作'], records.map(r => '<tr data-request-id="' + r.id + '"><td><strong>' + e(r.id) + '</strong><span>' + e(r.action) + '</span></td><td>' + e(r.after.name) + '</td><td>' + e(r.requestedDate || '未指定') + '</td><td>' + badge(r.status) + '</td><td>' + btn('详情', 'request', r.id) + '</td></tr>'), 'fa-requests');
  }
  function details(r) {
    open(r.name, '<h3>当前有效资料</h3>' + grid(Object.entries(labels).filter(([k]) => r[k] !== undefined && r[k] !== '').map(([k, v]) => [v, show(k, r[k])])) + grid([['批准日期', r.approvedAt], ['生效日期', r.effectiveAt]]) + (r.kind === 'store' ? '<p class="fa-note">该资料用于确认门店收付款关系，不计入公司资金账户余额。客户退款需核对原客户付款资料。</p>' : '') + '<h3>历史交易处理</h3><p class="fa-note">当前默认配置仅用于生效后的新交易。原收款保留当时的公司、账户及商户号；停用不删除历史资料。原路退款不可用时，由财务在退款执行中核实原因并办理非原路退款审批，不能自动改用新商户。</p><div class="fa-actions">' + link('退款执行', 'finance-refund-execute.html') + link('门店选用', '../sales/store/index.html') + '</div><h3>变更记录</h3>' + requestTable(state.requests.filter(x => x.rowId === r.id)), '');
  }
  function comparison(r) {
    return table(['内容', '变更前', '申请内容'], Object.entries(labels).filter(([k]) => r.before?.[k] !== undefined || r.after[k] !== undefined).map(([k, v]) => '<tr><td>' + v + '</td><td>' + e(show(k, r.before?.[k])) + '</td><td>' + e(show(k, r.after[k])) + '</td></tr>'));
  }
  function request(r) {
    open(r.after.name + ' · ' + r.action + '申请', grid([['申请单号', r.id], ['申请状态', r.status], ['申请人', '公司财务专员'], ['审核岗位', '公司财务负责人'], ['申请生效日期', r.requestedDate], ['批准日期', r.approvedAt || '未批准'], ['实际生效日期', r.effectiveAt || '尚未生效'], ['原因', r.reason]]) + comparison(r) + '<h3>处理记录</h3>' + r.events.map(x => '<p class="fa-note">' + e(x) + '</p>').join('') + '<p class="fa-note">审批中保留当前有效资料。实际启用取批准日期与申请生效日期中较晚者，仅影响之后的新交易。</p><div class="fa-actions">' + link('审批中心', '../approval/approvals.html?view=mine') + '</div>', (r.status === '审批中' ? btn('撤回申请', 'withdraw', r.id) : ['草稿', '已撤回', '已退回'].includes(r.status) ? btn('修改重提', 'reedit', r.id, true) : ''));
  }
  function edit(row, r, stop) {
    if (!r && row && pending(row.id)) { request(pending(row.id)); return; }
    const kind = row?.kind || r?.after?.kind || (tab === 'requests' ? 'company' : tab);
    const data = M.copy(r?.after || row || { id: 'new-' + Date.now(), kind, name: '', company: '福建凯撒', holder: '', number: '', bank: '', currency: 'CNY', provider: '', channels: '', settlement: '', uses: [], scope: [], proof: '', status: '正常' });
    editing = { row, r, data, stop: stop || r?.action === '停用' };
    let body = editing.stop ? grid([['停用对象', data.name], ['账号／商户号', data.number], ['当前状态', data.status]]) + '<p class="fa-note">批准并生效后停止新选用及新交易；既有门店默认配置需另行变更，不自动替换。原收款、对账及退款保留原资料，停用本身不表示银行销户或支付平台退款能力关闭。</p>' : '<div class="fa-form-grid">' + input('名称', 'name', data.name) + input('所属公司', 'company', data.company, ['福建凯撒', '上海凯撒']) + input('户名', 'holder', data.holder) + input(kind === 'merchant' ? '商户号' : '账号', 'number', data.number) + input('币种', 'currency', data.currency, ['CNY']) + (kind !== 'merchant' ? input('开户行', 'bank', data.bank) : input('支付机构', 'provider', data.provider) + input('支付渠道', 'channels', data.channels) + input('商户结算账户', 'settlement', data.settlement, [['', '请选择同公司已核准账户'], ...state.rows.filter(x => x.kind === 'company' && x.status === '正常' && x.company === data.company && x.uses.includes('商户结算')).map(x => [x.id, x.name + ' / ' + x.number])])) + '</div>' + checks('用途', 'uses', data.uses, M.uses[kind]) + '<div id="faScope">' + checks(kind === 'store' ? '对应门店（限一家）' : '可使用门店', 'scope', data.scope, data.company === '福建凯撒' ? M.storeNames : ['上海营业部']) + '</div>' + input('核验资料及说明', 'proof', data.proof, null, 'textarea') + '<p class="fa-note">财务复核户名归属、开户资料、用途及门店收付款关系；支付商户另核对商户协议和结算账户。账号或商户号更换请新增资料，原记录保留。</p>';
    body += '<div class="fa-form-grid">' + input('申请生效日期', 'date', r?.requestedDate || state.today, null, 'date') + input('申请原因', 'reason', r?.reason || '', null, 'textarea') + '</div><p class="fa-note">需公司财务负责人审批。批准晚于申请日期时，按实际批准日期启用。</p>';
    open(editing.stop ? '申请停用' : (row ? '申请变更' : '新增') + titles[kind], body, btn('保存草稿', 'draft') + btn('核对并提交', 'preview', '', true), true);
    if (row && !editing.stop) ['company', 'holder', 'number', 'currency'].forEach(k => { layer.querySelector('[name=' + k + ']').disabled = true; });
  }
  function values() {
    const f = layer.querySelector('form'), d = new FormData(f), after = M.copy(editing.data);
    if (!editing.stop) Object.keys(labels).forEach(k => { if (f.elements[k] && !f.elements[k].disabled) after[k] = ['uses', 'scope'].includes(k) ? d.getAll(k) : String(d.get(k) || '').trim(); });
    if (editing.stop) after.status = '停用';
    return { after, date: d.get('date'), reason: String(d.get('reason') || '').trim() };
  }
  function save(draft) {
    const v = draft ? values() : editing.values;
    const r = M.submit(state, editing.data.id, v.after, v.reason, v.date, editing.stop ? '停用' : editing.row ? '变更' : '新增', draft, editing.r?.id);
    dirty = false; tab = 'requests'; render(); request(r);
  }
  function action(event) {
    const b = event.target.closest('[data-fa-action]'); if (!b) return; event.preventDefault();
    const a = b.dataset.faAction, id = b.dataset.id, row = state.rows.find(r => r.id === id), r = state.requests.find(r => r.id === id);
    try {
      if (a === 'tab') { tab = id; keyword = status = company = ''; render(); }
      if (a === 'reset') { keyword = status = company = ''; render(); }
      if (a === 'close') close();
      if (a === 'new') edit();
      if (a === 'edit' || a === 'stop') edit(row, null, a === 'stop');
      if (a === 'detail') details(row);
      if (a === 'request') request(r);
      if (a === 'withdraw') { M.withdraw(state, id); render(); request(r); }
      if (a === 'reedit') edit(state.rows.find(x => x.id === r.rowId), r);
      if (a === 'draft') save(true);
      if (a === 'preview') {
        const v = values();
        if (!v.reason || !v.date || v.date < state.today) throw Error('请填写原因及今天或之后的生效日期');
        if (!editing.stop) M.validate(state, v.after);
        editing.values = v;
        open('核对收付款配置申请', grid([['申请生效日', v.date], ['原因', v.reason]]) + comparison({ before: editing.row, after: v.after }) + '<p class="fa-note">提交后保留原有效配置；审核通过且到达生效日期才用于新交易。门店默认账户调整须另走门店财务配置申请。</p>', btn('返回修改', 'back') + btn('提交审批', 'submit', '', true)); dirty = true;
      }
      if (a === 'back') { const x = editing; edit(x.row, { ...x.r, after: x.values.after, requestedDate: x.values.date, reason: x.values.reason }, x.stop); dirty = true; }
      if (a === 'submit') save(false);
    } catch (err) { error(err.message); }
  }
  root.addEventListener('click', action); layer.addEventListener('click', action);
  root.addEventListener('submit', ev => { ev.preventDefault(); const d = new FormData(ev.target); keyword = d.get('keyword'); company = d.get('company'); status = d.get('status'); render(); });
  layer.addEventListener('submit', ev => ev.preventDefault()); layer.addEventListener('input', () => { dirty = true; });
  layer.addEventListener('change', ev => {
    dirty = true;
    if (ev.target.name === 'company' && editing && !editing.row) {
      const v = values(); v.after.scope = []; v.after.settlement = '';
      edit(null, { after: v.after, requestedDate: v.date, reason: v.reason }); dirty = true;
    }
  });
  layer.addEventListener('click', ev => { if (ev.target === layer) close(); });
  document.addEventListener('keydown', ev => { if (!root.isConnected || !layer.classList.contains('show')) return; if (ev.key === 'Escape') { ev.preventDefault(); close(); } if (ev.key === 'Tab') { const nodes = [...layer.querySelectorAll('a,button,input,select,textarea')].filter(n => !n.disabled && n.offsetParent); const first = nodes[0], last = nodes.at(-1); if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last?.focus(); } else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first?.focus(); } } });
  render();
  const direct = new URLSearchParams(location.search).get('account');
  function openDirect() { if (!root.isConnected) return; if (!window.caesarUI) { setTimeout(openDirect, 50); return; } const row = state.rows.find(r => r.id === direct); if (row) details(row); }
  if (direct) setTimeout(openDirect, 0);
})();
