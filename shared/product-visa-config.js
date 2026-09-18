(function () {
  var routePage = document.querySelector('[data-route-edit-page]');
  var studyPage = document.querySelector('.study-product-edit-page');
  if (!routePage && !studyPage) return;
  var selfProductPage = routePage && routePage.classList.contains('product-self-edit-page');

  var params = new URLSearchParams(window.location.search);
  var pageKind = routePage ? (params.get('type') || routePage.dataset.routeKind || 'outbound') : 'study';
  var travelType = params.get('travelType') || '';
  var studyDestination = studyPage ? document.getElementById('destination') : null;
  var studyDestinationText = studyDestination ? studyDestination.value : '';
  var defaultRequired = !(/domestic/i.test(pageKind) || (/train/i.test(pageKind) && !/出境/.test(travelType)) || (studyPage && !/新加坡|欧洲|英国|德国|出境/.test(studyDestinationText + travelType)));
  var profiles = {
    FR: { country: '法国', type: '申根旅游签证', version: 'v6 / 2026-06-20', deadline: '21', presence: '需要录指纹', coverage: '法国、德国、瑞士、意大利、荷兰、比利时' },
    JP: { country: '日本', type: '日本个人旅游签证', version: 'v4 / 2026-06-08', deadline: '14', presence: '无需面签，按领区审核', coverage: '日本' },
    SG: { country: '新加坡', type: '新加坡旅游电子签', version: 'v3 / 2026-05-26', deadline: '10', presence: '无需本人到场', coverage: '新加坡' },
    DE: { country: '德国', type: '申根旅游签证', version: 'v5 / 2026-06-12', deadline: '21', presence: '需要录指纹', coverage: '德国及行程内申根目的国' },
    GB: { country: '英国', type: 'Standard Visitor旅游签证', version: 'v4 / 2026-06-03', deadline: '30', presence: '需要录指纹', coverage: '英国' },
    US: { country: '美国', type: 'B1/B2旅游商务签证', version: 'v5 / 2026-06-01', deadline: '45', presence: '需要面签', coverage: '美国' }
  };

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function option(value, label, selected) {
    return '<option value="' + value + '"' + (value === selected ? ' selected' : '') + '>' + label + '</option>';
  }

  function handlingModesHtml(scope) {
    if (!selfProductPage) {
      return '<select class="form-control"><option selected>旅行社代办（包含在团费中）</option><option>旅行社代办（单独收费）</option><option>客人自理</option></select>';
    }
    return [
      '<div class="product-visa-mode-field" data-product-visa-mode-field' + (scope === 'line' ? ' data-product-visa-line-modes' : ' data-product-visa-plan-modes') + '>',
      '<div class="product-visa-mode-group" role="group" aria-label="允许办理方式">',
      '<label><input type="checkbox" value="self" checked data-product-visa-mode data-product-visa-persist> 游客自办</label>',
      '<label><input type="checkbox" value="agency" checked data-product-visa-mode data-product-visa-persist> 随团办理</label>',
      '</div>',
      '<div class="form-error product-visa-mode-error" data-product-visa-mode-error hidden>需签证产品至少选择一种允许办理方式</div>',
      '</div>'
    ].join('');
  }

  function planHtml(index, code) {
    var profile = profiles[code] || profiles.FR;
    return [
      '<article class="product-visa-plan" data-product-visa-plan>',
      '<div class="product-visa-plan-head"><div><span>签证方案</span><strong>方案' + (index + 1) + '</strong></div>',
      index ? '<button class="btn btn-secondary btn-sm" type="button" data-remove-product-visa>移除</button>' : '<span class="tag tag-green">主方案</span>',
      '</div>',
      '<div class="form-grid product-visa-form-grid">',
      '<div class="form-group"><label class="form-label">办理国家/主申请国 <span class="req">*</span></label><select class="form-control" data-product-visa-country>',
      option('FR', '法国', code), option('JP', '日本', code), option('SG', '新加坡', code), option('DE', '德国', code), option('GB', '英国', code), option('US', '美国', code),
      '</select></div>',
      '<div class="form-group"><label class="form-label">签证类型 <span class="req">*</span></label><select class="form-control" data-product-visa-type><option>' + escapeHtml(profile.type) + '</option></select></div>',
      '<div class="form-group form-group-full"><label class="form-label">覆盖目的国</label><input class="form-control" type="text" value="' + escapeHtml(profile.coverage) + '" data-product-visa-coverage></div>',
      '<div class="form-group"><label class="form-label">允许办理方式 <span class="req">*</span></label>' + handlingModesHtml('plan') + '</div>',
      '<div class="form-group"><label class="form-label">费用口径</label><select class="form-control" data-product-visa-fee data-product-visa-persist><option selected>包含在团费中</option><option>单独收费</option><option>客人自理</option></select></div>',
      '<div class="form-group" data-product-visa-agency-material><label class="form-label">材料版本</label><select class="form-control" data-product-visa-version data-product-visa-persist><option>' + escapeHtml(profile.version) + '</option></select></div>',
      '<div class="form-group" data-product-visa-agency-material><label class="form-label">最晚提交（出发前N天）</label><input class="form-control" type="number" min="1" value="' + profile.deadline + '" data-product-visa-deadline data-product-visa-persist></div>',
      '<div class="form-group" data-product-visa-agency-material><label class="form-label">本人到场</label><input class="form-control" type="text" value="' + escapeHtml(profile.presence) + '" readonly data-product-visa-presence data-product-visa-persist></div>',
      '<div class="form-group"><label class="form-label">适用人群</label><select class="form-control"><option selected>全部游客</option><option>团队游客</option><option>个人游客</option><option>家庭游客</option></select></div>',
      '</div>',
      '</article>'
    ].join('');
  }

  function lineVisaFormHtml(name, cities, codes, active) {
    var primaryCode = codes[0] || 'FR';
    if (primaryCode === 'DOC') return lineDocumentFormHtml(name, cities, active);
    var secondaryCode = codes[1] || '';
    var primaryProfile = profiles[primaryCode] || profiles.FR;
    return [
      '<section class="route-line-form-panel product-visa-line-form' + (active ? ' active' : '') + '" data-line-form-panel="' + escapeHtml(name) + '"' + (active ? '' : ' hidden') + '>',
      '<div class="route-line-form-context"><span>' + escapeHtml(cities) + '</span><strong>' + escapeHtml(primaryProfile.type) + (secondaryCode ? ' + ' + escapeHtml((profiles[secondaryCode] || profiles.GB).type) : '') + '</strong></div>',
      '<div class="form-grid product-visa-policy-grid">',
      '<div class="form-group"><label class="form-label">签证政策 <span class="req">*</span></label><select class="form-control" data-product-visa-policy data-product-visa-persist><option selected>需提前办理</option><option>电子签</option><option>免签</option><option>落地签</option><option>不涉及出境签证</option></select></div>',
      '<div class="form-group"><label class="form-label">允许办理方式 <span class="req">*</span></label>' + handlingModesHtml('line') + '</div>',
      '<div class="form-group"><label class="form-label">费用口径</label><select class="form-control" data-product-visa-fee data-product-visa-persist><option selected>包含在团费中</option><option>单独收费</option><option>客人自理</option></select></div>',
      '<div class="form-group"><label class="form-label">最晚提交口径</label><input class="form-control" type="text" value="按出发前' + escapeHtml(primaryProfile.deadline) + '天计算"></div>',
      '</div>',
      '<div class="product-visa-plan-list" data-product-visa-list>',
      planHtml(0, primaryCode),
      secondaryCode ? planHtml(1, secondaryCode) : '',
      '</div>',
      '<div class="drawer-action-row product-visa-add-row"><button class="btn btn-secondary" type="button" data-add-product-visa>新增签证方案</button></div>',
      '<div class="route-field-grid">',
      '<div class="form-group route-field-full"><label class="form-label">证件要求</label><input class="form-control" type="text" value="中国大陆因私护照，回团后有效期不少于6个月，至少2页空白签证页"></div>',
      '<div class="form-group route-field-full" data-product-visa-agency-material><label class="form-label">随团办理材料</label><input class="form-control" type="text" value="' + escapeHtml(secondaryCode ? '英国签证需补充英文在职/资产材料，申根材料按主申请国版本' : '按主申请国材料清单提交') + '" data-product-visa-persist></div>',
      '<div class="form-group route-field-full"><label class="form-label">拒签损失规则</label><input class="form-control" type="text" value="签证费及已发生资源损失按本线路退改规则核算"></div>',
      '</div>',
      '</section>'
    ].join('');
  }

  function lineDocumentFormHtml(name, context, active) {
    return [
      '<section class="route-line-form-panel product-visa-line-form' + (active ? ' active' : '') + '" data-line-form-panel="' + escapeHtml(name) + '"' + (active ? '' : ' hidden') + '>',
      '<div class="route-line-form-context"><span>' + escapeHtml(context) + '</span><strong>实名制证件规则</strong></div>',
      '<div class="form-grid product-visa-policy-grid">',
      '<div class="form-group"><label class="form-label">证件规则 <span class="req">*</span></label><select class="form-control" data-product-visa-policy><option selected>不涉及出境签证</option><option>需提前办理</option><option>电子签</option></select></div>',
      '<div class="form-group"><label class="form-label">证件类型 <span class="req">*</span></label><select class="form-control"><option selected>中国大陆居民身份证</option><option>护照</option><option>港澳台居民证件</option></select></div>',
      '<div class="form-group"><label class="form-label">名单提交口径</label><input class="form-control" type="text" value="按班期实名制名单截止日提交"></div>',
      '<div class="form-group"><label class="form-label">回传要求</label><input class="form-control" type="text" value="铺位号/车厢号由运营方确认后回传"></div>',
      '</div>',
      '<div class="route-field-grid">',
      '<div class="form-group route-field-full"><label class="form-label">证件要求</label><input class="form-control" type="text" value="姓名、身份证号、手机号需与实名制名单一致"></div>',
      '<div class="form-group route-field-full"><label class="form-label">退铺损失规则</label><input class="form-control" type="text" value="实名名单提交后按运营方确认损失核算"></div>',
      '</div>',
      '</section>'
    ].join('');
  }

  function selfLineFormsHtml() {
    var normalizedKind = /cruise|邮轮/i.test(pageKind) ? 'cruise' : /train|专列/i.test(pageKind) ? 'train' : /free|自由行/i.test(pageKind) ? 'free' : 'group';
    if (normalizedKind === 'cruise') {
      return [
        lineVisaFormHtml('阳台舱优选', '巴塞罗那 / 马赛 / 热那亚 / 那不勒斯', ['FR'], true),
        lineVisaFormHtml('套房礼遇', '西地中海航线', ['FR'], false)
      ].join('');
    }
    if (normalizedKind === 'train') {
      return [
        lineVisaFormHtml('舒适软卧', '西安 / 兰州 / 张掖 / 敦煌 / 乌鲁木齐', ['DOC'], true),
        lineVisaFormHtml('尊享包厢', '专列实名制铺位', ['DOC'], false)
      ].join('');
    }
    if (normalizedKind === 'free') {
      return [
        lineVisaFormHtml('机票+酒店套餐', '法国巴黎自由行', ['FR'], true),
        lineVisaFormHtml('纯酒店套餐', '法国巴黎自由行', ['FR'], false)
      ].join('');
    }
    return [
      lineVisaFormHtml('经济款', '法国 / 德国 / 瑞士 / 意大利', ['FR'], true),
      lineVisaFormHtml('品质款', '法国 / 英国 / 瑞士 / 意大利', ['FR', 'GB'], false)
    ].join('');
  }

  var inlineVisaTarget = routePage ? routePage.querySelector('[data-product-visa-panel]') : null;
  var useInlineVisa = inlineVisaTarget && !inlineVisaTarget.hasAttribute('data-route-panel');
  var section = document.createElement('section');
  section.className = routePage ? (useInlineVisa ? 'product-visa-config-section route-visa-inline-section' : 'route-form-section product-visa-config-section' + (selfProductPage ? ' route-blue-card' : '')) : 'card product-visa-config-section';
  section.innerHTML = selfProductPage ? [
    '<div class="route-line-form-stack product-visa-line-form-stack">',
    selfLineFormsHtml(),
    '</div>'
  ].join('') : [
    '<div class="product-visa-section-head">',
    '<div><h2 class="route-section-title">' + (useInlineVisa || selfProductPage ? '签证与证件' : '签证配置') + '</h2><span>签证国家库版本</span></div>',
    '<a class="btn btn-secondary btn-sm" href="../resource/visa-library.html">查看签证国家</a>',
    '</div>',
    '<div class="product-visa-source-strip">',
    '<div><span>规则来源</span><strong>签证国家库</strong></div>',
    '<div><span>默认证件</span><strong>中国大陆因私护照</strong></div>',
    '<div><span>团期承接</span><strong>按出发日期计算截止日</strong></div>',
    '<div><span>当前状态</span><strong data-product-visa-readiness>配置完整</strong></div>',
    '</div>',
    '<div class="route-form-subsection product-visa-default-section">',
    '<div class="route-subsection-titlebar"><h3 class="route-subsection-title">产品默认签证规则</h3></div>',
    '<div class="form-grid product-visa-policy-grid">',
    '<div class="form-group"><label class="form-label" for="productVisaPolicy">签证政策 <span class="req">*</span></label><select id="productVisaPolicy" class="form-control"><option' + (defaultRequired ? ' selected' : '') + '>需提前办理</option><option>电子签</option><option>免签</option><option>落地签</option><option' + (!defaultRequired ? ' selected' : '') + '>不涉及出境签证</option></select></div>',
    '<div class="form-group"><label class="form-label" for="productVisaRuleMode">材料版本</label><select id="productVisaRuleMode" class="form-control"><option selected>继承签证国家当前版本</option><option>锁定当前材料版本</option></select></div>',
    '<div class="form-group"><label class="form-label" for="productVisaFeeMode">费用口径</label><select id="productVisaFeeMode" class="form-control"><option selected>签证费含，签证中心服务费含</option><option>仅含代办服务费</option><option>客人自理</option></select></div>',
    '</div>',
    '<div class="product-visa-plan-list" data-product-visa-list>' + planHtml(0, 'FR') + '</div>',
    '<div class="drawer-action-row product-visa-add-row"><button class="btn btn-secondary" type="button" data-add-product-visa>新增签证方案</button></div>',
    '</div>'
  ].join('');

  if (routePage) {
    var panels = routePage.querySelectorAll('[data-route-panel]');
    var targetPanel = inlineVisaTarget || (selfProductPage ? routePage.querySelector('[data-product-visa-panel]') : (panels[2] || panels[panels.length - 1]));
    if (targetPanel) {
      if (inlineVisaTarget) targetPanel.appendChild(section);
      else targetPanel.insertBefore(section, targetPanel.firstChild);
    }
  } else {
    var studyTarget = document.getElementById('feeNote');
    if (studyTarget) studyTarget.insertBefore(section, studyTarget.firstChild);
  }

  var policy = section.querySelector('#productVisaPolicy');
  var planList = section.querySelector('[data-product-visa-list]');
  var addButton = section.querySelector('[data-add-product-visa]');
  var readiness = section.querySelector('[data-product-visa-readiness]');
  var storageKey = 'caesar-product-self-visa-' + pageKind;
  var savedVisaConfigJson = '';
  var visaConfigDirty = false;

  function modeHasValue(modeField, value) {
    return !!modeField && !!modeField.querySelector('[data-product-visa-mode][value="' + value + '"]:checked');
  }

  function syncModeField(modeField) {
    if (!selfProductPage || !modeField) return;
    var plan = modeField.closest('[data-product-visa-plan]');
    var scope = plan || modeField.closest('[data-line-form-panel]') || section;
    var agencySelected = modeHasValue(modeField, 'agency');
    if (plan) {
      plan.querySelectorAll('[data-product-visa-agency-material]').forEach(function (field) {
        field.hidden = !agencySelected;
      });
      return;
    }
    scope.querySelectorAll('.route-field-grid [data-product-visa-agency-material]').forEach(function (field) {
      field.hidden = !agencySelected;
    });
  }

  function syncLineModes(container, needsPlan) {
    if (!selfProductPage || !container) return;
    var lineModes = container.querySelector('[data-product-visa-line-modes]');
    if (lineModes) lineModes.closest('.form-group').hidden = !needsPlan;
    var agencySelected = needsPlan && modeHasValue(lineModes, 'agency');
    var currentPlanList = container.querySelector('[data-product-visa-list]');
    var currentAddButton = container.querySelector('[data-add-product-visa]');
    if (currentPlanList) currentPlanList.hidden = !agencySelected;
    if (currentAddButton && currentAddButton.parentElement) currentAddButton.parentElement.hidden = !agencySelected;
    container.querySelectorAll('[data-product-visa-plan-modes]').forEach(syncModeField);
  }

  function syncPolicyField(policyField) {
    if (!policyField) return;
    var container = policyField.closest('[data-line-form-panel]') || section;
    var currentPlanList = container.querySelector('[data-product-visa-list]');
    var currentAddButton = container.querySelector('[data-add-product-visa]');
    var currentReadiness = container.querySelector('[data-product-visa-readiness]');
    var needsPlan = !/免签|不涉及/.test(policyField.value);
    if (selfProductPage && container.matches('[data-line-form-panel]')) {
      syncLineModes(container, needsPlan);
    } else {
      if (currentPlanList) currentPlanList.hidden = !needsPlan;
      if (currentAddButton && currentAddButton.parentElement) currentAddButton.parentElement.hidden = !needsPlan;
    }
    if (currentReadiness) currentReadiness.textContent = needsPlan ? '配置完整' : policyField.value;
  }

  function validateModes(options) {
    if (!selfProductPage) return true;
    var showFeedback = !options || options.showFeedback !== false;
    var firstInvalid = null;
    section.querySelectorAll('[data-line-form-panel]').forEach(function (linePanel) {
      var policyField = linePanel.querySelector('[data-product-visa-policy]');
      var needsPlan = !policyField || !/免签|不涉及/.test(policyField.value);
      var lineModes = linePanel.querySelector('[data-product-visa-line-modes]');
      var agencyAllowed = needsPlan && modeHasValue(lineModes, 'agency');
      linePanel.querySelectorAll('[data-product-visa-mode-field]').forEach(function (modeField) {
        var isPlanModes = modeField.hasAttribute('data-product-visa-plan-modes');
        var invalid = needsPlan && (!isPlanModes || agencyAllowed) && !modeField.querySelector('[data-product-visa-mode]:checked');
        modeField.classList.toggle('is-invalid', invalid);
        modeField.querySelectorAll('[data-product-visa-mode]').forEach(function (field) {
          field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
        });
        var error = modeField.querySelector('[data-product-visa-mode-error]');
        if (error) error.hidden = !invalid;
        if (invalid && !firstInvalid) firstInvalid = modeField;
      });
    });
    if (firstInvalid && showFeedback) {
      var linePanel = firstInvalid.closest('[data-line-form-panel]');
      var lineName = linePanel && linePanel.getAttribute('data-line-form-panel');
      var lineButton = lineName && document.querySelector('[data-plan-switch][data-plan-name="' + lineName + '"]');
      if (lineButton && !lineButton.classList.contains('active')) lineButton.click();
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return !firstInvalid;
  }

  function collectSavedVisaConfig() {
    return Array.from(section.querySelectorAll('[data-product-visa-persist]')).map(function (field) {
      return field.type === 'checkbox' ? { checked: field.checked } : { value: field.value };
    });
  }

  function saveVisaConfig() {
    if (!selfProductPage) return;
    try {
      savedVisaConfigJson = JSON.stringify(collectSavedVisaConfig());
      window.sessionStorage.setItem(storageKey, savedVisaConfigJson);
      visaConfigDirty = false;
    } catch (error) {}
  }

  function restoreVisaConfig() {
    if (!selfProductPage) return;
    try {
      var saved = JSON.parse(window.sessionStorage.getItem(storageKey) || '[]');
      section.querySelectorAll('[data-product-visa-persist]').forEach(function (field, index) {
        var value = saved[index];
        if (!value) return;
        if (field.type === 'checkbox') field.checked = !!value.checked;
        else if (Object.prototype.hasOwnProperty.call(value, 'value')) field.value = value.value;
      });
    } catch (error) {}
  }

  function markVisaConfigDirty() {
    if (!selfProductPage) return;
    visaConfigDirty = JSON.stringify(collectSavedVisaConfig()) !== savedVisaConfigJson;
  }

  function syncPolicy() {
    syncPolicyField(policy);
  }

  function syncPlan(plan) {
    var country = plan.querySelector('[data-product-visa-country]');
    var profile = profiles[country.value] || profiles.FR;
    plan.querySelector('[data-product-visa-type]').innerHTML = '<option>' + escapeHtml(profile.type) + '</option>';
    plan.querySelector('[data-product-visa-version]').innerHTML = '<option>' + escapeHtml(profile.version) + '</option>';
    plan.querySelector('[data-product-visa-coverage]').value = profile.coverage;
    plan.querySelector('[data-product-visa-deadline]').value = profile.deadline;
    plan.querySelector('[data-product-visa-presence]').value = profile.presence;
  }

  if (policy) policy.addEventListener('change', syncPolicy);
  if (policy && studyDestination) {
    studyDestination.addEventListener('change', function () {
      var destination = studyDestination.value;
      var code = /新加坡/.test(destination) ? 'SG' : /德国/.test(destination) ? 'DE' : /英国/.test(destination) ? 'GB' : '';
      policy.value = code === 'SG' ? '电子签' : code ? '需提前办理' : '不涉及出境签证';
      if (code) {
        var country = planList.querySelector('[data-product-visa-country]');
        country.value = code;
        syncPlan(country.closest('[data-product-visa-plan]'));
      }
      syncPolicy();
    });
  }
  section.addEventListener('change', function (event) {
    if (event.target.matches('[data-product-visa-country]')) {
      var plan = event.target.closest('[data-product-visa-plan]');
      if (plan) syncPlan(plan);
    }
    if (event.target.matches('[data-product-visa-policy]')) {
      syncPolicyField(event.target);
    }
    if (event.target.matches('[data-product-visa-mode]')) {
      var modeField = event.target.closest('[data-product-visa-mode-field]');
      var linePanel = event.target.closest('[data-line-form-panel]');
      if (modeField && modeField.hasAttribute('data-product-visa-line-modes')) {
        var policyField = linePanel && linePanel.querySelector('[data-product-visa-policy]');
        syncLineModes(linePanel, !policyField || !/免签|不涉及/.test(policyField.value));
      } else {
        syncModeField(modeField);
      }
      validateModes({ showFeedback: false });
    }
    if (event.target.matches('[data-line-rule-mode]') && window.syncRouteLineRuleCard) {
      window.syncRouteLineRuleCard(event.target.closest('[data-line-rule-card]'));
    }
    if (event.target.matches('[data-product-visa-persist]')) markVisaConfigDirty();
  });
  section.addEventListener('input', function (event) {
    if (event.target.matches('[data-product-visa-persist]')) markVisaConfigDirty();
  });
  section.addEventListener('click', function (event) {
    var addVisa = event.target.closest('[data-add-product-visa]');
    if (addVisa) {
      var container = addVisa.closest('[data-line-form-panel]') || section;
      var currentPlanList = container.querySelector('[data-product-visa-list]');
      if (!currentPlanList) return;
      var wrapper = document.createElement('div');
      wrapper.innerHTML = planHtml(currentPlanList.children.length, currentPlanList.children.length === 1 ? 'JP' : 'US');
      currentPlanList.appendChild(wrapper.firstElementChild);
      syncModeField(currentPlanList.lastElementChild.querySelector('[data-product-visa-plan-modes]'));
      return;
    }
    var remove = event.target.closest('[data-remove-product-visa]');
    if (remove) remove.closest('[data-product-visa-plan]').remove();
  });
  if (selfProductPage) {
    routePage.addEventListener('click', function (event) {
      var action = event.target.closest('[data-route-save], [data-route-submit], [data-route-next]');
      if (!action) return;
      var isFinalNext = action.matches('[data-route-next]') && /提交审核/.test(action.textContent || '');
      if (!action.matches('[data-route-save], [data-route-submit]') && !isFinalNext) return;
      if (!validateModes()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      saveVisaConfig();
    }, true);
    restoreVisaConfig();
    savedVisaConfigJson = JSON.stringify(collectSavedVisaConfig());
    var backLink = document.querySelector('[data-confirm-back]');
    if (backLink) {
      backLink.addEventListener('click', function (event) {
        if (!visaConfigDirty || window.confirm('签证与证件配置尚未保存，确认离开吗？')) return;
        event.preventDefault();
        event.stopImmediatePropagation();
      }, true);
    }
  }
  syncPolicy();
  section.querySelectorAll('[data-product-visa-policy]').forEach(syncPolicyField);
  section.querySelectorAll('[data-product-visa-mode-field]').forEach(syncModeField);
  validateModes({ showFeedback: false });
  window.ProductVisaConfig = Object.assign(window.ProductVisaConfig || {}, {
    validateHandlingModes: validateModes,
    saveHandlingModes: saveVisaConfig
  });
  if (window.initRouteLineRuleCards) window.initRouteLineRuleCards(section);
})();
