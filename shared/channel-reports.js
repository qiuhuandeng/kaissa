(function () {
  "use strict";
  function createModel(report) {
    const defaults = { view: 'channels', basis: 'orders', period: 'custom', start: '2026-05-01', end: report.CUTOFF, unit: 'wan',
      company: '', productCompany: '', channel: '', budgetRegion: '', salesDepartment: '', salesLeader: '', store: '', storeType: '', salesGroup: '', salesId: '',
      acquisition: '', productOrg: '', travel: '', business: '', source: '', type: '', supply: '', destination: '', management: '', quality: '', level: 'channel', callLevel: 'group', structure: 'type', columns: 'amount', granularity:'summary' };
    const views = { channels: '渠道订单', stores: '门店业绩', calls: '呼叫中心', structure: '产品构成' };
    const labels = { company: '销售公司', productCompany: '产品经营公司', channel: '主成交渠道', budgetRegion: '预算区域', salesDivision: '销售事业部', salesDepartment: '销售部门', salesLeader: '销售部门领导',
      store: '门店', storeType: '门店性质', salesGroup: '销售组', salesId: '员工编号', salesperson: '顾问', acquisition: '获客来源', salesOrigin: '具体成交来源',
      productOrg: '产品经营组', travel: '旅游范围', business: '业务线', source: '来源系统', type: '产品类型', supply: '供应关系', destination: '主目的地', management: '经营分类', amount: '成交额', orders: '订单数', count: '业务条数',
      share: '占所选范围比例', allAmount: '同范围全部渠道额', contribution: '该渠道贡献比例', missing: '销售归属缺口条数', unknown: '成交金额缺数条数',
      previous: '对比期金额', growth: '同比／环比', target: '期间任务', completion: '任务完成率', grossProfit: '渠道毛利',
      organizationVersion: '任职版本', channelVersion: '渠道版本', ownershipAt: '归属确认日期', record: '业务明细号', order: '订单号', product: '销售内容', date: '业务日期' };
    const missing = value => value == null || value === '' || ['待补充', '未归类', '待确认'].includes(value);
    // 员工编号仅用于区分同名演示顾问，不是正式员工名册。
    const staff = { O01: 'DEMO-S01', O02: 'DEMO-S02', O03: 'DEMO-S01', O04: 'DEMO-S01', O05: 'DEMO-S01', O06: 'DEMO-S04', O07: 'DEMO-S03', O08: 'DEMO-S02', O09: 'DEMO-S04' };
    function facts(row) { return { ...row, salesId: Object.hasOwn(row, 'salesId') ? row.salesId : staff[row.order] || null }; }
    function clean(input) {
      const f = { ...defaults, ...input };
      if (f.view === 'stores') { f.channel = '门店'; f.salesGroup = ''; f.salesId = ''; }
      else if (f.view === 'calls') { f.channel = '呼叫中心'; f.store = ''; f.storeType = ''; }
      else { f.storeType = ''; if (f.view !== 'structure') { f.store = ''; f.salesGroup = ''; f.salesId = ''; } }
      if (f.period === 'month') f.start = f.end.slice(0, 7) + '-01';
      if (f.period === 'year') f.start = f.end.slice(0, 4) + '-01-01';
      if (f.period === 'seven') { const d = new Date(f.end + 'T00:00:00Z'); if (!Number.isNaN(+d)) { d.setUTCDate(d.getUTCDate() - 6); f.start = d.toISOString().slice(0, 10); } }
      return f;
    }
    const dateValid = d => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d;
    function validate(f) { return !dateValid(f.start) || !dateValid(f.end) || f.start > f.end || f.end > report.CUTOFF ? '请核对日期，开始日不能晚于结束日，也不能超过演示截止日2026-05-07。' : ''; }
    function hasGap(r) { return ['company', 'salesDepartment', 'salesLeader', 'channel', 'salesId', 'budgetRegion'].some(k => missing(r[k])) || (r.channel === '门店' && missing(r.store)) || (r.channel === '呼叫中心' && missing(r.salesGroup)); }
    const filterKeys = ['company', 'productCompany', 'productOrg', 'travel', 'business', 'source', 'channel', 'budgetRegion', 'salesDepartment', 'salesLeader', 'store', 'storeType', 'salesGroup', 'salesId', 'acquisition', 'type', 'supply', 'destination', 'management'];
    function matches(r, f) { return filterKeys.every(k => !f[k] || (f[k] === '__missing' ? missing(r[k]) : r[k] === f[k])) && (!f.quality || (f.quality === 'ownership' ? hasGap(r) : r.amount == null)); }
    function select(f, records) {
      const range = { start: f.start, end: f.end, status: '有效', view: f.basis === 'orders' ? 'orders' : 'actual', dateBasis: 'confirmed' };
      return (f.basis === 'orders' ? report.orderDetailQuery(range, records) : report.returnDetailQuery(range, records)).map(facts).filter(r => matches(r, f));
    }
    const textValue = v => missing(v) ? '待补充' : v;
    const companyName = v => v === 'A' || v === 'B' ? v + '公司（演示）' : textValue(v);
    function groupKeys(f) {
      if (f.view === 'stores') return ['company', 'store'];
      if (f.view === 'calls') return ['company', 'salesDepartment', ...(f.callLevel !== 'center' ? ['salesGroup'] : []), ...(f.callLevel === 'person' ? ['salesId'] : [])];
      if (f.view === 'structure') return [f.structure];
      return { channel: ['channel'], region: ['budgetRegion', 'channel'], company: ['company'], department: ['company', 'salesDivision', 'salesDepartment'], store:['company','channel','store'], person:['company','salesDepartment','salesId'] }[f.level];
    }
    function keyOf(row, keys) {
      return JSON.stringify(keys.map(k => k === 'salesId' && missing(row[k]) ? '未分配员工:' + row.order : textValue(row[k])));
    }
    function ratio(a, b, missingCount = 0) { return missingCount || a == null || b == null || b <= 0 ? null : a / b * 100; }
    function run(input, records) {
      const f = clean(input), rows = select(f, records);
      const allRows = f.view === 'structure' ? select({ ...f, channel: '' }, records) : rows;
      const keys = groupKeys(f), total = report.amountCoverage(rows), allTotal = report.amountCoverage(allRows), buckets = new Map();
      allRows.forEach(r => { const id = keyOf(r, keys); if (!buckets.has(id)) buckets.set(id, { members: [], all: [] }); buckets.get(id).all.push(r); });
      rows.forEach(r => { const id = keyOf(r, keys); if (!buckets.has(id)) buckets.set(id, { members: [], all: [] }); buckets.get(id).members.push(r); });
      const summaries = Array.from(buckets, ([id, b]) => {
        const values = (f.view === 'structure' ? b.all : b.members), aggregate = report.amountCoverage(b.members), all = report.amountCoverage(b.all);
        const r = { id, amount: aggregate.value, allAmount: all.value, orders: report.orderCount(b.members), count: b.members.length,
          missing: b.members.filter(hasGap).length, unknown: aggregate.unknown + aggregate.unallocated,
          share: ratio(aggregate.value, total.value, total.unknown + total.unallocated), contribution: ratio(aggregate.value, all.value, all.unknown + all.unallocated),
          previous: '未提供完整资料', growth: '无可比资料', target: '未提供批准任务', completion: '无法计算', grossProfit: '规则及资料待确认' };
        for (const key of [...filterKeys, 'salesDivision', 'salesperson', 'salesOrigin', 'organizationVersion', 'channelVersion', 'ownershipAt']) {
          r[key] = Array.from(new Set((keys.includes(key) ? values : b.members).map(v => ['company', 'productCompany'].includes(key) ? companyName(v[key]) : textValue(v[key])))).join('、') || (b.members.length ? '待补充' : '无所选渠道业务');
        }
        return r;
      });
      return { filter: f, rows, summaries, total, allTotal, orders: report.orderCount(rows), missing: rows.filter(hasGap).length,
        details: rows.map(r => ({ ...r, record: f.basis === 'orders' ? r.id : r.record, date: f.basis === 'orders' ? r.confirmed : r.actual,
          company: companyName(r.company), productCompany: companyName(r.productCompany) })) };
    }
    return { defaults, views, labels, missing, facts, clean, validate, hasGap, matches, select, groupKeys, ratio, run, textValue };
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = createModel(require('./report-pages.js')); return; }
  const root = document.querySelector('[data-channel-report]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  const assets = new URL('report-icons/', document.currentScript.src).href;
  function mount(report) {
    if (!root.isConnected) return;
    const m = createModel(report), esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const icon = name => '<img class="report-icon" alt="" src="' + assets + name + '.svg">';
    let applied = { ...m.defaults }, draft = { ...applied }, page = 1, size = 10, sort = 'amount', direction = -1, optional = new Set(), result;
    let margin, marginHost, performance, marginActive = false;
    const params = new URLSearchParams(location.search);
    ['company', 'productCompany', 'productOrg', 'travel', 'business', 'source', 'channel', 'start', 'end', 'unit', 'type', 'supply', 'destination'].forEach(k => { if (params.has(k)) applied[k] = params.get(k); });
    if (m.validate(applied)) applied = { ...m.defaults };
    draft = { ...applied };
    const select = (key, title, choices, value, disabled = false) => '<label class="report-field"><span>' + title + '</span><select name="' + key + '"' + (disabled ? ' disabled' : '') + '>' + choices.map(([v, t]) => '<option value="' + esc(v) + '"' + (v === value ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select></label>';
    const button = (label, attrs = '') => '<button type="button" class="report-button" ' + attrs + '>' + label + '</button>';
    const date = key => '<label class="report-field"><span>' + (draft.basis === 'orders' ? '订单确认日期' : '实际完成日期') + (key === 'start' ? '开始' : '结束') + '</span><input type="date" aria-label="' + (draft.basis === 'orders' ? '订单确认日期' : '实际完成日期') + (key === 'start' ? '开始' : '结束') + '" name="' + key + '" value="' + draft[key] + '" required' + (key === 'start' && draft.period !== 'custom' ? ' disabled' : '') + '></label>';
    function choices(key) {
      let data = report.items.map(report.orderFacts).map(m.facts);
      if (['salesDepartment', 'salesLeader', 'store', 'salesGroup', 'salesId'].includes(key)) data = data.filter(r => (!draft.company || r.company === draft.company) && (!draft.channel || r.channel === draft.channel));
      if (key === 'salesId') data = data.filter(r => (!draft.salesDepartment || r.salesDepartment === draft.salesDepartment) && (!draft.salesGroup || r.salesGroup === draft.salesGroup));
      const values = Array.from(new Set(data.map(r => r[key]).filter(v => !m.missing(v) && v !== '不适用')));
      return [['', '全部'+m.labels[key]], ...values.map(v => [v, key === 'company' || key === 'productCompany' ? v + '公司（演示）' : key === 'productOrg' ? v + '产品经营组' : key === 'salesId' ? data.find(r => r.salesId === v).salesperson + ' · ' + v : v]), ['__missing', '待补充']];
    }
    const field = key => select(key, m.labels[key], choices(key), draft[key]);
    const viewName = f => f.view === 'channels' ? f.basis === 'orders' ? '渠道订单' : '渠道回团' : m.views[f.view];
    function filters() {
      root.querySelector('[data-filters]').innerHTML = '<div class="report-filter-row">' + select('period', '统计期间', [['custom', '自选期间'], ['seven', '近7日'], ['month', '月累计'], ['year', '年累计']], draft.period) + date('start') + date('end') + field('company') +
        select('unit', '金额单位', [['wan', '人民币·万元'], ['yuan', '人民币·元']], draft.unit) + '</div><details class="report-more"><summary>更多筛选</summary><div class="report-filter-row">' +
        field('productCompany') + (['stores', 'calls'].includes(draft.view) ? '' : field('channel')) + field('budgetRegion') + field('salesDepartment') + field('salesLeader') +
        (draft.view === 'stores' ? field('store') + field('storeType') : draft.view === 'calls' ? field('salesGroup') + field('salesId') : draft.view === 'structure' ? field('store') + field('salesGroup') : '') +
        ['acquisition', 'productOrg', 'travel', 'business', 'source', 'type', 'supply', 'destination', 'management'].map(field).join('') + select('quality', '资料情况', [['', '全部'], ['ownership', '销售归属待补充'], ['amount', '成交金额待确认']], draft.quality) + '</div></details>' +
        '<div class="report-filter-row report-more">' + select('granularity','统计层级',[['summary','汇总结果'],['records','组成记录']],draft.granularity) + (draft.view === 'channels' ? select('level', '汇总方式', [['channel', '主成交渠道'], ['region', '预算区域与渠道'], ['company', '销售公司'], ['department', '销售部门'],['store','渠道与门店'],['person','销售顾问']], draft.level) : draft.view === 'calls' ? select('callLevel', '汇总方式', [['center', '呼叫中心'], ['group', '销售组'], ['person', '顾问']], draft.callLevel) : draft.view === 'structure' ? select('structure', '产品结构', [['type', '产品类型'], ['destination', '主目的地'], ['supply', '供应关系']], draft.structure) : '') +
        (draft.view !== 'structure' && draft.granularity !== 'records' ? select('columns', '金额列组', [['amount', '本期业绩'], ['comparison', '同期与任务']], draft.columns) : '') + '</div>';
      root.querySelectorAll('[data-view]').forEach(el => el.setAttribute('aria-selected', String(el.dataset.view === draft.view)));
    }
    function shell() {
      root.innerHTML = '<header class="report-head"><h1>渠道分析</h1><div class="report-actions">' + button(icon('download') + '导出', 'data-export title="导出全查询结果"') + '</div></header>' +
        '<div class="report-tabbar cr-tabs" role="tablist" aria-label="渠道经营视图">' + Object.entries({ ...m.views, margin: '渠道毛利校验' }).map(([key, label]) => '<button type="button" class="report-tab" role="tab" data-view="' + key + '">' + label + '</button>').join('') + '</div>' +
        '<form class="report-filters"><div data-filters></div><div class="report-query-actions"><button type="submit" class="report-button">查询</button>' + button('重置', 'data-reset') + '</div><p class="report-query-status" data-status role="status">已查询 · 演示资料</p><p class="report-error" data-error role="alert" hidden></p></form><div data-meta class="report-meta"></div><section class="report-section" data-result></section>' +
        '<section class="report-note"><h2>数据口径</h2><p>演示资料，非正式财务业绩。订单按确认日期及截止时净成交额；回团按实际完成日期及分配成交额，包含待结算业务。退款支付不再重复冲减成交；计划到期不等于实际完成。</p><p>归属采用业务发生时资料。主渠道与获客来源分开；集团内部供应不增加对客成交。同名顾问按演示员工编号区分，缺编号不合并为同一人。</p><p>结构占比以所选范围成交额为分母；渠道贡献只解除主渠道条件，保留公司、产品、门店、销售组及期间。无有效分母或金额缺失不计算比例。</p><p>未提供完整对比期资料、批准任务及渠道毛利确认依据；升舱、优惠还原公式与10%比较方式待财务确认。未接正式权限、取数及发布。</p></section>';
      filters(); render();
      performance = document.createElement('div'); performance.dataset.channelPerformance = '';
      root.querySelectorAll(':scope > form, :scope > [data-meta], :scope > [data-result], :scope > .report-note').forEach(el => performance.append(el));
      root.append(performance);
      marginHost = document.createElement('div'); marginHost.className = 'channel-margin-view'; marginHost.dataset.channelMargin = ''; marginHost.hidden = true; root.append(marginHost);
      margin = null; marginActive = false;
    }
    const numeric = key => ['amount', 'allAmount', 'orders', 'count', 'missing', 'unknown', 'share', 'contribution'].includes(key);
    function display(row, key) {
      const v = row[key];
      if (['amount', 'allAmount'].includes(key)) return v == null ? '待确认' : (v / (applied.unit === 'wan' ? 10000 : 1)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (['share', 'contribution'].includes(key)) return v == null ? '无法计算' : v.toFixed(2) + '%';
      return m.textValue(v);
    }
    function baseColumns() {
      const keys = m.groupKeys(applied);
      if ((applied.view === 'calls' && applied.callLevel === 'person') || (applied.view==='channels' && applied.level==='person')) keys.push('salesperson');
      if (applied.view === 'stores') keys.push('storeType', 'budgetRegion');
      return [...keys, ...(applied.view === 'structure' ? ['amount', 'share', 'allAmount', 'contribution', 'orders', 'unknown'] : applied.columns === 'comparison' ? ['amount', 'previous', 'growth', 'target', 'completion'] : ['amount', 'orders', 'count', 'missing', 'unknown'])];
    }
    function columns() { return applied.granularity === 'records' ? ['order','record','product','date','company','channel','amount',...optional] : [...new Set([...baseColumns(), ...optional])]; }
    function header(key) { return (key === 'amount' ? applied.basis === 'orders' ? '净成交额' : '实际完成成交额' : key === 'date' ? applied.basis === 'orders' ? '订单确认日期' : '实际完成日期' : m.labels[key]) + (['amount', 'allAmount'].includes(key) ? '（' + (applied.unit === 'wan' ? '万元' : '元') + '）' : ''); }
    function table(rows, cols, sortable = true) {
      return '<div class="report-table-scroll" tabindex="0" aria-label="' + (sortable ? '渠道业绩汇总' : '来源明细') + '"><table class="report-table"><thead><tr>' + cols.map(k => '<th' + (numeric(k) ? ' class="report-numeric"' : '') + (sortable ? ' aria-sort="' + (sort === k ? direction > 0 ? 'ascending' : 'descending' : 'none') + '"' : '') + '>' + (sortable ? '<button type="button" data-sort="' + k + '">' + header(k) + icon('arrow-up-down') + '</button>' : header(k)) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(r => '<tr>' + cols.map(k => '<td class="' + (numeric(k) ? 'report-numeric' : 'cr-text') + '">' + esc(display(r, k)) + '</td>').join('') + '</tr>').join('') + '</tbody></table>' + (!rows.length ? '<div class="report-empty">当前条件无业务记录</div>' : '') + '</div>';
    }
    function sorted() { return [...(applied.granularity === 'records' ? result.details : result.summaries)].sort((a, b) => { const av = a[sort], bv = b[sort]; if (av == null || bv == null) return av == null ? bv == null ? 0 : 1 : -1; return (typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv), 'zh-CN')) * direction; }); }
    const detailColumns = ['order', 'record', 'product', 'date', 'company', 'channel', 'salesOrigin', 'acquisition', 'store', 'salesDepartment', 'salesGroup', 'salesperson', 'salesId', 'amount', 'organizationVersion', 'channelVersion'];
    function totalText() { return result.rows.length + ' 条业务 · ' + result.orders + ' 单 · ' + header('amount') + ' ' + display({ amount: result.total.value }, 'amount') + ' · 销售归属缺口 ' + result.missing + ' 条 · 金额缺数 ' + (result.total.unknown + result.total.unallocated) + ' 条'; }
    function render() {
      result = m.run(applied); const data = sorted(), cols = columns(), pages = Math.max(1, Math.ceil(data.length / size)); page = Math.min(page, pages);
      root.querySelector('[data-meta]').innerHTML = '<span class="report-demo">演示工作版 V1 · 数据截止 ' + report.CUTOFF + ' 23:59</span><span>' + viewName(applied) + ' · ' + (applied.basis === 'orders' ? '订单确认日期' : '实际完成日期') + ' ' + applied.start + ' 至 ' + applied.end + '</span><span>' + (applied.channel || '全部主渠道') + ' · 人民币' + (applied.unit === 'wan' ? '万元' : '元') + '</span>';
      const extra = ['company', 'salesDivision', 'salesDepartment', 'salesLeader', 'budgetRegion', 'salesOrigin', 'acquisition', 'productCompany', 'management', 'ownershipAt', 'organizationVersion', 'channelVersion', 'grossProfit'];
      root.querySelector('[data-result]').innerHTML = '<details class="report-columns"><summary>显示字段</summary><div class="report-column-options">' + extra.filter(k => !(applied.granularity === 'records' ? ['company'] : baseColumns()).includes(k)).map(k => '<label><input type="checkbox" data-column="' + k + '"' + (optional.has(k) ? ' checked' : '') + '>' + m.labels[k] + '</label>').join('') + '</div></details>' +
        table(data.slice((page - 1) * size, page * size), cols) + '<div class="report-total"><span data-total>' + totalText() + '</span><div class="report-pagination">' + select('size', '每页条数', [5, 10, 20, 50].map(n => [String(n), n + '条/页']), String(size)) + button(icon('chevron-left'), 'data-page="-1" aria-label="上一页" title="上一页"' + (page === 1 ? ' disabled' : '')) + '<span>' + page + ' / ' + pages + '</span>' + button(icon('chevron-right'), 'data-page="1" aria-label="下一页" title="下一页"' + (page === pages ? ' disabled' : '')) + '</div></div>';
    }
    const status = text => { root.querySelector('[data-status]').textContent = text; };
    function readDraft() { draft = { ...draft, ...Object.fromEntries(new FormData(root.querySelector('form'))) }; }
    function dependentReset(key) {
      if (['company', 'channel'].includes(key)) ['salesDepartment', 'salesLeader', 'store', 'salesGroup', 'salesId'].forEach(k => { draft[k] = ''; });
      if (['salesDepartment', 'salesGroup'].includes(key)) draft.salesId = '';
    }
    root.addEventListener('submit', e => {
      if (e.target.closest('[data-channel-margin]')) return;
      e.preventDefault(); readDraft(); const next = m.clean(draft), err = m.validate(next), error = root.querySelector('[data-error]'); error.textContent = err; error.hidden = !err;
      if (err) return; applied = next; draft = { ...next }; optional = new Set(); page = 1; sort = 'amount'; direction = -1; filters(); render(); status('已查询 · 演示资料');
    });
    root.addEventListener('input', e => { if (!e.target.closest('[data-channel-margin]') && e.target.closest('form')) status('条件已修改，尚未查询'); });
    root.addEventListener('change', e => {
      if (e.target.closest('[data-channel-margin]')) return;
      if (e.target.closest('form')) { const moreOpen = root.querySelector('.report-more').open; readDraft(); dependentReset(e.target.name); draft = m.clean(draft); filters(); root.querySelector('.report-more').open = moreOpen; status('条件已修改，尚未查询'); }
      if (e.target.name === 'size') { size = Number(e.target.value); page = 1; render(); }
      if (e.target.dataset.column) { e.target.checked ? optional.add(e.target.dataset.column) : optional.delete(e.target.dataset.column); render(); root.querySelector('.report-columns').open = true; }
    });
    root.addEventListener('click', e => {
      if (e.target.closest('[data-channel-margin]') && !e.target.closest('[data-export]')) return;
      const el = e.target.closest('button'); if (!el) return;
      if (el.dataset.view === 'margin') {
        if (!margin) margin = window.mountChannelMargin(marginHost, report, assets);
        marginActive = true; performance.hidden = true; marginHost.hidden = false;
        root.querySelectorAll('[data-view]').forEach(tab => tab.setAttribute('aria-selected', String(tab === el))); return;
      }
      if (marginActive && el.hasAttribute('data-export')) { margin.exportResult(); return; }
      if (marginActive && el.dataset.view) {
        marginActive = false; performance.hidden = false; marginHost.hidden = true;
        if (el.dataset.view === draft.view) { filters(); return; }
      }
      if (el.dataset.view) { readDraft(); draft = m.clean({ ...draft, view: el.dataset.view, channel: '', store: '', storeType: '', salesGroup: '', salesId: '', salesDepartment: '', salesLeader: '' }); filters(); status('视图已切换，核对条件后查询；下方仍为上次结果'); }
      if (el.hasAttribute('data-reset')) { applied = { ...m.defaults, view: draft.view, basis:draft.basis }; applied = m.clean(applied); draft = { ...applied }; optional = new Set(); page = 1; filters(); render(); root.querySelector('[data-error]').hidden=true; status('已查询'); }
      if (el.dataset.sort) { direction = sort === el.dataset.sort ? -direction : 1; sort = el.dataset.sort; render(); }
      if (el.dataset.page) { page += Number(el.dataset.page); render(); }
      if (el.hasAttribute('data-export')) {
        const metadata = [['渠道分析', viewName(applied), '演示资料，非正式财务业绩'], ['数据截止', report.CUTOFF + ' 23:59'], ['日期依据', applied.basis === 'orders' ? '订单确认日期' : '实际完成日期'], ['开始日期', applied.start], ['结束日期', applied.end], ['金额单位', applied.unit === 'wan' ? '人民币·万元' : '人民币·元'],
          ...Object.keys(m.labels).filter(k => Object.hasOwn(applied, k) && applied[k]).map(k => [m.labels[k], applied[k] === '__missing' ? '待补充' : ['company', 'productCompany'].includes(k) ? applied[k] + '公司（演示）' : k === 'productOrg' ? applied[k] + '产品经营组' : applied[k]]), ['资料情况', { ownership: '销售归属待补充', amount: '成交金额待确认' }[applied.quality] || '全部'], ['汇总方式', m.groupKeys(applied).map(k => m.labels[k]).join('、')], ['合计', totalText()], ['统计层级',applied.granularity==='records'?'组成记录':'汇总结果'], ['比较及任务', '未提供完整对比期资料和批准任务'], ['渠道毛利', '规则及资料待确认'], ['比例分母', '结构占比为所选范围；渠道贡献仅解除主渠道条件'], [], columns().map(header)];
        const rows = [...metadata, ...sorted().map(r => columns().map(k => display(r, k)))];
        const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(r => r.map(report.csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a'); a.href = url; a.download = '渠道经营-' + viewName(applied) + '-演示.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    });
    shell();
    window.CaesarReportNavigation?.bind(root, {
      capture: () => { readDraft(); return { applied, draft, page, size, sort, direction, optional: [...optional] }; },
      restore: s => { ({ applied, draft, page, size, sort, direction } = s); optional = new Set(s.optional); filters(); render(); },
      activate: view => { applied = m.clean({ ...m.defaults, view:view==='completed'?'channels':view, basis:view==='channels'?'orders':'actual' }); draft = { ...applied }; optional.clear(); page = 1; sort = 'amount'; filters(); render(); },
      show: key => { marginActive = key === 'margin'; if (marginActive && !margin) margin = window.mountChannelMargin(marginHost, report, assets); performance.hidden = marginActive; marginHost.hidden = !marginActive; }
    });
  }
  if (window.CaesarReports) mount(window.CaesarReports);
  else root.innerHTML = '<p role="alert">报表资料未加载，请检查 shared/report-pages.js 文件是否完整后刷新。</p>';
})();
