(function (root) {
  'use strict';
  root.mountChannelMargin = function (host, report, assets) {
    const m = root.CaesarChannelMargin, esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const icon = name => '<img class="report-icon" alt="" src="' + assets + name + '.svg">';
    let applied = { ...m.defaults }, result, page = 1, size = 10, sort = 'order', direction = 1, extras = new Set();
    const labels = { order: '订单号', product: '销售内容', sales: '渠道与销售公司', applicability: '适用范围', amount: '客户成交参考', restoredIncome: '还原后校验收入', restoredDeduction: '还原后校验扣减额', rate: '校验毛利率', status: '核对结果', gap: '资料缺口',
      income: '原校验收入', deduction: '原校验扣减额', incomeImpact: '收入还原影响', deductionImpact: '扣减额还原影响', profit: '校验毛利', rawRate: '未舍入比率', threshold: '阈值与比较方式', difference: '正式差距',
      company: '销售公司', channel: '主渠道', productCompany: '产品公司', productOrg: '产品经营组', store: '门店', center: '呼叫中心', salesGroup: '销售组', salesperson: '顾问', staff: '顾问识别及任职', management: '经营分类', supply: '供应关系', organization: '散拼／单团', source: '来源系统', currency: '币种', tax: '含税口径', ownership: '发生时归属版本', baseRef: '基础确认单号', rule: '规则版本', tour: '团号',
      id: '销售内容号', item: '销售内容号', confirmed: '订单确认日', actual: '实际完成日', settled: '结算确认日', baseAt: '基础确认日', confirmer: '确认人', definition: '原基础定义', applicabilityBasis: '适用依据', feeEvidence: '费用完整性依据',
      type: '费用或调整类型', ref: '确认单号／行号', bearer: '承担方', originalAmount: '来源费用原额（仅核对）', allocated: '本项分配额', unallocated: '来源未分配额（仅核对）', included: '是否已含原基础', at: '确认／生效日', confirmation: '确认资料', original: '原记录', period: '原业务期间', note: '本次影响依据', ...m.typeNames };
    const base = ['order', 'product', 'sales', 'applicability', 'amount', 'restoredIncome', 'restoredDeduction', 'rate', 'status', 'gap'];
    const groups = { '原基础与还原': ['income', 'deduction', 'incomeImpact', 'deductionImpact', 'profit', 'rawRate', 'threshold', 'difference'], '升舱优惠及费用': Object.keys(m.typeNames), '组织与确认依据': ['productCompany', 'productOrg', 'store', 'center', 'salesGroup', 'salesperson', 'staff', 'ownership', 'tax', 'baseRef', 'rule'] };
    const money = new Set(['amount', 'income', 'deduction', 'restoredIncome', 'restoredDeduction', 'incomeImpact', 'deductionImpact', 'profit', 'difference', 'originalAmount', 'allocated', 'unallocated', ...Object.keys(m.typeNames)]);
    const evidenceSections = [
      ['details', '销售内容及基础确认', ['order', 'id', 'product', 'gap', 'tour', 'source', 'confirmed', 'actual', 'settled', 'company', 'productCompany', 'productOrg', 'store', 'center', 'salesGroup', 'salesperson', 'staff', 'ownership', 'management', 'supply', 'organization', 'applicabilityBasis', 'amount', 'income', 'deduction', 'currency', 'tax', 'definition', 'baseRef', 'baseAt', 'confirmer', 'feeEvidence']],
      ['evidence', '升舱优惠与费用分配', ['order', 'item', 'type', 'ref', 'source', 'bearer', 'originalAmount', 'allocated', 'unallocated', 'included', 'at', 'confirmation']],
      ['impacts', '还原影响及原记录调整', ['order', 'item', 'type', 'ref', 'original', 'period', 'at', 'incomeImpact', 'deductionImpact', 'note']]
    ];
    const columns = () => [...base, ...extras];
    function display(r, k) {
      const v = r[k];
      if (money.has(k)) return m.known(v) ? (v / (applied.unit === 'wan' ? 10000 : 1)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '未确认';
      if (k === 'rate' || k === 'rawRate') return m.known(v) ? (k === 'rate' ? v.toFixed(2) : String(v)) + '%' : '无法计算';
      if (k === 'included') return v === true ? '已包含' : v === false ? '未包含' : '无法判断';
      if (Array.isArray(v)) return v.join('、') || '未提供';
      return v == null || v === '' ? '未提供' : String(v);
    }
    function header(k) { return (labels[k] || k) + (money.has(k) ? '（' + (applied.unit === 'wan' ? '万元' : '元') + '）' : ''); }
    function select(name, title, values, value = applied[name]) {
      return '<label class="report-field"><span>' + title + '</span><select name="' + name + '">' + values.map(([v, t]) => '<option value="' + esc(v) + '"' + (v === value ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select></label>';
    }
    function input(name, title, type = 'text') { return '<label class="report-field"><span>' + title + '</span><input name="' + name + '" type="' + type + '" value="' + esc(applied[name]) + '"' + (type === 'date' ? ' required' : '') + '></label>'; }
    function field(k) {
      const records = [...m.fixtures().rows, ...m.common(report, m.defaults.cutoff).rows];
      const values = [...new Set(records.map(r => r[k]).filter(Boolean))].sort();
      return select(k, labels[k], [['', '全部'], ...values.map(v => [v, ['company', 'productCompany'].includes(k) ? v + '公司（演示）' : v])]);
    }
    function form() {
      host.querySelector('[data-margin-filters]').innerHTML = '<div class="report-filter-row">' + select('dataset', '资料范围', [['common', '共同订单资料'], ['demo', '独立校验算例']]) + select('dateBasis', '日期依据', Object.entries(m.dates)) + input('start', '开始日期', 'date') + input('end', '结束日期', 'date') + input('cutoff', '资料截止', 'date') + '</div><div class="report-filter-row report-more">' + field('company') + field('channel') + select('status', '核对结果', [['', '全部'], ...['不适用', '适用范围待确认', '资料待补齐', '数据异常', '规则待确认'].map(v => [v, v])]) + '</div><details class="report-more"><summary>更多筛选</summary><div class="report-filter-row">' + input('order', '订单号') + input('tour', '团号') + ['productCompany', 'productOrg', 'store', 'center', 'salesGroup', 'salesperson', 'management', 'supply', 'organization', 'source'].map(field).join('') + select('quality', '费用资料', [['', '全部'], ['fees', '费用资料待补齐'], ['conflicts', '记录冲突或分配异常']]) + field('currency') + select('unit', '金额单位', [['yuan', '元'], ['wan', '万元']]) + '</div></details><div class="report-query-actions report-more"><button class="report-button" type="submit">查询</button><button class="report-button" type="button" data-margin-reset>重置</button></div>';
    }
    function sorted() { return [...result.summaries].sort((a, b) => {
      const av = a[sort], bv = b[sort];
      if (av == null || bv == null) return av == null ? bv == null ? 0 : 1 : -1;
      return (typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv), 'zh-CN')) * direction;
    }); }
    function table(rows, cols, title, sortable = false) {
      const content = (r, k) => sortable && k === 'gap' ? '<div class="cm-gap" title="' + esc(r.gap) + '">' + [...r.gapReasons.slice(0, 2), ...(r.gapReasons.length > 2 ? ['另' + (r.gapReasons.length - 2) + '项资料缺口'] : [])].map(v => '<span>' + esc(v === '正式还原公式及10%比较方式未批准' ? '正式校验规则未批准' : v) + '</span>').join('') + '</div>' : esc(display(r, k));
      return '<div class="report-table-scroll" tabindex="0" aria-label="' + title + '"><table class="report-table"><thead><tr>' + cols.map(k => '<th' + (sortable ? ' aria-sort="' + (sort === k ? direction > 0 ? 'ascending' : 'descending' : 'none') + '"' : '') + '>' + (sortable ? '<button type="button" data-margin-sort="' + k + '">' + header(k) + icon('arrow-up-down') + '</button>' : header(k)) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(r => '<tr>' + cols.map(k => '<td class="' + (money.has(k) || ['rate', 'rawRate', 'status', 'order'].includes(k) ? 'cm-short' : 'cm-text') + '">' + content(r, k) + '</td>').join('') + '</tr>').join('') + '</tbody></table>' + (!rows.length ? '<div class="report-empty">当前条件无记录</div>' : '') + '</div>';
    }
    function totalText() { return result.total + ' 单 · 已正式校验 0 单 · 资料或范围待核对 ' + result.missing + ' 单 · 可复算独立算例 ' + result.complete + ' 单'; }
    function render() {
      result = m.run(applied, report);
      const pages = Math.max(1, Math.ceil(result.total / size)); page = Math.min(page, pages);
      host.querySelector('[data-margin-meta]').textContent = (applied.dataset === 'demo' ? '独立校验算例 V1' : '共同订单资料 V1') + ' · 资料截止 ' + applied.cutoff + ' 23:59 · ' + m.dates[applied.dateBasis] + ' ' + applied.start + ' 至 ' + applied.end + ' · ' + (applied.currency || '原币分列') + ' · ' + (applied.unit === 'wan' ? '万元' : '元') + ' · 正式规则待确认';
      host.querySelector('[data-margin-result]').innerHTML = '<div class="report-section-head"><h2>渠道毛利校验</h2><span data-total>' + totalText() + '</span></div>' +
        '<details class="report-columns"><summary>显示字段</summary>' + Object.entries(groups).map(([title, fields]) => '<fieldset class="cm-column-group"><legend>' + title + '</legend><div class="report-column-options">' + fields.map(k => '<label><input type="checkbox" data-margin-column="' + k + '"' + (extras.has(k) ? ' checked' : '') + '>' + labels[k] + '</label>').join('') + '</div></fieldset>').join('') + '</details>' +
        table(sorted().slice((page - 1) * size, page * size), columns(), '渠道毛利订单核对', true) +
        '<div class="report-total"><span>全查询 ' + result.total + ' 单 · 正式还原及10%比较未批准</span><div class="report-pagination">' + select('marginSize', '每页条数', [5, 10, 20, 50].map(v => [String(v), v + '条/页']), String(size)) + '<button class="report-button" type="button" data-margin-page="-1" aria-label="上一页" title="上一页"' + (page === 1 ? ' disabled' : '') + '>' + icon('chevron-left') + '</button><span>' + page + ' / ' + pages + '</span><button class="report-button" type="button" data-margin-page="1" aria-label="下一页" title="下一页"' + (page === pages ? ' disabled' : '') + '>' + icon('chevron-right') + '</button></div></div>' +
        '<div class="cm-subtotals">' + (result.totals.length ? result.totals.map(t => '<p>资料齐全且分母为正的独立算例子集 · ' + esc(t.currency + ' · ' + t.tax + ' · ' + t.rule) + ' · ' + t.count + '单 · 收入 ' + display({ income: t.income }, 'income') + ' · 毛利 ' + display({ profit: t.profit }, 'profit') + ' · 合计比率 ' + t.rate.toFixed(2) + '%</p>').join('') : '<p>暂无资料齐全、可复算的适用订单；正式校验结果未形成。</p>') + '</div>' +
        evidenceSections.map(([key, title, cols]) => '<details class="cr-source" data-margin-evidence="' + key + '"><summary>' + title + '（' + result[key].length + '条）</summary>' + table(result[key], cols, title) + '</details>').join('');
    }
    function exportResult() {
      const metadata = [['渠道毛利校验', '演示资料，非正式财务结果'], ['资料范围', applied.dataset === 'demo' ? '独立校验算例V1' : '共同订单资料V1'], ['日期依据', m.dates[applied.dateBasis]], ['开始日期', applied.start], ['结束日期', applied.end], ['资料截止', applied.cutoff + ' 23:59'], ['单位', applied.unit === 'wan' ? '万元' : '元'], ['规则状态', '未批准，正式已校验0单'], ['演示公式', '给定收入减已含升舱收费加本公司已含优惠；给定扣减额减已含升舱成本，未含且已确认的费用按分配额计入'], ['10%规则', '等于、不低于或严格高于均待确认，无正式差距'], ['历史说明', '结束日期只筛订单，不是金额历史截止；原费用金额与未分配额仅核对，不按订单累加'], ...Object.keys(labels).filter(k => applied[k]).map(k => [labels[k], applied[k]]), ['核对范围', totalText()], ['已知成交参考', ...result.summaries.filter(r => m.known(r.amount)).map(r => r.order + ':' + display(r, 'amount'))], ['成交金额缺数订单', result.summaries.filter(r => !m.known(r.amount)).length], [], columns().map(header)];
      const rows = [...metadata, ...sorted().map(r => columns().map(k => display(r, k))), ...result.totals.map(t => ['齐全正分母算例子集合计', t.currency, t.tax, t.rule, t.count + '单', '收入', display({ income: t.income }, 'income'), '毛利', display({ profit: t.profit }, 'profit'), '比率', t.rate + '%']), ...evidenceSections.flatMap(([key, title, cols]) => [[], [title], cols.map(header), ...result[key].map(r => cols.map(k => display(r, k)))])];
      const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(r => r.map(report.csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = '渠道毛利校验-' + (applied.dataset === 'demo' ? '独立算例' : '共同资料') + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    host.innerHTML = '<form class="report-filters"><div data-margin-filters></div><p class="report-query-status" data-margin-status role="status">已查询 · 共同订单资料</p><p class="report-error" data-margin-error role="alert" hidden></p></form><div class="report-meta" data-margin-meta></div><section class="report-section" data-margin-result></section><section class="report-note"><h2>核对口径</h2><p>正式适用范围、原金额基础、还原公式与10%比较方式待财务确认；校验金额不是会计收入、团期毛利、门店分润或员工奖金。</p><p>独立算例以给定校验收入为分母，剔除已含升舱收费与成本、加回已计入收入的本公司优惠；未含且已确认的费用按分配额计入。已含补偿及返点不重复计入，升舱两侧分别确认。算例不计入共同经营业绩。</p><p>日期筛选不替代资料截止。来源费用原额、来源未分配额仅用于逐项核对，不按订单累加。缺失金额不视为0；同币种、同金额口径、同规则的齐全正分母子集单独合计，不平均订单毛利率。未接正式权限、取数与发布。</p></section>';
    host.addEventListener('input', e => { if (e.target.closest('form')) host.querySelector('[data-margin-status]').textContent = '条件已修改，尚未查询'; });
    host.addEventListener('change', e => {
      if (e.target.closest('form')) host.querySelector('[data-margin-status]').textContent = '条件已修改，尚未查询';
      if (e.target.name === 'marginSize') { size = Number(e.target.value); page = 1; render(); }
      const k = e.target.dataset.marginColumn;
      if (k) { e.target.checked ? extras.add(k) : extras.delete(k); render(); host.querySelector('.report-columns').open = true; }
    });
    host.addEventListener('submit', e => {
      e.preventDefault(); const next = { ...applied, ...Object.fromEntries(new FormData(e.target)) }, error = m.validate(next);
      host.querySelector('[data-margin-error]').textContent = error; host.querySelector('[data-margin-error]').hidden = !error;
      if (error) return; applied = next; page = 1; render(); host.querySelector('[data-margin-status]').textContent = '已查询 · ' + (applied.dataset === 'demo' ? '独立校验算例' : '共同订单资料');
    });
    host.addEventListener('click', e => {
      const el = e.target.closest('button'); if (!el) return;
      if (el.hasAttribute('data-margin-reset')) { applied = { ...m.defaults }; extras.clear(); page = 1; sort = 'order'; direction = 1; form(); render(); host.querySelector('[data-margin-error]').hidden = true; host.querySelector('[data-margin-status]').textContent = '已查询 · 共同订单资料'; }
      if (el.dataset.marginSort) { direction = sort === el.dataset.marginSort ? -direction : 1; sort = el.dataset.marginSort; render(); }
      if (el.dataset.marginPage) { page += Number(el.dataset.marginPage); render(); }
    });
    form(); render();
    root.CaesarReportNavigation?.bind(host, {
      capture: () => ({ applied, page, size, sort, direction, extras: [...extras] }),
      restore: s => { ({ applied, page, size, sort, direction } = s); extras = new Set(s.extras); form(); render(); },
      activate: () => {}
    });
    return { exportResult };
  };
})(window);
