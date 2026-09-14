(function () {
  'use strict';
  const root = document.querySelector('[data-supplier-report]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  const m = window.CaesarSupplierReport, report = window.CaesarReports;
  if (!m || !report) { root.innerHTML = '<p role="alert">报表资料未加载，请检查项目文件是否完整后刷新。</p>'; return; }
  const baseUrl = new URL('.', document.currentScript.src);
  const css = new URL('supplier-reports.css', baseUrl).href;
  if (!document.querySelector('link[href="' + css + '"]') && !document.querySelector('link[href="../../shared/supplier-reports.css"]')) {
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = css; document.head.appendChild(link);
  }
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = name => '<img class="report-icon" alt="" src="' + new URL('report-icons/' + name + '.svg', baseUrl).href + '">';
  const button = (text, attrs = '') => '<button type="button" class="report-button" ' + attrs + '>' + text + '</button>';
  const labels = { rank: '排名', name: '采购名称', supplier: '供应商', supplierId: '供应商识别号', company: '采购公司', department: '产品部门', category: '采购类别', type: '采购用途', relation: '集团内外', related: '关联方', id: '记录号', date: '确认日期', purchaseDate: '采购确认日期', billDate: '账单确认日期', quantity: '采购数量', quantityUnit: '数量单位', amount: '采购金额', purchaseAmount: '采购确认金额', billAmount: '账单确认金额', count: '采购明细数', missing: '金额缺数', share: '采购额占比', contract: '采购单／合同号', line: '采购行号', billNo: '供应商账单号', tax: '金额口径', currency: '币种', rate: '来源折算汇率', evidence: '确认依据', owner: '采购负责人', tours: '关联团期', version: '发生时归属版本', source: '资料来源', agreement: '返点协议', period: '协议业务期间', expectedDate: '预计日期', expected: '预计返点', confirmDate: '返点确认日期', confirmed: '已确认返点', variance: '确认与预计差额', confirmation: '返点确认单号', offset: '已冲抵', cash: '已收回', realized: '已实现返点', remaining: '未结清返点', allocated: '已分配返点', unallocated: '未分配返点', status: '状态', calculation: '预计依据', issue: '数据差异', rebate: '返点记录号', tour: '分配团期', productCompany: '产品公司', originalPeriod: '原业务期间', accountingPeriod: '会计期间', treatment: '财务处理', costRecord: '成本调整记录', costImpact: '已确认成本影响', kind: '实现方式', reference: '冲抵／收款单号' };
  const amountKeys = new Set(['amount', 'purchaseAmount', 'billAmount', 'expected', 'confirmed', 'variance', 'offset', 'cash', 'realized', 'remaining', 'allocated', 'unallocated', 'costImpact']);
  const columns = {
    summary: ['rank', 'name', 'count', 'quantity', 'amount', 'share', 'missing'],
    purchases: ['contract', 'line', 'supplier', 'company', 'department', 'category', 'date', 'quantity', 'quantityUnit', 'amount'],
    rebates: ['id', 'supplier', 'company', 'status', 'expected', 'confirmed', 'offset', 'cash', 'remaining', 'unallocated'],
    allocations: ['id', 'rebate', 'tour', 'productCompany', 'department', 'date', 'amount', 'treatment', 'costImpact', 'costRecord']
  };
  const extras = {
    summary: ['currency'],
    purchases: ['id', 'type', 'relation', 'related', 'purchaseDate', 'billNo', 'billDate', 'purchaseAmount', 'billAmount', 'tax', 'currency', 'rate', 'evidence', 'owner', 'tours', 'version', 'source'],
    rebates: ['agreement', 'period', 'expectedDate', 'confirmDate', 'confirmation', 'variance', 'realized', 'allocated', 'calculation', 'tax', 'currency', 'issue'],
    allocations: ['supplier', 'company', 'agreement', 'confirmation', 'originalPeriod', 'accountingPeriod', 'evidence', 'currency']
  };
  let applied = { ...m.defaults }, view = 'summary', result, optional = new Set(), page = 1, size = 10, sort = '', direction = 1;
  const isPurchase = () => view === 'summary' || view === 'purchases';
  const select = (name, label, options, value) => '<label class="report-field"><span>' + label + '</span><select name="' + name + '">' + options.map(([v, t]) => '<option value="' + esc(v) + '"' + (v === value ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select></label>';
  const choices = key => [['', '全部'], ...[...new Set([...m.purchases, ...m.gaps].map(r => r[key]).filter(Boolean))].map(v => [v, v])];
  function filters() {
    const purchase = isPurchase();
    root.querySelector('[data-filter-fields]').innerHTML = '<div class="report-filter-row">' +
      (view !== 'allocations' ? select('basis', '日期与金额依据', purchase ? [['purchase', '采购确认'], ['bill', '账单确认']] : [['expected', '返点预计日期'], ['confirmed', '返点确认日期']], applied.basis) : '') +
      ['start', 'end'].map(k => '<label class="report-field"><span>' + (k === 'start' ? '开始日期' : '结束日期') + '</span><input type="date" name="' + k + '" value="' + applied[k] + '" required></label>').join('') +
      select('company', '采购公司', choices('company'), applied.company) + select('currency', '原币', [['CNY', '人民币'], ['EUR', '欧元']], applied.currency) +
      select('unit', '金额单位', [['wan', '万元／万原币'], ['yuan', '元／原币']], applied.unit) + '</div><details class="report-more"><summary>更多筛选</summary><div class="report-filter-row">' +
      select('supplier', '供应商', [['', '全部'], ...[...new Map([...m.purchases, ...m.gaps].map(r => [r.supplierId, [r.supplierId, r.supplier + (r.supplierId === 'S2' ? ' · 华北' : r.supplierId === 'S8' ? ' · 华东' : '')]])).values()]], applied.supplier) +
      select('relation', '集团内外', [['外部', '外部'], ['内部', '内部'], ['待确认', '待确认'], ['', '全部（不抵销）']], applied.relation) +
      (purchase ? select('department', '产品部门', [...choices('department'), ['__missing', '待补充']], applied.department) + select('category', '采购类别', choices('category'), applied.category) + select('type', '采购用途', choices('type'), applied.type) +
        select('dataset', '资料范围', [['standard', '基础采购算例'], ['gaps', '含缺数算例']], applied.dataset) + select('quality', '资料缺口', [['', '全部'], ['amount', '金额待补'], ['department', '产品部门待补']], applied.quality) : '') +
      '<label class="report-field report-field-wide"><span>' + (purchase ? '供应商／采购单／账单／团期' : '返点记录／协议／确认单／团期') + '</span><input type="search" name="keyword" value="' + esc(applied.keyword) + '"></label></div></details>' +
      (view === 'summary' ? '<div class="report-filter-row">' + select('grouping', '汇总方式', [['supplier', '供应商'], ['company', '采购公司'], ['department', '公司与产品部门'], ['category', '采购类别'], ['month', '确认月份']], applied.grouping) + '</div>' : '');
  }
  function display(r, k) {
    const v = r[k];
    if (amountKeys.has(k)) return m.known(v) ? (v / (applied.unit === 'wan' ? 10000 : 1)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '待确认';
    if (k === 'share') return m.known(v) ? v.toFixed(2) + '%' : '无法计算';
    if (k === 'rank') return v == null ? '待排' : String(v);
    return v == null || v === '' ? '未提供' : String(v);
  }
  function coverageText(c) { return (c.missing && m.known(c.amount) ? '已知 ' : '') + display(c, 'amount') + (c.missing ? '（' + c.missing + ' 条待确认）' : ''); }
  const currentColumns = () => [...columns[applied.view], ...optional];
  const sorted = () => [...(applied.view === 'summary' ? result.groups : result.rows)].sort((a, b) => !sort ? 0 : a[sort] == null ? 1 : b[sort] == null ? -1 : (m.known(a[sort]) && m.known(b[sort]) ? a[sort] - b[sort] : String(a[sort]).localeCompare(String(b[sort]), 'zh-CN')) * direction);
  function columnLabel(key, context = applied.view) {
    if (key === 'amount' && context === 'allocations') return '分配返点金额';
    if (key === 'amount' && context === 'receipts') return '实现返点金额';
    if (key === 'date' && context === 'allocations') return '分配确认日期';
    if (key === 'date' && context === 'receipts') return '实现确认日期';
    if (key === 'name' && context === 'summary') return '汇总项目';
    return labels[key];
  }
  function table(rows, cols, title, sortable = false, context = applied.view) {
    return '<div class="report-table-scroll" tabindex="0" role="region" aria-label="' + title + '"><table class="report-table"><thead><tr>' + cols.map(k => '<th' + (sortable ? ' aria-sort="' + (sort === k ? direction === 1 ? 'ascending' : 'descending' : 'none') + '"' : '') + '>' + (sortable ? '<button type="button" data-sort="' + k + '">' + esc(columnLabel(k, context)) + icon('arrow-up-down') + '</button>' : esc(columnLabel(k, context))) + '</th>').join('') + '</tr></thead><tbody>' +
      (rows.length ? rows.map(r => '<tr>' + cols.map(k => '<td class="' + (amountKeys.has(k) || ['rank', 'share', 'count', 'missing'].includes(k) ? 'report-numeric' : 'spr-text') + (m.known(r[k]) && r[k] < 0 ? ' report-negative' : '') + '">' + esc(display(r, k)) + '</td>').join('') + '</tr>').join('') : '<tr><td colspan="' + cols.length + '"><p class="report-empty">当前条件无记录</p></td></tr>') + '</tbody></table></div>';
  }
  function totalText() {
    if (applied.view === 'rebates') return '共 ' + result.rows.length + ' 笔返点 · 已确认 ' + coverageText(result.total.confirmed) + ' · 未结清 ' + coverageText(result.total.remaining);
    if (applied.view === 'allocations') return '共 ' + result.rows.length + ' 笔分配 · 分配额 ' + coverageText(result.total) + ' · 成本影响 ' + coverageText(result.cost);
    return '共 ' + result.rows.length + ' 条采购 · ' + result.ranking.length + ' 家供应商 · 采购额 ' + coverageText(result.total);
  }
  function render() {
    result = m.run(applied);
    const rows = sorted(), pages = Math.max(1, Math.ceil(rows.length / size)); page = Math.min(page, pages);
    const purchase = ['summary', 'purchases'].includes(applied.view);
    root.querySelector('[data-meta]').textContent = '独立演示资料 · 非正式采购数据 · 截止 ' + m.cutoff + ' · V1 · ' + m.views[applied.view] + ' · ' + applied.start + ' 至 ' + applied.end + ' · ' + (applied.company || '全部采购公司') + ' · ' + (applied.relation || '内外合计，不抵销') + ' · ' + applied.currency + (applied.unit === 'wan' ? ' / 万原币' : ' / 原币') + ' · ' + (purchase ? applied.basis === 'bill' ? '账单确认口径' : '采购确认口径' : applied.view === 'allocations' ? '分配确认日期' : applied.basis === 'confirmed' ? '返点确认日期' : '返点预计日期');
    const metrics = purchase ? [['所选采购额', coverageText(result.total)], ['采购数量', result.quantity], ['前十供应商采购额', result.rankReady ? coverageText(result.top) : '金额待齐，暂不排名'], ['其他供应商采购额', result.rankReady ? coverageText(result.other) : '金额待齐，暂不排名']] : applied.view === 'rebates' ? [['预计返点', coverageText(result.total.expected)], ['已确认返点', coverageText(result.total.confirmed)], ['已实现返点', coverageText(result.total.realized)], ['未结清返点', coverageText(result.total.remaining)]] : [['分配返点', coverageText(result.total)], ['已确认成本影响', coverageText(result.cost)]];
    root.querySelector('[data-metrics]').innerHTML = metrics.map(([label, value]) => '<dl class="report-metric"><dt>' + label + '</dt><dd' + (label === '采购数量' ? ' class="spr-quantity"' : '') + '>' + esc(value) + '</dd></dl>').join('');
    root.querySelector('[data-result]').innerHTML = '<div class="report-section-head"><h2>' + m.views[applied.view] + '</h2><span data-total>' + totalText() + '</span></div>' +
      (!purchase ? '<p class="spr-context">' + (applied.view === 'rebates' ? '日期筛选选取返点记录；确认、实现和剩余金额均截至 ' + m.cutoff + '，不是所选结束日历史余额。' : '仅展示所选期间确认的分配；成本影响引用已有调整，不再次冲减团期成本。') + '</p>' : '') +
      '<details class="report-columns"><summary>显示字段</summary><div class="report-column-options">' + extras[applied.view].map(k => '<label><input type="checkbox" data-column="' + k + '"' + (optional.has(k) ? ' checked' : '') + '>' + labels[k] + '</label>').join('') + '</div></details>' +
      table(rows.slice((page - 1) * size, page * size), currentColumns(), '供应商分析结果', true) +
      '<div class="report-total"><span>共 ' + rows.length + ' 行 · 全查询合计</span><div class="report-pagination">' + select('size', '每页', [['5', '5'], ['10', '10'], ['20', '20']], String(size)) + button(icon('chevron-left'), 'data-page="-1" title="上一页" aria-label="上一页"' + (page === 1 ? ' disabled' : '')) + '<span>' + page + ' / ' + pages + '</span>' + button(icon('chevron-right'), 'data-page="1" title="下一页" aria-label="下一页"' + (page === pages ? ' disabled' : '')) + '</div></div>' +
      (applied.view === 'summary' ? '<details class="spr-source"><summary>前十与其他及完整采购依据</summary>' + table(result.rankReady ? [...result.ranking.slice(0, 10), { name: '其他供应商', amount: result.other.amount, rank: '', count: result.rows.filter(r => result.ranking.slice(10).some(g => g.supplierId === r.supplierId)).length }] : result.ranking, ['rank', 'name', 'amount', 'missing'], '前十与其他') + table(result.rows, [...columns.purchases, ...extras.purchases], '完整采购依据') + '</details>' : '') +
      (applied.view === 'rebates' ? '<details class="spr-source"><summary>完整返点依据及实现记录</summary>' + table(result.rows, [...columns.rebates, ...extras.rebates], '返点确认依据') + table(result.receipts, ['id', 'rebate', 'date', 'kind', 'amount', 'reference', 'company', 'currency'], '返点实现记录', false, 'receipts') + '</details>' : '');
  }
  root.innerHTML = '<header class="report-head"><h1>供应商采购与返点</h1>' + button(icon('download') + '导出', 'data-export title="导出全查询结果及完整依据"') + '</header>' +
    '<div class="report-tabbar" role="tablist" aria-label="供应商分析视图">' + Object.entries(m.views).map(([k, text]) => '<button type="button" class="report-tab" role="tab" data-view="' + k + '" aria-selected="' + (view === k) + '">' + text + '</button>').join('') + '</div>' +
    '<form class="report-filters"><div data-filter-fields></div><div class="report-query-actions"><button type="submit" class="report-button">查询</button>' + button('重置', 'data-reset') + '</div><p data-status class="report-query-status" role="status">已查询</p><p class="report-error" data-error role="alert" hidden></p></form>' +
    '<div class="report-meta" data-meta></div><div class="report-metrics" data-metrics></div><section class="report-section" data-result></section>' +
    '<section class="report-note"><h2>数据口径</h2><p>采购确认与账单确认分别统计，不相加；金额均为演示价税合计，付款、预付与收票不替代采购。数量按原单位分列，金额按单一币种比较。默认仅看外部供应商，关联方不等于集团内部。</p><p>供应商按独立身份汇总，同名不合并；金额缺失时不出完整排名和占比。前十按采购金额降序，同额按演示身份固定顺序，其他金额保留。采购量的正式考核定义、集团范围和排名规则待确认。</p><p>预计返点不计确认额，确认、冲抵、收回与团期分配分别核对；已知零值保留，缺确认不置零。返点的财务处理、税额、正式取数和权限仍待确认。本页不修改采购、账单或团期利润。</p></section>';
  filters(); render();
  const dirty = () => { root.querySelector('[data-status]').textContent = '条件已修改，尚未查询；下方保留上次结果'; };
  root.addEventListener('input', e => { if (e.target.closest('form')) dirty(); });
  root.addEventListener('submit', e => {
    e.preventDefault(); const next = { ...applied, ...Object.fromEntries(new FormData(e.target)), view };
    const error = m.validate(next), el = root.querySelector('[data-error]'); el.hidden = !error; el.textContent = error;
    if (error) return;
    if (next.view !== applied.view) { optional.clear(); sort = ''; }
    applied = next; page = 1; render(); root.querySelector('[data-status]').textContent = '已查询';
  });
  root.addEventListener('change', e => {
    if (e.target.name === 'size') { size = +e.target.value; page = 1; render(); }
    if (e.target.dataset.column) { e.target.checked ? optional.add(e.target.dataset.column) : optional.delete(e.target.dataset.column); render(); root.querySelector('.report-columns').open = true; }
  });
  root.addEventListener('click', e => {
    const el = e.target.closest('button'); if (!el) return;
    if (el.dataset.view) {
      // Keep pending controls separate from the last queried result and export.
      const previous = applied; const draft = { ...applied, ...Object.fromEntries(new FormData(root.querySelector('form'))) };
      const wasPurchase = isPurchase(); view = el.dataset.view;
      applied = { ...draft, basis: wasPurchase === isPurchase() ? draft.basis : isPurchase() ? 'purchase' : 'expected' };
      if (!isPurchase()) Object.assign(applied, { department: '', category: '', type: '', quality: '' });
      filters(); applied = previous;
      root.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.view === view))); dirty();
    }
    if (el.hasAttribute('data-reset')) {
      applied = { ...m.defaults, view, basis: isPurchase() ? 'purchase' : 'expected' }; optional.clear(); page = 1; sort = ''; filters(); render();
      root.querySelector('[data-error]').hidden = true; root.querySelector('[data-status]').textContent = '已查询';
    }
    if (el.dataset.sort) { direction = sort === el.dataset.sort ? -direction : 1; sort = el.dataset.sort; render(); }
    if (el.dataset.page) { page += +el.dataset.page; render(); }
    if (el.hasAttribute('data-export')) {
      const cols = currentColumns(), purchase = ['summary', 'purchases'].includes(applied.view);
      const lines = [['供应商采购与返点', m.views[applied.view], '独立演示资料，非正式业务取数'], ['资料截止', m.cutoff, 'V1'],
        ['日期依据', purchase ? applied.basis === 'bill' ? '账单确认' : '采购确认' : applied.view === 'allocations' ? '分配确认日期' : applied.basis === 'confirmed' ? '返点确认日期' : '返点预计日期'],
        ['开始日期', applied.start], ['结束日期', applied.end], ['币种', applied.currency], ['金额单位', applied.unit === 'wan' ? '万原币' : '原币'],
        ['采购公司', applied.company || '全部'], ['集团内外', applied.relation || '全部（不抵销）'], ['供应商', applied.supplier || '全部'], ['搜索', applied.keyword],
        ...(purchase ? [['产品部门', applied.department === '__missing' ? '待补充' : applied.department || '全部'], ['采购类别', applied.category || '全部'], ['采购用途', applied.type || '全部'], ['资料范围', applied.dataset === 'gaps' ? '含缺数算例' : '基础采购算例'], ['资料缺口', { amount: '金额待补', department: '部门待补' }[applied.quality] || '全部'], ['汇总方式', { supplier: '供应商', company: '采购公司', department: '公司与产品部门', category: '采购类别', month: '确认月份' }[applied.grouping]]] : [['金额时点', m.cutoff + '，非所选结束日余额']]),
        ['全查询合计', totalText()], [], cols.map(k => columnLabel(k)), ...sorted().map(r => cols.map(k => display(r, k)))];
      if (purchase) {
        lines.push([], ['前十与其他', result.rankReady ? '金额排名' : '金额待齐，暂不排名'], ['前十金额', result.rankReady ? coverageText(result.top) : '待确认'], ['其他金额', result.rankReady ? coverageText(result.other) : '待确认']);
      }
      const full = applied.view === 'summary' ? [...columns.purchases, ...extras.purchases] : [...columns[applied.view], ...extras[applied.view]];
      lines.push([], ['完整依据'], full.map(k => columnLabel(k, applied.view === 'summary' ? 'purchases' : applied.view)), ...result.rows.map(r => full.map(k => display(r, k))));
      if (applied.view === 'rebates') {
        const receiptCols = ['id', 'rebate', 'date', 'kind', 'amount', 'reference', 'company', 'currency'];
        lines.push([], ['返点实现记录'], receiptCols.map(k => columnLabel(k, 'receipts')), ...result.receipts.map(r => receiptCols.map(k => display(r, k))));
      }
      const url = URL.createObjectURL(new Blob(['\uFEFF' + lines.map(row => row.map(report.csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = '供应商-' + m.views[applied.view] + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });
})();
