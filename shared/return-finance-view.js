(function (root) {
  'use strict';
  root.mountReturnFinance = function (host, report, assets, config = {}) {
    const m = root.CaesarReturnFinance;
    const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const icon = name => '<img class="report-icon" alt="" src="' + assets + name + '.svg">';
    const allNames = { completion: '完成业务核对', flows: '确认发生明细' };
    const names = config.mode ? { [config.mode]: allNames[config.mode] } : allNames;
    const labels = { dataset: '资料范围', mode: '查询方式', dateBasis: '日期依据', start: '开始日期', end: '结束日期', periodStart: '会计期间开始', periodEnd: '会计期间结束', cutoff: '资料截止', unit: '金额单位', scenario: '业务场景',
      order: '订单号', product: '销售内容', item: '销售内容号', service: '团号/服务单号', actual: '实际完成日', planned: '计划完成日', plannedStart: '计划开始日', actualStart: '实际开始日', completionType: '完成类型', completionQuantity: '完成数量', completionUnit: '数量单位', allocationBasis: '成交金额分配依据', entity: '核算主体', book: '账簿', businessRevenue: '业务结算收入', income: '财务确认收入', cost: '已结转成本', incomeStatus: '收入确认情况', costStatus: '成本确认情况', gap: '资料缺口', reference: '原单及分配依据',
      id: '确认记录号', kind: '确认类型', period: '会计期间', date: '财务确认日期', completionRecord: '销售内容/完成记录', change: '原确认/调整', amount: '本次确认金额', allocationState: '分配情况', original: '原记录号',
      record: '完成记录号', completionBasis: '完成依据', confirmedBy: '履约确认人', confirmedAt: '履约确认时间', originalActual: '原完成日', correctionReason: '日期更正原因', correctedAt: '更正记录时间', referenceAmount: '已分配成交参考',
      company: '销售公司', salesDivision: '销售事业部', salesDepartment: '销售部门', salesLeader: '销售部门领导', store: '门店', center: '呼叫中心', salesGroup: '销售组', salesperson: '销售人员', productCompany: '产品经营公司', division: '产品事业部', productOrg: '产品经营组', owner: '产品负责人', confirmationOwner: '确认人', productOwner: '产品负责人', productLeader: '产品部门领导', channel: '主成交渠道', travel: '旅游范围', supply: '供应关系', destination: '目的地', geographyZone: '地理目的地分区', managementZone: '管理目的地分区', business: '业务线', supplier: '供应商', contractCompany: '签约公司', ownership: '发生时归属',
      settlementNo: '业务结算单号', settlementDate: '结算确认日期', incomeRecord: '收入确认记录', incomeDate: '收入确认日期', incomePeriod: '收入会计期间', costRecord: '成本结转记录', costDate: '成本结转日期', costPeriod: '成本会计期间', difference: '确认收入减已结转成本',
      source: '来源系统', currency: '币种', basis: '金额口径', method: '收入方式', tax: '税务处理', taxEvidence: '价税确认依据', gross: '价税合计', taxAmount: '税额', rate: '折算汇率', estimate: '暂估', effective: '确认生效时间', recorded: '资料记录时间', evidence: '确认/分配依据', status: '来源确认状态', reason: '调整原因', originalPeriod: '原会计期间', reversal: '暂估冲回', settlesEstimate: '原暂估记录', partner: '内部交易对方', internal: '内部交易',
      duplicates: '同源重传次数', conflicts: '冲突来源金额', confirmation: '原确认明细号', target: '完成记录号', originalAmount: '原确认金额（仅核对）', unallocatedAmount: '来源未分配额（仅核对）', allocated: '本项分配金额', state: '分配核对情况', allocation: '分配记录号', quality: '资料情况' };
    const bases = {
      completion: ['order', 'product', 'service', 'actual', 'entity', 'businessRevenue', 'income', 'cost', 'incomeStatus', 'costStatus', 'gap', 'reference'],
      flows: ['id', 'kind', 'entity', 'period', 'date', 'order', 'completionRecord', 'change', 'amount', 'allocationState', 'original', 'gap']
    };
    const groups = {
      '完成与来源': ['item', 'record', 'completionType', 'completionQuantity', 'completionUnit', 'plannedStart', 'actualStart', 'planned', 'completionBasis', 'confirmedBy', 'confirmedAt', 'originalActual', 'correctionReason', 'correctedAt', 'referenceAmount', 'allocationBasis', 'source', 'ownership'],
      '经营归属': ['company', 'salesDivision', 'salesDepartment', 'salesLeader', 'store', 'center', 'salesGroup', 'salesperson', 'contractCompany', 'productCompany', 'division', 'productOrg', 'productOwner', 'productLeader', 'channel', 'travel', 'supply', 'destination', 'geographyZone', 'managementZone', 'business', 'supplier'],
      '结算与确认': ['settlementNo', 'settlementDate', 'incomeRecord', 'incomeDate', 'incomePeriod', 'costRecord', 'costDate', 'costPeriod', 'difference', 'originalPeriod', 'reason', 'estimate', 'settlesEstimate', 'effective', 'recorded'],
      '核算与价税': ['book', 'currency', 'basis', 'method', 'tax', 'taxEvidence', 'gross', 'taxAmount', 'rate', 'internal', 'partner']
    };
    const money = new Set(['businessRevenue', 'income', 'cost', 'difference', 'amount', 'originalAmount', 'unallocatedAmount', 'allocated', 'gross', 'taxAmount', 'referenceAmount']);
    let mode = config.mode || 'completion', result;
    const states = Object.fromEntries(Object.keys(names).map(k => [k, { applied: { ...m.defaults, mode: k }, draft: { ...m.defaults, mode: k }, extras: new Set(), page: 1, size: 10, sort: '', direction: 1, dirty: false }]));
    const state = () => states[mode];
    function display(row, key) {
      const v = key === 'productOwner' ? row.productOwner || row.owner : key === 'referenceAmount' ? row.referenceAmount ?? (mode === 'completion' ? row.amount : null) : row[key];
      if (money.has(key)) return m.known(v) ? (v / (state().applied.unit === 'wan' ? 10000 : 1)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + (key === 'amount' && row.currency ? ' ' + row.currency : '') : key === 'difference' ? '无法计算' : '未提供';
      if (key === 'kind') return m.kinds[v] || '未提供';
      if (['estimate', 'reversal', 'internal'].includes(key)) return v === true ? '是' : v === false ? '否' : '未提供';
      if (['company', 'productCompany'].includes(key)) return v ? v + '公司（演示）' : '未归属';
      if (Array.isArray(v)) return v.join('；') || '无';
      return v == null || v === '' ? (key === 'gap' ? '无' : '未提供') : String(v);
    }
    const header = k => (['gross', 'taxAmount'].includes(k) ? '原确认' + labels[k] + '（仅核对）' : labels[k]) + (money.has(k) ? '（' + (state().applied.unit === 'wan' ? '万原币' : '原币') + '）' : '');
    function select(k, options) { return '<label class="report-field"><span>' + labels[k] + '</span><select name="' + k + '">' + options.map(([v, t]) => '<option value="' + esc(v) + '"' + (state().draft[k] === v ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select></label>'; }
    function input(k, type) { return '<label class="report-field"><span>' + labels[k] + '</span><input name="' + k + '" type="' + type + '" value="' + esc(state().draft[k]) + '"' + (type !== 'text' ? ' required' : '') + (k === 'cutoff' && state().draft.dataset === 'common' ? ' readonly' : '') + '></label>'; }
    function options(k) {
      const d = m.fixtures(), c = m.common(report);
      const rows = m.businessFields.includes(k) ? [...d.completions, ...c.completions] : [...d.completions, ...d.records, ...c.completions];
      const values = [...new Set(rows.map(r => r[k]).filter(Boolean))].sort();
      return [['', '全部'], ...values.map(v => [v, ['company', 'productCompany'].includes(k) ? v + '公司（演示）' : v]), ['__missing', '未归属/未提供']];
    }
    function form() {
      const draft = state().draft;
      host.querySelector('[data-rf-modes]').innerHTML = Object.entries(names).map(([k, v]) => '<button type="button" class="report-tab" data-rf-mode="' + k + '" aria-pressed="' + (mode === k) + '">' + v + '</button>').join('');
      host.querySelector('[data-rf-modes]').hidden = Boolean(config.mode);
      host.querySelector('[data-rf-form]').innerHTML = '<div class="report-filter-row">' + select('dataset', [['common', '共同回团资料'], ['demo', '独立财务算例']]) +
        (mode === 'flows' ? select('dateBasis', [['period', '会计期间'], ['date', '财务确认日期']]) : '') +
        (mode === 'flows' && draft.dateBasis === 'period' ? input('periodStart', 'month') + input('periodEnd', 'month') : input('start', 'date') + input('end', 'date')) + input('cutoff', 'date') + '</div>' +
        '<div class="report-filter-row report-more">' + select('entity', options('entity')) + select('quality', [['', '全部'], ['missing', '资料缺口'], ...(mode === 'flows' ? [['unassigned', '未归属/未分配']] : []), ['conflict', '来源或分配冲突']]) +
        (draft.dataset === 'demo' ? select('scenario', [['', '全部场景'], ...Object.entries(m.scenarios)]) : '') + select('unit', [['yuan', '元'], ['wan', '万元']]) + '</div>' +
        '<details class="report-more"><summary>更多筛选</summary><div class="report-filter-row">' + input('order', 'text') +
        (mode === 'flows' ? select('kind', [['', '收入与成本分别列示'], ['income', '收入确认'], ['cost', '成本结转']]) + select('change', [['', '全部'], ['原确认', '原确认'], ['调整', '调整']]) : '') +
        ['company', 'salesDivision', 'salesDepartment', 'salesLeader', 'store', 'center', 'salesGroup', 'salesperson', 'productCompany', 'division', 'productOrg', 'owner', 'productLeader', 'channel', 'travel', 'supply', 'destination', 'geographyZone', 'managementZone', 'business', 'supplier', 'currency', 'method', 'tax'].map(k => select(k, options(k))).join('') + '</div></details>' +
        '<div class="report-query-actions"><button type="submit" class="report-button">查询</button><button type="button" class="report-button" data-rf-reset>重置</button><span role="status" data-rf-status>' + (state().dirty ? '条件已修改，尚未查询' : '已查询') + '</span></div><p role="alert" class="report-error" data-rf-error hidden></p>';
    }
    function columns() { return [...bases[mode], ...state().extras].filter((v, i, a) => a.indexOf(v) === i); }
    function sorted() {
      const s = state();
      return [...result.rows].sort((a, b) => { const av = a[s.sort], bv = b[s.sort]; if (av == null || bv == null) return av == null ? bv == null ? 0 : 1 : -1; return (typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv), 'zh-CN')) * s.direction; });
    }
    function table(rows, cols, title, sortable = false) {
      return '<div class="report-table-scroll rf-scroll" tabindex="0" aria-label="' + title + '"><table class="report-table rf-table"><thead><tr>' + cols.map(k => '<th' + (sortable ? ' aria-sort="' + (state().sort === k ? state().direction > 0 ? 'ascending' : 'descending' : 'none') + '"' : '') + '>' + (sortable ? '<button type="button" data-rf-sort="' + k + '">' + esc(header(k)) + icon('arrow-up-down') + '</button>' : esc(header(k))) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(r => '<tr>' + cols.map(k => {
        const short = money.has(k) || ['id', 'order', 'service', 'actual', 'date', 'period'].includes(k);
        const value = display(r, k);
        return '<td class="' + (short ? 'rf-short' : 'rf-text') + '">' + (k === 'gap' && sortable ? '<div class="rf-gap" title="' + esc(value) + '">' + (value.split('；').slice(0, 2).concat(value.split('；').length > 2 ? ['另有' + (value.split('；').length - 2) + '项缺口'] : [])).map(t => '<span>' + esc(t) + '</span>').join('') + '</div>' : esc(value)) + '</td>';
      }).join('') + '</tr>').join('') + '</tbody></table>' + (!rows.length ? '<p class="report-empty">' + (result.noFinancialSource && mode === 'flows' ? '未提供收入确认或成本结转记录' : '当前条件无记录') + '</p>' : '') + '</div>';
    }
    function sourceRows() { return result.records.map(r => ({ ...r, confirmationOwner: r.owner, status: r.valid ? r.status || '已确认（算例）' : r.gaps.join('；'), gap: r.gaps.join('；'), conflicts: r.gaps.some(v => v.includes('同源')) ? r.variants.map(v => v.amount).join(' / ') : '', change: r.adjustment ? '调整' : '原确认' })); }
    const sourceCols = ['id', 'kind', 'source', 'entity', 'book', 'period', 'date', 'effective', 'recorded', 'amount', 'currency', 'basis', 'status', 'original', 'originalPeriod', 'change', 'reason', 'method', 'tax', 'taxEvidence', 'gross', 'taxAmount', 'estimate', 'reversal', 'settlesEstimate', 'internal', 'partner', 'confirmationOwner', 'evidence', 'duplicates', 'conflicts'];
    const allocationCols = ['allocation', 'confirmation', 'kind', 'entity', 'originalAmount', 'order', 'product', 'target', 'allocated', 'currency', 'unallocatedAmount', 'state', 'evidence', 'confirmationOwner', 'effective', 'recorded'];
    const allocationRows = () => result.allocations.map(r => ({ ...r, allocation: r.id, confirmationOwner: r.owner, allocated: r.amount }));
    function totalText() {
      return mode === 'completion' ? result.orders + ' 个订单 · ' + result.count + ' 条已完成记录 · 成交参考 ' + display({ referenceAmount: result.referenceAmount }, 'referenceAmount') + ' · 资料缺口 ' + result.missing + ' 条' : result.sourceCount + ' 笔确认 · ' + result.count + ' 条发生分配 · 待核对来源 ' + result.conflicts + ' 笔';
    }
    function groupText(g) { return [g.entity, g.book, g.currency, g.basis, m.kinds[g.kind], display(g, 'amount')].join(' · '); }
    function render() {
      const s = state(); result = m.run(s.applied, report);
      const f = s.applied, period = mode === 'completion' ? '实际完成日期 ' + f.start + ' 至 ' + f.end + ' · 累计确认截至 ' + f.cutoff : f.dateBasis === 'period' ? '会计期间 ' + f.periodStart + ' 至 ' + f.periodEnd : '财务确认日期 ' + f.start + ' 至 ' + f.end;
      host.querySelector('[data-rf-meta]').textContent = (f.dataset === 'demo' ? '独立财务算例 V1' : '共同回团资料 V1') + ' · ' + period + ' · 资料截止 ' + f.cutoff + ' 日终 · ' + (f.unit === 'wan' ? '万元' : '元') + ' · 正式财务口径待确认';
      const pages = Math.max(1, Math.ceil(result.count / s.size)); s.page = Math.min(s.page, pages);
      host.querySelector('[data-rf-results]').innerHTML = '<div class="report-section-head"><h2>' + names[mode] + '</h2><span data-rf-total>' + esc(totalText()) + '</span></div>' +
        '<details class="report-columns"><summary>显示字段</summary><div class="report-order-column-groups">' + Object.entries(groups).map(([name, cols]) => '<fieldset><legend>' + name + '</legend><div class="report-column-options">' + cols.filter(k => !bases[mode].includes(k)).map(k => '<label><input type="checkbox" data-rf-column="' + k + '"' + (s.extras.has(k) ? ' checked' : '') + '>' + labels[k] + '</label>').join('') + '</div></fieldset>').join('') + '</div></details>' +
        table(sorted().slice((s.page - 1) * s.size, s.page * s.size), columns(), '财务确认主表', true) +
        '<div class="report-total"><span>全查询 ' + result.count + ' 条 · 金额按核算主体、账簿、原币及口径分列</span><div class="report-pagination"><select aria-label="每页条数" data-rf-size>' + [5, 10, 20, 50].map(v => '<option value="' + v + '"' + (s.size === v ? ' selected' : '') + '>' + v + '条/页</option>').join('') + '</select>' + [-1, 1].map(v => '<button class="report-button report-icon-button" type="button" data-rf-page="' + v + '" aria-label="' + (v < 0 ? '上一页' : '下一页') + '" title="' + (v < 0 ? '上一页' : '下一页') + '"' + ((v < 0 && s.page === 1) || (v > 0 && s.page === pages) ? ' disabled' : '') + '>' + icon(v < 0 ? 'chevron-left' : 'chevron-right') + '</button>').join('<span>' + s.page + ' / ' + pages + '</span>') + '</div></div>' +
        '<div class="rf-totals" data-rf-amounts><h3>确认金额分项合计</h3>' + (result.totals.length ? result.totals.map(g => '<p>' + esc(groupText(g)) + '</p>').join('') : '<p>财务确认收入：未提供 · 已结转成本：未提供</p>') + '<p>所选主体分列，未抵销 · 来源缺口 ' + result.conflicts + ' 笔 · 完成业务资料缺口 ' + result.missing + ' 条</p>' + (result.unassigned.length ? '<h3>所选核算范围未归属/未分配</h3>' + result.unassigned.map(g => '<p>' + esc(groupText(g)) + '</p>').join('') : '') + '</div>' +
        '<section class="rf-evidence"><h3>原确认与调整依据 <span>' + result.records.length + '笔</span></h3>' + table(sourceRows(), sourceCols, '原确认与调整依据') + '</section><section class="rf-evidence"><h3>金额分配依据 <span>' + result.allocations.length + '条</span></h3>' + table(allocationRows(), allocationCols, '金额分配依据') + '</section>';
    }
    function exportResult() {
      const f = state().applied;
      const rows = [['回团财务确认', names[mode], '演示资料，非正式财务结果'], ['查询摘要', host.querySelector('[data-rf-meta]').textContent], ['查询结果', totalText()], ['统计范围', '核算主体、账簿、币种及口径分列，未抵销'], ['规则状态', 'RPT-17及财务政策待确认'], ...Object.entries(f).filter(([k, v]) => v && labels[k] && !['mode', 'start', 'end', 'periodStart', 'periodEnd'].includes(k)).map(([k, v]) => [labels[k], v]), [], columns().map(header), ...sorted().map(r => columns().map(k => display(r, k))), [], ['确认金额分项合计'], ...result.totals.map(g => [groupText(g)]), [], ['所选核算范围未归属/未分配'], ...result.unassigned.map(g => [groupText(g)]), [], ['原确认与调整依据'], sourceCols.map(header), ...sourceRows().map(r => sourceCols.map(k => display(r, k))), [], ['金额分配依据'], allocationCols.map(header), ...allocationRows().map(r => allocationCols.map(k => display(r, k)))];
      const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(r => r.map(report.csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = '回团财务确认-' + names[mode] + '-演示V1.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    host.innerHTML = '<div class="rf-modes" role="group" aria-label="财务查询方式" data-rf-modes></div><form class="report-filters" data-rf-form></form><div class="report-meta" data-rf-meta></div><section class="report-section" data-rf-results></section>';
    function saveDraft() { state().draft = { ...state().draft, ...Object.fromEntries(new FormData(host.querySelector('form'))) }; }
    host.addEventListener('input', e => { if (e.target.closest('form')) { state().dirty = true; host.querySelector('[data-rf-status]').textContent = '条件已修改，尚未查询'; } });
    host.addEventListener('change', e => {
      if (e.target.closest('form')) {
        saveDraft(); state().dirty = true; host.querySelector('[data-rf-status]').textContent = '条件已修改，尚未查询';
        if (e.target.name === 'dataset') { const demo = e.target.value === 'demo'; state().draft = { ...m.defaults, mode, dataset: e.target.value, end: demo ? '2026-06-30' : m.defaults.end, periodEnd: demo ? '2026-06' : m.defaults.periodEnd, cutoff: demo ? '2026-06-30' : m.defaults.cutoff }; form(); }
        if (e.target.name === 'dateBasis') form();
      }
      if (e.target.dataset.rfColumn) { const k = e.target.dataset.rfColumn; e.target.checked ? state().extras.add(k) : state().extras.delete(k); render(); host.querySelector('.report-columns').open = true; }
      if (e.target.hasAttribute('data-rf-size')) { state().size = Number(e.target.value); state().page = 1; render(); }
    });
    host.addEventListener('submit', e => {
      e.preventDefault(); saveDraft(); const error = m.validate(state().draft), el = host.querySelector('[data-rf-error]'); el.textContent = error; el.hidden = !error;
      if (error) return; state().applied = { ...state().draft }; state().page = 1; state().dirty = false; render(); host.querySelector('[data-rf-status]').textContent = '已查询';
    });
    host.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.rfMode) { saveDraft(); mode = b.dataset.rfMode; form(); render(); }
      if (b.hasAttribute('data-rf-reset')) { const f = { ...m.defaults, mode }; states[mode] = { applied: f, draft: { ...f }, extras: new Set(), page: 1, size: 10, sort: '', direction: 1, dirty: false }; form(); render(); }
      if (b.dataset.rfSort) { state().direction = state().sort === b.dataset.rfSort ? -state().direction : 1; state().sort = b.dataset.rfSort; render(); }
      if (b.dataset.rfPage) { state().page += Number(b.dataset.rfPage); render(); }
    });
    form(); render(); return { exportResult };
  };
})(window);
