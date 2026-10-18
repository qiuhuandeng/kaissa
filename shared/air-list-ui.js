/* 航服一级列表采用团期订单的共用布局；业务事件、单据状态和详情保持各模块负责。 */
(function () {
  'use strict';
  function element(tag, className) {
    const node = document.createElement(tag);
    node.className = className;
    return node;
  }
  function html(markup) {
    const template = document.createElement('template');
    template.innerHTML = markup;
    const fragment = template.content;
    const surface = [...fragment.children].find(node => node.matches('.ab-surface, .ao-surface, .air-surface'));
    const headerContainer = [...fragment.children].find(node => node.matches('.list-page-head, .list-page-panel, .ap-head'));
    const head = headerContainer?.matches('.list-page-panel') ? headerContainer.querySelector('.list-page-head') : headerContainer;
    // 详情、建单及页内业务表格不套用一级列表布局。
    if (!surface || !head || head.querySelector('[data-ap="back"]') || !surface.querySelector('table')) return markup;
    surface.classList.add('list-surface', 'air-list-surface');
    surface.setAttribute('aria-label', head.querySelector('h1')?.textContent || '业务列表');
    const actions = element('div', 'list-surface-filter-actions list-filter-pinned-actions air-list-actions');
    const oldActions = head.querySelector('.ao-actions, .ab-actions');
    if (oldActions) {
      actions.classList.add(...oldActions.classList);
      actions.append(...oldActions.childNodes);
    }
    const panel = head.closest('.list-page-panel');
    (panel || head).remove();
    let filter = surface.querySelector(':scope > .filter-card, :scope > .ap-search, :scope > .az-filter, :scope > .air-filter');
    if (!filter) filter = element('div', 'filter-card');
    const inventoryActions = filter.querySelector('.air-filter-actions');
    if (inventoryActions) { actions.append(...inventoryActions.childNodes); inventoryActions.remove(); }
    actions.querySelectorAll('button').forEach(button => button.type = 'button');
    filter.classList.add('list-surface-filter', 'air-list-filter');
    filter.dataset.listFilterEnhanced = 'true';
    const fields = element('div', 'list-surface-filter-fields air-list-fields');
    const query = element('div', 'filter-actions filter-query-actions');
    let firstText = true;
    for (const child of [...filter.children]) {
      if (child.matches('button')) {
        child.classList.add('btn', 'btn-secondary');
        if (/^(查询|搜索)$/.test(child.textContent.trim())) {
          child.classList.add('air-list-search');
          child.textContent = '搜索';
        }
        query.append(child);
        continue;
      }
      if (child.matches('input[type="hidden"]')) { fields.append(child); continue; }
      if (!child.matches('input, select, label')) { child.classList.add('air-filter-separator'); fields.append(child); continue; }
      const control = child.matches('input, select') ? child : child.querySelector('input, select');
      const item = element('div', 'filter-item');
      const isText = control?.matches('input:not([type="date"]):not([type="month"])');
      item.classList.add(isText && firstText ? 'filter-item-search' : 'filter-item-sm');
      if (isText) firstText = false;
      if (child.tagName === 'LABEL') {
        const labelText = [...child.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
        if (labelText && control && !control.hasAttribute('aria-label')) control.setAttribute('aria-label', labelText);
        if (control?.type === 'date') item.classList.add('air-filter-date');
        else if (control) { child.textContent = ''; child.classList.add('sr-only'); item.append(child); item.append(control); fields.append(item); continue; }
      }
      item.append(child);
      fields.append(item);
    }
    // 日期范围作为一个筛选项换行，起止日期始终一起显示。
    const start = fields.querySelector('#air-start, input[name="from"]');
    const end = fields.querySelector('#air-end, input[name="to"]');
    if (start && end) {
      const startItem = start.closest('.filter-item');
      const endItem = end.closest('.filter-item');
      const between = startItem.nextElementSibling;
      const range = element('div', 'filter-item filter-item-wide air-list-date-range');
      const separator = element('span', 'date-range-separator');
      separator.textContent = '至';
      startItem.before(range);
      range.append(start, separator, end);
      startItem.remove();
      endItem.remove();
      if (between?.classList.contains('air-filter-separator')) between.remove();
    }
    if (query.children.length) fields.append(query);
    const layout = element('div', 'list-surface-filter-layout air-list-filter-layout');
    if (fields.children.length) layout.append(fields);
    if (actions.children.length) layout.append(actions);
    filter.replaceChildren(layout);
    if (layout.children.length) surface.prepend(filter);
    const toolbar = surface.querySelector(':scope > .air-toolbar');
    if (toolbar) {
      const tabs = toolbar.querySelector('#air-tabs');
      if (tabs) toolbar.before(tabs);
      const selection = toolbar.querySelector('.air-selection');
      if (selection) {
        const bulk = element('details', 'air-list-bulk');
        const toggle = element('summary', 'btn btn-secondary');
        toggle.textContent = '批量操作';
        const menu = element('div', 'air-list-bulk-menu');
        menu.append(...selection.querySelectorAll('button'));
        bulk.append(toggle, menu);
        actions.prepend(bulk);
        surface.querySelector('.air-pagination')?.prepend(selection);
      }
      toolbar.remove();
    }
    const tabs = surface.querySelector(':scope > .tab-bar, :scope > .air-tabs');
    if (tabs) {
      tabs.classList.add('tab-bar', 'list-surface-tabs', 'list-filter-tabs', 'air-list-tabs');
      surface.insertBefore(tabs, filter.parentNode === surface ? filter.nextSibling : surface.firstChild);
    }
    for (const wrap of surface.querySelectorAll(':scope > .table-wrap, :scope > .air-table-scroll')) {
      wrap.classList.add('list-surface-table', 'air-list-table');
      if (!tabs) wrap.classList.add('air-list-table-first');
      wrap.setAttribute('tabindex', '0');
      wrap.setAttribute('aria-label', '列表，可横向滚动');
    }
    for (const foot of surface.querySelectorAll(':scope > .ab-foot, :scope > .ao-table-foot, :scope > .air-pagination, :scope > .az-page-controls')) foot.classList.add('air-list-footer');
    return template.innerHTML;
  }
  window.AirList = { html };
})();
