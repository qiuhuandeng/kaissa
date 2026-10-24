// 本次为现状核查；所有资料修改仅发生在独立浏览器会话或内存中。
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../..'),out=__dirname,base='http://127.0.0.1:52727/';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.setDefaultTimeout(8000);const observations=[],errors=[];
 page.on('pageerror',e=>errors.push({url:page.url(),message:e.message}));
 const record=(id,data)=>{observations.push({id,data});console.log(id);};
 const go=async p=>{await page.goto(base+'merchant/'+p);await page.locator('body').waitFor();};
 const shot=async name=>{await page.locator('.modal.show,.modal-overlay.show .modal,.crp-drawer').evaluateAll(async ns=>{for(const n of ns)await Promise.all(n.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})));});await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});};
 try{
  await go('resource/resource-cruise-companies.html');
  await page.locator('#companyKeyword').fill('皇家');await page.locator('.btn-filter-search').click();
  record('A01-company-filter',{visible:await page.locator('.cruise-company-table tbody tr:visible').count()});
  await page.locator('.cruise-company-table tbody tr').nth(1).locator('button').click();
  record('A02-company-record',{selectedRow:'皇家加勒比国际游轮',formName:await page.locator('#cruiseDrawer input').first().inputValue()});await shot('company-record-mismatch');
  await page.locator('#cruiseDrawer input').first().fill('评估修改船公司');await page.locator('#cruiseDrawer .modal-footer .btn-primary').click();
  record('A03-company-save',{savedInList:(await page.locator('.cruise-company-table').innerText()).includes('评估修改船公司')});
  await go('resource/visa-library.html');await page.locator('#visaKeyword').fill('日本');await page.locator('[data-filter-visas]').click();await page.locator('#visaRows tr:visible [data-open-visa-detail]').click();
  record('A04-visa-record',{title:await page.locator('#visaDetailCountry').innerText(),profile:await page.locator('[data-visa-panel=profile] .description-grid').innerText()});await shot('visa-record-mismatch');
  await go('tour/schedule-orders.html');record('A05-active-order-entry',{href:await page.getByRole('link',{name:'新建订单',exact:true}).getAttribute('href')});
  await page.getByRole('link',{name:'新建订单',exact:true}).click();await page.locator('#objectKeyword').fill('阳台');
  record('A06-active-order-cruise-choice',{url:page.url(),choices:await page.locator('#objectSuggestionList').innerText()});
  await go('tour/schedule-order-booking.html?type=cruise&from=quote&product='+encodeURIComponent('理想号地中海邮轮')+'&date=2025-07-20');
  record('A07-old-booking-form',{fields:await page.locator('[data-composition-input]').evaluateAll(ns=>ns.map(n=>({name:n.dataset.compositionInput,value:n.value}))),newRoomScript:await page.evaluate(()=>!!window.CaesarCruiseBooking),text:(await page.locator('#bookingDrawer').innerText()).slice(0,2600)});await shot('legacy-cruise-booking');
  await go('sales/booking.html?type=cruise&from=quote&product='+encodeURIComponent('理想号地中海邮轮')+'&date=2026-11-12');
  record('A08-sale-pricing-rules',await page.evaluate(()=>{const R=CaesarCruiseSalesRules,r=R.tariff('阳台 BA',[{id:'adultOccupancy',price:10000},{id:'second',price:8000},{id:'thirdFourth',price:6000},{id:'fourth',price:3000},{id:'childOccupancy',price:5000}]);return {rates:r,childAt2:R.quoteRoom({people:[{kind:'child',age:2,basis:'child'}]},r,'已含').lines[0],childAt15:R.quoteRoom({people:[{kind:'child',age:15,basis:'child'}]},r,'已含').lines[0]};}));
  await go('cruise/passenger-manifests.html');await page.locator('[data-rm=export]').click();let d=page.waitForEvent('download');await page.locator('[data-rm=download-manifest]').click();await(await d).saveAs(path.join(out,'assessment-manifest.xlsx'));
  await page.locator('[data-rm=submission]').click();await page.locator('[data-field=reference]').fill('AUDIT-20261024');await page.locator('[data-rm=save-submission]').click();
  await page.locator('[data-rm=person][data-id=CRP-01]').click();await page.locator('[data-field=passport]').fill('AFTER-SUBMISSION');await page.locator('[data-field=expiry]').fill('2020-01-01');await page.locator('[data-rm=save-person]').click();
  record('A09-manifest-after-change',await page.evaluate(()=>{const M=CaesarCruiseRooms,s=M.read(),p=s.people.find(p=>p.id==='CRP-01');return {currentRevision:s.revision,submissionRevision:s.submissions[0].revision,changedPassport:p.passport,expiredPassport:p.expiry,missing:M.missing(p),submitted:s.submissions.length};}));await shot('expired-passport-marked-complete');
  await page.locator('[data-tab=submitted]').click();record('A10-submission-current-display',{text:await page.locator('#cruiseRoomPage').innerText()});await shot('submission-no-change-indicator');
  await go('tour/schedules-detail.html?type=cruise&scheduleNo=CZ20261112001&tab=roster');await page.locator('#cruiseRosterView').selectOption('cabins');
  record('A11-original-room-entry',{actions:await page.locator('#cruiseCabinRows button').allTextContents()});
  await go('cruise/room-assignments.html');record('A12-new-room-entry',{actions:await page.locator('#cruiseRoomPage [data-rm=assign]').allTextContents()});
  await go('cruise/procurement-contracts.html?id=HT-YL-002');await page.locator('.crp-drawer').waitFor();
  record('A13-guaranteed-contract',{text:(await page.locator('.crp-drawer').innerText()).slice(0,6500),links:await page.locator('.crp-drawer a').evaluateAll(ns=>ns.map(n=>({text:n.textContent,href:n.getAttribute('href')})))});
 }catch(e){record('audit-incomplete',{error:e.stack});process.exitCode=1;}
 finally{fs.writeFileSync(path.join(out,'observations.json'),JSON.stringify({scope:'全流程现状抽查，非修复验收；模拟数据仅改于独立浏览器会话',observations,errors},null,2));await browser.close();}
})();
