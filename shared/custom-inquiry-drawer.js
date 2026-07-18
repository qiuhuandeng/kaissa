(function () {
  var drawerId = 'customInquiryDrawer';
  var currentContext = {};

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function toast(message, type) {
    if (window.caesarUI && typeof window.caesarUI.toast === 'function') {
      window.caesarUI.toast(message, { type: type || 'success' });
    }
  }

  function drawer() {
    return document.getElementById(drawerId);
  }

  function input(id) {
    return document.getElementById(id);
  }

  function value(id) {
    var field = input(id);
    return field ? String(field.value || '').trim() : '';
  }

  function normalizeTitle(next) {
    return String(next || '').replace(/\s+/g, ' ').trim();
  }

  function actionTitleFromTrigger(trigger, fallback) {
    if (!trigger) return fallback;
    return normalizeTitle(
      trigger.getAttribute('data-drawer-title') ||
      trigger.getAttribute('data-modal-title') ||
      trigger.textContent ||
      trigger.getAttribute('aria-label') ||
      fallback
    );
  }

  function setValue(id, next) {
    var field = input(id);
    if (field && next !== undefined && next !== null) field.value = next;
  }

  function setSelectValue(id, next) {
    if (next === undefined || next === null) return;
    var field = input(id);
    if (!field) return;
    var exists = Array.prototype.slice.call(field.options).some(function (option) { return option.value === next; });
    if (!exists) {
      var option = document.createElement('option');
      option.value = next;
      option.textContent = next;
      field.appendChild(option);
    }
    field.value = next;
  }

  function openLayer(layer) {
    if (window.caesarUI && typeof window.caesarUI.openLayer === 'function') {
      window.caesarUI.openLayer(layer);
    } else {
      layer.hidden = false;
      layer.classList.add('show');
      layer.setAttribute('aria-hidden', 'false');
    }
  }

  function closeLayer(layer) {
    if (window.caesarUI && typeof window.caesarUI.closeLayer === 'function') {
      window.caesarUI.closeLayer(layer);
    } else {
      layer.hidden = true;
      layer.classList.remove('show');
      layer.setAttribute('aria-hidden', 'true');
    }
  }

  function ensureDrawer() {
    var existing = drawer();
    if (existing) return existing;
    document.body.insertAdjacentHTML('beforeend',
      '<div id="' + drawerId + '" class="modal-overlay drawer-overlay" aria-hidden="true">' +
        '<div class="modal drawer-modal drawer-action drawer-lg custom-inquiry-drawer" role="dialog" aria-modal="true" aria-labelledby="customInquiryDrawerTitle">' +
          '<div class="modal-header">' +
            '<div id="customInquiryDrawerTitle" class="modal-title">发起单团询价</div>' +
            '<button class="modal-close" type="button" data-close-custom-inquiry aria-label="关闭">×</button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<section class="drawer-section">' +
              '<div class="drawer-section-head"><h3 class="drawer-section-title">客户与项目</h3></div>' +
              '<div class="form-grid">' +
                '<div class="form-group"><label class="form-label" for="customInquiryCustomerType">客户类型</label><select id="customInquiryCustomerType" class="form-control"><option>企业客户</option><option>个人客户</option></select></div>' +
                '<div class="form-group form-group-full"><label class="form-label" for="customInquiryCustomer">客户名称 <span class="req">*</span></label><input id="customInquiryCustomer" class="form-control" type="text" placeholder="企业名称或个人客户姓名"></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryContact">联系人 <span class="req">*</span></label><input id="customInquiryContact" class="form-control" type="text" placeholder="请输入联系人姓名"></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryContactTitle">职务/关系</label><input id="customInquiryContactTitle" class="form-control" type="text" placeholder="如：行政负责人、本人、家属"></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryPhone">联系电话 <span class="req">*</span></label><input id="customInquiryPhone" class="form-control" type="tel" placeholder="请输入联系电话"></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryType">业务类型 <span class="req">*</span></label><select id="customInquiryType" class="form-control"><option>MICE</option><option>定制团</option><option>企业团建</option><option>奖励旅游</option><option>私人包团</option><option>政企考察</option><option>研学定制</option></select></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryTopic">需求主题 <span class="req">*</span></label><input id="customInquiryTopic" class="form-control" type="text" placeholder="如：公司团建、奖励旅游、亲子包团"></div>' +
                '<div class="form-group form-group-full"><label class="form-label" for="customInquiryProjectName">询价项目名称</label><input id="customInquiryProjectName" class="form-control" type="text" placeholder="如：某科技公司欧洲年会项目"></div>' +
              '</div>' +
            '</section>' +
            '<section class="drawer-section">' +
              '<div class="drawer-section-head"><h3 class="drawer-section-title">出行需求</h3></div>' +
              '<div class="form-grid">' +
                '<div class="form-group"><label class="form-label" for="customInquiryDeparture">出发地</label><input id="customInquiryDeparture" class="form-control" type="text" placeholder="如：北京、上海、全国出发"></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryDestination">目的地</label><input id="customInquiryDestination" class="form-control" type="text" placeholder="如：法国/德国/意大利"></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryDateCertainty">日期明确度 <span class="req">*</span></label><select id="customInquiryDateCertainty" class="form-control"><option>日期确定</option><option>已确定日期范围</option><option>只确定月份</option><option>日期待定</option></select></div>' +
                '<div class="form-group"><label class="form-label">出行日期</label><div class="date-range custom-date-range"><input id="customInquiryTravelStart" class="form-control" type="date" aria-label="出行开始日期"><span>至</span><input id="customInquiryTravelEnd" class="form-control" type="date" aria-label="出行结束日期"></div></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryTravelMonth">出行月份</label><input id="customInquiryTravelMonth" class="form-control" type="month"></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryDays">出行天数</label><input id="customInquiryDays" class="form-control" type="number" min="1" placeholder="如：6"></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryPeople">预计人数 <span class="req">*</span></label><input id="customInquiryPeople" class="form-control" type="number" min="1" placeholder="请输入人数"></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryPeopleStructure">人数结构</label><input id="customInquiryPeopleStructure" class="form-control" type="text" placeholder="成人/儿童/VIP/老师/学生"></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryRoomRequest">房间需求</label><input id="customInquiryRoomRequest" class="form-control" type="text" placeholder="标间、大床、单房差等"></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryBudgetType">预算口径</label><select id="customInquiryBudgetType" class="form-control"><option>总预算</option><option>人均预算</option><option>预算暂未明确</option></select></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryBudget">预算金额/范围</label><input id="customInquiryBudget" class="form-control" type="text" placeholder="如：50-100万、3000元/人"></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryBudgetTraffic">大交通口径</label><select id="customInquiryBudgetTraffic" class="form-control"><option>待确认</option><option>包含大交通</option><option>不含大交通</option></select></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryBudgetMeeting">会议活动口径</label><select id="customInquiryBudgetMeeting" class="form-control"><option>待确认</option><option>包含会议活动</option><option>不含会议活动</option></select></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryBudgetFlexibility">预算弹性</label><select id="customInquiryBudgetFlexibility" class="form-control"><option>待确认</option><option>必须控制</option><option>可上浮</option></select></div>' +
              '</div>' +
            '</section>' +
            '<section class="drawer-section">' +
              '<div class="drawer-section-head"><h3 class="drawer-section-title">服务与报价要求</h3></div>' +
              '<div class="form-grid">' +
                '<div class="form-group"><label class="form-label" for="customInquiryReferenceMode">引用方式</label><select id="customInquiryReferenceMode" class="form-control"><option>未引用产品</option><option>引用现有产品</option></select></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryProductName">引用产品</label><input id="customInquiryProductName" class="form-control" type="text" placeholder="产品名称"></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryRoute">引用线路/方案</label><input id="customInquiryRoute" class="form-control" type="text" placeholder="引用产品线路或方案"></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryReferenceKeep">沿用内容</label><input id="customInquiryReferenceKeep" class="form-control" type="text" placeholder="如：行程、酒店、餐、门票"></div>' +
                '<div class="form-group form-group-full"><label class="form-label" for="customInquiryReferenceAdjust">调整内容</label><textarea id="customInquiryReferenceAdjust" class="form-control" rows="2" placeholder="日期、人数、酒店、用车、餐标、活动、会议等调整"></textarea></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryHotelStandard">酒店标准</label><select id="customInquiryHotelStandard" class="form-control"><option>待报价</option><option>经济</option><option>舒适</option><option>高端</option><option>五星</option><option>指定酒店</option></select></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryVehicleStandard">用车标准</label><select id="customInquiryVehicleStandard" class="form-control"><option>待报价</option><option>旅游大巴</option><option>商务车</option><option>专车</option><option>混合用车</option></select></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryMealStandard">餐饮标准</label><select id="customInquiryMealStandard" class="form-control"><option>待报价</option><option>自理</option><option>团队餐</option><option>特色餐</option><option>按餐标报价</option></select></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryGuideStandard">导游/领队</label><select id="customInquiryGuideStandard" class="form-control"><option>待报价</option><option>中文导游</option><option>外语导游</option><option>领队</option><option>导游+领队</option></select></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryMeetingRequest">会议/活动</label><select id="customInquiryMeetingRequest" class="form-control"><option>不涉及</option><option>会场</option><option>茶歇</option><option>搭建</option><option>团建活动</option><option>待确认</option></select></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryTicketRequest">门票/体验</label><select id="customInquiryTicketRequest" class="form-control"><option>待报价</option><option>包含</option><option>不包含</option><option>部分包含</option></select></div>' +
                '<div class="form-group form-group-full"><label class="form-label" for="customInquirySpecialRequest">特殊要求</label><textarea id="customInquirySpecialRequest" class="form-control" rows="2" placeholder="老人、儿童、领导、外宾、行动不便、餐食禁忌等"></textarea></div>' +
                '<div class="form-group form-group-full"><label class="form-label" for="customInquiryRequirement">补充需求 <span class="req">*</span></label><textarea id="customInquiryRequirement" class="form-control" rows="3" placeholder="客户原话、必须包含项目、不接受项目、关注事项"></textarea></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryQuoteMode">报价方式</label><select id="customInquiryQuoteMode" class="form-control"><option>总价</option><option>人均</option><option>分项报价</option></select></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryQuoteCurrency">报价币种</label><select id="customInquiryQuoteCurrency" class="form-control"><option>人民币</option><option>美元</option><option>欧元</option><option>当地币种</option></select></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryCustomerDoc">对客材料</label><select id="customInquiryCustomerDoc" class="form-control"><option>需要对客行程单</option><option>只需内部报价</option><option>需要中英文材料</option></select></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryHideCost">对客报价</label><select id="customInquiryHideCost" class="form-control"><option>隐藏内部成本</option><option>可展示分项价格</option></select></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryQuoteValidUntil">报价有效期</label><input id="customInquiryQuoteValidUntil" class="form-control" type="date"></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryPaymentExpect">付款节点偏好</label><select id="customInquiryPaymentExpect" class="form-control"><option>客户暂未明确</option><option>签约后收首款，出行前收尾款</option><option>分阶段收款</option><option>一次性收款</option><option>需按客户合同条款确认</option></select></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryAttachment">需求附件</label><input id="customInquiryAttachment" class="form-control" type="file" multiple></div>' +
              '</div>' +
            '</section>' +
            '<section class="drawer-section">' +
              '<div class="drawer-section-head"><h3 class="drawer-section-title">内部交办</h3></div>' +
              '<div class="form-grid">' +
                '<div class="form-group"><label class="form-label" for="customInquiryOwner">销售负责人</label><select id="customInquiryOwner" class="form-control"><option>陈刚</option><option>王芳</option><option>周伟</option><option>刘总监</option></select></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryCollaborator">协同销售</label><input id="customInquiryCollaborator" class="form-control" type="text" placeholder="姓名"></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryPlannerGroup">计调组 <span class="req">*</span></label><select id="customInquiryPlannerGroup" class="form-control"><option value="">请选择</option><option>会奖计调组</option><option>欧洲计调组</option><option>亚洲计调组</option><option>国内定制组</option></select></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryPlanner">指定计调负责人</label><select id="customInquiryPlanner" class="form-control"><option>待计调组分派</option><option>李梅</option><option>赵磊</option><option>孙倩</option></select></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryQuoteDue">期望报价时间 <span class="req">*</span></label><input id="customInquiryQuoteDue" class="form-control" type="datetime-local"></div>' +
                '<div class="form-group"><label class="form-label" for="customInquiryUrgency">紧急度</label><select id="customInquiryUrgency" class="form-control"><option>普通</option><option>加急</option><option>客户当天要价</option></select></div>' +
                '<div class="form-group form-group-full"><label class="form-label" for="customInquiryInternalNote">内部备注</label><textarea id="customInquiryInternalNote" class="form-control" rows="2" placeholder="报价口径、客户敏感点、内部注意事项"></textarea></div>' +
              '</div>' +
            '</section>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<div class="drawer-footer-actions">' +
              '<button class="btn btn-secondary" type="button" data-close-custom-inquiry>取消</button>' +
              '<button class="btn btn-secondary" type="button" data-save-custom-inquiry>保存草稿</button>' +
              '<button class="btn btn-primary" type="button" data-submit-custom-inquiry>提交询价</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    existing = drawer();
    existing.querySelectorAll('[data-close-custom-inquiry]').forEach(function (button) {
      button.addEventListener('click', function () { closeLayer(existing); });
    });
    existing.addEventListener('click', function (event) {
      if (event.target === existing) closeLayer(existing);
    });
    existing.querySelector('[data-save-custom-inquiry]').addEventListener('click', saveDraft);
    existing.querySelector('[data-submit-custom-inquiry]').addEventListener('click', submitInquiry);
    return existing;
  }

  function sourceNo(context) {
    return context.sourceNo || context.intentNo || context.orderNo || context.productNo || context.customer || '-';
  }

  function clearFields() {
    [
      'customInquiryCustomer', 'customInquiryContact', 'customInquiryContactTitle', 'customInquiryPhone',
      'customInquiryTopic', 'customInquiryProjectName', 'customInquiryDeparture', 'customInquiryDestination',
      'customInquiryTravelStart', 'customInquiryTravelEnd', 'customInquiryTravelMonth', 'customInquiryDays',
      'customInquiryPeople', 'customInquiryPeopleStructure', 'customInquiryRoomRequest', 'customInquiryBudget',
      'customInquiryProductName', 'customInquiryRoute', 'customInquiryReferenceKeep', 'customInquiryReferenceAdjust',
      'customInquirySpecialRequest', 'customInquiryRequirement', 'customInquiryQuoteValidUntil',
      'customInquiryCollaborator', 'customInquiryQuoteDue', 'customInquiryInternalNote'
    ].forEach(function (id) { setValue(id, ''); });
    setSelectValue('customInquiryCustomerType', '企业客户');
    setSelectValue('customInquiryType', 'MICE');
    setSelectValue('customInquiryDateCertainty', '日期待定');
    setSelectValue('customInquiryBudgetType', '总预算');
    setSelectValue('customInquiryBudgetTraffic', '待确认');
    setSelectValue('customInquiryBudgetMeeting', '待确认');
    setSelectValue('customInquiryBudgetFlexibility', '待确认');
    setSelectValue('customInquiryReferenceMode', '未引用产品');
    setSelectValue('customInquiryHotelStandard', '待报价');
    setSelectValue('customInquiryVehicleStandard', '待报价');
    setSelectValue('customInquiryMealStandard', '待报价');
    setSelectValue('customInquiryGuideStandard', '待报价');
    setSelectValue('customInquiryMeetingRequest', '不涉及');
    setSelectValue('customInquiryTicketRequest', '待报价');
    setSelectValue('customInquiryQuoteMode', '总价');
    setSelectValue('customInquiryQuoteCurrency', '人民币');
    setSelectValue('customInquiryCustomerDoc', '需要对客行程单');
    setSelectValue('customInquiryHideCost', '隐藏内部成本');
    setSelectValue('customInquiryPaymentExpect', '客户暂未明确');
    setSelectValue('customInquiryOwner', '陈刚');
    setSelectValue('customInquiryPlannerGroup', '');
    setSelectValue('customInquiryPlanner', '待计调组分派');
    setSelectValue('customInquiryUrgency', '普通');
    var attachment = input('customInquiryAttachment');
    if (attachment) attachment.value = '';
  }

  function applyContext(context) {
    clearFields();
    var source = context.source || 'customInquiry';
    setSelectValue('customInquiryCustomerType', context.customerType || (source === 'intentInquiry' && context.type === '私人包团' ? '个人客户' : '企业客户'));
    setValue('customInquiryCustomer', context.customer || '');
    setValue('customInquiryContact', context.contact || '');
    setValue('customInquiryContactTitle', context.contactTitle || '');
    setValue('customInquiryPhone', context.phone || '');
    setSelectValue('customInquiryType', context.type || 'MICE');
    setValue('customInquiryTopic', context.topic || context.requirementTopic || context.projectName || context.type || '');
    setValue('customInquiryProjectName', context.projectName || (context.customer ? context.customer + '询价' : ''));
    setValue('customInquiryDeparture', context.departure || context.departCity || '');
    setValue('customInquiryDestination', context.destination || '');
    setSelectValue('customInquiryDateCertainty', context.dateCertainty || (context.travelMonth ? '只确定月份' : (context.travelStart || context.travelEnd ? '已确定日期范围' : '日期待定')));
    setValue('customInquiryTravelStart', context.travelStart || '');
    setValue('customInquiryTravelEnd', context.travelEnd || '');
    setValue('customInquiryTravelMonth', context.travelMonth || '');
    setValue('customInquiryDays', context.days || context.travelDays || '');
    setValue('customInquiryPeople', context.people || '');
    setValue('customInquiryPeopleStructure', context.peopleStructure || '');
    setValue('customInquiryRoomRequest', context.roomRequest || '');
    setSelectValue('customInquiryBudgetType', context.budgetType || '总预算');
    setValue('customInquiryBudget', context.budget || '');
    setSelectValue('customInquiryBudgetTraffic', context.budgetTraffic || '待确认');
    setSelectValue('customInquiryBudgetMeeting', context.budgetMeeting || '待确认');
    setSelectValue('customInquiryBudgetFlexibility', context.budgetFlexibility || '待确认');
    setSelectValue('customInquiryReferenceMode', (context.productName || context.product) ? '引用现有产品' : '未引用产品');
    setValue('customInquiryProductName', context.productName || context.product || '');
    setValue('customInquiryRoute', context.route || '');
    setValue('customInquiryReferenceKeep', context.referenceKeep || '');
    setValue('customInquiryReferenceAdjust', context.referenceAdjust || context.difference || context.independentNote || '');
    setSelectValue('customInquiryHotelStandard', context.hotelStandard || '待报价');
    setSelectValue('customInquiryVehicleStandard', context.vehicleStandard || '待报价');
    setSelectValue('customInquiryMealStandard', context.mealStandard || '待报价');
    setSelectValue('customInquiryGuideStandard', context.guideStandard || '待报价');
    setSelectValue('customInquiryMeetingRequest', context.meetingRequest || '不涉及');
    setSelectValue('customInquiryTicketRequest', context.ticketRequest || '待报价');
    setValue('customInquirySpecialRequest', context.specialRequest || '');
    setValue('customInquiryRequirement', context.requirement || '');
    setSelectValue('customInquiryQuoteMode', context.quoteMode || '总价');
    setSelectValue('customInquiryQuoteCurrency', context.quoteCurrency || '人民币');
    setSelectValue('customInquiryCustomerDoc', context.customerDoc || '需要对客行程单');
    setSelectValue('customInquiryHideCost', context.hideCost || '隐藏内部成本');
    setValue('customInquiryQuoteValidUntil', context.quoteValidUntil || '');
    setSelectValue('customInquiryPaymentExpect', context.paymentExpect || '客户暂未明确');
    setSelectValue('customInquiryOwner', context.owner || '陈刚');
    setValue('customInquiryCollaborator', context.collaborator || '');
    setSelectValue('customInquiryPlannerGroup', context.plannerGroup || '');
    setSelectValue('customInquiryPlanner', context.planner || '待计调组分派');
    setValue('customInquiryQuoteDue', context.quoteDue || '');
    setSelectValue('customInquiryUrgency', context.urgency || '普通');
    setValue('customInquiryInternalNote', context.internalNote || '');
  }

  function required(id, label) {
    if (value(id)) return true;
    toast('请填写' + label + '。', 'warning');
    var field = input(id);
    if (field) field.focus();
    return false;
  }

  function payload() {
    return {
      source: currentContext.source || 'customInquiry',
      sourceNo: sourceNo(currentContext),
      intentNo: currentContext.intentNo || '',
      customerType: value('customInquiryCustomerType'),
      projectName: value('customInquiryProjectName'),
      customer: value('customInquiryCustomer'),
      contact: value('customInquiryContact'),
      contactTitle: value('customInquiryContactTitle'),
      phone: value('customInquiryPhone'),
      type: value('customInquiryType'),
      topic: value('customInquiryTopic'),
      departure: value('customInquiryDeparture'),
      destination: value('customInquiryDestination'),
      dateCertainty: value('customInquiryDateCertainty'),
      travelStart: value('customInquiryTravelStart'),
      travelEnd: value('customInquiryTravelEnd'),
      travelMonth: value('customInquiryTravelMonth'),
      days: value('customInquiryDays'),
      people: value('customInquiryPeople'),
      peopleStructure: value('customInquiryPeopleStructure'),
      roomRequest: value('customInquiryRoomRequest'),
      budgetType: value('customInquiryBudgetType'),
      budget: value('customInquiryBudget'),
      budgetTraffic: value('customInquiryBudgetTraffic'),
      budgetMeeting: value('customInquiryBudgetMeeting'),
      budgetFlexibility: value('customInquiryBudgetFlexibility'),
      referenceMode: value('customInquiryReferenceMode'),
      productName: value('customInquiryProductName'),
      route: value('customInquiryRoute'),
      referenceKeep: value('customInquiryReferenceKeep'),
      referenceAdjust: value('customInquiryReferenceAdjust'),
      hotelStandard: value('customInquiryHotelStandard'),
      vehicleStandard: value('customInquiryVehicleStandard'),
      mealStandard: value('customInquiryMealStandard'),
      guideStandard: value('customInquiryGuideStandard'),
      meetingRequest: value('customInquiryMeetingRequest'),
      ticketRequest: value('customInquiryTicketRequest'),
      specialRequest: value('customInquirySpecialRequest'),
      requirement: [value('customInquiryRequirement'), value('customInquiryReferenceAdjust'), value('customInquirySpecialRequest')].filter(Boolean).join('；'),
      quoteMode: value('customInquiryQuoteMode'),
      quoteCurrency: value('customInquiryQuoteCurrency'),
      customerDoc: value('customInquiryCustomerDoc'),
      hideCost: value('customInquiryHideCost'),
      quoteValidUntil: value('customInquiryQuoteValidUntil'),
      paymentExpect: value('customInquiryPaymentExpect'),
      owner: value('customInquiryOwner'),
      collaborator: value('customInquiryCollaborator'),
      plannerGroup: value('customInquiryPlannerGroup'),
      planner: value('customInquiryPlanner'),
      quoteDue: value('customInquiryQuoteDue'),
      urgency: value('customInquiryUrgency'),
      internalNote: value('customInquiryInternalNote')
    };
  }

  function saveDraft() {
    toast('询价草稿已保存。');
  }

  function submitInquiry() {
    var checks = [
      ['customInquiryCustomer', '客户名称'], ['customInquiryContact', '联系人'], ['customInquiryPhone', '联系电话'], ['customInquiryType', '业务类型'], ['customInquiryTopic', '需求主题'], ['customInquiryPeople', '预计人数'], ['customInquiryRequirement', '补充需求'], ['customInquiryPlannerGroup', '计调组'], ['customInquiryQuoteDue', '期望报价时间']
    ];
    for (var index = 0; index < checks.length; index += 1) {
      if (!required(checks[index][0], checks[index][1])) return;
    }
    if ((value('customInquiryDateCertainty') === '日期确定' || value('customInquiryDateCertainty') === '已确定日期范围') && (!required('customInquiryTravelStart', '出行开始日期') || !required('customInquiryTravelEnd', '出行结束日期'))) return;
    if (value('customInquiryDateCertainty') === '只确定月份' && !required('customInquiryTravelMonth', '出行月份')) return;
    if (value('customInquiryTravelStart') && value('customInquiryTravelEnd') && value('customInquiryTravelEnd') < value('customInquiryTravelStart')) {
      toast('返回日期不能早于出发日期。', 'warning');
      input('customInquiryTravelEnd').focus();
      return;
    }
    var data = payload();
    document.dispatchEvent(new CustomEvent('caesar:inquiry-submitted', { detail: data }));
    closeLayer(drawer());
    toast('询价已提交计调。');
  }

  function contextFromTrigger(trigger) {
    var raw = trigger.getAttribute('data-inquiry-context');
    if (raw) {
      try { return JSON.parse(raw); } catch (error) {}
    }
    return {
      source: trigger.getAttribute('data-inquiry-source') || 'customInquiry',
      sourceLabel: trigger.getAttribute('data-inquiry-source-label') || '',
      sourceNo: trigger.getAttribute('data-inquiry-source-no') || '',
      customerType: trigger.getAttribute('data-inquiry-customer-type') || '',
      customer: trigger.getAttribute('data-inquiry-customer') || '',
      contact: trigger.getAttribute('data-inquiry-contact') || '',
      contactTitle: trigger.getAttribute('data-inquiry-contact-title') || '',
      phone: trigger.getAttribute('data-inquiry-phone') || '',
      projectName: trigger.getAttribute('data-inquiry-project-name') || '',
      type: trigger.getAttribute('data-inquiry-type') || '',
      topic: trigger.getAttribute('data-inquiry-topic') || '',
      departure: trigger.getAttribute('data-inquiry-departure') || '',
      destination: trigger.getAttribute('data-inquiry-destination') || '',
      dateCertainty: trigger.getAttribute('data-inquiry-date-certainty') || '',
      travelStart: trigger.getAttribute('data-inquiry-travel-start') || '',
      travelEnd: trigger.getAttribute('data-inquiry-travel-end') || '',
      travelMonth: trigger.getAttribute('data-inquiry-travel-month') || '',
      days: trigger.getAttribute('data-inquiry-days') || '',
      people: trigger.getAttribute('data-inquiry-people') || '',
      peopleStructure: trigger.getAttribute('data-inquiry-people-structure') || '',
      roomRequest: trigger.getAttribute('data-inquiry-room-request') || '',
      budgetType: trigger.getAttribute('data-inquiry-budget-type') || '',
      budget: trigger.getAttribute('data-inquiry-budget') || '',
      budgetTraffic: trigger.getAttribute('data-inquiry-budget-traffic') || '',
      budgetMeeting: trigger.getAttribute('data-inquiry-budget-meeting') || '',
      budgetFlexibility: trigger.getAttribute('data-inquiry-budget-flexibility') || '',
      requirement: trigger.getAttribute('data-inquiry-requirement') || '',
      owner: trigger.getAttribute('data-inquiry-owner') || '',
      productName: trigger.getAttribute('data-inquiry-product-name') || '',
      route: trigger.getAttribute('data-inquiry-route') || '',
      referenceKeep: trigger.getAttribute('data-inquiry-reference-keep') || '',
      referenceAdjust: trigger.getAttribute('data-inquiry-reference-adjust') || '',
      hotelStandard: trigger.getAttribute('data-inquiry-hotel-standard') || '',
      vehicleStandard: trigger.getAttribute('data-inquiry-vehicle-standard') || '',
      mealStandard: trigger.getAttribute('data-inquiry-meal-standard') || '',
      guideStandard: trigger.getAttribute('data-inquiry-guide-standard') || '',
      meetingRequest: trigger.getAttribute('data-inquiry-meeting-request') || '',
      ticketRequest: trigger.getAttribute('data-inquiry-ticket-request') || '',
      specialRequest: trigger.getAttribute('data-inquiry-special-request') || '',
      quoteMode: trigger.getAttribute('data-inquiry-quote-mode') || '',
      quoteCurrency: trigger.getAttribute('data-inquiry-quote-currency') || '',
      customerDoc: trigger.getAttribute('data-inquiry-customer-doc') || '',
      hideCost: trigger.getAttribute('data-inquiry-hide-cost') || '',
      quoteValidUntil: trigger.getAttribute('data-inquiry-quote-valid-until') || '',
      paymentExpect: trigger.getAttribute('data-inquiry-payment-expect') || '',
      collaborator: trigger.getAttribute('data-inquiry-collaborator') || '',
      plannerGroup: trigger.getAttribute('data-inquiry-planner-group') || '',
      planner: trigger.getAttribute('data-inquiry-planner') || '',
      quoteDue: trigger.getAttribute('data-inquiry-quote-due') || '',
      urgency: trigger.getAttribute('data-inquiry-urgency') || '',
      internalNote: trigger.getAttribute('data-inquiry-internal-note') || ''
    };
  }

  function open(context, options) {
    currentContext = Object.assign({}, context || {});
    var layer = ensureDrawer();
    var title = normalizeTitle((options && options.title) || currentContext.actionTitle || '发起单团询价');
    input('customInquiryDrawerTitle').textContent = title;
    applyContext(currentContext);
    openLayer(layer);
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-open-custom-inquiry]');
    if (!trigger) return;
    event.preventDefault();
    open(contextFromTrigger(trigger), { title: actionTitleFromTrigger(trigger, '发起单团询价') });
  });

  window.caesarInquiryDrawer = { open: open };
})();
