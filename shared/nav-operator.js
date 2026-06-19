(function () {
  const bootScript = document.currentScript;
  const menu = [
    { title: "工作台", icon: "chart", href: "dashboard.html" },
    {
      title: "商户管理",
      icon: "building",
      children: [
        { title: "商户列表", href: "merchants.html" },
        { title: "主体公司", href: "companies.html" },
      ],
    },
    { title: "套餐管理", icon: "package", href: "packages.html" },
    { title: "模板中心", icon: "clipboard", href: "templates.html" },
    { title: "组件市场", icon: "puzzle", href: "components.html" },
    {
      title: "数据报表",
      icon: "trend",
      children: [
        { title: "经营总览", href: "reports-overview.html" },
        { title: "销售分析", href: "reports-sales.html" },
        { title: "财务分析", href: "reports-finance.html" },
        { title: "报表下钻", href: "reports-drill.html" },
      ],
    },
    { title: "平台配置", icon: "settings", href: "config-dict.html" },
    { title: "审计中心", icon: "search", href: "audit-logs.html" },
    { title: "运维监控", icon: "monitor", href: "monitor.html" },
  ];

  const icons = {
    chart: '<path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M3 19h18"/>',
    building: '<path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16"/><path d="M3 21h18"/><path d="M8 7h5"/><path d="M8 11h5"/><path d="M8 15h5"/><path d="M17 9h1a2 2 0 0 1 2 2v10"/>',
    package: '<path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    clipboard: '<path d="M9 5h6"/><path d="M9 3h6v4H9z"/><path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>',
    puzzle: '<path d="M8 3h4v3a2 2 0 1 0 4 0V3h3a2 2 0 0 1 2 2v4h-3a2 2 0 1 0 0 4h3v4a2 2 0 0 1-2 2h-4v-3a2 2 0 1 0-4 0v3H8a2 2 0 0 1-2-2v-3H3a2 2 0 1 1 0-4h3V5a2 2 0 0 1 2-2Z"/>',
    trend: '<path d="m3 17 6-6 4 4 7-7"/><path d="M14 8h6v6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7.1 4l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.9 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8"/><path d="M12 16v4"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
  };

  function createIcon(name) {
    const icon = document.createElement("span");
    icon.className = "nav-icon";
    icon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + icons[name] + "</svg>";
    return icon;
  }

  function currentFile() {
    return (window.location.pathname.split("/").pop() || "dashboard.html").split("?")[0];
  }

  function findActive(items, file, parent) {
    for (const item of items) {
      if (item.href === file) {
        return { item, parent };
      }
      if (item.children) {
        const found = findActive(item.children, file, item);
        if (found) return found;
      }
    }
    return null;
  }

  function createLink(item, activeFile) {
    const link = document.createElement("a");
    link.className = "nav-item";
    link.dataset.title = item.title;
    link.title = item.title;
    if (!item.icon) link.classList.add("nav-child");
    link.href = item.href;
    if (item.href === activeFile) link.classList.add("active");

    const text = document.createElement("span");
    text.className = "nav-label";
    text.textContent = item.title;

    if (item.icon) link.appendChild(createIcon(item.icon));
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
    const storageKey = "caesar-operator-tabs";
    const title = active ? active.item.title : file;
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
          window.location.href = nextTabs[nextTabs.length - 1].href;
          return;
        }
        item.remove();
      });

      item.append(label, close);
      tabsBar.appendChild(item);
    });

    return tabsBar;
  }

  function createParent(item, activeFile) {
    const wrap = document.createElement("div");
    wrap.className = "nav-parent";

    const head = document.createElement("div");
    head.className = "nav-item";
    head.dataset.title = item.title;
    head.title = item.title;

    const text = document.createElement("span");
    text.className = "nav-label";
    text.textContent = item.title;

    const arrow = document.createElement("span");
    arrow.className = "nav-arrow";
    arrow.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + icons.chevron + "</svg>";

    const sub = document.createElement("div");
    sub.className = "nav-sub";

    item.children.forEach((child) => sub.appendChild(createLink(child, activeFile)));
    if (item.children.some((child) => child.href === activeFile)) {
      wrap.classList.add("open");
      head.classList.add("active");
    }

    head.addEventListener("click", () => wrap.classList.toggle("open"));
    head.append(createIcon(item.icon), text, arrow);
    wrap.append(head, sub);
    return wrap;
  }

  function createBreadcrumb(active) {
    const breadcrumb = document.createElement("div");
    breadcrumb.className = "breadcrumb";
    const home = document.createElement("span");
    home.textContent = "运营平台";
    breadcrumb.appendChild(home);

    const parts = active
      ? active.parent
        ? [active.parent.title, active.item.title]
        : [active.item.title]
      : ["工作台"];

    parts.forEach((part, index) => {
      const sep = document.createElement("span");
      sep.textContent = "/";
      const node = document.createElement("span");
      node.textContent = part;
      if (index === parts.length - 1) node.className = "current";
      breadcrumb.append(sep, node);
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

  function initNav() {
    const file = currentFile();
    const active = findActive(menu, file);

    const oldNodes = Array.from(document.body.childNodes).filter((node) => node !== bootScript);

    const layout = document.createElement("div");
    layout.className = "layout";

    const sidebar = document.createElement("aside");
    sidebar.className = "sidebar";

    const logo = document.createElement("div");
    logo.className = "sidebar-logo";
    logo.textContent = "凯撒运营平台";

    const navScroll = document.createElement("nav");
    navScroll.className = "nav-scroll";
    menu.forEach((item) => navScroll.appendChild(item.children ? createParent(item, file) : createLink(item, file)));
    sidebar.append(logo, navScroll);

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
    name.textContent = "平台超级管理员";
    user.append(userIcon, name);
    right.append(createNotify(3), user);

    topbar.append(left, right);

    const content = document.createElement("section");
    content.className = "content";
    oldNodes.forEach((node) => content.appendChild(node));

    main.append(topbar, createPageTabs(active, file), content);
    layout.append(sidebar, main);
    document.body.appendChild(layout);

    toggle.addEventListener("click", () => {
      layout.classList.toggle("nav-collapsed");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNav);
  } else {
    initNav();
  }
})();
