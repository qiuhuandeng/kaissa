(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./finance-cashflow-model.js'));
  else root.CaesarReadonlyReport = factory(root.CaesarCashflow);
})(typeof window === 'object' ? window : globalThis, function (base) {
  'use strict';
  function mount(host, config) {
    const esc = base.esc;
    const heading = config.headingLevel === 1 ? 'h1' : 'h2';
    let applied = { ...config.defaults }, result, page = 1, size = 10, sort = '', direction = 1;
    const extra = new Set();
    const name = k => config.labels[k] || k;
    const control = f => '<label class="cf-field">' + esc(f.label || name(f.key)) + (f.options ? '<select name="' + f.key + '">' + f.options.map(([v, t]) => '<option value="' + esc(v) + '">' + esc(t) + '</option>').join('') + '</select>' : '<input name="' + f.key + '" type="' + (f.type || 'search') + '">') + '</label>';
    host.classList.add('cf-page', 'fr-report');
    host.innerHTML = '<header class="cf-heading"><' + heading + (config.showTitle === false ? ' hidden' : '') + '>' + esc(config.title) + '</' + heading + '><button class="btn btn-secondary" type="button" data-fr-export><img src="../../shared/report-icons/download.svg" alt="" width="14" height="14">导出</button></header>' +
      '<div class="cf-tabs" role="tablist"' + (Object.keys(config.views).length === 1 ? ' hidden' : '') + '>' + Object.entries(config.views).map(([v, t]) => '<button type="button" role="tab" data-fr-view="' + v + '">' + esc(t) + '</button>').join('') + '</div>' +
      '<form class="cf-filters">' + config.filters.filter(f => !f.more).map(control).join('') + '<details class="cf-more"><summary>更多条件</summary><div class="cf-filter-more">' + config.filters.filter(f => f.more).map(control).join('') + '</div></details><div class="cf-filter-actions"><button class="btn btn-secondary" type="submit">查询</button><button class="btn btn-secondary" type="button" data-fr-reset>重置</button></div></form>' +
      '<p class="cf-error" role="alert" hidden></p><p class="cf-notice" data-fr-notice role="status"></p><details class="cf-columns"><summary>显示字段</summary><div data-fr-columns></div></details><div class="cf-scroll" data-fr-main tabindex="0"></div>' +
      '<div class="cf-pagination"><button class="btn btn-secondary" type="button" data-fr-prev aria-label="上一页"><img src="../../shared/report-icons/chevron-left.svg" alt="" width="14" height="14"></button><span data-fr-count></span><button class="btn btn-secondary" type="button" data-fr-next aria-label="下一页"><img src="../../shared/report-icons/chevron-right.svg" alt="" width="14" height="14"></button><label>每页<select data-fr-size><option>10</option><option>25</option><option>50</option></select></label></div><div data-fr-sections></div>' +
      '<details class="cf-definition"><summary>统计口径 · 待财务确认</summary><p>' + esc(config.definition) + '</p></details>';
    const form = host.querySelector('form');
    const cols = () => [...new Set([...config.columns(applied), ...extra])];
    const display = (r, k) => config.money.includes(k) ? base.fmt(r[k]) : r[k] == null || r[k] === '' ? '未提供' : String(r[k]);
    const table = (rows, keys, sortable) => '<table><thead><tr>' + keys.map(k => '<th>' + (sortable ? '<button type="button" data-fr-sort="' + k + '">' + esc(name(k)) + (sort === k ? direction === 1 ? ' ↑' : ' ↓' : '') + '</button>' : esc(name(k))) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(r => '<tr>' + keys.map(k => '<td class="' + (config.money.includes(k) ? 'cf-number' : 'cf-value') + '">' + esc(display(r, k)) + '</td>').join('') + '</tr>').join('') + '</tbody></table>' + (rows.length ? '' : '<p class="cf-empty">' + (result.pending ? '资料不足，暂无可核对记录' : '当前条件无记录') + '</p>');
    function fields() { for (const f of config.filters) form.elements.namedItem(f.key).value = applied[f.key] ?? ''; }
    function render() {
      const rows = base.sort(result.rows, sort, direction), pages = Math.max(1, Math.ceil(rows.length / size)); page = Math.min(page, pages);
      host.querySelector('[data-fr-main]').innerHTML = table(rows.slice((page - 1) * size, page * size), cols(), true);
      host.querySelector('[data-fr-count]').textContent = '第 ' + page + ' / ' + pages + ' 页 · 共 ' + rows.length + ' 条';
      host.querySelector('[data-fr-prev]').disabled = page === 1; host.querySelector('[data-fr-next]').disabled = page === pages;
      host.querySelector('[data-fr-notice]').textContent = result.notice;
      host.querySelectorAll('[data-fr-view]').forEach(b => { b.classList.toggle('active', b.dataset.frView === applied.view); b.setAttribute('aria-selected', b.dataset.frView === applied.view); });
      host.querySelector('[data-fr-columns]').innerHTML = (config.extras || []).map(k => '<label><input type="checkbox" data-fr-column="' + k + '"' + (extra.has(k) ? ' checked' : '') + '>' + esc(name(k)) + '</label>').join('');
      host.querySelector('[data-fr-sections]').innerHTML = result.sections.map(s => '<section class="cf-section"><h2>' + esc(s.title) + '</h2><div class="cf-scroll" tabindex="0" data-fr-section="' + s.key + '">' + table(s.rows, s.columns) + '</div></section>').join('');
      host.querySelector('[data-fr-export]').disabled = result.pending;
    }
    function run(q) {
      const error = host.querySelector('.cf-error');
      try { const next = config.query(q); result = next; applied = { ...q }; page = 1; error.hidden = true; render(); }
      catch (e) { error.textContent = e.message; error.hidden = false; }
    }
    form.addEventListener('submit', event => { event.preventDefault(); run({ ...applied, ...Object.fromEntries(new FormData(form)) }); });
    host.addEventListener('click', event => {
      const b = event.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-fr-view')) { extra.clear(); run({ ...applied, view: b.dataset.frView }); fields(); }
      if (b.hasAttribute('data-fr-reset')) { extra.clear(); run({ ...config.defaults, view: applied.view }); fields(); }
      if (b.hasAttribute('data-fr-prev')) { page--; render(); }
      if (b.hasAttribute('data-fr-next')) { page++; render(); }
      if (b.hasAttribute('data-fr-sort')) { direction = sort === b.dataset.frSort ? -direction : 1; sort = b.dataset.frSort; render(); }
      if (b.hasAttribute('data-fr-export')) {
        const data = [[config.title, config.views[applied.view]], ['资料', result.notice], ['统计口径', config.definition], ...config.filters.map(f => [f.label || name(f.key), f.options ? (f.options.find(o => o[0] === applied[f.key]) || ['', '全部'])[1] : applied[f.key] || '全部']), ['排序', name(sort), direction === 1 ? '升序' : '降序']];
        const add = (title, rows, keys) => data.push([], [title], keys.map(name), ...rows.map(r => keys.map(k => config.money.includes(k) ? r[k] : display(r, k))));
        add('全部查询结果', base.sort(result.rows, sort, direction), cols()); result.sections.forEach(s => add(s.title, s.rows, s.columns));
        const url = URL.createObjectURL(new Blob([base.csv(data)], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a'); a.href = url; a.download = config.title + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    });
    host.addEventListener('change', event => {
      const b = event.target;
      if (b.hasAttribute('data-fr-size')) { size = +b.value; page = 1; render(); }
      if (b.hasAttribute('data-fr-column')) { b.checked ? extra.add(b.dataset.frColumn) : extra.delete(b.dataset.frColumn); render(); }
    });
    fields(); run(applied);
    window.CaesarReportNavigation?.bind(host, {
      capture: () => ({ applied, page, size, sort, direction, extra: [...extra] }),
      restore: s => { applied = s.applied; result = config.query(applied); page = s.page; size = s.size; sort = s.sort; direction = s.direction; extra.clear(); s.extra.forEach(k => extra.add(k)); fields(); render(); host.querySelector('[data-fr-size]').value = size; },
      activate: view => { extra.clear(); run({ ...config.defaults, view }); fields(); }
    });
    return { refresh: () => run(applied), applied: () => ({ ...applied }) };
  }
  return { mount };
});
