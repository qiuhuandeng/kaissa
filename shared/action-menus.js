(function () {
  'use strict';
  if (window.CaesarActionMenus) return;
  const menuSelector = '.action-dropdown-menu, .dropdown-menu, .table-more-menu, .product-more-menu, .pricing-table-menu';
  const toggleSelector = '[data-action-menu-toggle], .table-more-toggle, [data-row-more], [data-schedule-more], [data-product-more], [data-bulk-menu-toggle], [data-export-toggle], .pricing-table-more > [data-more-toggle]';
  const nativeSelector = 'details[data-action-menu], details.air-more, details.air-list-bulk';
  let active = null;

  function pairFor(toggle) {
    const native = toggle.matches('summary') && toggle.parentElement.matches(nativeSelector);
    const wrap = native ? toggle.parentElement : toggle.closest('[data-action-menu], .dropdown, .pricing-table-more');
    if (!wrap) return null;
    const menu = native ? Array.from(wrap.children).find(el => el !== toggle) : wrap.querySelector(menuSelector);
    return menu ? { wrap, toggle, menu, native } : null;
  }

  function close(restoreFocus) {
    if (!active) return;
    const item = active;
    active = null;
    const { wrap, toggle, menu } = item;
    if (item.topLayer) {
      try { menu.hidePopover(); } catch (_) { /* Removed menus are already closed. */ }
    }
    if (item.portal && item.parent.isConnected) item.parent.insertBefore(menu, item.next?.parentNode === item.parent ? item.next : null);
    else if (item.portal) menu.remove();
    menu.classList.remove('caesar-floating-menu', 'show');
    if (item.popover == null) menu.removeAttribute('popover');
    else menu.setAttribute('popover', item.popover);
    for (const [name, value, priority] of item.styles) {
      if (value) menu.style.setProperty(name, value, priority);
      else menu.style.removeProperty(name);
    }
    wrap.classList.remove('open');
    if (item.native) wrap.open = false;
    toggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus && toggle.isConnected) toggle.focus();
  }

  function position(item) {
    const { toggle, menu } = item;
    const edge = 8, gap = 6, r = toggle.getBoundingClientRect();
    menu.style.setProperty('left', '0px', 'important');
    menu.style.setProperty('top', '0px', 'important');
    menu.style.setProperty('max-height', Math.max(0, window.innerHeight - edge * 2) + 'px', 'important');
    const natural = menu.getBoundingClientRect();
    const below = Math.max(0, window.innerHeight - r.bottom - edge - gap);
    const above = Math.max(0, r.top - edge - gap);
    const up = natural.height > below && above > below;
    menu.style.setProperty('max-height', Math.max(0, up ? above : below) + 'px', 'important');
    const size = menu.getBoundingClientRect();
    const left = Math.max(edge, Math.min(r.right - size.width, window.innerWidth - size.width - edge));
    const top = Math.max(edge, Math.min(up ? r.top - size.height - gap : r.bottom + gap, window.innerHeight - size.height - edge));
    menu.style.setProperty('left', Math.round(left) + 'px', 'important');
    menu.style.setProperty('top', Math.round(top) + 'px', 'important');
  }

  function open(item) {
    close(false);
    const { wrap, toggle, menu } = item;
    item.parent = menu.parentNode;
    item.next = menu.nextSibling;
    item.popover = menu.getAttribute('popover');
    item.styles = ['left', 'top', 'max-height', '--caesar-menu-display'].map(name => [name, menu.style.getPropertyValue(name), menu.style.getPropertyPriority(name)]);
    active = item;
    wrap.classList.add('open');
    if (item.native) wrap.open = true;
    menu.classList.add('show');
    const display = getComputedStyle(menu).display;
    menu.style.setProperty('--caesar-menu-display', display === 'none' ? 'block' : display);
    menu.classList.add('caesar-floating-menu');
    toggle.setAttribute('aria-expanded', 'true');
    if (typeof menu.showPopover === 'function') {
      menu.setAttribute('popover', 'manual');
      try { menu.showPopover(); item.topLayer = true; } catch (_) { /* Fall back for legacy browsers. */ }
    }
    if (!item.topLayer) {
      menu.removeAttribute('popover');
      document.body.appendChild(menu);
      item.portal = true;
    }
    position(item);
  }

  function init(scope) {
    (scope || document).querySelectorAll(toggleSelector + ', ' + nativeSelector.split(', ').map(s => s + ' > summary').join(', ')).forEach(toggle => {
      if (!toggle.hasAttribute('aria-expanded')) toggle.setAttribute('aria-expanded', 'false');
    });
  }
  window.CaesarActionMenus = { init, close };
  document.addEventListener('click', event => {
    const summary = event.target.closest('summary');
    const toggle = event.target.closest(toggleSelector) || (summary?.parentElement.matches(nativeSelector) ? summary : null);
    const item = toggle && pairFor(toggle);
    if (item) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (active?.toggle === toggle) close(false);
      else open(item);
      return;
    }
    if (active?.menu.contains(event.target)) {
      if (event.target.closest('a, button, [role="menuitem"]')) {
        const current = active;
        window.setTimeout(() => { if (active === current) close(false); }, 0);
      }
      return;
    }
    close(false);
  }, true);
  document.addEventListener('scroll', event => {
    if (active && !active.menu.contains(event.target)) close(false);
  }, true);
  window.addEventListener('resize', () => close(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active) {
      event.preventDefault();
      event.stopImmediatePropagation();
      close(true);
    }
  }, true);
  new MutationObserver(() => {
    if (active && (!active.wrap.isConnected || !active.menu.isConnected || !active.wrap.classList.contains('open') || (active.native && !active.wrap.open))) close(false);
  }).observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['class','open','hidden'] });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(document));
  else init(document);
})();
