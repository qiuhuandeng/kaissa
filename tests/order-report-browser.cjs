const { selectQueryView } = require('./finance-report-browser-support.cjs');
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

async function main() {
  const output = process.env.REPORT_QA_DIR || "/private/tmp/caesar-order-report-qa";
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const results = [], errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    page.on("pageerror", e => errors.push(e.message));
    const root = page.locator('.finance-report-page');
    const select = (key, value) => root.locator(`[name="${key}"]`).selectOption(value);
    const submit = () => root.locator('button[type="submit"]').click();
    const total = () => root.locator('[data-total]').innerText();
    const rows = () => root.locator('[data-table="main"] tbody tr').count();
    const download = async () => {
      const pending = page.waitForEvent("download");
      await root.locator('[data-export]').click();
      const file = await pending;
      const target = path.join(output, file.suggestedFilename());
      await file.saveAs(target);
      return fs.readFile(target, "utf8");
    };
    await page.goto((process.env.REPORT_BASE_URL || "http://127.0.0.1:8000") + "/merchant/data/order-report-details.html");
    await root.locator('[data-total]').waitFor();
    assert.match(await total(), /5\.40/);
    assert.equal(await root.locator('[data-table="main"] th').count(), 12);
    await page.screenshot({ path: path.join(output, "desktop-default.png"), fullPage: true });
    await root.locator('.report-columns > summary').click();
    assert.equal(await root.locator('.report-order-column-groups fieldset').count(), 5);
    for (const key of ["order", "product"]) assert.equal(await root.locator(`[data-column="${key}"]`).isDisabled(), true);
    for (const key of ["salesLeader", "productLeader", "productCompany", "contractCompany", "geographyZone", "managementZone", "destinations", "incomeMethod", "taxTreatment", "received"]) {
      await root.locator(`[data-column="${key}"]`).check();
    }
    let csv = await download();
    assert.match(csv, /"销售部门领导"/);
    assert.match(csv, /"C公司（演示）"/);
    assert.match(csv, /"法国、意大利"/);
    assert.match(csv, /"未分配到销售内容"/);
    await page.screenshot({ path: path.join(output, "desktop-columns.png"), fullPage: true });
    results.push("12 default columns; five field groups; identifiers locked; supplemental values exported");

    await root.locator('.report-columns > summary').click();
    await root.locator('.report-more > summary').click();
    await select("salesLeader", "赵主管（演示）");
    await select("company", "B");
    assert.equal(await root.locator('[name="salesLeader"]').inputValue(), "");
    assert.ok(!(await root.locator('[name="salesDepartment"]').innerText()).includes("A呼叫中心"));
    await select("company", "");
    await select("productCompany", "B");
    await select("company", "A");
    await submit();
    assert.equal(await rows(), 1);
    assert.match(await total(), /1\.00/);
    csv = await download();
    assert.match(csv, /"产品经营公司","B公司（演示）"/);
    results.push("sales and product responsibility filter independently; sales-company change clears incompatible department");

    await page.locator('[data-report-tab=orders]').click(); await root.locator('[data-reset]').click();
    await select("unit", "yuan");
    await submit();
    await root.locator('[data-page-size]').selectOption("5");
    assert.equal(await rows(), 5);
    await select("salesDepartment", "门店销售部（演示）");
    await root.locator('[data-sort="amount"]').click();
    await root.locator('[data-page="1"]').click();
    csv = await download();
    assert.equal((csv.match(/^"O\d+"/gm) || []).length, 6);
    assert.match(csv, /54,000\.00/);
    assert.match(csv, /"销售部门","全部"/);
    await submit();
    assert.match(await total(), /15,000\.00/);
    csv = await download();
    assert.equal((csv.match(/^"O\d+"/gm) || []).length, 3);
    assert.match(csv, /"销售部门","门店销售部（演示）"/);
    results.push("unqueried filters never enter sorting/pagination/export; export covers all rows");

    await page.locator('[data-report-tab=orders]').click(); await root.locator('[data-reset]').click();
    await select("status", "未确认");
    assert.equal(await root.locator('[name="dateBasis"]').inputValue(), "created");
    assert.equal(await root.locator('[name="dateBasis"]').isDisabled(), true);
    await submit();
    assert.equal(await rows(), 1);
    assert.match(await total(), /待确认/);
    assert.ok(!(await total()).includes("合计 0.00"));
    csv = await download();
    assert.match(csv, /"日期依据","订单创建日期"/);
    assert.match(csv, /订单创建期间截至日净值/);
    await select("status", "全部");
    await select("dateBasis", "confirmed");
    await submit();
    csv = await download();
    assert.ok(!csv.includes('"O08"'));
    await select("dateBasis", "created");
    await submit();
    csv = await download();
    assert.ok(csv.includes('"O08"'));
    results.push("unconfirmed orders use creation date; all-status query uses exactly one date basis; no fake zero");

    await page.locator('[data-report-tab=orders]').click(); await root.locator('[data-reset]').click();
    await select("salesLeader", "__missing");
    await submit();
    assert.equal(await rows(), 1);
    assert.match(await total(), /0\.90/);
    await page.locator('[data-report-tab=orders]').click(); await root.locator('[data-reset]').click();
    await select("geographyZone", "欧洲");
    await select("managementZone", "海岛经营区（演示）");
    await submit();
    assert.equal(await rows(), 0);
    assert.match(await root.locator('.report-empty').innerText(), /无匹配/);
    await page.locator('[data-report-tab=orders]').click(); await root.locator('[data-reset]').click();
    await selectQueryView(page, 'changes');
    await submit();
    assert.match(await total(), /5\.30/);
    csv = await download();
    assert.ok(!csv.includes('"日期依据"'));
    assert.ok(!csv.includes('"订单状态"'));
    await root.locator('.report-columns > summary').click();
    for (const key of ["record", "order", "product"]) assert.equal(await root.locator(`[data-column="${key}"]`).isDisabled(), true);
    results.push("missing-data and independent destination filters; changes retain 53,000 and exclude inapplicable metadata");

    await page.locator('[data-report-tab=orders]').click(); await root.locator('[data-reset]').click();
    await root.locator('[name="start"]').fill("2026-05-07");
    await root.locator('[name="end"]').fill("2026-05-01");
    await submit();
    assert.equal(await root.locator('[data-error]').isVisible(), true);
    assert.match(await total(), /5\.40/);
    await page.locator('[data-report-tab=orders]').click(); await root.locator('[data-reset]').click();
    assert.equal(await root.locator('[data-table="main"] tbody a, [data-table="main"] tbody button').count(), 0);
    const beforeUrl = page.url();
    await root.locator('[data-table="main"] tbody td').first().click();
    assert.equal(page.url(), beforeUrl);
    assert.equal(await root.locator('[role="dialog"]').count(), 0);

    await page.setViewportSize({ width: 390, height: 844 });
    await root.locator('.report-more > summary').click();
    if (await root.locator('.report-columns').getAttribute('open') !== null) await root.locator('.report-columns > summary').click();
    await page.locator('.content').evaluate(e => { e.scrollTop = 0; });
    await page.screenshot({ path: path.join(output, "mobile-default.png"), fullPage: true });
    await root.locator('.report-columns > summary').click();
    const keys = await root.locator('[data-column]:not(:disabled)').evaluateAll(es => es.map(e => e.dataset.column));
    for (const key of keys) await root.locator(`[data-column="${key}"]`).check();
    const overflow = await page.evaluate(() => ({ page: document.documentElement.scrollWidth > innerWidth + 1,
      table: document.querySelector('.report-table-scroll').scrollWidth > document.querySelector('.report-table-scroll').clientWidth }));
    assert.equal(overflow.page, false);
    assert.equal(overflow.table, true);
    assert.equal(await root.locator('.report-order-column-groups').evaluate(e => e.scrollWidth > e.clientWidth + 1), false);
    await page.getByRole('button', { name: '收起或展开侧栏' }).click();
    await page.waitForFunction(() => document.querySelector('.finance-report-page').clientWidth > 280);
    await page.locator('.content').evaluate(e => { e.scrollTop = 0; });
    await page.screenshot({ path: path.join(output, "mobile-collapsed-nav.png") });
    await root.locator('.report-order-column-groups fieldset').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, "mobile-columns.png") });
    await root.locator('.report-columns > summary').click();
    await root.locator('.report-table-scroll').evaluate(e => { e.scrollLeft = e.scrollWidth; });
    await root.locator('.report-section').screenshot({ path: path.join(output, "mobile-table-right.png") });
    results.push("invalid date retains results; no business drilldowns; mobile all-columns stays inside scroll container");

    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const [file, heading] of [["performance-reports.html", "经营总览"], ["product-reports.html", "产品分析"], ["return-report-details.html", "回团明细"]]) {
      await page.goto(new URL(file, page.url()).href);
      await root.locator('[data-total]').first().waitFor();
      assert.equal(await root.locator('h1').innerText(), heading);
      assert.equal(await root.locator('[name="salesLeader"]').count(), 1);
      assert.ok(await root.locator('[data-table="main"] tbody tr').count() > 0);
      assert.ok((await download()).includes("演示数据，非财务实绩"));
      await page.setViewportSize({ width: 390, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    results.push("overview, product and return reports load/export in desktop and mobile; all share detail ownership filters");
    assert.deepEqual(errors, []);
    await fs.writeFile(path.join(output, "results.json"), JSON.stringify({ results, errors }, null, 2));
    console.log(JSON.stringify({ output, results, errors }, null, 2));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
