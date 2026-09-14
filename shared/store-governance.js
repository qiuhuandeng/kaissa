(function () {
  'use strict';
  const root = document.querySelector('[data-store-governance]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  const M = window.CaesarStoreGovernance, state = M.create();
  const page = root.dataset.storeGovernance;
  const params = new URLSearchParams(location.search);
  const legacyStores = { 'store-xiamen-a': 'store-1', 'store-xiamen-b': 'store-2', 'store-xiamen-c': 'store-3', 'store-quanzhou-a': 'store-4', 'store-quanzhou-b': 'store-5', 'store-quanzhou-c': 'store-6' };
  let selected = state.stores.find(s => s.id === (params.get('store') || legacyStores[params.get('org')])) || state.stores[0];
  let tab = 'profile', filter = { keyword: '', org: '', status: '' }, memberFilter = { keyword: '', store: '', status: '' };
  let editing = null, dirty = false, activeMember = null, focusBefore = null, closeTimer = null;
  const e = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const display = value => Array.isArray(value) ? value.join('、') || '未设置' : value || '未设置';
  const badge = value => '<span class="tag tag-' + (/正常|已生效|已通过/.test(value) ? 'green' : /暂停|退回|冻结/.test(value) ? 'orange' : /关闭|停用|撤回/.test(value) ? 'gray' : 'blue') + '">' + e(value) + '</span>';
  const button = (label, action, data, primary) => '<button type="button" class="' + (primary ? 'btn btn-primary' : 'table-link') + '" data-sg-action="' + action + '" ' + (data || '') + '>' + label + '</button>';
  const link = (label, href) => '<a class="table-link" href="' + e(href) + '">' + label + '</a>';
  const detailLink = s => 'detail.html?store=' + encodeURIComponent(s.id);
  const heading = (title, actions) => '<div class="sg-section-head"><h2>' + e(title) + '</h2><div class="sg-actions">' + (actions || '') + '</div></div>';
  const grid = entries => '<dl class="sg-grid">' + entries.map(([k, v]) => '<div><dt>' + e(k) + '</dt><dd>' + e(display(v)) + '</dd></div>').join('') + '</dl>';
  const field = (label, name, value, type, options) => '<label class="sg-field"><span>' + e(label) + '</span>' + (options ? '<select name="' + name + '">' + options.map(v => '<option value="' + e(v) + '"' + (v === value ? ' selected' : '') + '>' + e(v || '全部') + '</option>').join('') + '</select>' : type === 'textarea' ? '<textarea name="' + name + '" rows="3">' + e(value) + '</textarea>' : '<input name="' + name + '" type="' + (type || 'text') + '" value="' + e(value) + '"' + (type === 'number' ? ' min="1" step="1"' : '') + '>') + '</label>';
  function checks(label, name, values, options) {
    return '<fieldset class="sg-checks"><legend>' + e(label) + '</legend>' + options.map(v => '<label><input type="checkbox" name="' + name + '" value="' + e(v) + '"' + (values.includes(v) ? ' checked' : '') + '> ' + e(v) + '</label>').join('') + '</fieldset>';
  }
  function table(headers, rows, cls) {
    return '<div class="table-wrap sg-table"><table class="' + (cls || '') + '"><thead><tr>' + headers.map(h => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>' + (rows.length ? rows.join('') : '<tr><td colspan="' + headers.length + '" class="sg-empty">暂无符合条件的记录</td></tr>') + '</tbody></table></div>';
  }
  function notify(text) { if (window.caesarUI) window.caesarUI.toast(text); else window.alert(text); }
  document.getElementById('storeGovernanceDrawer')?.remove();
  const layer = document.createElement('div');
  layer.id = 'storeGovernanceDrawer'; layer.className = 'modal-overlay drawer-overlay sg-layer'; layer.dataset.static = 'true'; layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  function open(title, content, footer, form) {
    clearTimeout(closeTimer);
    focusBefore = document.activeElement;
    layer.innerHTML = '<div class="modal drawer-modal" role="dialog" aria-modal="true" aria-labelledby="sgDrawerTitle"><div class="modal-header"><h2 id="sgDrawerTitle" class="modal-title">' + e(title) + '</h2>' + button('×', 'close', 'aria-label="关闭"') + '</div><' + (form ? 'form id="sgForm"' : 'div') + ' class="modal-body">' + content + '</' + (form ? 'form' : 'div') + '><div class="sg-error" role="alert" hidden></div><div class="modal-footer">' + button('关闭', 'close') + (footer || '') + '</div></div>';
    dirty = false;
    if (window.caesarUI) window.caesarUI.openLayer(layer); else { layer.classList.add('show'); layer.setAttribute('aria-hidden', 'false'); }
    setTimeout(() => layer.querySelector('input, select, button')?.focus(), 0);
  }
  function close(force) {
    if (dirty && !force && !window.confirm('当前内容未保存，确认离开吗？')) return;
    layer.classList.remove('show'); layer.classList.add('closing');
    closeTimer = setTimeout(() => { layer.classList.remove('closing'); layer.hidden = true; layer.setAttribute('aria-hidden', 'true'); }, 360);
    dirty = false; focusBefore?.focus();
  }
  function error(message) { const node = layer.querySelector('.sg-error'); node.hidden = false; node.textContent = message; }
  const findStore = id => state.stores.find(s => s.id === id) || selected;
  function recordsFor(s) { return state.records.filter(r => r.storeId === s.id); }
  function recordsTable(s) {
    return table(['申请单号／事项', '申请生效日', '审批／实际生效', '申请状态', '操作'], recordsFor(s).map(r => '<tr><td><strong>' + e(r.id) + '</strong><span>' + e(M.titles[r.kind]) + '</span></td><td>' + e(r.mode === '批准后生效' ? r.mode : r.requestedDate) + '</td><td><span>批准：' + e(r.approvedAt || '未批准') + '</span><span>生效：' + e(r.status === '待生效' ? '预计 ' + r.effectiveAt : r.effectiveAt || '尚未生效') + '</span></td><td>' + badge(r.status) + '</td><td>' + button('详情', 'record', 'data-id="' + r.id + '"') + '</td></tr>'), 'sg-record-table');
  }
  function list() {
    const rows = state.stores.filter(s => (s.profile.name + s.profile.contact).includes(filter.keyword) && (!filter.org || s.profile.org === filter.org) && (!filter.status || s.status === filter.status));
    root.innerHTML = '<div class="list-page-head"><h1 class="page-title">门店管理</h1><div class="sg-actions">' + button('导出', 'export') + button('新增门店', 'new', '', true) + '</div></div>' +
      '<form class="sg-filters" id="sgFilter">' + field('门店／负责人', 'keyword', filter.keyword, 'search') + field('所属组织', 'org', filter.org, '', ['', ...new Set(state.stores.map(s => s.profile.org))]) + field('合作状态', 'status', filter.status, '', ['', '待开通', '正常', '暂停']) + '<button class="btn btn-secondary" type="submit">搜索</button>' + button('重置', 'reset') + '</form>' +
      table(['门店', '所属组织', '负责人', '结算安排', '合作状态', '操作'], rows.map(s => '<tr data-store-id="' + s.id + '"><td><strong>' + e(s.profile.name) + '</strong><span>' + e(s.profile.type) + '</span></td><td><strong>' + e(s.profile.company) + '</strong><span>' + e(s.profile.org) + '</span></td><td><strong>' + e(s.profile.contact) + '</strong><span>' + e(s.profile.phone) + '</span></td><td>' + e(s.reviews.finance === '已生效' ? s.finance.settlement : '待财务配置生效') + '</td><td>' + badge(s.status) + '</td><td><div class="sg-actions">' + link('详情', detailLink(s)) + button('销售', 'edit', 'data-store="' + s.id + '" data-kind="sales"') + button('财务', 'edit', 'data-store="' + s.id + '" data-kind="finance"') + button(s.status === '暂停' ? '恢复' : s.status === '正常' ? '暂停' : '档案', s.status === '暂停' ? 'restore' : s.status === '正常' ? 'pause' : 'edit', 'data-store="' + s.id + '" data-kind="profile"') + '</div></td></tr>'), 'sg-store-table') + '<div class="pagination">共 ' + rows.length + ' 条</div>';
  }
  function reviewTable(s) {
    return table(['审核事项', '当前结果', '有效内容／未满足条件', '申请记录'], ['profile', 'sales', 'finance'].map(kind => '<tr><td>' + e(M.titles[kind]) + '</td><td>' + badge(s.reviews[kind]) + '</td><td>' + e(kind === 'profile' ? (s.profile.expiry < state.today ? '合作已到期，续签在审不延长原资质' : '合作到期 ' + s.profile.expiry) : kind === 'sales' ? display(s.sales.products) : s.finance.settlement + ' / ' + display(s.finance.methods)) + '</td><td>' + button(recordsFor(s).some(r => r.kind === kind && r.status !== '已生效') ? '查看申请' : '记录', 'records', 'data-store="' + s.id + '"') + '</td></tr>'), 'sg-review-table');
  }
  function links(s) {
    return '<div class="sg-related">' + link('历史订单', '../orders.html') + link('合同处理', '../contracts.html') + link('售后与退款申请', '../orders-after-sales.html') + link('预存账户', 'predeposit.html') + link('门店对账', 'reconciliation.html') + link('工作交接', '../../system/staff-management.html') + '</div>' + grid([['未完订单', s.orders + '单'], ['待处理退款', s.refunds + '单'], ['待核对账单', s.reconciliation + '单'], ['历史业务负责人', s.serviceOwner]]);
  }
  function detail() {
    const s = selected;
    const tabs = { profile: '门店档案', sales: '销售与合同', finance: '收款与结算', members: '成员', business: '历史业务', records: '变更记录' };
    let body = '';
    if (tab === 'profile') body = heading(s.reviews.profile === '已通过' ? '当前有效档案' : '门店准入资料', button('申请变更', 'edit', 'data-kind="profile"')) + grid(Object.entries(M.fields.profile).map(([k, label]) => [label, s.profile[k]])) + heading('分项审核') + reviewTable(s);
    if (tab === 'sales') body = heading(s.reviews.sales === '已生效' ? '当前销售授权' : '销售授权尚未生效', button('申请变更', 'edit', 'data-kind="sales"')) + grid(Object.entries(M.fields.sales).map(([k, label]) => [label, s.sales[k]])) + '<p class="sg-note">新预订需满足当前授权和产品可售条件；已有订单继续按原合同办理。时长及付款条件待业务确认后配置。</p>';
    if (tab === 'finance') body = heading(s.reviews.finance === '已生效' ? '当前财务配置' : '财务配置尚未生效', button('申请变更', 'edit', 'data-kind="finance"')) + grid(Object.entries(M.fields.finance).map(([k, label]) => [label, s.finance[k]])) + heading('账户与核对', link('预存账户', 'predeposit.html') + link('门店对账', 'reconciliation.html')) + grid([['账户状态', s.accountState], ['可用预存余额', s.available], ['冻结金额', s.frozen]]) + '<p class="sg-note">月结仅约定核对周期，付款仍按订单条件执行。变更默认商户后，原收退款继续使用原账户。</p>';
    if (tab === 'members') body = heading('门店成员', link('成员管理', 'members.html') + link('集团统一组织架构', '../../../admin/org.html')) + memberTable(state.members.filter(m => m.store === s.profile.name), true);
    if (tab === 'business') body = heading('历史业务') + links(s) + heading('经营查询') + '<div class="sg-related">' + link('渠道经营', '../../data/channel-reports.html') + link('订单明细', '../../data/order-report-details.html') + '</div>';
    if (tab === 'records') body = heading('变更申请') + recordsTable(s) + heading('合作状态记录') + table(['日期', '操作', '原因／承接人'], s.log.map(x => '<tr><td>' + e(x.date) + '</td><td>' + e(x.action) + '</td><td>' + e(x.reason) + '</td></tr>'));
    root.innerHTML = '<section class="page-workbar"><div class="page-title-row">' + link('返回', 'index.html') + '<h1 class="page-title">' + e(s.profile.name) + '</h1></div><div class="sg-actions">' + (s.status === '待开通' ? '' : button(s.status === '暂停' ? '申请恢复' : '暂停门店', s.status === '暂停' ? 'restore' : 'pause')) + '</div></section>' +
      '<section class="sg-summary">' + grid([['合作状态', s.status], ['所属公司', s.profile.company], ['负责人', s.profile.contact], ['合作到期', s.profile.expiry]]) + (s.status === '暂停' ? '<p class="sg-note">已暂停新增订单及名额占用。历史补收、补签、售后和对账由 ' + e(s.serviceOwner) + ' 接续处理。</p>' : '') + '</section>' + '<nav class="tab-bar sg-tabs">' + Object.entries(tabs).map(([key, title]) => '<button class="tab-item ' + (key === tab ? 'active' : '') + '" data-sg-action="tab" data-tab="' + key + '">' + title + '</button>').join('') + '</nav><section class="sg-detail-track">' + body + '</section>';
  }
  function memberTable(members, compact) {
    return table(['成员／联系', '当前组织与门店', '门店角色／范围', '本店权限状态', '操作'], members.map(m => '<tr data-member-id="' + m.id + '"><td><strong>' + e(m.name) + '</strong><span>' + e(m.phone) + '</span></td><td><strong>' + e(m.store) + '</strong><span>' + e(m.company + ' / ' + m.org) + '</span></td><td><strong>' + e(m.role) + '</strong><span>' + e(m.scope) + '</span></td><td>' + badge(m.status) + '</td><td>' + button('详情', 'member', 'data-member="' + m.id + '"') + '</td></tr>'), 'sg-member-table');
  }
  function members() {
    const rows = state.members.filter(m => (m.name + m.phone).includes(memberFilter.keyword) && (!memberFilter.store || m.store === memberFilter.store) && (!memberFilter.status || m.status === memberFilter.status));
    root.innerHTML = '<div class="list-page-head"><h1 class="page-title">门店成员</h1><div class="sg-actions">' + link('集团统一组织架构', '../../../admin/org.html') + '</div></div><form class="sg-filters" id="sgMemberFilter">' + field('成员／手机号', 'keyword', memberFilter.keyword, 'search') + field('所属门店', 'store', memberFilter.store, '', ['', ...new Set(state.members.map(m => m.store))]) + field('本店权限状态', 'status', memberFilter.status, '', ['', '待生效', '正常', '已停用']) + '<button type="submit" class="btn btn-secondary">搜索</button>' + button('重置', 'reset') + '</form>' + memberTable(rows) + '<div class="pagination">共 ' + rows.length + ' 条</div>';
  }
  function render() { if (page === 'list') list(); else if (page === 'detail') detail(); else members(); }
  function edit(s, kind, record, fresh) {
    selected = s;
    const data = record ? record.after : M.copy(s[kind]);
    const pending = recordsFor(s).find(r => r.kind === kind && ['草稿', '审批中', '待生效'].includes(r.status));
    if (!record && !fresh && pending) { recordView(pending); return; }
    editing = { s, kind, record, fresh: !!fresh };
    let html = '';
    if (kind === 'profile') html = '<div class="sg-form-grid">' + field('门店名称', 'name', data.name) + field('门店类型', 'type', data.type, '', ['自营门店', '合作门店', '加盟门店']) + field('所属公司', 'company', data.company, '', ['福建凯撒']) + field('所属组织', 'org', data.org, '', ['厦门分公司 / 厦门思明区门市部', '泉州分公司 / 泉州丰泽门市部']) + field('负责人', 'contact', data.contact) + field('联系电话', 'phone', data.phone, 'tel') + field('合作开始', 'start', data.start, 'date') + field('合作到期', 'expiry', data.expiry, 'date') + field('开通日期', 'openDate', data.openDate, 'date') + field('地址', 'address', data.address) + field('营业执照资料', 'license', data.license) + field('合作协议资料', 'agreement', data.agreement) + '</div><label class="sg-field"><span>补充附件</span><input type="file" name="attachments" multiple></label>';
    if (kind === 'sales') html = checks('可售产品类型', 'products', data.products, ['参团游', '邮轮', '专列', '自由行', '单项服务', '单团项目', '研学']) + checks('可售目的地', 'destinations', data.destinations, ['欧洲', '国内', '日本', '东南亚']) + '<div class="sg-form-grid">' + field('签约公司', 'contractCompany', data.contractCompany, '', ['福建凯撒']) + field('合同模板', 'template', data.template, '', ['标准国内/出境旅游合同', '邮轮旅游合同', '单项服务确认单', 'MICE项目合同']) + field('预留时长（小时）', 'reserveHours', data.reserveHours, 'number') + field('人工占位时长（小时）', 'holdHours', data.holdHours, 'number') + '</div>' + field('订单与合同付款条件', 'conditions', data.conditions, 'textarea') + '<p class="sg-note">只选择所属公司已授权范围。未确定的时长保持空白，付款条件按已批准规则填写。</p>';
    if (kind === 'finance') html = '<div class="sg-form-grid">' + field('结算安排', 'settlement', data.settlement, '', ['单单结', '月结']) + field('选用支付商户', 'merchant', data.merchant, '', ['福建凯撒聚合支付商户']) + field('门店缴款户名', 'accountName', data.accountName) + field('门店缴款账号', 'account', data.account) + field('开户行', 'bank', data.bank) + field('开票抬头', 'invoice', data.invoice) + field('月管理费', 'fee', data.fee) + field('管理费收取方式', 'feeMethod', data.feeMethod, '', ['随门店对账收取', '从预存账户扣款', '按协议免收']) + '</div>' + checks('允许付款方式', 'methods', data.methods, ['对公转账', '聚合扫码', '现金收款', '预存抵扣']) + field('付款节点', 'paymentNode', data.paymentNode, 'textarea');
    const mode = record?.mode || '批准后生效';
    html = (fresh ? '' : '<details class="sg-current"><summary>查看当前有效内容</summary>' + grid(Object.entries(M.fields[kind]).map(([key, title]) => [title, s[kind][key]])) + '</details>') + html + heading('申请生效') + '<div class="sg-form-grid">' + field('生效方式', 'mode', mode, '', ['批准后生效', '指定日期', '下账期生效']) + field('生效日期', 'requestedDate', record?.requestedDate || '', 'date') + '</div><p class="sg-note" id="sgDateNote">批准后启用；指定日期或下账期需填写具体日期，审批延迟按实际批准时间启用。</p>' + field('申请原因', 'reason', record?.reason || '', 'textarea');
    open(fresh ? '新增门店 · 档案准入' : s.profile.name + ' · ' + M.titles[kind] + '变更', html, button('保存草稿', 'save-draft') + button('核对并提交', 'preview-submit', '', true), true);
    syncDate();
  }
  function syncDate() { const form = layer.querySelector('form'); if (form?.elements.mode) { const automatic = form.elements.mode.value === '批准后生效'; form.elements.requestedDate.disabled = automatic; form.elements.requestedDate.required = !automatic; } }
  function readEdit() {
    const form = layer.querySelector('form'); if (!form.reportValidity()) return null;
    const data = new FormData(form), after = {};
    Object.keys(M.fields[editing.kind]).forEach(key => { after[key] = ['products', 'destinations', 'methods'].includes(key) ? data.getAll(key) : String(data.get(key) || '').trim(); });
    if (editing.kind === 'profile' && (!after.name || !after.contact || !after.phone || !after.address || !after.start || !after.expiry || !after.openDate || !after.license || !after.agreement)) throw Error('请补齐门店名称、联系人、地址、合作日期、开通日期及资质资料');
    if (editing.kind === 'profile' && (after.expiry < after.start || after.openDate < after.start || after.openDate > after.expiry)) throw Error('开通日期需在合作有效期内');
    if (editing.kind === 'sales' && (!after.products.length || !after.destinations.length)) throw Error('请选择可售产品类型和目的地');
    if (editing.kind === 'finance' && !after.methods.length) throw Error('请选择至少一种付款方式');
    const files = data.getAll('attachments').filter(f => f && f.name).map(f => f.name);
    return { after, options: { mode: data.get('mode'), requestedDate: data.get('requestedDate') || '', reason: String(data.get('reason') || '').trim() }, files };
  }
  function previewSubmit() {
    const values = readEdit(); if (!values) return;
    if (!values.options.reason) throw Error('请填写申请原因');
    editing.values = values;
    const before = editing.record?.before || editing.s[editing.kind];
    open('核对变更内容', comparison(editing.kind, before, values.after) + grid([['生效方式', values.options.mode], ['期望生效日', values.options.requestedDate || '批准时间'], ['申请原因', values.options.reason], ['本次附件', values.files]]) + '<p class="sg-note">提交后保留当前有效资料，审批通过并到达生效时间后启用。</p>', button('返回修改', 'back-edit') + button('提交审批', 'submit-change', '', true));
    dirty = true;
  }
  function saveChange(draft) {
    const values = draft ? readEdit() : editing.values; if (!values) return;
    values.options.draft = draft;
    if (editing.fresh && !state.stores.some(s => s.id === editing.s.id)) state.stores.unshift(editing.s);
    const r = M.save(state, editing.s.id, editing.kind, values.after, values.options, editing.record?.id);
    r.attachments = values.files;
    if (editing.fresh || (editing.kind === 'profile' && editing.s.status === '待开通' && editing.s.reviews.profile !== '已通过')) { editing.s.profile = M.copy(values.after); editing.s.reviews.profile = draft ? '草稿' : '审批中'; }
    close(true); render(); record(r);
  }
  function comparison(kind, before, after) {
    return table(['内容', '变更前', '申请内容'], Object.entries(M.fields[kind]).map(([key, title]) => '<tr><td>' + e(title) + '</td><td>' + e(display(before[key])) + '</td><td' + (JSON.stringify(before[key]) !== JSON.stringify(after[key]) ? ' class="sg-changed"' : '') + '>' + e(display(after[key])) + '</td></tr>'));
  }
  function recordView(r) { return record(r); }
  function record(r) {
    const s = findStore(r.storeId); selected = s;
    let footer = '';
    if (r.status === '审批中') footer += button('撤回申请', 'withdraw', 'data-id="' + r.id + '"');
    if (['草稿', '已退回', '已撤回'].includes(r.status) && r.kind !== 'restore') footer += button('修改重提', 'reedit', 'data-id="' + r.id + '"', true);
    open(s.profile.name + ' · ' + M.titles[r.kind], grid([['申请单号', r.id], ['申请状态', r.status], ['审核岗位', r.reviewer], ['生效方式', r.mode], ['期望生效日', r.requestedDate || '批准时间'], ['批准日期', r.approvedAt || '未批准'], ['实际生效日', r.status === '已生效' ? r.effectiveAt : '尚未生效'], ['预计生效日', r.status === '待生效' ? r.effectiveAt : '—'], ['原因／退回意见', r.reason], ['附件', r.attachments || []]]) + comparison(r.kind, r.before, r.after) + heading('处理记录') + table(['日期', '处理'], r.events.map(x => '<tr><td>' + e(x.date) + '</td><td>' + e(x.text) + '</td></tr>')) + '<div class="sg-related">' + link('审批中心', '../../approval/approvals.html?view=mine') + '</div>', footer);
  }
  function pause(s) {
    selected = s;
    open(s.profile.name + ' · 暂停营业', '<p class="sg-note">暂停后禁止新增订单、增加人数及新增名额占用。历史补收、补签、售后和对账继续处理，资金账户单独控制。</p>' + grid([['未完订单', s.orders + '单'], ['待处理退款', s.refunds + '单'], ['待核对账单', s.reconciliation + '单'], ['账户状态', s.accountState]]) + field('历史业务负责人', 'owner', s.serviceOwner, '', [...new Set([s.serviceOwner, '公司运营负责人', ...state.members.filter(m => m.status === '正常').map(m => m.name)])]) + field('暂停原因', 'reason', '', 'textarea'), button('确认暂停', 'confirm-pause', '', true), true);
  }
  function restore(s) {
    selected = s;
    const gaps = M.restoreGaps(s, state.today);
    open(s.profile.name + ' · 恢复营业', reviewTable(s) + grid([['合作到期', s.profile.expiry], ['账户状态', s.accountState]]) + '<p class="sg-note">' + (gaps.length ? e(gaps.join('；')) : '营业条件具备，可提交恢复审批。') + (s.accountState === '整户冻结' ? '账户另有冻结，恢复营业后仍需由财务单独处理。' : '') + '</p>' + (!gaps.length ? field('恢复原因', 'reason', '', 'textarea') : '<div class="sg-related">' + button('补充档案', 'edit', 'data-kind="profile"') + '</div>'), gaps.length ? '' : button('提交恢复申请', 'submit-restore', '', true), !gaps.length);
  }
  function member(m) {
    activeMember = m;
    const records = state.memberRecords.filter(r => r.memberId === m.id);
    open(m.name + ' · 门店成员', grid([['员工', m.name], ['联系电话', m.phone], ['所属公司', m.company], ['当前组织', m.org], ['当前门店', m.store], ['门店角色', m.role], ['本店权限状态', m.status], ['可见业务范围', m.scope], ['可见金额', m.money]]) + '<p class="sg-note">人员及组织归属来自集团统一组织架构。门店只处理本店权限，组织调整另走统一申请。</p><div class="sg-related">' + link('调整组织归属', '../../../admin/org.html?employee=' + encodeURIComponent(m.id)) + link('工作交接', '../../system/staff-management.html') + link('业务角色', '../../../admin/merchant-roles.html') + '</div>' + heading('本店权限变更记录') + table(['申请事项', '状态', '生效日期', '处理'], records.map(r => '<tr><td>' + e(r.title) + '</td><td>' + badge(r.status) + '</td><td>' + e(r.date) + '</td><td>' + (r.status === '审批中' ? button('撤回', 'member-withdraw', 'data-id="' + r.id + '"') : e(r.reason)) + '</td></tr>')), m.status === '正常' ? button('申请权限调整', 'member-role') + button('停用本店权限', 'member-stop') : '');
  }
  function memberRole() {
    const m = activeMember;
    open(m.name + ' · 权限调整', grid([['当前门店', m.store], ['当前角色', m.role], ['当前范围', m.scope]]) + field('申请门店角色', 'role', m.role, '', ['店长', '店员', '客服', '财务联系人']) + field('生效日期', 'date', state.today, 'date') + field('申请原因', 'reason', '', 'textarea') + '<p class="sg-note">角色审批单独处理。提交后保留当前权限；财务联系人只负责充值申请、查询及门店核对，不取得扣款复核或退款执行权。</p>', button('提交审批', 'member-role-submit', '', true), true);
  }
  function memberStop() {
    const m = activeMember;
    const owners = state.members.filter(x => x.id !== m.id && x.store === m.store && x.status === '正常').map(x => x.name).concat('公司运营负责人');
    open(m.name + ' · 停用本店权限', grid([['在办订单', m.orders + '单'], ['待交接客户', m.customers + '位'], ['当前门店', m.store]]) + field('接手人', 'owner', owners[0], '', owners) + field('停用原因', 'reason', '', 'textarea') + '<p class="sg-note">立即撤销本店操作权限，集团账号及其他门店权限不受影响。接手人处理未完事项，原销售人员和历史业绩归属保留。</p>', button('确认停用', 'member-stop-submit', '', true), true);
  }
  function onAction(event) {
    const target = event.target.closest('[data-sg-action]'); if (!target) return;
    event.preventDefault();
    const action = target.dataset.sgAction;
    try {
      if (target.dataset.store) selected = findStore(target.dataset.store);
      if (action === 'close') close();
      if (action === 'tab') { tab = target.dataset.tab; detail(); }
      if (action === 'reset') { filter = { keyword: '', org: '', status: '' }; memberFilter = { keyword: '', store: '', status: '' }; render(); }
      if (action === 'edit') edit(selected, target.dataset.kind);
      if (action === 'records') open(selected.profile.name + ' · 申请记录', recordsTable(selected), '');
      if (action === 'record') record(state.records.find(r => r.id === target.dataset.id));
      if (action === 'withdraw') { M.withdraw(state, target.dataset.id); render(); record(state.records.find(r => r.id === target.dataset.id)); }
      if (action === 'reedit') { const r = state.records.find(r => r.id === target.dataset.id); edit(findStore(r.storeId), r.kind, r); }
      if (action === 'new') { const s = M.copy(state.stores[0]); s.id = 'store-new-' + (++state.sequence); s.status = '待开通'; s.profile.name = ''; s.profile.contact = ''; s.profile.phone = ''; s.profile.address = ''; s.profile.start = state.today; s.profile.openDate = state.today; s.profile.license = ''; s.profile.agreement = ''; s.reviews = { profile: '草稿', sales: '未提交', finance: '未提交' }; s.sales = { products: [], destinations: [], contractCompany: '福建凯撒', template: '标准国内/出境旅游合同', reserveHours: '', holdHours: '', conditions: '' }; s.finance = Object.fromEntries(Object.keys(M.fields.finance).map(k => [k, k === 'methods' ? [] : ''])); s.finance.settlement = '单单结'; s.accountState = '未开户'; s.available = s.frozen = '¥0'; s.serviceOwner = '待指定'; s.orders = s.refunds = s.reconciliation = 0; s.log = []; edit(s, 'profile', null, true); }
      if (action === 'save-draft') saveChange(true);
      if (action === 'preview-submit') previewSubmit();
      if (action === 'back-edit') { const x = editing; edit(x.s, x.kind, Object.assign({}, x.record || {}, x.values.options, { after: x.values.after }), x.fresh); dirty = true; }
      if (action === 'submit-change') saveChange(false);
      if (action === 'pause') pause(selected);
      if (action === 'restore') restore(selected);
      if (action === 'confirm-pause') {
        const f = layer.querySelector('form'); const reason = f.elements.reason.value.trim(); if (!reason) throw Error('请填写暂停原因');
        if (selected.status !== '正常') throw Error('当前门店不能重复暂停');
        selected.status = '暂停'; selected.serviceOwner = f.elements.owner.value;
        selected.log.unshift({ date: state.today, action: '暂停营业', reason: reason + '；历史业务负责人：' + selected.serviceOwner });
        close(true); render(); notify('门店已暂停，历史业务由指定负责人继续处理');
      }
      if (action === 'submit-restore') {
        const reason = layer.querySelector('form').elements.reason.value.trim();
        const r = M.save(state, selected.id, 'restore', { status: '正常' }, { reason, mode: '批准后生效', requestedDate: '' }); close(true); render(); record(r);
      }
      if (action === 'member') member(state.members.find(m => m.id === target.dataset.member));
      if (action === 'member-role') memberRole();
      if (action === 'member-stop') memberStop();
      if (action === 'member-role-submit' || action === 'member-stop-submit') {
        const f = layer.querySelector('form'); if (!f.reportValidity()) return;
        const reason = f.elements.reason.value.trim(); if (!reason) throw Error('请填写原因');
        const stop = action === 'member-stop-submit';
        if (!stop && (!f.elements.date.value || f.elements.date.value < state.today)) throw Error('请选择今天或之后的生效日期');
        if (!stop && state.memberRecords.some(r => r.memberId === activeMember.id && r.status === '审批中')) throw Error('已有权限申请待审批，请先处理原申请');
        state.memberRecords.unshift({ id: 'QX-MS-' + (++state.sequence), memberId: activeMember.id, title: stop ? '停用本店权限' : activeMember.role + ' → ' + f.elements.role.value, status: stop ? '已生效' : '审批中', date: stop ? state.today : f.elements.date.value, reason: stop ? reason + '；接手人：' + f.elements.owner.value : reason });
        if (stop) { activeMember.status = '已停用'; activeMember.scope = '无本店操作权限'; activeMember.money = '无资金权限'; }
        close(true); render(); member(activeMember);
      }
      if (action === 'member-withdraw') { state.memberRecords.find(r => r.id === target.dataset.id).status = '已撤回'; member(activeMember); }
      if (action === 'export') {
        const lines = [['门店', '所属公司', '所属组织', '负责人', '结算安排', '合作状态'], ...state.stores.filter(s => (s.profile.name + s.profile.contact).includes(filter.keyword) && (!filter.org || s.profile.org === filter.org) && (!filter.status || s.status === filter.status)).map(s => [s.profile.name, s.profile.company, s.profile.org, s.profile.contact, s.finance.settlement, s.status])];
        const csv = lines.map(row => row.map(v => '"' + String(v).replace(/^[=+@-]/, "'$&").replace(/"/g, '""') + '"').join(',')).join('\r\n');
        const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = '门店管理.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (err) { if (layer.classList.contains('show')) error(err.message); else notify(err.message); }
  }
  root.addEventListener('click', onAction); layer.addEventListener('click', onAction);
  root.addEventListener('submit', event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); if (event.target.id === 'sgFilter') filter = data; else memberFilter = data; render(); });
  layer.addEventListener('submit', event => event.preventDefault());
  layer.addEventListener('input', () => { dirty = true; });
  layer.addEventListener('change', () => { dirty = true; syncDate(); });
  layer.addEventListener('click', event => { if (event.target === layer) close(); });
  document.addEventListener('keydown', event => { if (!root.isConnected || !layer.classList.contains('show')) return; if (event.key === 'Escape') { event.preventDefault(); close(); } if (event.key === 'Tab') { const nodes = [...layer.querySelectorAll('button,a,input,select,textarea')].filter(n => !n.disabled && n.offsetParent); const first = nodes[0], last = nodes[nodes.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } } });
  render();
})();
