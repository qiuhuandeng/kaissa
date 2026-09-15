(function () {
  'use strict';
  // Save query settings only. Controllers recompute results; edited business records are never stored.
  const clone = value => JSON.parse(JSON.stringify(value));
  function bind(host, controller) {
    const form = host.querySelector('form');
    if (form && !host.querySelector('[data-status], [data-query-status], [data-rf-status], [data-margin-status]')) {
      const status = document.createElement('span'); status.dataset.navigationQueryStatus = ''; status.setAttribute('role','status'); status.textContent = '已查询';
      (form.querySelector('.cf-filter-actions') || form).append(status);
      for (const type of ['input','change']) form.addEventListener(type, () => { status.textContent = '条件已修改，尚未查询'; });
      host.addEventListener('submit', e => { if (e.target === form) status.textContent = host.querySelector('.cf-error:not([hidden])') ? '查询失败，保留本页签上次结果' : '已查询'; });
      host.addEventListener('click', e => { if (e.target.closest('[data-fr-reset], [data-cf-reset], [data-ba-reset]')) status.textContent = '已查询'; });
    }
    host.reportNavigation = {
      ...controller,
      capture() {
        const form = host.querySelector('form');
        return clone({ core: controller.capture(), fields: form ? Array.from(form.elements).filter(e => e.name).map(e => ({ name: e.name, value: e.value, checked: e.checked })) : [],
          messages: Array.from(host.querySelectorAll('.cf-error, [data-error], [data-rf-error], [data-margin-error], [data-status], [data-query-status], [data-rf-status], [data-margin-status], [data-navigation-query-status]')).map(e => ({ selector: e.classList.contains('cf-error') ? '.cf-error' : '[' + e.getAttributeNames().find(k => k.startsWith('data-')) + ']', text: e.textContent, hidden: e.hidden, dirty: e.classList.contains('is-dirty') })) });
      },
      restore(saved) {
        const s = clone(saved); if (controller.restore(s.core) === false) return;
        const form = host.querySelector('form');
        for (const f of s.fields) { const e = form?.elements.namedItem(f.name); if (e) { e.value = f.value; if (e.type === 'checkbox' || e.type === 'radio') e.checked = f.checked; } }
        for (const m of s.messages) { const e = host.querySelector(m.selector); if (e) { e.textContent = m.text; e.hidden = m.hidden; e.classList.toggle('is-dirty', m.dirty); } }
      }
    };
  }
  window.CaesarReportNavigation = { bind };
})();
