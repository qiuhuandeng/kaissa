import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const appDirs = ["merchant", "operator", "client"];
const navFile = path.join(root, "shared", "nav-merchant.js");
const residualTerms = ["项目团期", "专属团期", "创建团期", "新建订单", "生成团体订单", "单团下单"];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return [full];
  });
}

function rel(file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function stripQueryAndHash(href) {
  return href.split("#")[0].split("?")[0];
}

function isExternalHref(href) {
  return /^(?:https?:|mailto:|tel:|sms:|javascript:|data:|app:)/i.test(href);
}

function resolveHref(fromFile, href) {
  const clean = stripQueryAndHash(href.trim());
  if (!clean || clean === "#") return null;
  if (isExternalHref(clean)) return null;
  if (clean.startsWith("/")) return path.join(root, clean.slice(1));
  return path.resolve(path.dirname(fromFile), clean);
}

function lineOf(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function extractAttr(tag, name) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match ? match[1] : "";
}

function checkInlineScripts(htmlFiles) {
  const errors = [];
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, "utf8");
    const regex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = regex.exec(content))) {
      const attrs = match[1] || "";
      const code = match[2] || "";
      if (/\bsrc\s*=/.test(attrs) || !code.trim()) continue;
      try {
        new Function(code);
      } catch (error) {
        errors.push({
          file: rel(file),
          line: lineOf(content, match.index),
          message: error.message,
        });
      }
    }
  }
  return errors;
}

function checkSharedScripts() {
  const errors = [];
  const files = walk(path.join(root, "shared")).filter((file) => file.endsWith(".js"));
  for (const file of files) {
    const code = fs.readFileSync(file, "utf8");
    try {
      new vm.Script(code, { filename: rel(file) });
    } catch (error) {
      errors.push({ file: rel(file), line: 1, message: error.message });
    }
  }
  return errors;
}

function checkNavTargets() {
  const missing = [];
  const content = fs.readFileSync(navFile, "utf8");
  const hrefRegex = /href:\s*["']([^"']+)["']/g;
  const keyRegex = /^\s*["']([^"']+\.html(?:\?[^"']*)?)["']\s*:/gm;
  const seen = new Set();
  for (const regex of [hrefRegex, keyRegex]) {
    let match;
    while ((match = regex.exec(content))) {
      const href = match[1];
      if (!href || href.startsWith("#") || isExternalHref(href)) continue;
      const target = path.join(root, "merchant", stripQueryAndHash(href));
      const key = rel(target);
      if (seen.has(key)) continue;
      seen.add(key);
      if (!fs.existsSync(target)) {
        missing.push({ href, target: key, line: lineOf(content, match.index) });
      }
    }
  }
  return missing;
}

function checkStaticHrefs(htmlFiles) {
  const broken = [];
  const hashOnly = [];
  const missingFragments = [];
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, "utf8");
    const regex = /<a\b[^>]*\bhref\s*=\s*["']([^"']*)["'][^>]*>/gi;
    let match;
    while ((match = regex.exec(content))) {
      const href = match[1].trim();
      if (!href || isExternalHref(href)) continue;
      if (href === "#") {
        hashOnly.push({ file: rel(file), line: lineOf(content, match.index), href });
        continue;
      }
      if (href.startsWith("#")) {
        const fragment = href.slice(1);
        const targetPattern = new RegExp(`\\b(?:id|name)\\s*=\\s*["']${fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "i");
        if (!targetPattern.test(content)) {
          missingFragments.push({ file: rel(file), line: lineOf(content, match.index), href });
        }
        continue;
      }
      const target = resolveHref(file, href);
      if (target && stripQueryAndHash(href).endsWith(".html") && !fs.existsSync(target)) {
        broken.push({ file: rel(file), line: lineOf(content, match.index), href, target: rel(target) });
      }
    }
  }
  return { broken, hashOnly, missingFragments };
}

function checkButtonCoverage(htmlFiles) {
  const suspects = [];
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, "utf8");
    const regex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
    let match;
    while ((match = regex.exec(content))) {
      const attrs = match[1] || "";
      const body = match[2] || "";
      const ok = /\bdata-[\w-]+/.test(attrs) ||
        /\bonclick\s*=/.test(attrs) ||
        /\bid\s*=/.test(attrs) ||
        /\bdisabled\b/.test(attrs) ||
        /\baria-controls\s*=/.test(attrs) ||
        /\btype\s*=\s*["']submit["']/.test(attrs);
      if (!ok) {
        const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        suspects.push({
          file: rel(file),
          line: lineOf(content, match.index),
          text: text.slice(0, 40),
        });
      }
    }
  }
  return suspects;
}

function checkResidualTerms(files) {
  const hits = [];
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    for (const term of residualTerms) {
      let index = content.indexOf(term);
      while (index >= 0) {
        hits.push({ file: rel(file), line: lineOf(content, index), term });
        index = content.indexOf(term, index + term.length);
      }
    }
  }
  return hits;
}

const htmlFiles = appDirs.flatMap((dir) => walk(path.join(root, dir))).filter((file) => file.endsWith(".html"));
const appTextFiles = appDirs.flatMap((dir) => walk(path.join(root, dir))).filter((file) => /\.(?:html|js|css)$/.test(file));
const docFiles = walk(path.join(root, "docs")).filter((file) => {
  if (!/\.(?:md|html|js|css)$/.test(file)) return false;
  return rel(file) !== "docs/system-hard-check-report.md";
});
const allFilesForTerms = [...appTextFiles, ...docFiles, navFile].filter((file, index, files) => files.indexOf(file) === index);

const result = {
  counts: {
    html: htmlFiles.length,
    appTextFiles: appTextFiles.length,
    docs: docFiles.length,
  },
  inlineScriptErrors: checkInlineScripts(htmlFiles),
  sharedScriptErrors: checkSharedScripts(),
  navMissingTargets: checkNavTargets(),
  hrefs: checkStaticHrefs(htmlFiles),
  buttonSuspects: checkButtonCoverage(htmlFiles),
  residualTerms: checkResidualTerms(allFilesForTerms),
};

function groupCount(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || "-";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function printSummary(data) {
  const appResidual = data.residualTerms.filter((item) => !item.file.startsWith("docs/"));
  const docResidual = data.residualTerms.filter((item) => item.file.startsWith("docs/"));
  const lines = [
    `HTML files: ${data.counts.html}`,
    `Inline script errors: ${data.inlineScriptErrors.length}`,
    `Shared script errors: ${data.sharedScriptErrors.length}`,
    `Missing nav/pageOwner targets: ${data.navMissingTargets.length}`,
    `Broken static HTML hrefs: ${data.hrefs.broken.length}`,
    `Placeholder href="#": ${data.hrefs.hashOnly.length}`,
    `Missing fragment targets: ${data.hrefs.missingFragments.length}`,
    `Button heuristic suspects: ${data.buttonSuspects.length}`,
    `Residual terms total: ${data.residualTerms.length}`,
    `Residual terms in app/shared: ${appResidual.length}`,
    `Residual terms in docs: ${docResidual.length}`,
    "",
    "Placeholder href=\"#\" by file:",
    JSON.stringify(groupCount(data.hrefs.hashOnly, "file"), null, 2),
    "",
    "Missing fragment targets by file:",
    JSON.stringify(groupCount(data.hrefs.missingFragments, "file"), null, 2),
    "",
    "Residual terms by term:",
    JSON.stringify(groupCount(data.residualTerms, "term"), null, 2),
    "",
    "Button suspects by file:",
    JSON.stringify(groupCount(data.buttonSuspects, "file"), null, 2),
  ];
  console.log(lines.join("\n"));
}

if (process.argv.includes("--summary")) {
  printSummary(result);
} else {
  console.log(JSON.stringify(result, null, 2));
}
