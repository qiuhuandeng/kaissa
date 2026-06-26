#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const scopes = ["merchant", "operator"];
const excludedPages = new Set([
  "merchant/login.html",
  "merchant/select-workspace.html",
  "operator/login.html",
  "operator/ant_design.html",
]);
const safeSharedScripts = new Set([
  "shared/fulfillment-common.js",
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

function auditFile(file) {
  const rel = relative(file);
  const html = fs.readFileSync(file, "utf8");
  const side = rel.startsWith("merchant/") ? "merchant" : "operator";
  const expectedNav = side === "merchant" ? "nav-merchant.js" : "nav-operator.js";
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
