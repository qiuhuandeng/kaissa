(function () {
  'use strict';
  const host = document.getElementById('finance-cashflow');
  if (!host) return;
  const m = window.CaesarCashflow;
  if (!m) { host.innerHTML = '<p role="alert">收退转付资料未加载，请刷新重试。</p>'; return; }
  const params = new URLSearchParams(location.search), report = params.get('report');
  const legacy = ['profit', 'ar-ap', 'prepay', 'fund'].includes(report);
  const e = m.esc;
  const history = '<label class="cf-history">报表主题<select aria-label="报表主题" data-cf-history>' + [['cashflow', '收退转付明细'], ['profit', '历史分析 · 经营损益'], ['ar-ap', '历史分析 · 往来分析'], ['prepay', '历史分析 · 预付分析'], ['fund', '历史分析 · 资金余额']].map(([v, t]) => '<option value="' + v + '"' + (v === (legacy ? report : 'cashflow') ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></label>';
  host.innerHTML = '<header class="cf-heading"><h1>' + (legacy ? '历史财务分析' : '收退转付明细') + '</h1>' + history + '</header>';
  host.querySelector('[data-cf-history]').addEventListener('change', event => {
    const url = new URL(location.href); url.search = '?report=' + event.target.value; location.href = url.href;
  });
  if (legacy) {
    host.insertAdjacentHTML('beforeend', '<p class="cf-notice">历史原型 · 口径待完善 · 不作为正式财务结果</p>'); return;
  }
  const initialType = ['receipt', 'payment'].includes(report) ? report : params.get('type');
  let applied = m.defaults(initialType), result, page = 1, size = 10, sortKey = 'id', direction = 1;
  let extras = new Set();
  const labels = {
    id: '单据号', sourceId: '资金/转款单号', execution: '执行记录号', transaction: '银行流水号', originalTransaction: '原交易号', actualAt: '资金时间', confirmedAt: '确认日期', appliedAt: '申请时间', enteredAt: '资料录入时间',
    company: '收付款公司', toCompany: '转入公司', party: '往来方', method: '收付方式', category: '款项类别', currency: '币种', cashIn: '实际流入', cashOut: '实际流出',
    allocated: '已分配金额', unallocated: '未分配金额', result: '核对结果', order: '订单号', root: '最初收款单号', requested: '申请金额', nonCashAmount: '非现金处理金额',
    fromOrder: '转出订单', toOrder: '转入订单', originalOrder: '最初订单', amount: '原记录金额', allocation: '本次分配', kind: '分配类型', target: '对应应收/应付号',
    source: '来源系统', previous: '上次转款号', chain: '连续转款记录', original: '原记录号', account: '资金账户/商户', accountCompany: '账户所属公司',
    contractCompany: '合同销售公司', productCompany: '产品经营公司', department: '销售部门/事业部', store: '门店', center: '呼叫中心', salesperson: '销售人员',
    product: '产品名称', distributor: '分销商', departure: '出团日期', returned: '回团日期', internal: '内部/外部', gross: '平台订单毛额', fee: '手续费', rate: '采用汇率', converted: '折算金额',
    writeoff: '核销金额', proof: '凭据名称', confirmedBy: '财务确认人', reason: '调整原因', retry: '执行序次', purchase: '采购批次', status: '来源状态', note: '备注说明', issue: '核对缺口',
    reference: '依据单号', date: '依据日期'
  };
  const amountKeys = new Set(['cashIn', 'cashOut', 'allocated', 'unallocated', 'requested', 'nonCashAmount', 'amount', 'allocation', 'fee', 'converted', 'gross', 'writeoff']);
  const bases = {
    receipt: ['id', 'transaction', 'actualAt', 'company', 'party', 'method', 'category', 'currency', 'cashIn', 'allocated', 'unallocated', 'result'],
    refund: ['id', 'execution', 'actualAt', 'company', 'order', 'root', 'method', 'currency', 'requested', 'cashOut', 'originalTransaction', 'result'],
    transfer: ['id', 'confirmedAt', 'company', 'toCompany', 'fromOrder', 'toOrder', 'originalOrder', 'root', 'currency', 'nonCashAmount', 'originalTransaction', 'result'],
    payment: ['id', 'execution', 'actualAt', 'company', 'party', 'category', 'currency', 'requested', 'cashOut', 'cashIn', 'transaction', 'result']
  };
  const groups = {
    '原款及单据': ['source', 'originalTransaction', 'root', 'originalOrder', 'previous', 'chain', 'original', 'execution', 'purchase'],
    '业务归属': ['contractCompany', 'productCompany', 'department', 'store', 'center', 'salesperson', 'product', 'distributor', 'departure', 'returned', 'internal'],
    '资金及折算': ['account', 'accountCompany', 'gross', 'fee', 'rate', 'converted', 'nonCashAmount'],
    '确认及核销': ['appliedAt', 'confirmedAt', 'enteredAt', 'writeoff', 'confirmedBy', 'status'],
    '调整及凭据': ['reason', 'retry', 'proof', 'note', 'issue']
  };
  const queryLabels = { dataset: '资料范围', type: '收付类型', mode: '查询方式', case: '验收场景', start: '开始日期', end: '结束日期', dateBasis: '日期依据', cutoff: '资料截止', company: '资金公司', currency: '币种', account: '账户/商户', category: '款项类别', method: '收付方式', status: '核对结果', internal: '内部/外部', keyword: '单号/交款人/付款对象', order: '订单号', contractCompany: '合同销售公司', department: '部门/事业部', store: '门店', center: '呼叫中心' };
  const basisLabels = { actualAt: '资金实际发生日期', appliedAt: '申请日期', confirmedAt: '财务确认日期' };
  const title = key => {
    if (applied.mode === 'allocations' && key === 'id') return '分配记录号';
    const overrides = {
      receipt: { id: '收款/认款单号', party: '交款人', cashIn: '到账金额', method: '收款方式', company: '收款公司', transaction: '原交易号' },
      refund: { id: '退款单号', method: '退款方式', cashOut: '实际退款', requested: '申请退款', company: '付款公司', result: '执行结果' },
      transfer: { id: '转款单号', nonCashAmount: '转款金额', company: '转出公司', result: '确认结果' },
      payment: { id: '付款单号', cashOut: '实际付款', cashIn: '付款退回', requested: '申请付款', company: '付款公司', category: '付款类型', party: '付款对象', result: '执行结果' }
    };
    return overrides[applied.type][key] || labels[key] || key;
  };
  const cols = () => {
    let base = bases[applied.type];
    if (applied.mode === 'allocations') base = ['sourceId', 'id', ...(applied.type === 'transfer' ? ['fromOrder', 'toOrder'] : ['order']), 'root', 'actualAt', 'confirmedAt', 'company', 'currency', 'allocation', 'kind', ...(applied.type === 'transfer' ? [] : ['target']), 'result'];
    return [...new Set([...base, ...extras])];
  };
  const display = (r, k) => {
    if (k === 'type') return m.types[r[k]] || '未提供';
    if (k === 'actualAt' && r.noncash) return '不适用（非现金）';
    if (k === 'root' && r.type === 'receipt' && !r.root) return r.sourceId || r.id;
    if (k === 'rate' && r.currency === 'CNY') return '不适用';
    if (k === 'note' && !r.note) return '无';
    return amountKeys.has(k) ? m.fmt(r[k]) : r[k] == null || r[k] === '' ? '未提供' : String(r[k]).replace(/^(\d{4}-\d{2}-\d{2})T/, '$1 ');
  };
  const control = (name, options, type) => '<label class="cf-field">' + queryLabels[name] + (options ? '<select name="' + name + '" aria-label="' + queryLabels[name] + '">' + options.map(([v, t]) => '<option value="' + e(v) + '">' + e(t) + '</option>').join('') + '</select>' : '<input name="' + name + '" aria-label="' + queryLabels[name] + '" type="' + (type || 'text') + '">') + '</label>';
  const btn = (attr, text, icon) => '<button type="button" class="btn btn-secondary" ' + attr + '>' + (icon ? '<img alt="" width="14" height="14" src="../../shared/report-icons/' + icon + '.svg">' : '') + text + '</button>';
  host.insertAdjacentHTML('beforeend', '<div class="cf-workbar"><div class="cf-tabs" role="tablist" aria-label="收付类型">' + Object.entries(m.types).map(([k, t]) => '<button type="button" role="tab" data-cf-type="' + k + '">' + t + '</button>').join('') + '</div><div class="cf-actions">' + btn('data-cf-export', '导出明细', 'download') + btn('data-cf-evidence-export', '导出依据', 'download') + btn('data-cf-print', '打印收款清单') + '</div></div>' +
    '<form class="cf-filters">' + control('dataset', [['pending', '来源待接入'], ['demo', '验收算例']]) + control('case', [['', '全部验收场景'], ...Object.entries(m.scenarios)]) +
    control('dateBasis', Object.entries(basisLabels)) + control('start', null, 'date') + control('end', null, 'date') + control('cutoff', null, 'datetime-local') +
    control('company', [['', '全部算例公司'], ['北京凯撒旅游', '北京凯撒旅游'], ['福建凯撒旅游', '福建凯撒旅游']]) + control('currency', [['', '全部币种'], ['CNY', 'CNY'], ['USD', 'USD']]) + control('keyword') +
    '<details class="cf-more"><summary>更多条件</summary><div class="cf-filter-more">' + ['account', 'category', 'method', 'status', 'order', 'contractCompany', 'department', 'store', 'center'].map(k => control(k)).join('') + control('internal', [['', '全部往来'], ['外部', '外部'], ['集团内部', '集团内部']]) + '</div></details>' +
    '<div class="cf-filter-actions"><button type="submit" class="btn btn-secondary">查询</button>' + btn('data-cf-reset', '重置') + '</div></form>' +
    '<p class="cf-error" role="alert" hidden></p><p class="cf-notice" data-cf-notice role="status"></p>' +
    '<div class="cf-workbar"><div class="cf-modes" role="group" aria-label="查询方式"><button type="button" data-cf-mode="documents">单据明细</button><button type="button" data-cf-mode="allocations">订单分配</button></div><details class="cf-columns"><summary>显示字段</summary><div data-cf-columns></div></details></div>' +
    '<div data-cf-main class="cf-scroll" tabindex="0" aria-label="收退转付主表"></div><div class="cf-pagination">' + btn('data-cf-prev aria-label="上一页"', '', 'chevron-left') + '<span data-cf-count></span>' + btn('data-cf-next aria-label="下一页"', '', 'chevron-right') + '<label>每页<select data-cf-size aria-label="每页条数"><option>10</option><option>25</option><option>50</option></select></label></div>' +
    '<section class="cf-section"><h2>本次查询合计 <small>按资金公司及原币</small></h2><div data-cf-totals class="cf-scroll" aria-label="查询合计"></div></section>' +
    '<section class="cf-section"><h2>原款与转款依据</h2><div data-cf-trace class="cf-scroll" aria-label="原款与转款依据"></div></section>' +
    '<section class="cf-section"><h2>分配与核销依据</h2><div data-cf-evidence class="cf-scroll" aria-label="分配与核销依据"></div></section>' +
    '<section class="cf-section"><h2>核对缺口与重复记录</h2><div data-cf-exceptions class="cf-scroll" aria-label="核对缺口"></div></section>' +
    '<footer class="cf-definition"><strong>数据口径说明</strong><p>金额单位：元，按原币分项。实际收付、订单分配和核销分别列示，不相加。订单筛选后的资金来源金额仅作核对，不等于订单金额。集团内部款未抵销。</p><p>资料范围：独立验收算例，覆盖2026年9月至10月；固定资料，不自动更新。正式来源及权限待接入，账户已脱敏。非现金退款、转款无资金发生日期，按财务确认日期核对。</p></footer><div class="cf-print" data-cf-print-area></div>');
  const form = host.querySelector('form'), field = n => form.elements.namedItem(n);
  function setForm(q) { Object.keys(queryLabels).forEach(k => { if (field(k)) field(k).value = q[k] || ''; }); }
  function table(rows, columns, names, sortable) {
    return '<table><thead><tr>' + columns.map(k => '<th' + (sortable ? ' aria-sort="' + (sortKey === k ? direction === 1 ? 'ascending' : 'descending' : 'none') + '"' : '') + '>' + (sortable ? '<button type="button" data-cf-sort="' + k + '">' + e(names[k] || k) + (sortKey === k ? direction === 1 ? ' ↑' : ' ↓' : '') + '</button>' : e(names[k] || k)) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(r => '<tr>' + columns.map(k => '<td class="' + (amountKeys.has(k) ? 'cf-number' : 'cf-value') + '">' + e(display(r, k)) + '</td>').join('') + '</tr>').join('') + '</tbody></table>' + (!rows.length ? '<p class="cf-empty">' + (result.pending ? '来源待接入，暂无可核对记录' : '当前条件下无记录') + '</p>' : '');
  }
  function decorated() {
    const raw = result.trace;
    [result.rows, result.sources, result.allocations].forEach(rows => rows.forEach(r => {
      const roots = (r.root || '').split(' / ');
      r.originalTransaction = [...new Set(roots.map(id => raw.find(s => s.id === id)?.transaction).filter(Boolean))].join(' / ');
    }));
  }
  function metadata() {
    return [['报表', m.types[applied.type] + '明细'], ['资料范围', applied.dataset === 'demo' ? '独立验收算例，非正式账务' : '来源待接入'], ['查询方式', applied.mode === 'allocations' ? '订单分配' : '单据明细'],
      ['日期依据', basisLabels[applied.dateBasis]], ['开始日期', applied.start || '不限'], ['结束日期', applied.end || '不限'], ['资料截止', applied.cutoff || '全部已提供资料'],
      ...Object.keys(queryLabels).filter(k => !['dataset', 'type', 'mode', 'dateBasis', 'start', 'end', 'cutoff'].includes(k)).map(k => [queryLabels[k], k === 'case' ? m.scenarios[applied[k]] || '全部' : applied[k] || '全部']),
      ['排序', title(sortKey) + (direction === 1 ? '升序' : '降序')], ['金额单位', '元，按原币分项；内部款未抵销'], ['资料情况', result.notice]];
  }
  function evidenceRows() {
    return [...result.allocations.map(a => ({ ...a, reference: a.sourceId, date: a.confirmedAt, note: a.issue || a.note })), ...result.evidence];
  }
  function render() {
    const columns = cols(), ordered = m.sort(result.rows, sortKey, direction), names = Object.fromEntries(columns.map(k => [k, title(k)]));
    const count = ordered.length, last = Math.max(1, Math.ceil(count / size)); page = Math.min(page, last);
    host.querySelector('[data-cf-main]').innerHTML = table(ordered.slice((page - 1) * size, page * size), columns, names, true);
    host.querySelector('[data-cf-count]').textContent = '第 ' + page + ' / ' + last + ' 页 · 共 ' + count + ' 条';
    host.querySelector('[data-cf-prev]').disabled = page === 1; host.querySelector('[data-cf-next]').disabled = page === last;
    host.querySelector('[data-cf-notice]').textContent = result.notice + ' · ' + basisLabels[applied.dateBasis] + ' · 资料截止 ' + (applied.cutoff.replace('T', ' ') || '不限') + ' · 核对缺口/重复 ' + result.exceptions.length + ' 条';
    host.querySelector('[data-cf-print]').hidden = applied.type !== 'receipt';
    host.querySelectorAll('[data-cf-type]').forEach(b => { b.classList.toggle('active', b.dataset.cfType === applied.type); b.setAttribute('aria-selected', b.dataset.cfType === applied.type); });
    host.querySelectorAll('[data-cf-mode]').forEach(b => { b.classList.toggle('active', b.dataset.cfMode === applied.mode); b.setAttribute('aria-pressed', b.dataset.cfMode === applied.mode); });
    const totals = result.totals.map(t => ({ ...t, nonCashAmount: t.noncash, issue: t.unknown ? t.unknown + '笔资金结果未核实' : '已提供记录', note: t.internal ? '含集团内部款，未抵销' : '' }));
    host.querySelector('[data-cf-totals]').innerHTML = table(totals, ['company', 'currency', 'cashIn', 'cashOut', 'nonCashAmount', 'allocation', 'unallocated', 'issue', 'note'], { ...labels, cashIn: '来源实际流入（核对）', cashOut: '来源实际流出（核对）', allocation: '所选订单分配', unallocated: '来源未分配（核对）' });
    host.querySelector('[data-cf-trace]').innerHTML = table(result.trace, ['id', 'type', 'root', 'previous', 'original', 'fromOrder', 'toOrder', 'transaction', 'company', 'currency', 'amount', 'confirmedAt'], { ...labels, type: '记录类别', amount: '原记录金额（不合计）' });
    host.querySelector('[data-cf-evidence]').innerHTML = table(evidenceRows(), ['id', 'reference', 'kind', 'order', 'root', 'currency', 'amount', 'date', 'note'], { ...labels, id: '依据记录号', kind: '依据类别', amount: '依据金额（不合计）' });
    host.querySelector('[data-cf-exceptions]').innerHTML = table(result.exceptions, ['id', 'company', 'currency', 'amount', 'issue', 'proof'], labels);
    host.querySelector('[data-cf-columns]').innerHTML = Object.entries(groups).map(([group, keys]) => '<fieldset><legend>' + group + '</legend>' + keys.map(k => '<label><input type="checkbox" data-cf-column="' + k + '"' + (extras.has(k) ? ' checked' : '') + '>' + labels[k] + '</label>').join('') + '</fieldset>').join('');
    host.querySelectorAll('[data-cf-export], [data-cf-evidence-export], [data-cf-print]').forEach(b => b.disabled = result.pending || !result.rows.length && !result.exceptions.length);
  }
  function run(next) {
    const error = host.querySelector('.cf-error');
    try {
      const nextResult = m.query(next); applied = { ...next }; result = nextResult; decorated(); page = 1; error.hidden = true; render();
    } catch (err) { error.textContent = err.message || '查询失败，请重试'; error.hidden = false; }
  }
  function download(full) {
    const columns = cols(), rows = [...metadata(), [], columns.map(title), ...m.sort(result.rows, sortKey, direction).map(r => columns.map(k => amountKeys.has(k) ? r[k] : display(r, k)))];
    rows.push([], ['按资金公司和原币合计'], ['资金公司', '币种', '来源流入（核对）', '来源流出（核对）', '非现金处理', '所选订单分配', '来源未分配（核对）']);
    result.totals.forEach(t => rows.push([t.company, t.currency, t.cashIn, t.cashOut, t.noncash, t.allocation, t.unallocated]));
    if (full) {
      const append = (name, data, keys) => { rows.push([], [name], keys.map(k => labels[k] || k)); data.forEach(r => rows.push(keys.map(k => amountKeys.has(k) ? r[k] : display(r, k)))); };
      append('资金来源（仅核对，不与分配相加）', result.sources, ['id', 'company', 'currency', 'amount', 'cashIn', 'cashOut', 'allocated', 'unallocated', 'proof']);
      append('原款与转款依据', result.trace, ['id', 'root', 'previous', 'original', 'transaction', 'company', 'currency', 'amount', 'fromOrder', 'toOrder', 'confirmedAt']);
      append('分配与核销依据', evidenceRows(), ['id', 'reference', 'kind', 'order', 'root', 'currency', 'amount', 'date', 'note']);
    }
    rows.push([], ['核对缺口与重复记录'], ['单据号', '资金公司', '币种', '原记录金额', '缺口']);
    result.exceptions.forEach(r => rows.push([r.id, r.company, r.currency, r.amount, r.issue]));
    const url = URL.createObjectURL(new Blob([m.csv(rows)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = '收退转付-' + m.types[applied.type] + (full ? '-含依据' : '-明细') + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function print() {
    const area = host.querySelector('[data-cf-print-area]');
    const header = ['序号', '收款单号', '订单号', '交款人', '金额', '银行收款时间', '分销商', '产品名称', '出团日期', '回团日期', '款项类别', '备注说明'];
    const companies = [...new Set(result.sources.map(r => r.company || '公司未对应'))];
    area.innerHTML = companies.map(company => {
      const sources = result.sources.filter(r => (r.company || '公司未对应') === company);
      const allocations = m.sort(result.allocations.filter(a => (a.company || '公司未对应') === company && a.valid), sortKey, direction);
      const body = allocations.map((a, i) => [i + 1, a.sourceId, a.order, a.party, m.fmt(a.amount) + ' ' + a.currency, a.actualAt?.replace('T', ' '), a.distributor, a.product, a.departure, a.returned, a.category, a.note || '分配已核实']);
      return '<section class="cf-print-company"><h2>' + e(company) + ' · 收款清单（按订单分配）</h2><p>独立验收算例 · 非正式账务数据</p><p>' + metadata().filter(([k]) => ['开始日期', '结束日期', '日期依据', '资料截止', '订单号', '验收场景'].includes(k)).map(([k, v]) => e(k + '：' + v)).join('；') + '</p><table><thead><tr>' + header.map(t => '<th>' + t + '</th>').join('') + '</tr></thead><tbody>' + body.map(row => '<tr>' + row.map(v => '<td>' + e(v ?? '未提供') + '</td>').join('') + '</tr>').join('') + '</tbody></table>' +
        '<h3>资金来源汇总（不重复计数，不与分配相加）</h3>' + table(sources, ['id', 'currency', 'cashIn', 'allocated', 'unallocated', 'result'], labels) +
        '<h3>原款及核对依据</h3>' + table(result.trace.filter(r => r.company === company), ['id', 'transaction', 'root', 'previous', 'currency', 'amount'], labels) +
        (result.exceptions.some(r => r.company === company) ? '<h3>核对缺口</h3>' + table(result.exceptions.filter(r => r.company === company), ['id', 'issue'], labels) : '') + '</section>';
    }).join('');
    document.body.classList.add('cf-printing');
    window.print();
    document.body.classList.remove('cf-printing');
  }
  form.addEventListener('submit', event => {
    event.preventDefault(); const next = { ...applied }; for (const [k, v] of new FormData(form)) next[k] = v.trim(); run(next);
  });
  host.addEventListener('click', event => {
    const b = event.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-cf-type')) { const next = m.defaults(b.dataset.cfType); extras.clear(); setForm(next); run(next); }
    if (b.hasAttribute('data-cf-mode')) { run({ ...applied, mode: b.dataset.cfMode }); }
    if (b.hasAttribute('data-cf-reset')) { const next = m.defaults(applied.type); setForm(next); extras.clear(); run(next); }
    if (b.hasAttribute('data-cf-sort')) { direction = sortKey === b.dataset.cfSort ? -direction : 1; sortKey = b.dataset.cfSort; render(); }
    if (b.hasAttribute('data-cf-prev')) { page--; render(); }
    if (b.hasAttribute('data-cf-next')) { page++; render(); }
    if (b.hasAttribute('data-cf-export')) download(false);
    if (b.hasAttribute('data-cf-evidence-export')) download(true);
    if (b.hasAttribute('data-cf-print')) print();
  });
  host.addEventListener('change', event => {
    const b = event.target;
    if (b.hasAttribute('data-cf-column')) { if (b.checked) extras.add(b.dataset.cfColumn); else extras.delete(b.dataset.cfColumn); render(); }
    if (b.hasAttribute('data-cf-size')) { size = Number(b.value); page = 1; render(); }
  });
  document.title = '收退转付明细 - 凯撒旅游';
  setForm(applied); run(applied);
})();
