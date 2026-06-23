(function () {
  const bootScript = document.currentScript;
  const menu = [
    { title: "工作台", icon: "chart", href: "dashboard.html" },
    {
      title: "产品中心",
      icon: "map",
      children: [
        {
          title: "产品管理",
          children: [
            { title: "产品列表", href: "products.html" },
            { title: "外采产品", href: "product-outsource-list.html" },
          ],
        },
        { title: "团期团控", href: "schedules.html" },
        { title: "供应商管理", href: "suppliers.html" },
      ],
    },
    {
      title: "资源模块",
      icon: "plane",
      children: [
        {
          title: "航空资源",
          children: [
            { title: "航线库", href: "resource-flight-routes.html" },
            { title: "锁位管理", href: "resource-flight-block.html" },
          ],
        },
      ],
    },
    {
      title: "销售订单",
      icon: "clipboard",
      children: [
        { title: "预订中心", href: "booking.html" },
        { title: "订单管理", href: "orders.html" },
        { title: "退款管理", href: "orders-refund.html" },
        { title: "意向单", href: "orders-intent.html" },
      ],
    },
    {
      title: "履约操作",
      icon: "plane",
      children: [
        { title: "名单管理", href: "fulfillment-roster.html" },
        { title: "出团管理", href: "fulfillment-outbound.html" },
      ],
    },
    {
      title: "项目业务",
      icon: "target",
      children: [
        { title: "MICE", href: "projects.html" },
      ],
    },
    { title: "合同合规", icon: "file", href: "contracts.html" },
    {
      title: "财务对账",
      icon: "wallet",
      children: [
        { title: "应收管理", href: "finance-receivable.html" },
        { title: "收款管理", href: "finance-receipt.html" },
        { title: "应付管理", href: "finance-payable.html" },
        { title: "付款管理", href: "finance-payment.html" },
        { title: "对账结算", href: "finance-settlement.html" },
        { title: "发票管理", href: "finance-invoice.html" },
        { title: "财务报表", href: "finance-reports.html" },
      ],
    },
    {
      title: "分销运营",
      icon: "handshake",
      children: [
        { title: "分销商管理", href: "dist-merchants.html" },
        { title: "分销员管理", href: "dist-members.html" },
        { title: "佣金管理", href: "dist-commission.html" },
      ],
    },
    {
      title: "营销内容",
      icon: "gift",
      children: [
        { title: "优惠券", href: "marketing-coupons.html" },
        { title: "活动专题", href: "marketing-activities.html" },
      ],
    },
    { title: "客户会员", icon: "users", href: "customers.html" },
    { title: "AI计调助手", icon: "sparkles", href: "ai-assistant.html", ai: true },
    { title: "C端装修", icon: "palette", href: "design-pages.html" },
    {
      title: "数据统计",
      icon: "trend",
      children: [
        { title: "商户报表", href: "stats-merchant.html" },
        { title: "部门报表", href: "stats-department.html" },
        { title: "门店报表", href: "stats-store.html" },
      ],
    },
    {
      title: "系统设置",
      icon: "settings",
      children: [
        { title: "角色权限", href: "settings-roles.html" },
        { title: "门店管理", href: "stores.html" },
        { title: "系统配置", href: "settings.html" },
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
    工作台: "概况",
    产品中心: "产品",
    资源模块: "资源",
    销售订单: "订单",
    履约操作: "履约",
    项目业务: "项目",
    合同合规: "合同",
    财务对账: "财务",
    分销运营: "分销",
    营销内容: "营销",
    客户会员: "客户",
    AI计调助手: "AI",
    C端装修: "装修",
    数据统计: "数据",
    系统设置: "设置",
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

  function currentFile() {
    return (window.location.pathname.split("/").pop() || "dashboard.html").split("?")[0];
  }

  function fileFromUrl(url) {
    return (url.pathname.split("/").pop() || "dashboard.html").split("?")[0];
  }

  const pageOwners = {
    "dashboard-group.html": { href: "dashboard.html", title: "集团管理层工作台" },
    "dashboard-store.html": { href: "dashboard.html", title: "门店店长工作台" },
    "products-create.html": { href: "products.html", title: "新建跟团游产品" },
    "products-detail.html": { href: "products.html", title: "产品详情" },
    "product-outsource-list.html": { href: "products.html", title: "外采产品" },
    "schedules-detail.html": { href: "schedules.html", title: "团期详情" },
    "orders-detail.html": { href: "orders.html", title: "订单详情" },
    "projects-detail.html": { href: "projects.html", title: "项目详情" },
    "finance-settlement-detail.html": { href: "finance-settlement.html", title: "对账单详情" },
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
      control.href = item.href;
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

    const root = menu[typeof primaryIndex === "number" ? primaryIndex : currentPrimaryIndex] || menu[0];
    const items = root.children && root.children.length > 0 ? root.children : [root];
    const hasActiveInRoot = hasActive(root, activeHref);
    let openedDefault = false;

    secondaryTitle.textContent = root.title;
    secondaryNav.replaceChildren();
    items.forEach((item) => {
      const openByDefault = !hasActiveInRoot && !openedDefault && Boolean(item.children);
      if (openByDefault) openedDefault = true;
      secondaryNav.appendChild(item.children ? createSecondaryParent(item, activeHref, 0, openByDefault) : createSecondaryLink(item, activeHref, 0));
    });
  }

  function createSecondaryLink(item, activeFile, depth) {
    const link = document.createElement("a");
    link.className = "nav-item";
    link.dataset.title = item.title;
    link.dataset.depth = String(depth || 0);
    link.title = item.title;
    if (!item.icon || depth > 0) link.classList.add("nav-child");
    link.href = item.href;
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
      item.href = tab.href;

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

  function createSecondaryParent(item, activeFile, depth, openByDefault) {
    const wrap = document.createElement("div");
    wrap.className = "nav-parent";
    wrap.dataset.depth = String(depth || 0);

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
      sub.appendChild(child.children ? createSecondaryParent(child, activeFile, (depth || 0) + 1, false) : createSecondaryLink(child, activeFile, (depth || 0) + 1));
    });
    if (openByDefault || item.children.some((child) => hasActive(child, activeFile))) {
      wrap.classList.add("open");
    }

    head.addEventListener("click", () => wrap.classList.toggle("open"));
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

    const currentDir = window.location.pathname.replace(/[^/]*$/, "");
    return url.pathname.replace(/[^/]*$/, "") === currentDir;
  }

  function navigateTo(href) {
    const target = new URL(href, window.location.href);
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
      const currentDir = window.location.pathname.replace(/[^/]*$/, "");
      const isSamePageTarget = url.origin === window.location.origin
        && url.pathname.endsWith(".html")
        && url.pathname.replace(/[^/]*$/, "") === currentDir;

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
