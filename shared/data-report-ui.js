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

  const filterOptionNames = new WeakMap();
  const genericFilterOptions = new Set(['全部', '全部组织', '全部类型', '全部范围', '全部来源', '全部年份', '全部状态', '全部公司', '全部产品组', '全部渠道', '全部单位', '全部指标', '全部层级', '全部字段', '全部员工编号']);
  const filterBusinessNames = {
    '负责人资料': '负责人资料情况', '费用资料': '费用资料情况',
    '资料缺口': '资料情况', '资料／毛利': '毛利及资料情况',
    '散拼／单团': '组团方式', '收入方式': '收入确认方式',
    '税务处理': '税务处理方式', '事业部': '产品事业部',
    '截至日履约情况': '履约情况', '员工编号': '销售人员'
  };
  const namedFilterLabels = new Set(['数据版本','资料版本','损益版本','批准预算版本','任务版本','预览版本','版本','统计期间','分析责任','责任分组','比较期间','责任层级','统计层级','结构分类','分析分类','汇总方式','金额列组','产品结构','统计粒度','经营任务指标','任务指标','预算指标','日期依据','日期口径','日期与金额依据','选单日期口径','完成年份口径','查看角色','查看范围示例','公司范围','部门范围','门店范围','预览公司','预览部门','预览门店','集团调整范围','原币','原币（元）','币种','金额单位','地理目的地分区','管理目的地分区','预算区域','主成交渠道','主渠道','获客来源','员工编号','顾问','销售人员','门店／销售组','门店','供应商','合同付款客户','付款客户','任务年度','订单号','来源订单号','核算主体']);
  function needsFilterLabel(text, control) {
    return ['date','datetime-local','month','number'].includes(control.type) ||
      namedFilterLabels.has(text) || /公司|事业部|部门|经营组|销售组|负责人|领导|呼叫中心/.test(text);
  }
  function groupFilterDates(form) {
    form.querySelectorAll('label.data-filter-named').forEach(first => {
      if (first.closest('.data-filter-date-pair')) return;
      const a=first.querySelector('input'), second=first.nextElementSibling;
      if (!a || !['date','month'].includes(a.type) || !second?.matches('label')) return;
      const b=second.querySelector('input'), at=first.querySelector('.data-filter-label')?.textContent.trim(), bt=second.querySelector('.data-filter-label')?.textContent.trim();
      if (!b || b.type!==a.type || !at || !bt || !/(开始|自|开始日)$/.test(at) || !/(结束|至|结束日)$/.test(bt)) return;
      const base=at.replace(/(开始日|开始|自)$/,''), end=bt.replace(/(结束日|结束|至)$/,'');
      if (base!==end) return;
      const pair=document.createElement('div');pair.className='data-filter-date-pair';
      const title=document.createElement('span');title.className='data-filter-pair-title';
      title.textContent=base + (a.type==='date'&&!/日期|期间|范围/.test(base)?'日期':'');
      const divider=document.createElement('span');divider.textContent='至';
      first.before(pair);pair.append(title,first,divider,second);
    });
    form.querySelectorAll('.data-filter-date-pair').forEach(pair=>{
      pair.hidden=[...pair.querySelectorAll('label')].every(l=>l.hidden);
    });
  }
  function standardizeLabels(form) {
    form.querySelectorAll('label.report-field, label.cf-field').forEach(label => {
      const text = wrapLabelText(label);
      const control = label.querySelector('input:not([type="checkbox"]), select, textarea');
      if (!control || !text) return;
      label.classList.toggle('data-filter-named', needsFilterLabel(text, control));
      if (text==='员工编号') label.querySelector('.data-filter-label').textContent='销售人员';
      if (control.type==='number' && /天数/.test(text) && !label.querySelector('.data-filter-unit')) {
        const unit=document.createElement('span');unit.className='data-filter-unit';unit.textContent='天';label.append(unit);
      }
      if (!control.hasAttribute('aria-label')) control.setAttribute('aria-label', text);
      if (control.matches('select')) {
        const businessName = text === '主状态'
          ? (form.closest('[data-budget-targets]') ? '任务状态' : '规则状态')
          : filterBusinessNames[text] || text;
        if (!control.hasAttribute('title')) control.title = text;
        Array.from(control.options).forEach(option => {
          if (!filterOptionNames.has(option)) filterOptionNames.set(option, cleanText(option.textContent.trim()));
          const original=filterOptionNames.get(option);
          let name = genericFilterOptions.has(original) ? '全部' + businessName : original;
          if (original==='授权全部') name='全部授权'+(text.includes('部门')?'部门':text.includes('门店')?'门店':'公司');
          if (original==='全部，分公司') name='全部核算公司（分列）';
          if (original==='全部，分别列示') name='全部核算主体（分列）';
          if (text==='集团内外' && ['外部','内部'].includes(original)) name='集团'+original;
          if (text==='订单状态' && ['有效','已取消','未确认'].includes(original)) name=original+'订单';
          if (text==='统计粒度' && ['月','周（周一开始）'].includes(original)) name='按'+original;
          if (text==='统计期间' && original==='7日') name='所选7日区间';
          if (name===original && !genericFilterOptions.has(original)) return;
          if (option.textContent !== name) {
            // Options without a value attribute derive their value from their text.
            option.value = option.value;
            option.textContent = name;
          }
        });
      }
      if (control.matches('input[type="text"], input[type="search"]') && !control.placeholder) control.placeholder = text;
      if (control.matches('input[type="text"], input[type="search"]') && ['确认情况包含','核对结果包含'].includes(text)) control.placeholder='输入'+text.replace('包含','')+'关键词';
    });
    groupFilterDates(form);
    form.querySelectorAll(':scope details > summary, :scope > details > summary').forEach(summary => {
      if (/更多/.test(summary.textContent)) summary.textContent = '更多筛选';
    });
  }

  function positionMoreFilters(form) {
    form.querySelectorAll('.report-filter-row').forEach(row => {
      if (!row.closest('details')) row.classList.add('data-filter-inline-row');
    });
    form.querySelectorAll(':scope > [data-filters], :scope > [data-margin-filters]').forEach(wrapper => wrapper.classList.add('data-filter-inline-wrapper'));
    const more = form.querySelector('details.report-more, details.cf-more');
    form.classList.toggle('data-filter-has-more', Boolean(more));
    if (!more) return;
    more.classList.add('data-filter-more');
    // Generic financial forms render their first-line fields directly in the form.
    const fields = Array.from(form.children).filter(el => el.matches('label.cf-field, label.report-field'));
    if (fields.length) {
      let row = form.querySelector(':scope > .data-filter-first-row');
      if (!row) {
        row = document.createElement('div');
        row.className = 'report-filter-row data-filter-first-row';
        fields[0].before(row);
      }
      fields.forEach(field => row.append(field));
    }
    const rows = Array.from(form.querySelectorAll('.report-filter-row')).filter(row => !row.closest('details') && isAvailable(row));
    const lastRow = rows[rows.length - 1];
    if (lastRow && more.parentElement !== lastRow) lastRow.append(more);
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

  function positionColumnPickers() {
    document.querySelectorAll('details.report-columns, details.cf-columns').forEach(picker => {
      let toolbar = picker.parentElement;
      if (!toolbar.matches('[data-fr-explorer], .cf-workbar, .data-column-toolbar')) {
        const heading = picker.previousElementSibling;
        toolbar = document.createElement('div');
        toolbar.className = 'data-column-toolbar';
        picker.before(toolbar);
        if (heading?.matches('.report-section-head')) toolbar.append(heading);
        toolbar.append(picker);
      }
      toolbar.classList.add('data-column-toolbar');
    });
    document.querySelectorAll('[data-fr-explorer], .data-column-toolbar').forEach(toolbar => {
      toolbar.classList.add('data-column-toolbar');
      const summary = toolbar.querySelector(':scope > details > summary');
      toolbar.classList.toggle('data-column-no-picker', !summary?.checkVisibility());
    });
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
      positionMoreFilters(form);
      moveMetadata(unit, form);
      moveActions(unit, form, units);
      wrapResults(form);
      cleanPresentation(unit);
    });
    positionColumnPickers();
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
