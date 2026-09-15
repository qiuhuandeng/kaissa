const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');
const cases = {
  'performance-reports': ['primary'],
  'product-reports': ['organizations','structure','channels','crossYear'],
  'channel-reports': ['channels','stores','calls','structure']
};
(async () => {
  const browser = await chromium.launch({channel:'chrome',headless:true});
  const out=process.env.REPORT_BASIS_OUTPUT || '/private/tmp/caesar-report-basis'; fs.mkdirSync(out,{recursive:true});
  const errors=[],results=[];
  try {
    for (const [file,tabs] of Object.entries(cases)) {
      const p=await browser.newPage({viewport:{width:1440,height:1000}});
      p.on('pageerror',e=>errors.push(e.message));
      await p.goto(process.env.REPORT_BASE_URL ? process.env.REPORT_BASE_URL+'/merchant/data/'+file+'.html' : pathToFileURL(path.resolve('merchant/data/'+file+'.html')).href);
      for (const tab of tabs) {
        await p.locator('[data-report-tab="'+tab+'"]').click();
        const bar=p.locator('[data-performance-basis]:visible'); await bar.waitFor();
        assert.equal(await bar.count(),1);
        const before=await p.locator('.data-report-result-surface:visible').first().innerText();
        await bar.locator('[data-basis-value="actual"]').click();
        await p.waitForTimeout(80);
        assert.equal(await bar.locator('[data-basis-value="actual"]').getAttribute('aria-pressed'),'true');
        // Draft choices never silently change the displayed or exported query.
        assert.equal(await p.locator('.data-report-result-surface:visible').first().innerText(),before);
        await p.locator('form:visible button[type="submit"]').click();
        await p.waitForTimeout(100);
        const heading=await p.locator('.data-report-result-surface:visible h2').allTextContents();
        assert(heading.some(t=>t.includes('回团')),file+'/'+tab+': '+heading.join(','));
        if(tab!=='crossYear') assert.match(await bar.innerText(),/实际完成日期/);
        const download=p.waitForEvent('download');
        await p.locator('form:visible [data-export]').click();
        const d=await download, saved=path.join(out,file+'-'+tab+'.csv'); await d.saveAs(saved);
        assert.match(fs.readFileSync(saved,'utf8'),/实际完成|实际回团|回团金额/);
        await p.reload();await p.waitForTimeout(150);
        assert.equal(await p.locator('[data-performance-basis]:visible [data-basis-value="actual"]').getAttribute('aria-pressed'),'true');
        results.push(file+'/'+tab);
      }
      await p.screenshot({path:path.join(out,file+'.png'),fullPage:true});
      await p.setViewportSize({width:390,height:844});
      assert(await p.locator('[data-performance-basis]:visible [data-basis-value="actual"]').isVisible());
      assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await p.screenshot({path:path.join(out,file+'-narrow.png'),fullPage:true});
      await p.setViewportSize({width:1440,height:1000});
      const extra=file==='performance-reports'?'profit':file==='product-reports'?'product':'channel';
      await p.locator('[data-report-tab="'+extra+'"]').click();
      assert.equal(await p.locator('[data-performance-basis]:visible').count(),0);
      await p.close();
    }
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({passed:results.length,results,errors,output:out},null,2));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
