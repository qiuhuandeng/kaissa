(function () {
  'use strict';
  // Presentation controls delegate to the existing query and per-tab state owners.
  const roots = '[data-report-page="overview"], [data-report-page="products"], [data-channel-report]';
  function sync() {
    document.querySelectorAll(roots).forEach(root => {
      const form = root.querySelector('form.report-filters');
      if (!form) return;
      const channel = root.hasAttribute('data-channel-report');
      const cross = root.getAttribute('data-report-page') === 'products' && form.elements.view.disabled;
      const name = channel ? 'basis' : cross ? 'crossBasis' : 'view';
      const source = form.elements[name];
      if (!source) return;
      let bar = form.querySelector('[data-performance-basis]');
      if (!bar) {
        bar = document.createElement('div');
        bar.className = 'report-performance-basis';
        bar.setAttribute('data-performance-basis', '');
        form.prepend(bar);
        bar.addEventListener('click', event => {
          const button = event.target.closest('[data-basis-value]');
          if (!button) return;
          const control = form.elements[bar.dataset.control];
          if (!control || control.value === button.dataset.basisValue) return;
          control.value = button.dataset.basisValue;
          control.dispatchEvent(new Event('change', { bubbles: true }));
          sync();
          // Match normal filtering: the result and export change only after Query.
          bar.querySelector('[data-basis-value="' + button.dataset.basisValue + '"]')?.focus();
        });
      }
      bar.dataset.control = name;
      const options = cross ? [['planned', '计划完成'], ['actual', '实际完成']] :
        [['orders', '订单成交'], ['actual', '实际回团'], ...(!channel && root.dataset.reportPage === 'overview' ? [['changes', '成交变动']] : [])];
      const date = cross ? (source.value === 'actual' ? '按实际完成年份统计' : '按计划完成年份统计') :
        source.value === 'actual' ? '实际完成日期' : source.value === 'changes' ? '变动生效日期' : '订单确认日期';
      const markup = '<span class="report-basis-label">' + (cross ? '完成口径' : '业绩口径') + '</span><div class="report-basis-options" role="group" aria-label="' + (cross ? '完成口径' : '业绩口径') + '">' +
        options.map(([value, label]) => '<button type="button" data-basis-value="' + value + '" aria-pressed="' + (source.value === value) + '">' + label + '</button>').join('') +
        '</div><span class="report-basis-date">' + date + '</span>';
      if (bar.innerHTML !== markup) bar.innerHTML = markup;
      form.querySelectorAll('select[name="view"], select[name="basis"], select[name="crossBasis"]').forEach(control => {
        control.closest('label')?.classList.add('report-basis-source');
      });
      ['start', 'end'].forEach((key, index) => {
        const control = form.elements[key];
        if (control && !cross) control.setAttribute('aria-label', date + (index ? '结束' : '开始'));
      });
    });
  }
  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; sync(); });
  };
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('change', schedule);
  window.addEventListener('caesar:report-view-changed', schedule);
  schedule();
})();
