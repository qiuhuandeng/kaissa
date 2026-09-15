(function () {
  'use strict';

  document.documentElement.classList.add('data-report-ui-enabled');

  const unitSelector = [
    '.fr-report',
    '[data-report-page]',
    '[data-overview-finance]',
    '[data-monthly-profit]',
    '[data-contribution]',
    '[data-resource-cost]',
    '[data-channel-report]',
    '[data-settlement-report]',
    '[data-supplier-report]',
    '#finance-cashflow',
    '#finance-balances',
    '#finance-prepayments',
    '#finance-funds',
    '#finance-invoice-report',
    '[data-accounting-confirmations]',
    '#finance-accounting-report',
    '[data-budget-targets]',
    '[data-profit-budget]',
    '[data-report-management]',
    '[data-report-governance]',
    '[data-gov-report]',
    '[data-report-scenarios]'
  ].join(',');

  const exportSelector = [
    '[data-export]',
    '[data-fr-export]',
    '[data-cf-export]',
    '[data-cf-evidence-export]',
    '[data-ba-export]',
    '[data-ba-evidence-export]'
  ].join(',');

  const secondaryActionSelector = [
    '[data-new]',
    '[data-recheck]',
    '[data-cf-print]',
    '[data-gov-update]',
    '[data-gov-fail]',
    '[data-gov-publish]',
    '[data-gov-correct]'
  ].join(',');

  function isAvailable(element) {
    return Boolean(element && !element.closest('[hidden]'));
  }

  function wrapLabelText(label) {
    const existing = label.querySelector(':scope > .data-filter-label');
    if (existing) return existing.textContent.trim();
    const span = label.querySelector(':scope > span:not(.report-dates)');
    if (span) {
      span.classList.add('data-filter-label');
      return span.textContent.trim();
    }
    const textNode = Array.from(label.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    if (!textNode) return '';
    const marker = document.createElement('span');
    marker.className = 'data-filter-label';
    marker.textContent = textNode.textContent.trim();
    label.replaceChild(marker, textNode);
    return marker.textContent;
  }

  function standardizeLabels(form) {
    form.querySelectorAll('label.report-field, label.cf-field').forEach(label => {
      const text = wrapLabelText(label);
      const control = label.querySelector('input:not([type="checkbox"]), select, textarea');
      if (!control || !text) return;
      if (!control.hasAttribute('aria-label')) control.setAttribute('aria-label', text);
      if (control.matches('input[type="text"], input[type="search"]') && !control.placeholder) control.placeholder = text;
    });
    form.querySelectorAll(':scope details > summary, :scope > details > summary').forEach(summary => {
      if (/更多/.test(summary.textContent)) summary.textContent = '更多筛选';
    });
  }

  function cleanText(value) {
    return String(value)
      .replace(/演示集团全部/g, '全部公司')
      .replace(/全部算例公司/g, '全部公司')
      .replace(/共同资料：来源待接入/g, '待补资料')
      .replace(/来源待接入/g, '待补资料')
      .replace(/含(?:来源|资料|费用)?缺口算例/g, '含资料缺口')
      .replace(/含缺数算例/g, '含资料缺口')
      .replace(/费用资料缺口算例/g, '含费用缺口')
      .replace(/正常验收算例/g, '完整数据')
      .replace(/基础采购算例/g, '采购数据')
      .replace(/所选主题独立算例/g, '主题数据')
      .replace(/独立(?:资源|核算|经营|校验)?(?:验收)?算例(?:\s*V\d+)?/g, '业务数据')
      .replace(/验收算例/g, '业务数据')
      .replace(/已发布算例V1/g, '已发布V1')
      .replace(/更正算例V2/g, '更正V2')
      .replace(/演示工作版\s*V\d+/g, 'V1')
      .replace(/演示任务/g, '当前任务')
      .replace(/演示参照/g, '参照记录')
      .replace(/（演示）/g, '')
      .replace(/\s*[·，；]\s*演示资料/g, '')
      .replace(/演示资料/g, '当前数据')
      .replace(/\s*[·，；]\s*非正式(?:账务|财务业绩|财务结果|实账|批准规则)?/g, '')
      .replace(/\s*[·，；]\s*非业务取数/g, '')
      .replace(/演示/g, '')
      .replace(/非正式/g, '')
      .replace(/算例/g, '数据')
      .replace(/\s{2,}/g, ' ');
  }

  function cleanPresentation(unit) {
    const walker = document.createTreeWalker(unit, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (node.parentElement?.closest('script, style, textarea')) return;
      const next = cleanText(node.textContent);
      if (next !== node.textContent) node.textContent = next;
    });
    unit.querySelectorAll('.report-query-status, .report-meta, .cf-notice, .data-report-filter-surface [role="status"]').forEach(item => {
      item.setAttribute('data-content-redundant', '');
    });
    unit.querySelectorAll('.cf-section, .rf-evidence, .cr-source, .sr-sources').forEach(section => {
      const tables = Array.from(section.querySelectorAll('table'));
      const hasBusinessRows = table => Array.from(table.querySelectorAll('tbody tr')).some(row => !row.querySelector('.cf-empty, .report-empty'));
      section.toggleAttribute('data-empty-support', tables.length > 0 && tables.every(table => !hasBusinessRows(table)));
    });
  }

  function actionOwner(element, units) {
    let current = element;
    while (current && current !== document.body) {
      if (units.has(current)) return current;
      current = current.parentElement;
    }
    return null;
  }

  function primaryForm(unit, units) {
    const forms = Array.from(unit.querySelectorAll('form.report-filters, form.cf-filters'));
    if (unit.hasAttribute('data-report-governance')) {
      return forms.find(form => isAvailable(form) && !form.matches('[data-gov-subscribe]')) || null;
    }
    return forms.find(form => {
      if (!isAvailable(form) || form.matches('[data-gov-subscribe]') || form.closest('.bt-editor, .rm-editor')) return false;
      return actionOwner(form, units) === unit;
    }) || null;
  }

  function moveMetadata(unit, form) {
    const metadata = Array.from(unit.children).find(child => child.classList?.contains('report-meta'));
    if (metadata && metadata.parentElement !== form.parentElement) form.insertAdjacentElement('afterend', metadata);
  }

  function moveActions(unit, form, units) {
    let actions = form.querySelector(':scope > .report-query-actions, :scope > .cf-filter-actions') || form.querySelector('.report-query-actions, .cf-filter-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = form.classList.contains('cf-filters') ? 'cf-filter-actions' : 'report-query-actions';
      form.append(actions);
    }
    if (actions.parentElement !== form && actions.closest('[data-filters], [data-margin-filters]')) {
      form.insertBefore(actions, form.querySelector(':scope > .report-query-status, :scope > [role="status"], :scope > .report-error') || null);
    }
    form.querySelectorAll('[data-filters] .report-query-actions, [data-margin-filters] .report-query-actions').forEach(duplicate => {
      if (duplicate !== actions) duplicate.remove();
    });
    actions.querySelector('button[type="submit"]')?.classList.add('data-filter-search');
    const marker = actions.querySelector('.report-query-status, [role="status"]');
    const exportButtons = Array.from(unit.querySelectorAll(exportSelector)).filter(button => !button.hasAttribute('data-ui-export-proxy') && actionOwner(button, units) === unit);
    let positionedExports = exportButtons;
    if (form.hasAttribute('data-rf-form')) {
      unit.querySelectorAll('[data-ui-export-proxy]').forEach(proxy => { if (!actions.contains(proxy)) proxy.remove(); });
      positionedExports = exportButtons.map((button, index) => {
        let proxy = actions.querySelector('[data-ui-export-proxy="' + index + '"]');
        if (!proxy) {
          proxy = button.cloneNode(true);
          proxy.removeAttribute('id');
          proxy.setAttribute('data-ui-export-proxy', String(index));
          proxy.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); button.click(); });
        }
        proxy.disabled = button.disabled;
        return proxy;
      });
    } else {
      unit.querySelectorAll('[data-ui-export-proxy]').forEach(proxy => proxy.remove());
    }
    const secondaryButtons = Array.from(unit.querySelectorAll(secondaryActionSelector)).filter(button => !button.hasAttribute('data-ui-action-proxy') && actionOwner(button, units) === unit);
    let positionedSecondary = secondaryButtons;
    if (unit.hasAttribute('data-report-governance')) {
      unit.querySelectorAll('[data-ui-action-proxy]').forEach(proxy => { if (!actions.contains(proxy)) proxy.remove(); });
      positionedSecondary = secondaryButtons.map((button, index) => {
        let proxy = actions.querySelector('[data-ui-action-proxy="' + index + '"]');
        if (!proxy) {
          proxy = button.cloneNode(true);
          proxy.removeAttribute('id');
          proxy.setAttribute('data-ui-action-proxy', String(index));
          proxy.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); button.click(); });
        }
        proxy.hidden = button.hidden;
        proxy.disabled = button.disabled;
        button.closest('.cf-tabs')?.classList.add('data-report-origin-actions');
        return proxy;
      });
    }
    const candidates = [...positionedExports, ...positionedSecondary].filter((button, index, items) => items.indexOf(button) === index);
    candidates.forEach(button => {
      if (button.parentElement !== actions) actions.insertBefore(button, marker || null);
    });
    unit.querySelectorAll('.report-actions, .cf-actions').forEach(origin => {
      if (!origin.querySelector('button:not([hidden])')) origin.closest('.report-head, .cf-heading, .cf-workbar')?.classList.add('data-report-origin-actions');
    });
  }

  function wrapResults(form) {
    const parent = form.parentElement;
    if (!parent || form.nextElementSibling?.classList.contains('data-report-result-surface')) return;
    const nodes = [];
    let node = form.nextSibling;
    while (node) {
      const next = node.nextSibling;
      if (!(node.nodeType === Node.TEXT_NODE && !node.textContent.trim())) nodes.push(node);
      node = next;
    }
    if (!nodes.length) return;
    const surface = document.createElement('section');
    surface.className = 'data-report-result-surface';
    surface.setAttribute('aria-label', '报表内容');
    form.after(surface);
    nodes.forEach(item => surface.append(item));
  }

  function standardize() {
    const unitList = Array.from(document.querySelectorAll(unitSelector));
    const units = new Set(unitList);
    unitList.forEach(unit => {
      unit.classList.add('data-report-unit');
      const form = primaryForm(unit, units);
      if (!form) { cleanPresentation(unit); return; }
      form.classList.add('data-report-filter-surface', 'filter-card', 'filter-card-compact', 'list-surface-filter');
      standardizeLabels(form);
      moveMetadata(unit, form);
      moveActions(unit, form, units);
      wrapResults(form);
      cleanPresentation(unit);
    });
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      standardize();
    });
  }

  window.CaesarDataReportUI = { standardize };
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('caesar:report-view-changed', standardize);
  schedule();
})();
