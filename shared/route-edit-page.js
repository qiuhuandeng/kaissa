(function () {
  var page = document.querySelector('[data-route-edit-page]');
  if (!page) return;

  var stepButtons = Array.from(page.querySelectorAll('[data-route-step]'));
  var panels = Array.from(page.querySelectorAll('[data-route-panel]'));
  var currentStep = 0;
  var formDirty = false;
  var currentKind = page.getAttribute('data-route-kind') || 'group';

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function setDirty() {
    formDirty = true;
  }

  function showToast(message) {
    var oldToast = document.querySelector('.route-toast');
    if (oldToast) oldToast.remove();

    var toast = document.createElement('div');
    toast.className = 'route-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    window.setTimeout(function () {
      toast.classList.add('show');
    }, 10);

    window.setTimeout(function () {
      toast.classList.remove('show');
      window.setTimeout(function () {
        toast.remove();
      }, 220);
    }, 2200);
  }

  function showStep(index) {
    currentStep = Math.max(0, Math.min(index, panels.length - 1));

    stepButtons.forEach(function (button, buttonIndex) {
      button.classList.toggle('active', buttonIndex === currentStep);
      button.classList.toggle('done', buttonIndex < currentStep);
    });

    panels.forEach(function (panel, panelIndex) {
      panel.classList.toggle('active', panelIndex === currentStep);
    });

    var prevButton = $('[data-route-prev]');
    var nextButton = $('[data-route-next]');
    if (prevButton) prevButton.disabled = currentStep === 0;
    if (nextButton) nextButton.textContent = currentStep === panels.length - 1 ? '提交审核' : '下一步';
  }

  function navigateTo(href) {
    if (!href) return;
    if (window.caesarNavigateTo) {
      window.caesarNavigateTo(href);
      return;
    }
    window.location.href = href;
  }

  function openSubmitModal() {
    var modal = $('.route-submit-modal');
    if (modal) modal.classList.add('show');
    formDirty = false;
  }

  function closeSubmitModal() {
    var modal = $('.route-submit-modal');
    if (modal) modal.classList.remove('show');
  }

  function saveDraft() {
    formDirty = false;
    showToast('草稿已保存');
  }

  function generateCode(button) {
    var target = $(button.getAttribute('data-generate-code'));
    var prefix = page.getAttribute('data-code-prefix') || 'RT';
    if (!target) return;
    target.value = prefix + '-' + String(Math.floor(Math.random() * 9000) + 1000);
    setDirty();
    showToast('编号已生成');
  }

  function updateCounter(field) {
    var counter = $(field.getAttribute('data-count-target'));
    if (!counter) return;
    var max = field.getAttribute('maxlength') || '';
    counter.textContent = field.value.length + (max ? '/' + max : '');
  }

  function selectedOptionHtml(options, selected) {
    return options.map(function (option) {
      return '<option' + (option === selected ? ' selected' : '') + '>' + option + '</option>';
    }).join('');
  }

  function setFieldValue(id, value) {
    var field = document.getElementById(id);
    if (field) field.value = value;
  }

  function htmlEscape(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function routeTypeToKind(value) {
    if (/邮轮/.test(value)) return 'cruise';
    if (/专列/.test(value)) return 'train';
    if (/自由行/.test(value)) return 'free';
    return 'group';
  }

  function normalizeKind(value) {
    if (/cruise|邮轮/i.test(value || '')) return 'cruise';
    if (/train|专列/i.test(value || '')) return 'train';
    if (/free|自由行/i.test(value || '')) return 'free';
    return 'group';
  }

  function renderKeyValueList(items, className) {
    return items.map(function (item) {
      return '<span class="' + className + '">' + htmlEscape(item[0]) + ' <strong>' + htmlEscape(item[1]) + '</strong></span>';
    }).join('');
  }

  function renderReadiness(items) {
    return items.map(function (item) {
      return '<div class="route-readiness-item"><span>' + htmlEscape(item[0]) + '</span><strong>' + htmlEscape(item[1]) + '</strong></div>';
    }).join('');
  }

  function renderPlanList(items) {
    return items.map(function (item, index) {
      return [
        '<button class="route-plan-switch' + (index === 0 ? ' active' : '') + '" type="button" data-plan-switch data-plan-name="' + htmlEscape(item.name) + '">',
        '<strong>' + htmlEscape(item.name) + '</strong>',
        '<span>' + htmlEscape(item.meta) + '</span>',
        '</button>'
      ].join('');
    }).join('');
  }

  var sharedRouteTypeOptions = ['跟团游', '邮轮', '专列', '自由行', '小包团', '半自由行'];
  var groupExtraHtml = panels[0] && panels[0].querySelectorAll('.route-form-section')[1] ? panels[0].querySelectorAll('.route-form-section')[1].innerHTML : '';
  var groupPlanStructureHtml = panels[1] && panels[1].querySelectorAll('.route-form-section')[2] ? panels[1].querySelectorAll('.route-form-section')[2].innerHTML : '';
  var groupCostHtml = panels[2] && panels[2].querySelector('.route-form-section') ? panels[2].querySelector('.route-form-section').innerHTML : '';

  var routePresets = {
    group: {
      prefix: 'GT',
      scheduleType: 'group',
      code: 'GT-EU-001',
      tagText: '跟团线路',
      tagClass: 'tag tag-blue',
      title: '欧洲十国经典游 12日11晚',
      desc: '北京出发，覆盖法国、德国、瑞士、意大利等核心目的地；本页维护线路稳定信息、方案结构和通用费用政策，出发日期、价格和库存进入团期层维护。',
      subtitle: '纯玩无购物，法德瑞意核心城市连线，含中文领队与签证协助',
      supplier: ['欧洲地接ABC', '国际航空CA', '法国地接联盟'],
      ownerOrg: ['欧洲线路中心', '亚洲线路中心', '国内线路中心'],
      routeType: '跟团游',
      chips: [['供货方', '欧洲地接ABC'], ['承接组织', '欧洲线路中心'], ['出发城市', '北京'], ['主题', '经典巡游']],
      readiness: [['方案数', '2个'], ['参考起价', '¥29,800/人'], ['最后编辑', '2026-06-28']],
      plans: [
        { name: '经济款', meta: '12天11晚 · 三星酒店 · 不含机票' },
        { name: '品质款', meta: '12天11晚 · 五星酒店 · 含机票' }
      ],
      planTitle: '线路方案',
      planSummary: '当前方案参考价 ¥29,800 - ¥32,800/人',
      extraHtml: groupExtraHtml,
      planStructureHtml: groupPlanStructureHtml,
      costHtml: groupCostHtml,
      publishTiles: [['线路基础', '字段完整，可提交'], ['方案结构', '2个方案，均可售'], ['费用政策', '包含/不含/退改已维护'], ['后续动作', '审核通过后按方案开排团期']],
      modalTitle: '已提交线路发布审核',
      modalFocus: '线路发布审批',
      navigateText: '开排团期',
      modalNext: '通过后可开排团期'
    },
    cruise: {
      prefix: 'CR',
      scheduleType: 'cruise',
      code: 'CR-MED-001',
      tagText: '邮轮线路',
      tagClass: 'tag tag-purple',
      title: '理想号地中海邮轮 8天7晚',
      desc: '巴塞罗那母港往返，停靠马赛、热那亚、那不勒斯等经典港口；本页维护船只、航线和售卖舱型结构，航次日期、舱型价格和库存进入团期层维护。',
      subtitle: '巴塞罗那往返，阳台舱优选，含港务费与岸上精选行程',
      supplier: ['凯撒邮轮资源部', '皇家加勒比', '地中海邮轮'],
      ownerOrg: ['邮轮线路中心', '欧洲线路中心', '渠道运营组'],
      routeType: '邮轮',
      chips: [['邮轮公司', '凯撒理想号'], ['船名', '理想号'], ['母港', '巴塞罗那'], ['停靠港', '4个']],
      readiness: [['方案数', '2个'], ['舱型结构', '4类'], ['参考起价', '¥12,800/人']],
      plans: [
        { name: '阳台舱优选', meta: '8天7晚 · 4港口 · 含岸上精选' },
        { name: '套房礼遇', meta: '8天7晚 · 套房权益 · 小团岸上游' }
      ],
      planTitle: '邮轮方案',
      planSummary: '当前方案关联 4 类舱型，参考价 ¥12,800 - ¥26,800/人',
      extraHtml: [
        '<div class="route-section-titlebar"><h2 class="route-section-title">船舶与航区</h2></div>',
        '<div class="route-field-grid three">',
        '<div class="form-group"><label class="form-label" for="cruiseCompany">邮轮公司 <span class="req">*</span></label><input id="cruiseCompany" class="form-control" type="text" value="凯撒理想号"></div>',
        '<div class="form-group"><label class="form-label" for="shipName">船名 <span class="req">*</span></label><input id="shipName" class="form-control" type="text" value="理想号"></div>',
        '<div class="form-group"><label class="form-label" for="homePort">母港 <span class="req">*</span></label><input id="homePort" class="form-control" type="text" value="巴塞罗那"></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="ports">停靠港口及顺序 <span class="req">*</span></label><input id="ports" class="form-control" type="text" value="巴塞罗那 / 马赛 / 热那亚 / 那不勒斯 / 巴塞罗那"></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="shipFacility">船舶设施简介</label><textarea id="shipFacility" class="form-control" rows="3">船上配置主餐厅、自助餐厅、剧院、泳池、儿童俱乐部、健身中心与海景酒廊。</textarea></div>',
        '</div>'
      ].join(''),
      planStructureHtml: [
        '<div class="route-section-titlebar"><h2 class="route-section-title">方案舱型结构</h2><button class="btn btn-secondary" type="button" data-add-row="#cabinMatrix">新增舱型</button></div>',
        '<div class="table-wrap"><table id="cabinMatrix" data-matrix-type="cabin"><thead><tr><th>舱型</th><th>舱型描述</th><th>舱位面积</th><th>床型配置</th><th>窗/阳台</th><th>最大入住</th><th>操作</th></tr></thead><tbody>',
        '<tr><td><input class="form-control" type="text" value="内舱房"></td><td><input class="form-control" type="text" value="经济基础舱"></td><td><input class="form-control" type="text" value="16㎡"></td><td><input class="form-control" type="text" value="双床/大床"></td><td><select class="form-control"><option selected>无窗</option><option>海景窗</option><option>阳台</option></select></td><td><input class="form-control" type="number" value="2"></td><td><button class="table-link danger" type="button" data-remove-row>删除</button></td></tr>',
        '<tr><td><input class="form-control" type="text" value="阳台房"></td><td><input class="form-control" type="text" value="家庭热销舱"></td><td><input class="form-control" type="text" value="24㎡"></td><td><input class="form-control" type="text" value="大床+沙发床"></td><td><select class="form-control"><option>无窗</option><option>海景窗</option><option selected>阳台</option></select></td><td><input class="form-control" type="number" value="4"></td><td><button class="table-link danger" type="button" data-remove-row>删除</button></td></tr>',
        '</tbody></table></div>'
      ].join(''),
      costHtml: [
        '<div class="route-section-titlebar"><h2 class="route-section-title">船票与税费政策</h2></div>',
        '<div class="route-field-grid">',
        '<div class="form-group"><label class="form-label" for="childPolicy">儿童价标准说明 <span class="req">*</span></label><input id="childPolicy" class="form-control" type="text" value="2-12岁与成人同舱按儿童同舱价核算"></div>',
        '<div class="form-group"><label class="form-label" for="taxIncluded">港口税费是否已含 <span class="req">*</span></label><select id="taxIncluded" class="form-control"><option selected>已含</option><option>未含</option></select></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="includeFee">船票通常包含说明 <span class="req">*</span></label><textarea id="includeFee" class="form-control" rows="4">指定舱型住宿、船上主餐厅与自助餐厅、船上基础娱乐活动、港口税费。</textarea></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="excludeFee">船票通常不含说明 <span class="req">*</span></label><textarea id="excludeFee" class="form-control" rows="4">个人消费、收费餐厅、SPA、部分船上活动、岸上自费项目、签证及保险差额。</textarea></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="refundRule">退改规则 <span class="req">*</span></label><textarea id="refundRule" class="form-control" rows="3">名单与舱房确认后按船方政策核损，港务税和船票损失按实际发生扣减。</textarea></div>',
        '</div>'
      ].join(''),
      publishTiles: [['线路基础', '船舶与母港已维护'], ['方案结构', '2个方案，4类舱型'], ['费用政策', '税费/小费/签证已维护'], ['后续动作', '审核通过后按方案舱型开排团期']],
      modalTitle: '已提交邮轮线路审核',
      modalFocus: '舱型结构与税费政策',
      navigateText: '开排团期',
      modalNext: '通过后可开排团期'
    },
    train: {
      prefix: 'TR',
      scheduleType: 'train',
      code: 'TR-SILK-001',
      tagText: '专列线路',
      tagClass: 'tag tag-orange',
      title: '丝绸之路专列 12日11晚',
      desc: '西安始发，串联兰州、张掖、敦煌、吐鲁番、乌鲁木齐等核心节点；本页维护线路、站点和车厢铺位结构，车次日期、铺位价格和库存进入团期层维护。',
      subtitle: '专列串联西北经典目的地，软卧铺位，随车服务团队全程保障',
      supplier: ['中国铁路合作局', '西北地接联盟', '敦煌文旅资源公司'],
      ownerOrg: ['专列线路中心', '国内线路中心', '研学线路中心'],
      routeType: '专列',
      chips: [['运营方', '中国铁路合作局'], ['出发站', '西安站'], ['终到站', '乌鲁木齐站'], ['铺位结构', '3类']],
      readiness: [['方案数', '2个'], ['铺位结构', '3类'], ['参考起价', '¥18,800/人']],
      plans: [
        { name: '舒适软卧', meta: '12天11晚 · 软卧为主 · 标准地接' },
        { name: '尊享包厢', meta: '12天11晚 · 包厢权益 · 小团讲解' }
      ],
      planTitle: '专列方案',
      planSummary: '当前方案关联 3 类铺位，参考价 ¥18,800 - ¥26,800/人',
      extraHtml: [
        '<div class="route-section-titlebar"><h2 class="route-section-title">列车与站点</h2></div>',
        '<div class="route-field-grid three">',
        '<div class="form-group"><label class="form-label" for="startStation">出发站 <span class="req">*</span></label><input id="startStation" class="form-control" type="text" value="西安站"></div>',
        '<div class="form-group"><label class="form-label" for="endStation">终到站 <span class="req">*</span></label><input id="endStation" class="form-control" type="text" value="乌鲁木齐站"></div>',
        '<div class="form-group"><label class="form-label" for="operator">运营方/合作铁路局 <span class="req">*</span></label><input id="operator" class="form-control" type="text" value="中国铁路合作局"></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="mainCities">途经主要城市/地区 <span class="req">*</span></label><input id="mainCities" class="form-control" type="text" value="西安 / 兰州 / 张掖 / 敦煌 / 吐鲁番 / 乌鲁木齐"></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="facility">列车设施亮点</label><textarea id="facility" class="form-control" rows="3">配置随车餐吧、活动车厢、公共洗漱区、行李储物区，随车管家负责车上服务协调。</textarea></div>',
        '</div>'
      ].join(''),
      planStructureHtml: [
        '<div class="route-section-titlebar"><h2 class="route-section-title">方案车厢/铺位结构</h2><button class="btn btn-secondary" type="button" data-add-row="#berthMatrix">新增结构</button></div>',
        '<div class="table-wrap"><table id="berthMatrix" data-matrix-type="berth"><thead><tr><th>车厢类型</th><th>铺位类型</th><th>车厢位置</th><th>单元人数</th><th>设施说明</th><th>操作</th></tr></thead><tbody>',
        '<tr><td><input class="form-control" type="text" value="软卧车厢"></td><td><input class="form-control" type="text" value="四人软卧"></td><td><input class="form-control" type="text" value="3-8号车厢"></td><td><input class="form-control" type="number" value="4"></td><td><input class="form-control" type="text" value="空调/充电/储物"></td><td><button class="table-link danger" type="button" data-remove-row>删除</button></td></tr>',
        '<tr><td><input class="form-control" type="text" value="高包车厢"></td><td><input class="form-control" type="text" value="双人包厢"></td><td><input class="form-control" type="text" value="9-10号车厢"></td><td><input class="form-control" type="number" value="2"></td><td><input class="form-control" type="text" value="独立门锁/软卧床品"></td><td><button class="table-link danger" type="button" data-remove-row>删除</button></td></tr>',
        '</tbody></table></div>'
      ].join(''),
      costHtml: [
        '<div class="route-section-titlebar"><h2 class="route-section-title">费用与服务政策</h2></div>',
        '<div class="route-field-grid">',
        '<div class="form-group"><label class="form-label" for="childPolicy">儿童价标准说明 <span class="req">*</span></label><input id="childPolicy" class="form-control" type="text" value="儿童按占铺/不占铺两类核价"></div>',
        '<div class="form-group"><label class="form-label" for="serviceStaff">随车服务人员说明 <span class="req">*</span></label><input id="serviceStaff" class="form-control" type="text" value="随车领队、管家、目的地地接导游"></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="includeFee">通用费用包含 <span class="req">*</span></label><textarea id="includeFee" class="form-control" rows="4">专列铺位、行程内地接交通、景区首道门票、导游服务、随车服务、行程所列餐食。</textarea></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="excludeFee">通用费用不含 <span class="req">*</span></label><textarea id="excludeFee" class="form-control" rows="4">出发地至出发站交通、终到站返程交通、个人消费、单人占包厢附加费、自费项目。</textarea></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="refundRule">退改规则 <span class="req">*</span></label><textarea id="refundRule" class="form-control" rows="3">名单提交前按规则扣除已发生费用；名单提交后如铁路资源已确认，以实际铁路及地接损失核算。</textarea></div>',
        '</div>'
      ].join(''),
      publishTiles: [['线路基础', '站点与运营方已维护'], ['方案结构', '2个方案，3类铺位'], ['费用政策', '包含/不含/退改已维护'], ['后续动作', '审核通过后按方案铺位开排团期']],
      modalTitle: '已提交专列线路审核',
      modalFocus: '车厢结构与运营资源',
      navigateText: '开排团期',
      modalNext: '通过后可开排团期'
    },
    free: {
      prefix: 'FT',
      scheduleType: 'free',
      code: 'FT-PAR-001',
      tagText: '自由行',
      tagClass: 'tag tag-green',
      title: '巴黎自由行 5-7日',
      desc: '围绕巴黎目的地资源，组合机票、酒店、接送机与当地玩乐；本页维护线路和套餐组合，出行日期价格、库存和采购批次在日期库存层维护。',
      subtitle: '机票+酒店+接送机可选组合，支持按日期维护套餐价格库存',
      supplier: ['欧洲地接ABC', '国际航空CA', '巴黎酒店直采'],
      ownerOrg: ['自由行线路中心', '欧洲线路中心', '渠道运营组'],
      routeType: '自由行',
      chips: [['目的地', '法国巴黎'], ['套餐组合', '3类'], ['资源引用', '酒店/航班/接送'], ['库存方式', '日期库存']],
      readiness: [['方案数', '3个'], ['套餐组合', '机酒/酒店/接送'], ['参考起价', '¥4,800/人']],
      plans: [
        { name: '机票+酒店套餐', meta: '5-7日 · 航班锁位 · 四星酒店' },
        { name: '纯酒店套餐', meta: '3-5晚 · 多房型 · 可加接送机' }
      ],
      planTitle: '自由行方案',
      planSummary: '当前方案关联机票、酒店、接送机套餐，价格库存在日期层维护',
      extraHtml: [
        '<div class="route-section-titlebar"><h2 class="route-section-title">目的地与资源组合</h2></div>',
        '<div class="route-field-grid three">',
        '<div class="form-group"><label class="form-label" for="departCity">出发城市 <span class="req">*</span></label><input id="departCity" class="form-control" type="text" value="全国"></div>',
        '<div class="form-group"><label class="form-label" for="destinationCountry">目的地国家/地区 <span class="req">*</span></label><input id="destinationCountry" class="form-control" type="text" value="法国"></div>',
        '<div class="form-group"><label class="form-label" for="destinationCity">目的地城市 <span class="req">*</span></label><input id="destinationCity" class="form-control" type="text" value="巴黎"></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="resourcePool">引用资源</label><input id="resourcePool" class="form-control" type="text" value="国际航空CA锁位、巴黎四星酒店、接送机服务、卢浮宫门票"></div>',
        '</div>'
      ].join(''),
      planStructureHtml: [
        '<div class="route-section-titlebar"><h2 class="route-section-title">方案套餐组合</h2><button class="btn btn-secondary" type="button" data-add-row="#packageMatrix">新增套餐项</button></div>',
        '<div class="table-wrap"><table id="packageMatrix" data-matrix-type="package"><thead><tr><th>套餐项</th><th>引用资源</th><th>规则说明</th><th>操作</th></tr></thead><tbody>',
        '<tr><td><input class="form-control" type="text" value="往返机票"></td><td><input class="form-control" type="text" value="国际航空CA锁位"></td><td><input class="form-control" type="text" value="按出发城市匹配航班"></td><td><button class="table-link danger" type="button" data-remove-row>删除</button></td></tr>',
        '<tr><td><input class="form-control" type="text" value="巴黎四星酒店"></td><td><input class="form-control" type="text" value="巴黎酒店直采"></td><td><input class="form-control" type="text" value="3晚起订，可选房型"></td><td><button class="table-link danger" type="button" data-remove-row>删除</button></td></tr>',
        '</tbody></table></div>'
      ].join(''),
      costHtml: [
        '<div class="route-section-titlebar"><h2 class="route-section-title">套餐与日期价格规则</h2></div>',
        '<div class="route-field-grid">',
        '<div class="form-group"><label class="form-label" for="adultRef">套餐参考价区间</label><input id="adultRef" class="form-control" type="text" value="¥4,800 - ¥9,800"></div>',
        '<div class="form-group"><label class="form-label" for="dateStock">库存维护方式 <span class="req">*</span></label><select id="dateStock" class="form-control"><option selected>按出行日期维护价格库存</option><option>按酒店房晚维护</option></select></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="includeFee">费用包含 <span class="req">*</span></label><textarea id="includeFee" class="form-control" rows="4">套餐所选机票、酒店房晚、接送机或当地玩乐项目，以方案套餐项为准。</textarea></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="excludeFee">费用不含 <span class="req">*</span></label><textarea id="excludeFee" class="form-control" rows="4">签证、保险、城市税、个人消费和未选择的当地玩乐项目。</textarea></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="refundRule">退改规则 <span class="req">*</span></label><textarea id="refundRule" class="form-control" rows="3">机票、酒店和当地玩乐按各自资源退改规则核损，日期库存售罄后不可超卖。</textarea></div>',
        '</div>'
      ].join(''),
      publishTiles: [['线路基础', '目的地与资源已维护'], ['方案结构', '3类套餐组合'], ['费用政策', '日期库存规则已维护'], ['后续动作', '审核通过后维护日期价格库存']],
      modalTitle: '已提交自由行线路审核',
      modalFocus: '套餐组合与日期库存',
      navigateText: '日期库存',
      scheduleHref: 'product-free-travel-list.html?tab=inventory',
      modalNext: '通过后可维护日期价格库存'
    }
  };

  function applyRoutePreset(kind) {
    currentKind = normalizeKind(kind);
    var preset = routePresets[currentKind] || routePresets.group;
    page.setAttribute('data-route-kind', currentKind);
    page.setAttribute('data-code-prefix', preset.prefix);
    page.setAttribute('data-schedule-href', preset.scheduleHref || 'products.html');

    var title = page.querySelector('.route-hero-title');
    var desc = page.querySelector('.route-hero-desc');
    var eyebrow = page.querySelector('.route-eyebrow');
    var typeTag = page.querySelector('.route-hero-title-row .tag:last-child');
    var chips = page.querySelector('.route-hero-main .route-meta-strip');
    var readiness = page.querySelector('.route-readiness-grid');
    if (title) title.textContent = preset.title;
    if (desc) desc.textContent = preset.desc;
    if (eyebrow) eyebrow.textContent = '线路编号 ' + preset.code;
    if (typeTag) {
      typeTag.className = preset.tagClass;
      typeTag.textContent = preset.tagText;
    }
    if (chips) chips.innerHTML = renderKeyValueList(preset.chips, 'route-chip');
    if (readiness) readiness.innerHTML = renderReadiness(preset.readiness);
    var navigateButton = page.querySelector('[data-route-navigate]');
    if (navigateButton) navigateButton.textContent = preset.navigateText || '开排团期';

    setFieldValue('lineCode', preset.code);
    setFieldValue('lineName', preset.title);
    setFieldValue('subTitle', preset.subtitle);

    var routeType = document.getElementById('lineType');
    if (routeType) routeType.innerHTML = selectedOptionHtml(sharedRouteTypeOptions, preset.routeType);
    var supplier = document.getElementById('supplier');
    if (supplier) supplier.innerHTML = selectedOptionHtml(preset.supplier, preset.supplier[0]);
    var ownerOrg = document.getElementById('ownerOrg');
    if (ownerOrg) ownerOrg.innerHTML = selectedOptionHtml(preset.ownerOrg, preset.ownerOrg[0]);

    var basicExtraSection = panels[0] && panels[0].querySelectorAll('.route-form-section')[1];
    if (basicExtraSection) basicExtraSection.innerHTML = preset.extraHtml;

    var planTitle = panels[1] && panels[1].querySelector('.route-section-title');
    if (planTitle) planTitle.textContent = preset.planTitle;
    var itineraryTitle = panels[1] && panels[1].querySelectorAll('.route-form-section')[1] && panels[1].querySelectorAll('.route-form-section')[1].querySelector('.route-section-title');
    if (itineraryTitle) itineraryTitle.textContent = currentKind === 'cruise' ? '航线日程' : currentKind === 'free' ? '自由行安排' : '分日行程';
    var planList = page.querySelector('.route-plan-list');
    if (planList) planList.innerHTML = renderPlanList(preset.plans);
    var activePlanLabel = page.querySelector('[data-active-plan-label]');
    var planHeadSummary = page.querySelector('.route-plan-head span');
    if (activePlanLabel) activePlanLabel.textContent = preset.plans[0].name;
    if (planHeadSummary) planHeadSummary.textContent = preset.planSummary;

    var planStructureSection = panels[1] && panels[1].querySelectorAll('.route-form-section')[2];
    if (planStructureSection) {
      planStructureSection.classList.toggle('route-matrix-table', currentKind !== 'group');
      planStructureSection.innerHTML = preset.planStructureHtml;
    }

    var costSection = panels[2] && panels[2].querySelector('.route-form-section');
    if (costSection) costSection.innerHTML = preset.costHtml;

    var publishGrid = panels[3] && panels[3].querySelector('.route-publish-grid');
    if (publishGrid) {
      publishGrid.innerHTML = preset.publishTiles.map(function (item) {
        return '<div class="route-publish-tile"><span>' + htmlEscape(item[0]) + '</span><strong>' + htmlEscape(item[1]) + '</strong></div>';
      }).join('');
    }

    var modalTitle = document.querySelector('.route-submit-modal .modal-title');
    var modalItems = document.querySelectorAll('.route-success-summary > div');
    if (modalTitle) modalTitle.textContent = preset.modalTitle;
    if (modalItems[0]) modalItems[0].innerHTML = '<span>线路编号</span><strong>' + htmlEscape(preset.code) + '</strong>';
    if (modalItems[1]) modalItems[1].innerHTML = '<span>审核重点</span><strong>' + htmlEscape(preset.modalFocus) + '</strong>';
    if (modalItems[2]) modalItems[2].innerHTML = '<span>方案数量</span><strong>' + htmlEscape(String(preset.plans.length)) + '个</strong>';
    if (modalItems[3]) modalItems[3].innerHTML = '<span>后续动作</span><strong>' + htmlEscape(preset.modalNext || '通过后可开排团期') + '</strong>';

    page.querySelectorAll('input, textarea').forEach(updateCounter);
  }

  function rowTemplate(type) {
    if (type === 'cabin') {
      return [
        '<tr>',
        '<td><input class="form-control" type="text" value="新增舱型"></td>',
        '<td><input class="form-control" type="text" value="待维护"></td>',
        '<td><input class="form-control" type="text" value="18㎡"></td>',
        '<td><input class="form-control" type="text" value="双床/大床"></td>',
        '<td><select class="form-control"><option>无窗</option><option>海景窗</option><option>阳台</option></select></td>',
        '<td><input class="form-control" type="number" value="2"></td>',
        '<td><button class="table-link danger" type="button" data-remove-row>删除</button></td>',
        '</tr>'
      ].join('');
    }

    if (type === 'berth') {
      return [
        '<tr>',
        '<td><input class="form-control" type="text" value="新增车厢"></td>',
        '<td><input class="form-control" type="text" value="软卧"></td>',
        '<td><input class="form-control" type="text" value="待维护"></td>',
        '<td><input class="form-control" type="number" value="4"></td>',
        '<td><input class="form-control" type="text" value="空调/充电/储物"></td>',
        '<td><button class="table-link danger" type="button" data-remove-row>删除</button></td>',
        '</tr>'
      ].join('');
    }

    if (type === 'package') {
      return [
        '<tr>',
        '<td><input class="form-control" type="text" value="新增套餐项"></td>',
        '<td><input class="form-control" type="text" value="待选择资源"></td>',
        '<td><input class="form-control" type="text" value="待维护规则"></td>',
        '<td><button class="table-link danger" type="button" data-remove-row>删除</button></td>',
        '</tr>'
      ].join('');
    }

    return [
      '<tr>',
      '<td><input class="form-control" type="text" value="新增服务项"></td>',
      '<td><input class="form-control" type="text" value="待维护"></td>',
      '<td><button class="table-link danger" type="button" data-remove-row>删除</button></td>',
      '</tr>'
    ].join('');
  }

  function addMatrixRow(button) {
    var table = $(button.getAttribute('data-add-row'));
    if (!table) return;
    var tbody = table.tBodies[0];
    if (!tbody) return;
    tbody.insertAdjacentHTML('beforeend', rowTemplate(table.getAttribute('data-matrix-type')));
    setDirty();
    showToast('已新增一行');
  }

  function fillAiDraft(button) {
    var target = $(button.getAttribute('data-ai-fill'));
    if (!target) return;
    var kind = page.getAttribute('data-route-kind');
    var textMap = {
      group: 'D1 北京集合，搭乘国际航班前往巴黎。\nD2 巴黎市区游览，安排卢浮宫、凯旋门、塞纳河外观。\nD3 前往第戎及瑞士边境小镇，晚间入住湖区酒店。',
      cruise: 'D1 巴塞罗那登船，办理登船手续并熟悉船上设施。\nD2 马赛靠港，安排普罗旺斯岸上观光。\nD3 热那亚靠港，安排老城与港区游览。',
      train: 'D1 西安集合登车，办理铺位分配与行前说明。\nD2 兰州停靠，安排黄河风情线游览后返车。\nD3 张掖停靠，游览丹霞景区，晚间车上活动。',
      free: 'D1 抵达巴黎，接机后入住酒店。\nD2 巴黎市区自由活动，可加订卢浮宫门票。\nD3 凡尔赛或塞纳河游船可选，晚间自由安排。'
    };
    target.value = textMap[kind] || textMap.group;
    target.dispatchEvent(new Event('input', { bubbles: true }));
    setDirty();
    showToast('已生成方案草稿');
  }

  function selectPlan(button) {
    page.querySelectorAll('[data-plan-switch]').forEach(function (item) {
      item.classList.toggle('active', item === button);
    });

    var label = page.querySelector('[data-active-plan-label]');
    if (label) label.textContent = button.getAttribute('data-plan-name') || button.textContent.trim();
  }

  stepButtons.forEach(function (button, index) {
    button.addEventListener('click', function () {
      showStep(index);
    });
  });

  applyRoutePreset(new URLSearchParams(window.location.search).get('type') || currentKind);

  document.addEventListener('click', function (event) {
    var target = event.target;

    var nextButton = target.closest('[data-route-next]');
    if (nextButton) {
      if (currentStep >= panels.length - 1) {
        openSubmitModal();
      } else {
        showStep(currentStep + 1);
      }
      return;
    }

    var prevButton = target.closest('[data-route-prev]');
    if (prevButton) {
      showStep(currentStep - 1);
      return;
    }

    var saveButton = target.closest('[data-route-save]');
    if (saveButton) {
      saveDraft();
      return;
    }

    var submitButton = target.closest('[data-route-submit]');
    if (submitButton) {
      showStep(panels.length - 1);
      openSubmitModal();
      return;
    }

    var generateButton = target.closest('[data-generate-code]');
    if (generateButton) {
      generateCode(generateButton);
      return;
    }

    var addRowButton = target.closest('[data-add-row]');
    if (addRowButton) {
      addMatrixRow(addRowButton);
      return;
    }

    var removeRowButton = target.closest('[data-remove-row]');
    if (removeRowButton) {
      var row = removeRowButton.closest('tr');
      if (row) row.remove();
      setDirty();
      showToast('已删除');
      return;
    }

    var aiButton = target.closest('[data-ai-fill]');
    if (aiButton) {
      fillAiDraft(aiButton);
      return;
    }

    var planButton = target.closest('[data-plan-switch]');
    if (planButton) {
      selectPlan(planButton);
      return;
    }

    var tagRemove = target.closest('[data-tag-remove]');
    if (tagRemove) {
      var tag = tagRemove.closest('.route-chip');
      if (tag) tag.remove();
      setDirty();
      return;
    }

    var closeModalButton = target.closest('[data-close-route-modal]');
    if (closeModalButton) {
      closeSubmitModal();
      return;
    }

    var confirmButton = target.closest('[data-route-submit-success]');
    if (confirmButton) {
      navigateTo(page.getAttribute('data-success-href'));
      return;
    }

    var navigateButton = target.closest('[data-route-navigate]');
    if (navigateButton) {
      var scheduleHref = page.getAttribute('data-schedule-href') || navigateButton.getAttribute('data-route-navigate');
      if (scheduleHref === 'products.html') {
        showToast('团期开排将在下一批团期创建页承接');
        return;
      }
      navigateTo(scheduleHref);
    }
  });

  page.addEventListener('change', function (event) {
    if (event.target && event.target.id === 'lineType') {
      applyRoutePreset(routeTypeToKind(event.target.value));
      setDirty();
      return;
    }
    if (event.target && event.target.matches('input, textarea, select')) {
      setDirty();
    }
  });

  page.addEventListener('input', function (event) {
    if (!event.target || !event.target.matches('input, textarea, select')) return;
    updateCounter(event.target);
    setDirty();
  });

  page.querySelectorAll('input, textarea, select').forEach(function (field) {
    field.addEventListener('input', function () {
      updateCounter(field);
      setDirty();
    });
    field.addEventListener('change', setDirty);
    updateCounter(field);
  });

  document.querySelectorAll('[data-confirm-back]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      if (formDirty && !window.confirm('当前内容未保存，确认离开吗？')) {
        event.preventDefault();
      }
    });
  });

  window.addEventListener('beforeunload', function (event) {
    if (!formDirty) return;
    event.preventDefault();
    event.returnValue = '';
  });

  showStep(0);
})();
