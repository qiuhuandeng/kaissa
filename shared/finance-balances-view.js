(function () {
  'use strict';
  if (!['balances', 'ar-ap'].includes(new URLSearchParams(location.search).get('report'))) return;
  const parent = document.getElementById('finance-cashflow');
  if (!parent) return;
  parent.insertAdjacentHTML('beforeend', '<div id="finance-balances"></div>');
  const host = parent.querySelector('#finance-balances'), m = window.CaesarBalances;
  if (!m) { host.innerHTML = '<p role="alert">往来资料未加载，请刷新重试。</p>'; return; }
  const e = m.esc;
  let applied = m.defaults(), result, page = 1, size = 10, sortKey = 'id', direction = 1;
  const extras = new Set();
  const names = { id: '应收/应付单号', order: '订单号', business: '业务/阶段', party: '客户/供应商', partyId: '往来身份', company: '核算公司', ledger: '账簿', currency: '币种',
    confirmedAt: '确认日期', due: '到期日', originalAmount: '原确认金额', adjustments: '生效调整', net: '调整后应收/应付', cash: '收付核销净额', offset: '预款冲抵净额', relief: '减免核销净额', settled: '已核销合计', balance: '账面余额',
    ageDays: '账龄天数', overdueDays: '逾期天数', overdue: '已知逾期金额', status: '余额情况', scope: '往来性质', type: '收付方向',
    salesCompany: '销售公司', productCompany: '产品公司', department: '销售部门/事业部', channel: '渠道', customerType: '客户类型', store: '门店', center: '呼叫中心',
    businessCompany: '业务责任公司', fundsCompany: '实际资金公司', relation: '内部清算号', clearingType: '清算类型', peerCompany: '对方公司', peerId: '对方单据号', peerBalance: '对方账面余额', difference: '双方余额差额', pairStatus: '双方对应情况',
    groupLabel: '往来方/分组', count: '单据数', unknown: '余额缺数', coverage: '资料情况', b0: '0-30天', b1: '31-60天', b2: '61-90天', b3: '91-180天', b4: '181天及以上', notDue: '未到期', dueToday: '当日到期', missingDate: '缺计龄日期', reverse: '反向余额',
    kindLabel: '变动类型', effectiveAt: '生效日期', recordedAt: '资料录入时间', reference: '来源/确认依据', original: '原核销/调整号', amount: '记录金额', inclusion: '本次是否纳入', issue: '核对缺口', proof: '确认凭据', source: '来源系统', actualAt: '资金实际发生日' };
  const moneyKeys = new Set(['originalAmount', 'adjustments', 'net', 'cash', 'offset', 'relief', 'settled', 'balance', 'overdue', 'peerBalance', 'difference', 'amount', ...m.bucketKeys]);
  const fieldNames = { dataset: '资料范围', case: '核对场景', asOf: '余额截止日', cutoff: '资料截止时间', dueStart: '到期日期自', dueEnd: '到期日期至', confirmedStart: '确认日期自', confirmedEnd: '确认日期至', company: '核算公司', currency: '币种', party: '客户/供应商名称或身份', order: '订单号', ledger: '账簿', customerType: '客户类型', channel: '渠道', salesCompany: '销售公司', productCompany: '产品公司', department: '部门/事业部', store: '门店', center: '呼叫中心', scope: '往来性质', status: '余额情况', direction: '收付方向', ageBasis: '计龄依据', group: '汇总分组' };
  const sample = m.fixture();
  const choices = k => [['', '全部'], ...[...new Set(sample.documents.map(d => d[k]).filter(Boolean))].map(v => [v, v])];
  const control = (k, options, type) => '<label class="cf-field">' + fieldNames[k] + (options ? '<select name="' + k + '" aria-label="' + fieldNames[k] + '">' + options.map(([v, t]) => '<option value="' + e(v) + '">' + e(t) + '</option>').join('') + '</select>' : '<input name="' + k + '" type="' + (type || 'search') + '" aria-label="' + fieldNames[k] + '">') + '</label>';
  const button = (attrs, text, icon) => '<button type="button" class="btn btn-secondary" ' + attrs + '>' + (icon ? '<img alt="" width="14" height="14" src="../../shared/report-icons/' + icon + '.svg">' : '') + text + '</button>';
  host.innerHTML = '<div class="cf-workbar"><div class="cf-tabs" role="tablist" aria-label="往来报表视图">' + Object.entries(m.views).map(([k, v]) => '<button role="tab" type="button" data-ba-view="' + k + '">' + v + '</button>').join('') + '</div>' +
    '<div class="cf-actions">' + button('data-ba-export', '导出明细', 'download') + button('data-ba-evidence-export', '导出依据', 'download') + '</div></div>' +
    '<form class="cf-filters">' + control('dataset', [['pending', '来源待接入'], ['demo', '验收算例']]) + control('case', [['', '全部核对场景'], ...Object.entries(m.cases)]) +
    control('asOf', null, 'date') + control('cutoff', null, 'datetime-local') + control('company', choices('company')) + control('currency', choices('currency')) + control('party') + control('order') +
    '<details class="cf-more"><summary>更多条件</summary><div class="cf-filter-more">' + ['ledger', 'customerType', 'channel', 'salesCompany', 'productCompany', 'department', 'store', 'center', 'scope'].map(k => control(k, choices(k))).join('') +
    control('status', [['', '全部'], ...['资料不足', '反向余额待核对', '已结清', '到期日待补', '未到期', '当日到期', '已逾期'].map(v => [v, v])]) + ['dueStart', 'dueEnd', 'confirmedStart', 'confirmedEnd'].map(k => control(k, null, 'date')).join('') + '</div></details>' +
    '<div class="cf-filter-more" data-ba-aging-controls hidden>' + control('direction', [['ar', '应收'], ['ap', '应付']]) + control('ageBasis', [['age', '从应收应付确认日计龄'], ['overdue', '从有效到期日计逾期']]) + control('group', [['party', '客户/供应商'], ['channel', '渠道'], ['department', '销售部门']]) + '</div>' +
    '<div class="cf-filter-actions"><button type="submit" class="btn btn-secondary">查询</button>' + button('data-ba-reset', '重置') + '</div></form>' +
    '<p class="cf-error" role="alert" hidden></p><p class="cf-notice" data-ba-notice role="status"></p>' +
    '<div class="cf-workbar"><h2 class="ba-table-title" data-ba-title></h2><details class="cf-columns"><summary>显示字段</summary><div data-ba-columns></div></details></div>' +
    '<div class="cf-scroll" tabindex="0" data-ba-main aria-label="往来报表主表"></div>' +
    '<div class="cf-pagination">' + button('data-ba-prev aria-label="上一页"', '', 'chevron-left') + '<span data-ba-count></span>' + button('data-ba-next aria-label="下一页"', '', 'chevron-right') + '<label>每页<select data-ba-size aria-label="每页条数"><option>10</option><option>25</option><option>50</option></select></label></div>' +
    '<section class="cf-section"><h2>公司与原币合计</h2><div class="cf-scroll" data-ba-totals aria-label="公司与原币合计"></div></section>' +
    '<section class="cf-section" data-ba-detail-section hidden><h2>账龄来源明细</h2><div class="cf-scroll" data-ba-details aria-label="账龄来源明细"></div></section>' +
    '<section class="cf-section"><h2>原确认、调整与核销依据</h2><div class="cf-scroll" data-ba-evidence aria-label="原确认调整与核销依据"></div></section>' +
    '<section class="cf-section"><h2>资料缺口与来源核对</h2><div class="cf-scroll" data-ba-exceptions aria-label="资料缺口"></div></section>' +
    '<footer class="cf-definition"><strong>统计口径 · 待财务确认</strong><p>余额 = 原确认金额 + 生效调整 - 收付核销 - 预款冲抵 - 批准减免核销。核销冲回按反向记录计入；原款、核销和冲抵不相加作资金收付。</p><p>账龄从确认日计算；逾期从有效到期日次日起计算，到期当日单列。分段为算例约定。缺历史不出余额，缺到期日不判逾期；反向余额单列核对。</p><p>金额单位：元，按核算公司、账簿、方向和原币分别汇总；内部资金清算不与对外往来相加，不代表集团抵销。资料覆盖2026-03-01至2026-10-31，实际资金公司不改变债权债务归属。</p></footer>';
  const form = host.querySelector('form'), field = k => form.elements.namedItem(k);
  const normalCols = ['id', 'order', 'party', 'company', 'currency', 'confirmedAt', 'due', 'net', 'settled', 'balance', 'overdueDays', 'status'];
  const clearingCols = ['relation', 'id', 'type', 'clearingType', 'businessCompany', 'fundsCompany', 'company', 'currency', 'balance', 'peerId', 'peerBalance', 'pairStatus'];
  const agingCols = ['company', 'ledger', 'currency', 'groupLabel', 'balance', 'b0', 'b1', 'b2', 'b3', 'b4', 'coverage'];
  const evidenceCols = ['id', 'order', 'company', 'currency', 'kindLabel', 'amount', 'effectiveAt', 'recordedAt', 'reference', 'original', 'fundsCompany', 'inclusion'];
  const totalCols = ['company', 'ledger', 'currency', 'type', 'scope', 'net', 'cash', 'offset', 'relief', 'balance', 'reverse', 'overdue', 'coverage'];
  const groups = { '金额与日期': ['originalAmount', 'adjustments', 'cash', 'offset', 'relief', 'ageDays', 'overdue'], '组织与来源': ['business', 'partyId', 'ledger', 'scope', 'customerType', 'channel', 'salesCompany', 'productCompany', 'department', 'store', 'center', 'proof'], '内部对应': ['peerCompany', 'difference', 'pairStatus'] };
  const columns = () => [...new Set([...(applied.view === 'aging' ? [...agingCols, ...(applied.ageBasis === 'overdue' ? ['notDue', 'dueToday', 'missingDate'] : []), 'reverse'] : applied.view === 'clearing' ? clearingCols : normalCols), ...(applied.view === 'aging' ? [] : extras)])];
  const label = k => k === 'b0' && applied.ageBasis === 'overdue' ? '逾期1-30天' : names[k] || k;
  const display = (r, k) => k === 'type' ? r.type === 'ar' ? '应收' : '应付' : moneyKeys.has(k) ? m.fmt(r[k]) : r[k] == null || r[k] === '' ? '未提供' : String(r[k]);
  function table(rows, cols, sortable) {
    return '<table><thead><tr>' + cols.map(k => '<th' + (sortable ? ' aria-sort="' + (sortKey === k ? direction === 1 ? 'ascending' : 'descending' : 'none') + '"' : '') + '>' + (sortable ? '<button type="button" data-ba-sort="' + k + '">' + e(label(k)) + '</button>' : e(label(k))) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(r => '<tr>' + cols.map(k => '<td class="' + (moneyKeys.has(k) ? 'cf-number' : 'cf-value') + '">' + e(display(r, k)) + '</td>').join('') + '</tr>').join('') + '</tbody></table>' + (!rows.length ? '<p class="cf-empty">' + (result.pending ? '资料不足，暂无可核对记录' : '当前条件下无记录') + '</p>' : '');
  }
  function setForm(q) { Object.keys(fieldNames).forEach(k => field(k).value = q[k] || ''); }
  function render() {
    const ordered = m.sort(result.rows, sortKey, direction), last = Math.max(1, Math.ceil(ordered.length / size)); page = Math.min(page, last);
    host.querySelector('[data-ba-title]').textContent = m.views[applied.view];
    host.querySelector('[data-ba-main]').innerHTML = table(ordered.slice((page - 1) * size, page * size), columns(), true);
    host.querySelector('[data-ba-count]').textContent = '第 ' + page + ' / ' + last + ' 页 · 共 ' + ordered.length + ' 条';
    host.querySelector('[data-ba-prev]').disabled = page === 1; host.querySelector('[data-ba-next]').disabled = page === last;
    host.querySelector('[data-ba-notice]').textContent = result.notice + ' · 核对缺口/重复 ' + result.exceptions.length + ' 条';
    host.querySelectorAll('[data-ba-view]').forEach(b => { const active = b.dataset.baView === applied.view; b.classList.toggle('active', active); b.setAttribute('aria-selected', active); });
    host.querySelector('[data-ba-aging-controls]').hidden = applied.view !== 'aging';
    host.querySelector('[data-ba-detail-section]').hidden = applied.view !== 'aging';
    host.querySelector('.cf-columns').hidden = applied.view === 'aging';
    host.querySelector('[data-ba-columns]').innerHTML = Object.entries(groups).map(([group, keys]) => '<fieldset><legend>' + group + '</legend>' + keys.map(k => '<label><input type="checkbox" data-ba-column="' + k + '"' + (extras.has(k) ? ' checked' : '') + '>' + names[k] + '</label>').join('') + '</fieldset>').join('');
    host.querySelector('[data-ba-totals]').innerHTML = table(result.totals, totalCols);
    host.querySelector('[data-ba-details]').innerHTML = table(result.details, [...normalCols, 'partyId', 'ledger', 'ageDays']);
    host.querySelector('[data-ba-evidence]').innerHTML = table(result.evidence, evidenceCols);
    host.querySelector('[data-ba-exceptions]').innerHTML = table(result.exceptions, ['id', 'order', 'company', 'currency', 'issue', 'proof']);
    host.querySelectorAll('[data-ba-export], [data-ba-evidence-export]').forEach(b => b.disabled = result.pending || (!result.rows.length && !result.exceptions.length));
  }
  function run(next) {
    const error = host.querySelector('.cf-error');
    try { const computed = m.query(next); applied = { ...next }; result = computed; page = 1; error.hidden = true; render(); }
    catch (err) { error.textContent = err.message; error.hidden = false; }
  }
  function download(full) {
    const rows = [['报表', '订单收付与往来账龄 / ' + m.views[applied.view]], ['资料', result.notice], ['金额单位', '元，按原币；内部未抵销'], ['口径', '原确认+调整-收付核销-预款冲抵-减免核销'],
      ...Object.entries(fieldNames).filter(([k]) => applied.view === 'aging' || !['direction', 'ageBasis', 'group'].includes(k)).map(([k, v]) => {
        const select = field(k); const option = select.tagName === 'SELECT' ? [...select.options].find(o => o.value === applied[k]) : null;
        return [v, option ? option.textContent : applied[k] || '全部'];
      }), ['排序', label(sortKey) + (direction === 1 ? '升序' : '降序')]];
    const append = (title, data, cols) => { rows.push([], [title], cols.map(label)); data.forEach(r => rows.push(cols.map(k => moneyKeys.has(k) ? r[k] : display(r, k)))); };
    append('全部查询结果', m.sort(result.rows, sortKey, direction), columns()); append('公司与原币合计（已知金额）', result.totals, totalCols);
    if (applied.view === 'aging') append('账龄来源明细', result.details, [...normalCols, 'partyId', 'ledger', 'ageDays']);
    if (full) append('原确认、调整与核销依据', result.evidence, [...evidenceCols, 'due', 'actualAt', 'proof']);
    append('资料缺口与来源核对', result.exceptions, ['id', 'order', 'company', 'currency', 'issue', 'proof']);
    const url = URL.createObjectURL(new Blob([m.csv(rows)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = '往来账龄-' + m.views[applied.view] + (full ? '-含依据' : '') + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  form.addEventListener('submit', event => { event.preventDefault(); const next = { ...applied }; for (const [k, v] of new FormData(form)) next[k] = v.trim(); run(next); });
  host.addEventListener('click', event => {
    const b = event.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-ba-view')) { const next = { ...applied, view: b.dataset.baView }; extras.clear(); sortKey = next.view === 'aging' ? 'balance' : 'id'; setForm(next); run(next); }
    if (b.hasAttribute('data-ba-reset')) { const next = { ...m.defaults(), view: applied.view }; extras.clear(); setForm(next); run(next); }
    if (b.hasAttribute('data-ba-sort')) { direction = sortKey === b.dataset.baSort ? -direction : 1; sortKey = b.dataset.baSort; render(); }
    if (b.hasAttribute('data-ba-prev')) { page--; render(); }
    if (b.hasAttribute('data-ba-next')) { page++; render(); }
    if (b.hasAttribute('data-ba-export')) download(false);
    if (b.hasAttribute('data-ba-evidence-export')) download(true);
  });
  host.addEventListener('change', event => {
    const b = event.target;
    if (b.hasAttribute('data-ba-column')) { b.checked ? extras.add(b.dataset.baColumn) : extras.delete(b.dataset.baColumn); render(); }
    if (b.hasAttribute('data-ba-size')) { size = Number(b.value); page = 1; render(); }
  });
  document.title = '订单收付与往来账龄 - 凯撒旅游';
  setForm(applied); run(applied);
})();
