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

  function fileFromUrl(url) {
    return (url.pathname.split("/").pop() || "dashboard.html").split("?")[0];
  }

  const pageOwners = {
    "merchants-detail.html": { href: "merchants.html", title: "商户详情" },
  };
  let currentRouteUrl = new URL(window.location.href);

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

  function resolveActive(file) {
    const direct = findActive(menu, file);
    if (direct) return direct;

    const owner = pageOwners[file];
    if (!owner) return null;

    const active = findActive(menu, owner.href);
    if (!active) return null;
    return Object.assign({}, active, { currentTitle: owner.title, ownerHref: owner.href });
  }

  function createLink(item, activeFile) {
    const link = document.createElement("a");
    link.className = "nav-item";
    link.dataset.title = item.title;
    link.dataset.routeHref = item.href;
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
    const title = active ? active.currentTitle || active.item.title : file;
    const current = { title, href: file };
    const tabs = readTabs(storageKey);
    const existingIndex = tabs.findIndex((tab) => tab.href === file);
    if (existingIndex >= 0) {
      tabs[existingIndex] = current;
    } else {
      tabs.push(current);
    }
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
    if (!oldTabs) return;
    const nextTabs = createPageTabs(active, file);
    oldTabs.replaceChildren(...Array.from(nextTabs.childNodes));
  }

  function syncNavActive(file) {
    const active = resolveActive(file);
    const activeHref = active ? active.ownerHref || active.item.href : file;

    document.querySelectorAll(".nav-scroll .nav-item.active").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".nav-scroll .nav-parent").forEach((parent) => parent.classList.remove("open"));

    const activeLink = Array.from(document.querySelectorAll(".nav-scroll a.nav-item")).find((link) => link.dataset.routeHref === activeHref);
    if (activeLink) {
      activeLink.classList.add("active");
      const parent = activeLink.closest(".nav-parent");
      if (parent) parent.classList.add("open");
    }

    replaceBreadcrumb(active);
    replacePageTabs(active, file);
  }

  function collectPageNodes(doc, pageUrl) {
    const nodes = [];
    const scripts = [];
    const sourceRoot = doc.querySelector(".content") || doc.body;

    Array.from(sourceRoot.childNodes).forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "SCRIPT") {
        const src = node.getAttribute("src") || "";
        if (!src.includes("nav-operator.js")) {
          const script = document.importNode(node, true);
          if (src && pageUrl) script.setAttribute("src", new URL(src, pageUrl).href);
          scripts.push(script);
        }
        return;
      }
      nodes.push(document.importNode(node, true));
    });

    return { nodes, scripts };
  }

  function loadDocumentWithIframe(url) {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement("iframe");
      iframe.hidden = true;
      iframe.sandbox = "allow-same-origin";
      iframe.setAttribute("aria-hidden", "true");
      iframe.style.position = "fixed";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";

      const cleanup = () => {
        setTimeout(() => iframe.remove(), 0);
      };

      iframe.addEventListener("load", () => {
        try {
          const doc = iframe.contentDocument;
          if (!doc || !doc.body) throw new Error("无法读取目标页面内容");
          const html = doc.documentElement ? doc.documentElement.outerHTML : "";
          resolve(new DOMParser().parseFromString(html, "text/html"));
        } catch (error) {
          reject(error);
        } finally {
          cleanup();
        }
      }, { once: true });

      iframe.addEventListener("error", () => {
        cleanup();
        reject(new Error("目标页面加载失败"));
      }, { once: true });

      document.body.appendChild(iframe);
      iframe.src = url.href;
    });
  }

  async function loadRouteDocument(url) {
    if (url.protocol === "file:") {
      return loadDocumentWithIframe(url);
    }

    const response = await fetch(url.href, {
      headers: { "X-Requested-With": "caesar-pjax" },
    });

    if (!response.ok) throw new Error("页面加载失败");

    const html = await response.text();
    return new DOMParser().parseFromString(html, "text/html");
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
    }

    head.addEventListener("click", () => wrap.classList.toggle("open"));
    head.append(createIcon(item.icon), text, arrow);
    wrap.append(head, sub);
    return wrap;
  }

  function createBreadcrumb(active) {
    const breadcrumb = document.createElement("div");
    breadcrumb.className = "breadcrumb";

    const parts = active
      ? active.parent
        ? [active.parent.title, active.item.title]
        : [active.item.title]
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

  function initNav() {
    const file = currentFile();
    const active = resolveActive(file);
    const activeHref = active ? active.ownerHref || active.item.href : file;

    const oldNodes = Array.from(document.body.childNodes).filter((node) => node !== bootScript);

    const layout = document.createElement("div");
    layout.className = "layout";

    const sidebar = document.createElement("aside");
    sidebar.className = "sidebar";

    const logo = document.createElement("div");
    logo.className = "sidebar-logo caesar-brand-logo";
    logo.setAttribute("aria-label", "凯撒运营平台");
    logo.innerHTML = [
      '<span class="caesar-brand-mark" aria-hidden="true">',
      '<svg viewBox="0 0 40 40" focusable="false">',
      '<path class="caesar-brand-orbit" d="M7.5 24.8c4.7-9.7 13.8-15.1 23.7-13.9 2.1.3 3.7.9 5 1.7-2.2 1.2-4.7 2.1-7.3 2.8-7.1 1.9-12.7 5.1-16.6 11.2-1.4 2.2-3.1 1.4-4.8-1.8Z"/>',
      '<path class="caesar-brand-sail" d="M17.4 27.6c2.4-5.5 7.2-8.9 14.1-10.7-1.1 4.2-3.7 7.6-7.4 9.8-2.2 1.4-4.4 1.7-6.7.9Z"/>',
      '<path class="caesar-brand-star main" d="M15.6 6.4 17.3 10l3.8.7-3 2.7.5 4-3.5-2-3.7 1.7.8-4-2.7-3 4-.4 2.1-3.3Z"/>',
      '<path class="caesar-brand-star small" d="m29.4 5.4 1 2.1 2.3.4-1.7 1.6.3 2.3-2-1.1-2.2 1 .5-2.3-1.6-1.7 2.3-.3 1.1-2Z"/>',
      '</svg>',
      '</span>',
      '<span class="caesar-brand-name">凯撒</span>'
    ].join("");

    const navScroll = document.createElement("nav");
    navScroll.className = "nav-scroll";
    menu.forEach((item) => navScroll.appendChild(item.children ? createParent(item, activeHref) : createLink(item, activeHref)));
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

    initListSurfaces(content);
    initFilterTabs(content);
    initActionMenus(content);
    initPjaxNavigation();
    requestAnimationFrame(() => window.caesarRefreshListSurfaces && window.caesarRefreshListSurfaces());
  }

  function isPjaxLink(link) {
    if (!link || link.target === "_blank" || link.hasAttribute("download")) return false;

    const url = new URL(link.getAttribute("href"), currentRouteUrl || window.location.href);
    const isSameAppOrigin = window.location.protocol === "file:"
      ? url.protocol === "file:"
      : url.origin === window.location.origin;
    if (!isSameAppOrigin) return false;
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return false;
    if (!url.pathname.endsWith(".html")) return false;
    return true;
  }

  function navigateTo(href) {
    const target = new URL(href, currentRouteUrl || window.location.href);
    if (target.protocol === "file:") {
      window.location.href = target.href;
      return;
    }
    loadPage(target, { push: true });
  }

    window.caesarNavigateTo = navigateTo;
    window.caesarLoadPage = loadPage;
    window.caesarRefreshListSurfaces = () => {
      const currentContent = document.querySelector(".content");
      if (!currentContent) return;
      initListSurfaces(currentContent);
      initFilterTabs(currentContent);
      initActionMenus(currentContent);
    };

  async function loadPage(target, options) {
    const url = target instanceof URL ? target : new URL(target, window.location.href);
    const content = document.querySelector(".content");

    if (!content) {
      showPageLoadError(null, url, new Error("页面外壳未初始化"));
      return;
    }

    content.classList.add("caesar-content-loading");

    try {
      const doc = await loadRouteDocument(url);
      const nextFile = fileFromUrl(url);
      const { nodes, scripts } = collectPageNodes(doc, url);

      content.replaceChildren(...nodes);
      if (doc.title) document.title = doc.title;
      if (options && options.push && url.protocol !== "file:") {
        history.pushState({ caesarPjax: true }, "", url.href);
      }
      currentRouteUrl = url;

      syncNavActive(nextFile);
      initListSurfaces(content);
      initFilterTabs(content);
      initActionMenus(content);
      runPageScripts(scripts);
      window.caesarRefreshListSurfaces();
      content.scrollTop = 0;
    } catch (error) {
      showPageLoadError(content, url, error);
    } finally {
      content.classList.remove("caesar-content-loading");
    }
  }

  function showPageLoadError(content, url, error) {
    const target = content || document.querySelector(".content");
    const message = error && error.message ? error.message : "未知错误";
    if (!target) {
      window.alert("页面加载失败：" + message);
      return;
    }
    target.replaceChildren();
    const panel = document.createElement("section");
    panel.className = "route-error-panel";
    panel.innerHTML = [
      '<div class="route-error-title">页面加载失败</div>',
      '<div class="route-error-desc">无法通过内容路由加载目标页面，请检查页面规范或稍后重试。</div>',
      '<div class="route-error-meta"></div>',
      '<div class="route-error-actions"><a class="btn btn-secondary" target="_blank" rel="noopener">在新窗口打开</a></div>'
    ].join("");
    panel.querySelector(".route-error-meta").textContent = url.href + " ｜ " + message;
    panel.querySelector("a").href = url.href;
    target.appendChild(panel);
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
      navigateTo(link.getAttribute("href"));
    });

    document.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.target.closest("a, button, input, select, textarea, label")) return;

      const trigger = event.target.closest("[data-nav-href], [data-href], [data-row-link]");
      if (!trigger) return;

      const href = trigger.dataset.navHref || trigger.dataset.href || trigger.dataset.rowLink;
      const url = new URL(href, currentRouteUrl || window.location.href);
      const isSameAppOrigin = window.location.protocol === "file:"
        ? url.protocol === "file:"
        : url.origin === window.location.origin;
      const isSamePageTarget = isSameAppOrigin
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

  function isListSurfacePart(node) {
    return node && node.matches && node.matches(".alert, [class$='-warning'], [class*='-warning '], .tab-bar, .table-wrap, .pagination");
  }

  function isExcludedListSurfaceNode(node) {
    return !node || Boolean(node.closest(".modal, .modal-overlay, .drawer-modal, .mobile-frame"));
  }

  function hasDirectListPart(container, selector) {
    return Array.from(container.children).some((child) => child.matches(selector));
  }

  function isEmptyListPageShell(panel) {
    if (!panel || !panel.matches(".list-page-panel")) return false;
    return Boolean(panel.querySelector(":scope > .list-page-head"))
      && !panel.querySelector(":scope > .filter-card, :scope > .table-wrap");
  }

  function hideEmptyListPageShellBefore(surface) {
    const previous = surface ? surface.previousElementSibling : null;
    if (isEmptyListPageShell(previous)) {
      previous.classList.add("list-page-panel-empty");
    }
  }

  function isTabbedListPanel(node) {
    if (!node || !node.matches || isExcludedListSurfaceNode(node)) return false;
    if (node.matches(".modal-overlay, .list-page-panel")) return false;
    if (!node.matches("section, div, main")) return false;
    if (!/(^|\s|-)panel(\s|$)|(^|\s|-)pane(\s|$)|(^|\s|-)content(\s|$)/.test(node.className)) return false;
    return Boolean(node.querySelector(".filter-card, .table-wrap"));
  }

  function moveChildren(from, to) {
    while (from.firstChild) {
      to.appendChild(from.firstChild);
    }
  }

  function hasChildren(node) {
    return Array.from(node.childNodes).some((child) => {
      return child.nodeType !== Node.TEXT_NODE || child.textContent.trim();
    });
  }

  function normalizeListTabButton(button) {
    if (button.dataset.listTabNormalized === "true") return;
    const badgeSelector = ".list-tab-count, .intent-tab-count, .tab-badge, .tab-corner-badge";
    const badge = button.querySelector(badgeSelector);
    const existingLabel = Array.from(button.children).find((child) => {
      return child.matches(".tab-label, .list-tab-label") || !child.matches(badgeSelector);
    });

    if (existingLabel && existingLabel.matches("span")) {
      existingLabel.classList.add("tab-label", "list-tab-label");
      button.dataset.listTabNormalized = "true";
      return;
    }

    const textNodes = Array.from(button.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE);
    const text = textNodes.map((node) => node.textContent).join("").trim();
    const match = text.match(/^(.+?)\s*[（(]([^()（）]+)[）)]\s*(.*)$/);
    const labelText = match ? match[1].trim() : text;
    if (!labelText && badge) {
      button.dataset.listTabNormalized = "true";
      return;
    }

    const label = document.createElement("span");
    label.className = "tab-label list-tab-label";
    label.textContent = labelText;

    textNodes.forEach((node) => node.remove());

    if (badge) {
      button.insertBefore(label, badge);
      button.dataset.listTabNormalized = "true";
      return;
    }

    button.textContent = "";
    button.appendChild(label);

    if (match) {
      const count = document.createElement("span");
      count.className = "list-tab-count";
      count.textContent = match[2].trim();
      button.appendChild(count);
    }

    if (match && match[3].trim()) {
      const suffix = document.createElement("span");
      suffix.className = "list-tab-suffix";
      suffix.textContent = match[3].trim();
      button.appendChild(suffix);
    }
    button.dataset.listTabNormalized = "true";
  }

  function collectFilterControls(source, target) {
    Array.from(source.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent.trim()) target.appendChild(node);
        return;
      }

      if (!(node instanceof HTMLElement)) {
        target.appendChild(node);
        return;
      }

      if (node.matches(".filter-row, .list-surface-filter-layout, .list-surface-filter-fields")) {
        collectFilterControls(node, target);
        node.remove();
        return;
      }

      if (!node.hidden && node.querySelector(":scope > .filter-row, :scope > .list-surface-filter-layout, :scope > .list-surface-filter-fields")) {
        collectFilterControls(node, target);
        node.remove();
        return;
      }

      target.appendChild(node);
    });
  }

  function insertActionBar(layout, actionBar) {
    if (!hasChildren(actionBar)) return;

    actionBar.classList.add("list-filter-pinned-actions");
    layout.appendChild(actionBar);
  }

  function normalizePrimarySearchField(fields) {
    if (fields.querySelector(".filter-item-search, .filter-item-long, .orders-quick-search")) return;

    const searchInput = fields.querySelector(
      ":scope > .filter-item input[type='search'], :scope > .filter-item input[placeholder*='搜索'], :scope > .filter-item input[placeholder*='关键词']"
    );
    const searchField = searchInput ? searchInput.closest(".filter-item, .filter-item-sm, .filter-item-wide, .filter-item-status") : null;
    if (searchField) searchField.classList.add("filter-item-search");
  }

  function isFilterSubmitAction(control) {
    const text = compactText(control.textContent);
    if (!text) return false;
    return /^(搜索|查询|重置)$/.test(text);
  }

  function normalizeFilterSubmitActions(fields, actionBar) {
    const submitActions = Array.from(fields.querySelectorAll(":scope > .filter-actions"));
    submitActions.forEach((actions) => {
      Array.from(actions.children).forEach((control) => {
        if (!isFilterSubmitAction(control)) actionBar.appendChild(control);
      });
      if (hasChildren(actions)) {
        actions.classList.remove("list-surface-filter-actions", "list-filter-pinned-actions");
        fields.appendChild(actions);
      } else {
        actions.remove();
      }
    });
  }

  const metaTagTexts = new Set([
    "普通团期", "邮轮航次", "专列班期", "研学营期", "自由行", "单项委托",
    "自营", "自营产品", "外采", "外采产品", "外采团期", "邮轮", "邮轮产品", "专列", "专列产品", "研学", "研学产品", "国内游",
    "门市", "门市渠道", "门店", "门店POS", "小程序", "官网", "OTA", "OTA渠道", "OTA结算",
    "携程", "飞猪", "同程", "代理", "代理渠道", "分销", "分销渠道",
    "银行流水", "线下转账", "手动认款", "OTA认款", "OTA批量",
    "欧洲", "国内", "MICE", "出境跟团", "跟团游", "普通报价", "团队报价"
  ]);

  function compactText(text) {
    return String(text || "").replace(/\s+/g, "");
  }

  function isStatusColumnTitle(title) {
    return /状态|进度|结果|风险|预警|审批|审核|是否|操作/.test(compactText(title));
  }

  function isMetaColumnTitle(title) {
    const text = compactText(title);
    if (!text || isStatusColumnTitle(text)) return false;
    return /产品类型|业务类型|合同类型|客户类型|团期类型|类型|渠道|来源|平台|分类|标签|履约|对象|适用|付款方|认款方式/.test(text);
  }

  function shouldUseMetaTag(tag, columnTitle) {
    if (isStatusColumnTitle(columnTitle)) return false;
    const text = compactText(tag.textContent);
    return isMetaColumnTitle(columnTitle) || metaTagTexts.has(text);
  }

  function normalizeListSurfaceTags(surface) {
    surface.querySelectorAll(".list-surface-table table, :scope > .table-wrap table").forEach((table) => {
      const headerRows = table.tHead ? Array.from(table.tHead.rows) : [];
      const headerCells = headerRows.length ? Array.from(headerRows[headerRows.length - 1].cells) : [];
      const headers = headerCells.map((cell) => cell.textContent.trim());

      table.querySelectorAll("tbody tr").forEach((row) => {
        Array.from(row.cells).forEach((cell, index) => {
          const columnTitle = headers[index] || "";
          cell.querySelectorAll(".tag").forEach((tag) => {
            if (shouldUseMetaTag(tag, columnTitle)) {
              tag.classList.add("tag-meta-runtime");
            }
          });
        });
      });
    });

    normalizeStandaloneMetaTags(surface);
  }

  function normalizeStandaloneMetaTags(scope) {
    scope.querySelectorAll(".tag").forEach((tag) => {
      if (metaTagTexts.has(compactText(tag.textContent))) {
        tag.classList.add("tag-meta-runtime");
      }
    });
  }

  function normalizeListAlert(alert) {
    if (!alert || alert.dataset.listAlertNormalized === "true") return;

    const children = Array.from(alert.children).filter((child) => child instanceof HTMLElement);
    children.forEach((child, index) => {
      child.classList.add(index === 0 ? "list-alert-main" : "list-alert-meta");
    });
    alert.querySelectorAll("button, .link-button").forEach((button) => {
      button.classList.add("list-alert-action");
    });
    alert.dataset.listAlertNormalized = "true";
  }

  function enhanceListFilter(panel, filter) {
    if (!filter || filter.dataset.listFilterEnhanced === "true") return;

    const pageHead = panel.querySelector(":scope > .list-page-head");
    const pageTitle = pageHead ? pageHead.querySelector(".page-title") : null;
    const pageActions = pageHead ? pageHead.querySelector(".list-page-actions") : null;
    const panelHead = filter.parentElement
      ? filter.parentElement.querySelector(":scope > .masterdata-panel-head, :scope > .panel-head")
      : null;
    const panelActions = !pageActions && panelHead ? panelHead.querySelector(".panel-actions") : null;

    if (pageTitle) pageTitle.classList.add("sr-only");

    const actionBar = document.createElement("div");
    actionBar.className = "filter-actions list-surface-filter-actions";

    filter.querySelectorAll(":scope > .list-surface-filter-actions").forEach((actions) => {
      moveChildren(actions, actionBar);
      actions.remove();
    });

    if (pageActions) {
      moveChildren(pageActions, actionBar);
      pageActions.remove();
    }

    if (panelActions) {
      moveChildren(panelActions, actionBar);
      panelActions.remove();
      if (!panelHead.textContent.trim()) panelHead.remove();
    }

    const layout = document.createElement("div");
    layout.className = "list-surface-filter-layout";

    const fields = document.createElement("div");
    fields.className = "list-surface-filter-fields";
    collectFilterControls(filter, fields);
    normalizePrimarySearchField(fields);
    normalizeFilterSubmitActions(fields, actionBar);

    layout.appendChild(fields);
    insertActionBar(layout, actionBar);

    filter.classList.add("list-surface-filter");
    filter.appendChild(layout);
    filter.dataset.listFilterEnhanced = "true";
  }

  function ensureListEmptyState(surface) {
    if (surface.querySelector(".list-empty-state, [data-list-empty]")) return;

    const table = surface.querySelector(".list-surface-table, :scope > .table-wrap");
    if (!table) return;

    const empty = document.createElement("div");
    empty.className = "list-empty-state";
    empty.hidden = true;
    empty.dataset.listEmpty = "true";
    empty.textContent = "暂无符合条件的数据";
    table.insertAdjacentElement("afterend", empty);
  }

  function updateListSurfaceState(surface) {
    if (!surface) return;

    const rows = Array.from(surface.querySelectorAll("tbody tr"));
    const empty = surface.querySelector(".list-empty-state, [data-list-empty]");
    if (!empty) return;

    const visibleRows = rows.filter((row) => !row.hidden);
    empty.hidden = rows.length > 0 && visibleRows.length > 0;
  }

  function prepareListSurface(surface) {
    if (!surface) return;

    surface.classList.add("list-surface");

    surface.querySelectorAll(".filter-card").forEach((filter) => {
      enhanceListFilter(surface, filter);
    });

    surface.querySelectorAll(":scope > .alert, :scope > [class$='-warning'], :scope > [class*='-warning ']").forEach((alert) => {
      alert.classList.add("list-surface-alert");
      normalizeListAlert(alert);
    });

    surface.querySelectorAll(".tab-bar").forEach((tabBar) => {
      tabBar.classList.add("list-surface-tabs");
      tabBar.classList.toggle("list-filter-tabs", tabBar.hasAttribute("data-filter-tabs"));
      tabBar.classList.toggle("list-function-tabs", !tabBar.hasAttribute("data-filter-tabs"));
      tabBar.querySelectorAll(".tab-item").forEach(normalizeListTabButton);
    });

    surface.querySelectorAll(".table-wrap").forEach((table) => {
      table.classList.add("list-surface-table");
    });

    normalizeListSurfaceTags(surface);

    surface.querySelectorAll(".pagination").forEach((pagination) => {
      pagination.classList.add("list-surface-pagination");
    });

    surface.querySelectorAll("tbody tr[data-href], tbody tr[data-nav-href], tbody tr[data-row-link]").forEach((row) => {
      row.classList.add("list-clickable-row");
      if (!row.hasAttribute("tabindex")) row.tabIndex = 0;
    });

    ensureListEmptyState(surface);
    updateListSurfaceState(surface);
  }

  function initListSurfaces(scope) {
    function enhanceHeaderOnlyListPanel(panel) {
      if (panel.querySelector(":scope > .filter-card, :scope > .table-wrap")) return false;

      const parts = [];
      let cursor = panel.nextElementSibling;
      let hasTable = false;

      while (cursor && (isListSurfacePart(cursor) || isTabbedListPanel(cursor))) {
        parts.push(cursor);
        hasTable = hasTable || cursor.matches(".table-wrap") || Boolean(cursor.querySelector(".table-wrap"));
        cursor = cursor.nextElementSibling;
      }

      if (!hasTable) return false;

      const pageActions = panel.querySelector(":scope > .list-page-head .list-page-actions");
      if (pageActions && hasChildren(pageActions)) {
        const actionRow = document.createElement("div");
        actionRow.className = "list-surface-head-actions";
        moveChildren(pageActions, actionRow);
        panel.appendChild(actionRow);
      }

      panel.classList.add("list-surface", "list-head-surface");
      parts.forEach((part) => panel.appendChild(part));
      panel.dataset.listSurfaceReady = "true";
      prepareListSurface(panel);
      return true;
    }

    function enhanceSplitListPagePanel(panel) {
      const filter = panel.querySelector(":scope > .filter-card");
      if (!filter) return false;

      const next = panel.nextElementSibling;
      const activePanel = next && next.matches(".masterdata-shell")
        ? next.querySelector(".masterdata-panel.active")
        : null;
      if (!activePanel) return false;

      const parts = Array.from(activePanel.children).filter(isListSurfacePart);
      if (!parts.some((part) => part.matches(".table-wrap"))) return false;

      panel.classList.add("list-surface");
      enhanceListFilter(panel, filter);
      parts.forEach((part) => panel.appendChild(part));
      panel.dataset.listSurfaceReady = "true";
      prepareListSurface(panel);
      return true;
    }

    function enhanceTabbedListGroups() {
      Array.from(scope.children).forEach((child) => {
        if (!child.matches(".tab-bar:not([data-filter-tabs])")) return;
        if (child.closest(".list-surface") || isExcludedListSurfaceNode(child)) return;

        const parts = [child];
        let cursor = child.nextElementSibling;
        let hasTable = false;

        while (isTabbedListPanel(cursor)) {
          parts.push(cursor);
          hasTable = hasTable || Boolean(cursor.querySelector(".table-wrap"));
          cursor = cursor.nextElementSibling;
        }

        if (!hasTable) return;

        const surface = document.createElement("section");
        surface.className = "list-surface list-surface-tabbed";
        child.parentNode.insertBefore(surface, child);
        parts.forEach((part) => surface.appendChild(part));
        surface.dataset.listSurfaceReady = "true";
        hideEmptyListPageShellBefore(surface);
        prepareListSurface(surface);
      });
    }

    function enhanceTabbedListContainers() {
      scope.querySelectorAll("section, div, main").forEach((container) => {
        if (container.matches(".content, .layout, .main-area")) return;
        if (container.closest(".list-surface") || isExcludedListSurfaceNode(container)) return;

        const children = Array.from(container.children);
        const tabBar = children.find((child) => child.matches(".tab-bar:not([data-filter-tabs])"));
        if (!tabBar) return;

        const panels = children.filter((child) => child !== tabBar && isTabbedListPanel(child));
        if (!panels.some((panel) => panel.querySelector(".table-wrap"))) return;

        container.classList.add("list-surface", "list-surface-tabbed");
        container.dataset.listSurfaceReady = "true";
        hideEmptyListPageShellBefore(container);
        prepareListSurface(container);
      });
    }

    function enhanceNestedListContainers() {
      scope.querySelectorAll("section, div, main").forEach((container) => {
        if (container.matches(".content, .layout, .main-area")) return;
        if (container.closest(".list-surface") || isExcludedListSurfaceNode(container)) return;

        const hasFilter = hasDirectListPart(container, ".filter-card");
        const hasTable = hasDirectListPart(container, ".table-wrap");
        const looksLikeListPanel = container.matches(".masterdata-panel, .finance-payment-panel, [class*='-panel'], [class*='-content']");

        if (!(hasTable && (hasFilter || looksLikeListPanel))) return;

        container.classList.add("list-surface");
        container.dataset.listSurfaceReady = "true";
        prepareListSurface(container);
      });
    }

    scope.querySelectorAll(".list-page-panel").forEach((panel) => {
      if (panel.dataset.listSurfaceReady === "true") {
        prepareListSurface(panel);
        return;
      }

      const filter = panel.querySelector(":scope > .filter-card");
      const parts = [];
      let next = panel.nextElementSibling;

      while (isListSurfacePart(next)) {
        parts.push(next);
        next = next.nextElementSibling;
      }

      const hasTable = parts.some((part) => part.matches(".table-wrap")) || panel.querySelector(":scope > .table-wrap");
      if (!filter || !hasTable) {
        if (enhanceHeaderOnlyListPanel(panel)) return;
        if (filter && !parts.length && !panel.querySelector(":scope > .table-wrap")) {
          panel.classList.add("list-surface", "list-filter-surface");
          enhanceListFilter(panel, filter);
          panel.dataset.listSurfaceReady = "true";
          prepareListSurface(panel);
          return;
        }
        enhanceSplitListPagePanel(panel);
        return;
      }

      panel.classList.add("list-surface");
      enhanceListFilter(panel, filter);
      parts.forEach((part) => panel.appendChild(part));
      panel.dataset.listSurfaceReady = "true";
      prepareListSurface(panel);
    });

    enhanceTabbedListGroups();
    enhanceTabbedListContainers();

    Array.from(scope.children).forEach((child) => {
      if (!child.matches(".filter-card, .alert")) return;
      if (child.closest(".list-surface, .list-page-panel")) return;

      const filter = child.matches(".filter-card") ? child : child.nextElementSibling;
      if (!filter || !filter.matches(".filter-card")) return;

      const parts = [];
      let cursor = child;
      let hasFilter = false;
      let hasTable = false;

      while (cursor && (cursor.matches(".alert, .filter-card") || isListSurfacePart(cursor))) {
        parts.push(cursor);
        hasFilter = hasFilter || cursor.matches(".filter-card");
        hasTable = hasTable || cursor.matches(".table-wrap");
        cursor = cursor.nextElementSibling;
      }

      if (!hasFilter || !hasTable) return;

      const surface = document.createElement("section");
      surface.className = "list-surface";
      child.parentNode.insertBefore(surface, child);
      parts.forEach((part) => surface.appendChild(part));
      enhanceListFilter(surface, filter);
      surface.dataset.listSurfaceReady = "true";
      prepareListSurface(surface);
    });

    enhanceNestedListContainers();

    scope.querySelectorAll("[data-list-surface], .list-surface").forEach((surface) => {
      prepareListSurface(surface);
    });

    scope.querySelectorAll(".list-page-panel").forEach((panel) => {
      if (isEmptyListPageShell(panel) && panel.nextElementSibling && panel.nextElementSibling.matches(".list-surface")) {
        panel.classList.add("list-page-panel-empty");
      }
    });

    normalizeStandaloneMetaTags(scope);
  }

  function tabValue(button) {
    const label = button.querySelector(".list-tab-label");
    return button.dataset.filterValue || (label ? label.textContent.trim() : button.textContent.replace(/\(.*/, "").trim());
  }

  function rowValues(row) {
    if (row.dataset.tabStatus) {
      return row.dataset.tabStatus.split(/[\s,，|/]+/).filter(Boolean);
    }
    return Array.from(row.querySelectorAll(".tag")).map((tag) => tag.textContent.trim()).filter(Boolean);
  }

  function initFilterTabs(scope) {
    scope.querySelectorAll(".tab-bar[data-filter-tabs]").forEach((tabBar) => {
      if (tabBar.dataset.filterTabsReady === "true") return;
      tabBar.dataset.filterTabsReady = "true";

      const targetSelector = tabBar.dataset.filterTarget;
      const target = targetSelector ? scope.querySelector(targetSelector) : tabBar.nextElementSibling;
      const rows = target
        ? Array.from(target.matches("tbody")
          ? target.querySelectorAll("tr")
          : target.querySelectorAll("tbody tr, [data-tab-status]"))
        : [];
      const buttons = Array.from(tabBar.querySelectorAll(".tab-item"));
      buttons.forEach(normalizeListTabButton);
      const surface = tabBar.closest(".list-surface, [data-list-surface]");

      function applyFilter(button) {
        const value = tabValue(button);

        buttons.forEach((item) => item.classList.toggle("active", item === button));
        rows.forEach((row) => {
          const matched = value === "全部" || rowValues(row).includes(value);
          row.hidden = !matched;
        });
        updateListSurfaceState(surface);
      }

      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          applyFilter(button);
        });
      });

      const activeButton = buttons.find((button) => button.classList.contains("active"));
      if (activeButton) applyFilter(activeButton);
    });
  }

  function initActionMenus(scope) {
    scope.querySelectorAll("[data-action-menu]").forEach((wrap) => {
      if (wrap.dataset.actionMenuReady === "true") return;
      wrap.dataset.actionMenuReady = "true";

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
