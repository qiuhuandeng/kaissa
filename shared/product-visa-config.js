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
      '<div class="form-group"><label class="form-label">办理方式 <span class="req">*</span></label><select class="form-control"><option selected>旅行社代办（包含在团费中）</option><option>旅行社代办（单独收费）</option><option>客人自理</option></select></div>',
      '<div class="form-group"><label class="form-label">费用口径</label><select class="form-control"><option selected>签证费含，签证中心服务费含</option><option>仅含代办服务费</option><option>全部客人自理</option></select></div>',
      '<div class="form-group"><label class="form-label">材料版本</label><select class="form-control" data-product-visa-version><option>' + escapeHtml(profile.version) + '</option></select></div>',
      '<div class="form-group"><label class="form-label">最晚提交（出发前N天）</label><input class="form-control" type="number" min="1" value="' + profile.deadline + '" data-product-visa-deadline></div>',
      '<div class="form-group"><label class="form-label">本人到场</label><input class="form-control" type="text" value="' + escapeHtml(profile.presence) + '" readonly data-product-visa-presence></div>',
      '<div class="form-group"><label class="form-label">适用人群</label><select class="form-control"><option selected>全部游客</option><option>团队游客</option><option>个人游客</option><option>家庭游客</option></select></div>',
      '</div>',
      '</article>'
    ].join('');
  }

  var section = document.createElement('section');
  section.className = routePage ? 'route-form-section product-visa-config-section' + (selfProductPage ? ' route-blue-card' : '') : 'card product-visa-config-section';
  section.innerHTML = [
    '<div class="product-visa-section-head">',
    '<div><h2 class="route-section-title">' + (selfProductPage ? '签证说明' : '签证配置') + '</h2><span>引用签证国家规则</span></div>',
    '<a class="btn btn-secondary btn-sm" href="../resource/visa-library.html">查看签证国家</a>',
    '</div>',
    '<div class="product-visa-source-strip">',
    '<div><span>规则来源</span><strong>签证国家</strong></div>',
    '<div><span>产品承接</span><strong>团期按出发日期计算截止日</strong></div>',
    '<div><span>当前状态</span><strong data-product-visa-readiness>配置完整</strong></div>',
    '</div>',
    '<div class="form-grid product-visa-policy-grid">',
    '<div class="form-group"><label class="form-label" for="productVisaPolicy">签证政策 <span class="req">*</span></label><select id="productVisaPolicy" class="form-control"><option' + (defaultRequired ? ' selected' : '') + '>需提前办理</option><option>电子签</option><option>免签</option><option>落地签</option><option' + (!defaultRequired ? ' selected' : '') + '>不涉及出境签证</option></select></div>',
    '<div class="form-group"><label class="form-label" for="productVisaRuleMode">配置方式</label><select id="productVisaRuleMode" class="form-control"><option selected>继承签证国家当前版本</option><option>锁定当前材料版本</option></select></div>',
    '</div>',
    '<div class="product-visa-plan-list" data-product-visa-list>' + planHtml(0, 'FR') + '</div>',
    '<div class="drawer-action-row product-visa-add-row"><button class="btn btn-secondary" type="button" data-add-product-visa>新增签证方案</button></div>'
  ].join('');

  if (routePage) {
    var panels = routePage.querySelectorAll('[data-route-panel]');
    var targetPanel = selfProductPage ? routePage.querySelector('[data-product-visa-panel]') : (panels[2] || panels[panels.length - 1]);
    if (targetPanel) targetPanel.insertBefore(section, targetPanel.firstChild);
  } else {
    var studyTarget = document.getElementById('feeNote');
    if (studyTarget) studyTarget.insertBefore(section, studyTarget.firstChild);
  }

  var policy = document.getElementById('productVisaPolicy');
  var planList = section.querySelector('[data-product-visa-list]');
  var addButton = section.querySelector('[data-add-product-visa]');
  var readiness = section.querySelector('[data-product-visa-readiness]');

  function syncPolicy() {
    var needsPlan = !/免签|不涉及/.test(policy.value);
    planList.hidden = !needsPlan;
    addButton.parentElement.hidden = !needsPlan;
    readiness.textContent = needsPlan ? '配置完整' : policy.value;
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

  policy.addEventListener('change', syncPolicy);
  if (studyDestination) {
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
    if (event.target.matches('[data-product-visa-country]')) syncPlan(event.target.closest('[data-product-visa-plan]'));
  });
  section.addEventListener('click', function (event) {
    if (event.target.closest('[data-add-product-visa]')) {
      var wrapper = document.createElement('div');
      wrapper.innerHTML = planHtml(planList.children.length, planList.children.length === 1 ? 'JP' : 'US');
      planList.appendChild(wrapper.firstElementChild);
      return;
    }
    var remove = event.target.closest('[data-remove-product-visa]');
    if (remove) remove.closest('[data-product-visa-plan]').remove();
  });
  syncPolicy();
})();
