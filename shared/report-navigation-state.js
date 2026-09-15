(function () {
  'use strict';
  // Save query settings only. Controllers recompute results; edited business records are never stored.
  const clone = value => JSON.parse(JSON.stringify(value));
  function bind(host, controller) {
    host.reportNavigation = {
      ...controller,
      capture() {
        const form = host.querySelector('form');
        return clone({ core: controller.capture(), fields: form ? Array.from(form.elements).filter(e => e.name).map(e => ({ name: e.name, value: e.value, checked: e.checked })) : [],
          messages: Array.from(host.querySelectorAll('form [role="alert"], [data-status], [data-query-status], [data-rf-status], [data-margin-status]')).map(e => ({ selector: e.hasAttribute('data-query-status') ? '[data-query-status]' : e.hasAttribute('data-rf-status') ? '[data-rf-status]' : e.hasAttribute('data-margin-status') ? '[data-margin-status]' : e.hasAttribute('data-status') ? '[data-status]' : 'form [role="alert"]', text: e.textContent, hidden: e.hidden, dirty: e.classList.contains('is-dirty') })) });
      },
      restore(saved) {
        const s = clone(saved); controller.restore(s.core);
        const form = host.querySelector('form');
        for (const f of s.fields) { const e = form?.elements.namedItem(f.name); if (e) { e.value = f.value; if (e.type === 'checkbox' || e.type === 'radio') e.checked = f.checked; } }
        for (const m of s.messages) { const e = host.querySelector(m.selector); if (e) { e.textContent = m.text; e.hidden = m.hidden; e.classList.toggle('is-dirty', m.dirty); } }
      }
    };
  }
  window.CaesarReportNavigation = { bind };
})();
