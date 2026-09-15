(function () {
  'use strict';
  function createModel(report) {
    const cutoff = report.CUTOFF;
    const defaults = { dataset: 'common', view: 'tours', basis: 'actual', start: '2026-05-01', end: cutoff, company: '', division: '', group: '', owner: '', supply: '', status: '', quality: '', keyword: '', unit: 'wan' };
    const views = { tours: '毛利明细', groups: '部门毛利', gaps: '结算异常', adjustments: '结算调整' };
    const datasets = { common: '回团共同明细', scenarios: '独立结算算例' };
    const labels = { id: '团号／项目／服务单号', name: '名称', company: '产品经营公司', division: '事业部', group: '产品经营组', owner: '产品负责人', controller: '团控／项目负责人', supply: '供应关系', actual: '实际完成日', settlementDate: '原结算确认日', settlementNo: '原结算单号', status: '结算状态', amount: '完成分配成交额', originalRevenue: '原结算收入', originalCost: '原确认成本', revenue: '业务结算收入', cost: '确认成本', profit: '业务毛利', rate: '毛利率', revenueDelta: '已生效收入调整', costDelta: '已生效成本调整', gap: '确认资料缺口', evidence: '确认依据', currency: '币种', tax: '金额口径', record: '调整记录号', date: '调整日期', effective: '生效日期', originalPeriod: '原业务期间', businessPeriod: '本次业务期间', accountingPeriod: '本次会计期间', reason: '调整原因', incomeChange: '收入调整', costChange: '成本调整', profitChange: '毛利影响', adjustmentStatus: '调整状态', count: '团期／服务数', ready: '毛利资料齐全数', missing: '毛利待确认数', negative: '负毛利数', knownProfit: '资料齐全范围毛利', knownRate: '资料齐全范围毛利率', knownRevenue: '资料齐全范围收入', knownCost: '资料齐全范围成本', confirmed: '已结算数', completion: '结算完成比例', financeRevenue: '财务不含税收入', financeCost: '财务不含税成本', financeProfit: '财务不含税毛利', financePeriod: '财务确认期间', target: '批准毛利任务', source: '来源资料', version: '归属版本' };
    const valid = report.validProductDate;
    const known = v => typeof v === 'number' && Number.isFinite(v);
    const add = (a, b) => Math.round((a + b) * 100) / 100;
    const sum = values => values.reduce(add, 0);
    const ratio = (a, b) => known(a) && known(b) && b > 0 ? a / b * 100 : null;
    const seed = { company: 'A公司（演示）', division: '旅游事业部（演示）', group: '国内经营组（演示）', owner: '产品负责人甲（演示）', controller: '计调甲（演示）', supply: '自营组织', actual: '2026-05-02', settlementDate: '2026-05-03', status: '已结算', currency: '人民币', tax: '业务价税合计', revenueCurrency: '人民币', costCurrency: '人民币', revenueTax: '业务价税合计', costTax: '业务价税合计', revenueComplete: true, costComplete: true, source: '独立结算算例（非业务取数）', version: '演示归属V1' };
    const scenarios = [
      { ...seed, id: 'DEMO-T01', name: '三亚亲子5日游', amount: 100000, revenue: 100000, cost: 70000, settlementNo: 'DEMO-JS01', evidence: 'DEMO-SR01 / DEMO-CF01' },
      { ...seed, id: 'DEMO-T02', name: '北京故宫定制游', amount: 20000, revenue: 20000, cost: 21000, settlementNo: 'DEMO-JS02', evidence: 'DEMO-SR02 / DEMO-CF02' },
      { ...seed, id: 'DEMO-T03', name: '云南外采跟团', supply: '外部采购', amount: 30000, revenue: 30000, cost: 12000, costComplete: false, status: '待结算', settlementDate: null, settlementNo: null, evidence: 'DEMO-SR03 / DEMO-CF03（部分）' },
      { ...seed, id: 'DEMO-T04', name: '企业会务项目', company: 'B公司（演示）', group: '企业经营组（演示）', amount: 15000, revenue: null, cost: null, revenueComplete: false, costComplete: false, status: '待结算', settlementDate: null, settlementNo: null, evidence: '未提供收入及成本确认记录' },
      { ...seed, id: 'DEMO-T05', name: '日本关西深度游', company: 'B公司（演示）', group: '出境经营组（演示）', amount: 50000, revenue: 50000, cost: 40000, actual: '2026-04-27', settlementDate: '2026-04-30', settlementNo: 'DEMO-JS05', evidence: 'DEMO-SR05 / DEMO-CF05' },
      { ...seed, id: 'DEMO-T06', name: '客户关怀服务', amount: 0, revenue: 0, cost: 0, settlementNo: 'DEMO-JS06', evidence: 'DEMO-SR06 / DEMO-CF06（零金额已确认）' }
    ];
    const changes = [
      { record: 'DEMO-ADJ01', id: 'DEMO-T05', settlementNo: 'DEMO-JS05', date: '2026-05-04', effective: '2026-05-05', originalPeriod: '2026-04', businessPeriod: '2026-05', accountingPeriod: null, incomeChange: 0, costChange: 2000, adjustmentStatus: '已生效', reason: '地接后补成本', evidence: 'DEMO-CF05-ADD', currency: '人民币', tax: '业务价税合计' },
      { record: 'DEMO-ADJ02', id: 'DEMO-T01', settlementNo: 'DEMO-JS01', date: '2026-05-05', effective: null, originalPeriod: '2026-05', businessPeriod: null, accountingPeriod: null, incomeChange: -1000, costChange: 0, adjustmentStatus: '待确认', reason: '客户退费待复核', evidence: 'DEMO-CHANGE02', currency: '人民币', tax: '业务价税合计' }
    ];
    function common() {
      const buckets = new Map();
      report.returnDetailQuery({ view: 'actual', start: '1900-01-01', end: cutoff }).forEach(r => {
        const key = JSON.stringify([r.service, r.productCompany]);
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(r);
      });
      return Array.from(buckets.values(), rows => {
        const r = rows[0], coverage = report.amountCoverage(rows);
        return { id: r.service, name: [...new Set(rows.map(x => x.product))].join('、'), company: r.productCompany + '公司（演示）', division: r.division, group: r.productOrg + '产品经营组（演示）', owner: r.owner, controller: r.confirmedBy, supply: r.supply, actual: rows.map(x => x.actual).sort().at(-1), amount: coverage.unknown || coverage.unallocated ? null : coverage.value, revenue: null, cost: null, revenueComplete: false, costComplete: false, settlementNo: null, settlementDate: null, status: '待结算', currency: '人民币', tax: '待确认', evidence: rows.map(x => x.record).join('、'), source: '回团共同明细', version: r.organizationVersion };
      });
    }
    function validate(f) {
      return !valid(f.start) || !valid(f.end) || f.start > f.end || f.end > cutoff ? '请核对日期，开始日不能晚于结束日，结束日不能超过资料截止2026-05-07。' : '';
    }
    function facts(raw, adjustments = changes) {
      const r = { ...raw, originalRevenue: raw.revenue, originalCost: raw.cost };
      // 只有明确生效且对应原结算的调整计入；待确认不覆盖原值。
      const seen = new Set(), applied = adjustments.filter(a => {
        const key = a.record;
        if (seen.has(key) || !key || a.id !== r.id || a.settlementNo !== r.settlementNo || a.adjustmentStatus !== '已生效' || !valid(a.effective) || a.effective > cutoff || !r.settlementDate || a.effective < r.settlementDate) return false;
        seen.add(key); return true;
      });
      const incompatible = applied.some(a => a.currency !== r.currency || a.tax !== r.tax || !known(a.incomeChange) || !known(a.costChange));
      r.revenueDelta = incompatible ? null : sum(applied.map(a => a.incomeChange));
      r.costDelta = incompatible ? null : sum(applied.map(a => a.costChange));
      r.revenue = known(raw.revenue) && !incompatible ? add(raw.revenue, r.revenueDelta) : null;
      r.cost = known(raw.cost) && !incompatible ? add(raw.cost, r.costDelta) : null;
      const comparable = r.revenueCurrency === r.costCurrency && r.revenueCurrency === r.currency && r.revenueTax === r.costTax && r.revenueTax === r.tax && !!r.tax && r.tax !== '待确认';
      const gaps = [];
      if (!r.revenueComplete || !known(r.revenue)) gaps.push('收入未确认完整');
      if (!r.costComplete || !known(r.cost)) gaps.push('成本未确认完整');
      if (!comparable || incompatible) gaps.push('币种或金额口径待核对');
      r.gap = gaps.join('；') || '无确认缺口';
      r.profit = gaps.length ? null : add(r.revenue, -r.cost);
      r.rate = ratio(r.profit, r.revenue);
      r.financeRevenue = r.financeCost = r.financeProfit = null;
      r.financePeriod = '未提供确认记录';
      r.target = '未提供批准任务';
      return r;
    }
    function summary(rows) {
      const ready = rows.filter(r => known(r.profit)), kinds = new Set(ready.map(r => JSON.stringify([r.currency, r.tax])));
      const compatible = kinds.size <= 1, knownRevenue = compatible && ready.length ? sum(ready.map(r => r.revenue)) : null;
      const knownCost = compatible && ready.length ? sum(ready.map(r => r.cost)) : null;
      const knownProfit = compatible && ready.length ? sum(ready.map(r => r.profit)) : null;
      return { count: rows.length, ready: ready.length, missing: rows.length - ready.length, negative: ready.filter(r => r.profit < 0).length, confirmed: rows.filter(r => r.status === '已结算').length,
        knownRevenue, knownCost, knownProfit, knownRate: ratio(knownProfit, knownRevenue), completion: ratio(rows.filter(r => r.status === '已结算').length, rows.length),
        amount: rows.some(r => !known(r.amount)) || new Set(rows.map(r => r.currency)).size > 1 ? null : sum(rows.map(r => r.amount)), profit: ready.length === rows.length && compatible ? knownProfit : null };
    }
    function adjustmentSummary(rows) {
      const effective = rows.filter(r => r.adjustmentStatus === '已生效');
      const complete = effective.every(r => known(r.profitChange)) && new Set(effective.map(r => JSON.stringify([r.currency, r.tax]))).size <= 1;
      return { count: rows.length, confirmed: effective.length, pending: rows.length - effective.length,
        incomeChange: complete ? sum(effective.map(r => r.incomeChange)) : null,
        costChange: complete ? sum(effective.map(r => r.costChange)) : null,
        profitChange: complete ? sum(effective.map(r => r.profitChange)) : null };
    }
    const filterKeys = ['company', 'division', 'group', 'owner', 'supply', 'status'];
    function matches(r, f) {
      return filterKeys.every(k => !f[k] || (f[k] === '__missing' ? !r[k] : r[k] === f[k])) && (!f.keyword || [r.id, r.name, r.settlementNo].some(v => String(v || '').toLowerCase().includes(f.keyword.toLowerCase()))) &&
        (!f.quality || (f.quality === 'negative' ? r.profit < 0 : f.quality === 'cost' ? !r.costComplete || !known(r.cost) : !known(r.profit)));
    }
    function run(input, records, adjustments) {
      const f = { ...defaults, ...input }, source = records || (f.dataset === 'common' ? common() : scenarios), edits = adjustments || (f.dataset === 'common' ? [] : changes);
      const all = source.map(r => facts(r, edits)), between = date => valid(date) && date >= f.start && date <= f.end;
      const scoped = all.filter(r => matches(r, f));
      let rows = scoped.filter(r => between(f.basis === 'settlement' ? r.settlementDate : r.actual));
      if (f.view === 'gaps') rows = rows.filter(r => !known(r.profit) || r.profit < 0 || r.status !== '已结算');
      const seen = new Set();
      const adjustmentRows = edits.filter(a => scoped.some(r => r.id === a.id && r.settlementNo === a.settlementNo) && between(a.adjustmentStatus === '已生效' ? a.effective : a.date)).filter(a => {
        if (seen.has(a.record)) return false; seen.add(a.record); return true;
      }).map(a => {
        const r = scoped.find(x => x.id === a.id && x.settlementNo === a.settlementNo);
        return { ...r, ...a, profitChange: a.adjustmentStatus === '已生效' && a.currency === r.currency && a.tax === r.tax && known(a.incomeChange) && known(a.costChange) ? add(a.incomeChange, -a.costChange) : null };
      });
      if (f.view === 'adjustments') rows = scoped.filter(r => adjustmentRows.some(a => a.id === r.id));
      const buckets = new Map();
      rows.forEach(r => { const key = JSON.stringify([r.company, r.division, r.group, r.currency, r.tax]); if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(r); });
      const groups = [...buckets.values()].map(rs => ({ company: rs[0].company, division: rs[0].division, group: rs[0].group, currency: rs[0].currency, tax: rs[0].tax, ...summary(rs), target: '未提供批准任务' }));
      return { filter: f, rows, all, adjustments: adjustmentRows, adjustmentTotal: adjustmentSummary(adjustmentRows), groups, total: summary(rows) };
    }
    return { defaults, views, datasets, labels, cutoff, valid, known, sum, ratio, scenarios, changes, common, validate, facts, summary, adjustmentSummary, run, filterKeys };
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = createModel(require('./report-pages.js')); return; }
  const root = document.querySelector('[data-settlement-report]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  const assets = new URL('report-icons/', document.currentScript.src).href;
  function mount(report) {
    if (!root.isConnected) return;
    const m = createModel(report), esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    let applied = { ...m.defaults }, view = 'tours', result, optional = new Set(), page = 1, size = 10, sort = 'id', direction = 1;
    const money = new Set(['amount', 'originalRevenue', 'originalCost', 'revenue', 'cost', 'profit', 'knownProfit', 'knownRevenue', 'knownCost', 'revenueDelta', 'costDelta', 'incomeChange', 'costChange', 'profitChange', 'financeRevenue', 'financeCost', 'financeProfit']);
    const rates = new Set(['rate', 'knownRate', 'completion']);
    const base = { tours: ['id', 'name', 'group', 'actual', 'status', 'revenue', 'cost', 'profit', 'rate', 'gap'], groups: ['company', 'division', 'group', 'count', 'confirmed', 'completion', 'ready', 'missing', 'knownRevenue', 'knownCost', 'knownProfit', 'knownRate', 'profit'], gaps: ['id', 'name', 'actual', 'status', 'amount', 'revenue', 'cost', 'profit', 'gap', 'owner'], adjustments: ['record', 'id', 'settlementNo', 'originalPeriod', 'date', 'effective', 'businessPeriod', 'accountingPeriod', 'adjustmentStatus', 'incomeChange', 'costChange', 'profitChange', 'reason'] };
    const extra = ['company', 'division', 'owner', 'controller', 'supply', 'settlementNo', 'settlementDate', 'originalRevenue', 'originalCost', 'revenueDelta', 'costDelta', 'currency', 'tax', 'evidence', 'source', 'version', 'financeRevenue', 'financeCost', 'financeProfit', 'financePeriod', 'target'];
    const icon = name => '<img class="report-icon" alt="" src="' + assets + name + '.svg">';
    const button = (label, attrs) => '<button type="button" class="report-button" ' + attrs + '>' + label + '</button>';
    const select = (name, label, options, value) => '<label class="report-field"><span>' + label + '</span><select name="' + name + '">' + options.map(([v, t]) => '<option value="' + esc(v) + '"' + (value === v ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select></label>';
    function shell() {
      const all = [...m.common(), ...m.scenarios];
      root.innerHTML = '<header class="report-head"><h1>业务毛利</h1>' + button(icon('download') + '导出', 'data-export title="导出全查询结果及确认依据"') + '</header>' +
        '<div class="report-tabbar sr-tabs" role="tablist" aria-label="结算分析视图">' + Object.entries(m.views).map(([k, t]) => '<button class="report-tab" role="tab" data-view="' + k + '" aria-selected="' + (k === view) + '">' + t + '</button>').join('') + '</div>' +
        '<form class="report-filters"><div class="report-filter-row">' + select('dataset', '资料范围', Object.entries(m.datasets), applied.dataset) + select('basis', '日期依据', [['actual', '实际完成日'], ['settlement', '原结算确认日']], applied.basis) +
        ['start', 'end'].map(k => '<label class="report-field"><span>' + (k === 'start' ? '开始日期' : '结束日期') + '</span><input name="' + k + '" type="date" value="' + applied[k] + '" required></label>').join('') +
        select('unit', '金额单位', [['wan', '万元'], ['yuan', '元']], applied.unit) + '</div><details class="report-more"><summary>更多筛选</summary><div class="report-filter-row">' +
        m.filterKeys.map(k => select(k, m.labels[k], [['', '全部'], ...[...new Set(all.map(r => r[k]).filter(Boolean))].map(v => [v, v]), ['__missing', '待补充']], applied[k])).join('') +
        select('quality', '资料／毛利', [['', '全部'], ['missing', '毛利待确认'], ['cost', '成本未齐'], ['negative', '负毛利']], applied.quality) + '<label class="report-field report-field-wide"><span>团号／名称／结算单号</span><input type="search" name="keyword" value="' + esc(applied.keyword) + '"></label></div></details>' +
        '<div class="report-query-actions"><button type="submit" class="report-button">查询</button>' + button('重置', 'data-reset title="重置筛选" aria-label="重置筛选"') + '</div><p class="report-query-status" data-status role="status">已查询</p><p data-error role="alert" class="report-error" hidden></p></form>' +
        '<div class="report-meta" data-meta></div><div class="report-metrics" data-metrics></div><section class="report-section" data-result></section>' +
        '<details class="report-note"><summary>数据口径</summary><p>回团共同明细与独立结算算例分开统计。共同明细尚无收入、成本确认记录；算例不计入订单或回团业绩。资料截止2026-05-07，演示工作版V1，未接正式更新及权限。</p><p>业务毛利＝完整确认的业务结算收入－同币种同口径确认成本，不等于会计利润。付款、预付、收票不代替成本，退款支付不再次扣收入。部分确认金额可查，但不据此计算毛利。</p><p>日期条件选择原业务范围，金额含资料截止日前已生效调整，并非历史时点余额。调整视图按生效日期查询已生效记录，待确认按调整日期查询；原业务期间保留，会计期间未确认不推填。</p><p>不含税结果、收入确认政策、正式同期和批准任务尚未提供；未提交准单含义、返点处理及渠道还原毛利规则待财务确认。资料齐全范围毛利不是全范围毛利，跨币种或不同金额口径不合计。</p></details>';
      setBasis(); render();
    }
    function setBasis() {
      const el = root.querySelector('[name="basis"]'); el.disabled = view === 'adjustments';
      el.closest('label').hidden = view === 'adjustments';
    }
    function display(r, k) {
      const v = r[k];
      if (money.has(k)) return m.known(v) ? (v / (applied.unit === 'wan' ? 10000 : 1)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '待确认';
      if (rates.has(k)) return m.known(v) ? v.toFixed(2) + '%' : '无法计算';
      return v == null || v === '' ? '未提供' : String(v);
    }
    const columns = () => [...base[applied.view], ...[...optional].filter(k => !base[applied.view].includes(k))];
    const records = () => applied.view === 'groups' ? result.groups : applied.view === 'adjustments' ? result.adjustments : result.rows;
    function sorted() { return [...records()].sort((a, b) => (a[sort] == null ? 1 : b[sort] == null ? -1 : m.known(a[sort]) && m.known(b[sort]) ? a[sort] - b[sort] : String(a[sort]).localeCompare(String(b[sort]), 'zh-CN')) * direction); }
    function table(rows, cols, label, sortable) {
      return '<div class="report-table-scroll" tabindex="0" role="region" aria-label="' + label + '"><table class="report-table"><thead><tr>' + cols.map(k => '<th>' + (sortable ? '<button data-sort="' + k + '">' + m.labels[k] + (sort === k ? (direction === 1 ? ' ↑' : ' ↓') : '') + '</button>' : m.labels[k]) + '</th>').join('') + '</tr></thead><tbody>' +
        (rows.length ? rows.map(r => '<tr>' + cols.map(k => '<td class="' + (money.has(k) || rates.has(k) ? 'report-numeric ' : 'sr-text ') + (m.known(r[k]) && r[k] < 0 ? 'report-negative' : '') + '">' + esc(display(r, k)) + '</td>').join('') + '</tr>').join('') : '<tr><td colspan="' + cols.length + '"><div class="report-empty">当前条件无记录</div></td></tr>') + '</tbody></table></div>';
    }
    function totalText() {
      if (applied.view === 'adjustments') { const t = result.adjustmentTotal; return '共 ' + t.count + ' 笔调整 · 已生效 ' + t.confirmed + ' · 待确认 ' + t.pending + ' · 本期已生效毛利影响 ' + display(t, 'profitChange'); }
      const t = result.total; return '共 ' + t.count + ' 个团期／服务 · 已结算 ' + t.confirmed + ' · 毛利资料齐全 ' + t.ready + ' · 毛利待确认 ' + t.missing + ' · 负毛利 ' + t.negative + ' · 完成分配成交额 ' + display(t, 'amount');
    }
    function render() {
      result = m.run(applied); const t = result.total, rows = sorted(), pages = Math.max(1, Math.ceil(rows.length / size)); page = Math.min(page, pages);
      root.querySelector('[data-meta]').innerHTML = '<strong class="report-demo">' + m.datasets[applied.dataset] + (applied.dataset === 'scenarios' ? ' · 独立演示，非业务取数' : ' · 确认记录未提供') + '</strong><span>' + m.views[applied.view] + ' · ' + (applied.view === 'adjustments' ? '生效／调整日期' : applied.basis === 'actual' ? '实际完成日' : '原结算确认日') + ' ' + applied.start + ' 至 ' + applied.end + '</span><span>资料截止 ' + m.cutoff + ' · V1 · ' + (applied.unit === 'wan' ? '万元' : '元') + '</span>';
      const a = result.adjustmentTotal;
      const metrics = applied.view === 'adjustments' ? [['本期已生效收入调整', display(a, 'incomeChange'), a.confirmed + ' 笔已生效'], ['本期已生效成本调整', display(a, 'costChange'), a.confirmed + ' 笔已生效'], ['本期已生效毛利影响', display(a, 'profitChange'), '不含待确认调整'], ['待确认调整', a.pending + ' 笔', '尚未计入毛利']] : [['全范围业务毛利', display(t, 'profit'), t.missing + ' 个毛利待确认'], ['资料齐全范围毛利', display(t, 'knownProfit'), t.ready + ' / ' + t.count + ' 个团期／服务'], ['资料齐全范围毛利率', display(t, 'knownRate'), '按合计收入与成本计算'], ['结算完成比例', display(t, 'completion'), t.confirmed + ' / ' + t.count + ' 个已结算']];
      root.querySelector('[data-metrics]').innerHTML = metrics.map(([title, value, sub]) => '<dl class="report-metric"><dt>' + title + '</dt><dd>' + value + '</dd><small>' + sub + '</small></dl>').join('');
      const options = applied.view === 'groups' ? ['currency', 'tax', 'target'] : extra;
      root.querySelector('[data-result]').innerHTML = '<div class="report-section-head"><h2>' + m.views[applied.view] + '</h2><span data-total>' + totalText() + '</span></div><details class="report-columns"><summary>显示字段</summary><div class="report-column-options">' + options.filter(k => !base[applied.view].includes(k)).map(k => '<label><input type="checkbox" data-column="' + k + '"' + (optional.has(k) ? ' checked' : '') + '>' + m.labels[k] + '</label>').join('') + '</div></details>' +
        table(rows.slice((page - 1) * size, page * size), columns(), '结算分析结果', true) + '<div class="report-total"><span>共 ' + rows.length + ' 行</span><div class="report-pagination"><label>每页 <select name="size"><option' + (size === 5 ? ' selected' : '') + '>5</option><option' + (size === 10 ? ' selected' : '') + '>10</option></select></label>' + button(icon('chevron-left'), 'data-page="-1" title="上一页" aria-label="上一页"' + (page === 1 ? ' disabled' : '')) + '<span>' + page + ' / ' + pages + '</span>' + button(icon('chevron-right'), 'data-page="1" title="下一页" aria-label="下一页"' + (page === pages ? ' disabled' : '')) + '</div></div>' +
        '<details class="sr-sources"><summary>完整确认依据</summary>' + table(result.rows, ['id', 'name', 'company', 'division', 'group', 'settlementNo', 'settlementDate', 'originalRevenue', 'originalCost', 'revenueDelta', 'costDelta', 'revenue', 'cost', 'profit', 'gap', 'currency', 'tax', 'evidence', 'source', 'version'], '结算确认依据', false) + '</details>';
    }
    root.addEventListener('submit', e => {
      e.preventDefault(); const next = { ...applied, ...Object.fromEntries(new FormData(root.querySelector('form'))), view };
      const error = m.validate(next), el = root.querySelector('[data-error]'); el.hidden = !error; el.textContent = error;
      if (error) return; if (applied.view !== next.view) optional = new Set(); applied = next; page = 1; render(); root.querySelector('[data-status]').textContent = '已查询';
    });
    root.addEventListener('input', e => { if (e.target.closest('form')) root.querySelector('[data-status]').textContent = '条件已修改，尚未查询'; });
    root.addEventListener('change', e => {
      if (e.target.name === 'dataset') { m.filterKeys.forEach(k => root.querySelector('[name="' + k + '"]').value = ''); root.querySelector('[name="keyword"]').value = ''; }
      if (e.target.name === 'size') { size = +e.target.value; page = 1; render(); }
      if (e.target.dataset.column) { e.target.checked ? optional.add(e.target.dataset.column) : optional.delete(e.target.dataset.column); render(); root.querySelector('.report-columns').open = true; }
    });
    root.addEventListener('click', e => {
      const el = e.target.closest('button'); if (!el) return;
      if (el.dataset.view) { view = el.dataset.view; root.querySelectorAll('[data-view]').forEach(x => x.setAttribute('aria-selected', String(x.dataset.view === view))); setBasis(); root.querySelector('[data-status]').textContent = '视图已切换，尚未查询；下方保留上次结果'; }
      if (el.hasAttribute('data-reset')) { applied = { ...m.defaults, view }; optional = new Set(); page = 1; shell(); }
      if (el.dataset.sort) { direction = sort === el.dataset.sort ? -direction : 1; sort = el.dataset.sort; render(); }
      if (el.dataset.page) { page += +el.dataset.page; render(); }
      if (el.hasAttribute('data-export')) {
        const cols = columns(), full = [...new Set([...base.tours, ...extra])];
        const isAdjustment = applied.view === 'adjustments';
        const totalKeys = isAdjustment ? ['incomeChange', 'costChange', 'profitChange'] : ['profit', 'knownProfit', 'knownRevenue', 'knownCost', 'knownRate'];
        const lines = [
          ['业务毛利', m.views[applied.view], m.datasets[applied.dataset], '演示资料，非正式财务结果'],
          ['资料截止', m.cutoff, 'V1'], ['日期依据', isAdjustment ? '已生效按生效日；待确认按调整日' : applied.basis === 'actual' ? '实际完成日' : '原结算确认日'],
          ['开始日期', applied.start], ['结束日期', applied.end], ['金额单位', applied.unit === 'wan' ? '万元' : '元'],
          ...m.filterKeys.map(k => [m.labels[k], applied[k] || '全部']), ['搜索条件', applied.keyword],
          ['资料／毛利筛选', { missing: '毛利待确认', cost: '成本未齐', negative: '负毛利' }[applied.quality] || '全部'], ['范围合计', totalText()],
          ...totalKeys.map(k => [(isAdjustment ? '本期已生效' : '') + m.labels[k], display(isAdjustment ? result.adjustmentTotal : result.total, k)]),
          ['金额时点', '资料截止日前生效调整；不是历史余额'], [], cols.map(k => m.labels[k]), ...sorted().map(r => cols.map(k => display(r, k))),
          [], ['完整确认依据（关联业务截至资料截止日结果）'], full.map(k => m.labels[k]), ...result.rows.map(r => full.map(k => display(r, k)))
        ];
        const url = URL.createObjectURL(new Blob(['\uFEFF' + lines.map(row => row.map(report.csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a'); a.href = url; a.download = '团期结算-' + m.datasets[applied.dataset] + '-' + m.views[applied.view] + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    });
    shell();
    window.CaesarReportNavigation?.bind(root, {
      capture: () => ({ applied, view, page, size, sort, direction, optional: [...optional] }),
      restore: s => { ({ applied, view, page, size, sort, direction } = s); optional = new Set(s.optional); shell(); },
      activate: key => { view = key; applied = { ...m.defaults, view }; optional.clear(); page = 1; sort = 'id'; shell(); }
    });
  }
  if (window.CaesarReports) mount(window.CaesarReports);
  else root.innerHTML = '<p role="alert">报表资料未加载，请检查 shared/report-pages.js 文件是否完整后刷新。</p>';
})();
