/* Real-browser acceptance in an isolated context; no external approval requests. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/Users/qiu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/evidence/approval-template-actions-20261021');
const base=process.env.APPROVAL_BASE_URL||'http://127.0.0.1:8877/',key='caesar-approval-configuration-v1';
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),checks=[],errors=[];
  page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(base)||r.request().url().startsWith('file:')?r.continue():r.abort());
  const check=(name,result)=>{assert(result,name);checks.push(name);console.log('PASS '+name);};
  const layer=()=>page.locator('.ac-layer.show').last(),pause=()=>page.waitForTimeout(280);
  const shot=async name=>{await pause();await page.screenshot({path:path.join(out,name+'.png')});};
  const data=()=>page.evaluate(k=>JSON.parse(sessionStorage.getItem(k)),key);
  const close=async()=>{await layer().locator('[data-ac-close]').first().click();await pause();};
  const create=async()=>{await page.locator('.ac-create-menu>button').click();await page.getByRole('menuitem',{name:'新建志远模板'}).click();await pause();};
  const save=async()=>{await layer().locator('[data-zhiyuan-save]').click();await pause();};
  const row=id=>page.locator('[data-template-id="'+id+'"]');
  const more=async(id,action)=>{await row(id).locator('[data-ac=template-more]').click();await page.locator('.caesar-floating-menu [data-action="'+action+'"]').click();await pause();};
  const action=more;
  const primary=async(id,label)=>check(label+'状态仅一个主按钮和更多',await row(id).locator('.table-action').evaluate((el,label)=>el.children.length===2&&el.firstElementChild.textContent===label&&el.lastElementChild.matches('.table-action-more'),label));
  const publish=async id=>{await action(id,'publish');await layer().locator('[data-template-publish]').click();await pause();};
  const toggle=async(id,value)=>{await action(id,value);await layer().locator('[data-ac-confirm]').click();await pause();};
  const edit=async id=>{const direct=row(id).locator('[data-ac=zhiyuan-open][data-mode=edit]');if(await direct.count()){await direct.click();await pause();}else await more(id,'edit');};
  try{
    await page.goto(base+'admin/approval-config.html?role=sales');
    check('搜索在上、Tab及表格在下，无内容区重复标题',await page.locator('#approvalConfigArea').evaluate(el=>el.firstElementChild.matches('form')&&!!el.querySelector('.ac-tabs + .ac-table-wrap'))&&await page.locator('.list-page-head').count()===0);
    check('筛选提供模板类型和统一四种状态', (await page.locator('[data-ac-search] [name=provider] option').allTextContents()).join('|')==='全部模板类型|系统模板|志远模板'&&(await page.locator('[data-ac-search] [name=status] option').allTextContents()).join('|')==='全部状态|草稿|待发布|已发布|已停用');
    await page.locator('.ac-create-menu>button').click();
    check('新建下拉仅系统模板和志远模板两个入口',(await page.locator('.caesar-floating-menu [role=menuitem]').allTextContents()).join('|')==='新建系统模板|新建志远模板');
    await shot('create-menu');await page.getByRole('menuitem',{name:'新建系统模板'}).click();
    await page.waitForURL('**/approval-template-edit.html');
    check('系统模板仍进入原三页签及流程配置',await page.locator('.ac-steps [role=tab]').count()===3&&await page.locator('[data-ac=applicant]').count()===1&&await page.locator('[data-ac=publish]').count()===1);
    await page.goto(base+'admin/approval-config.html');await create();
    check('志远抽屉默认有公司、部门、模板编号、10个字段及启用选项',await layer().locator('[name=company]:checked').count()===2&&await layer().locator('[name=departmentMode][value=all]').isChecked()&&await layer().locator('[name=templateCode]').inputValue()==='ZY-PAY-001'&&await layer().locator('[data-zhiyuan-field]').count()===10&&await layer().locator('[name=enabled]').isChecked());
    const labels=await layer().innerText();
    check('截图中的8个系统标签均可配置，且没有载入按钮',['$applicant_department','$ticket_member','$solution_images','$exchange_names','$exchange_quantities','$ticket_customer','$ticket_store','$solution_content'].every(t=>labels.includes(t))&&!labels.includes('载入示例')&&!labels.includes('钉钉字段'));
    check('志远模板没有内部流程节点或发布入口',await layer().locator('.ac-flow,[data-ac=trial],[data-ac=publish]').count()===0);
    check('模板内容编辑框有足够可视高度',(await layer().locator('[name=templateContent]').boundingBox()).height>=240);
    await shot('drawer-top');
    await layer().locator('[data-mapping-mode="application-type"]').selectOption('fixed');
    await layer().locator('[data-mapping-value="application-type"]').fill('预付款');
    await layer().locator('[data-mapping-value=reason]').selectOption('solution_content');
    let fields=JSON.parse(await layer().locator('[name=templateContent]').inputValue());
    check('固定值与系统字段修改同步模板内容',fields.find(f=>f.id==='application-type').value==='预付款'&&fields.find(f=>f.id==='reason').value==='$solution_content');
    await layer().locator('[name=departmentMode][value=selected]').check();
    await layer().locator('[name=department][value="fj-europe"]').check();
    const bj=layer().locator('[name=department][value^="bj-"]').first();await bj.check();
    await layer().locator('[name=company][value=bj]').uncheck();
    check('取消公司同时移除该公司的部门选项',await layer().locator('[name=department][value^="bj-"]').count()===0&&await layer().locator('[name=department][value=fj-europe]').isChecked());
    await layer().locator('[name=name]').fill('志远付款测试');await save();
    let state=await data(),record=state.zhiyuanTemplates[0],id=record.id;
    check('完整资料保存后是草稿且更多中可发布',await row(id).count()===1&&(await row(id).innerText()).includes('草稿')&&await row(id).locator('.dropdown-menu [data-action=publish]').count()===1&&!state.templates.some(r=>r.id===id)&&!record.published&&record.versions.length===0&&record.draft.departments.length===1&&record.draft.mappings.find(m=>m.id==='application-type').value==='预付款');
    await primary(id,'编辑');await shot('draft-list');await publish(id);
    check('列表发布草稿后变为已发布且更多中可停用', (await row(id).innerText()).includes('已发布')&&await row(id).locator('.dropdown-menu [data-action=disable]').count()===1&&(await data()).zhiyuanTemplates[0].versions.length===1);
    await primary(id,'查看');await shot('published-list');
    await page.reload();await edit(id);
    check('刷新后重新编辑保留公司部门、固定值及启用状态',await layer().locator('[name=name]').inputValue()==='志远付款测试'&&await layer().locator('[name=company]:checked').count()===1&&await layer().locator('[data-mapping-value="application-type"]').inputValue()==='预付款');
    const screenFields=[
      {id:'store',label:'店铺名称',type:'text',required:true,value:'$ticket_store'},
      {id:'reason',label:'申请原因',type:'textarea',required:true,value:'$solution_content'},
      {id:'application-type',label:'申请类型',type:'text',required:true,value:'店耗'},
      {id:'gift',label:'赠品品名',type:'textarea',required:true,value:'$exchange_names'},
      {id:'quantity',label:'数量',type:'textarea',required:true,value:'$exchange_quantities'},
      {id:'customer',label:'客户姓名',type:'text',required:true,value:'$ticket_customer'},
      {id:'member',label:'会员号',type:'text',required:true,value:'$ticket_member'}
    ];
    await layer().locator('[name=templateContent]').fill(JSON.stringify(screenFields,null,2));
    check('粘贴截图同类字段自动生成关联，固定值店耗正确回显',await layer().locator('[data-zhiyuan-field]').count()===7&&await layer().locator('[data-mapping-value=store]').inputValue()==='ticket_store'&&await layer().locator('[data-mapping-value="application-type"]').inputValue()==='店耗');
    await layer().locator('[data-zhiyuan-field=store]').scrollIntoViewIfNeeded();await shot('field-associations');
    await layer().locator('.ac-zhiyuan-mapping-section summary').click();
    check('字段关联可以收起',!await layer().locator('[data-zhiyuan-field=store]').isVisible());
    await layer().locator('.ac-zhiyuan-mapping-section summary').click();await save();
    check('编辑保存为待发布，原V1仍生效且不改原字段', (await row(id).innerText()).includes('待发布')&&(await row(id).innerText()).includes('V1 生效中')&&(await data()).zhiyuanTemplates.find(r=>r.id===id).versions.length===1&&JSON.parse((await data()).zhiyuanTemplates.find(r=>r.id===id).published.templateContent).length===10);
    await primary(id,'编辑');await shot('revision-list');await publish(id);
    check('发布修订后产生V2并保留V1', (await data()).zhiyuanTemplates.find(r=>r.id===id).versions.length===2&&(await row(id).innerText()).includes('已发布'));
    await row(id).locator('[data-mode=view]').click();
    check('查看志远模板只读且仍在抽屉',await layer().locator('[name=templateCode]').isDisabled()&&await layer().locator('[name=templateContent]').getAttribute('readonly')!==null&&await layer().locator('[data-zhiyuan-save]').count()===0);
    await close();await more(id,'versions');await layer().locator('[data-zhiyuan-version="1"]').click();
    check('历史版本可看原始10字段，后续修改不覆盖历史',await layer().locator('[data-zhiyuan-field]').count()===10);await close();await close();
    await edit(id);await layer().locator('[name=name]').fill('未保存更名');await close();
    check('未保存关闭有确认且取消后保留输入',(await layer().innerText()).includes('放弃未保存'));
    await close();check('取消放弃仍保留原输入',await layer().locator('[name=name]').inputValue()==='未保存更名');await close();await layer().locator('[data-ac-confirm]').click();await pause();
    await toggle(id,'disable');
    check('停用只改当前模板状态', (await row(id).innerText()).includes('已停用')&&(await data()).templates[0].disabled===false);
    await primary(id,'查看');await shot('disabled-list');await toggle(id,'enable');check('从更多启用原已发布版本，不新建版本',await row(id).locator('.dropdown-menu [data-action=disable]').count()===1&&(await data()).zhiyuanTemplates.find(r=>r.id===id).versions.length===2);
    await more(id,'copy');check('复制志远模板保留字段并显示保存草稿',await layer().locator('[data-zhiyuan-field]').count()===7&&(await layer().locator('[data-zhiyuan-save]').innerText())==='保存草稿');await layer().locator('[name=enabled]').uncheck();await save();
    let copied=(await data()).zhiyuanTemplates[0];check('副本保存仅产生独立草稿',copied.id!==id&&copied.provider==='zhiyuan'&&!copied.published);await publish(copied.id);
    check('发布时未勾选启用，列表显示已停用且更多中可启用',(await row(copied.id).innerText()).includes('已停用')&&await row(copied.id).locator('.dropdown-menu [data-action=enable]').count()===1);
    await create();await layer().locator('[name=templateContent]').fill('{invalid');
    check('内容格式异常提示且清空过期字段关联',await layer().locator('[data-zhiyuan-notice]').isVisible()&&await layer().locator('[data-zhiyuan-field]').count()===0);
    await layer().locator('[name=name]').fill('待完善模板');await layer().locator('[name=templateCode]').fill('');await save();
    const invalid=(await data()).zhiyuanTemplates[0];check('未完善资料可保存草稿，不伪造启用',invalid.draft.templateContent==='{invalid'&&!invalid.published&&(await row(invalid.id).innerText()).includes('草稿'));
    await more(invalid.id,'delete');await layer().locator('[data-ac-confirm]').click();await pause();
    check('删除草稿移除该条记录',!(await data()).zhiyuanTemplates.some(r=>r.id===invalid.id));
    await page.locator('[data-ac-search] [name=q]').fill('志远付款测试');await page.locator('[data-ac-search] [type=submit]').click();
    check('关键词搜索覆盖两类模板',await page.locator('[data-template-id]').count()===2);
    await page.locator('[data-ac=reset]').click();await page.locator('[data-ac-search] [name=provider]').selectOption('zhiyuan');await page.locator('[data-ac-search] [name=q]').fill('ZY-PAY-001');await page.locator('[data-ac-search] [type=submit]').click();
    check('模板类型和志远编号可以组合搜索',await page.locator('[data-template-id]').count()===2);await page.reload();
    check('刷新保留模板类型和编号筛选',await page.locator('[name=provider]').inputValue()==='zhiyuan'&&await page.locator('[name=q]').inputValue()==='ZY-PAY-001');
    await page.locator('[data-ac=reset]').click();await page.locator('[data-ac-search] [name=status]').selectOption('已停用');await page.locator('[data-ac-search] [type=submit]').click();
    check('停用筛选与重置正常',await page.locator('[data-template-id]').count()===1&&await row(copied.id).count()===1);await page.locator('[data-ac=reset]').click();
    await page.locator('[data-tab=people]').click();await page.locator('[data-ac=person-new]').click();
    check('原审批人员抽屉仍可使用',await layer().locator('[name=duty] option').count()===16);await close();await page.locator('[data-tab=templates]').click();
    for(const width of [1440,1024,768,390]){
      await page.setViewportSize({width,height:1000});await pause();
      const table=await page.evaluate(()=>{const table=document.querySelector('.ac-table-wrap'),action=table.querySelector('tbody tr td:last-child'),tab=document.querySelector('.ac-tabs .tab-item');return {page:document.documentElement.scrollWidth,action:action.getBoundingClientRect().width,position:getComputedStyle(action).position,overflow:table.scrollWidth>table.clientWidth,tabHeight:tab.getBoundingClientRect().height};});
      check(width+'列表仅内部滚动且操作列定宽',table.page<=width+1&&Math.abs(table.action-128)<2&&table.position==='sticky'&&(width>=1440||table.overflow));
      await create();await layer().locator('[data-zhiyuan-field=amount]').scrollIntoViewIfNeeded();await pause();
      const metrics=await layer().evaluate(el=>{const body=el.querySelector('.modal-body'),table=el.querySelector('.ac-zhiyuan-table'),r=table.getBoundingClientRect();return {body:body.clientWidth,scroll:body.scrollWidth,right:r.right,width:innerWidth,controls:[...table.querySelectorAll('input,select')].every(x=>{const a=x.getBoundingClientRect(),b=x.closest('td').getBoundingClientRect();return a.left>=b.left&&a.right<=b.right;})};});
      check(width+'抽屉字段表及控件没有裁切或横向溢出',metrics.scroll<=metrics.body+1&&metrics.right<=metrics.width&&metrics.controls);
      if(width===1024||width===390)await shot('mapping-'+width);await close();
    }
    await page.setViewportSize({width:1440,height:1000});await shot('template-list');
    await page.goto(base+'admin/approval-template-edit.html?id=template-0');await page.locator('[data-ac=applicant]').click();await layer().locator('[data-field=name]').fill('系统模板回归');await layer().locator('[data-applicant-save]').click();await page.locator('[data-ac=save]').click();
    check('原系统模板保存草稿正常且不改志远配置',(await data()).templates.find(r=>r.id==='template-0').draft.name==='系统模板回归'&&(await data()).zhiyuanTemplates.find(r=>r.id===id).published.templateContent.includes('店铺名称'));
    await page.goto(base+'admin/approval-config.html');
    check('系统模板修订草稿同样显示待发布且更多中可发布',(await row('template-0').innerText()).includes('待发布')&&await row('template-0').locator('.dropdown-menu [data-action=publish]').count()===1);await publish('template-0');
    check('系统模板可从列表更多发布新版本',(await data()).templates.find(r=>r.id==='template-0').versions.length===2);
    await toggle('template-0','disable');check('系统模板停用后更多中可启用',await row('template-0').locator('.dropdown-menu [data-action=enable]').count()===1);await toggle('template-0','enable');
    check('系统模板启用保留原版本与配置',!(await data()).templates.find(r=>r.id==='template-0').disabled&&(await data()).templates.find(r=>r.id==='template-0').versions.length===2);
    await page.goto(base+'admin/approval-template-edit.html?id='+id);await page.waitForURL('**/approval-config.html?zhiyuan=*');
    check('志远记录即使误用内部编辑链接也回到志远抽屉',await layer().locator('[name=templateCode]').count()===1);await close();
    await page.goto('file://'+path.join(root,'admin/approval-config.html'));await create();
    check('本地HTML直接打开可配置并保存志远模板',await layer().locator('[data-zhiyuan-field]').count()===10);await save();
    check('全部被测页面脚本异常为0',errors.length===0);
    fs.writeFileSync(path.join(out,'browser-result.json'),JSON.stringify({passed:checks.length,checks,errors},null,2));
  }catch(error){await page.screenshot({path:path.join(out,'failure.png')});fs.writeFileSync(path.join(out,'browser-failure.json'),JSON.stringify({message:error.message,checks,errors},null,2));throw error;}
  finally{await browser.close();}
})();
