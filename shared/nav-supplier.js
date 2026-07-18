(function () {
  const NAV_ITEMS = [
    { title: "我的产品", shortTitle: "产品", href: "products.html", icon: "box" },
    { title: "我的团期", shortTitle: "团期", href: "schedules.html", icon: "calendar" },
    { title: "订单确认", shortTitle: "订单", href: "orders.html", icon: "clipboard" },
    { title: "对账结算", shortTitle: "对账", href: "settlements.html", icon: "wallet" }
  ];

  const PAGE_ACTIVE_MAP = {
    "product-detail.html": "products.html",
    "product-edit.html": "products.html",
    "schedule-detail.html": "schedules.html",
    "schedule-create.html": "schedules.html",
    "schedule-batch.html": "schedules.html"
  };

  const bootScript = document.currentScript;
  const icons = {
    box: '<path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/>',
    clipboard: '<path d="M9 5h6"/><path d="M9 3h6v4H9z"/><path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>',
    wallet: '<path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/><path d="M16 12h5v4h-5a2 2 0 0 1 0-4Z"/><path d="M3 7l12-4 2 4"/>',
    menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>'
  };

  function resolveElement(target) {
    if (!target) return null;
    if (typeof target === "string") return document.querySelector(target);
    return target instanceof HTMLElement ? target : null;
  }

  function ensureToastContainer() {
    let container = document.querySelector(".caesar-toast-container");
    if (container) return container;
    container = document.createElement("div");
    container.className = "caesar-toast-container";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "true");
    document.body.appendChild(container);
    return container;
  }

  function showToast(message, options = {}) {
    const container = ensureToastContainer();
    const toast = document.createElement("div");
    const type = options.type || "info";
    toast.className = "caesar-toast caesar-toast-" + type;
    toast.setAttribute("role", type === "error" ? "alert" : "status");

    const content = document.createElement("div");
    if (options.title) {
      const title = document.createElement("strong");
      title.className = "caesar-toast-title";
      title.textContent = options.title;
      content.appendChild(title);
    }
    const body = document.createElement("span");
    body.className = "caesar-toast-message";
    body.textContent = message || "操作已完成";
    content.appendChild(body);
    toast.appendChild(content);
    container.appendChild(toast);

    window.setTimeout(() => {
      toast.classList.add("closing");
      window.setTimeout(() => toast.remove(), 180);
    }, Number(options.duration || 2400));
    return toast;
  }

  function openLayer(target) {
    const layer = resolveElement(target);
    if (!layer) return null;
    layer.hidden = false;
    layer.classList.remove("closing");
    layer.setAttribute("aria-hidden", "false");
    scheduleDrawerTitleSync(layer);
    requestAnimationFrame(() => layer.classList.add("show"));
    return layer;
  }

  function closeLayer(target) {
    const layer = resolveElement(target);
    if (!layer) return null;
    layer.classList.remove("show");
    layer.classList.add("closing");
    const delay = layer.classList.contains("drawer-overlay") ? 360 : 180;
    window.setTimeout(() => {
      layer.classList.remove("closing");
      layer.hidden = true;
      layer.setAttribute("aria-hidden", "true");
    }, delay);
    return layer;
  }

  const drawerTitleCapture = { title: "", time: 0 };

  function normalizeActionTitle(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/[×✕]/g, "")
      .trim();
  }

  function triggerHasLayerIntent(trigger) {
    if (!trigger || !trigger.attributes) return false;
    return Array.from(trigger.attributes).some((attr) => {
      return attr.name === "data-drawer-title" ||
        attr.name === "data-modal-title" ||
        attr.name.indexOf("data-open") === 0 ||
        attr.name.indexOf("data-view") === 0 ||
        attr.name.indexOf("data-edit") === 0 ||
        attr.name.indexOf("data-show") === 0;
    });
  }

  function triggerCanProvideDrawerTitle(trigger) {
    if (!trigger) return false;
    if (trigger.hasAttribute && (trigger.hasAttribute("data-drawer-title") || trigger.hasAttribute("data-modal-title"))) return true;
    if (trigger.matches && trigger.matches("button, [role='button']")) return true;
    return trigger.matches && trigger.matches("a.btn, a.table-action-primary, a.table-action-secondary, a.dropdown-item");
  }

  function drawerTitleFromTrigger(trigger) {
    if (!trigger) return "";
    return normalizeActionTitle(
      trigger.getAttribute("data-drawer-title") ||
      trigger.getAttribute("data-modal-title") ||
      normalizeActionTitle(trigger.textContent) ||
      trigger.getAttribute("aria-label") ||
      ""
    );
  }

  function rememberDrawerTitleTrigger(event) {
    const trigger = event.target && event.target.closest ? event.target.closest("button, a, [role='button'], [data-drawer-title], [data-modal-title]") : null;
    if (!triggerCanProvideDrawerTitle(trigger)) return;
    const title = drawerTitleFromTrigger(trigger);
    if (!title) return;
    drawerTitleCapture.title = title;
    drawerTitleCapture.time = Date.now();
  }

  function drawerDialog(layer) {
    if (!layer) return null;
    return layer.classList && layer.classList.contains("drawer-modal") ? layer : layer.querySelector(".drawer-modal");
  }

  function drawerTitleNode(layer) {
    const dialog = drawerDialog(layer);
    const header = dialog ? dialog.querySelector(":scope > .modal-header") : null;
    if (!header) return null;
    const title = header.querySelector(".modal-title");
    if (title) return title;
    const fallback = Array.from(header.children).find((child) => {
      return !child.matches(".modal-close, [data-close-modal], [data-close-drawer], [data-close-layer]");
    });
    if (!fallback) return null;
    fallback.classList.add("modal-title");
    return fallback;
  }

  function normalizeDrawerHeader(layer) {
    const dialog = drawerDialog(layer);
    if (!dialog) return;
    const header = dialog.querySelector(":scope > .modal-header");
    const title = drawerTitleNode(layer);
    if (header && title && title.parentElement !== header && title.parentElement && title.parentElement.parentElement === header) {
      title.parentElement.classList.add("drawer-title-stack");
    }
  }

  function titleForDrawer(layer, options) {
    const dialog = drawerDialog(layer);
    const capturedFresh = drawerTitleCapture.title && Date.now() - drawerTitleCapture.time < 1400;
    return normalizeActionTitle(
      (options && options.title) ||
      (capturedFresh ? drawerTitleCapture.title : "") ||
      (dialog && dialog.getAttribute("data-drawer-title")) ||
      (layer && layer.getAttribute && layer.getAttribute("data-drawer-title")) ||
      ""
    );
  }

  function lockDrawerTitle(layer, title) {
    if (!title) return;
    const node = drawerTitleNode(layer);
    if (!node) return;
    node.dataset.drawerTitleLocked = title;
    if (normalizeActionTitle(node.textContent) !== title) node.textContent = title;
    if (node.dataset.drawerTitleObserverReady === "true") return;
    node.dataset.drawerTitleObserverReady = "true";
    new MutationObserver(() => {
      const expected = node.dataset.drawerTitleLocked;
      if (expected && normalizeActionTitle(node.textContent) !== expected) {
        node.textContent = expected;
      }
    }).observe(node, { childList: true, characterData: true, subtree: true });
  }

  function syncDrawerTitle(layer, options) {
    const dialog = drawerDialog(layer);
    if (!dialog) return;
    normalizeDrawerHeader(layer);
    lockDrawerTitle(layer, titleForDrawer(layer, options));
  }

  function scheduleDrawerTitleSync(layer, options) {
    syncDrawerTitle(layer, options);
    window.setTimeout(() => syncDrawerTitle(layer, options), 0);
    window.requestAnimationFrame(() => syncDrawerTitle(layer, options));
  }

  function initDrawerTitleSemantics(scope) {
    if (document.documentElement.dataset.drawerTitleCaptureReady !== "true") {
      document.documentElement.dataset.drawerTitleCaptureReady = "true";
      document.addEventListener("click", rememberDrawerTitleTrigger, true);
    }
    scope.querySelectorAll(".modal-overlay, .drawer-modal").forEach((layer) => {
      const targetLayer = layer.classList.contains("modal-overlay") ? layer : (layer.closest(".modal-overlay") || layer);
      if (!drawerDialog(targetLayer)) return;
      normalizeDrawerHeader(targetLayer);
      if (targetLayer.dataset.drawerTitleReady === "true") return;
      targetLayer.dataset.drawerTitleReady = "true";
      new MutationObserver(() => {
        if (targetLayer.classList.contains("show") || targetLayer.getAttribute("aria-hidden") === "false" || targetLayer.hidden === false) {
          scheduleDrawerTitleSync(targetLayer);
        }
      }).observe(targetLayer, { attributes: true, attributeFilter: ["class", "hidden", "aria-hidden"] });
    });
  }


  function navigateTo(href) {
    if (!href) return;
    window.location.href = href;
  }

  function normalizeFileName() {
    const file = window.location.pathname.split("/").pop();
    return file || "products.html";
  }

  function brandLogo() {
    return [
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
  }

  function navIcon(name) {
    return '<span class="nav-icon"><svg viewBox="0 0 24 24" aria-hidden="true">' + (icons[name] || icons.box) + "</svg></span>";
  }

  function breadcrumb(activeItem) {
    return [
      '<nav class="breadcrumb" aria-label="当前位置">',
      '<span>供应商协同</span>',
      '<span>&gt;</span>',
      '<span class="current">' + activeItem.title + '</span>',
      '</nav>'
    ].join("");
  }

  function bootSupplierShell() {
    const currentFile = normalizeFileName();
    const activeHref = PAGE_ACTIVE_MAP[currentFile] || currentFile;
    const activeItem = NAV_ITEMS.find((item) => item.href === activeHref) || NAV_ITEMS[0];
    const pageNodes = Array.from(document.body.childNodes).filter((node) => {
      if (node === bootScript) return false;
      return !(node.nodeType === Node.TEXT_NODE && !node.textContent.trim());
    });

    document.body.classList.add("nav-primary-only");

    const shell = document.createElement("div");
    shell.className = "layout";
    shell.innerHTML = [
      '<aside class="sidebar">',
      '  <div class="nav-primary-rail">',
      '    <div class="sidebar-logo caesar-brand-logo" aria-label="凯撒">' + brandLogo() + '</div>',
      '    <nav class="nav-scroll nav-primary-scroll" aria-label="供应商导航">',
      NAV_ITEMS.map((item) => {
        const activeClass = item.href === activeItem.href ? " active" : "";
        return '<a class="nav-primary-item' + activeClass + '" href="' + item.href + '" title="' + item.title + '">' + navIcon(item.icon) + '<span class="nav-label">' + item.shortTitle + "</span></a>";
      }).join(""),
      "    </nav>",
      "  </div>",
      '  <div class="nav-secondary-panel" hidden></div>',
      "</aside>",
      '<main class="main-area">',
      '  <header class="topbar">',
      '    <div class="topbar-left">',
      '      <button class="nav-toggle" type="button" aria-label="收起或展开侧栏"><span class="topbar-icon"><svg viewBox="0 0 24 24" aria-hidden="true">' + icons.menu + '</svg></span></button>',
      breadcrumb(activeItem),
      "    </div>",
      '    <div class="topbar-right">',
      '      <button class="workspace-badge" type="button"><span class="workspace-current-text">欧洲联合地接社</span><span class="topbar-chevron"><svg viewBox="0 0 24 24" aria-hidden="true">' + icons.chevronDown + '</svg></span></button>',
      '      <div class="topbar-user"><span class="topbar-user-icon"><svg viewBox="0 0 24 24" aria-hidden="true">' + icons.user + '</svg></span><span>张敏</span></div>',
      "    </div>",
      "  </header>",
      '  <section class="content" data-page-content></section>',
      "</main>"
    ].join("");

    const content = shell.querySelector("[data-page-content]");
    pageNodes.forEach((node) => content.appendChild(node));
    const toggle = shell.querySelector(".nav-toggle");
    toggle.addEventListener("click", () => shell.classList.toggle("nav-collapsed"));

    if (bootScript && bootScript.parentNode) {
      bootScript.parentNode.insertBefore(shell, bootScript.nextSibling);
    } else {
      document.body.prepend(shell);
    }
  }

  function startSupplierShell() {
    bootSupplierShell();
    initDrawerTitleSemantics(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startSupplierShell);
  } else {
    startSupplierShell();
  }

  window.caesarNavigateTo = navigateTo;
  window.caesarUI = Object.assign({}, window.caesarUI || {}, {
    openLayer,
    closeLayer,
    openDrawer: openLayer,
    closeDrawer: closeLayer,
    openModal: openLayer,
    closeModal: closeLayer,
    syncDrawerTitle,
    toast: showToast
  });
})();
