#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const scopes = ["merchant", "operator", "admin"];
const excludedPages = new Set([
  "merchant/login.html",
  "merchant/workspace.html",
  "merchant/select-workspace.html",
  "operator/login.html",
  "operator/ant_design.html",
]);
const safeSharedScripts = new Set([
  "shared/fulfillment-common.js",
  "shared/route-edit-page.js",
  "shared/schedule-builder-page.js",
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && entry.name.endsWith(".html") ? [full] : [];
  });
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function lineOf(text, index) {
  return text.slice(0, Math.max(index, 0)).split(/\r?\n/).length;
}

function firstBodyNode(html) {
  const bodyMatch = html.match(/<body\b[^>]*>/i);
  if (!bodyMatch) return { fragment: "", index: -1 };
  const start = bodyMatch.index + bodyMatch[0].length;
  const after = html.slice(start);
  const cleaned = after.replace(/^\s*(?:<!--[\s\S]*?-->\s*)*/, "");
  return { fragment: cleaned.slice(0, 240), index: start + after.length - cleaned.length };
}

function addIssue(issues, severity, message, index, text) {
  issues.push({
    severity,
    message,
    line: typeof index === "number" && index >= 0 ? lineOf(text, index) : null,
  });
}

function attrValues(html, tagName, attrName) {
  const values = [];
  const tagPattern = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  let tagMatch;
  while ((tagMatch = tagPattern.exec(html))) {
    const tag = tagMatch[0];
    const attrPattern = new RegExp(`${attrName}\\s*=\\s*["']([^"']+)["']`, "i");
    const attrMatch = tag.match(attrPattern);
    if (attrMatch) values.push({ value: attrMatch[1], index: tagMatch.index, tag });
  }
  return values;
}

function parseElements(html) {
  const tagPattern = /<(!--[^]*?--|!DOCTYPE[^>]*|\/?[a-zA-Z][\w:-]*(?:\s[^<>]*?)?)>/g;
  const stack = [];
  const elements = [];
  let match;

  while ((match = tagPattern.exec(html))) {
    const body = match[1];
    if (body.startsWith("!")) continue;

    const isClosing = body.startsWith("/");
    const isSelfClosing = /\/\s*$/.test(body) || /^(link|meta|input|br|img|hr)\b/i.test(body);

    if (isClosing) {
      const tag = body.slice(1).trim().toLowerCase();
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (stack[index].tag === tag) {
          const element = stack.splice(index, 1)[0];
          element.closeStart = match.index;
          element.closeEnd = tagPattern.lastIndex;
          break;
        }
      }
      continue;
    }

    const tag = (body.match(/^([a-zA-Z][\w:-]*)/) || [])[1]?.toLowerCase();
    if (!tag) continue;

    const attrs = body.slice(tag.length).replace(/\/\s*$/, "");
    const element = {
      tag,
      attrs,
      start: match.index,
      openEnd: tagPattern.lastIndex,
      closeStart: null,
      closeEnd: null,
      parent: stack[stack.length - 1] || null,
      children: [],
    };
    if (element.parent) element.parent.children.push(element);
    elements.push(element);
    if (!isSelfClosing) stack.push(element);
  }

  elements.forEach((element) => {
    if (element.closeStart === null) {
      element.closeStart = element.openEnd;
      element.closeEnd = element.openEnd;
    }
  });

  return elements;
}

function classListOf(element) {
  return ((element.attrs.match(/class=["']([^"']*)["']/) || [])[1] || "").split(/\s+/).filter(Boolean);
}

function hasClass(element, className) {
  return classListOf(element).includes(className);
}

function ancestorsOf(element) {
  const ancestors = [];
  for (let parent = element.parent; parent; parent = parent.parent) ancestors.push(parent);
  return ancestors;
}

function nearestListSurface(element) {
  return ancestorsOf(element).find((ancestor) => {
    return hasClass(ancestor, "list-surface") || ancestor.attrs.includes("data-list-surface");
  }) || null;
}

function nextMeaningfulSibling(element) {
  const siblings = element.parent ? element.parent.children : [];
  const index = siblings.indexOf(element);
  if (index < 0) return null;
  return siblings.slice(index + 1).find((sibling) => {
    const classes = classListOf(sibling);
    return !classes.some((name) => ["list-empty-state", "list-state-panel"].includes(name)) && !sibling.attrs.includes("data-list-empty");
  }) || null;
}

function isListTableElement(element, html) {
  if (!hasClass(element, "table-wrap")) return false;
  if (!html.slice(element.openEnd, element.closeStart).includes("<table")) return false;
  if (hasClass(element, "drawer-table-wrap") || hasClass(element, "modal-table-wrap")) return false;
  if (ancestorsOf(element).some((ancestor) => {
      return classListOf(ancestor).some((name) => ["modal", "drawer-modal", "modal-overlay", "detail-card", "form-card"].includes(name));
  })) return false;

  const surface = nearestListSurface(element);
  if (!surface) return false;

  const next = nextMeaningfulSibling(element);
  const nextClasses = next ? classListOf(next) : [];
  const hasPaginationSibling = nextClasses.includes("pagination") || nextClasses.includes("list-surface-pagination");
  const surfaceContent = html.slice(surface.openEnd, surface.closeStart);
  const surfaceLooksLikeList = /filter-card|list-surface-filter|tab-bar|list-surface-tabs/.test(surfaceContent);

  return hasClass(element, "list-table-with-pagination") || hasPaginationSibling || surfaceLooksLikeList;
}

function innerHtml(html, element) {
  return html.slice(element.openEnd, element.closeStart);
}

function cellHtml(html, element) {
  const closeTag = `</${element.tag}>`;
  const closeIndex = html.indexOf(closeTag, element.openEnd);
  if (closeIndex >= element.openEnd && closeIndex <= element.closeStart) {
    return html.slice(element.openEnd, closeIndex);
  }
  return innerHtml(html, element);
}

function decodeText(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#215;/g, "×");
}

function plainText(fragment) {
  return decodeText(fragment.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, "")
    .trim();
}

function elementText(html, element) {
  return plainText(innerHtml(html, element));
}

function cellText(html, element) {
  return plainText(cellHtml(html, element));
}

function descendantsOf(element, predicate = () => true) {
  const found = [];
  const visit = (node) => {
    node.children.forEach((child) => {
      if (predicate(child)) found.push(child);
      visit(child);
    });
  };
  visit(element);
  return found;
}

function directCells(row) {
  return row.children.filter((child) => child.tag === "td" || child.tag === "th");
}

function isDangerAction(label) {
  return /删除|停用|禁用|作废|拒绝|下架|撤回|取消|解绑|暂停|放弃|驳回|归档/.test(label);
}

function actionMenuRanges(fragment) {
  const ranges = [];
  const menuPattern = /<(span|div)\b[^>]*class=["'][^"']*(?:action-dropdown-menu|dropdown-menu|table-more-menu)[^"']*["'][^>]*>/gi;
  let match;
  while ((match = menuPattern.exec(fragment))) {
    const tag = match[1].toLowerCase();
    const start = match.index;
    const tagPattern = new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi");
    tagPattern.lastIndex = menuPattern.lastIndex;
    let depth = 1;
    let tagMatch;
    let end = fragment.length;
    while ((tagMatch = tagPattern.exec(fragment))) {
      depth += tagMatch[0][1] === "/" ? -1 : 1;
      if (depth === 0) {
        end = tagPattern.lastIndex;
        break;
      }
    }
    ranges.push([start, end]);
  }
  return ranges;
}

function parseActionControls(fragment) {
  const ranges = actionMenuRanges(fragment);
  const controls = [];
  const controlPattern = /<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = controlPattern.exec(fragment))) {
    const attrs = match[2] || "";
    const label = plainText(match[3]);
    if (!label) continue;
    const classes = (attrs.match(/class=["']([^"']*)["']/i) || [])[1] || "";
    controls.push({
      label,
      attrs,
      inMenu: ranges.some(([start, end]) => match.index >= start && match.index < end),
      isToggle: classes.split(/\s+/).includes("table-more-toggle") || label === "更多",
      isPrimary: classes.split(/\s+/).includes("table-action-primary"),
      index: match.index,
    });
  }
  return controls;
}

function auditActionColumn(tableWrap, elements, html, issues) {
  descendantsOf(tableWrap, (element) => element.tag === "table").forEach((table) => {
    const thead = descendantsOf(table, (element) => element.tag === "thead")[0] || null;
    const headerRows = descendantsOf(thead || table, (element) => element.tag === "tr");
    const headerRow = headerRows[headerRows.length - 1];
    if (!headerRow) return;

    const headers = directCells(headerRow);
    const actionIndexes = headers
      .map((cell, index) => (/^(操作|动作|管理)$/.test(cellText(html, cell)) ? index : -1))
      .filter((index) => index >= 0);
    if (!actionIndexes.length) return;

    const bodyRows = descendantsOf(table, (element) => element.tag === "tbody")
      .flatMap((tbody) => descendantsOf(tbody, (element) => element.tag === "tr"));

    bodyRows.forEach((row) => {
      const cells = directCells(row);
      actionIndexes.forEach((index) => {
        const cell = cells[index];
        if (!cell || /colspan\s*=/i.test(cell.attrs)) return;
        const fragment = cellHtml(html, cell);
        const text = plainText(fragment);
        if (!text) return;

        if (!/\btable-action\b/.test(fragment)) {
          addIssue(issues, "blocker", "操作单元格必须使用 .table-action 统一结构", cell.start, html);
          return;
        }

        const controls = parseActionControls(fragment);
        const visible = controls.filter((control) => !control.inMenu && !control.isToggle);
        const menuItems = controls.filter((control) => control.inMenu && !control.isToggle);
        const toggles = controls.filter((control) => control.isToggle && !control.inMenu);

        if (visible.length > 3) {
          addIssue(issues, "blocker", "操作列直露动作不能超过 3 个，低频动作必须进入更多", cell.start, html);
        }

        visible.forEach((control) => {
          if ([...control.label].length > 4) {
            addIssue(issues, "blocker", `操作文案“${control.label}”超过 4 个字，应缩短或放入更多`, cell.start + control.index, html);
          }
          if (isDangerAction(control.label)) {
            addIssue(issues, "blocker", `危险操作“${control.label}”不能直露，必须放入更多菜单底部`, cell.start + control.index, html);
          }
        });

        if (visible.length && !visible.some((control) => control.isPrimary)) {
          addIssue(issues, "blocker", "操作列必须显式标注一个主业务动作 .table-action-primary", cell.start, html);
        }

        if (toggles.length) {
          if (!/class=["'][^"']*\bdropdown\b[^"']*\btable-action-more\b[^"']*["']/.test(fragment) || !/\baction-dropdown-menu\b/.test(fragment)) {
            addIssue(issues, "blocker", "更多菜单必须使用 .dropdown.table-action-more + .table-more-toggle + .action-dropdown-menu 结构", cell.start, html);
          }
          toggles.forEach((toggle) => {
            if (toggle.label !== "更多") {
              addIssue(issues, "blocker", "更多按钮必须显示“更多”文字，不能只放箭头或其他文案", cell.start + toggle.index, html);
            }
          });
          if (!menuItems.length) {
            addIssue(issues, "blocker", "更多按钮必须有可点击的菜单项", cell.start, html);
          }
          const firstDanger = menuItems.findIndex((control) => isDangerAction(control.label));
          if (firstDanger >= 0 && menuItems.slice(firstDanger + 1).some((control) => !isDangerAction(control.label))) {
            addIssue(issues, "blocker", "更多菜单中的危险项必须放在菜单底部", cell.start, html);
          }
        }
      });
    });
  });
}

function auditFile(file) {
  const rel = relative(file);
  const html = fs.readFileSync(file, "utf8");
  const side = rel.startsWith("merchant/") ? "merchant" : rel.startsWith("admin/") ? "admin" : "operator";
  const expectedNav = side === "merchant" ? "nav-merchant.js" : side === "admin" ? "nav-admin.js" : "nav-operator.js";
  const issues = [];
  const isExcluded = excludedPages.has(rel);

  if (isExcluded) {
    return {
      file: rel,
      side,
      excluded: true,
      issues: [{ severity: "excluded", message: "不纳入后台内容路由审计范围", line: null }],
    };
  }

  const stylesheetLinks = attrValues(html, "link", "href").filter((item) => {
    return /\bstylesheet\b/i.test(item.tag);
  });
  const sharedStyles = stylesheetLinks.filter((item) => item.value.endsWith("shared/style.css"));
  if (stylesheetLinks.length !== 1 || sharedStyles.length !== 1) {
    addIssue(issues, "blocker", "head 中必须且只应引用一次 shared/style.css", stylesheetLinks[0] ? stylesheetLinks[0].index : 0, html);
  }

  const body = firstBodyNode(html);
  if (!body.fragment) {
    addIssue(issues, "blocker", "缺少 body，无法被内容路由抽取", 0, html);
  } else if (!/^<script\b[^>]*src=["'][^"']*shared\/nav-[^"']+\.js["'][^>]*>\s*<\/script>/i.test(body.fragment)) {
    addIssue(issues, "blocker", `body 第一个子元素必须是 shared/${expectedNav}`, body.index, html);
  } else if (!body.fragment.includes(expectedNav)) {
    addIssue(issues, "blocker", `当前目录应引用 shared/${expectedNav}`, body.index, html);
  }

  const styleIndex = html.search(/<style\b/i);
  if (styleIndex >= 0) {
    addIssue(issues, "blocker", "页面存在内联 style，必须迁移到 shared/style.css", styleIndex, html);
  }

  const classPattern = /class=["']([^"']+)["']/gi;
  let classMatch;
  while ((classMatch = classPattern.exec(html))) {
    const shellClass = classMatch[1].split(/\s+/).find((name) => {
      return ["layout", "sidebar", "topbar", "main-area", "content"].includes(name);
    });
    if (shellClass) {
      addIssue(issues, "blocker", `页面自建后台外壳类 ${shellClass}，内容路由不能重复嵌套外壳`, classMatch.index, html);
    }
  }

  attrValues(html, "script", "src").forEach((script) => {
    if (script.value.includes(expectedNav)) return;
    const normalizedScript = script.value.replace(/^(?:\.\.\/)+/, "").replace(/^\.\//, "");
    if (safeSharedScripts.has(normalizedScript)) {
      return;
    }
    if (/^https?:\/\//i.test(script.value)) {
      addIssue(issues, "high", `引用外部脚本 ${script.value}，内容路由下存在加载时序和网络依赖风险`, script.index, html);
      return;
    }
    addIssue(issues, "medium", `引用页面额外脚本 ${script.value}，需要确认可重复初始化`, script.index, html);
  });

  let match;
  const domReadyPattern = /DOMContentLoaded|window\.onload|document\.onreadystatechange/gi;
  while ((match = domReadyPattern.exec(html))) {
    addIssue(issues, "high", "页面初始化依赖整页生命周期事件，PJAX 替换内容后不会自然触发", match.index, html);
  }

  const hardNavPattern = /(?:window\.)?location\.(?:href|assign|replace)\s*=|(?:window\.)?location\.(?:assign|replace)\s*\(/gi;
  while ((match = hardNavPattern.exec(html))) {
    addIssue(issues, "high", "页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转", match.index, html);
  }

  const syntheticLinkNavPattern = /document\.createElement\s*\(\s*["']a["']\s*\)[\s\S]{0,360}\.click\s*\(/gi;
  while ((match = syntheticLinkNavPattern.exec(html))) {
    addIssue(issues, "high", "页面存在模拟 a 标签点击跳转，会绕过 file/http 统一内容路由", match.index, html);
  }

  const routerFallbackPattern = /if\s*\(\s*window\.caesarNavigateTo\s*\)[\s\S]{0,360}(?:document\.createElement\s*\(\s*["']a["']\s*\)|(?:window\.)?location\.)/gi;
  while ((match = routerFallbackPattern.exec(html))) {
    addIssue(issues, "high", "页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由", match.index, html);
  }

  const rowClickHardNav = /addEventListener\s*\(\s*["']click["'][\s\S]{0,240}(?:window\.)?location\.(?:href|assign|replace)/gi;
  if (rowClickHardNav.test(html)) {
    addIssue(issues, "medium", "存在点击事件内硬跳转，表格行/卡片跳转应交给统一路由器", html.search(rowClickHardNav), html);
  }

  attrValues(html, "form", "action").forEach((form) => {
    addIssue(issues, "medium", `存在 form action=${form.value}，提交行为需要确认不会整页刷新`, form.index, html);
  });

  const elements = parseElements(html);
  elements.filter((element) => isListTableElement(element, html)).forEach((table) => {
    auditActionColumn(table, elements, html, issues);

    if (!hasClass(table, "list-surface-table") || !hasClass(table, "list-table-with-pagination")) {
      addIssue(issues, "blocker", "列表表格必须使用 list-surface-table list-table-with-pagination 标准类", table.start, html);
    }

    const paginationInTable = elements.find((element) => {
      if (element.start <= table.openEnd || element.closeEnd >= table.closeEnd) return false;
      const classes = classListOf(element);
      return classes.includes("pagination") || classes.includes("list-surface-pagination");
    });
    if (paginationInTable) {
      addIssue(issues, "blocker", "分页不能放在 table-wrap 内，横向滚动只能属于表格区域", paginationInTable.start, html);
    }

    const next = nextMeaningfulSibling(table);
    const nextClasses = next ? classListOf(next) : [];
    if (!next || !(nextClasses.includes("pagination") || nextClasses.includes("list-surface-pagination"))) {
      addIssue(issues, "blocker", "列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点", table.closeEnd, html);
      return;
    }

    if (!nextClasses.includes("list-surface-pagination") || !nextClasses.includes("list-pagination-attached")) {
      addIssue(issues, "blocker", "分页 footer 必须使用 list-surface-pagination list-pagination-attached 标准类", next.start, html);
    }
  });

  return { file: rel, side, excluded: false, issues };
}

function severityRank(severity) {
  return { blocker: 4, high: 3, medium: 2, low: 1, excluded: 0 }[severity] || 0;
}

function pageStatus(page) {
  if (page.excluded) return "excluded";
  if (!page.issues.length) return "ready";
  return page.issues.reduce((max, issue) => {
    return severityRank(issue.severity) > severityRank(max) ? issue.severity : max;
  }, "low");
}

const pages = scopes.flatMap((scope) => walk(path.join(root, scope))).map(auditFile);
const included = pages.filter((page) => !page.excluded);
const byStatus = pages.reduce((acc, page) => {
  const status = pageStatus(page);
  acc[status] = (acc[status] || 0) + 1;
  return acc;
}, {});

function issueSummary(page) {
  if (!page.issues.length) return "可直接纳入内容路由";
  return page.issues
    .map((issue) => {
      const line = issue.line ? `:${issue.line}` : "";
      return `[${issue.severity}]${line} ${issue.message}`;
    })
    .join("；");
}

const report = [
  "# 页面内容路由规范审计",
  "",
  `审计时间：${new Date().toISOString()}`,
  "",
  "## 汇总",
  "",
  `- 审计后台页面：${included.length}`,
  `- 可直接接入：${byStatus.ready || 0}`,
  `- 阻断问题：${byStatus.blocker || 0}`,
  `- 高风险：${byStatus.high || 0}`,
  `- 中风险：${byStatus.medium || 0}`,
  `- 排除页面：${byStatus.excluded || 0}`,
  "",
  "## 判定标准",
  "",
  "- blocker：不满足后台内容页基本结构，必须先修正。",
  "- high：能加载但无刷新路由后很可能触发整页跳转或初始化失败。",
  "- medium：需要人工确认或做轻量改造，不一定阻断首批接入。",
  "- ready：当前规则下可直接接入内容路由。",
  "",
  "## 页面明细",
  "",
  "| 状态 | 页面 | 问题 |",
  "| --- | --- | --- |",
  ...pages
    .sort((a, b) => severityRank(pageStatus(b)) - severityRank(pageStatus(a)) || a.file.localeCompare(b.file))
    .map((page) => `| ${pageStatus(page)} | ${page.file} | ${issueSummary(page).replace(/\|/g, "\\|")} |`),
  "",
].join("\n");

const outFile = path.join(root, "shared", "page-audit-report.md");
fs.writeFileSync(outFile, report, "utf8");

console.log(report);
