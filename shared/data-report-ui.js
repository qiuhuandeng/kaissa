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
    let actions = form.querySelector('.report-query-actions, .cf-filter-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = form.classList.contains('cf-filters') ? 'cf-filter-actions' : 'report-query-actions';
      form.append(actions);
    }
    actions.querySelector('button[type="submit"]')?.classList.add('data-filter-search');
    const marker = actions.querySelector('.report-query-status, [role="status"]');
    const candidates = [
      ...Array.from(unit.querySelectorAll(exportSelector)),
      ...Array.from(unit.querySelectorAll(secondaryActionSelector))
    ].filter((button, index, items) => items.indexOf(button) === index && actionOwner(button, units) === unit);
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
      if (!form) return;
      form.classList.add('data-report-filter-surface', 'filter-card', 'filter-card-compact', 'list-surface-filter');
      standardizeLabels(form);
      moveMetadata(unit, form);
      moveActions(unit, form, units);
      wrapResults(form);
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

  window.CaesarDataReportUI = { standardize: schedule };
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('caesar:report-view-changed', schedule);
  schedule();
})();
