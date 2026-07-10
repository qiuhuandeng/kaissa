(function () {
  var page = document.querySelector('[data-route-edit-page]');
  if (!page) return;

  var stepButtons = Array.from(page.querySelectorAll('[data-route-step]'));
  var panels = Array.from(page.querySelectorAll('[data-route-panel]'));
  var currentStep = 0;
  var formDirty = false;
  var currentKind = page.getAttribute('data-route-kind') || 'group';
  var currentVariant = 'outbound';
  var isSupplierRoute = page.hasAttribute('data-supplier-route-edit');

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

    page.querySelectorAll('[data-route-prev]').forEach(function (prevButton) {
      prevButton.disabled = currentStep === 0;
    });
    page.querySelectorAll('[data-route-next]').forEach(function (nextButton) {
      nextButton.textContent = currentStep === panels.length - 1 ? (isSupplierRoute ? '提交凯撒处理' : '提交审核') : '下一步';
    });
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
    persistResourceTemplates();
    if (modal) modal.classList.add('show');
    formDirty = false;
  }

  function closeSubmitModal() {
    var modal = $('.route-submit-modal');
    if (modal) modal.classList.remove('show');
  }

  function saveDraft() {
    formDirty = false;
    var savedTemplates = persistResourceTemplates();
    showToast(savedTemplates.length ? '草稿已保存，资源模板草稿已记录' : '草稿已保存');
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

  function collectResourceTemplates() {
    return Array.from(page.querySelectorAll('[data-save-resource-template]:checked')).map(function (field) {
      return {
        type: field.getAttribute('data-template-type') || '资源模板',
        product: (document.getElementById('lineName') || {}).value || '',
        route: (page.querySelector('[data-plan-switch].active strong') || {}).textContent || '',
        createdAt: new Date().toISOString()
      };
    });
  }

  function persistResourceTemplates() {
    var templates = collectResourceTemplates();
    if (!templates.length) return [];
    try {
      var oldTemplates = JSON.parse(window.localStorage.getItem('caesarResourceTemplateDrafts') || '[]');
      window.localStorage.setItem('caesarResourceTemplateDrafts', JSON.stringify(templates.concat(oldTemplates).slice(0, 20)));
    } catch (error) {}
    return templates;
  }

  function applyResourceSelection(field) {
    var value = field.value || '';
    if (field.id === 'flightRouteResource') {
      var flightMap = {
        '北京首都T3 → 巴黎戴高乐T1（国航/法航）': ['国际航空CA', 'CA933 / AF111', '北京首都T3 → 巴黎戴高乐T1', '直飞'],
        '北京首都T3 → 法兰克福T1（国航/汉莎）': ['汉莎航空中国区', 'CA837 / LH721', '北京首都T3 → 法兰克福T1', '直飞'],
        '上海浦东T1 → 大阪关西T1（东航/日航）': ['东航华东销售部', 'MU515 / JL898', '上海浦东T1 → 大阪关西T1', '直飞']
      };
      var flight = flightMap[value] || ['', '', '', ''];
      setFieldValue('flightCarrier', flight[0]);
      setFieldValue('flightNo', flight[1]);
      setFieldValue('flightAirports', flight[2]);
      setFieldValue('flightTransit', flight[3]);
      return true;
    }
    if (field.id === 'cruiseRoute') {
      var cruiseMap = {
        '西地中海精华': ['皇家加勒比国际游轮', '海洋绿洲号', '巴塞罗那', '巴塞罗那 / 马赛 / 那不勒斯 / 巴塞罗那'],
        '地中海经典线': ['地中海邮轮 MSC Cruises', '地中海荣耀号', '巴塞罗那', '巴塞罗那 / 罗马 / 雅典 / 圣托里尼 / 巴塞罗那'],
        '日韩短线': ['地中海邮轮 MSC Cruises', '地中海荣耀号', '上海', '上海 / 福冈 / 长崎 / 上海']
      };
      var cruise = cruiseMap[value] || ['', '', '', ''];
      setFieldValue('cruiseCompany', cruise[0]);
      setFieldValue('shipName', cruise[1]);
      setFieldValue('homePort', cruise[2]);
      setFieldValue('ports', cruise[3]);
      return true;
    }
    if (field.id === 'trainRouteResource') {
      var trainMap = {
        '丝绸之路基础线': ['西安站', '乌鲁木齐站', '丝路专列运营中心', '西安 / 兰州 / 张掖 / 敦煌 / 吐鲁番 / 乌鲁木齐'],
        '东北冰雪基础线': ['哈尔滨站', '长春站', '冰雪北国旅游专列公司', '哈尔滨 / 雪乡 / 亚布力 / 吉林 / 长春'],
        '茶马古道基础线': ['成都站', '昆明站', '茶马古道铁路文旅', '成都 / 大理 / 丽江 / 香格里拉 / 昆明']
      };
      var train = trainMap[value] || ['', '', '', ''];
      setFieldValue('startStation', train[0]);
      setFieldValue('endStation', train[1]);
      setFieldValue('operator', train[2]);
      setFieldValue('mainCities', train[3]);
      return true;
    }
    return false;
  }

  function htmlEscape(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function routeTypeToKind(value) {
    if (/国内/.test(value)) return 'domestic';
    if (/出境/.test(value)) return 'outbound';
    if (/参团|跟团/.test(value)) return 'outbound';
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

  function normalizeVariant(value) {
    if (/domestic|国内/i.test(value || '')) return 'domestic';
    return 'outbound';
  }

  function renderKeyValueList(items, className) {
    return items.map(function (item) {
      return '<span class="' + className + '">' + htmlEscape(item[0]) + '：<strong>' + htmlEscape(item[1]) + '</strong></span>';
    }).join('');
  }

  function renderReadiness(items) {
    return items.map(function (item) {
      return '<div class="route-readiness-item"><span>' + htmlEscape(item[0]) + '</span><strong>' + htmlEscape(item[1]) + '</strong></div>';
    }).join('');
  }

  function renderHeroTags(items) {
    return items.map(function (item) {
      return '<span># ' + htmlEscape(item) + '</span>';
    }).join('');
  }

  function renderTabActions(isLastStep) {
    return [
      '<div class="route-tab-actions">',
      '<button class="btn btn-secondary" type="button" data-route-prev>上一步</button>',
      '<button class="btn btn-primary" type="button" data-route-next>',
      isLastStep ? (isSupplierRoute ? '提交凯撒处理' : '提交审核') : '下一步',
      '</button>',
      '</div>'
    ].join('');
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

  var groupExtraHtml = panels[0] && panels[0].querySelector('[data-route-basic-extra]') ? panels[0].querySelector('[data-route-basic-extra]').innerHTML : '';
  var groupPlanStructureHtml = panels[1] && panels[1].querySelector('[data-plan-structure-section]') ? panels[1].querySelector('[data-plan-structure-section]').innerHTML : '';
  var groupCostHtml = panels[2] && panels[2].querySelector('.route-form-section') ? panels[2].querySelector('.route-form-section').innerHTML : '';

  var routePresets = {
    group: {
      scheduleType: 'group',
      tagText: '参团游产品',
      tagClass: 'tag tag-blue',
      title: '欧洲十国经典游 12日11晚',
      desc: '北京出发，覆盖法国、德国、瑞士、意大利等核心目的地。',
      subtitle: '纯玩无购物，法德瑞意核心城市连线，含中文领队与签证协助',
      supplier: ['欧洲地接ABC', '国际航空CA', '法国地接联盟'],
      ownerOrg: ['欧洲线路中心', '亚洲线路中心', '国内线路中心'],
      routeType: '参团游',
      travelType: '出境游',
      chips: [['供货方', '欧洲地接ABC'], ['承接组织', '欧洲线路中心'], ['出发城市', '北京']],
      heroTags: ['纯玩', '含签证', '中文领队'],
      readiness: [['线路数', '2条'], ['参考起价', '¥29,800/人'], ['数据完整度', '100%']],
      plans: [
        { name: '经济款', meta: '12天11晚 · 三星酒店 · 不含机票' },
        { name: '品质款', meta: '12天11晚 · 五星酒店 · 含机票' }
      ],
      planTitle: '产品线路',
      planSummary: '当前线路参考价 ¥29,800 - ¥32,800/人',
      extraHtml: groupExtraHtml,
      planStructureHtml: groupPlanStructureHtml,
      costHtml: groupCostHtml,
      publishTiles: [['基础信息', '字段完整，可提交'], ['产品线路', '2条线路，均可售'], ['费用说明', '包含/不含/退改已维护'], ['后续动作', '审核通过后按线路开排团期']],
      modalTitle: '已提交产品发布审核',
      modalFocus: '产品发布审批',
      navigateText: '开排团期',
      scheduleHref: '../tour/team-create.html',
      modalNext: '通过后可基于线路开排团期'
    },
    cruise: {
      scheduleType: 'cruise',
      tagText: '邮轮产品',
      tagClass: 'tag tag-purple',
      title: '理想号地中海邮轮 8天7晚',
      desc: '巴塞罗那母港往返，停靠马赛、热那亚、那不勒斯等经典港口。',
      subtitle: '巴塞罗那往返，阳台舱优选，含港务费与岸上精选行程',
      supplier: ['凯撒邮轮资源部', '皇家加勒比', '地中海邮轮'],
      ownerOrg: ['邮轮产品中心', '欧洲产品中心', '渠道运营组'],
      routeType: '邮轮',
      travelType: '出境游',
      chips: [['邮轮公司', '凯撒理想号'], ['船名', '理想号'], ['母港', '巴塞罗那']],
      heroTags: ['阳台舱', '岸上游', '接送机'],
      readiness: [['线路数', '2条'], ['参考起价', '¥12,800/人'], ['数据完整度', '100%']],
      plans: [
        { name: '阳台舱优选', meta: '8天7晚 · 4港口 · 含岸上精选' },
        { name: '套房礼遇', meta: '8天7晚 · 套房权益 · 小团岸上游' }
      ],
      planTitle: '产品线路',
      planSummary: '当前线路关联 4 类舱型，参考价 ¥12,800 - ¥26,800/人',
      extraHtml: [
        '<div class="route-section-titlebar"><h2 class="route-section-title">船舶与航区</h2></div>',
        '<div class="route-field-grid three">',
        '<div class="form-group"><label class="form-label" for="cruiseCompany">邮轮公司 <span class="req">*</span></label><select id="cruiseCompany" class="form-control" data-resource-ref><option selected>地中海邮轮 MSC Cruises</option><option>皇家加勒比国际游轮</option><option>歌诗达邮轮 Costa Cruises</option></select></div>',
        '<div class="form-group"><label class="form-label" for="shipName">船只档案 <span class="req">*</span></label><select id="shipName" class="form-control" data-resource-ref><option selected>地中海荣耀号</option><option>海洋绿洲号</option><option>歌诗达威尼斯号</option></select></div>',
        '<div class="form-group"><label class="form-label" for="cruiseRoute">邮轮模板 <span class="req">*</span></label><select id="cruiseRoute" class="form-control" data-resource-ref><option selected>西地中海精华</option><option>地中海经典线</option><option>日韩短线</option><option>直接填写</option></select></div>',
        '<div class="form-group"><label class="form-label" for="homePort">母港 <span class="req">*</span></label><input id="homePort" class="form-control" type="text" value="巴塞罗那"></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="ports">停靠港口及顺序 <span class="req">*</span></label><input id="ports" class="form-control" type="text" value="巴塞罗那 / 马赛 / 热那亚 / 那不勒斯 / 巴塞罗那"></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="shipFacility">船舶设施简介</label><textarea id="shipFacility" class="form-control" rows="3">船上配置主餐厅、自助餐厅、剧院、泳池、儿童俱乐部、健身中心与海景酒廊。</textarea></div>',
        '<div class="form-group"><label class="form-label" for="cruisePackageName">售卖航线名称 <span class="req">*</span></label><input id="cruisePackageName" class="form-control" type="text" value="理想号地中海阳台舱优选"></div>',
        '<div class="form-group"><label class="form-label" for="cruiseCabinSale">舱型售卖组合 <span class="req">*</span></label><input id="cruiseCabinSale" class="form-control" type="text" value="阳台舱为主，开放内舱/海景/套房加价"></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="shoreTour">岸上游安排 <span class="req">*</span></label><textarea id="shoreTour" class="form-control" rows="3">马赛、热那亚、那不勒斯安排精选岸上游；罗马提供小团加购。</textarea></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="prePostCruise">航前航后服务</label><textarea id="prePostCruise" class="form-control" rows="3">可选巴塞罗那航前酒店、登船日接送机、离船日送机。</textarea></div>',
        '</div>'
      ].join(''),
      planStructureHtml: [
        '<div class="route-section-titlebar"><h2 class="route-section-title">线路舱型结构</h2><button class="btn btn-secondary" type="button" data-add-row="#cabinMatrix">新增舱型</button></div>',
        '<div class="table-wrap"><table id="cabinMatrix" data-matrix-type="cabin"><thead><tr><th>舱型</th><th>窗/阳台</th><th>标准入住</th><th>最大入住</th><th>第三/第四人</th><th>儿童不占位</th><th>操作</th></tr></thead><tbody>',
        '<tr><td><input class="form-control" type="text" value="内舱房"></td><td><select class="form-control"><option selected>无窗</option><option>海景窗</option><option>阳台</option></select></td><td><input class="form-control" type="number" value="2"></td><td><input class="form-control" type="number" value="4"></td><td><select class="form-control"><option selected>支持</option><option>不支持</option></select></td><td><select class="form-control"><option selected>支持</option><option>需确认</option><option>不支持</option></select></td><td><button class="table-link danger" type="button" data-remove-row>删除</button></td></tr>',
        '<tr><td><input class="form-control" type="text" value="阳台房"></td><td><select class="form-control"><option>无窗</option><option>海景窗</option><option selected>阳台</option></select></td><td><input class="form-control" type="number" value="2"></td><td><input class="form-control" type="number" value="4"></td><td><select class="form-control"><option selected>支持</option><option>不支持</option></select></td><td><select class="form-control"><option>支持</option><option selected>需确认</option><option>不支持</option></select></td><td><button class="table-link danger" type="button" data-remove-row>删除</button></td></tr>',
        '</tbody></table></div>'
      ].join(''),
      costHtml: [
        '<div class="route-section-titlebar"><h2 class="route-section-title">费用说明</h2></div>',
        '<div class="route-field-grid">',
        '<div class="form-group"><label class="form-label" for="childPolicy">儿童价标准 <span class="req">*</span></label><input id="childPolicy" class="form-control" type="text" value="儿童占位按所选舱型计价，儿童不占位使用独立儿童不占位价且不扣舱室库存"></div>',
        '<div class="form-group"><label class="form-label" for="taxIncluded">港口税费是否已含 <span class="req">*</span></label><select id="taxIncluded" class="form-control"><option selected>已含</option><option>未含</option></select></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="includeFee">船票通常包含 <span class="req">*</span></label><textarea id="includeFee" class="form-control" rows="4">指定舱型住宿、船上主餐厅与自助餐厅、船上基础娱乐活动、港口税费。</textarea></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="excludeFee">船票通常不含 <span class="req">*</span></label><textarea id="excludeFee" class="form-control" rows="4">个人消费、收费餐厅、SPA、部分船上活动、岸上自费项目、签证及保险差额。</textarea></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="refundRule">退改规则 <span class="req">*</span></label><textarea id="refundRule" class="form-control" rows="3">名单与舱房确认后按船方政策核损，港务税和船票损失按实际发生扣减。</textarea></div>',
        '</div>'
      ].join(''),
      publishTiles: [['基础信息', '船舶与母港已维护'], ['产品线路', '2条线路，4类舱型'], ['费用说明', '税费/小费/签证已维护'], ['后续动作', '审核通过后按线路舱型开排航次']],
      modalTitle: '已提交邮轮产品审核',
      modalFocus: '舱型结构与税费政策',
      navigateText: '开排航次',
      scheduleHref: '../tour/team-create.html',
      modalNext: '通过后可开排航次'
    },
    train: {
      scheduleType: 'train',
      tagText: '专列产品',
      tagClass: 'tag tag-orange',
      title: '丝绸之路专列 12日11晚',
      desc: '西安始发，串联兰州、张掖、敦煌、吐鲁番、乌鲁木齐等核心节点。',
      subtitle: '专列串联西北经典目的地，软卧铺位，随车服务团队全程保障',
      supplier: ['中国铁路合作局', '西北地接联盟', '敦煌文旅资源公司'],
      ownerOrg: ['专列产品中心', '国内产品中心', '研学产品中心'],
      routeType: '专列',
      travelType: '境内游',
      chips: [['运营方', '中国铁路合作局'], ['出发站', '西安站'], ['终到站', '乌鲁木齐站']],
      heroTags: ['专列', '软卧', '随车服务'],
      readiness: [['线路数', '2条'], ['参考起价', '¥18,800/人'], ['数据完整度', '100%']],
      plans: [
        { name: '舒适软卧', meta: '12天11晚 · 软卧为主 · 标准地接' },
        { name: '尊享包厢', meta: '12天11晚 · 包厢权益 · 小团讲解' }
      ],
      planTitle: '产品线路',
      planSummary: '当前线路关联 3 类铺位，参考价 ¥18,800 - ¥26,800/人',
      extraHtml: [
        '<div class="route-section-titlebar"><h2 class="route-section-title">列车与站点</h2></div>',
        '<div class="route-field-grid three">',
        '<div class="form-group"><label class="form-label" for="startStation">出发站 <span class="req">*</span></label><input id="startStation" class="form-control" type="text" value="西安站"></div>',
        '<div class="form-group"><label class="form-label" for="endStation">终到站 <span class="req">*</span></label><input id="endStation" class="form-control" type="text" value="乌鲁木齐站"></div>',
        '<div class="form-group"><label class="form-label" for="operator">专列运营商 <span class="req">*</span></label><select id="operator" class="form-control" data-resource-ref><option selected>丝路专列运营中心</option><option>冰雪北国旅游专列公司</option><option>茶马古道铁路文旅</option></select></div>',
        '<div class="form-group"><label class="form-label" for="trainRouteResource">专列模板 <span class="req">*</span></label><select id="trainRouteResource" class="form-control" data-resource-ref><option selected>丝绸之路基础线</option><option>东北冰雪基础线</option><option>茶马古道基础线</option><option>直接填写</option></select></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="mainCities">途经主要城市/地区 <span class="req">*</span></label><input id="mainCities" class="form-control" type="text" value="西安 / 兰州 / 张掖 / 敦煌 / 吐鲁番 / 乌鲁木齐"></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="facility">列车设施亮点</label><textarea id="facility" class="form-control" rows="3">配置随车餐吧、活动车厢、公共洗漱区、行李储物区，随车管家负责车上服务协调。</textarea></div>',
        '<div class="form-group"><label class="form-label" for="trainPackageName">售卖线路名称 <span class="req">*</span></label><input id="trainPackageName" class="form-control" type="text" value="丝绸之路专列舒适软卧"></div>',
        '<div class="form-group"><label class="form-label" for="berthSale">铺位售卖组合 <span class="req">*</span></label><input id="berthSale" class="form-control" type="text" value="软卧为主，硬卧/包厢加价"></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="offTrainTour">下车游览安排 <span class="req">*</span></label><textarea id="offTrainTour" class="form-control" rows="3">兰州、张掖、敦煌、吐鲁番安排下车游览，站点接驳由当地地接承接。</textarea></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="onTrainService">随车服务</label><textarea id="onTrainService" class="form-control" rows="3">随车领队、管家、餐饮协调和夜间巡查；重点站点安排行李协助。</textarea></div>',
        '</div>'
      ].join(''),
      planStructureHtml: [
        '<div class="route-section-titlebar"><h2 class="route-section-title">线路车厢/铺位结构</h2><button class="btn btn-secondary" type="button" data-add-row="#berthMatrix">新增结构</button></div>',
        '<div class="table-wrap"><table id="berthMatrix" data-matrix-type="berth"><thead><tr><th>席别</th><th>铺位</th><th>车厢位置</th><th>包厢</th><th>儿童不占位</th><th>设施配置</th><th>操作</th></tr></thead><tbody>',
        '<tr><td><input class="form-control" type="text" value="软卧"></td><td><input class="form-control" type="text" value="下铺"></td><td><input class="form-control" type="text" value="3-8号车厢"></td><td><select class="form-control"><option>是</option><option selected>否</option></select></td><td><select class="form-control"><option selected>支持</option><option>需确认</option><option>不支持</option></select></td><td><input class="form-control" type="text" value="空调/充电/储物"></td><td><button class="table-link danger" type="button" data-remove-row>删除</button></td></tr>',
        '<tr><td><input class="form-control" type="text" value="软卧"></td><td><input class="form-control" type="text" value="包厢"></td><td><input class="form-control" type="text" value="9-10号车厢"></td><td><select class="form-control"><option selected>是</option><option>否</option></select></td><td><select class="form-control"><option>支持</option><option selected>需确认</option><option>不支持</option></select></td><td><input class="form-control" type="text" value="独立门锁/软卧床品"></td><td><button class="table-link danger" type="button" data-remove-row>删除</button></td></tr>',
        '</tbody></table></div>'
      ].join(''),
      costHtml: [
        '<div class="route-section-titlebar"><h2 class="route-section-title">费用说明</h2></div>',
        '<div class="route-field-grid">',
        '<div class="form-group"><label class="form-label" for="childPolicy">儿童价标准 <span class="req">*</span></label><input id="childPolicy" class="form-control" type="text" value="儿童占位按所选席别/铺位计价，儿童不占位使用独立儿童不占位价且不扣铺位库存"></div>',
        '<div class="form-group"><label class="form-label" for="serviceStaff">随车服务人员 <span class="req">*</span></label><input id="serviceStaff" class="form-control" type="text" value="随车领队、管家、目的地地接导游"></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="includeFee">通用费用包含 <span class="req">*</span></label><textarea id="includeFee" class="form-control" rows="4">专列铺位、行程内地接交通、景区首道门票、导游服务、随车服务、行程所列餐食。</textarea></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="excludeFee">通用费用不含 <span class="req">*</span></label><textarea id="excludeFee" class="form-control" rows="4">出发地至出发站交通、终到站返程交通、个人消费、单人占包厢附加费、自费项目。</textarea></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="refundRule">退改规则 <span class="req">*</span></label><textarea id="refundRule" class="form-control" rows="3">名单提交前按规则扣除已发生费用；名单提交后如铁路资源已确认，以实际铁路及地接损失核算。</textarea></div>',
        '</div>'
      ].join(''),
      publishTiles: [['基础信息', '站点与运营方已维护'], ['产品线路', '2条线路，3类铺位'], ['费用说明', '包含/不含/退改已维护'], ['后续动作', '审核通过后按线路铺位开排班期']],
      modalTitle: '已提交专列产品审核',
      modalFocus: '车厢结构与运营资源',
      navigateText: '开排班期',
      scheduleHref: '../tour/team-create.html',
      modalNext: '通过后可开排班期'
    },
    free: {
      scheduleType: 'free',
      tagText: '自由行',
      tagClass: 'tag tag-green',
      title: '巴黎自由行 5-7日',
      desc: '巴黎目的地自由行，组合机票、酒店、接送机与当地玩乐。',
      subtitle: '机票+酒店+接送机可选组合，按出行日期销售',
      supplier: ['欧洲地接ABC', '国际航空CA', '巴黎酒店直采'],
      ownerOrg: ['自由行线路中心', '欧洲线路中心', '渠道运营组'],
      routeType: '自由行',
      travelType: '出境游',
      chips: [['目的地', '法国巴黎'], ['套餐组合', '3类'], ['服务项目', '酒店/航班/接送']],
      heroTags: ['机酒组合', '出行日期', '接送机'],
      readiness: [['线路数', '3条'], ['参考起价', '¥4,800/人'], ['数据完整度', '100%']],
      plans: [
        { name: '机票+酒店套餐', meta: '5-7日 · 航班协议 · 四星酒店' },
        { name: '纯酒店套餐', meta: '3-5晚 · 多房型 · 可加接送机' }
      ],
      planTitle: '产品线路',
      planSummary: '当前线路关联机票、酒店、接送机套餐',
      extraHtml: [
        '<div class="route-section-titlebar"><h2 class="route-section-title">目的地与资源组合</h2></div>',
        '<div class="route-field-grid three">',
        '<div class="form-group"><label class="form-label" for="departCity">出发城市 <span class="req">*</span></label><select id="departCity" class="form-control"><option selected>全国</option><option>北京</option><option>上海</option><option>广州</option><option>成都</option></select></div>',
        '<div class="form-group"><label class="form-label" for="destinationCountry">目的地国家/地区 <span class="req">*</span></label><select id="destinationCountry" class="form-control"><option selected>欧洲 / 法国</option><option>东南亚 / 泰国</option><option>东南亚 / 新加坡</option><option>国内 / 海南</option></select></div>',
        '<div class="form-group"><label class="form-label" for="destinationCity">目的地城市 <span class="req">*</span></label><select id="destinationCity" class="form-control"><option selected>巴黎</option><option>曼谷 / 清迈</option><option>新加坡</option><option>三亚</option></select></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="resourcePool">资源组合</label><select id="resourcePool" class="form-control" data-resource-ref><option selected>国际航空CA协议 + 巴黎四星酒店池 + 接送机服务 + 卢浮宫门票</option><option>巴黎酒店直采 + 接送机服务</option><option>国际航空CA协议 + 巴黎酒店直采</option><option>直接填写</option></select></div>',
        '</div>'
      ].join(''),
      planStructureHtml: [
        '<div class="route-section-titlebar"><h2 class="route-section-title">线路套餐组合</h2><button class="btn btn-secondary" type="button" data-add-row="#packageMatrix">新增套餐项</button></div>',
        '<div class="table-wrap"><table id="packageMatrix" data-matrix-type="package"><thead><tr><th>套餐项</th><th>服务内容</th><th>供应商</th><th>适用规则</th><th>操作</th></tr></thead><tbody>',
        '<tr><td><input class="form-control" type="text" value="往返机票"></td><td><select class="form-control" data-resource-ref><option selected>国际航空CA巴黎航线协议</option><option>汉莎航空巴黎航线协议</option><option>按订单临采</option></select></td><td>国际航空CA</td><td><input class="form-control" type="text" value="按出发城市匹配航班"></td><td><button class="table-link danger" type="button" data-remove-row>删除</button></td></tr>',
        '<tr><td><input class="form-control" type="text" value="巴黎四星酒店"></td><td><select class="form-control" data-resource-ref><option selected>巴黎四星酒店池</option><option>巴黎索菲特大酒店</option><option>巴黎酒店直采</option></select></td><td>巴黎酒店直采</td><td><input class="form-control" type="text" value="3晚起订，可选房型"></td><td><button class="table-link danger" type="button" data-remove-row>删除</button></td></tr>',
        '</tbody></table></div>'
      ].join(''),
      costHtml: [
        '<div class="route-section-titlebar"><h2 class="route-section-title">费用说明</h2></div>',
        '<div class="route-field-grid">',
        '<div class="form-group"><label class="form-label" for="adultRef">套餐参考价区间</label><input id="adultRef" class="form-control" type="text" value="¥4,800 - ¥9,800"></div>',
        '<div class="form-group"><label class="form-label" for="dateStock">日期价格方式 <span class="req">*</span></label><select id="dateStock" class="form-control"><option selected>按出行日期维护价格与可售量</option><option>按酒店房晚维护</option></select></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="includeFee">费用包含 <span class="req">*</span></label><textarea id="includeFee" class="form-control" rows="4">套餐所选机票、酒店房晚、接送机或当地玩乐项目，以线路套餐项为准。</textarea></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="excludeFee">费用不含 <span class="req">*</span></label><textarea id="excludeFee" class="form-control" rows="4">签证、保险、城市税、个人消费和未选择的当地玩乐项目。</textarea></div>',
        '<div class="form-group route-field-full"><label class="form-label" for="refundRule">退改规则 <span class="req">*</span></label><textarea id="refundRule" class="form-control" rows="3">机票、酒店和当地玩乐按各自资源退改规则核损，套餐名额售罄后不可超卖。</textarea></div>',
        '</div>'
      ].join(''),
      publishTiles: [['基础信息', '目的地与资源已维护'], ['产品线路', '3类套餐组合'], ['费用说明', '出行日期规则已维护'], ['后续动作', '审核通过后开售出行日期']],
      modalTitle: '已提交自由行产品审核',
      modalFocus: '套餐组合与出行日期',
      navigateText: '开售日期',
      scheduleHref: 'product-free-travel-list.html?tab=calendar',
      modalNext: '通过后可开售出行日期并维护价格名额'
    }
  };

  function routePresetFor(kind) {
    var normalizedKind = normalizeKind(kind);
    var preset = routePresets[normalizedKind] || routePresets.group;
    if (normalizedKind !== 'group') return preset;
    if (normalizeVariant(kind) !== 'domestic') return preset;
    return Object.assign({}, preset, {
      tagText: '参团游产品',
      title: '三亚亲子5日游',
      desc: '广州/深圳出发，覆盖三亚、亚龙湾、海棠湾等核心度假目的地。',
      subtitle: '亲子度假，含海岛酒店、接送和精选景区，适合暑期家庭客群',
      supplier: ['三亚亚特兰蒂斯酒店', '海南地接联盟', '广州客运资源中心'],
      ownerOrg: ['国内线路中心', '华南产品中心', '门店运营中心'],
      routeType: '参团游',
      travelType: '境内游',
      chips: [['供货方', '三亚亚特兰蒂斯酒店'], ['承接组织', '国内线路中心'], ['出发城市', '广州/深圳']],
      heroTags: ['亲子', '海岛', '暑期'],
      plans: [
        { name: '亲子标准款', meta: '5天4晚 · 海岛酒店 · 含接送' },
        { name: '度假升级款', meta: '5天4晚 · 高星酒店 · 含精选景区' }
      ],
      planSummary: '当前线路参考价 ¥4,800 - ¥7,800/人'
    });
  }

  function applyRoutePreset(kind) {
    currentKind = normalizeKind(kind);
    currentVariant = currentKind === 'group' ? normalizeVariant(kind) : currentKind;
    var preset = routePresetFor(kind);
    page.setAttribute('data-route-kind', currentKind);
    page.setAttribute('data-schedule-href', isSupplierRoute ? 'schedule-create.html' : (preset.scheduleHref || 'products.html'));

    var title = page.querySelector('.route-hero-title');
    var desc = page.querySelector('.route-hero-desc');
    var eyebrow = page.querySelector('.route-eyebrow');
    var typeTag = page.querySelector('.route-hero-type-tag');
    var chips = page.querySelector('.route-hero-main .route-meta-strip');
    var heroTags = page.querySelector('.route-hero-tags');
    var readiness = page.querySelector('.route-readiness-grid');
    if (title) title.textContent = preset.title;
    if (desc) desc.textContent = preset.desc;
    if (eyebrow) eyebrow.textContent = '最后编辑 2026-06-28';
    if (typeTag) {
      typeTag.className = preset.tagClass;
      typeTag.textContent = preset.tagText;
    }
    var heroChips = isSupplierRoute ? [['供应商', '欧洲联合地接社'], ['凯撒对接', '欧洲线路中心'], ['出发城市', '北京']] : preset.chips;
    if (chips) chips.innerHTML = renderKeyValueList(heroChips, 'route-chip');
    if (heroTags) heroTags.innerHTML = renderHeroTags(preset.heroTags || []);
    if (readiness) readiness.innerHTML = renderReadiness(preset.readiness);
    var navigateButton = page.querySelector('[data-route-navigate]');
    if (navigateButton) navigateButton.textContent = isSupplierRoute ? '维护团期' : (preset.navigateText || '开排团期');

    setFieldValue('lineName', preset.title);
    setFieldValue('subTitle', preset.subtitle);

    var supplier = document.getElementById('supplier');
    if (supplier) {
      var supplierOptions = isSupplierRoute ? ['欧洲联合地接社'] : preset.supplier;
      supplier.innerHTML = selectedOptionHtml(supplierOptions, supplierOptions[0]);
    }
    var ownerOrg = document.getElementById('ownerOrg');
    if (ownerOrg) {
      var ownerOptions = isSupplierRoute ? ['凯撒欧洲产品中心', '凯撒代理运营'] : preset.ownerOrg;
      ownerOrg.innerHTML = selectedOptionHtml(ownerOptions, ownerOptions[0]);
    }

    var basicExtraSection = panels[0] && panels[0].querySelector('[data-route-basic-extra]');
    if (basicExtraSection) basicExtraSection.innerHTML = preset.extraHtml;
    setFieldValue('travelType', preset.travelType || '出境游');

    var planTitle = panels[1] && panels[1].querySelector('.route-section-title');
    if (planTitle) planTitle.textContent = preset.planTitle;
    var itineraryTitle = panels[1] && panels[1].querySelector('[data-itinerary-section] .route-subsection-title');
    if (itineraryTitle) itineraryTitle.textContent = '行程安排';
    var planList = page.querySelector('.route-plan-list');
    if (planList) planList.innerHTML = renderPlanList(preset.plans);
    var activePlanLabel = page.querySelector('[data-active-plan-label]');
    var planHeadSummary = page.querySelector('.route-plan-head span');
    if (activePlanLabel) activePlanLabel.textContent = preset.plans[0].name;
    if (planHeadSummary) planHeadSummary.textContent = preset.planSummary;

    var planStructureSection = panels[1] && panels[1].querySelector('[data-plan-structure-section]');
    if (planStructureSection) {
      planStructureSection.classList.toggle('route-matrix-table', currentKind !== 'group');
      planStructureSection.innerHTML = preset.planStructureHtml;
    }

    var costSection = panels[2] && panels[2].querySelector('.route-form-section');
    if (costSection) {
      costSection.innerHTML = preset.costHtml;
      if (!costSection.querySelector('[data-route-next]')) {
        costSection.insertAdjacentHTML('beforeend', renderTabActions(true));
      }
    }

    var modalTitle = document.querySelector('.route-submit-modal .modal-title');
    var modalItems = document.querySelectorAll('.route-success-summary > div');
    if (modalTitle) modalTitle.textContent = isSupplierRoute ? '已提交凯撒处理' : preset.modalTitle;
    if (modalItems[0]) modalItems[0].innerHTML = '<span>产品类型</span><strong>' + htmlEscape(preset.tagText) + '</strong>';
    if (modalItems[1]) modalItems[1].innerHTML = isSupplierRoute ? '<span>处理方式</span><strong>凯撒代理采用确认</strong>' : '<span>审核重点</span><strong>' + htmlEscape(preset.modalFocus) + '</strong>';
    if (modalItems[2]) modalItems[2].innerHTML = '<span>产品线路</span><strong>' + htmlEscape(String(preset.plans.length)) + '条</strong>';
    if (modalItems[3]) modalItems[3].innerHTML = isSupplierRoute ? '<span>后续动作</span><strong>凯撒采用后可包装销售</strong>' : '<span>后续动作</span><strong>' + htmlEscape(preset.modalNext || '通过后可开排团期') + '</strong>';

    page.querySelectorAll('input, textarea').forEach(updateCounter);
  }

  function rowTemplate(type) {
    if (type === 'cabin') {
      return [
        '<tr>',
        '<td><input class="form-control" type="text" value="新增舱型"></td>',
        '<td><select class="form-control"><option>无窗</option><option>海景窗</option><option>阳台</option></select></td>',
        '<td><input class="form-control" type="number" value="4"></td>',
        '<td><input class="form-control" type="number" value="2"></td>',
        '<td><select class="form-control"><option selected>支持</option><option>不支持</option></select></td>',
        '<td><select class="form-control"><option selected>支持</option><option>需确认</option><option>不支持</option></select></td>',
        '<td><button class="table-link danger" type="button" data-remove-row>删除</button></td>',
        '</tr>'
      ].join('');
    }

    if (type === 'berth') {
      return [
        '<tr>',
        '<td><input class="form-control" type="text" value="软卧"></td>',
        '<td><input class="form-control" type="text" value="下铺"></td>',
        '<td><input class="form-control" type="text" value="待维护"></td>',
        '<td><select class="form-control"><option>是</option><option selected>否</option></select></td>',
        '<td><select class="form-control"><option selected>支持</option><option>需确认</option><option>不支持</option></select></td>',
        '<td><input class="form-control" type="text" value="空调/充电/储物"></td>',
        '<td><button class="table-link danger" type="button" data-remove-row>删除</button></td>',
        '</tr>'
      ].join('');
    }

    if (type === 'package') {
      return [
        '<tr>',
        '<td><input class="form-control" type="text" value="新增套餐项"></td>',
        '<td><select class="form-control" data-resource-ref><option selected>选择资源</option><option>国际航空CA巴黎航线协议</option><option>巴黎四星酒店池</option><option>接送机服务</option><option>卢浮宫门票</option></select></td>',
        '<td><input class="form-control" type="text" value="待选择供应商"></td>',
        '<td><input class="form-control" type="text" value="待维护规则"></td>',
        '<td><button class="table-link danger" type="button" data-remove-row>删除</button></td>',
        '</tr>'
      ].join('');
    }

    return [
      '<tr>',
      '<td><input class="form-control" type="text" value="新增服务项"></td>',
      '<td><select class="form-control" data-resource-ref><option selected>选择资源</option><option>卢浮宫</option><option>巴黎中餐厅Le Bonheur</option><option>巴黎索菲特大酒店</option><option>Volvo 45座大巴</option></select></td>',
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
    showToast('已生成线路草稿');
  }

  function routeScheduleContext() {
    var preset = routePresetFor(currentKind === 'group' ? currentVariant : currentKind);
    var activePlan = page.querySelector('[data-plan-switch].active strong');
    var lineName = document.getElementById('lineName');
    var travelType = document.getElementById('travelType');
    var ownerOrg = document.getElementById('ownerOrg');
    var supplier = document.getElementById('supplier');
    var flightRouteResource = document.getElementById('flightRouteResource');
    var flightUsePolicy = document.getElementById('flightUsePolicy');
    var resourceRefs = Array.from(page.querySelectorAll('[data-resource-ref]')).map(function (field) {
      return field.value;
    }).filter(Boolean);
    return {
      type: currentKind === 'group' ? currentVariant : currentKind,
      routeType: preset.routeType,
      travelType: travelType ? travelType.value : (preset.travelType || ''),
      product: lineName && lineName.value.trim() ? lineName.value.trim() : preset.title,
      route: activePlan ? activePlan.textContent.trim() : preset.plans[0].name,
      ownerOrg: ownerOrg ? ownerOrg.value : '',
      supplier: supplier ? supplier.value : '',
      flightRouteResource: flightRouteResource ? flightRouteResource.value : '',
      flightUsePolicy: flightUsePolicy ? flightUsePolicy.value : '',
      resourceRefs: resourceRefs.slice(0, 8),
      source: 'product',
      updatedAt: new Date().toISOString()
    };
  }

  function writeRouteScheduleContext() {
    try {
      window.localStorage.setItem('caesarRouteScheduleContext', JSON.stringify(routeScheduleContext()));
    } catch (error) {}
  }

  function scheduleHrefWithContext(href) {
    var context = routeScheduleContext();
    if (href && href.indexOf('product-free-travel-list.html') > -1) {
      try {
        window.localStorage.setItem('caesarFreeTravelContext', JSON.stringify(context));
      } catch (error) {}
      var freeParts = href.split('?');
      var freeQuery = new URLSearchParams(freeParts[1] || '');
      freeQuery.set('product', context.product);
      freeQuery.set('route', context.route);
      return freeParts[0] + '?' + freeQuery.toString();
    }
    if (!href || (href.indexOf('team-create.html') < 0 && href.indexOf('schedule-create.html') < 0)) return href;
    var parts = href.split('?');
    var query = new URLSearchParams(parts[1] || '');
    query.set('source', 'product');
    query.set('type', context.type);
    query.set('product', context.product);
    query.set('route', context.route);
    return parts[0] + '?' + query.toString();
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

  var initialParams = new URLSearchParams(window.location.search);
  applyRoutePreset(initialParams.get('type') || currentKind);
  if (initialParams.get('travelType')) setFieldValue('travelType', initialParams.get('travelType'));

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
      writeRouteScheduleContext();
      navigateTo(scheduleHrefWithContext(scheduleHref));
    }
  });

  page.addEventListener('change', function (event) {
    if (event.target && event.target.id === 'lineType') {
      applyRoutePreset(routeTypeToKind(event.target.value));
      setDirty();
      return;
    }
    if (event.target && event.target.matches('[data-resource-mode-control]')) {
      setDirty();
      return;
    }
    if (event.target && applyResourceSelection(event.target)) {
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
