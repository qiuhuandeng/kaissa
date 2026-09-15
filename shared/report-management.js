(function () {
  "use strict";
  function createModel(report) {
    const sources = [
      { id: "fr", section: "rules", kind: "地理分区", name: "法国", scope: "产品目的地", owner: "产品资料维护", source: "目的地资料", targets: ["欧洲"] },
      { id: "fr-management", section: "rules", kind: "管理分区", name: "法国", scope: "产品目的地", owner: "财务经营分析", source: "管理分区对应", targets: ["欧洲经营区（演示）", "出境经营区（演示）"] },
      { id: "call", section: "rules", kind: "渠道分类", name: "官网咨询／电话成交", scope: "A公司（演示）", owner: "渠道运营、财务经营分析", source: "成交渠道及获客来源", targets: ["呼叫中心"] },
      { id: "budget", section: "rules", kind: "预算区域", name: "B电销一组", scope: "B公司（演示）", owner: "财务预算负责人", source: "销售组和预算区域对应", targets: ["呼叫中心B区（拟）"] },
      { id: "supply", section: "rules", kind: "经营分类", name: "集团内部供应", scope: "演示集团", owner: "财务经营分析、产品负责人", source: "集团经营分类依据", targets: ["自营（拟）", "甄选（拟）", "外采（拟）"] },
      { id: "store", section: "organizations", kind: "销售组织", name: "朝阳门店／门店销售部", scope: "A公司（演示）", owner: "组织维护、财务经营分析", source: "订单发生时销售归属", targets: ["A公司／零售事业部（演示）"], financeDepartment: null },
      { id: "product-b", section: "organizations", kind: "产品组织", name: "B产品经营组", scope: "B公司（演示）", owner: "产品经营负责人、组织维护", source: "订单发生时产品归属", targets: ["B公司／B事业部（演示）"], financeDepartment: null },
      { id: "call-b", section: "organizations", kind: "销售组织", name: "B呼叫中心／B电销一组", scope: "B公司（演示）", owner: "组织维护、财务经营分析", source: "订单发生时销售归属", targets: ["B公司／直销事业部（演示）"], financeDepartment: null },
      { id: "accounting", section: "organizations", kind: "核算部门", name: "A公司门店销售部", scope: "A公司（演示）", owner: "核算会计、组织维护", source: "集团财务核算系统部门资料", targets: [], financeDepartment: null }
    ];
    const initialRules = sources.map((s, i) => ({ id: "RULE-" + (i + 1), sourceId: s.id, version: 1,
      target: ["budget", "supply", "accounting"].includes(s.id) ? "" : s.targets[0],
      start: "2026-01-01", end: "2026-12-31", state: ["budget", "accounting"].includes(s.id) ? "草稿" : s.id === "supply" ? "待确认" : "演示参照",
      basis: ["budget", "supply", "accounting"].includes(s.id) ? "" : "既有明细演示资料；非正式批准依据",
      reason: "首版对应资料", parent: "", history: [] }));
    const sourceFor = row => sources.find(s => s.id === row.sourceId);
    const dateValid = date => /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
    const overlaps = (a, b) => a.start <= b.end && b.start <= a.end;
    function validateRule(row, records, submitting = false) {
      const source = sourceFor(row);
      if (!source) return "请选择已有来源资料。";
      if (!dateValid(row.start) || !dateValid(row.end) || row.start > row.end) return "请填写有效生效期间，开始日不能晚于结束日。";
      if (row.target && !source.targets.includes(row.target)) return "报表分类或组织对应不在已提供资料内。";
      if (!row.reason.trim()) return "请填写维护原因。";
      if (submitting && (!row.target || !row.basis.trim())) return "对应结果或确认依据未提供，不能提交。";
      if (records.some(r => r.id !== row.id && r.sourceId === row.sourceId && r.state !== "已作废" && overlaps(r, row))) return "同一来源的生效期间交叠，请核对原版本和起止日期。";
      return "";
    }
    function transition(row, action, records, at) {
      const expected = { submit: "草稿", withdraw: "待确认", void: "草稿" };
      if (row.state !== expected[action]) throw new Error("当前状态不支持此操作。");
      if (action === "submit") { const error = validateRule(row, records, true); if (error) throw new Error(error); }
      const state = { submit: "待确认", withdraw: "草稿", void: "已作废" }[action];
      return { ...row, state, history: [...row.history, { action: { submit: "提交待确认", withdraw: "撤回", void: "作废" }[action], at, state }] };
    }
    function versionDraft(row, records) {
      const day = new Date(row.end + "T00:00:00Z"); day.setUTCDate(day.getUTCDate() + 1);
      return { ...row, id: "", version: Math.max(...records.filter(r => r.sourceId === row.sourceId).map(r => r.version)) + 1,
        start: day.toISOString().slice(0, 10), end: "", state: "草稿", basis: "", reason: "", parent: row.id, history: [] };
    }
    function filterRules(records, filter, section) {
      return records.filter(row => {
        const s = sourceFor(row);
        return s.section === section && (!filter.state || row.state === filter.state)
          && (!filter.kind || s.kind === filter.kind) && (!filter.date || row.start <= filter.date && row.end >= filter.date)
          && (!filter.search || [s.name, s.scope, row.target].join(" ").includes(filter.search.trim()));
      });
    }
    const checks = [
      ["salesLeader", "销售部门领导", "组织维护", "员工任职资料"],
      ["owner", "产品负责人", "产品资料维护", "产品经营归属"],
      ["destination", "主目的地", "产品资料维护", "产品目的地资料"],
      ["managementZone", "管理目的地分区", "财务经营分析", "管理分区对应"],
      ["management", "经营分类", "财务经营分析", "集团经营分类规则"],
      ["budgetRegion", "预算区域", "财务预算负责人", "预算区域对应"],
      ["financeRevenue", "财务确认收入", "收入核算会计", "收入确认及完成分配"],
      ["cost", "可归属成本", "成本结算会计", "成本确认及完成分配"]
    ];
    const missing = v => v == null || v === "" || ["待补充", "待确认", "未归类"].includes(v);
    function inspect(filter) {
      const f = { start: filter.start, end: filter.end, company: filter.company, status: "有效", view: filter.basis === "returns" ? "actual" : "orders" };
      const rows = filter.basis === "returns" ? report.returnDetailQuery(f) : report.orderDetailQuery(f);
      const activeChecks = checks.filter(([key]) => filter.basis === "returns" || !["financeRevenue", "cost"].includes(key));
      const details = rows.flatMap(r => activeChecks.filter(([key]) => (!filter.issue || key === filter.issue) && missing(r[key])).map(([key, label, owner, source]) => ({
        rowId: filter.basis === "returns" ? r.record : r.id, order: r.order, product: r.product, date: filter.basis === "returns" ? r.actual : r.confirmed,
        issue: label, key, value: r[key + "State"] || (["financeRevenue", "cost"].includes(key) ? "未提供确认记录" : ["management", "managementZone"].includes(key) ? "待确认" : "待补充"),
        owner, source, amount: r.amount, amountState: r.amountState
      })));
      const affected = Array.from(new Map(details.map(r => [r.rowId, r])).values());
      const summary = activeChecks.filter(([key]) => !filter.issue || key === filter.issue).map(([key, label, owner, source]) => {
        const entries = details.filter(r => r.key === key);
        return { key, label, owner, source, count: entries.length, coverage: report.amountCoverage(entries) };
      });
      return { rows, details, summary, affected, coverage: report.amountCoverage(affected) };
    }
    return { sources, initialRules, sourceFor, dateValid, overlaps, validateRule, transition, versionDraft, filterRules, checks, inspect };
  }
  if (typeof module !== "undefined" && module.exports) { module.exports = createModel(require("./report-pages.js")); return; }
  const root = document.querySelector("[data-report-management]");
  if (!root || root.dataset.ready) return;
  root.dataset.ready = "true";
  const assetBase = new URL("report-icons/", document.currentScript.src).href;
  function mount(report) {
    if (!root.isConnected) return;
    const model = createModel(report), esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const icon = name => '<img class="report-icon" alt="" src="' + assetBase + name + '.svg">';
    let tab = "checks", records = structuredClone(model.initialRules), page = 1, pageSize = 5, sort = "", direction = 1, editor = null, editorDirty = false;
    const checkDefaults = { basis: "orders", start: "2026-05-01", end: report.CUTOFF, company: "", issue: "", unit: "yuan" };
    const ruleDefaults = { search: "", state: "", kind: "", date: "" };
    let applied = { ...checkDefaults }, ruleFilter = { ...ruleDefaults }, activeExport = { rows: [], columns: [], metadata: [] };
    const labels = { checks: "数据核对", rules: "分类规则", organizations: "组织对应" };
    const field = (name, title, type = "text", value = "", required = false) => '<label class="report-field"><span>' + title + '</span><input name="' + name + '" type="' + type + '" value="' + esc(value) + '"' + (required ? ' required' : '') + (type === 'text' ? ' maxlength="200"' : '') + '></label>';
    const select = (name, title, choices, value = "") => '<label class="report-field"><span>' + title + '</span><select name="' + name + '">' + choices.map(([v, t]) => '<option value="' + esc(v) + '"' + (v === value ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select></label>';
    const button = (text, attrs = "", primary = false) => '<button type="button" class="report-button' + (primary ? ' rm-primary' : '') + '" ' + attrs + '>' + text + '</button>';
    const now = () => new Date().toLocaleString('zh-CN', { hour12: false });
    const money = value => value === null ? "待确认" : (value / (applied.unit === 'wan' ? 10000 : 1)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const unit = () => applied.unit === 'wan' ? '万元' : '元';
    function shell() {
      root.innerHTML = '<header class="report-head"><h1>数据管理</h1><div class="report-actions">' + button(icon('download') + '导出', 'data-export title="导出全查询结果"') +
        (tab === 'checks' ? button('重新检查', 'data-recheck') : button('新建', 'data-new', true)) + '</div></header>' +
        '<div class="rm-tabs report-tabbar" role="tablist" aria-label="报表管理视图">' + Object.entries(labels).map(([key, name]) => '<button type="button" class="report-tab" role="tab" aria-selected="' + (tab === key) + '" data-tab="' + key + '">' + name + '</button>').join('') + '</div>' +
        '<div data-list><form class="report-filters" data-filter><div class="report-filter-row">' + (tab === 'checks'
          ? select('basis', '核对明细', [['orders', '订单明细'], ['returns', '实际回团明细']], applied.basis) + field('start', '开始日期', 'date', applied.start, true) + field('end', '结束日期', 'date', applied.end, true) +
            select('company', '销售公司', [['', '演示集团全部'], ['A', 'A公司（演示）'], ['B', 'B公司（演示）']], applied.company) +
            select('issue', '核对字段', [['', '全部字段'], ...model.checks.filter(([k]) => applied.basis === 'returns' || !['financeRevenue', 'cost'].includes(k)).map(([k, t]) => [k, t])], applied.issue) + select('unit', '金额单位', [['yuan', '人民币·元'], ['wan', '人民币·万元']], applied.unit)
          : field('search', '名称／对应结果', 'text', ruleFilter.search) + select('state', '主状态', [['', '全部'], ...['草稿', '待确认', '演示参照', '已作废'].map(v => [v, v])], ruleFilter.state) +
            select('kind', '对应类别', [['', '全部'], ...Array.from(new Set(model.sources.filter(s => s.section === tab).map(s => s.kind))).map(v => [v, v])], ruleFilter.kind) + field('date', '适用日期', 'date', ruleFilter.date)) +
        '<div class="report-query-actions"><button class="report-button" type="submit">查询</button>' + button('重置', 'data-reset') + '</div></div><p class="report-query-status" data-status role="status">已查询 · 演示资料</p><p class="report-error" data-error role="alert" hidden></p></form><div data-result></div></div><section class="rm-editor" data-editor hidden></section>' +
        '<details class="report-note"><summary>数据口径说明</summary><p>演示资料，非正式批准规则；维护记录仅保留在本页本次会话，刷新后恢复。提交仅演示待确认，不发起正式审批，不改写源单或其他报表。</p><p>核对范围为2026-05-07日终的既有订单销售内容及实际完成样例，按所选日期核对。多项缺口可能涉及同一条业务，涉及成交额按业务去重，不将缺口金额相加；不代表缺失收入或成本金额。</p><p>分类和组织对应需由责任人员确认生效期间；历史发生时归属不随当前对应覆盖。核算主体是独立记账单位，其部门资料未提供，不从销售公司推填。正式来源更新、发布、权限和订阅尚未接入。</p></details>';
      render();
    }
    function table(rows, cols, actions = false, sortable = true) {
      const numeric = c => ['amount', 'count'].includes(c.key) ? ' class="report-numeric"' : '';
      const head = cols.map(c => '<th' + numeric(c) + (sortable ? ' aria-sort="' + (sort === c.key ? direction === 1 ? 'ascending' : 'descending' : 'none') + '"' : '') + '>' + (sortable ? '<button type="button" data-sort="' + c.key + '" title="按' + c.label + '排序">' : '') + c.label + (sortable ? icon('arrow-up-down') + '</button>' : '') + '</th>').join('');
      const body = rows.map(r => '<tr>' + cols.map(c => '<td' + numeric(c) + ' title="' + esc(r[c.key]) + '">' + esc(r[c.key]) + '</td>').join('') + (actions ? '<td class="rm-action-col"><div class="rm-actions">' + actionButtons(r) + '</div></td>' : '') + '</tr>').join('');
      return '<div class="report-table-scroll" tabindex="0" aria-label="' + (actions ? '对应规则列表' : '核对结果') + '"><table class="report-table rm-table' + (actions ? ' rm-with-actions' : '') + '"><colgroup>' + cols.map(c => '<col class="rm-col-' + c.key + '">').join('') + (actions ? '<col class="rm-action-col">' : '') + '</colgroup><thead><tr>' + head + (actions ? '<th class="rm-action-col">操作</th>' : '') + '</tr></thead><tbody>' + body + '</tbody></table>' + (!rows.length ? '<div class="report-empty">' + (tab === 'checks' ? '当前条件无缺口记录' : '当前条件无对应记录') + '</div>' : '') + '</div>';
    }
    function actionButtons(row) {
      const action = (verb, label) => '<button type="button" class="rm-text-button" data-action="' + verb + '" data-id="' + row.id + '">' + label + '</button>';
      if (row.state === '草稿') return action('edit', '编辑') + action('submit', '提交') + action('void', '作废');
      if (row.state === '待确认') return action('view', '查看') + action('withdraw', '撤回');
      return action('view', '查看') + (row.state === '演示参照' ? action('change', '新建变更') : '');
    }
    function sorted(rows) {
      return [...rows].sort((a, b) => !sort ? 0 : (typeof a[sort] === 'number' ? a[sort] - b[sort] : String(a[sort] ?? '').localeCompare(String(b[sort] ?? ''), 'zh-CN')) * direction);
    }
    function pager(count) {
      const pages = Math.max(1, Math.ceil(count / pageSize)); page = Math.min(page, pages);
      return '<div class="report-pagination">' + select('pageSize', '每页条数', [5, 10, 20, 50].map(n => [String(n), n + '条/页']), String(pageSize)) +
        button(icon('chevron-left'), 'data-page="-1" aria-label="上一页" title="上一页"' + (page === 1 ? ' disabled' : '')) + '<span>' + page + ' / ' + pages + '</span>' + button(icon('chevron-right'), 'data-page="1" aria-label="下一页" title="下一页"' + (page === pages ? ' disabled' : '')) + '</div>';
    }
    function render() {
      let rows, columns, summary = '', footer, metadata;
      if (tab === 'checks') {
        const result = model.inspect(applied);
        const summaryColumns = [{ key: 'label', label: '核对字段' }, { key: 'count', label: '缺口条数' }, { key: 'amount', label: '涉及成交额（' + unit() + '）' }, { key: 'owner', label: '负责角色' }, { key: 'source', label: '核对资料' }];
        summary = '<h2>字段核对</h2>' + table(result.summary.map(r => ({ ...r, amount: money(r.coverage.value) })), summaryColumns, false, false) + '<h2>缺口明细</h2>';
        rows = sorted(result.details).map(r => ({ ...r, amount: money(r.amount ?? null) }));
        columns = [{ key: 'order', label: '订单号' }, { key: 'rowId', label: applied.basis === 'returns' ? '完成记录号' : '销售内容编号' }, { key: 'product', label: '销售内容' }, { key: 'date', label: applied.basis === 'returns' ? '实际完成日' : '订单确认日' }, { key: 'issue', label: '缺口字段' }, { key: 'value', label: '资料情况' }, { key: 'amount', label: '涉及成交额（' + unit() + '）' }, { key: 'owner', label: '负责角色' }, { key: 'source', label: '核对资料' }];
        footer = '核对 ' + result.rows.length + ' 条业务 · ' + result.details.length + ' 项缺口 · 涉及 ' + result.affected.length + ' 条业务 · 去重涉及成交额 ' + money(result.coverage.value) + ' ' + unit();
        metadata = [['核对明细', applied.basis === 'returns' ? '实际回团明细' : '订单明细'], ['日期依据', applied.basis === 'returns' ? '实际完成日期' : '订单确认日期'], ['开始日期', applied.start], ['结束日期', applied.end], ['销售公司', applied.company ? applied.company + '公司（演示）' : '演示集团全部'], ['核对字段', model.checks.find(c => c[0] === applied.issue)?.[1] || '全部字段'], ['金额单位', '人民币·' + unit()], ['数据截止', report.CUTOFF + ' 23:59'], ['金额含义', '缺口涉及的成交金额，不代表缺失收入成本金额'], ['全查询合计', footer]];
      } else {
        rows = sorted(model.filterRules(records, ruleFilter, tab).map(r => ({ ...r, ...model.sourceFor(r), id: r.id, name: model.sourceFor(r).name, target: r.target || '待确认', period: r.start + ' 至 ' + r.end, versionLabel: 'V' + r.version })));
        columns = [{ key: 'name', label: '来源名称' }, { key: 'kind', label: '对应类别' }, { key: 'scope', label: '适用范围' }, { key: 'state', label: '主状态' }, { key: 'target', label: tab === 'organizations' ? '报表组织' : '报表分类' }, { key: 'period', label: '生效期间' }, { key: 'versionLabel', label: '版本' }];
        footer = rows.length + ' 条对应记录';
        metadata = [['名称筛选', ruleFilter.search], ['主状态', ruleFilter.state || '全部'], ['对应类别', ruleFilter.kind || '全部'], ['适用日期', ruleFilter.date || '全部期间'], ['全查询合计', footer]];
      }
      activeExport = { rows, columns, metadata };
      const pagination = pager(rows.length);
      root.querySelector('[data-result]').innerHTML = '<section class="report-section">' + summary + table(rows.slice((page - 1) * pageSize, page * pageSize), columns, tab !== 'checks') + '<div class="report-total"><span data-total>' + esc(footer) + '</span>' + pagination + '</div></section>';
    }
    const status = text => { root.querySelector('[data-status]').textContent = text; };
    const error = text => { const el = root.querySelector('[data-error]'); el.textContent = text; el.hidden = !text; };
    function showEditor(row, readonly = false) {
      editor = { ...structuredClone(row), readonly }; editorDirty = false;
      const s = model.sourceFor(row), choices = model.sources.filter(s => s.section === tab).map(s => [s.id, s.name + ' · ' + s.kind]);
      root.querySelector('[data-list]').hidden = true;
      const panel = root.querySelector('[data-editor]'); panel.hidden = false;
      root.querySelector('[data-new]').hidden = true; root.querySelector('[data-export]').hidden = true;
      panel.innerHTML = '<header class="report-section-head"><div class="rm-editor-title">' + button(icon('chevron-left') + '返回', 'data-back') + '<h2>' + (readonly ? '对应记录' : row.id ? '编辑对应' : row.parent ? '新建变更' : '新建对应') + '</h2></div>' + (!readonly ? button('保存草稿', 'data-save', true) : '') + '</header><form data-edit-form><fieldset' + (readonly ? ' disabled' : '') + '>' +
        select('sourceId', '来源资料', [['', '请选择'], ...choices], row.sourceId) + '<div data-source-facts></div><div class="report-filter-row">' + select('target', tab === 'organizations' ? '报表组织' : '报表分类', [['', '待确认'], ...(s?.targets || []).map(t => [t, t])], row.target) + field('start', '生效开始日', 'date', row.start, true) + field('end', '生效结束日', 'date', row.end, true) + '</div>' +
        field('basis', '确认依据', 'text', row.basis) + field('reason', '维护原因', 'text', row.reason, true) + '</fieldset><p class="report-error" data-edit-error role="alert" hidden></p></form><div class="rm-record-history"><h3>记录</h3><p>主状态：' + esc(row.state) + ' · 版本：V' + row.version + '</p>' + (row.parent ? '<p>原版本：' + esc(records.find(r => r.id === row.parent)?.version) + ' · 原记录保留</p>' : '') + '<p>确认结果：' + (row.state === '演示参照' ? '既有演示资料，未提供正式批准记录' : '未取得正式确认') + '</p>' + row.history.map(h => '<p>' + esc(h.at + ' · ' + h.action + ' · ' + h.state) + '</p>').join('') + '</div>';
      panel.querySelector('[name="sourceId"]').disabled = readonly || Boolean(row.id || row.parent);
      sourceFacts();
      panel.querySelector('[data-back]').focus();
    }
    function sourceFacts() {
      const s = model.sources.find(s => s.id === root.querySelector('[data-edit-form] [name="sourceId"]').value);
      root.querySelector('[data-source-facts]').innerHTML = s ? '<dl class="rm-source-facts"><dt>适用范围</dt><dd>' + esc(s.scope) + '</dd><dt>资料来源</dt><dd>' + esc(s.source) + '</dd><dt>负责角色</dt><dd>' + esc(s.owner) + '</dd>' + (s.section === 'organizations' ? '<dt>核算部门</dt><dd>未提供对应资料</dd>' : '') + '</dl>' : '';
    }
    function leaveEditor() {
      if (editorDirty && !window.confirm('当前内容未保存，确认离开吗？')) return false;
      editor = null; editorDirty = false; shell(); return true;
    }
    function save() {
      const form = root.querySelector('[data-edit-form]');
      const data = Object.fromEntries(new FormData(form));
      const row = { ...editor, ...data, sourceId: form.elements.sourceId.value, state: '草稿' };
      const err = model.validateRule(row, records);
      if (err) { const el = form.querySelector('[data-edit-error]'); el.textContent = err; el.hidden = false; return; }
      if (!row.id) { row.id = 'RULE-' + (Math.max(...records.map(r => Number(r.id.split('-')[1]))) + 1); row.version = Math.max(0, ...records.filter(r => r.sourceId === row.sourceId).map(r => r.version)) + 1; }
      row.history = [...row.history, { at: now(), action: '保存草稿', state: '草稿' }]; delete row.readonly;
      records = records.some(r => r.id === row.id) ? records.map(r => r.id === row.id ? row : r) : [...records, row];
      editorDirty = false; leaveEditor(); status('草稿已保存在本页演示会话，未改变生效记录');
    }
    root.addEventListener('submit', e => {
      e.preventDefault(); if (!e.target.matches('[data-filter]')) return;
      const data = Object.fromEntries(new FormData(e.target));
      if (tab === 'checks') {
        if (!model.dateValid(data.start) || !model.dateValid(data.end) || data.start > data.end || data.end > report.CUTOFF) { error('请核对日期范围，不能超过演示截止日2026-05-07。'); return; }
        applied = data;
      } else { if (data.date && !model.dateValid(data.date)) { error('请选择有效适用日期。'); return; } ruleFilter = data; }
      page = 1; error(''); render(); status('已查询 · 演示资料');
    });
    root.addEventListener('input', e => { if (e.target.closest('[data-edit-form]')) editorDirty = true; else if (e.target.closest('[data-filter]')) status('条件已修改，尚未查询'); });
    root.addEventListener('change', e => {
      const el = e.target;
      if (el.name === 'pageSize') { pageSize = Number(el.value); page = 1; render(); return; }
      if (el.closest('[data-filter]')) {
        if (el.name === 'basis') { const issue = root.querySelector('[name="issue"]'); issue.innerHTML = '<option value="">全部字段</option>' + model.checks.filter(([key]) => el.value === 'returns' || !['financeRevenue', 'cost'].includes(key)).map(([key, label]) => '<option value="' + key + '">' + label + '</option>').join(''); }
        status('条件已修改，尚未查询');
      }
      if (el.closest('[data-edit-form]')) { editorDirty = true; if (el.name === 'sourceId') { const s = model.sources.find(s => s.id === el.value); root.querySelector('[data-edit-form] [name="target"]').innerHTML = '<option value="">待确认</option>' + (s?.targets || []).map(t => '<option>' + esc(t) + '</option>').join(''); sourceFacts(); } }
    });
    root.addEventListener('click', e => {
      const el = e.target.closest('button'); if (!el) return;
      if (el.dataset.tab) { if (editor && !leaveEditor()) return; tab = el.dataset.tab; ruleFilter = { ...ruleDefaults }; sort = ''; page = 1; shell(); }
      if (el.hasAttribute('data-reset')) { if (tab === 'checks') applied = { ...checkDefaults }; else ruleFilter = { ...ruleDefaults }; page = 1; sort = ''; shell(); }
      if (el.hasAttribute('data-recheck')) { render(); status('已重新检查已查询的演示资料；未拉取正式来源，新条件需查询'); }
      if (el.dataset.sort) { direction = sort === el.dataset.sort ? -direction : 1; sort = el.dataset.sort; render(); }
      if (el.dataset.page) { page += Number(el.dataset.page); render(); }
      if (el.hasAttribute('data-new')) showEditor({ id: '', sourceId: '', target: '', start: '', end: '', state: '草稿', basis: '', reason: '', version: 1, parent: '', history: [] });
      if (el.hasAttribute('data-back')) leaveEditor();
      if (el.hasAttribute('data-save')) save();
      if (el.dataset.action) {
        const row = records.find(r => r.id === el.dataset.id), action = el.dataset.action;
        if (action === 'view' || action === 'edit') showEditor(row, action === 'view');
        else if (action === 'change') showEditor(model.versionDraft(row, records));
        else if (action !== 'void' || window.confirm('确认作废此草稿？原版本不受影响。')) {
          try { records = records.map(r => r.id === row.id ? model.transition(r, action, records, now()) : r); error(''); render(); status(action === 'submit' ? '已提交本页演示待确认，未发起正式审批' : '已更新本页演示记录'); }
          catch (err) { error(err.message); }
        }
      }
      if (el.hasAttribute('data-export')) {
        const out = activeExport;
        const csv = [['报表管理', labels[tab], '演示资料，非正式批准规则'], ...out.metadata, [], out.columns.map(c => c.label), ...out.rows.map(r => out.columns.map(c => r[c.key]))].map(r => r.map(report.csvCell).join(',')).join('\r\n');
        const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a'); a.href = url; a.download = '报表管理-' + labels[tab] + '-演示.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    });
    shell();
    window.CaesarReportNavigation?.bind(root, {
      capture: () => ({ tab, applied, ruleFilter, page, pageSize, sort, direction }),
      restore: s => { ({ tab, applied, ruleFilter, page, pageSize, sort, direction } = s); shell(); },
      activate: key => { tab = key; ruleFilter = { ...ruleDefaults }; page = 1; sort = ''; shell(); },
      leave: () => !editor || leaveEditor()
    });
  }
  if (window.CaesarReports) mount(window.CaesarReports);
  else root.innerHTML = '<p role="alert">报表资料未加载，请检查 shared/report-pages.js 文件是否完整后刷新。</p>';
})();
