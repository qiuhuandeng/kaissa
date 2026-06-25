(function () {
  const bootScript = document.currentScript;
  const menu = [
    {
      title: "工作",
      icon: "chart",
      children: [
        { title: "首页工作台", href: "dashboard.html" },
      ],
    },
    {
      title: "资源",
      icon: "plane",
      children: [
        {
          title: "基础资源",
          children: [
            { title: "景点", href: "resource/resource-masterdata.html?type=poi" },
            { title: "酒店", href: "resource/resource-masterdata.html?type=hotel" },
            { title: "餐厅", href: "resource/resource-masterdata.html?type=restaurant" },
            { title: "车型", href: "resource/resource-masterdata.html?type=vehicle" },
            { title: "邮轮", href: "resource/resource-masterdata.html?type=cruise" },
            { title: "专列", href: "resource/resource-masterdata.html?type=train" },
            { title: "供应", href: "resource/resource-masterdata.html?type=supplier" },
            { title: "别名", href: "resource/resource-masterdata.html?type=alias" },
          ],
        },
        {
          title: "航空资源",
          children: [
            { title: "航线库", href: "resource/resource-flight-routes.html" },
            { title: "锁位管理", href: "resource/resource-flight-block.html" },
          ],
        },
        {
          title: "邮轮资源",
          children: [
            { title: "船公司", href: "resource/resource-cruise-companies.html" },
            { title: "船只档案", href: "resource/resource-cruise-ships.html" },
            { title: "邮轮航线", href: "resource/resource-cruise-routes.html" },
          ],
        },
        {
          title: "专列资源",
          children: [
            { title: "运营商", href: "resource/resource-train-operators.html" },
            { title: "专列线路", href: "resource/resource-train-routes.html" },
          ],
        },
        { title: "领队资源", href: "resource/resource-tour-leaders.html" },
        { title: "供应商管理", href: "resource/suppliers.html" },
      ],
    },
    {
      title: "产品",
      icon: "map",
      children: [
        { title: "产品市场", href: "product/product-market.html" },
        {
          title: "产品管理",
          children: [
            { title: "自营产品", href: "product/products.html" },
            { title: "外采产品", href: "product/product-outsource-list.html" },
            { title: "邮轮产品", href: "product/product-cruise-routes.html" },
            { title: "专列产品", href: "product/product-train-routes.html" },
            { title: "自由行", href: "product/product-free-travel-list.html" },
            { title: "单项委托", href: "product/product-single-orders.html" },
            { title: "研学产品", href: "product/product-study-products.html" },
          ],
        },
        { title: "定价策略", href: "product/product-pricing.html" },
        { title: "渠道授权", href: "product/product-channel-auth.html" },
        { title: "竞品价格", href: "product/product-competitor-price.html" },
      ],
    },
    {
      title: "出团",
      icon: "plane",
      children: [
        { title: "单团自组", href: "tour/product-custom-list.html" },
        {
          title: "团期团控",
          children: [
            { title: "团期列表", href: "tour/schedules.html" },
            { title: "团期日历", href: "tour/schedules-calendar.html" },
          ],
        },
        {
          title: "团期成本",
          children: [
            { title: "成本确认", href: "tour/fulfillment-cost.html" },
            { title: "供应商费用", href: "tour/fulfillment-supplier-fees.html" },
            { title: "付款申请", href: "tour/fulfillment-payment-apply.html" },
          ],
        },
        {
          title: "出团执行",
          children: [
            { title: "执行总览", href: "tour/fulfillment-outbound.html" },
            { title: "名单管理", href: "tour/fulfillment-roster.html" },
            { title: "证件资料", href: "tour/fulfillment-documents.html" },
            { title: "签证进度", href: "tour/fulfillment-visa.html" },
            { title: "出团通知", href: "tour/fulfillment-notice.html" },
          ],
        },
        { title: "回团处理", href: "tour/fulfillment-return.html" },
      ],
    },
    {
      title: "销售",
      icon: "clipboard",
      children: [
        { title: "产品报价", href: "sales/sales-product-quote.html" },
        { title: "意向订单", href: "sales/orders-intent.html" },
        { title: "订单管理", href: "sales/orders.html" },
        { title: "收款认领", href: "sales/payment-claim.html" },
        { title: "合同管理", href: "sales/contracts.html" },
        { title: "售后处理", href: "sales/orders-after-sales.html" },
        { title: "门店管理", href: "sales/store/index.html" },
        { title: "销售顾问", href: "sales/consultant/index.html" },
      ],
    },
    {
      title: "渠道",
      icon: "handshake",
      children: [
        { title: "渠道来源", href: "channel/channel-config.html" },
        { title: "佣金规则", href: "channel/channel-commission.html" },
      ],
    },
    {
      title: "客户",
      icon: "users",
      children: [
        { title: "客户列表", href: "customer/customers.html" },
      ],
    },
    {
      title: "财务",
      icon: "wallet",
      children: [
        { title: "收款管理", href: "finance/receipts.html" },
        { title: "认款管理", href: "finance/finance-matching.html" },
        { title: "应收管理", href: "finance/finance-receivable.html" },
        { title: "应付管理", href: "finance/finance-payable.html" },
        { title: "付款执行", href: "finance/finance-payment.html" },
        { title: "退款执行", href: "finance/finance-refund-execute.html" },
        { title: "对账结算", href: "finance/finance-settlement.html" },
        { title: "发票管理", href: "finance/finance-invoice.html" },
        { title: "回单管理", href: "finance/finance-remittance.html" },
        { title: "汇率币种", href: "finance/finance-currency.html" },
        { title: "NC推送", href: "finance/finance-nc.html" },
        {
          title: "财务报表",
          children: [
            { title: "团期盈亏", href: "finance/finance-reports.html?report=profit" },
            { title: "收款统计", href: "finance/finance-reports.html?report=receipt" },
            { title: "付款统计", href: "finance/finance-reports.html?report=payment" },
            { title: "应收应付", href: "finance/finance-reports.html?report=ar-ap" },
            { title: "预付款", href: "finance/finance-reports.html?report=prepay" },
            { title: "资金池", href: "finance/finance-reports.html?report=fund" },
          ],
        },
      ],
    },
    {
      title: "审批",
      icon: "bell",
      children: [
        { title: "待我审批", href: "approval/approvals.html?view=todo" },
        { title: "我发起的", href: "approval/approvals.html?view=mine" },
        { title: "审批总览", href: "approval/approvals.html?view=overview" },
        { title: "审批配置", href: "approval/approvals.html?view=config" },
      ],
    },
    {
      title: "AI",
      icon: "sparkles",
      children: [
        { title: "线路拆解", href: "ai/route_parser.html", ai: true },
        { title: "AI助手", href: "ai/ai-assistant.html", ai: true },
      ],
    },
    {
      title: "系统",
      icon: "settings",
      children: [
        { title: "角色权限", href: "system/settings-roles.html" },
      ],
    },
  ];

  const icons = {
    chart: '<path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M3 19h18"/>',
    map: '<path d="M9 18 3 20V6l6-2 6 2 6-2v14l-6 2-6-2Z"/><path d="M9 4v14"/><path d="M15 6v14"/>',
    clipboard: '<path d="M9 5h6"/><path d="M9 3h6v4H9z"/><path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>',
    plane: '<path d="M3 11 21 3l-7 18-3-7-8-3Z"/><path d="m11 14 10-11"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
    wallet: '<path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/><path d="M16 12h5v4h-5a2 2 0 0 1 0-4Z"/><path d="M3 7l12-4 2 4"/>',
    handshake: '<path d="m8 12 3 3a2 2 0 0 0 3 0l1-1"/><path d="M7 17 3 13l4-4 3 3"/><path d="m17 17 4-4-4-4-3 3"/><path d="M12 8l2-2a2 2 0 0 1 3 0l1 1"/>',
    gift: '<path d="M20 12v8H4v-8"/><path d="M2 7h20v5H2z"/><path d="M12 7v13"/><path d="M12 7H8a2.5 2.5 0 1 1 2.5-2.5L12 7Z"/><path d="M12 7h4a2.5 2.5 0 1 0-2.5-2.5L12 7Z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    sparkles: '<path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"/><path d="m5 15 .8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Z"/>',
    palette: '<path d="M12 22a10 10 0 1 1 10-10 3 3 0 0 1-3 3h-2a2 2 0 0 0-2 2v1a4 4 0 0 1-4 4Z"/><circle cx="7.5" cy="10.5" r=".8"/><circle cx="12" cy="7.5" r=".8"/><circle cx="16.5" cy="10.5" r=".8"/>',
    trend: '<path d="m3 17 6-6 4 4 7-7"/><path d="M14 8h6v6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7.1 4l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.9 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
  };

  const primaryLabels = {
    工作: "工作",
    资源: "资源",
    产品: "产品",
    出团: "出团",
    销售: "销售",
    渠道: "渠道",
    客户: "客户",
    财务: "财务",
    审批: "审批",
    AI: "AI",
    系统: "系统",
  };

  function createIcon(name) {
    const icon = document.createElement("span");
    icon.className = "nav-icon";
    icon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + icons[name] + "</svg>";
    return icon;
  }

  function primaryLabel(item) {
    return primaryLabels[item.title] || item.title.slice(0, 2);
  }

  let primaryScroll = null;
  let secondaryTitle = null;
  let secondaryNav = null;
  let currentPrimaryIndex = 0;
  let primaryTooltip = null;
  const secondaryOpenStorageKey = "caesar-merchant-secondary-open";
  const secondaryOpenKeys = new Set(readSecondaryOpenKeys());

  const reportRouteKeys = new Set(["profit", "receipt", "payment", "ar-ap", "prepay", "fund"]);
  const approvalViewKeys = new Set(["todo", "mine", "overview", "config"]);
  const masterdataRouteKeys = new Set(["poi", "hotel", "restaurant", "vehicle", "cruise", "train", "supplier", "alias"]);
  const merchantBaseUrl = new URL("../merchant/", new URL(bootScript.src || "../../shared/nav-merchant.js", window.location.href));

  function routeKeyFromUrl(url) {
    const normalizedPath = url.pathname.replace(/\/+/g, "/");
    const merchantMarker = "/merchant/";
    const markerIndex = normalizedPath.lastIndexOf(merchantMarker);
    let file = markerIndex >= 0 ? normalizedPath.slice(markerIndex + merchantMarker.length) : (normalizedPath.split("/").pop() || "dashboard.html");
    file = (file || "dashboard.html").split("?")[0];
    if (file.endsWith("/")) file += "dashboard.html";
    if (file === "resource/resource-masterdata.html") {
      const type = url.searchParams.get("type") || "poi";
      return "resource/resource-masterdata.html?type=" + (masterdataRouteKeys.has(type) ? type : "poi");
    }
    if (file === "finance/finance-reports.html") {
      const report = url.searchParams.get("report") || "profit";
      return "finance/finance-reports.html?report=" + (reportRouteKeys.has(report) ? report : "profit");
    }
    if (file === "approval/approvals.html") {
      const view = url.searchParams.get("view") || "todo";
      return "approval/approvals.html?view=" + (approvalViewKeys.has(view) ? view : "todo");
    }
    return file;
  }

  function currentFile() {
    return routeKeyFromUrl(new URL(window.location.href));
  }

  function readSecondaryOpenKeys() {
    try {
      const keys = JSON.parse(localStorage.getItem(secondaryOpenStorageKey) || "[]");
      return Array.isArray(keys) ? keys : [];
    } catch (error) {
      return [];
    }
  }

  function saveSecondaryOpenKeys() {
    localStorage.setItem(secondaryOpenStorageKey, JSON.stringify(Array.from(secondaryOpenKeys)));
  }

  function fileFromUrl(url) {
    return routeKeyFromUrl(url);
  }

  function resolvedAppHref(href) {
    if (!href || href.startsWith("#")) return href || "#";
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("/")) return href;
    return new URL(href, merchantBaseUrl).href;
  }

  const pageOwners = {
    "dashboard-group.html": { href: "dashboard.html", title: "集团管理层工作台" },
    "dashboard-store.html": { href: "dashboard.html", title: "门店店长工作台" },
    "product/product-self-edit.html": { href: "product/products.html", title: "自营产品编辑" },
    "product/products-detail.html": { href: "product/products.html", title: "产品详情" },
    "tour/product-custom-detail.html": { href: "tour/product-custom-list.html", title: "单团自组详情" },
    "product/product-outsource-package.html": { href: "product/product-outsource-list.html", title: "外采产品包装" },
    "product/product-outsource-quota.html": { href: "product/product-outsource-list.html", title: "外采团期配额" },
    "approval/approval-product-review.html": { href: "approval/approvals.html?view=todo", title: "产品类待审批" },
    "product/product-study-edit.html": { href: "product/product-study-products.html", title: "研学产品编辑" },
    "tour/schedules-detail.html": { href: "tour/schedules.html", title: "团期详情" },
    "sales/orders-detail.html": { href: "sales/orders.html", title: "订单详情" },
    "sales/booking.html": { href: "sales/orders.html", title: "新建订单" },
    "sales/orders-transfer.html": { href: "sales/orders-after-sales.html", title: "转团申请" },
    "sales/orders-refund.html": { href: "sales/orders-after-sales.html", title: "退款申请" },
    "sales/store/detail.html": { href: "sales/store/index.html", title: "门店详情" },
    "sales/consultant/detail.html": { href: "sales/consultant/index.html", title: "销售顾问详情" },
    "tour/projects.html": { href: "tour/product-custom-list.html", title: "MICE项目" },
    "tour/projects-detail.html": { href: "tour/product-custom-list.html", title: "项目详情" },
    "finance/finance-settlement-detail.html": { href: "finance/finance-settlement.html", title: "团期结算详情" },
    "resource/supplier-detail.html": { href: "resource/suppliers.html", title: "供应商详情" },
    "resource/resource-leader-schedule.html": { href: "resource/resource-tour-leaders.html", title: "领队排班" },
    "customer/customers-detail.html": { href: "customer/customers.html", title: "客户详情" },
    "system/design-pages.html": { href: "system/settings-roles.html", title: "C端页面管理" },
    "system/design-editor.html": { href: "system/design-pages.html", title: "C端页面编辑" },
  };

  const organizationTree = [
    {
      id: "group-caesar",
      type: "group",
      typeLabel: "集团",
      name: "凯撒旅游集团股份有限公司",
      children: [
        {
          id: "sub-caesar-travel",
          type: "subsidiary",
          typeLabel: "子公司",
          name: "北京凯撒旅游集团有限公司",
          children: [
            {
              id: "center-outbound",
              type: "center",
              typeLabel: "中心",
              name: "出境游事业部",
              children: [
                { id: "dept-west-eu", type: "department", typeLabel: "部门", name: "西欧产品部" },
                { id: "dept-eu", type: "department", typeLabel: "部门", name: "欧洲事业部" },
                { id: "store-bj-chaoyang", type: "store", typeLabel: "门店", name: "北京朝阳门店" },
                { id: "store-sh-xuhui", type: "store", typeLabel: "门店", name: "上海徐汇门店" },
              ],
            },
            {
              id: "center-cruise",
              type: "center",
              typeLabel: "中心",
              name: "邮轮中心",
              children: [
                { id: "dept-ideal", type: "department", typeLabel: "部门", name: "理想号运营部" },
                { id: "store-gz-tianhe", type: "store", typeLabel: "门店", name: "广州天河门店" },
              ],
            },
          ],
        },
        {
          id: "sub-yibu",
          type: "subsidiary",
          typeLabel: "子公司",
          name: "凯撒亿步旅行社有限公司",
          children: [
            {
              id: "center-mice",
              type: "center",
              typeLabel: "中心",
              name: "MICE会展中心",
              children: [
                { id: "dept-mice", type: "department", typeLabel: "部门", name: "会奖项目部" },
                { id: "store-sh-mice", type: "store", typeLabel: "门店", name: "上海会展门店" },
              ],
            },
          ],
        },
      ],
    },
  ];

  const workspaceExpandedIds = new Set([
    "sub-caesar-travel",
    "center-outbound",
    "center-cruise",
    "sub-yibu",
    "center-mice",
  ]);
  let currentWorkspaceId = "center-outbound";

  function workspaceRoots() {
    return organizationTree.flatMap((node) => {
      if (node.type === "group" && node.children) return node.children;
      return [node];
    });
  }

  function findActive(items, file, ancestors) {
    const path = ancestors || [];
    for (const item of items) {
      if (item.href === file) {
        return { item, parent: path[path.length - 1] || null, ancestors: path };
      }
      if (item.children) {
        const found = findActive(item.children, file, path.concat(item));
        if (found) return found;
      }
    }
    return null;
  }

  function resolveActive(file) {
    const direct = findActive(menu, file);
    if (direct) return direct;

    const owner = pageOwners[file];
    if (!owner) return null;

    const active = findActive(menu, owner.href);
    if (!active) return null;
    return Object.assign({}, active, { currentTitle: owner.title, ownerHref: owner.href });
  }

  function activeHrefFrom(active, file) {
    return active ? active.ownerHref || active.item.href : file;
  }

  function rootIndexFromActive(active) {
    if (!active) return 0;
    const root = active.ancestors && active.ancestors.length > 0 ? active.ancestors[0] : active.item;
    const index = menu.indexOf(root);
    return index >= 0 ? index : 0;
  }

  function currentActiveState() {
    const file = currentFile();
    const active = resolveActive(file);
    return { active, activeHref: activeHrefFrom(active, file) };
  }

  function clearPrimaryPreview() {
    if (!primaryScroll) return;
    primaryScroll.querySelectorAll(".nav-primary-item.preview").forEach((item) => item.classList.remove("preview"));
  }

  function isNavCollapsed() {
    const layout = document.querySelector(".layout");
    return Boolean(layout && layout.classList.contains("nav-collapsed"));
  }

  function ensurePrimaryTooltip() {
    if (primaryTooltip) return primaryTooltip;
    primaryTooltip = document.createElement("div");
    primaryTooltip.className = "nav-primary-tooltip";
    primaryTooltip.setAttribute("role", "tooltip");
    document.body.appendChild(primaryTooltip);
    return primaryTooltip;
  }

  function showPrimaryTooltip(control) {
    if (!isNavCollapsed()) return false;
    const tooltip = ensurePrimaryTooltip();
    const rect = control.getBoundingClientRect();
    tooltip.textContent = control.dataset.title || control.title || "";
    tooltip.style.left = rect.right + 8 + "px";
    tooltip.style.top = rect.top + rect.height / 2 + "px";
    tooltip.classList.add("show");
    return true;
  }

  function hidePrimaryTooltip() {
    if (primaryTooltip) primaryTooltip.classList.remove("show");
  }

  function previewPrimary(index, control) {
    const item = menu[index];
    if (showPrimaryTooltip(control)) return;
    if (!item || !item.children) return;
    if (index === currentPrimaryIndex) {
      restorePinnedPrimary();
      return;
    }

    clearPrimaryPreview();
    control.classList.add("preview");

    const state = currentActiveState();
    renderSecondary(state.activeHref, index);
  }

  function restorePinnedPrimary() {
    clearPrimaryPreview();
    const state = currentActiveState();
    renderSecondary(state.activeHref, currentPrimaryIndex);
  }

  function createPrimaryItem(item, index, pageRootIndex) {
    const control = item.children ? document.createElement("button") : document.createElement("a");
    control.className = "nav-primary-item";
    control.dataset.title = item.title;
    control.title = item.title;

    if (item.children) {
      control.type = "button";
      control.setAttribute("aria-expanded", String(index === currentPrimaryIndex));
      control.addEventListener("mouseenter", () => {
        previewPrimary(index, control);
      });
      control.addEventListener("mouseleave", hidePrimaryTooltip);
      control.addEventListener("click", () => {
        currentPrimaryIndex = index;
        const state = currentActiveState();
        renderPrimary(state.active);
        renderSecondary(state.activeHref);

        const layout = document.querySelector(".layout");
        if (layout && layout.classList.contains("nav-collapsed")) {
          layout.classList.remove("nav-collapsed");
        }
        hidePrimaryTooltip();
      });
    } else {
      control.href = resolvedAppHref(item.href);
      control.addEventListener("mouseenter", () => {
        previewPrimary(index, control);
      });
      control.addEventListener("mouseleave", hidePrimaryTooltip);
    }

    if (index === currentPrimaryIndex) control.classList.add("active");
    if (index === pageRootIndex) {
      control.classList.add("current");
      control.setAttribute("aria-current", "page");
    }

    const text = document.createElement("span");
    text.className = item.ai ? "nav-label nav-label-ai" : "nav-label";
    text.textContent = primaryLabel(item);

    if (item.icon) control.appendChild(createIcon(item.icon));
    control.appendChild(text);
    return control;
  }

  function renderPrimary(active) {
    if (!primaryScroll) return;

    const pageRootIndex = rootIndexFromActive(active);
    primaryScroll.replaceChildren();
    menu.forEach((item, index) => {
      primaryScroll.appendChild(createPrimaryItem(item, index, pageRootIndex));
    });
  }

  function renderSecondary(activeHref, primaryIndex) {
    if (!secondaryTitle || !secondaryNav) return;

    const rootIndex = typeof primaryIndex === "number" ? primaryIndex : currentPrimaryIndex;
    const root = menu[rootIndex] || menu[0];
    const items = root.children && root.children.length > 0 ? root.children : [root];
    const hasActiveInRoot = hasActive(root, activeHref);
    let openedDefault = false;

    rememberRenderedSecondaryOpenKeys();
    secondaryTitle.textContent = root.title;
    secondaryNav.replaceChildren();
    items.forEach((item) => {
      const openByDefault = !hasActiveInRoot && !openedDefault && Boolean(item.children);
      if (openByDefault) openedDefault = true;
      secondaryNav.appendChild(item.children ? createSecondaryParent(item, activeHref, 0, openByDefault, rootIndex, [item.title]) : createSecondaryLink(item, activeHref, 0));
    });
  }

  function createSecondaryLink(item, activeFile, depth) {
    const link = document.createElement("a");
    link.className = "nav-item";
    link.dataset.title = item.title;
    link.dataset.depth = String(depth || 0);
    link.title = item.title;
    if (!item.icon || depth > 0) link.classList.add("nav-child");
    link.href = resolvedAppHref(item.href);
    if (item.href === activeFile) link.classList.add("active");

    const text = document.createElement("span");
    text.className = item.ai ? "nav-label nav-label-ai" : "nav-label";
    text.textContent = item.title;

    if (item.icon) link.appendChild(createIcon(item.icon));
    if ((depth || 0) === 0) {
      const arrowPlaceholder = document.createElement("span");
      arrowPlaceholder.className = "nav-arrow nav-arrow-placeholder";
      arrowPlaceholder.setAttribute("aria-hidden", "true");
      link.appendChild(arrowPlaceholder);
    }
    link.appendChild(text);
    return link;
  }

  function readTabs(storageKey) {
    try {
      const tabs = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(tabs) ? tabs : [];
    } catch (error) {
      return [];
    }
  }

  function saveTabs(storageKey, tabs) {
    localStorage.setItem(storageKey, JSON.stringify(tabs.slice(-10)));
  }

  function createPageTabs(active, file) {
    const storageKey = "caesar-merchant-tabs";
    const title = active ? active.currentTitle || active.item.title : file;
    const current = { title, href: file };
    const tabs = readTabs(storageKey).filter((tab) => tab.href !== file);
    tabs.push(current);
    const recentTabs = tabs.slice(-10);
    saveTabs(storageKey, recentTabs);

    const tabsBar = document.createElement("div");
    tabsBar.className = "page-tabs";

    recentTabs.forEach((tab) => {
      const item = document.createElement("a");
      item.className = "page-tab";
      if (tab.href === file) item.classList.add("active");
      item.href = resolvedAppHref(tab.href);

      const label = document.createElement("span");
      label.className = "page-tab-label";
      label.textContent = tab.title;

      const close = document.createElement("button");
      close.className = "page-tab-close";
      close.type = "button";
      close.setAttribute("aria-label", "关闭标签");
      close.textContent = "×";
      close.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const nextTabs = readTabs(storageKey).filter((itemTab) => itemTab.href !== tab.href);
        saveTabs(storageKey, nextTabs);
        if (tab.href === file && nextTabs.length > 0) {
          navigateTo(nextTabs[nextTabs.length - 1].href);
          return;
        }
        item.remove();
      });

      item.append(label, close);
      tabsBar.appendChild(item);
    });

    return tabsBar;
  }

  function replaceBreadcrumb(active) {
    const left = document.querySelector(".topbar-left");
    const oldBreadcrumb = left ? left.querySelector(".breadcrumb") : null;
    if (left && oldBreadcrumb) {
      oldBreadcrumb.replaceWith(createBreadcrumb(active));
    }
  }

  function replacePageTabs(active, file) {
    const oldTabs = document.querySelector(".page-tabs");
    if (oldTabs) oldTabs.replaceWith(createPageTabs(active, file));
  }

  function syncNavActive(file) {
    const active = resolveActive(file);
    const activeHref = activeHrefFrom(active, file);
    currentPrimaryIndex = rootIndexFromActive(active);

    renderPrimary(active);
    renderSecondary(activeHref);
    replaceBreadcrumb(active);
    replacePageTabs(active, file);
  }

  function collectPageNodes(doc) {
    const nodes = [];
    const scripts = [];

    Array.from(doc.body.childNodes).forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "SCRIPT") {
        const src = node.getAttribute("src") || "";
        if (!src.includes("nav-merchant.js")) scripts.push(node);
        return;
      }
      nodes.push(document.importNode(node, true));
    });

    return { nodes, scripts };
  }

  function runPageScripts(scripts) {
    scripts.forEach((oldScript) => {
      const script = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => script.setAttribute(attr.name, attr.value));
      script.textContent = oldScript.textContent;
      document.body.appendChild(script);
      script.remove();
    });
  }

  function hasActive(item, activeFile) {
    if (item.href === activeFile) return true;
    return item.children ? item.children.some((child) => hasActive(child, activeFile)) : false;
  }

  function secondaryOpenKey(rootIndex, path) {
    return String(rootIndex) + ":" + path.join(">");
  }

  function rememberRenderedSecondaryOpenKeys() {
    if (!secondaryNav) return;
    secondaryNav.querySelectorAll(".nav-parent").forEach((wrap) => {
      const key = wrap.dataset.openKey;
      if (!key) return;
      if (wrap.classList.contains("open")) {
        secondaryOpenKeys.add(key);
      } else {
        secondaryOpenKeys.delete(key);
      }
    });
    saveSecondaryOpenKeys();
  }

  function createSecondaryParent(item, activeFile, depth, openByDefault, rootIndex, path) {
    const wrap = document.createElement("div");
    wrap.className = "nav-parent";
    wrap.dataset.depth = String(depth || 0);
    const openKey = secondaryOpenKey(rootIndex, path || [item.title]);
    wrap.dataset.openKey = openKey;

    const head = document.createElement("div");
    head.className = "nav-item";
    head.dataset.title = item.title;
    head.dataset.depth = String(depth || 0);
    head.title = item.title;
    if (depth > 0) head.classList.add("nav-child");

    const text = document.createElement("span");
    text.className = "nav-label";
    text.textContent = item.title;

    const arrow = document.createElement("span");
    arrow.className = "nav-arrow";
    arrow.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + icons.chevron + "</svg>";

    const sub = document.createElement("div");
    sub.className = "nav-sub";

    item.children.forEach((child) => {
      const childPath = (path || [item.title]).concat(child.title);
      sub.appendChild(child.children ? createSecondaryParent(child, activeFile, (depth || 0) + 1, false, rootIndex, childPath) : createSecondaryLink(child, activeFile, (depth || 0) + 1));
    });
    if (secondaryOpenKeys.has(openKey) || openByDefault || item.children.some((child) => hasActive(child, activeFile))) {
      wrap.classList.add("open");
      secondaryOpenKeys.add(openKey);
      saveSecondaryOpenKeys();
    }

    head.addEventListener("click", () => {
      wrap.classList.toggle("open");
      if (wrap.classList.contains("open")) {
        secondaryOpenKeys.add(openKey);
      } else {
        secondaryOpenKeys.delete(openKey);
      }
      saveSecondaryOpenKeys();
    });
    if (item.icon) head.appendChild(createIcon(item.icon));
    head.append(text, arrow);
    wrap.append(head, sub);
    return wrap;
  }

  function createBreadcrumb(active) {
    const breadcrumb = document.createElement("div");
    breadcrumb.className = "breadcrumb";

    const parts = active
      ? (active.ancestors || []).map((item) => item.title).concat(active.item.title)
      : ["未归属页面"];

    if (active && active.currentTitle && active.currentTitle !== active.item.title) {
      parts.push(active.currentTitle);
    }

    parts.forEach((part, index) => {
      const node = document.createElement("span");
      node.textContent = part;
      if (index === parts.length - 1) node.className = "current";
      if (index > 0) {
        const sep = document.createElement("span");
        sep.textContent = "/";
        breadcrumb.appendChild(sep);
      }
      breadcrumb.appendChild(node);
    });

    return breadcrumb;
  }

  function createNotify(count) {
    const notify = document.createElement("div");
    notify.className = "topbar-notify";
    notify.innerHTML = '<span class="topbar-icon"><svg viewBox="0 0 24 24" aria-hidden="true">' + icons.bell + "</svg></span>";

    const badge = document.createElement("span");
    badge.className = "notify-badge";
    badge.textContent = String(count);

    notify.appendChild(badge);
    return notify;
  }

  function findOrgNode(nodes, id) {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findOrgNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  function orgNodeMatches(node, keyword) {
    if (!keyword) return true;
    const haystack = [node.typeLabel, node.name].join(" ").toLowerCase();
    if (haystack.includes(keyword)) return true;
    return node.children ? node.children.some((child) => orgNodeMatches(child, keyword)) : false;
  }

  function createOrgNode(node, depth, state) {
    if (!orgNodeMatches(node, state.keyword)) return null;

    const wrap = document.createElement("div");
    wrap.className = "org-tree-node";

    const row = document.createElement("div");
    row.className = "org-tree-row depth-" + Math.min(depth, 4);
    if (node.id === currentWorkspaceId) row.classList.add("active");

    const hasChildren = Boolean(node.children && node.children.length);
    const caret = document.createElement("button");
    caret.className = hasChildren ? "org-tree-caret" : "org-tree-caret placeholder";
    caret.type = "button";
    caret.setAttribute("aria-label", hasChildren ? "展开或收起" : "");
    if (hasChildren && (workspaceExpandedIds.has(node.id) || state.keyword)) caret.classList.add("open");
    caret.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + icons.chevron + "</svg>";
    caret.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!hasChildren) return;
      if (workspaceExpandedIds.has(node.id)) {
        workspaceExpandedIds.delete(node.id);
      } else {
        workspaceExpandedIds.add(node.id);
      }
      state.render();
    });

    const select = document.createElement("button");
    select.className = "org-tree-select";
    select.type = "button";
    select.title = node.name;
    select.addEventListener("click", () => {
      currentWorkspaceId = node.id;
      state.workspaceText.textContent = node.name;
      state.menu.classList.remove("show");
      state.trigger.setAttribute("aria-expanded", "false");
      state.render();
    });

    const tag = document.createElement("span");
    tag.className = "org-type-tag " + node.type;
    tag.textContent = node.typeLabel;

    const name = document.createElement("span");
    name.className = "org-node-name";
    name.textContent = node.name;

    select.append(tag, name);

    row.append(caret, select);
    wrap.appendChild(row);

    if (hasChildren && (workspaceExpandedIds.has(node.id) || state.keyword)) {
      const children = document.createElement("div");
      children.className = "org-tree-children";
      node.children.forEach((child) => {
        const childNode = createOrgNode(child, depth + 1, state);
        if (childNode) children.appendChild(childNode);
      });
      wrap.appendChild(children);
    }

    return wrap;
  }

  function createWorkspaceSwitcher() {
    const current = findOrgNode(organizationTree, currentWorkspaceId) || organizationTree[0];
    const wrap = document.createElement("div");
    wrap.className = "workspace-switcher";

    const trigger = document.createElement("button");
    trigger.className = "workspace-badge";
    trigger.type = "button";
    trigger.setAttribute("aria-haspopup", "true");
    trigger.setAttribute("aria-expanded", "false");

    const workspaceText = document.createElement("span");
    workspaceText.className = "workspace-current-text";
    workspaceText.textContent = current.name;
    const workspaceArrow = document.createElement("span");
    workspaceArrow.className = "topbar-chevron";
    workspaceArrow.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + icons.chevronDown + "</svg>";
    trigger.append(workspaceText, workspaceArrow);

    const menu = document.createElement("div");
    menu.className = "workspace-menu";

    const searchWrap = document.createElement("div");
    searchWrap.className = "workspace-search";
    searchWrap.innerHTML = '<span class="workspace-search-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span>';
    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "请输入门店/部门名称";
    search.setAttribute("aria-label", "搜索组织节点");
    searchWrap.appendChild(search);

    const tree = document.createElement("div");
    tree.className = "org-tree";

    const empty = document.createElement("div");
    empty.className = "org-tree-empty";
    empty.textContent = "未找到匹配节点";

    const state = {
      keyword: "",
      menu,
      trigger,
      workspaceText,
      render: null,
    };

    state.render = () => {
      state.keyword = search.value.trim().toLowerCase();
      tree.replaceChildren();
      let count = 0;
      workspaceRoots().forEach((node) => {
        const item = createOrgNode(node, 0, state);
        if (item) {
          tree.appendChild(item);
          count += 1;
        }
      });
      empty.hidden = count > 0;
    };

    search.addEventListener("input", state.render);
    menu.append(searchWrap, tree, empty);
    state.render();

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const opened = menu.classList.toggle("show");
      trigger.setAttribute("aria-expanded", String(opened));
      if (opened) setTimeout(() => search.focus(), 0);
    });

    menu.addEventListener("click", (event) => event.stopPropagation());
    document.addEventListener("click", () => {
      menu.classList.remove("show");
      trigger.setAttribute("aria-expanded", "false");
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      menu.classList.remove("show");
      trigger.setAttribute("aria-expanded", "false");
    });

    wrap.append(trigger, menu);
    return wrap;
  }

  function initNav() {
    const file = currentFile();
    const active = resolveActive(file);
    const activeHref = activeHrefFrom(active, file);

    const oldNodes = Array.from(document.body.childNodes).filter((node) => node !== bootScript);

    const layout = document.createElement("div");
    layout.className = "layout";

    const sidebar = document.createElement("aside");
    sidebar.className = "sidebar";

    const primaryRail = document.createElement("div");
    primaryRail.className = "nav-primary-rail";

    const logo = document.createElement("div");
    logo.className = "sidebar-logo";
    logo.textContent = "凯撒";

    primaryScroll = document.createElement("nav");
    primaryScroll.className = "nav-scroll nav-primary-scroll";
    primaryScroll.setAttribute("aria-label", "一级模块导航");

    const secondaryPanel = document.createElement("div");
    secondaryPanel.className = "nav-secondary-panel";

    secondaryTitle = document.createElement("div");
    secondaryTitle.className = "nav-secondary-title";

    secondaryNav = document.createElement("nav");
    secondaryNav.className = "nav-scroll nav-secondary-scroll";
    secondaryNav.setAttribute("aria-label", "二三级菜单导航");

    currentPrimaryIndex = rootIndexFromActive(active);
    renderPrimary(active);
    renderSecondary(activeHref);

    primaryRail.append(logo, primaryScroll);
    secondaryPanel.append(secondaryTitle, secondaryNav);
    sidebar.append(primaryRail, secondaryPanel);
    sidebar.addEventListener("mouseleave", () => {
      restorePinnedPrimary();
      hidePrimaryTooltip();
    });

    const main = document.createElement("main");
    main.className = "main-area";

    const topbar = document.createElement("header");
    topbar.className = "topbar";

    const left = document.createElement("div");
    left.className = "topbar-left";

    const toggle = document.createElement("button");
    toggle.className = "nav-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "收起或展开侧栏");
    toggle.innerHTML = '<span class="topbar-icon"><svg viewBox="0 0 24 24" aria-hidden="true">' + icons.menu + "</svg></span>";

    left.append(toggle, createBreadcrumb(active));

    const right = document.createElement("div");
    right.className = "topbar-right";
    const user = document.createElement("div");
    user.className = "topbar-user";
    const userIcon = document.createElement("span");
    userIcon.className = "topbar-user-icon";
    userIcon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + icons.user + "</svg>";
    const name = document.createElement("span");
    name.textContent = "张三";
    const arrow = document.createElement("span");
    arrow.className = "topbar-chevron";
    arrow.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + icons.chevronDown + "</svg>";
    user.append(userIcon, name, arrow);
    right.append(createWorkspaceSwitcher(), createNotify(8), user);

    topbar.append(left, right);

    const content = document.createElement("section");
    content.className = "content";
    oldNodes.forEach((node) => content.appendChild(node));

    main.append(topbar, createPageTabs(active, file), content);
    layout.append(sidebar, main);
    document.body.appendChild(layout);

    toggle.addEventListener("click", () => {
      layout.classList.toggle("nav-collapsed");
      hidePrimaryTooltip();
    });

    initFilterTabs(content);
    initActionMenus(content);
    initPjaxNavigation();
  }

  function isPjaxLink(link) {
    if (!link || link.target === "_blank" || link.hasAttribute("download")) return false;

    const url = new URL(link.getAttribute("href"), window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return false;
    if (!url.pathname.endsWith(".html")) return false;
    return true;
  }

  function navigateTo(href) {
    const target = new URL(resolvedAppHref(href), window.location.href);
    loadPage(target, { push: true });
  }

  window.caesarNavigateTo = navigateTo;
  window.caesarLoadPage = loadPage;

  async function loadPage(target, options) {
    const url = target instanceof URL ? target : new URL(target, window.location.href);
    const content = document.querySelector(".content");

    if (!content) {
      window.location.href = url.href;
      return;
    }

    content.classList.add("caesar-content-loading");

    try {
      const response = await fetch(url.href, {
        headers: { "X-Requested-With": "caesar-pjax" },
      });

      if (!response.ok) throw new Error("页面加载失败");

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const nextFile = fileFromUrl(url);
      const { nodes, scripts } = collectPageNodes(doc);

      content.replaceChildren(...nodes);
      if (doc.title) document.title = doc.title;
      if (options && options.push) {
        history.pushState({ caesarPjax: true }, "", url.href);
      }

      syncNavActive(nextFile);
      initFilterTabs(content);
      initActionMenus(content);
      runPageScripts(scripts);
      content.scrollTop = 0;
    } catch (error) {
      window.location.href = url.href;
    } finally {
      content.classList.remove("caesar-content-loading");
    }
  }

  function initPjaxNavigation() {
    if (document.documentElement.dataset.pjaxReady === "true") return;
    document.documentElement.dataset.pjaxReady = "true";

    history.replaceState({ caesarPjax: true }, "", window.location.href);

    document.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = event.target.closest("a[href]");
      if (!isPjaxLink(link)) return;

      event.preventDefault();
      navigateTo(link.href);
    });

    document.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.target.closest("a, button, input, select, textarea, label")) return;

      const trigger = event.target.closest("[data-nav-href], [data-href]");
      if (!trigger) return;

      const href = trigger.dataset.navHref || trigger.dataset.href;
      const url = new URL(href, window.location.href);
      const isSamePageTarget = url.origin === window.location.origin
        && url.pathname.endsWith(".html");

      if (!isSamePageTarget) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      navigateTo(url.href);
    }, true);

    window.addEventListener("popstate", () => {
      loadPage(new URL(window.location.href), { push: false });
    });
  }

  function tabValue(button) {
    return button.dataset.filterValue || button.textContent.replace(/\(.*/, "").trim();
  }

  function rowValues(row) {
    if (row.dataset.tabStatus) {
      return row.dataset.tabStatus.split(/[\s,，|/]+/).filter(Boolean);
    }
    return Array.from(row.querySelectorAll(".tag")).map((tag) => tag.textContent.trim()).filter(Boolean);
  }

  function initFilterTabs(scope) {
    scope.querySelectorAll(".tab-bar[data-filter-tabs]").forEach((tabBar) => {
      const targetSelector = tabBar.dataset.filterTarget;
      const target = targetSelector ? scope.querySelector(targetSelector) : tabBar.nextElementSibling;
      const rows = target
        ? Array.from(target.matches("tbody")
          ? target.querySelectorAll("tr")
          : target.querySelectorAll("tbody tr, [data-tab-status]"))
        : [];
      const buttons = Array.from(tabBar.querySelectorAll(".tab-item"));

      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          const value = tabValue(button);

          buttons.forEach((item) => item.classList.toggle("active", item === button));
          rows.forEach((row) => {
            const matched = value === "全部" || rowValues(row).includes(value);
            row.hidden = !matched;
          });
        });
      });
    });
  }

  function initActionMenus(scope) {
    scope.querySelectorAll("[data-action-menu]").forEach((wrap) => {
      const toggle = wrap.querySelector("[data-action-menu-toggle]");
      if (!toggle) return;

      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        scope.querySelectorAll("[data-action-menu].open").forEach((item) => {
          if (item !== wrap) {
            item.classList.remove("open");
            const itemToggle = item.querySelector("[data-action-menu-toggle]");
            if (itemToggle) itemToggle.setAttribute("aria-expanded", "false");
          }
        });
        wrap.classList.toggle("open");
        toggle.setAttribute("aria-expanded", wrap.classList.contains("open") ? "true" : "false");
      });
    });

    if (document.documentElement.dataset.actionMenuReady !== "true") {
      document.documentElement.dataset.actionMenuReady = "true";
      document.addEventListener("click", () => {
        document.querySelectorAll("[data-action-menu].open").forEach((wrap) => {
          wrap.classList.remove("open");
          const toggle = wrap.querySelector("[data-action-menu-toggle]");
          if (toggle) toggle.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNav);
  } else {
    initNav();
  }
})();
