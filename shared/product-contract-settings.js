(function () {
  'use strict';
  const C = window.ContractCatalog, D = window.ContractSettings;
  if (!C || !D) return;
  const settings = D.newState(), savedServices = new Map();
  const q = (s, root = document) => root.querySelector(s);
  const qa = (s, root = document) => Array.from(root.querySelectorAll(s));
  const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let config = {mode:'inherit', template:''}, host, dirty = false, serviceDirty = false;
  let serviceDrafts = {}, serviceType = '';
  const isService = location.pathname.endsWith('/products.html');
  const isPackage = location.pathname.includes('outsource-package');
  const serviceFields = {
    '票务':['航线、舱等或票种及使用标准','出票及退改条件'],
    '酒店':['酒店、房型、早餐及入住标准','入住资格及取消条件'],
    '用车':['车型、座位、行程范围及用车标准','等待、超时及取消条件'],
    '导游':['语种、服务标准及资质要求','服务及取消条件'],
    '签证':['目的地、签证种类、入境次数及有效期','申请资格及拒签处理约定'],
    '保险':['保险公司、产品与保障计划','适用人群、承保限制及退保条件'],
    '其他':['服务内容与规格','办理及退改条件']
  };
  function context() {
    const path = location.pathname;
    let business = isService ? '单项服务' : path.includes('cruise-edit') ? '邮轮' : path.includes('train-edit') ? '专列' : path.includes('study-edit') ? '研学' : '参团游';
    const type = (q('#lineType')?.value || new URLSearchParams(location.search).get('type') || '') + (q('#packageTypeTag')?.textContent || '');
    if (/自由行|free/.test(type)) business = '自由行';
    if (/邮轮|cruise/.test(type)) business = '邮轮';
    const destination = q('#destination')?.value;
    let rawRange = q('#travelType')?.value || q('#serviceTravelRange')?.value;
    if (!rawRange && destination && business === '研学') rawRange = destination.startsWith('国内') ? '境内' : '出境';
    const range = ({'境内游':'境内','国内游':'境内','出境游':'出境','台湾':'赴台'})[rawRange] || rawRange || (business === '专列' || business === '研学' ? '境内' : '出境');
    const companyName=window.caesarCompanyContext?.().company;const company=settings.companies.find(c=>c.fullName===companyName||c.name===companyName)?.id;
    return {company,business, range, days:Number(q('#durationDays')?.value || q('#travelDays')?.value) || null, serviceMode:business === '单项服务' ? '代订代办' : '包价旅游'};
  }
  function templateChoices() {
    const ctx = context();
    // Regional and company conditions are checked again against the actual order.
    return settings.templates.filter(t => {
      const p = D.profileFor(t);
      return p && t.companies.includes(ctx.company) && t.customer === '个人' && t.range === ctx.range &&
        (!['day','zhejiang'].includes(p.id) || ctx.days === 1) &&
        !C.applicable(p, {...ctx, province:t.province}).length &&
        !D.templateIssues({...t,companies:[ctx.company]}, settings.companies, '2026-09-28').length;
    });
  }
  function render(message = '') {
    if (!host) return;
    const list = templateChoices(), specified = config.mode === 'specified';
    host.classList.add('product-contract');
    host.innerHTML = `<span class="form-label">合同模板</span><div class="pc-mode" role="radiogroup" aria-label="合同模板选用方式"><label><input type="radio" name="productContractMode" value="inherit" ${specified ? '' : 'checked'}>沿用系统设置</label><label><input type="radio" name="productContractMode" value="specified" ${specified ? 'checked' : ''}>指定合同模板</label></div><div class="pc-template" ${specified ? '' : 'hidden'}><select class="form-control" aria-label="指定合同模板" data-pc-template ${specified ? '' : 'disabled'}><option value="">请选择适用模板</option>${list.map(t => `<option value="${e(t.id)}" ${config.template === t.id ? 'selected' : ''}>${e(t.name + ' · ' + D.providerName(t.provider))}</option>`).join('')}</select></div><p class="pc-status error" role="status" ${message ? '' : 'hidden'}>${e(message)}</p>`;
    if (new URLSearchParams(location.search).get('mode') === 'view') qa('input, select', host).forEach(n => n.disabled = true);
    host.onchange = event => {
      if (event.target.name === 'productContractMode') {
        config.mode = event.target.value;
        if (config.mode === 'inherit') config.template = '';
        render();
      } else if (event.target.matches('[data-pc-template]')) {
        config.template = event.target.value;
        q('.pc-status', host).hidden = true;
      }
      dirty = true;
      if (isService) serviceDirty = true;
    };
  }
  function reveal(field) {
    if (!field) return;
    const route = field.closest('[data-route-panel]');
    if (route) qa('[data-route-step]')[qa('[data-route-panel]').indexOf(route)]?.click();
    const pack = field.closest('[data-package-panel]');
    if (pack) qa('[data-package-step]')[qa('[data-package-panel]').indexOf(pack)]?.click();
    const study = field.closest('.product-step-content');
    if (study) q(`[data-step-target="${study.id}"]`)?.click();
    const module = field.closest('.route-line-module-panel');
    if (module) q(`[href="#${module.id}"][data-line-module-anchor]`)?.click();
    field.scrollIntoView({block:'center'}); field.focus();
  }
  function validateTemplate() {
    if (!host || config.mode === 'inherit') return true;
    if (templateChoices().some(t => t.id === config.template)) return true;
    render('请选择一份适用的合同模板，或改为沿用系统设置。');
    reveal(q('[data-pc-template]', host));
    return false;
  }
  function refresh() {
    let message = '';
    if (config.mode === 'specified' && config.template && !templateChoices().some(t => t.id === config.template)) {
      config.template = '';
      message = '原模板不再适用，请重新选择，或改为沿用系统设置。';
    }
    render(message);
  }
  function readService() {
    const area = q('[data-service-details]'), result = {};
    if (area) qa('[data-service-field]', area).forEach(n => result[n.dataset.serviceField] = n.value.trim());
    return result;
  }
  function renderService() {
    const area = q('[data-service-details]');
    if (!area) return;
    const values = serviceDrafts[serviceType] || {}, labels = serviceFields[serviceType] || serviceFields.其他;
    const field = (key, label) => `<label class="form-group"><span class="form-label">${e(label)}</span><textarea class="form-control" rows="2" data-service-field="${key}">${e(values[key] || '')}</textarea></label>`;
    area.innerHTML = field('spec', labels[0]) + field('conditions', labels[1]) + field('fee', '费用包含／不含') + (serviceType === '签证' ? field('deadline', '材料递交时限（相对出行日）') : '') + '<p class="form-group-full pc-status error" role="status" data-service-error hidden></p>';
  }
  function validateService() {
    const values = readService(), message = q('[data-service-error]');
    const complete = !!(values.spec && values.conditions && values.fee && (serviceType !== '签证' || values.deadline));
    if (message) { message.hidden = complete; message.textContent = complete ? '' : '请补齐服务规格、办理条件、费用说明及适用的材料递交时限。'; }
    return complete;
  }
  function validateMaterials() {
    let first = null;
    qa('[data-product-material]').forEach(n => {
      const ok = n.value.trim() && (n.type !== 'number' || Number(n.value) > 0);
      n.setCustomValidity(ok ? '' : '请补齐' + (q(`label[for="${n.id}"]`)?.textContent || '服务资料'));
      n.classList.toggle('input-error', !ok);
      if (!ok && !first) first = n;
    });
    if (first) reveal(first);
    return !first;
  }
  window.ProductContractConfig = {
    validate:() => validateTemplate() && validateMaterials(),
    capture:() => [{...config, ...context()}],
    openService(row) {
      host = q('[data-service-contract]');
      const previous = row && savedServices.get(row);
      config = previous ? C.clone(previous.config) : {mode:'inherit', template:''};
      serviceDrafts = previous ? C.clone(previous.details) : {};
      serviceType = q('#serviceProductType').value;
      if (q('#serviceTravelRange')) q('#serviceTravelRange').value = previous?.range || '出境';
      serviceDirty = false; dirty = false; render(); renderService();
    },
    saveService(row) {
      serviceDrafts[serviceType] = readService();
      if (row) savedServices.set(row, {config:C.clone(config), details:C.clone(serviceDrafts), range:q('#serviceTravelRange')?.value});
      dirty = false; serviceDirty = false;
    },
    serviceValid:() => { const a = validateTemplate(), b = validateService(); return a && b; }
  };
  if (!isService && !q('#insuranceService')) {
    const fee = q('#includeFee, #packageInclude');
    if (fee) fee.closest('.form-group').insertAdjacentHTML('afterend', '<div class="form-group route-field-full form-group-full"><label class="form-label" for="insuranceService">保险服务说明</label><textarea id="insuranceService" class="form-control" rows="2" placeholder="如本产品含保险或提供代购，填写保险公司、产品／保障计划及费用是否包含；不提供可留空。"></textarea></div>');
  }
  if (!isService) {
    const anchor = q(isPackage ? '#packageName' : '#projectName, #lineName');
    const group = anchor?.closest('.route-field-grid, .form-grid');
    if (group) { host = document.createElement('div'); host.className = 'form-group route-field-full form-group-full'; group.append(host); render(); }
  }
  document.addEventListener('change', event => {
    if (event.target.id === 'serviceProductType') {
      serviceDrafts[serviceType] = readService(); serviceType = event.target.value;
      renderService(); refresh(); serviceDirty = true;
    }
    if (['travelType','lineType','durationDays','travelDays','destination','serviceTravelRange'].includes(event.target.id)) refresh();
  });
  document.addEventListener('input', event => {
    if (event.target.closest('.product-contract, [data-service-details]') || event.target.matches('[data-product-material]')) {
      dirty = true; if (isService) serviceDirty = true;
      if (event.target.matches('[data-product-material]')) event.target.setCustomValidity('');
    }
  });
  document.addEventListener('click', event => {
    if (event.target.closest('[data-close-service-product]') && serviceDirty && !confirm('当前内容未保存，确认离开吗？')) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
    if (event.target.closest('[data-route-save], #saveStudyDraft, #savePackage')) dirty = false;
  }, true);
  window.addEventListener('caesar-company-change',refresh);
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
})();
