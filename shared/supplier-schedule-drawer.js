(function () {
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function objectNameByType(type) {
    if (type === "邮轮" || type === "cruise" || type === "邮轮航次") return "航次";
    if (type === "专列" || type === "train" || type === "专列班期") return "班期";
    if (type === "自由行" || type === "free" || type === "自由行出行日期") return "出行日期";
    if (type === "研学" || type === "study" || type === "研学营期") return "营期";
    return "团期";
  }

  function productTypeFromKey(typeKey) {
    if (typeKey === "cruise") return "邮轮";
    if (typeKey === "train") return "专列";
    if (typeKey === "free") return "自由行";
    if (typeKey === "study") return "研学";
    return "参团游";
  }

  function normalizeProducts(products) {
    return (products || []).map(function (item, index) {
      var type = item.productType || productTypeFromKey(item.typeKey);
      return {
        code: item.code || item.productCode || "SUP-" + String(index + 1).padStart(2, "0"),
        product: item.product || item.name || "西欧精选8日散拼",
        type: type,
        typeKey: item.typeKey || "group",
        batchType: item.batchType || (type === "邮轮" ? "邮轮航次" : type === "专列" ? "专列班期" : type === "自由行" ? "自由行出行日期" : type === "研学" ? "研学营期" : "普通团期"),
        tagClass: item.tagClass || (type === "邮轮" || type === "专列" ? "tag-orange" : type === "自由行" || type === "研学" ? "tag-green" : "tag-blue"),
        route: item.route || "默认线路",
        routeOptions: item.routeOptions || item.routes || [item.route || "默认线路"],
        unit: item.unit || (type === "邮轮" ? "间" : type === "专列" ? "铺" : type === "自由行" ? "间夜" : type === "研学" ? "名" : "位"),
        capacity: Number(item.capacity || item.defaultCapacity || 20),
        price: item.price || item.defaultPrice || "¥5,750",
        destination: item.destination || "",
        days: Number(item.days || 8),
        meta: item.meta || "",
        ownerOrg: item.ownerOrg || "外采计调部"
      };
    });
  }

  function defaultProducts() {
    return normalizeProducts([
      { product: "西欧精选8日散拼", typeKey: "group", route: "西欧经典线", routeOptions: ["西欧经典线", "法国瑞士深度线", "德奥瑞连线"], destination: "法国/瑞士/意大利", days: 8, capacity: 20, price: "¥5,750", meta: "北京出发 / 8天 / 已有4个团期" },
      { product: "北欧极光12日散拼", typeKey: "group", route: "北欧极光线", routeOptions: ["北欧极光线", "挪威峡湾线"], destination: "挪威/芬兰/冰岛", days: 12, capacity: 18, price: "¥13,800", meta: "北京出发 / 12天 / 已有2个团期" },
      { product: "理想号地中海邮轮舱房包销", typeKey: "cruise", route: "地中海西线 / 阳台舱", routeOptions: ["地中海西线 / 内舱", "地中海西线 / 阳台舱", "地中海东线 / 套房"], destination: "巴塞罗那/马赛/罗马", days: 8, capacity: 30, price: "¥7,200", meta: "巴塞罗那母港 / 8天 / 已有2个航次" },
      { product: "兰卡威机票酒店套餐", typeKey: "free", route: "机票+酒店5天4晚", routeOptions: ["机票+酒店5天4晚", "酒店+接送机4晚"], destination: "兰卡威", days: 5, capacity: 6, price: "¥3,680", meta: "全国出发 / 5天 / 按日期回传房态" },
      { product: "东方丝路专列", typeKey: "train", route: "西安敦煌乌鲁木齐线 / 软卧", routeOptions: ["西安敦煌乌鲁木齐线 / 硬卧", "西安敦煌乌鲁木齐线 / 软卧", "丝路全景线 / 包厢"], destination: "西安/敦煌/乌鲁木齐", days: 9, capacity: 96, price: "¥19,800", meta: "西安出发 / 9天 / 已有3个班期" },
      { product: "敦煌历史文化研学7日", typeKey: "study", route: "敦煌艺术与历史课堂", routeOptions: ["敦煌艺术与历史课堂", "河西走廊研学线"], destination: "敦煌", days: 7, capacity: 40, price: "¥8,800", meta: "敦煌 / 7天 / 已有2个营期" }
    ]);
  }

  function inventoryMode(type) {
    if (type === "邮轮") return "按舱房售卖";
    if (type === "专列") return "按铺位售卖";
    if (type === "自由行") return "按套餐/房态售卖";
    if (type === "研学") return "按名额售卖";
    return "按人售卖";
  }

  function numericPrice(price) {
    return String(price || "0").replace(/[¥,\s]/g, "") || "0";
  }

  function formattedPrice(value) {
    return "¥" + Number(value || 0).toLocaleString("zh-CN");
  }

  function publicPriceBySettlement(price) {
    var base = Number(numericPrice(price));
    if (!base) return "0";
    return String(Math.ceil(base * 1.1 / 10) * 10);
  }

  function moneyInput(value) {
    return formattedPrice(numericPrice(value));
  }

  function priceMatrixConfig(product) {
    var settlement = moneyInput(product && product.price);
    var publicPrice = formattedPrice(publicPriceBySettlement(product && product.price));
    if (product && product.type === "邮轮") {
      return {
        title: "价格结构",
        mode: "按舱型售卖",
        heads: ["价格结构", "内舱", "海景", "阳台", "套房", "港务费"],
        rows: [
          ["供应商公开售价", publicPrice, "¥9,980", "¥11,980", "¥18,480", "¥0"],
          ["供应商结算价", settlement, "¥8,980", "¥10,900", "¥16,800", "¥0"]
        ]
      };
    }
    if (product && product.type === "专列") {
      return {
        title: "价格结构",
        mode: "按车厢/铺位售卖",
        heads: ["价格结构", "硬卧", "软卧", "单铺差", "服务费", "升铺差价"],
        rows: [
          ["供应商公开售价", "¥18,480", publicPrice, "¥0", "¥0", "¥3,000"],
          ["供应商结算价", "¥16,800", settlement, "¥0", "¥0", "¥2,800"]
        ]
      };
    }
    if (product && product.type === "自由行") {
      return {
        title: "价格结构",
        mode: "按套餐/房态售卖",
        heads: ["价格结构", "成人价", "儿童价", "单房差", "服务费", "补差"],
        rows: [
          ["供应商公开售价", publicPrice, "¥3,600", "¥0", "¥0", "¥0"],
          ["供应商结算价", settlement, "¥3,280", "¥0", "¥0", "¥0"]
        ]
      };
    }
    if (product && product.type === "研学") {
      return {
        title: "价格结构",
        mode: "按学员名额售卖",
        heads: ["价格结构", "学生价", "陪同价", "单房差", "材料/保险费", "补差"],
        rows: [
          ["供应商公开售价", publicPrice, "¥7,480", "¥0", "¥0", "¥0"],
          ["供应商结算价", settlement, "¥6,800", "¥0", "¥0", "¥0"]
        ]
      };
    }
    return {
      title: "价格结构",
      mode: "按人售卖",
      heads: ["价格结构", "成人价", "儿童价", "单房差", "服务费", "补差"],
      rows: [
        ["供应商公开售价", publicPrice, "¥5,480", "¥2,200", "¥0", "¥0"],
        ["供应商结算价", settlement, "¥4,980", "¥2,000", "¥0", "¥0"]
      ]
    };
  }

  function drawerHtml(products) {
    var cards = [];
    products.forEach(function (product, index) {
      (product.routeOptions && product.routeOptions.length ? product.routeOptions : [product.route]).forEach(function (route, routeIndex) {
        cards.push([
          '<button class="batch-product-card' + (index === 0 && routeIndex === 0 ? " active" : "") + '" type="button" data-product-index="' + index + '" data-route-name="' + escapeHtml(route) + '">',
          '  <div class="batch-product-head"><strong>' + escapeHtml(route) + '</strong><span class="tag ' + escapeHtml(product.tagClass) + '">' + escapeHtml(product.type) + '</span></div>',
          '  <div class="batch-product-meta"><span>' + escapeHtml(product.product) + '</span><span>' + escapeHtml(product.days + "天") + '</span><span>' + escapeHtml(product.destination || product.meta || objectNameByType(product.type)) + '</span></div>',
          '</button>'
        ].join(""));
      });
    });
    return [
      '<div id="batchScheduleDrawer" class="modal-overlay drawer-overlay" aria-hidden="true" hidden>',
      '  <div class="modal drawer-modal drawer-lg schedule-batch-drawer" role="dialog" aria-modal="true" aria-labelledby="batchScheduleTitle">',
      '    <div class="modal-header"><div id="batchScheduleTitle" class="modal-title">新建团期</div><button class="modal-close" type="button" aria-label="关闭弹窗" data-close-batch>×</button></div>',
      '    <div class="modal-body">',
      '      <section id="batchFormPage" class="batch-flow-page" aria-label="新建团期填写">',
      '        <section class="batch-flow-card">',
      '          <div class="batch-flow-head"><span class="batch-flow-index">1</span><div><h2 id="batchRoutePickerTitle">选择线路</h2></div></div>',
      '          <div id="batchSelectedRoutePanel" class="batch-selected-route-panel" hidden><div class="batch-selected-route-main"><span>已选线路</span><strong id="batchSelectedRouteName">-</strong><em id="batchSelectedRouteMeta">-</em></div><button id="changeBatchRouteSelection" class="table-link" type="button">更换</button></div>',
      '          <div id="batchRoutePickerPanel" class="batch-route-picker-panel">',
      '            <div class="batch-product-select-wrap"><div class="batch-product-select"><span aria-hidden="true">⌕</span><input id="batchProductSearch" type="search" autocomplete="off" placeholder="搜索线路名称" aria-label="搜索线路名称"><button id="clearBatchProductSearch" class="batch-product-clear" type="button" aria-label="清除线路搜索" hidden>×</button><div id="batchProductInlinePanel" class="batch-picker-panel" hidden><div id="batchProductList" class="batch-product-list" aria-label="线路卡片列表">' + cards.join("") + '</div><div id="batchProductEmpty" class="batch-product-empty" hidden>未找到匹配线路</div></div></div></div>',
      '            <div id="batchPlanSelectWrap" class="batch-plan-select-wrap" hidden><label id="batchRoutePlanLabel" class="form-label" for="batchRoutePlanCards">选择线路 <span class="req">*</span></label><select id="batchRoutePlan" class="batch-route-hidden" aria-hidden="true" tabindex="-1"></select><div id="batchRoutePlanCards" class="batch-plan-card-list" aria-label="产品线路"></div><div id="batchRoutePlanEmpty" class="batch-product-empty" hidden>未找到匹配线路</div></div>',
      '          </div>',
      '        </section>',
      '        <section class="batch-flow-card">',
      '          <div class="batch-flow-head"><span class="batch-flow-index">2</span><div><h2>出发日期规则</h2></div><span id="batchGeneratedCountPill" class="tag tag-green">0个日期</span></div>',
      '          <div class="batch-date-mode" role="tablist" aria-label="日期选择方式"><label><input type="radio" name="batchDateMode" value="rule" checked> 周期规则</label><label><input type="radio" name="batchDateMode" value="manual"> 手动选日期</label><label><input type="radio" name="batchDateMode" value="excel"> 导入Excel</label></div>',
      '          <div class="batch-date-layout"><div>',
      '            <div id="batchRulePanel" class="batch-date-panel"><div class="form-grid"><div class="form-group"><label class="form-label" for="batchStartDate">开始日期</label><input id="batchStartDate" class="form-control" type="date" value="2026-08-01"></div><div class="form-group"><label class="form-label" for="batchEndDate">结束日期</label><input id="batchEndDate" class="form-control" type="date" value="2026-09-30"></div><div class="form-group"><label class="form-label" for="batchRepeatCycle">发团周期</label><select id="batchRepeatCycle" class="form-control"><option value="weekly" selected>每周</option><option value="custom">自由选择</option><option value="biweekly">隔周</option><option value="monthly">每月固定日</option></select></div><div class="form-group"><label class="form-label" for="batchHolidayStrategy">节假日策略</label><select id="batchHolidayStrategy" class="form-control"><option value="normal">正常生成</option><option value="skip">跳过节假日</option><option value="only">仅生成节假日</option></select></div><div class="form-group form-group-full"><label class="form-label">发团星期</label><div class="batch-weekday-row"><label><input type="checkbox" name="batchWeekday" value="1"> 周一</label><label><input type="checkbox" name="batchWeekday" value="2"> 周二</label><label><input type="checkbox" name="batchWeekday" value="3"> 周三</label><label><input type="checkbox" name="batchWeekday" value="4"> 周四</label><label><input type="checkbox" name="batchWeekday" value="5" checked> 周五</label><label><input type="checkbox" name="batchWeekday" value="6" checked> 周六</label><label><input type="checkbox" name="batchWeekday" value="0"> 周日</label></div></div></div></div>',
      '            <div id="batchManualPanel" class="batch-date-panel" hidden><div class="form-grid"><div class="form-group"><label class="form-label" for="batchManualStartDate">日历开始</label><input id="batchManualStartDate" class="form-control" type="date" value="2026-08-01"></div><div class="form-group"><label class="form-label" for="batchManualMonths">显示月份</label><select id="batchManualMonths" class="form-control"><option value="2">2个月</option><option value="3" selected>3个月</option><option value="4">4个月</option></select></div><div class="form-group form-group-full"><label class="form-label">选择出发日期</label><div id="batchManualCalendar" class="batch-multi-calendar" aria-label="手动选择出发日期"></div></div></div></div>',
      '            <div id="batchExcelPanel" class="batch-date-panel batch-excel-panel" hidden><button id="batchExcelUpload" class="batch-excel-upload" type="button"><span class="batch-excel-upload-icon" aria-hidden="true">↥</span><strong>点击自动模拟上传 Excel 排班文件</strong><em>支持读取：出发日期、默认余量、公开售价、结算价、确认方式</em></button><div class="batch-excel-actions"><button id="batchExcelTemplate" class="btn btn-secondary" type="button">下载 Excel 模板</button><button id="batchExcelSample" class="btn btn-secondary" type="button">载入示例排期数据（3条）</button></div><div id="batchExcelStatus" class="form-hint">尚未导入排班数据。</div></div>',
      '            <div id="batchDateResultBlock" class="batch-date-result"><div class="batch-date-result-head"><strong>生成结果</strong><span>点击日期可排除或恢复</span></div><div id="batchDateCalendar" class="batch-multi-calendar" aria-label="新建团期日期结果"></div></div>',
      '          </div></div>',
      '        </section>',
      '        <section class="batch-flow-card"><div class="batch-flow-head"><span class="batch-flow-index">3</span><div><h2>名额与价格</h2></div></div><div class="form-grid schedule-quota-price-grid"><div class="form-group"><label id="batchCapacityLabel" class="form-label" for="batchCapacityLimit">供应商可接库存</label><input id="batchCapacityLimit" class="form-control" type="number" min="0" value="0"></div><div class="form-group"><label id="batchMinGroupLabel" class="form-label" for="batchMinGroupSize">最低成行人数</label><input id="batchMinGroupSize" class="form-control" type="number" min="1" value="12"></div><div class="form-group"><label class="form-label" for="batchDepartureCity">出发地</label><select id="batchDepartureCity" class="form-control"><option>北京</option><option>上海</option><option>广州</option><option>成都</option><option>全国</option><option>巴塞罗那</option></select></div><div class="form-group"><label class="form-label" for="batchMeetingPlace">集合地点</label><input id="batchMeetingPlace" class="form-control" type="text" value="以供应商确认件为准"></div><div class="form-group"><label class="form-label" for="batchConfirmMode">库存确认方式</label><select id="batchConfirmMode" class="form-control"><option selected>二次确认后开售</option><option>实时库存可下单</option><option>虚拟库存可下单</option></select></div><div class="form-group"><label class="form-label" for="batchAllowOversell">是否允许超售</label><select id="batchAllowOversell" class="form-control"><option selected>不允许超售</option><option>允许超售，需二次确认</option></select></div><div class="form-group"><label class="form-label" for="batchValidUntil">报价有效期</label><input id="batchValidUntil" class="form-control" type="date" value="2026-08-31"></div><div class="form-group"><label class="form-label" for="batchReserveHours">确认保留时效</label><select id="batchReserveHours" class="form-control"><option value="2">2小时</option><option value="4" selected>4小时</option><option value="24">24小时</option><option value="48">48小时</option></select></div></div><section id="batchTypeSpecificPanel" class="batch-type-panel" aria-label="价格结构"><div class="batch-section-subhead"><h3 id="batchTypeSpecificTitle">价格结构</h3><span id="batchInventoryModeTag" class="tag tag-blue">按人售卖</span></div><div id="batchTypeSpecificGrid" class="batch-type-grid"></div></section></section>',
      '        <section class="batch-flow-card"><div class="batch-flow-head"><span class="batch-flow-index">4</span><div><h2>提交给凯撒</h2></div><span class="tag tag-blue">待凯撒确认</span></div><div class="form-grid"><div class="form-group"><label class="form-label" for="batchPlannerSelect">凯撒对接</label><select id="batchPlannerSelect" class="form-control"><option>外采计调部</option><option>长线中心 / 欧洲部</option><option>邮轮中心</option><option>自由行中心</option></select></div><div class="form-group"><label class="form-label" for="batchSubmitContact">供应商联系人</label><input id="batchSubmitContact" class="form-control" type="text" value="张敏"></div><div class="form-group form-group-full"><label class="form-label" for="batchRemark">备注</label><textarea id="batchRemark" class="form-control" rows="3" placeholder="填写本次团期、余量、价格、确认方式的补充说明"></textarea></div></div></section>',
      '      </section>',
      '      <section id="batchPreviewPage" class="batch-preview-page" aria-label="新建团期预览确认" hidden><div class="batch-preview-title"><div><h2>预览确认</h2></div><span id="batchCreateCountText">将提交 0 个团期</span></div><section class="batch-preview-summary" aria-label="新建团期摘要"><div class="batch-preview-summary-main"><span>产品/线路</span><strong id="batchPreviewRouteText">-</strong></div><div><span>供应商可接库存</span><strong id="batchPreviewCapacityText">-</strong></div><div><span>供应商公开售价</span><strong id="batchPreviewPublicPriceText">-</strong></div><div><span>供应商结算价</span><strong id="batchPreviewSettlementPriceText">-</strong></div><div><span>确认方式</span><strong id="batchPreviewPolicyText">-</strong></div></section><section class="table-wrap batch-preview-table drawer-table-fit drawer-table-cols-6" aria-label="即将提交的团期预览"><table><thead><tr><th>出发日期</th><th>可接库存</th><th>公开售价</th><th>结算价</th><th>确认方式</th><th>操作</th></tr></thead><tbody id="batchPreviewRows"></tbody></table></section></section>',
      '    </div>',
      '    <div class="modal-footer batch-drawer-footer"><button class="btn btn-secondary" type="button" data-close-batch>取消</button><button id="batchPrevStep" class="btn btn-secondary" type="button" hidden>返回</button><button id="batchNextStep" class="btn btn-primary" type="button">确认</button></div>',
      '  </div>',
      '</div>'
    ].join("");
  }

  function initDrawer(options) {
    options = options || {};
    var products = normalizeProducts(options.products && options.products.length ? options.products : defaultProducts());
    var mount = options.mount || document.body;
    if (!document.getElementById("batchScheduleDrawer")) {
      var holder = document.createElement("div");
      holder.innerHTML = drawerHtml(products);
      mount.appendChild(holder.firstElementChild);
    }

    var drawer = document.getElementById("batchScheduleDrawer");
    var title = document.getElementById("batchScheduleTitle");
    var productSearch = document.getElementById("batchProductSearch");
    var productPanel = document.getElementById("batchProductInlinePanel");
    var productEmpty = document.getElementById("batchProductEmpty");
    var clearSearch = document.getElementById("clearBatchProductSearch");
    var planWrap = document.getElementById("batchPlanSelectWrap");
    var planCards = document.getElementById("batchRoutePlanCards");
    var planSelect = document.getElementById("batchRoutePlan");
    var selectedPanel = document.getElementById("batchSelectedRoutePanel");
    var selectedRouteName = document.getElementById("batchSelectedRouteName");
    var selectedRouteMeta = document.getElementById("batchSelectedRouteMeta");
    var nextButton = document.getElementById("batchNextStep");
    var prevButton = document.getElementById("batchPrevStep");
    var formPage = document.getElementById("batchFormPage");
    var previewPage = document.getElementById("batchPreviewPage");
    var generatedDates = [];
    var excludedDates = new Set();
    var manualDates = new Set(["2026-08-07", "2026-08-21", "2026-09-04"]);
    var previewMode = false;

    function cards() {
      return Array.from(document.querySelectorAll("#batchProductList .batch-product-card"));
    }

    function productByCard(card) {
      return products[Number(card && card.getAttribute("data-product-index") || 0)] || products[0];
    }

    function routeByCard(card) {
      return card && card.getAttribute("data-route-name") || productByCard(card).route;
    }

    function routeRecords() {
      var records = [];
      products.forEach(function (product, productIndex) {
        var routes = product.routeOptions && product.routeOptions.length ? product.routeOptions : [product.route];
        routes.forEach(function (route, routeIndex) {
          records.push({
            product: product,
            productIndex: productIndex,
            route: route,
            routeIndex: routeIndex
          });
        });
      });
      return records;
    }

    function routeCardPrefix(batchType) {
      if (batchType === "邮轮航次") return "航线";
      if (batchType === "专列班期") return "线路";
      if (batchType === "自由行出行日期") return "套餐";
      return "线路";
    }

    function activeProduct() {
      return productByCard(document.querySelector("#batchProductList .batch-product-card.active"));
    }

    function currentPlan() {
      var selected = document.querySelector("#batchRoutePlanCards .batch-plan-card.active");
      return selected ? selected.dataset.plan : (planSelect.options[planSelect.selectedIndex] ? planSelect.options[planSelect.selectedIndex].textContent : "");
    }

    function openLayer() {
      drawer.hidden = false;
      drawer.classList.remove("closing");
      drawer.setAttribute("aria-hidden", "false");
      window.requestAnimationFrame(function () { drawer.classList.add("show"); });
    }

    function closeLayer() {
      drawer.classList.remove("show");
      drawer.classList.add("closing");
      window.setTimeout(function () {
        drawer.classList.remove("closing");
        drawer.hidden = true;
        drawer.setAttribute("aria-hidden", "true");
      }, 360);
    }

    function setTitle(product, editMode, customTitle) {
      title.textContent = customTitle || (editMode ? objectNameByType(product.type) + "维护" : "新建" + objectNameByType(product.type));
      drawer.setAttribute("data-drawer-title", title.textContent);
    }

    function renderPlans(product, selectedRoute, visible) {
      var list = product.routeOptions && product.routeOptions.length ? product.routeOptions : [product.route];
      planWrap.hidden = !visible;
      planSelect.innerHTML = list.map(function (name) { return "<option>" + escapeHtml(name) + "</option>"; }).join("");
      planSelect.value = selectedRoute || list[0] || "";
      planCards.innerHTML = list.map(function (name, index) {
        var active = name === selectedRoute || (!selectedRoute && index === 0);
        var prefix = routeCardPrefix(product.batchType) + String.fromCharCode(65 + index);
        return '<button class="batch-plan-card' + (active ? " active" : "") + '" type="button" data-plan="' + escapeHtml(name) + '"><span class="batch-plan-radio"></span><span class="batch-plan-main"><strong>' + escapeHtml(prefix + "：" + name) + '</strong><em>行程时长：' + escapeHtml(product.days + "天") + '</em></span><span class="batch-plan-days">天数: ' + escapeHtml(product.days + "D") + '</span></button>';
      }).join("");
      selectedRouteName.textContent = currentPlan();
    }

    function renderRouteSearchOptions(keyword) {
      var value = String(keyword || "").trim().toLowerCase();
      var records = routeRecords();
      var matched = value ? records.filter(function (record) {
        var product = record.product;
        var text = [record.route, product.product, product.type, product.batchType, product.destination].join(" ").toLowerCase();
        return text.indexOf(value) >= 0;
      }) : [];
      planSelect.innerHTML = records.map(function (record) {
        return '<option value="' + escapeHtml(record.route) + '" data-product-code="' + escapeHtml(record.product.code) + '">' + escapeHtml(record.route) + '</option>';
      }).join("");
      planWrap.hidden = !value;
      productPanel.hidden = true;
      productEmpty.hidden = !value || matched.length > 0;
      document.getElementById("batchRoutePlanEmpty").hidden = !value || matched.length > 0;
      planCards.innerHTML = matched.map(function (record) {
        var product = record.product;
        var prefix = routeCardPrefix(product.batchType) + String.fromCharCode(65 + record.routeIndex);
        var activeProductSelected = activeProduct();
        var active = !selectedPanel.hidden && activeProductSelected === product && currentPlan() === record.route;
        return '<button class="batch-plan-card' + (active ? " active" : "") + '" type="button" data-product-index="' + record.productIndex + '" data-plan="' + escapeHtml(record.route) + '"><span class="batch-plan-radio"></span><span class="batch-plan-main"><strong>' + escapeHtml(prefix + "：" + record.route) + '</strong><em>' + escapeHtml(product.product + " / 行程时长：" + product.days + "天") + '</em></span><span class="batch-plan-days">天数: ' + escapeHtml(product.days + "D") + '</span></button>';
      }).join("");
    }

    function matrixHtml(config) {
      var columns = "minmax(132px, 1.2fr) repeat(" + Math.max(config.heads.length - 1, 1) + ", minmax(96px, 1fr))";
      var style = ' style="--batch-matrix-columns:' + escapeHtml(columns) + '"';
      var html = '<section class="batch-type-matrix" aria-label="' + escapeHtml(config.title || "价格结构") + '">';
      html += '<div class="batch-type-matrix-head"' + style + '>';
      config.heads.forEach(function (head) { html += '<span>' + escapeHtml(head) + '</span>'; });
      html += '</div>';
      config.rows.forEach(function (row) {
        html += '<div class="batch-type-matrix-row"' + style + ' data-batch-matrix-row="' + escapeHtml(row[0]) + '">';
        html += '<strong>' + escapeHtml(row[0]) + '</strong>';
        config.heads.slice(1).forEach(function (head, index) {
          html += '<input class="form-control" type="text" value="' + escapeHtml(row[index + 1] || "") + '" data-batch-matrix-field="' + escapeHtml(head) + '" aria-label="' + escapeHtml(row[0] + head) + '">';
        });
        html += '</div>';
      });
      html += '</section>';
      return html;
    }

    function renderPriceGrid(product) {
      var config = priceMatrixConfig(product);
      document.getElementById("batchTypeSpecificTitle").textContent = config.title;
      document.getElementById("batchInventoryModeTag").textContent = config.mode || inventoryMode(product.type);
      document.getElementById("batchTypeSpecificGrid").innerHTML = matrixHtml(config);
    }

    function applyProduct(product, editMode, selectedRoute, customTitle) {
      var route = selectedRoute || product.route;
      cards().forEach(function (card) { card.classList.toggle("active", productByCard(card) === product && routeByCard(card) === route); });
      productSearch.value = route;
      productSearch.readOnly = true;
      clearSearch.hidden = false;
      productSearch.closest(".batch-product-select").classList.add("has-selected-product");
      document.getElementById("batchRoutePickerPanel").hidden = true;
      productPanel.hidden = true;
      productEmpty.hidden = true;
      selectedPanel.hidden = false;
      selectedRouteMeta.textContent = product.product + " / " + product.type + " / " + product.days + "天";
      document.getElementById("batchCapacityLimit").value = product.capacity;
      document.getElementById("batchMinGroupSize").value = Math.max(Math.floor(product.capacity * 0.6), 1);
      document.getElementById("batchPlannerSelect").value = product.ownerOrg || "外采计调部";
      renderPlans(product, route, false);
      renderPriceGrid(product);
      setTitle(product, editMode, customTitle);
      renderDates();
    }

    function resetSelection(showPanel) {
      productSearch.value = "";
      productSearch.readOnly = false;
      clearSearch.hidden = true;
      productSearch.closest(".batch-product-select").classList.remove("has-selected-product");
      document.getElementById("batchRoutePickerPanel").hidden = false;
      selectedPanel.hidden = true;
      planWrap.hidden = true;
      productPanel.hidden = showPanel === false;
      filterProducts("");
      renderDates();
      if (showPanel !== false) productSearch.focus();
    }

    function filterProducts(keyword) {
      renderRouteSearchOptions(keyword);
    }

    function formatDate(date) {
      return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
    }

    function dateValue(year, month, day) {
      return year + "-" + String(month + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
    }

    function renderMonth(year, month, sets) {
      var selected = sets.selected || new Set();
      var generated = sets.generated || new Set();
      var excluded = sets.excluded || new Set();
      var first = new Date(year, month, 1);
      var last = new Date(year, month + 1, 0).getDate();
      var html = '<section class="batch-calendar-month"><h3>' + year + "年" + String(month + 1).padStart(2, "0") + '月</h3><div class="batch-calendar-grid">';
      ["日", "一", "二", "三", "四", "五", "六"].forEach(function (day) { html += "<span>" + day + "</span>"; });
      for (var i = 0; i < first.getDay(); i += 1) html += "<i></i>";
      for (var day = 1; day <= last; day += 1) {
        var value = dateValue(year, month, day);
        var className = "";
        if (selected.has(value)) className += " selected";
        if (generated.has(value)) className += " generated";
        if (excluded.has(value)) className += " excluded";
        html += '<button type="button" class="' + className + '" data-batch-date="' + value + '">' + day + "</button>";
      }
      return html + "</div></section>";
    }

    function renderCalendars(startValue, months, sets) {
      var start = new Date((startValue || "2026-08-01") + "T00:00:00");
      var html = [];
      for (var i = 0; i < months; i += 1) html.push(renderMonth(start.getFullYear(), start.getMonth() + i, sets || {}));
      return html.join("");
    }

    function calcGeneratedDates() {
      var mode = document.querySelector('input[name="batchDateMode"]:checked').value;
      if (mode === "manual") return Array.from(manualDates).sort();
      if (mode === "excel") return ["2026-08-06", "2026-08-20", "2026-09-03"];
      var cycle = document.getElementById("batchRepeatCycle").value;
      if (cycle === "custom") return Array.from(manualDates).sort();
      var start = new Date(document.getElementById("batchStartDate").value + "T00:00:00");
      var end = new Date(document.getElementById("batchEndDate").value + "T00:00:00");
      var weekdays = Array.from(document.querySelectorAll('[name="batchWeekday"]:checked')).map(function (input) { return Number(input.value); });
      var dates = [];
      for (var cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
        var weekIndex = Math.floor((cursor - start) / 604800000);
        var sameDay = cursor.getDate() === start.getDate();
        if (cycle === "monthly" && !sameDay) continue;
        if (cycle === "biweekly" && weekIndex % 2 !== 0) continue;
        if (cycle !== "monthly" && weekdays.indexOf(cursor.getDay()) === -1) continue;
        dates.push(formatDate(cursor));
      }
      return dates;
    }

    function renderDates() {
      var mode = document.querySelector('input[name="batchDateMode"]:checked').value;
      var hasProduct = !selectedPanel.hidden;
      document.getElementById("batchRulePanel").hidden = mode !== "rule";
      document.getElementById("batchManualPanel").hidden = mode !== "manual";
      document.getElementById("batchExcelPanel").hidden = mode !== "excel";
      document.getElementById("batchDateResultBlock").hidden = mode !== "rule";
      document.querySelectorAll(".batch-date-mode label").forEach(function (label) {
        label.classList.toggle("active", label.querySelector("input").checked);
      });
      generatedDates = hasProduct ? calcGeneratedDates() : [];
      var dateSet = new Set(generatedDates);
      var shown = generatedDates.filter(function (date) { return !excludedDates.has(date); });
      document.getElementById("batchGeneratedCountPill").textContent = shown.length + (hasProduct ? "个" + objectNameByType(activeProduct().type) : "个日期");
      document.getElementById("batchDateCalendar").innerHTML = renderCalendars(document.getElementById("batchStartDate").value, 3, { generated: dateSet, excluded: excludedDates });
      document.getElementById("batchManualCalendar").innerHTML = renderCalendars(document.getElementById("batchManualStartDate").value, Number(document.getElementById("batchManualMonths").value || 3), { selected: manualDates });
    }

    function firstPriceByRow(rowName) {
      var row = Array.from(document.querySelectorAll("#batchTypeSpecificGrid [data-batch-matrix-row]")).find(function (item) {
        return item.dataset.batchMatrixRow === rowName;
      });
      var input = row && row.querySelector("[data-batch-matrix-field]");
      return input && input.value.trim() || "¥0";
    }

    function firstPublicPrice() {
      return firstPriceByRow("供应商公开售价");
    }

    function firstSettlementPrice() {
      return firstPriceByRow("供应商结算价");
    }

    function quoteItems() {
      return Array.from(document.querySelectorAll("#batchTypeSpecificGrid [data-batch-matrix-row]")).map(function (row) {
        var values = { name: row.dataset.batchMatrixRow || "" };
        row.querySelectorAll("[data-batch-matrix-field]").forEach(function (input) {
          values[input.dataset.batchMatrixField] = input.value.trim();
        });
        return values;
      });
    }

    function renderPreview() {
      var product = activeProduct();
      var dates = generatedDates.filter(function (date) { return !excludedDates.has(date); });
      document.getElementById("batchCreateCountText").textContent = "将提交 " + dates.length + " 个" + objectNameByType(product.type);
      document.getElementById("batchPreviewRouteText").textContent = product.product + " / " + currentPlan();
      document.getElementById("batchPreviewCapacityText").textContent = document.getElementById("batchCapacityLimit").value + product.unit;
      document.getElementById("batchPreviewPublicPriceText").textContent = firstPublicPrice();
      document.getElementById("batchPreviewSettlementPriceText").textContent = firstSettlementPrice();
      document.getElementById("batchPreviewPolicyText").textContent = document.getElementById("batchConfirmMode").value;
      document.getElementById("batchPreviewRows").innerHTML = dates.map(function (date) {
        return '<tr data-preview-date="' + escapeHtml(date) + '"><td>' + escapeHtml(date) + '</td><td>' + escapeHtml(document.getElementById("batchCapacityLimit").value + product.unit) + '</td><td>' + escapeHtml(firstPublicPrice()) + '</td><td>' + escapeHtml(firstSettlementPrice()) + '</td><td>' + escapeHtml(document.getElementById("batchConfirmMode").value) + '</td><td><button class="table-action-primary" type="button" data-remove-preview-date="' + escapeHtml(date) + '">移除</button></td></tr>';
      }).join("") || '<tr><td colspan="6">暂无可提交日期</td></tr>';
    }

    function previewItems() {
      var product = activeProduct();
      return generatedDates.filter(function (date) { return !excludedDates.has(date); }).map(function (date, index) {
        return {
          code: (product.typeKey === "cruise" ? "CR" : product.typeKey === "train" ? "TR" : product.typeKey === "free" ? "FT" : product.typeKey === "study" ? "ST" : "GT") + date.replace(/-/g, "").slice(2) + String(index + 1).padStart(3, "0"),
          product: product.product,
          route: currentPlan(),
          typeKey: product.typeKey,
          batchType: product.batchType,
          depart: date,
          back: formatDate(new Date(new Date(date + "T00:00:00").getTime() + (product.days - 1) * 86400000)),
          deadline: formatDate(new Date(new Date(date + "T00:00:00").getTime() - 10 * 86400000)),
          stock: Number(document.getElementById("batchCapacityLimit").value || product.capacity),
          sold: 0,
          publicPrice: firstPublicPrice(),
          settlementPrice: firstSettlementPrice(),
          price: firstSettlementPrice(),
          quoteItems: quoteItems(),
          confirmMode: document.getElementById("batchConfirmMode").value,
          allowOversell: document.getElementById("batchAllowOversell").value,
          priceValidUntil: document.getElementById("batchValidUntil").value,
          status: "待凯撒确认",
          execution: "待凯撒确认",
          unit: product.unit
        };
      });
    }

    function showPreview() {
      renderDates();
      renderPreview();
      formPage.hidden = true;
      previewPage.hidden = false;
      prevButton.hidden = false;
      nextButton.textContent = "提交凯撒确认";
      previewMode = true;
    }

    function submitConfirm() {
      var items = previewItems();
      if (typeof options.onSubmitted === "function") options.onSubmitted(items, activeProduct());
      if (window.caesarUI && window.caesarUI.toast) window.caesarUI.toast(objectNameByType(activeProduct().type) + "已提交凯撒确认");
      closeLayer();
    }

    function findProduct(request) {
      request = request || {};
      return products.find(function (product) {
        if (request.route && product.routeOptions.indexOf(request.route) >= 0) return true;
        if (request.product && product.product === request.product) return true;
        return false;
      }) || products.find(function (product) { return product.typeKey === request.type || product.type === request.type; }) || products[0];
    }

    function open(request) {
      request = request || {};
      var product = findProduct(request);
      previewMode = false;
      formPage.hidden = false;
      previewPage.hidden = true;
      prevButton.hidden = true;
      nextButton.textContent = "确认";
      excludedDates.clear();
      if (request.product || request.route || request.prefill) {
        applyProduct(product, !!request.editMode, request.route, request.title);
      } else {
        setTitle(product, false, request.title || "新建" + objectNameByType(product.type));
        resetSelection(false);
      }
      openLayer();
    }

    document.addEventListener("click", function (event) {
      var card = event.target.closest("#batchProductList .batch-product-card");
      if (card) {
        applyProduct(productByCard(card), false, routeByCard(card));
        return;
      }
      var plan = event.target.closest(".batch-plan-card");
      if (plan) {
        var nextProduct = plan.dataset.productIndex ? products[Number(plan.dataset.productIndex)] : activeProduct();
        if (nextProduct) {
          applyProduct(nextProduct, false, plan.dataset.plan);
          return;
        }
        var currentProduct = activeProduct();
        document.querySelectorAll(".batch-plan-card").forEach(function (item) { item.classList.toggle("active", item === plan); });
        cards().forEach(function (item) { item.classList.toggle("active", productByCard(item) === currentProduct && routeByCard(item) === plan.dataset.plan); });
        planSelect.value = plan.dataset.plan;
        productSearch.value = plan.dataset.plan;
        selectedRouteName.textContent = plan.dataset.plan;
        return;
      }
      var remove = event.target.closest("[data-remove-preview-date]");
      if (remove) {
        excludedDates.add(remove.dataset.removePreviewDate);
        renderPreview();
        return;
      }
      var calendarDate = event.target.closest("#batchDateCalendar [data-batch-date]");
      if (calendarDate && generatedDates.indexOf(calendarDate.dataset.batchDate) >= 0) {
        if (excludedDates.has(calendarDate.dataset.batchDate)) excludedDates.delete(calendarDate.dataset.batchDate);
        else excludedDates.add(calendarDate.dataset.batchDate);
        renderDates();
        return;
      }
      var manualDate = event.target.closest("#batchManualCalendar [data-batch-date]");
      if (manualDate) {
        if (manualDates.has(manualDate.dataset.batchDate)) manualDates.delete(manualDate.dataset.batchDate);
        else manualDates.add(manualDate.dataset.batchDate);
        renderDates();
      }
    });
    document.querySelectorAll("[data-close-batch]").forEach(function (button) { button.addEventListener("click", closeLayer); });
    nextButton.addEventListener("click", function () { if (previewMode) submitConfirm(); else showPreview(); });
    prevButton.addEventListener("click", function () {
      previewMode = false;
      formPage.hidden = false;
      previewPage.hidden = true;
      prevButton.hidden = true;
      nextButton.textContent = "确认";
    });
    productSearch.addEventListener("focus", function () { if (!productSearch.readOnly) filterProducts(productSearch.value); });
    productSearch.addEventListener("input", function () {
      productPanel.hidden = false;
      clearSearch.hidden = !productSearch.value;
      filterProducts(productSearch.value);
    });
    clearSearch.addEventListener("click", function () { resetSelection(true); });
    document.getElementById("changeBatchRouteSelection").addEventListener("click", function () { resetSelection(true); });
    document.querySelectorAll('input[name="batchDateMode"], #batchStartDate, #batchEndDate, #batchRepeatCycle, #batchHolidayStrategy, #batchManualStartDate, #batchManualMonths, [name="batchWeekday"]').forEach(function (field) {
      field.addEventListener("change", renderDates);
      field.addEventListener("input", renderDates);
    });
    document.getElementById("batchExcelUpload").addEventListener("click", function () {
      document.getElementById("batchExcelStatus").textContent = "已读取 3 条示例排期。";
      renderDates();
    });
    document.getElementById("batchExcelSample").addEventListener("click", function () {
      document.querySelector('input[name="batchDateMode"][value="excel"]').checked = true;
      document.getElementById("batchExcelStatus").textContent = "已载入示例排期数据（3条）。";
      renderDates();
    });
    resetSelection(false);
    return { open: open, close: closeLayer, products: products };
  }

  window.caesarSupplierScheduleDrawer = {
    init: initDrawer
  };
})();
