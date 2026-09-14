(function () {
  "use strict";
  function createModel() {
    const metrics = { orders: '订单业绩任务', returns: '回团业绩任务', margin: '毛利任务' };
    const definitions = { orders: ['确认期间净成交额'], returns: ['实际完成分配成交额'], margin: ['业务结算毛利', '财务确认毛利'] };
    // Only demonstration responsibility references, not a second organization directory.
    const scopes = [
      ['group', '', '集团', '演示集团', '销售'],
      ['a', 'group', '公司', 'A公司（演示）', '销售'],
      ['b', 'group', '公司', 'B公司（演示）', '销售'],
      ['retail', 'a', '事业部', 'A公司／零售事业部（演示）', '销售'],
      ['dept', 'retail', '部门', 'A公司／门店销售部（演示）', '销售'],
      ['store', 'dept', '门店', 'A公司／朝阳门店（演示）', '销售'],
      ['store-team', 'store', '销售组', 'A公司／门店销售一组（演示）', '销售'],
      ['li', 'store-team', '顾问', 'A公司／朝阳门店／李欣（演示）', '销售'],
      ['call', 'retail', '呼叫中心', 'A公司／A呼叫中心（演示）', '销售'],
      ['call-team', 'call', '销售组', 'A公司／A电销一组（演示）', '销售'],
      ['wang-a', 'call-team', '顾问', 'A公司／A电销一组／王宁（演示）', '销售'],
      ['call-b', 'b', '呼叫中心', 'B公司／B呼叫中心（演示）', '销售'],
      ['team-b', 'call-b', '销售组', 'B公司／B电销一组（演示）', '销售'],
      ['wang-b', 'team-b', '顾问', 'B公司／B电销一组／王宁（演示）', '销售'],
      ['region', '', '预算区域', 'A公司／北京直营区（演示）', '销售'],
      ['channel', '', '渠道', '演示集团／呼叫中心渠道', '销售'],
      ['product-a', '', '公司', 'A公司（演示）', '产品'],
      ['division-a', 'product-a', '事业部', 'A公司／A事业部（演示）', '产品'],
      ['product-group', 'division-a', '产品经营组', 'A公司／A产品经营组（演示）', '产品']
    ].map(([id, parent, level, name, role]) => ({ id, parent, level, name, role, version: '发生时归属演示V1' }));
    const scopeFor = id => scopes.find(s => s.id === id);
    const isDescendant = (child, parent) => {
      let current = scopeFor(child);
      while (current?.parent) { if (current.parent === parent) return true; current = scopeFor(current.parent); }
      return false;
    };
    const dateValid = d => /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d;
    function cents(value) {
      const s = String(value ?? '').trim();
      if (!/^(0|[1-9]\d{0,10})(\.\d{1,2})?$/.test(s)) return null;
      const [whole, decimal = ''] = s.split('.');
      return Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
    }
    function totals(row) {
      const values = row.months.map(cents), annual = cents(row.annual);
      const monthly = values.reduce((sum, n) => sum + (n ?? 0), 0);
      const allocated = row.children.reduce((sum, c) => sum + (cents(c.amount) ?? 0), 0);
      return { annual, monthly, missing: values.filter(v => v === null).length, difference: annual === null ? null : annual - monthly,
        allocated, unallocated: annual === null ? null : annual - allocated };
    }
    function emptyTask() {
      return { id: '', family: '', parent: '', version: 1, name: '', year: '2026', metric: 'orders', definition: '', scope: '',
        tax: '', annual: '', months: Array(12).fill(''), children: [], start: '2026-01-01', end: '2026-12-31',
        calendar: '自然月（演示）', basis: '', reason: '', owner: '', state: '草稿', history: [] };
    }
    const initialTasks = [
      ['T1', '集团订单年度任务', 'group', 'orders', '演示参照', '840000'],
      ['T2', '朝阳门店回团任务', 'store', 'returns', '草稿', '120000'],
      ['T3', 'A电销组订单任务', 'call-team', 'orders', '审批中', '240000'],
      ['T4', '产品经营组毛利任务', 'product-group', 'margin', '草稿', ''],
      ['T5', '王宁个人订单任务', 'wang-b', 'orders', '草稿', '60000'],
      ['T6', '直营区域旧任务', 'region', 'returns', '已作废', '120000']
    ].map(([id, name, scope, metric, state, annual]) => ({ ...emptyTask(), id, family: id, name, scope, metric, state, annual,
      definition: metric === 'margin' ? '' : definitions[metric][0], tax: metric === 'margin' ? '' : '含税',
      months: id === 'T1' ? Array(12).fill('70000') : id === 'T3' ? Array(12).fill('20000') : Array(12).fill(''),
      basis: ['T1', 'T3'].includes(id) ? '任务拆分演示资料，非正式批准文件' : '', owner: '预算负责人（演示）', reason: '首次编制',
      children: id === 'T1' ? [{ scope: 'a', amount: '500000' }, { scope: 'b', amount: '300000' }] : [],
      history: id === 'T3' ? [{ action: '提交审批（演示）', at: '2026-05-07 10:00', state }] : [] }));
    function validate(row, records, submitting = false) {
      const old = records.find(r => r.id === row.id);
      if (old && old.state !== '草稿') return '当前任务只读，不能覆盖。';
      if (!row.name.trim() || !scopeFor(row.scope) || !metrics[row.metric]) return '请填写任务名称、指标及责任范围。';
      if (!/^\d{4}$/.test(row.year) || +row.year < 2000 || +row.year > 2100) return '任务年度须为2000至2100年。';
      if (!dateValid(row.start) || !dateValid(row.end) || row.start > row.end || ![row.start, row.end].every(d => d.startsWith(row.year + '-'))) return '生效期间须在任务年度内，开始日不能晚于结束日。';
      if (row.calendar !== '自然月（演示）') return '考核日历尚未提供批准资料。';
      if (row.definition && !definitions[row.metric].includes(row.definition)) return '金额定义与指标不匹配。';
      if (row.tax && !['含税', '不含税'].includes(row.tax)) return '请选择金额含税口径。';
      if (row.months.length !== 12 || [row.annual, ...row.months].some(v => v !== '' && cents(v) === null)) return '金额须为非负数、最多两位小数且小于一千亿元；空白表示未分解。';
      const parent = records.find(r => r.id === row.parent);
      if (row.parent && (!parent || parent.state !== '演示参照' || parent.family !== row.family || parent.scope !== row.scope || parent.metric !== row.metric || parent.year !== row.year || parent.tax !== row.tax || parent.definition !== row.definition || row.start < parent.start || row.end > parent.end)) return '调整须沿用原任务范围、年度和金额口径，生效期间应在原版本内。';
      if (old && ['family', 'parent', 'version', 'scope', 'metric', 'year'].some(k => old[k] !== row[k])) return '已保存任务的责任范围、指标、年度和版本不能改换，请新建任务。';
      if (records.some(r => r.id !== row.id && r.state !== '已作废' && r.scope === row.scope && r.metric === row.metric && r.year === row.year && !(parent && r.id === parent.id))) return '同年度、指标及责任范围已有任务；调整请从原版本发起，同一任务不能并列编制。';
      const t = totals(row), seen = [];
      for (const child of row.children) {
        if (!isDescendant(child.scope, row.scope)) return '下级责任范围须属于本任务，不能混入另一公司或产品责任。';
        if (seen.some(id => id === child.scope || isDescendant(id, child.scope) || isDescendant(child.scope, id))) return '下级分解有重复或上下级交叉，不能重复分配。';
        if (cents(child.amount) === null) return '请填写有效的下级年度分配金额。';
        seen.push(child.scope);
      }
      if (t.annual !== null && t.unallocated < 0) return '下级分配超出年度任务，请核对分配金额。';
      if (submitting && (!row.definition || !row.tax || !row.basis.trim() || !row.reason.trim() || !row.owner.trim())) return '金额口径、编制负责人、依据及编制／调整原因齐全后才能提交。';
      if (submitting && (t.annual === null || t.missing || t.difference !== 0)) return '年度任务及12个月须完整填写，月度合计必须等于年度任务后才能提交。';
      return '';
    }
    function save(row, records, at) {
      const error = validate(row, records); if (error) throw new Error(error);
      const id = row.id || 'T' + (Math.max(0, ...records.map(r => Number(r.id.slice(1)))) + 1);
      return structuredClone({ ...row, id, family: row.family || id, state: '草稿', history: [...row.history, { action: '保存草稿', at, state: '草稿' }] });
    }
    function transition(row, action, records, at) {
      if (row.state !== { submit: '草稿', withdraw: '审批中', void: '草稿' }[action]) throw new Error('当前状态不支持此操作。');
      if (action === 'submit') { const error = validate(row, records, true); if (error) throw new Error(error); }
      const state = { submit: '审批中', withdraw: '草稿', void: '已作废' }[action];
      return structuredClone({ ...row, state, history: [...row.history, { action: { submit: '提交审批（演示）', withdraw: '撤回', void: '作废' }[action], at, state }] });
    }
    function adjustment(row, records) {
      if (row.state !== '演示参照') throw new Error('只有参照版本可新建调整，正式已生效版本待接入。');
      if (records.some(r => r.parent === row.id && r.state !== '已作废')) throw new Error('该任务已有未作废调整，请先处理现有调整。');
      return structuredClone({ ...row, id: '', parent: row.id, version: Math.max(...records.filter(r => r.family === row.family).map(r => r.version)) + 1,
        state: '草稿', start: '', basis: '', reason: '', history: [] });
    }
    function query(records, f) {
      return records.filter(r => (!f.search || [r.name, scopeFor(r.scope).name].join(' ').includes(f.search.trim())) && (!f.year || r.year === f.year)
        && (!f.metric || r.metric === f.metric) && (!f.state || r.state === f.state) && (!f.role || scopeFor(r.scope).role === f.role)
        && (!f.level || scopeFor(r.scope).level === f.level) && (!f.date || r.start <= f.date && r.end >= f.date));
    }
    return { metrics, definitions, scopes, scopeFor, isDescendant, dateValid, cents, totals, emptyTask, initialTasks, validate, save, transition, adjustment, query };
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = createModel(); return; }
  const root = document.querySelector('[data-budget-targets]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  const assets = new URL('report-icons/', document.currentScript.src).href;
  function mount(report) {
    if (!root.isConnected) return;
    const m = createModel(), esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const icon = name => '<img class="report-icon" alt="" src="' + assets + name + '.svg">';
    const money = n => n === null ? '未填写' : (n / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const options = (items, selected) => items.map(([v, label]) => '<option value="' + esc(v) + '"' + (v === selected ? ' selected' : '') + '>' + esc(label) + '</option>').join('');
    const select = (name, label, items, value, disabled = false) => '<label class="report-field"><span>' + label + '</span><select name="' + name + '"' + (disabled ? ' disabled' : '') + '>' + options(items, value) + '</select></label>';
    const input = (name, label, value, type = 'text', disabled = false) => '<label class="report-field"><span>' + label + '</span><input name="' + name + '" value="' + esc(value) + '" type="' + type + '"' + (disabled ? ' disabled' : '') + (type === 'text' ? ' maxlength="200"' : '') + '></label>';
    const button = (label, attrs = '') => '<button type="button" class="report-button" ' + attrs + '>' + label + '</button>';
    const states = ['草稿', '审批中', '演示参照', '已作废'];
    const defaults = { search: '', year: '', metric: '', state: '', role: '', level: '', date: '' };
    let records = structuredClone(m.initialTasks), applied = { ...defaults }, page = 1, size = 5, sort = '', direction = 1, editor = null, readonly = false, dirty = false;
    const now = () => new Date().toLocaleString('zh-CN', { hour12: false });
    function error(message, edit = false) { const el = root.querySelector(edit ? '[data-edit-error]' : '[data-error]'); el.textContent = message; el.hidden = !message; }
    function shell() {
      root.innerHTML = '<header class="report-head"><h1>预算任务管理</h1><div class="report-actions" data-list-actions>' + button(icon('download') + '导出', 'data-export title="导出全查询任务及月度分解"') + button('新建任务', 'data-new') + '</div></header>' +
        '<div class="report-meta"><span class="report-demo">演示任务 · 无正式批准版本</span><span>人民币 · 元</span><span>考核日历：自然月（演示）</span></div>' +
        '<div data-list><form class="report-filters" data-filter><div class="report-filter-row">' + input('search', '任务／责任名称', applied.search) + input('year', '任务年度', applied.year) +
        select('metric', '任务指标', [['', '全部指标'], ...Object.entries(m.metrics)], applied.metric) + select('state', '主状态', [['', '全部状态'], ...states.map(s => [s, s])], applied.state) +
        select('role', '责任口径', [['', '全部'], ['销售', '销售责任'], ['产品', '产品责任']], applied.role) + select('level', '责任层级', [['', '全部层级'], ...[...new Set(m.scopes.map(s => s.level))].map(s => [s, s])], applied.level) +
        input('date', '版本适用日期', applied.date, 'date') + '<div class="report-query-actions"><button type="submit" class="report-button">查询</button>' + button('重置', 'data-reset') + '</div></div><p data-status class="report-query-status" role="status">已查询</p><p class="report-error" data-error role="alert" hidden></p></form><section class="report-section" data-result></section></div>' +
        '<section class="bt-editor" data-editor hidden></section><footer class="bt-footnote">演示资料仅保留在本页本次会话，刷新后恢复。尚未接入正式组织、批准任务和审批；本页提交不改变其他报表业绩及完成率。</footer>';
      render();
    }
    function queryRows() {
      return m.query(records, applied).sort((a, b) => {
        if (!sort) return 0;
        const value = r => ['annual', 'monthly', 'difference'].includes(sort) ? m.totals(r)[sort] : r[sort];
        const x = value(a), y = value(b);
        return (x === null ? 1 : y === null ? -1 : typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'zh-CN')) * direction;
      });
    }
    function actions(row) {
      const b = (action, label) => '<button type="button" class="bt-text" data-action="' + action + '" data-id="' + row.id + '">' + label + '</button>';
      if (row.state === '草稿') return b('edit', '编辑') + b('submit', '提交') + b('void', '作废');
      if (row.state === '审批中') return b('view', '查看') + b('withdraw', '撤回');
      return b('view', '查看') + (row.state === '演示参照' ? b('adjust', '新建调整') : '');
    }
    function render() {
      const rows = queryRows(), pages = Math.max(1, Math.ceil(rows.length / size)); page = Math.min(page, pages);
      const headings = [['name', '任务名称'], ['state', '主状态'], ['scope', '责任范围'], ['annual', '年度任务'], ['monthly', '月度已分解'], ['difference', '月度差额'], ['year', '年度'], ['metric', '任务指标'], ['version', '版本']];
      root.querySelector('[data-result]').innerHTML = '<div class="report-table-scroll" tabindex="0" aria-label="预算任务列表"><table class="report-table bt-table"><colgroup>' + headings.map(([k]) => '<col class="bt-col-' + k + '">').join('') + '<col class="bt-action"></colgroup><thead><tr>' + headings.map(([k, label]) => '<th' + (['name', 'year', 'annual', 'monthly', 'difference'].includes(k) ? ' aria-sort="' + (sort === k ? direction === 1 ? 'ascending' : 'descending' : 'none') + '"><button type="button" data-sort="' + k + '" title="按' + label + '排序">' + label + icon('arrow-up-down') + '</button>' : '>' + label) + '</th>').join('') + '<th class="bt-action">操作</th></tr></thead><tbody>' + rows.slice((page - 1) * size, page * size).map(r => {
        const s = m.scopeFor(r.scope), t = m.totals(r);
        return '<tr data-row="' + r.id + '"><td><strong>' + esc(r.name) + '</strong><small>' + esc(r.start + ' 至 ' + r.end) + '</small></td><td>' + r.state + '</td><td class="bt-scope"><span>' + esc(s.name) + '</span><small>' + s.role + '责任 · ' + s.level + '</small></td><td class="report-numeric">' + money(t.annual) + '</td><td class="report-numeric">' + money(t.monthly) + (t.missing ? '<small>' + t.missing + '个月未填写</small>' : '') + '</td><td class="report-numeric' + (t.difference ? ' report-negative' : '') + '">' + money(t.difference) + '</td><td>' + r.year + '</td><td>' + m.metrics[r.metric] + '</td><td>V' + r.version + '</td><td class="bt-action"><div class="bt-actions">' + actions(r) + '</div></td></tr>';
      }).join('') + '</tbody></table>' + (!rows.length ? '<p class="report-empty">当前条件无任务</p>' : '') + '</div><div class="report-total"><span data-total>共 ' + rows.length + ' 个任务版本；不同指标、责任层级及版本不相加</span><div class="report-pagination">' + select('size', '每页条数', [5, 10, 20].map(n => [String(n), n + '条/页']), String(size)) + button(icon('chevron-left'), 'data-page="-1" aria-label="上一页" title="上一页"' + (page === 1 ? ' disabled' : '')) + '<span>' + page + ' / ' + pages + '</span>' + button(icon('chevron-right'), 'data-page="1" aria-label="下一页" title="下一页"' + (page === pages ? ' disabled' : '')) + '</div></div>';
    }
    function capture() {
      if (readonly) return editor;
      const form = root.querySelector('[data-edit-form]'), data = new FormData(form);
      for (const key of ['name', 'year', 'metric', 'definition', 'scope', 'tax', 'annual', 'start', 'end', 'basis', 'reason', 'owner']) if (data.has(key)) editor[key] = String(data.get(key)).trim();
      editor.months = Array.from({ length: 12 }, (_, i) => String(data.get('month' + i) ?? '').trim());
      editor.children = Array.from(form.querySelectorAll('[data-child-row]')).map(el => ({ scope: el.querySelector('[data-child-scope]').value, amount: el.querySelector('[data-child-amount]').value.trim() }));
      return editor;
    }
    function showEditor(row, read = false) {
      editor = structuredClone(row); readonly = read; dirty = false;
      root.querySelector('[data-list]').hidden = true; root.querySelector('[data-list-actions]').hidden = true;
      renderEditor(); root.querySelector('[data-editor]').scrollIntoView({ block: 'start' });
      root.querySelector('[data-back]').focus();
    }
    function renderEditor() {
      const r = editor, locked = readonly || !!r.id || !!r.parent, s = m.scopeFor(r.scope), parent = records.find(t => t.id === r.parent);
      const area = root.querySelector('[data-editor]'); area.hidden = false;
      area.innerHTML = '<div class="bt-editor-head"><h2>' + (readonly ? '查看任务' : r.parent ? '调整任务' : r.id ? '编辑任务' : '新建任务') + ' · V' + r.version + ' · ' + r.state + '</h2><div class="report-actions">' + button(icon('chevron-left') + '返回', 'data-back') + (!readonly ? button('保存草稿', 'data-save') : '') + '</div></div>' +
        '<form data-edit-form><fieldset' + (readonly ? ' disabled' : '') + '><legend>任务范围</legend><div class="report-filter-row">' + input('name', '任务名称', r.name) + select('metric', '任务指标', Object.entries(m.metrics), r.metric, locked) + input('year', '任务年度', r.year, 'text', locked) +
        select('scope', '责任范围', [['', '请选择已有责任范围'], ...m.scopes.map(s => [s.id, s.role + ' · ' + s.level + ' · ' + s.name])], r.scope, locked) + input('owner', '编制负责人', r.owner) + '</div><p class="bt-context" data-scope-facts>' + (s ? esc(s.role + '责任 · ' + s.level + ' · ' + s.name + ' · ' + s.version) : '责任资料：待选择') + '</p><div class="report-filter-row">' +
        select('definition', '金额定义（待财务确认）', [['', '待确认'], ...m.definitions[r.metric].map(v => [v, v])], r.definition, !!r.parent) + select('tax', '金额含税口径', [['', '待确认'], ['含税', '含税'], ['不含税', '不含税']], r.tax, !!r.parent) + input('annual', '年度任务（元）', r.annual) + '</div></fieldset>' +
        '<fieldset' + (readonly ? ' disabled' : '') + '><legend>月度分解（元）</legend><p class="bt-context">' + esc(r.year) + '年1月至12月 · 自然月（演示）</p><div class="bt-months">' + r.months.map((value, i) => input('month' + i, (i + 1) + '月', value)).join('') + '</div><p data-month-total class="bt-balance" aria-live="polite"></p></fieldset>' +
        '<fieldset' + (readonly ? ' disabled' : '') + '><legend>下级年度分配（元）</legend><div data-children>' + r.children.map((c, i) => '<div class="bt-child" data-child-row><label class="report-field"><span>下级责任范围</span><select data-child-scope>' + options([['', '请选择下级'], ...m.scopes.filter(s => m.isDescendant(s.id, r.scope)).map(s => [s.id, s.level + ' · ' + s.name])], c.scope) + '</select></label><label class="report-field"><span>年度分配金额</span><input data-child-amount value="' + esc(c.amount) + '" maxlength="20" inputmode="decimal"></label>' + (!readonly ? button('移除', 'data-remove="' + i + '"') : '') + '</div>').join('') + '</div>' + (!readonly && m.scopes.some(s => m.isDescendant(s.id, r.scope)) ? button('添加分配', 'data-add-child') : '') + '<p data-child-total class="bt-balance" aria-live="polite"></p><p class="bt-context">分配金额包含在本任务内；未分配金额保留，不另生成下级任务。正式组织及分配层级待确认。</p></fieldset>' +
        '<fieldset' + (readonly ? ' disabled' : '') + '><legend>依据与生效期间</legend><div class="report-filter-row">' + input('start', '本版本生效日', r.start, 'date') + input('end', '本版本结束日', r.end, 'date') + '</div><div class="report-filter-row">' + input('basis', '编制依据／文件编号', r.basis) + input('reason', '编制／调整原因', r.reason) + '</div><p class="bt-context">年度及月度金额为该任务年度的完整目标，不按版本生效天数自动折算。正式批准与历史报表采用版本待财务确认。</p></fieldset></form>' +
        '<p class="report-error" role="alert" data-edit-error hidden></p>' + (parent ? '<section class="bt-history"><h3>调整对照</h3><p data-version-comparison></p><p>原版本保留；本次调整尚未批准，不替代原任务。</p></section>' : '') +
        '<section class="bt-history"><h3>批准记录</h3><p>未提供正式批准记录。审批由审批中心承接，本页仅演示提交及撤回。</p><h3>本次会话记录</h3>' + (r.history.length ? r.history.map(h => '<p>' + esc(h.at + ' · ' + h.action + ' · ' + h.state) + '</p>').join('') : '<p>暂无维护记录</p>') + '</section>';
      updateTotals();
    }
    function updateTotals() {
      const t = m.totals(editor), p = records.find(r => r.id === editor.parent);
      root.querySelector('[data-month-total]').textContent = '年度任务 ' + money(t.annual) + ' · 月度已分解 ' + money(t.monthly) + ' · 差额 ' + money(t.difference) + ' · ' + t.missing + '个月未填写';
      root.querySelector('[data-child-total]').textContent = '下级已分配 ' + money(t.allocated) + ' · 尚未分配 ' + money(t.unallocated);
      if (p) root.querySelector('[data-version-comparison]').textContent = '原V' + p.version + '：' + money(m.cents(p.annual)) + '元；本次V' + editor.version + '：' + money(t.annual) + '元；年度变化：' + (t.annual === null ? '未填写' : money(t.annual - m.cents(p.annual))) + '元';
    }
    function back() {
      if (dirty && !confirm('本次修改尚未保存，确认放弃？')) return;
      editor = null; dirty = false; root.querySelector('[data-editor]').hidden = true;
      root.querySelector('[data-list]').hidden = false; root.querySelector('[data-list-actions]').hidden = false; render();
    }
    function exportRows() {
      const rows = queryRows(), data = [['预算任务管理', '演示资料，非正式批准任务'], ['金额单位', '人民币·元'], ['考核日历', '自然月（演示）'], ['导出时间', now()],
        ...Object.entries(applied).map(([k, v]) => [{ search: '任务／责任名称', year: '年度', metric: '任务指标', state: '主状态', role: '责任口径', level: '责任层级', date: '版本适用日期' }[k], k === 'metric' ? m.metrics[v] || '全部' : v || '全部']),
        ['任务名称', '年度', '指标', '责任口径', '责任层级', '责任范围', '组织版本', '金额定义', '含税口径', '年度任务', ...Array.from({ length: 12 }, (_, i) => i + 1 + '月'), '月度已分解', '月度差额', '未填写月数', '下级已分配', '尚未分配', '版本', '主状态', '生效日', '结束日', '原版本', '编制负责人', '依据', '原因', '批准记录']];
      const amount = n => n === null ? '未填写' : n / 100;
      rows.forEach(r => { const s = m.scopeFor(r.scope), t = m.totals(r); data.push([r.name, r.year, m.metrics[r.metric], s.role, s.level, s.name, s.version, r.definition || '待确认', r.tax || '待确认', amount(t.annual), ...r.months.map(v => amount(m.cents(v))), amount(t.monthly), amount(t.difference), t.missing, amount(t.allocated), amount(t.unallocated), 'V' + r.version, r.state, r.start, r.end, r.parent ? 'V' + records.find(p => p.id === r.parent).version : '', r.owner, r.basis, r.reason, '未提供正式批准记录']); });
      data.push([], ['下级年度分配（包含在上级任务内，不重复累计）'], ['任务名称', '版本', '下级责任范围', '分配金额（元）']);
      rows.forEach(r => r.children.forEach(c => data.push([r.name, 'V' + r.version, m.scopeFor(c.scope).name, amount(m.cents(c.amount))])));
      const url = URL.createObjectURL(new Blob(['\uFEFF' + data.map(row => row.map(report.csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = '预算任务管理-演示.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    root.addEventListener('submit', e => {
      e.preventDefault();
      if (!e.target.matches('[data-filter]')) return;
      const f = Object.fromEntries(new FormData(e.target));
      if (f.year && !/^(20\d{2}|2100)$/.test(f.year)) return error('请填写2000至2100年的任务年度。');
      if (f.date && !m.dateValid(f.date)) return error('请填写有效适用日期。');
      applied = f; page = 1; error(''); root.querySelector('[data-status]').textContent = '已查询'; render();
    });
    root.addEventListener('input', e => {
      if (e.target.closest('[data-filter]')) root.querySelector('[data-status]').textContent = '条件已修改，待查询';
      if (e.target.closest('[data-edit-form]') && !readonly) { dirty = true; capture(); updateTotals(); }
    });
    root.addEventListener('change', e => {
      if (e.target.name === 'size') { size = Number(e.target.value); page = 1; render(); }
      if (e.target.closest('[data-edit-form]') && ['scope', 'metric'].includes(e.target.name)) {
        capture(); if (e.target.name === 'scope') editor.children = []; else editor.definition = '';
        dirty = true; renderEditor();
      }
    });
    root.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      try {
        if (b.hasAttribute('data-new')) showEditor(m.emptyTask());
        if (b.hasAttribute('data-back')) back();
        if (b.hasAttribute('data-reset')) { applied = { ...defaults }; page = 1; shell(); }
        if (b.hasAttribute('data-sort')) { direction = sort === b.dataset.sort ? -direction : 1; sort = b.dataset.sort; render(); }
        if (b.hasAttribute('data-page')) { page += Number(b.dataset.page); render(); }
        if (b.hasAttribute('data-export')) exportRows();
        if (b.hasAttribute('data-add-child')) { capture(); editor.children.push({ scope: '', amount: '' }); dirty = true; renderEditor(); }
        if (b.hasAttribute('data-remove')) { capture(); editor.children.splice(Number(b.dataset.remove), 1); dirty = true; renderEditor(); }
        if (b.hasAttribute('data-save')) {
          const saved = m.save(capture(), records, now()), i = records.findIndex(r => r.id === saved.id);
          if (i < 0) records.push(saved); else records[i] = saved;
          dirty = false; back(); root.querySelector('[data-status]').textContent = '草稿已保存 · 未发起正式审批';
        }
        if (b.hasAttribute('data-action')) {
          const r = records.find(r => r.id === b.dataset.id), action = b.dataset.action;
          if (action === 'edit' || action === 'view') showEditor(r, action === 'view');
          else if (action === 'adjust') showEditor(m.adjustment(r, records));
          else {
            if (action === 'void' && !confirm('确认作废此草稿？作废后仅可查看。')) return;
            records[records.indexOf(r)] = m.transition(r, action, records, now()); error(''); render();
            root.querySelector('[data-status]').textContent = action === 'submit' ? '已进入审批中（演示）· 未发起正式审批' : '任务状态已更新（演示）';
          }
        }
      } catch (err) { error(err.message, !!editor); }
    });
    shell();
  }
  if (window.CaesarReports) mount(window.CaesarReports);
  else root.innerHTML = '<p role="alert">报表资料未加载，请检查 shared/report-pages.js 文件是否完整后刷新。</p>';
})();
